"use client";

import { createInvite, deleteInvite, getInvites, type PendingInvite } from "@/lib/invites";
import { getUsers } from "@/lib/users";
import { useAuth } from "@/contexts/AuthContext";
import type { AppUser, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UsersSettingsPage() {
  const { isOwner } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("family");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOwner) {
      router.push("/dashboard");
      return;
    }
    Promise.all([getUsers(), getInvites()]).then(([u, i]) => {
      setUsers(u);
      setInvites(i);
    });
  }, [isOwner, router]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createInvite(email, role);

      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        toast.warning(`Invite created for ${email}, but the email could not be sent.`);
      } else {
        toast.success(`Invite sent to ${email}`);
      }

      setEmail("");
      const updated = await getInvites();
      setInvites(updated);
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string, inviteEmail: string) {
    if (!confirm(`Revoke invite for ${inviteEmail}?`)) return;
    try {
      await deleteInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    }
  }

  if (!isOwner) return null;

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Invite family members by email. They will get the assigned role automatically when they sign
        in for the first time.
      </p>

      <h2 className="text-lg font-semibold mb-3">Members</h2>
      {users.length === 0 ? (
        <p className="text-muted-foreground text-sm mb-8">No users found.</p>
      ) : (
        <div className="space-y-2 mb-8">
          {users
            .sort((a, b) => {
              if (a.role === "owner" && b.role !== "owner") return -1;
              if (a.role !== "owner" && b.role === "owner") return 1;
              return (a.displayName ?? a.email).localeCompare(b.displayName ?? b.email);
            })
            .map((u) => (
              <div
                key={u.uid}
                className="flex items-center justify-between bg-white rounded-2xl p-3 border border-cream-200 shadow-sm"
              >
                <div>
                  {u.displayName && <p className="text-sm font-medium">{u.displayName}</p>}
                  <p className={u.displayName ? "text-xs text-muted-foreground" : "text-sm font-medium"}>
                    {u.email}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={u.role === "owner" ? "bg-sage-100 text-sage-700" : ""}
                >
                  {u.role}
                </Badge>
              </div>
            ))}
        </div>
      )}

      <Separator className="mb-8" />

      <form onSubmit={handleInvite} className="space-y-4 mb-10">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="family">Family (can create &amp; edit)</SelectItem>
              <SelectItem value="owner">Owner (full access)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="bg-sage-600 hover:bg-sage-700" disabled={saving}>
          <UserPlus className="mr-2 h-4 w-4" />
          {saving ? "Creating…" : "Create invite"}
        </Button>
      </form>

      <h2 className="text-lg font-semibold mb-3">Pending invites</h2>
      {invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending invites.</p>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between bg-white rounded-2xl p-3 border border-cream-200 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium">{invite.email}</p>
                <Badge variant="secondary" className="text-xs mt-1 bg-sage-100 text-sage-700">
                  {invite.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleRevoke(invite.id, invite.email)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
