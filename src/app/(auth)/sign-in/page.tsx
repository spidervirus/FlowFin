"use client";

import { SignInForm } from "./sign-in-form";
import { Message } from "@/components/form-message";

type SignInProps = {
  searchParams?: {
    message?: string;
    error?: string;
    redirect?: string;
  };
};

export default function SignIn({ searchParams }: SignInProps) {
  const formMessage: Message = searchParams?.error 
    ? { error: searchParams.error }
    : searchParams?.message 
    ? { message: searchParams.message }
    : { message: "" };

  return (
    <div className="flex flex-col items-center justify-center bg-background px-4 py-16 mt-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <SignInForm searchParams={formMessage} />
      </div>
    </div>
  );
}

