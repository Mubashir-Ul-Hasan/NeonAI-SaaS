import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Cloud,
  Copy,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  ImageIcon,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2
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
  downloadTextFile,
  formatDate,
  formatFileSize,
  formatNumber,
  formatRelativeTime,
  getToolGradient,
  getToolLabel,
  truncateText,
} from "../../lib/utils";
import {
  getAdminStats,
  getApiErrorMessage,
  type AdminStatsResponse,
  type CreationStatus,
  type PublicCreation,
  type ToolType,
} from "../../lib/api";
import {
  getCreationPreview,
  getCreationTitle,
} from "../../hooks/useCreations";

type CreationSort = "newest" | "oldest" | "largest";
type CreationToolFilter = "all" | ToolType;
type CreationStatusFilter = "all" | CreationStatus;

type AdminCreation = PublicCreation & {
  userName: string;
  email: string;
  clerkUserId: string;
  fileSize: number | null;
  storage: "Neon" | "Cloudinary";
};

const toolOptions: ToolType[] = [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
];

export default function CreationsMonitor() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [toolFilter, setToolFilter] = useState<CreationToolFilter>("all");
  const [statusFilter, setStatusFilter] = useState<CreationStatusFilter>("all");
  const [sortBy, setSortBy] = useState<CreationSort>("newest");
  const [selectedCreation, setSelectedCreation] =
    useState<AdminCreation | null>(null);
  const [deleteCreation, setDeleteCreation] =
    useState<AdminCreation | null>(null);

  const adminStatsQuery = useQuery({
    queryKey: ["admin-creations-monitor"],
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

  const adminStats = adminStatsQuery.data;
  const overview = adminStats?.overview;

  const creations = useMemo(
    () => mapAdminCreations(adminStats),
    [adminStats],
  );

  const filteredCreations = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    let list = creations.filter((creation) => {
      const matchesSearch =
        !cleanSearch ||
        creation.id.toLowerCase().includes(cleanSearch) ||
        creation.userName.toLowerCase().includes(cleanSearch) ||
        creation.email.toLowerCase().includes(cleanSearch) ||
        creation.clerkUserId.toLowerCase().includes(cleanSearch) ||
        creation.prompt.toLowerCase().includes(cleanSearch) ||
        creation.resultText?.toLowerCase().includes(cleanSearch) ||
        getToolLabel(creation.toolType).toLowerCase().includes(cleanSearch);

      const matchesTool =
        toolFilter === "all" || creation.toolType === toolFilter;

      const matchesStatus =
        statusFilter === "all" || creation.status === statusFilter;

      return matchesSearch && matchesTool && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "largest") {
        return (b.fileSize ?? 0) - (a.fileSize ?? 0);
      }

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [creations, search, toolFilter, statusFilter, sortBy]);

  const totalCreations =
    getOverviewNumber(overview, "totalCreations") || creations.length;
  const completedCreations =
    getOverviewNumber(overview, "completedCreations") ||
    creations.filter((item) => item.status === "completed").length;
  const failedCreations =
    getOverviewNumber(overview, "failedCreations") ||
    creations.filter((item) => item.status === "failed").length;
  const imageCreations = creations.filter((item) => item.resultImageUrl).length;
  const textCreations = creations.filter((item) => item.resultText).length;
  const totalStorage = creations.reduce(
    (total, item) => total + (item.fileSize ?? 0),
    0,
  );

  const stats = [
    {
      title: "Total Creations",
      value: totalCreations,
      description: "Saved outputs in Neon",
      icon: Layers3,
      trend: "up" as const,
      trendValue: `${completedCreations}`,
      trendLabel: "completed",
      gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
      badge: "Creations",
    },
    {
      title: "Text Outputs",
      value: textCreations,
      description: "Articles, titles, reviews",
      icon: FileText,
      trend: "up" as const,
      trendValue: `${textCreations}`,
      trendLabel: "recent loaded",
      gradient: "from-blue-500 via-violet-600 to-fuchsia-500",
      badge: "Text",
    },
    {
      title: "Image Outputs",
      value: imageCreations,
      description: "Generated and edited images",
      icon: ImageIcon,
      trend: "up" as const,
      trendValue: `${imageCreations}`,
      trendLabel: "recent loaded",
      gradient: "from-cyan-500 via-teal-500 to-emerald-400",
      badge: "Images",
    },
    {
      title: "Storage Used",
      value: formatFileSize(totalStorage),
      description: `${failedCreations} failed creation${
        failedCreations === 1 ? "" : "s"
      }`,
      icon: Cloud,
      trend: failedCreations > 0 ? ("down" as const) : ("neutral" as const),
      trendValue: failedCreations > 0 ? `${failedCreations} fail` : "0 fail",
      trendLabel: "recent records",
      gradient: "from-amber-400 via-orange-500 to-rose-500",
      badge: "Storage",
    },
  ];

  function handleResetFilters() {
    setSearch("");
    setToolFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
  }

  async function handleExport() {
    if (!creations.length) {
      toast.error("No creations to export.");
      return;
    }

    const csv = [
      [
        "ID",
        "User",
        "Email",
        "Clerk User ID",
        "Tool",
        "Status",
        "Storage",
        "File Size",
        "Prompt",
        "Created At",
      ].join(","),
      ...creations.map((creation) =>
        [
          creation.id,
          creation.userName,
          creation.email,
          creation.clerkUserId,
          creation.toolType,
          creation.status,
          creation.storage,
          creation.fileSize ?? "",
          creation.prompt,
          creation.createdAt,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    await copyToClipboard(csv);
    toast.success("Creations CSV copied to clipboard.");
  }

  async function handleCopy(creation: AdminCreation) {
    const content = creation.resultText || creation.prompt;

    if (!content.trim()) {
      toast.error("There is no text to copy.");
      return;
    }

    await copyToClipboard(content);
    toast.success("Creation text copied.");
  }

  function handleDownload(creation: AdminCreation) {
    if (creation.resultImageUrl) {
      const link = document.createElement("a");

      link.href = creation.resultImageUrl;
      link.download = `${creation.toolType}-${creation.id}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Image downloaded.");
      return;
    }

    if (creation.resultText) {
      downloadTextFile({
        filename: `${creation.toolType}-${creation.id}.txt`,
        content: creation.resultText,
      });

      toast.success("Text downloaded.");
      return;
    }

    toast.error("There is nothing to download.");
  }

  function handleDeleteCreation() {
    if (!deleteCreation) return;

    toast.info(
      "Admin deletion is not enabled yet. Add a secure /api/admin-delete-creation endpoint before allowing admins to delete any user's content.",
    );
    setDeleteCreation(null);
  }

  if (adminStatsQuery.isLoading) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[30rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading creations monitor...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching recent saved creations from the backend.
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
          title="Could not load creations"
          description={getApiErrorMessage(
            adminStatsQuery.error,
            "Admin creations could not be loaded.",
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
        eyebrow="Creations Monitor"
        title="Review user-generated content, tool output, and stored assets."
        description="This page now reads recent saved creations from the backend admin stats endpoint. Full moderation actions can be added with a dedicated admin creations API."
        icon={Layers3}
      />

      <AdminStatsGrid stats={stats} />

      <Card padding="lg">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="grid gap-4 md:grid-cols-[1fr_13rem_13rem_13rem]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search creation ID, user, prompt, or result..."
              leftIcon={<Search className="h-4 w-4" />}
              variant="filled"
            />

            <select
              value={toolFilter}
              onChange={(event) =>
                setToolFilter(event.target.value as CreationToolFilter)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="all">All tools</option>
              {toolOptions.map((toolType) => (
                <option key={toolType} value={toolType}>
                  {getToolLabel(toolType)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as CreationStatusFilter)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="all">All status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as CreationSort)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="largest">Largest file</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
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

            <Button
              variant="secondary"
              leftIcon={<RefreshCw size={17} />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge variant="muted" icon={<Filter className="h-3.5 w-3.5" />}>
            {filteredCreations.length} result
            {filteredCreations.length === 1 ? "" : "s"}
          </Badge>

          {toolFilter !== "all" && (
            <Badge variant="primary">{getToolLabel(toolFilter)}</Badge>
          )}

          {statusFilter !== "all" && (
            <Badge variant={getCreationStatusVariant(statusFilter)}>
              {statusFilter}
            </Badge>
          )}
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {filteredCreations.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[82rem]">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                <tr>
                  <TableHead>Creation</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-transparent">
                {filteredCreations.map((creation) => (
                  <CreationRow
                    key={creation.id}
                    creation={creation}
                    onView={() => setSelectedCreation(creation)}
                    onCopy={() => handleCopy(creation)}
                    onDownload={() => handleDownload(creation)}
                    onDelete={() => setDeleteCreation(creation)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              variant="search"
              title="No creations found"
              description="Try changing the search text, tool filter, status filter, or sorting option."
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <StorageOverviewCard creations={creations} />
        <ModerationChecklistCard />
      </section>

      <CreationDetailsModal
        creation={selectedCreation}
        onClose={() => setSelectedCreation(null)}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />

      <Modal
        open={Boolean(deleteCreation)}
        onClose={() => setDeleteCreation(null)}
        title="Delete creation?"
        description="Admin deletion is intentionally disabled until a secure backend admin deletion endpoint is added."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleteCreation(null)}>
              Cancel
            </Button>

            <Button
              variant="danger"
              leftIcon={<Trash2 size={17} />}
              onClick={handleDeleteCreation}
            >
              Delete Creation
            </Button>
          </div>
        }
      >
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
          <p className="text-sm font-semibold leading-6 text-rose-700 dark:text-rose-200">
            You are about to delete{" "}
            <span className="font-black">{deleteCreation?.id}</span>. This
            requires a dedicated admin endpoint so admins cannot accidentally
            delete another user’s data with the normal user delete route.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function CreationRow({
  creation,
  onView,
  onCopy,
  onDownload,
  onDelete,
}: {
  creation: AdminCreation;
  onView: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
            {creation.resultImageUrl ? (
              <img
                src={creation.resultImageUrl}
                alt={creation.prompt}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-violet-600 dark:text-violet-300">
                <FileText size={22} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950 dark:text-white">
              {getCreationTitle(creation)}
            </p>

            <p className="mt-1 line-clamp-2 max-w-md text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              {truncateText(getCreationPreview(creation), 110)}
            </p>

            <p className="mt-1 text-[0.68rem] font-bold text-slate-400">
              {creation.id}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {creation.userName}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {creation.email}
          </p>

          <p className="mt-1 text-[0.68rem] font-bold text-slate-400">
            {creation.clerkUserId || "No Clerk ID"}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <ToolBadge toolType={creation.toolType} />
      </td>

      <td className="px-5 py-4">
        <CreationStatusBadge status={creation.status} />
      </td>

      <td className="px-5 py-4">
        <StorageBadge storage={creation.storage} />
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-black text-slate-950 dark:text-white">
          {creation.fileSize ? formatFileSize(creation.fileSize) : "—"}
        </p>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {formatDate(creation.createdAt)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatRelativeTime(creation.createdAt)}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <IconButton label="View" icon={<Eye size={16} />} onClick={onView} />
          <IconButton
            label="Copy"
            icon={<Copy size={16} />}
            onClick={onCopy}
          />
          <IconButton
            label="Download"
            icon={<Download size={16} />}
            onClick={onDownload}
          />
          <IconButton
            label="Delete"
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
  children: ReactNode;
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

function ToolBadge({ toolType }: { toolType: ToolType }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-black text-white shadow-lg",
        getToolGradient(toolType),
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {getToolLabel(toolType)}
    </div>
  );
}

function CreationStatusBadge({ status }: { status: CreationStatus }) {
  const icon =
    status === "completed" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : status === "failed" ? (
      <AlertTriangle className="h-3.5 w-3.5" />
    ) : (
      <Clock3 className="h-3.5 w-3.5" />
    );

  return (
    <Badge variant={getCreationStatusVariant(status)} icon={icon}>
      {status}
    </Badge>
  );
}

function getCreationStatusVariant(status: CreationStatus) {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";

  return "warning";
}

function StorageBadge({ storage }: { storage: AdminCreation["storage"] }) {
  if (storage === "Cloudinary") {
    return (
      <Badge variant="primary" icon={<Cloud className="h-3.5 w-3.5" />}>
        Cloudinary
      </Badge>
    );
  }

  return (
    <Badge variant="muted" icon={<Database className="h-3.5 w-3.5" />}>
      Neon
    </Badge>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]",
        danger
          ? "border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
          : "border-slate-200 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300",
      )}
    >
      {icon}
    </button>
  );
}

function CreationDetailsModal({
  creation,
  onClose,
  onCopy,
  onDownload,
}: {
  creation: AdminCreation | null;
  onClose: () => void;
  onCopy: (creation: AdminCreation) => void;
  onDownload: (creation: AdminCreation) => void;
}) {
  return (
    <Modal
      open={Boolean(creation)}
      onClose={onClose}
      title="Creation Details"
      description="Review the saved output, user metadata, prompt, and storage information."
      size="xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          {creation && (
            <>
              <Button
                variant="secondary"
                leftIcon={<Copy size={17} />}
                onClick={() => onCopy(creation)}
              >
                Copy
              </Button>

              <Button
                rightIcon={<ArrowRight size={17} />}
                onClick={() => onDownload(creation)}
              >
                Download
              </Button>
            </>
          )}
        </div>
      }
    >
      {creation && (
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-center gap-2">
              <ToolBadge toolType={creation.toolType} />
              <CreationStatusBadge status={creation.status} />
              <StorageBadge storage={creation.storage} />
            </div>

            <h3 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              {getCreationTitle(creation)}
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              {creation.prompt}
            </p>
          </div>

          {creation.resultImageUrl ? (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
              <img
                src={creation.resultImageUrl}
                alt={creation.prompt}
                className="max-h-[30rem] w-full object-contain"
              />
            </div>
          ) : creation.resultText ? (
            <div className="max-h-[30rem] overflow-auto rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700 dark:text-slate-200">
                {creation.resultText}
              </pre>
            </div>
          ) : (
            <EmptyState
              variant="history"
              title="No saved output"
              description={
                creation.errorMessage ||
                "This creation does not have a saved output."
              }
              size="sm"
            />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <DetailTile
              icon={<Database size={18} />}
              label="Creation ID"
              value={creation.id}
            />
            <DetailTile
              icon={<ShieldCheck size={18} />}
              label="User"
              value={creation.userName}
            />
            <DetailTile
              icon={<Cloud size={18} />}
              label="Storage"
              value={creation.storage}
            />
            <DetailTile
              icon={<Clock3 size={18} />}
              label="Created"
              value={formatDate(creation.createdAt)}
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
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StorageOverviewCard({ creations }: { creations: AdminCreation[] }) {
  const neonCount = creations.filter((item) => item.storage === "Neon").length;
  const cloudinaryCount = creations.filter(
    (item) => item.storage === "Cloudinary",
  ).length;
  const totalStorage = creations.reduce(
    (total, item) => total + (item.fileSize ?? 0),
    0,
  );

  return (
    <Card padding="xl">
      <Badge variant="primary" icon={<Cloud className="h-3.5 w-3.5" />}>
        Storage Overview
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Stored output locations
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Text results are stored in Neon. Image outputs are expected to use
        Cloudinary when image tools are configured.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MiniMetric
          icon={<Database size={17} />}
          label="Neon"
          value={formatNumber(neonCount)}
        />
        <MiniMetric
          icon={<Cloud size={17} />}
          label="Cloudinary"
          value={formatNumber(cloudinaryCount)}
        />
        <MiniMetric
          icon={<Layers3 size={17} />}
          label="Storage"
          value={formatFileSize(totalStorage)}
        />
      </div>
    </Card>
  );
}

function ModerationChecklistCard() {
  return (
    <Card padding="xl">
      <Badge
        variant="premium"
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
      >
        Production Moderation
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        What to add next
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        This page monitors real recent creations. For production moderation,
        add dedicated admin-only APIs.
      </p>

      <div className="mt-6 grid gap-3">
        {[
          "Add /api/admin-creations with pagination and search",
          "Add admin delete creation endpoint",
          "Add Cloudinary asset cleanup for admin deletion",
          "Add content moderation status and review notes",
          "Add per-user creation lookup",
          "Add server-side CSV export for large datasets",
        ].map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
          >
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function mapAdminCreations(
  stats: AdminStatsResponse | undefined,
): AdminCreation[] {
  if (!stats) return [];

  const usersByClerkUserId = new Map<string, Record<string, unknown>>();

  for (const user of stats.recent.users) {
    const clerkUserId = getRecordString(user, "clerkUserId");

    if (clerkUserId) {
      usersByClerkUserId.set(clerkUserId, user);
    }
  }

  return stats.recent.creations.map((creation) => {
    const record = creation as PublicCreation & Record<string, unknown>;
    const clerkUserId = getRecordString(record, "clerkUserId");
    const user = usersByClerkUserId.get(clerkUserId);
    const email = user ? getRecordString(user, "email") : "";
    const name = user
      ? getRecordString(user, "name") || getNameFromEmail(email)
      : clerkUserId || "Unknown User";

    const fileSize = getCreationFileSize(creation);
    const storage = creation.resultImageUrl ? "Cloudinary" : "Neon";

    return {
      ...creation,
      userName: name,
      email: email || "No email available",
      clerkUserId,
      fileSize,
      storage,
    };
  });
}

function getCreationFileSize(creation: PublicCreation): number | null {
  const keys = [
    "fileSize",
    "originalFileSize",
    "outputFileSize",
    "bytes",
    "size",
  ];

  for (const key of keys) {
    const value = creation.metadata?.[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function getRecordString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === "string" ? value : "";
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