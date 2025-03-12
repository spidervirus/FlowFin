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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Save } from "lucide-react";

export default function OrganizationSettings() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Sample organization data - in a real app, this would come from the database
  const [formData, setFormData] = useState({
    name: "Acme Corporation",
    industry: "technology",
    size: "medium",
    address: "123 Business Ave, Suite 100, San Francisco, CA 94107",
    phone: "+1 (555) 123-4567",
    website: "https://acmecorp.example.com",
    taxId: "12-3456789",
    fiscalYear: "january",
    logo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, this would save to the database
      console.log("Organization data saved:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success notification would go here
    } catch (error) {
      console.error("Error saving organization settings:", error);
      // Error notification would go here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Manage your company information and preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleSelectChange("industry", value)}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="services">
                    Professional Services
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => handleSelectChange("size", value)}
              >
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (1-50 employees)</SelectItem>
                  <SelectItem value="medium">
                    Medium (51-250 employees)
                  </SelectItem>
                  <SelectItem value="large">
                    Large (251-1000 employees)
                  </SelectItem>
                  <SelectItem value="enterprise">
                    Enterprise (1000+ employees)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Company phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Company website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / EIN</Label>
              <Input
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="Tax identification number"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Company address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
              <Select
                value={formData.fiscalYear}
                onValueChange={(value) =>
                  handleSelectChange("fiscalYear", value)
                }
              >
                <SelectTrigger id="fiscalYear">
                  <SelectValue placeholder="Select fiscal year start" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="january">January</SelectItem>
                  <SelectItem value="february">February</SelectItem>
                  <SelectItem value="march">March</SelectItem>
                  <SelectItem value="april">April</SelectItem>
                  <SelectItem value="may">May</SelectItem>
                  <SelectItem value="june">June</SelectItem>
                  <SelectItem value="july">July</SelectItem>
                  <SelectItem value="august">August</SelectItem>
                  <SelectItem value="september">September</SelectItem>
                  <SelectItem value="october">October</SelectItem>
                  <SelectItem value="november">November</SelectItem>
                  <SelectItem value="december">December</SelectItem>
                </SelectContent>
              </Select>
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
                  Save Organization Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
