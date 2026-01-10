'use client';

import { useState } from "react";
import { useT } from "@/lib/translation";   // ← добавили
import EarnerSignupForm from "@/components/auth/EarnerSignupForm";
import EmployerSignupForm from "@/components/auth/EmployerSignupForm";
import Button from '@/components/ui/button';
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get("role");
  const [role, setRole] = useState<"earner" | "employer">(
    roleFromUrl === "employer" ? "employer" : "earner"
  );
  const [signupCompleted, setSignupCompleted] = useState(false);

  useEffect(() => {
    if (roleFromUrl === "employer") {
      setRole("employer");
    }
    if (roleFromUrl === "earner") {
      setRole("earner");
    }
  }, [roleFromUrl]);

  const { t } = useT();  // ← добавили

  return (
    <div className="min-h-screen flex justify-center bg-gray-100 py-10">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6"> 
        {!signupCompleted && (
          <>
            <h1 className="text-xl font-semibold text-center mb-6">
              {t("signup_title")}
            </h1>

            <div className="flex mb-6 rounded-lg overflow-hidden border border-gray-300">
              <Button
                onClick={() => setRole('earner')}
                variant={role === 'earner' ? 'green' : 'outline'}
                className="flex-1 py-2 text-center font-medium rounded-none"
              >
                {t('workerOption')}
              </Button>

              <Button
                onClick={() => setRole('employer')}
                variant={role === 'employer' ? 'green' : 'outline'}
                className="flex-1 py-2 text-center font-medium rounded-none"
              >
                {t('employerOption')}
              </Button>
            </div>
          </>
        )}
        {/* Render selected form */}
        {role === "earner" && (
          <EarnerSignupForm onSignupSuccess={() => setSignupCompleted(true)} />
        )}

        {role === "employer" && (
          <EmployerSignupForm onSignupSuccess={() => setSignupCompleted(true)} />
        )}
      </div>
    </div>
  );
}
