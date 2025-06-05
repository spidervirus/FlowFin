"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import DashboardWrapper from "../../dashboard-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

type ChartOfAccount = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

const accountSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"], {
    required_error: "Account type is required",
  }),
  description: z.string().optional(),
  is_active: z.boolean(),
  parent_id: z.string().optional(),
});

type AccountForm = z.infer<typeof accountSchema>;

export default function AccountPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<ChartOfAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "asset",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    async function fetchAccount() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please sign in to view this account");
          router.push("/auth/signin");
          return;
        }

        const { data, error } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (!data) {
          toast.error("Account not found");
          router.push("/dashboard/chart-of-accounts");
          return;
        }

        // Validate and transform account type
        const validTypes = ["asset", "liability", "equity", "revenue", "expense"] as const;
        type AccountTypeEnum = typeof validTypes[number];

        let validatedAccountType: AccountTypeEnum = "asset"; // Default value
        if (data.type && validTypes.includes(data.type as any)) {
          validatedAccountType = data.type as AccountTypeEnum;
        }

        const transformedData: ChartOfAccount = {
          ...data,
          type: validatedAccountType, // Use the validated and strictly typed value
          description: data.description ?? "", // Default to empty string if null
          parent_id: data.parent_id ?? undefined, // Default to undefined if null, matching schema
          is_active: data.is_active ?? true, // Default to true if null
          // Ensure created_at and updated_at match ChartOfAccount type (assuming string, not null)
          created_at: data.created_at ?? "",
          updated_at: data.updated_at ?? "",
          // If 'currency' is part of ChartOfAccount and can be null from DB, handle it:
          // currency: data.currency ?? undefined, // or a default currency string
        };
        setAccount(transformedData);
        form.reset({
          code: transformedData.code,
          name: transformedData.name,
          type: validatedAccountType, // Use the validated and strictly typed value here as well
          description: transformedData.description, // Now string
          is_active: transformedData.is_active, // Now boolean
          parent_id: transformedData.parent_id, // Now string | undefined
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading account");
      } finally {
        setLoading(false);
      }
    }

    fetchAccount();
  }, [params.id, router, form]);

  const onSubmit = async (data: AccountForm) => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to update this account");
        return;
      }

      // Check if account code already exists (excluding current account)
      const { data: existingAccount, error: checkError } = await supabase
        .from("chart_of_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("code", data.code)
        .neq("id", params.id)
        .single();

      if (existingAccount) {
        toast.error("Account code already exists");
        return;
      }

      const { error } = await supabase
        .from("chart_of_accounts")
        .update({
          code: data.code,
          name: data.name,
          type: data.type,
          description: data.description,
          is_active: data.is_active,
          parent_id: data.parent_id,
        })
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Account updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error updating account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to delete this account");
        return;
      }

      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Account deleted successfully");
      router.push("/dashboard/chart-of-accounts");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error deleting account");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/chart-of-accounts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{account?.name}</h1>
              <p className="text-sm text-muted-foreground">
                Account Code: {account?.code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)}>Edit Account</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this account? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  View and manage account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter account code"
                            {...field}
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormDescription>
                          A unique code to identify this account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter account name"
                            {...field}
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of account determines how it functions in your
                        accounting system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter account description"
                          {...field}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description to provide more details about this
                        account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Account
                        </FormLabel>
                        <FormDescription>
                          Inactive accounts won't appear in dropdowns and
                          reports
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </DashboardWrapper>
  );
}
