import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import UserProfileForm from "@/components/user-management/user-profile-form";
import OrganizationSettings from "@/components/user-management/organization-settings";
import RoleManagement from "@/components/user-management/role-management";
import UserList from "@/components/user-management/user-list";
import { Building2, Lock, Settings, User, Users } from "lucide-react";
import DashboardWrapper from "../dashboard-wrapper";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // In a real app, you would fetch the user's profile and check their role
  // to determine what settings they can access
  const isAdmin = true;

  // Fetch company settings to determine if setup is needed
  const { data: settings, error: settingsError } = await supabase
    .from("company_settings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const needsSetup = !settings;

  return (
    <DashboardWrapper needsSetup={needsSetup}>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <header>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, organization, and user settings
          </p>
        </header>

        {/* Settings Tabs */}
        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="organization"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              <span>Organization</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Roles</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <UserProfileForm user={user} />
          </TabsContent>

          <TabsContent value="organization" className="space-y-6">
            <OrganizationSettings initialUser={user} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserList />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="roles" className="space-y-6">
              <RoleManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
