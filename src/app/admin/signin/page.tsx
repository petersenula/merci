"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function AdminSignInPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 👇 ждём, пока сессия точно появится
    await supabase.auth.getSession();

    router.push("/admin/manual-ledger-import");
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white p-6 rounded shadow text-black space-y-4">
      <h1 className="text-xl font-bold">Admin Sign In</h1>

      <input
        type="email"
        placeholder="Email"
        className="border px-3 py-2 w-full rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border px-3 py-2 w-full rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        onClick={signIn}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Signing in..." : "Sign in as admin"}
      </button>
    </div>
  );
}
