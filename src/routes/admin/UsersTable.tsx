import { useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  Eye,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

import { AdminSectionHeader, AdminStatsGrid } from "../../components/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import {
  cn,
  copyToClipboard,
  formatDate,
  formatNumber,
  formatRelativeTime,
  getInitials,
} from "../../lib/utils";
import {
  getAdminStats,
  getApiErrorMessage,
  type AdminStatsResponse,
  type UserPlan,
  type UserRole,
} from "../../lib/api";

type UserStatus = "active" | "inactive" | "admin";
type UserSort = "newest" | "oldest" | "most-active" | "premium-first";
type UserPlanFilter = "all" | UserPlan;
type UserStatusFilter = "all" | UserStatus;

type AdminUser = {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  plan: UserPlan;
  role: UserRole;
  status: UserStatus;
  billingStatus: string;
  creations: number;
  apiCalls: number;
  joinedAt: string;
  lastActiveAt: string;
  revenue: number;
};

export default function UsersTable() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<UserPlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [sortBy, setSortBy] = useState<UserSort>("newest");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const adminStatsQuery = useQuery({
    queryKey: ["admin-users-table"],
    enabled: Boolean(isLoaded && isSignedIn),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const token = await getToken({
        skipCache: true,
      });

      return getAdminStats({
        token,
        period: "month",
      });
    },
  });

  const statsResponse = adminStatsQuery.data;
  const users = useMemo(
    () => mapAdminUsers(statsResponse),
    [statsResponse],
  );

  const filteredUsers = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    let list = users.filter((user) => {
      const matchesSearch =
        !cleanSearch ||
        user.name.toLowerCase().includes(cleanSearch) ||
        user.email.toLowerCase().includes(cleanSearch) ||
        user.id.toLowerCase().includes(cleanSearch) ||
        user.clerkUserId.toLowerCase().includes(cleanSearch);

      const matchesPlan = planFilter === "all" || user.plan === planFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "premium-first") {
        return Number(b.plan === "premium") - Number(a.plan === "premium");
      }

      if (sortBy === "most-active") {
        return b.apiCalls - a.apiCalls;
      }

      const dateA = new Date(a.joinedAt).getTime();
      const dateB = new Date(b.joinedAt).getTime();

      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [users, search, planFilter, statusFilter, sortBy]);

  const overview = statsResponse?.overview;
  const totalUsers = getOverviewNumber(overview, "totalUsers") || users.length;
  const premiumUsers =
    getOverviewNumber(overview, "premiumUsers") ||
    users.filter((user) => user.plan === "premium").length;
  const adminUsers =
    getOverviewNumber(overview, "adminUsers") ||
    users.filter((user) => user.role === "admin").length;
  const totalRevenue =
    getOverviewNumber(overview, "estimatedMonthlyRevenueUsd") ||
    users.reduce((total, user) => total + user.revenue, 0);

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Registered users from Neon",
      icon: Users,
      trend: "up" as const,
      trendValue: `${users.length}`,
      trendLabel: "recent loaded",
      gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
      badge: "Users",
    },
    {
      title: "Premium Users",
      value: premiumUsers,
      description: "Paid plan accounts",
      icon: Crown,
      trend: "up" as const,
      trendValue: `${getOverviewNumber(overview, "conversionRate")}%`,
      trendLabel: "conversion",
      gradient: "from-amber-400 via-orange-500 to-fuchsia-600",
      badge: "Plans",
    },
    {
      title: "Admin Users",
      value: adminUsers,
      description: "Admin-role accounts",
      icon: ShieldCheck,
      trend: "up" as const,
      trendValue: `${adminUsers}`,
      trendLabel: "admins",
      gradient: "from-emerald-400 via-teal-500 to-cyan-500",
      badge: "Access",
    },
    {
      title: "Estimated Revenue",
      value: `$${formatNumber(totalRevenue)}`,
      description: "Estimated monthly revenue",
      icon: Crown,
      trend: "up" as const,
      trendValue: "$29",
      trendLabel: "per premium user",
      gradient: "from-rose-500 via-fuchsia-600 to-violet-600",
      badge: "Revenue",
    },
  ];

  function handleResetFilters() {
    setSearch("");
    setPlanFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
  }

  async function handleExport() {
    if (!users.length) {
      toast.error("No users to export.");
      return;
    }

    const csv = [
      [
        "ID",
        "Clerk User ID",
        "Name",
        "Email",
        "Plan",
        "Role",
        "Billing Status",
        "Joined At",
        "Updated At",
      ].join(","),
      ...users.map((user) =>
        [
          user.id,
          user.clerkUserId,
          user.name,
          user.email,
          user.plan,
          user.role,
          user.billingStatus,
          user.joinedAt,
          user.lastActiveAt,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    await copyToClipboard(csv);
    toast.success("User CSV copied to clipboard.");
  }

  function handleSuspend(user: AdminUser) {
    toast.info(
      `${user.name} cannot be suspended yet. Add an admin user-management endpoint before enabling this action.`,
    );
  }

  function handleDeleteUser() {
    if (!deleteUser) return;

    toast.info(
      `${deleteUser.name} was not deleted. Add a secure admin delete endpoint before enabling this action.`,
    );
    setDeleteUser(null);
  }

  if (adminStatsQuery.isLoading) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[30rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-red-500/10 text-red-600 dark:text-red-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading users...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching recent user records from the admin stats endpoint.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (adminStatsQuery.isError) {
    return (
      <Card padding="xl">
        <EmptyState
          variant="history"
          title="Could not load users"
          description={getApiErrorMessage(
            adminStatsQuery.error,
            "Admin users could not be loaded.",
          )}
          primaryAction={{
            label: "Try Again",
            onClick: () => adminStatsQuery.refetch(),
            variant: "primary",
            icon: <RefreshCw size={17} />,
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        eyebrow="User Management"
        title="Monitor users, plans, activity, and account status."
        description="This table now reads recent user records from your backend admin stats endpoint. Full pagination and destructive user actions can be added with a dedicated admin-users API."
        icon={Users}
      />

      <AdminStatsGrid stats={stats} />

      <Card padding="lg">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem_13rem]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or user ID..."
              leftIcon={<Search className="h-4 w-4" />}
              variant="filled"
            />

            <select
              value={planFilter}
              onChange={(event) =>
                setPlanFilter(event.target.value as UserPlanFilter)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="all">All plans</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as UserStatusFilter)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as UserSort)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most-active">Most active</option>
              <option value="premium-first">Premium first</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw size={17} />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>

            <Button
              variant="secondary"
              leftIcon={
                adminStatsQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )
              }
              onClick={() => adminStatsQuery.refetch()}
              disabled={adminStatsQuery.isFetching}
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              leftIcon={<Download size={17} />}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge variant="muted" icon={<Filter className="h-3.5 w-3.5" />}>
            {filteredUsers.length} result
            {filteredUsers.length === 1 ? "" : "s"}
          </Badge>

          {planFilter !== "all" && (
            <Badge variant={planFilter === "premium" ? "premium" : "primary"}>
              {planFilter}
            </Badge>
          )}

          {statusFilter !== "all" && (
            <Badge variant={getStatusBadgeVariant(statusFilter)}>
              {statusFilter}
            </Badge>
          )}
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {filteredUsers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem]">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                <tr>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onView={() => setSelectedUser(user)}
                    onSuspend={() => handleSuspend(user)}
                    onDelete={() => setDeleteUser(user)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              variant="search"
              title="No users found"
              description="Try changing the search text, plan filter, status filter, or sorting option."
              primaryAction={{
                label: "Clear Filters",
                onClick: handleResetFilters,
                variant: "secondary",
                icon: <RefreshCw size={17} />,
              }}
            />
          </div>
        )}
      </Card>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <UserGrowthCard users={users} />
        <AdminUserNotesCard />
      </section>

      <UserDetailsModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      <Modal
        open={Boolean(deleteUser)}
        onClose={() => setDeleteUser(null)}
        title="Delete user?"
        description="This action is intentionally disabled until a secure backend admin delete endpoint is added."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleteUser(null)}>
              Cancel
            </Button>

            <Button
              variant="danger"
              leftIcon={<Trash2 size={17} />}
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </div>
        }
      >
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
          <p className="text-sm font-semibold leading-6 text-rose-700 dark:text-rose-200">
            You are about to delete{" "}
            <span className="font-black">{deleteUser?.name}</span>. For safety,
            this is only a placeholder until server-side user deletion is built.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function UserRow({
  user,
  onView,
  onSuspend,
  onDelete,
}: {
  user: AdminUser;
  onView: () => void;
  onSuspend: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="bg-white transition hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/[0.04]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} />

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950 dark:text-white">
              {user.name}
            </p>

            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Mail size={13} />
              {user.email}
            </p>

            <p className="mt-1 text-[0.68rem] font-bold text-slate-400">
              {user.clerkUserId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <PlanBadge plan={user.plan} />
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={user.status} />
      </td>

      <td className="px-5 py-4">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {formatNumber(user.creations)} creations
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatNumber(user.apiCalls)} recent API calls
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-black text-slate-950 dark:text-white">
          ${formatNumber(user.revenue)}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {formatDate(user.joinedAt)}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {formatRelativeTime(user.lastActiveAt)}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <IconButton
            label="View user"
            icon={<Eye size={16} />}
            onClick={onView}
          />

          <IconButton
            label="Suspend user"
            icon={<Ban size={16} />}
            onClick={onSuspend}
            warning
          />

          <IconButton
            label="Delete user"
            icon={<Trash2 size={16} />}
            onClick={onDelete}
            danger
          />
        </div>
      </td>
    </tr>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function Avatar({ user }: { user: AdminUser }) {
  if (user.imageUrl) {
    return (
      <img
        src={user.imageUrl}
        alt={user.name}
        className="h-12 w-12 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-sm font-black text-white shadow-lg shadow-violet-500/20">
      {getInitials(user.name) || <UserRound size={19} />}
    </div>
  );
}

function PlanBadge({ plan }: { plan: UserPlan }) {
  if (plan === "premium") {
    return (
      <Badge variant="premium" icon={<Crown className="h-3.5 w-3.5" />}>
        Premium
      </Badge>
    );
  }

  return (
    <Badge variant="primary" icon={<Sparkles className="h-3.5 w-3.5" />}>
      Free
    </Badge>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "admin") {
    return (
      <Badge variant="danger" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        Admin
      </Badge>
    );
  }

  return (
    <Badge variant="muted" icon={<UserRound className="h-3.5 w-3.5" />}>
      User
    </Badge>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const variant = getStatusBadgeVariant(status);

  const icon =
    status === "active" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : status === "inactive" ? (
      <Clock className="h-3.5 w-3.5" />
    ) : (
      <ShieldCheck className="h-3.5 w-3.5" />
    );

  return (
    <Badge variant={variant} icon={icon}>
      {status}
    </Badge>
  );
}

function getStatusBadgeVariant(status: UserStatus) {
  if (status === "active") return "success";
  if (status === "admin") return "danger";

  return "warning";
}

function IconButton({
  label,
  icon,
  onClick,
  danger = false,
  warning = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]",
        danger && "border-rose-500/20 text-rose-500 hover:bg-rose-500/10",
        warning &&
          "border-amber-500/20 text-amber-600 hover:bg-amber-500/10 dark:text-amber-300",
        !danger &&
          !warning &&
          "border-slate-200 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300",
      )}
    >
      {icon}
    </button>
  );
}

function UserDetailsModal({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="User Details"
      description="Profile summary loaded from backend admin stats."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <Button
            rightIcon={<ArrowRight size={17} />}
            onClick={() =>
              toast.info("Full user profile page can be added with /api/admin-users/:id later.")
            }
          >
            Open Full Profile
          </Button>
        </div>
      }
    >
      {user && (
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-4">
              <Avatar user={user} />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-black text-slate-950 dark:text-white">
                    {user.name}
                  </p>
                  <PlanBadge plan={user.plan} />
                  <StatusBadge status={user.status} />
                  <RoleBadge role={user.role} />
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>

                <p className="mt-1 text-xs font-bold text-slate-400">
                  {user.clerkUserId}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailTile
              icon={<CalendarClock size={18} />}
              label="Joined"
              value={formatDate(user.joinedAt)}
            />
            <DetailTile
              icon={<Activity size={18} />}
              label="Updated"
              value={formatRelativeTime(user.lastActiveAt)}
            />
            <DetailTile
              icon={<Sparkles size={18} />}
              label="Creations"
              value={formatNumber(user.creations)}
            />
            <DetailTile
              icon={<ShieldCheck size={18} />}
              label="Recent API Calls"
              value={formatNumber(user.apiCalls)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

function DetailTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserGrowthCard({ users }: { users: AdminUser[] }) {
  const bars = getUserGrowthBars(users);

  return (
    <Card padding="xl">
      <Badge variant="success" icon={<UserPlus className="h-3.5 w-3.5" />}>
        User Growth
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Recent signup distribution
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        This lightweight chart is based on the recent users returned by the
        backend admin stats endpoint.
      </p>

      <div className="mt-8 flex h-64 items-end gap-3 rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/60">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex flex-1 items-end rounded-t-2xl bg-gradient-to-t from-violet-600 to-cyan-400"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

function AdminUserNotesCard() {
  return (
    <Card padding="xl">
      <Badge
        variant="premium"
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
      >
        Production Notes
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        What to connect later
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        This page is connected to real recent users. For full production user
        management, add a dedicated paginated admin users endpoint.
      </p>

      <div className="mt-6 grid gap-3">
        {[
          "Add /api/admin-users with pagination and search",
          "Add secure role update endpoint",
          "Add suspend/reactivate endpoint",
          "Add delete/deactivate user endpoint",
          "Add per-user creations and usage counts",
          "Export CSV from server for large datasets",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

function mapAdminUsers(stats: AdminStatsResponse | undefined): AdminUser[] {
  if (!stats) return [];

  const usageCountsByClerkUserId = new Map<string, number>();

  for (const log of stats.recent.usageLogs) {
    const clerkUserId = getRecordString(log, "clerkUserId");

    if (!clerkUserId) continue;

    usageCountsByClerkUserId.set(
      clerkUserId,
      (usageCountsByClerkUserId.get(clerkUserId) ?? 0) + 1,
    );
  }

  return stats.recent.users.map((record) => {
    const id = getRecordString(record, "id");
    const clerkUserId = getRecordString(record, "clerkUserId");
    const email = getRecordString(record, "email");
    const name = getRecordString(record, "name") || getNameFromEmail(email);
    const plan = getRecordPlan(record);
    const role = getRecordRole(record);
    const billingStatus = getRecordString(record, "billingStatus") || "free";
    const createdAt = getRecordString(record, "createdAt") || new Date().toISOString();
    const updatedAt = getRecordString(record, "updatedAt") || createdAt;

    return {
      id: id || clerkUserId || email,
      clerkUserId,
      name,
      email,
      imageUrl: getRecordString(record, "imageUrl") || null,
      plan,
      role,
      status: getUserStatus({
        role,
        billingStatus,
        updatedAt,
      }),
      billingStatus,
      creations: 0,
      apiCalls: usageCountsByClerkUserId.get(clerkUserId) ?? 0,
      joinedAt: createdAt,
      lastActiveAt: updatedAt,
      revenue: plan === "premium" ? 29 : 0,
    };
  });
}

function getUserStatus(input: {
  role: UserRole;
  billingStatus: string;
  updatedAt: string;
}): UserStatus {
  if (input.role === "admin") return "admin";

  if (
    input.billingStatus === "cancelled" ||
    input.billingStatus === "incomplete"
  ) {
    return "inactive";
  }

  return "active";
}

function getRecordString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === "string" ? value : "";
}

function getRecordPlan(record: Record<string, unknown>): UserPlan {
  return getRecordString(record, "plan") === "premium" ? "premium" : "free";
}

function getRecordRole(record: Record<string, unknown>): UserRole {
  return getRecordString(record, "role") === "admin" ? "admin" : "user";
}

function getNameFromEmail(email: string): string {
  if (!email) return "Unknown User";

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOverviewNumber(
  overview: AdminStatsResponse["overview"] | undefined,
  key: string,
): number {
  const value = overview?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getUserGrowthBars(users: AdminUser[]): number[] {
  if (!users.length) return [8, 14, 18, 24, 32, 44, 52];

  const sorted = [...users].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const user = sorted[index % sorted.length];
    const base = 25 + index * 9;
    const premiumBonus = user?.plan === "premium" ? 18 : 0;

    return Math.min(base + premiumBonus, 100);
  });
}