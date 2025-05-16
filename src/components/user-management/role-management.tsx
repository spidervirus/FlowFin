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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Edit, Loader2, Plus, Save, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export default function RoleManagement() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Sample roles and permissions - in a real app, these would come from the database
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Administrator",
      description: "Full system access",
      permissions: [
        "users:read",
        "users:write",
        "finance:read",
        "finance:write",
        "reports:read",
        "reports:write",
      ],
    },
    {
      id: "2",
      name: "Finance Manager",
      description: "Manage financial data",
      permissions: ["finance:read", "finance:write", "reports:read"],
    },
    {
      id: "3",
      name: "Accountant",
      description: "View and edit financial data",
      permissions: ["finance:read", "finance:write"],
    },
    {
      id: "4",
      name: "Viewer",
      description: "View-only access",
      permissions: ["finance:read", "reports:read"],
    },
  ]);

  const permissions: Permission[] = [
    {
      id: "users:read",
      name: "View Users",
      description: "Can view user information",
    },
    {
      id: "users:write",
      name: "Manage Users",
      description: "Can create, edit, and delete users",
    },
    {
      id: "finance:read",
      name: "View Financial Data",
      description: "Can view transactions, invoices, and reports",
    },
    {
      id: "finance:write",
      name: "Manage Financial Data",
      description: "Can create and edit transactions and invoices",
    },
    {
      id: "reports:read",
      name: "View Reports",
      description: "Can view financial reports",
    },
    {
      id: "reports:write",
      name: "Create Reports",
      description: "Can create and customize reports",
    },
  ];

  const [formData, setFormData] = useState<Role>({
    id: "",
    name: "",
    description: "",
    permissions: [],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => {
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId];

      return { ...prev, permissions: newPermissions };
    });
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData(role);
    setIsDialogOpen(true);
  };

  const handleAddNewRole = () => {
    setEditingRole(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      permissions: [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, this would save to the database
      if (editingRole) {
        // Update existing role
        setRoles((prev) =>
          prev.map((role) =>
            role.id === editingRole.id ? { ...formData, id: role.id } : role,
          ),
        );
      } else {
        // Add new role
        const newRole = {
          ...formData,
          id: Date.now().toString(), // Generate a temporary ID
        };
        setRoles((prev) => [...prev, newRole]);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving role:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    // In a real app, this would delete from the database
    setRoles((prev) => prev.filter((role) => role.id !== roleId));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              Define roles and permissions for users
            </CardDescription>
          </div>
          <Button onClick={handleAddNewRole}>
            <Plus className="mr-2 h-4 w-4" /> Add Role
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permId) => {
                        const perm = permissions.find((p) => p.id === permId);
                        return perm ? (
                          <span
                            key={permId}
                            className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                          >
                            {perm.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role details and permissions"
                : "Define a new role with specific permissions"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Finance Manager"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this role"
                />
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="border rounded-md p-4 space-y-4">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-2"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() =>
                          handlePermissionToggle(permission.id)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Role
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
