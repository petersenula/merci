"use client";

import { useEffect, useState } from "react";

export default function HeroParallaxBackground() {
  const [offsetY, setOffsetY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 1. Проверяем мобильное устройство
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // 2. Если мобильное — НЕ включаем параллакс
    if (window.innerWidth < 768) {
      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    }

    const onScroll = () => {
      setOffsetY(window.scrollY * 0.25);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 hidden md:block"
      style={{
        transform: isMobile ? "none" : `translateY(-${offsetY}px)`,
      }}
    >
    <div
      className="w-full h-[120%] bg-center bg-cover"
        style={{
          backgroundImage: "url('/images/hero/hero-bg-gray.svg')",
        }}
      />
    </div>
  );
}
