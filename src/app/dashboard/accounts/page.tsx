import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Edit, Trash, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function AccountsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch accounts from the database
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching accounts:", error);
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              Error loading accounts. Please try again later.
            </div>
          </div>
        </main>
      </>
    );
  }

  // Calculate total assets and liabilities
  const assets = accounts
    .filter((a) =>
      ["checking", "savings", "investment", "cash"].includes(a.type),
    )
    .reduce((sum, a) => sum + a.balance, 0);

  const liabilities = accounts
    .filter((a) => ["credit"].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0);

  const netWorth = assets - liabilities;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Accounts</h1>
              <p className="text-muted-foreground">
                Manage your financial accounts and track balances
              </p>
            </div>
            <Link href="/dashboard/accounts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Account
              </Button>
            </Link>
          </header>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Assets
                </div>
                <div className="text-2xl font-bold mt-2 text-green-600">
                  {formatCurrency(assets)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Across{" "}
                  {
                    accounts.filter((a) =>
                      ["checking", "savings", "investment", "cash"].includes(
                        a.type,
                      ),
                    ).length
                  }{" "}
                  accounts
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Liabilities
                </div>
                <div className="text-2xl font-bold mt-2 text-red-600">
                  {formatCurrency(liabilities)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Across{" "}
                  {accounts.filter((a) => ["credit"].includes(a.type)).length}{" "}
                  accounts
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Net Worth
                </div>
                <div
                  className={`text-2xl font-bold mt-2 ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(netWorth)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Assets minus Liabilities
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search accounts..." className="pl-10" />
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Accounts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Link key={account.id} href={`/dashboard/accounts/${account.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{account.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {account.type}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div
                        className={`text-xl font-bold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                      {account.institution && (
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {account.institution}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
