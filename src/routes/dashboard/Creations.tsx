import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  Copy,
  Download,
  FileText,
  Filter,
  ImageIcon,
  Layers3,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { ROUTES, toolCards } from "../../lib/routes";
import {
  cn,
  copyToClipboard,
  downloadTextFile,
  formatDate,
  formatFileSize,
  getToolLabel,
  truncateText,
} from "../../lib/utils";
import {
  getCreationErrorMessage,
  getCreationPreview,
  getCreationTitle,
  useCreations,
  useDeleteCreation,
} from "../../hooks/useCreations";
import type { PublicCreation, ToolType } from "../../lib/api";

type ViewMode = "grid" | "list";
type FilterTool = "all" | ToolType;
type SortOption = "newest" | "oldest" | "favorites";

const toolFilters: Array<{
  label: string;
  value: FilterTool;
}> = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Articles",
    value: "article",
  },
  {
    label: "Blog Titles",
    value: "blog-title",
  },
  {
    label: "Images",
    value: "image",
  },
  {
    label: "Background",
    value: "background-removal",
  },
  {
    label: "Object Removal",
    value: "object-removal",
  },
  {
    label: "Resume",
    value: "resume-review",
  },
];

export default function Creations() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [toolFilter, setToolFilter] = useState<FilterTool>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const creationsQuery = useCreations({
    page,
    limit: 12,
    toolType: toolFilter,
    search: appliedSearch,
    includeFailed: true,
  });

  const deleteCreationMutation = useDeleteCreation({
    onSuccess: () => {
      toast.success("Creation deleted successfully.");
    },
    onError: (error) => {
      toast.error(getCreationErrorMessage(error));
    },
  });

  const creations = creationsQuery.data?.creations ?? [];

  const sortedCreations = useMemo(() => {
    const list = [...creations];

    list.sort((a, b) => {
      if (sortBy === "favorites") {
        return Number(b.isFavorite) - Number(a.isFavorite);
      }

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [creations, sortBy]);

  const counts = creationsQuery.data?.counts ?? {
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    favorites: 0,
  };

  const pagination = creationsQuery.data?.pagination;
  const imageCount = creations.filter((creation) => creation.resultImageUrl).length;
  const textCount = creations.filter((creation) => creation.resultText).length;

  const isLoading = creationsQuery.isLoading || creationsQuery.isFetching;
  const hasCreations = sortedCreations.length > 0;
  const hasFilters =
    Boolean(appliedSearch) || toolFilter !== "all" || sortBy !== "newest";

  function handleSearchSubmit() {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  }

  function handleResetFilters() {
    setSearchInput("");
    setAppliedSearch("");
    setToolFilter("all");
    setSortBy("newest");
    setPage(1);
  }

  function handleOpen(creation: PublicCreation) {
    navigate(`${ROUTES.creations}/${creation.id}`);
  }

  async function handleCopy(creation: PublicCreation) {
    const content = creation.resultText || creation.prompt || "";

    if (!content.trim()) {
      toast.error("There is no text to copy.");
      return;
    }

    await copyToClipboard(content);
    toast.success("Copied to clipboard.");
  }

  function handleDownload(creation: PublicCreation) {
    if (creation.resultText) {
      downloadTextFile({
        filename: `${creation.toolType}-${creation.id}.txt`,
        content: creation.resultText,
      });

      toast.success("Text downloaded.");
      return;
    }

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

    toast.error("Nothing to download.");
  }

  function handleDelete(creation: PublicCreation) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this creation?",
    );

    if (!confirmed) return;

    deleteCreationMutation.mutate({
      creationId: creation.id,
      deleteCloudinaryAsset: true,
    });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10">
        <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge
              variant="premium"
              icon={<Layers3 className="h-3.5 w-3.5" />}
            >
              Creation History
            </Badge>

            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Manage everything you have created with AI.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Articles, blog titles, generated images, edited images, and
              resume reviews saved from your real Neon database appear here.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
            <HeroStat
              label="Total"
              value={String(counts.total)}
              icon={<Sparkles size={18} />}
            />

            <HeroStat
              label="Text"
              value={String(textCount)}
              icon={<FileText size={18} />}
            />

            <HeroStat
              label="Images"
              value={String(imageCount)}
              icon={<ImageIcon size={18} />}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Completed"
          value={counts.completed}
          icon={<Sparkles size={18} />}
        />

        <SummaryCard
          label="Processing"
          value={counts.processing}
          icon={<Loader2 size={18} />}
        />

        <SummaryCard
          label="Failed"
          value={counts.failed}
          icon={<Filter size={18} />}
        />

        <SummaryCard
          label="Favorites"
          value={counts.favorites}
          icon={<Star size={18} />}
        />
      </section>

      <Card padding="lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] xl:min-w-[28rem]">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              placeholder="Search prompts, results, or tools..."
              leftIcon={<Search className="h-4 w-4" />}
              variant="glass"
            />

            <Button
              variant="secondary"
              leftIcon={<Search size={16} />}
              onClick={handleSearchSubmit}
            >
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={toolFilter}
              onChange={(event) => {
                setToolFilter(event.target.value as FilterTool);
                setPage(1);
              }}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              {toolFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="favorites">Favorites first</option>
            </select>

            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl transition",
                  viewMode === "grid"
                    ? "bg-white text-violet-600 shadow-sm dark:bg-white/10 dark:text-violet-300"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-white",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl transition",
                  viewMode === "list"
                    ? "bg-white text-violet-600 shadow-sm dark:bg-white/10 dark:text-violet-300"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-white",
                )}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>

            {hasFilters && (
              <Button
                variant="secondary"
                leftIcon={<RefreshCw size={16} />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {creationsQuery.isError && (
        <Card padding="lg" className="border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="text-sm font-bold text-rose-700 dark:text-rose-200">
            {getCreationErrorMessage(creationsQuery.error)}
          </p>
        </Card>
      )}

      {isLoading && !hasCreations ? (
        <Card padding="xl">
          <div className="grid min-h-[24rem] place-items-center">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
                Loading your creations...
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Fetching saved history from Neon.
              </p>
            </div>
          </div>
        </Card>
      ) : hasCreations ? (
        <>
          <div
            className={cn(
              viewMode === "grid"
                ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                : "space-y-4",
            )}
          >
            {sortedCreations.map((creation) =>
              viewMode === "grid" ? (
                <CreationGridCard
                  key={creation.id}
                  creation={creation}
                  onOpen={() => handleOpen(creation)}
                  onCopy={() => handleCopy(creation)}
                  onDownload={() => handleDownload(creation)}
                  onDelete={() => handleDelete(creation)}
                  deleting={deleteCreationMutation.isPending}
                />
              ) : (
                <CreationListCard
                  key={creation.id}
                  creation={creation}
                  onOpen={() => handleOpen(creation)}
                  onCopy={() => handleCopy(creation)}
                  onDownload={() => handleDownload(creation)}
                  onDelete={() => handleDelete(creation)}
                  deleting={deleteCreationMutation.isPending}
                />
              ),
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Card padding="lg">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages} •{" "}
                  {pagination.total} total creations
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={!pagination.hasPreviousPage || isLoading}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="secondary"
                    disabled={!pagination.hasNextPage || isLoading}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card padding="xl">
          <EmptyState
            variant="history"
            title={hasFilters ? "No matching creations found" : "No creations yet"}
            description={
              hasFilters
                ? "Try changing your search or filters."
                : "Generate an article or blog titles first, then your saved creations will appear here."
            }
            primaryAction={
              hasFilters
                ? {
                    label: "Reset Filters",
                    onClick: handleResetFilters,
                    variant: "secondary",
                    icon: <RefreshCw size={17} />,
                  }
                : {
                    label: "Create Article",
                    onClick: () => navigate(ROUTES.writeArticle),
                    variant: "primary",
                    icon: <ArrowRight size={17} />,
                  }
            }
          />
        </Card>
      )}

      <Card padding="lg">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <Badge
              variant="primary"
              icon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Keep Creating
            </Badge>

            <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
              Generate more with QuickAI
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Jump back into your tools and create more saved results.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {toolCards.slice(0, 3).map((tool) => (
              <Link
                key={tool.href}
                to={tool.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-600 transition hover:-translate-y-0.5 hover:bg-white hover:text-violet-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]"
              >
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card padding="lg">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function CreationGridCard({
  creation,
  onOpen,
  onCopy,
  onDownload,
  onDelete,
  deleting,
}: {
  creation: PublicCreation;
  onOpen: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card padding="lg" className="group overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant={creation.status === "failed" ? "danger" : "muted"}>
            {getToolLabel(creation.toolType)}
          </Badge>

          <h3 className="mt-4 line-clamp-2 text-lg font-black text-slate-950 dark:text-white">
            {getCreationTitle(creation)}
          </h3>
        </div>

        {creation.isFavorite && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-500">
            <Star size={16} fill="currentColor" />
          </div>
        )}
      </div>

      {creation.resultImageUrl ? (
        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.04]">
          <img
            src={creation.resultImageUrl}
            alt={creation.prompt}
            className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="line-clamp-5 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            {truncateText(getCreationPreview(creation), 260)}
          </p>
        </div>
      )}

      {creation.status === "failed" && creation.errorMessage && (
        <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-300">
          {creation.errorMessage}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-4 text-xs font-bold text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={14} />
          {formatDate(creation.createdAt)}
        </span>

        {getOriginalFileSize(creation) && (
          <span>{formatFileSize(getOriginalFileSize(creation)!)}</span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        <ActionButton label="Open" icon={<ArrowRight size={15} />} onClick={onOpen} />
        <ActionButton label="Copy" icon={<Copy size={15} />} onClick={onCopy} />
        <ActionButton
          label="Save"
          icon={<Download size={15} />}
          onClick={onDownload}
        />
        <ActionButton
          label="Delete"
          icon={
            deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 size={15} />
            )
          }
          onClick={onDelete}
          disabled={deleting}
          danger
        />
      </div>
    </Card>
  );
}

function CreationListCard({
  creation,
  onOpen,
  onCopy,
  onDownload,
  onDelete,
  deleting,
}: {
  creation: PublicCreation;
  onOpen: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card padding="lg">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        {creation.resultImageUrl ? (
          <img
            src={creation.resultImageUrl}
            alt={creation.prompt}
            className="h-28 w-full rounded-[1.5rem] object-cover md:w-40"
          />
        ) : (
          <div className="grid h-28 w-full place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300 md:w-40">
            <FileText size={28} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={creation.status === "failed" ? "danger" : "muted"}>
              {getToolLabel(creation.toolType)}
            </Badge>

            {creation.isFavorite && (
              <Badge variant="warning" icon={<Star className="h-3.5 w-3.5" />}>
                Favorite
              </Badge>
            )}
          </div>

          <h3 className="mt-3 truncate text-lg font-black text-slate-950 dark:text-white">
            {getCreationTitle(creation)}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            {truncateText(getCreationPreview(creation), 180)}
          </p>

          <p className="mt-3 text-xs font-bold text-slate-400">
            {formatDate(creation.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onOpen}>
            Open
          </Button>

          <Button variant="secondary" size="sm" onClick={onCopy}>
            Copy
          </Button>

          <Button variant="secondary" size="sm" onClick={onDownload}>
            Download
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onDelete}
            disabled={deleting}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60",
        danger
          ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:text-rose-300"
          : "bg-slate-100 text-slate-600 hover:bg-violet-500/10 hover:text-violet-600 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-300",
      )}
      aria-label={label}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function getOriginalFileSize(creation: PublicCreation): number | null {
  const value = creation.metadata?.originalFileSize;

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}