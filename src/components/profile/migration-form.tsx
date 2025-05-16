"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface MigrationFormProps {
  userId: string;
  email: string;
  fullName: string;
  onMigrate: (
    formData: FormData,
  ) => Promise<{ success: boolean; message: string }>;
}

export function MigrationForm({
  userId,
  email,
  fullName,
  onMigrate,
}: MigrationFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("email", email);
      formData.append("fullName", fullName);

      const result = await onMigrate(formData);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="email" value={email || ""} />
      <input type="hidden" name="fullName" value={fullName || ""} />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Migrating..." : "Migrate to Supabase Auth System"}
      </Button>
    </form>
  );
}
