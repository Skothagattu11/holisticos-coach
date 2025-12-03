import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, UserWithRole } from "@/lib/services/authService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Shield, UserCog, User, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: {
    label: "Admin",
    color: "bg-destructive/10 text-destructive",
    icon: Shield,
  },
  coach: {
    label: "Coach",
    color: "bg-primary/10 text-primary",
    icon: UserCog,
  },
  client: {
    label: "Client",
    color: "bg-secondary text-secondary-foreground",
    icon: User,
  },
};

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("client");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => authService.getAllUsers(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      await authService.updateUserRole(userId, role);
      // If promoting to coach, create expert profile
      if (role === "coach") {
        const user = users.find(u => u.id === userId);
        if (user) {
          await authService.createCoachProfile(userId, user.name || user.email.split("@")[0], user.email);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      toast.success("User role updated successfully");
      setRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  const handleOpenRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleCounts = () => {
    const counts: Record<UserRole, number> = { admin: 0, coach: 0, client: 0 };
    users.forEach(user => {
      counts[user.role] = (counts[user.role] || 0) + 1;
    });
    return counts;
  };

  const roleCounts = getRoleCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Failed to load users</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">
            View all users and manage their roles
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, config]) => {
          const Icon = config.icon;
          return (
            <Card key={role}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}s
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleCounts[role]}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Click on a user to change their role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role];
                    const RoleIcon = roleConfig.icon;

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.name || user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{user.name || user.email.split("@")[0]}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", roleConfig.color)}>
                            <RoleIcon className="h-3 w-3" />
                            {roleConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.lastSignInAt)}
                        </TableCell>
                        <TableCell>
                          {user.emailConfirmed ? (
                            <Badge variant="outline" className="gap-1 text-success border-success/30">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRoleDialog(user)}
                          >
                            Change Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select New Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {newRole === "coach" && selectedUser?.role !== "coach" && (
              <div className="p-3 bg-primary/10 rounded-lg text-sm">
                <p className="font-medium text-primary">Note:</p>
                <p className="text-muted-foreground">
                  Promoting to Coach will also create an expert profile for this user.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
