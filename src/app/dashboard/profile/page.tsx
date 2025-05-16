import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/profile/profile-form";
import { getUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

async function getProfileInfo(userId: string) {
  const supabase = createServiceRoleClient();

  // Check for the user in auth.users
  const { data: authUser, error: authError } = await supabase
    .from("auth.users")
    .select("id, email, created_at")
    .eq("id", userId)
    .single();

  if (authError) {
    console.log("Error fetching auth user:", authError);
  }

  // Check for the user in the profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.log("Error fetching profile:", profileError);
  }

  // Check for the user in the backup table
  const { data: backupUser, error: backupError } = await supabase
    .from("user_profiles_backup")
    .select("*")
    .eq("id", userId)
    .single();

  if (backupError && backupError.code !== "PGRST116") {
    console.log("Error fetching backup user:", backupError);
  }

  // Check for the user in the manual registry
  const { data: manualUser, error: manualError } = await supabase
    .from("manual_user_registry")
    .select("id, email, full_name, created_at")
    .eq("id", userId)
    .single();

  if (manualError && manualError.code !== "PGRST116") {
    console.log("Error fetching manual user:", manualError);
  }

  // Determine registration method
  let regMethod = "Unknown";
  if (authUser) {
    regMethod = "Supabase Auth";
  } else if (manualUser) {
    regMethod = "Manual Registry";
  } else if (profile || backupUser) {
    regMethod = "Profile Only";
  }

  return {
    authUser,
    mainUser: profile, // Use the profile from profiles table
    backupUser,
    manualUser,
    regMethod,
  };
}

async function migrateToAuthSystem(formData: FormData) {
  "use server";

  const userId = formData.get("userId") as string;
  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;

  const supabase = createServiceRoleClient();

  // Migrate from manual registry to Supabase Auth
  const { data, error } = await supabase.rpc("migrate_user_to_auth_system", {
    p_user_id: userId,
    p_email: email,
    p_full_name: fullName,
  });

  if (error) {
    console.error("Error migrating user to auth system:", error);
  } else {
    console.log("Migration result:", data);
  }

  // Revalidate the path to refresh the page
  revalidatePath("/dashboard/profile");
}

async function migrateUserProfile(formData: FormData) {
  "use server";

  const userId = formData.get("userId") as string;

  const supabase = createServiceRoleClient();

  // Try migrating from backup to main table
  const { data, error } = await supabase.rpc("migrate_user_from_backup", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error migrating user profile:", error);
  } else {
    console.log("Migration result:", data);
  }

  // Revalidate the path to refresh the page
  revalidatePath("/dashboard/profile");
}

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileInfo = await getProfileInfo(user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and account settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileForm
            user={user}
            mainUser={profileInfo.mainUser}
            backupUser={profileInfo.backupUser}
          />
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View your account details and registration method.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">User ID</h3>
                  <p className="text-sm text-muted-foreground">{user.id}</p>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <h3 className="font-medium">Registration Method</h3>
                  <p className="text-sm text-muted-foreground">
                    {profileInfo.regMethod}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Created At</h3>
                  <p className="text-sm text-muted-foreground">
                    {profileInfo.authUser?.created_at
                      ? new Date(
                          profileInfo.authUser.created_at,
                        ).toLocaleString()
                      : profileInfo.manualUser?.created_at
                        ? new Date(
                            profileInfo.manualUser.created_at,
                          ).toLocaleString()
                        : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Migration</CardTitle>
              <CardDescription>
                Advanced options for account data migration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Database Records Status</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Auth System Record:</div>
                    <div>
                      {profileInfo.authUser ? "✅ Present" : "❌ Missing"}
                    </div>

                    <div>Main Profile Record:</div>
                    <div>
                      {profileInfo.mainUser ? "✅ Present" : "❌ Missing"}
                    </div>

                    <div>Backup Profile Record:</div>
                    <div>
                      {profileInfo.backupUser ? "✅ Present" : "❌ Missing"}
                    </div>

                    <div>Manual Registry Record:</div>
                    <div>
                      {profileInfo.manualUser ? "✅ Present" : "❌ Missing"}
                    </div>
                  </div>
                </div>

                {/* Migration options */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Migration Options</h3>

                  {profileInfo.backupUser && !profileInfo.mainUser && (
                    <form action={migrateUserProfile} className="mb-4">
                      <input type="hidden" name="userId" value={user.id} />
                      <Button type="submit" className="w-full">
                        Migrate Profile from Backup to Main Table
                      </Button>
                    </form>
                  )}

                  {profileInfo.manualUser && !profileInfo.authUser && (
                    <form action={migrateToAuthSystem} className="mb-4">
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        type="hidden"
                        name="email"
                        value={user.email || ""}
                      />
                      <input
                        type="hidden"
                        name="fullName"
                        value={user.user_metadata?.full_name || ""}
                      />
                      <Button type="submit" className="w-full">
                        Migrate to Supabase Auth System
                      </Button>
                    </form>
                  )}

                  {!profileInfo.backupUser && !profileInfo.mainUser && (
                    <div className="text-sm text-muted-foreground">
                      No migration options available for your account.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                These advanced options help resolve issues with your account
                data. Only use if you're experiencing problems with your
                account.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
