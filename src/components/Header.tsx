'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import Button from '@/components/ui/button';
import { useT } from '@/lib/translation';
import { ChevronDown, UserCircle } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Lang = 'en' | 'de' | 'fr' | 'it';

export default function Header() {
  const pathname = usePathname();

    // ⛔️ Admin-зона — без Header
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  
  const hideHeader =
    pathname?.startsWith("/t/") ||
    pathname?.startsWith("/c/");

  if (hideHeader) {
    return null;
  }
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { lang, setLang, t } = useT();
  const [userRole, setUserRole] = useState<"earner" | "employer" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const getUserRole = async (userId: string) => {
      // Проверяем Earner
      const { data: earner } = await supabase
        .from("profiles_earner")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (earner) {
        setUserRole("earner");
        return;
      }

      // Проверяем Employer
      const { data: employer } = await supabase
        .from("employers")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (employer) {
        setUserRole("employer");
        return;
      }

      setUserRole(null);
    };

    // 1️⃣ Проверка при маунте
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        getUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    // 2️⃣ Подписка на изменения auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);

      if (session?.user) {
        getUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    // 3️⃣ cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLangChange = async (value: Lang) => {
    setLang(value);
    localStorage.setItem('lang', value);
    document.documentElement.lang = value;

    const { data: { session }} = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles_earner')
        .update({ lang: value })
        .eq('id', session.user.id);
    }

    setShowLangMenu(false);
    router.refresh();
  };

  const handleLogout = async () => {
    try {
      // 1️⃣ Локально чистим всё
      localStorage.clear();
      sessionStorage.clear();

      // 2️⃣ Говорим UI, что пользователь вышел
      setIsLoggedIn(false);
      setUserRole(null);

      // 3️⃣ Переходим на главную СРАЗУ
      router.push('/');

      // 4️⃣ Асинхронно говорим Supabase (если получится — хорошо)
      supabase.auth.signOut().catch(() => {
        // намеренно игнорируем ошибки
      });

    } catch (e) {
      // fallback — всё равно выходим
      router.push('/');
    }
  };
  
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gray-100 shadow-md px-6 py-3 flex items-center justify-between">
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src="/images/logo.png"
          alt="Click4Tip logo"
          width={160}
          height={40}
          className="h-8 w-auto sm:h-10"
          priority
        />
      </div>
      <nav className="flex items-center space-x-4 relative">

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(prev => !prev)}
            className="flex items-center gap-1 border rounded px-3 py-1 text-sm bg-white hover:bg-gray-50 transition"
          >
            {lang.toUpperCase()}
            <ChevronDown size={16} className="opacity-70" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-md z-20 flex flex-col text-sm">
              {(['en','de','fr','it'] as Lang[])
                .filter(l => l !== lang)
                .map(l => (
                  <button
                    key={l}
                    onClick={() => handleLangChange(l)}
                    className="px-3 py-2 text-left hover:bg-gray-100 transition"
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Auth */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3">

            {/* Профиль ICON */}
            <button
              onClick={() => {
                if (userRole === "earner") router.push("/earners/profile");
                else if (userRole === "employer") router.push("/employers/profile");
              }}
              className="p-1 hover:opacity-80 transition"
            >
                <UserCircle
                  size={28}
                  strokeWidth={1.5}     // ✔ более тонкие линии
                  className="text-slate-600"  // ✔ мягкий серый
                />
            </button>
            <Button variant="orange" onClick={handleLogout}>
              {t("logout")}
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="green"
              onClick={() => router.push("/signin")}
            >
              {t("login")}
            </Button>

            <Button
              variant="green"
              onClick={() => router.push("/signup")}
            >
              {t("register")}
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
