"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";

interface UserProfileFormProps {
  user: any;
  userProfile?: {
    full_name?: string;
    avatar_url?: string;
    job_title?: string;
    phone?: string;
    department?: string;
  };
}

export default function UserProfileForm({
  user,
  userProfile,
}: UserProfileFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const { session, user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || user?.user_metadata?.full_name || "",
    avatar_url: userProfile?.avatar_url || "",
    email: user?.email || "",
    job_title: userProfile?.job_title || "",
    phone: userProfile?.phone || "",
    department: userProfile?.department || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!session?.user) {
        toast.error("Please sign in to update your profile");
        return;
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: formData.full_name },
      });

      if (authError) {
        toast.error("Failed to update profile metadata");
        throw authError;
      }

      // Update profile in database
      const { error: profileError } = await supabase.from("user_profiles").upsert({
        id: session.user.id,
        user_id: session.user.id,
        email: session.user.email,
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        job_title: formData.job_title,
        phone: formData.phone,
        department: formData.department,
        role: "user",
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        toast.error("Failed to update profile data");
        throw profileError;
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <p className="text-muted-foreground">
              Please sign in to view and update your profile.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    formData.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`
                  }
                />
                <AvatarFallback>
                  {getInitials(formData.full_name || "User")}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" /> Change Photo
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="Your position"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your contact number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Your department"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
