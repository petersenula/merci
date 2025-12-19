'use client';

import UniversalSignin from "@/components/auth/UniversalSignin";

export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <UniversalSignin />
      </div>
    </div>
  );
}
