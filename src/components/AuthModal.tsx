'use client';

import { useState, useEffect } from "react";
import EarnerSignupForm from "@/components/auth/EarnerSignupForm";
import EmployerSignupForm from "@/components/auth/EmployerSignupForm";
import UniversalSignin from "@/components/auth/UniversalSignin";
import { X } from "lucide-react";

export default function AuthModal({
  open,
  onClose,
  initialMode
}: {
  open: boolean;
  onClose: () => void;
  initialMode: "signup" | "signin";
}) {
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [role, setRole] = useState<"earner" | "employer">("earner");

  // Обновляем режим при каждом открытии модалки
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md p-4 shadow-xl relative max-h-[90vh] overflow-y-auto">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={22} />
        </button>

        {/* Mode title */}
        <h2 className="text-xl font-semibold mb-4 text-center">
          {mode === "signup" ? "Sign up" : "Sign in"}
        </h2>

        {/* WORKER / EMPLOYER TABS (only for SIGNUP) */}
        {mode === "signup" && (
          <div className="flex mb-6">
            <button
              onClick={() => setRole("earner")}
              className={`flex-1 py-2 text-center font-medium rounded-t-md ${
                role === "earner"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              Worker
            </button>

            <button
              onClick={() => setRole("employer")}
              className={`flex-1 py-2 text-center font-medium rounded-t-md ${
                role === "employer"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              Employer
            </button>
          </div>
        )}

        {/* CONTENT */}
        {mode === "signup" && role === "earner" && <EarnerSignupForm />}
        {mode === "signup" && role === "employer" && <EmployerSignupForm />}

        {/* Универсальный SIGN IN (вкладки не нужны) */}
        {mode === "signin" && (
          <UniversalSignin onCancel={onClose} />
        )}

      </div>
    </div>
  );
}
