import {
  ArrowRight,
  CalendarClock,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileText,
  ImageIcon,
  Sparkles,
  Star,
  Trash2,
  WandSparkles,
} from "lucide-react";

import type { Creation } from "../../lib/api";
import {
  cn,
  formatDate,
  formatFileSize,
  formatRelativeTime,
  getToolAccentColor,
  getToolBgColor,
  getToolGradient,
  getToolLabel,
  truncateText,
} from "../../lib/utils";
import { Badge, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Loader";
import { EmptyState } from "../ui/EmptyState";

type CreationCardProps = {
  creation: Creation;
  view?: "grid" | "list";
  selected?: boolean;
  onOpen?: (creation: Creation) => void;
  onCopy?: (creation: Creation) => void;
  onDownload?: (creation: Creation) => void;
  onDelete?: (creation: Creation) => void;
  onToggleFavorite?: (creation: Creation) => void;
  className?: string;
};

export function CreationCard({
  creation,
  view = "grid",
  selected = false,
  onOpen,
  onCopy,
  onDownload,
  onDelete,
  onToggleFavorite,
  className,
}: CreationCardProps) {
  if (view === "list") {
    return (
      <CreationListItem
        creation={creation}
        selected={selected}
        onOpen={onOpen}
        onCopy={onCopy}
        onDownload={onDownload}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        className={className}
      />
    );
  }

  const isImage = Boolean(creation.resultImageUrl);
  const isText = Boolean(creation.resultText);
  const isFavorite = Boolean(creation.isFavorite);

  return (
    <Card
      hover
      className={cn(
        "group relative flex h-full flex-col overflow-hidden",
        selected && "ring-4 ring-violet-500/20",
        className,
      )}
      padding="none"
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
          getToolGradient(creation.toolType),
        )}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                getToolGradient(creation.toolType),
              )}
            >
              {isImage ? <ImageIcon size={21} /> : <FileText size={21} />}
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950 dark:text-white">
                {getCreationTitle(creation)}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge
                  variant="muted"
                  size="sm"
                  icon={<WandSparkles className="h-3 w-3" />}
                >
                  {getToolLabel(creation.toolType)}
                </Badge>

                <StatusBadge status={creation.status} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite?.(creation)}
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition hover:-translate-y-0.5",
              isFavorite
                ? "border-amber-400/30 bg-amber-400/15 text-amber-500"
                : "border-slate-200 bg-white text-slate-400 hover:text-amber-500 dark:border-white/10 dark:bg-white/5",
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn("h-4.5 w-4.5", isFavorite && "fill-current")} />
          </button>
        </div>

        <div className="mt-5">
          {isImage ? (
            <ImagePreview imageUrl={creation.resultImageUrl!} />
          ) : (
            <TextPreview text={creation.resultText || creation.prompt || ""} />
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <CalendarClock size={14} />
          <span>{formatRelativeTime(creation.createdAt)}</span>
          <span>•</span>
          <span>{formatDate(creation.createdAt)}</span>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Eye size={16} />}
            onClick={() => onOpen?.(creation)}
          >
            View
          </Button>

          <div className="flex items-center gap-2">
            {isText && (
              <IconActionButton
                label="Copy result"
                icon={<Copy size={16} />}
                onClick={() => onCopy?.(creation)}
              />
            )}

            {isImage && (
              <IconActionButton
                label="Download image"
                icon={<Download size={16} />}
                onClick={() => onDownload?.(creation)}
              />
            )}

            <IconActionButton
              label="Delete creation"
              icon={<Trash2 size={16} />}
              danger
              onClick={() => onDelete?.(creation)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreationListItem({
  creation,
  selected,
  onOpen,
  onCopy,
  onDownload,
  onDelete,
  onToggleFavorite,
  className,
}: Omit<CreationCardProps, "view">) {
  const isImage = Boolean(creation.resultImageUrl);
  const isText = Boolean(creation.resultText);
  const isFavorite = Boolean(creation.isFavorite);

  return (
    <div
      className={cn(
        "group rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/5 transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.04]",
        selected && "ring-4 ring-violet-500/20",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            getToolGradient(creation.toolType),
          )}
        >
          {isImage ? <ImageIcon size={23} /> : <FileText size={23} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black text-slate-950 dark:text-white">
              {getCreationTitle(creation)}
            </h3>

            <StatusBadge status={creation.status} />

            {isFavorite && (
              <Badge
                variant="warning"
                size="sm"
                icon={<Star className="h-3 w-3 fill-current" />}
              >
                Favorite
              </Badge>
            )}
          </div>

          <p className="mt-2 line-clamp-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {getCreationDescription(creation)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Badge
              variant="muted"
              size="sm"
              icon={<WandSparkles className="h-3 w-3" />}
            >
              {getToolLabel(creation.toolType)}
            </Badge>

            <span>{formatRelativeTime(creation.createdAt)}</span>

            {getOriginalFileSize(creation) !== null && (
  <>
    <span>•</span>
    <span>{formatFileSize(getOriginalFileSize(creation)!)}</span>
  </>
)}
          </div>
        </div>

        {isImage && creation.resultImageUrl && (
          <img
            src={creation.resultImageUrl}
            alt={getCreationTitle(creation)}
            className="h-20 w-full rounded-2xl object-cover lg:w-28"
          />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite?.(creation)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-2xl border transition hover:-translate-y-0.5",
              isFavorite
                ? "border-amber-400/30 bg-amber-400/15 text-amber-500"
                : "border-slate-200 bg-white text-slate-400 hover:text-amber-500 dark:border-white/10 dark:bg-white/5",
            )}
            aria-label="Toggle favorite"
          >
            <Star className={cn("h-4.5 w-4.5", isFavorite && "fill-current")} />
          </button>

          {isText && (
            <IconActionButton
              label="Copy result"
              icon={<Copy size={16} />}
              onClick={() => onCopy?.(creation)}
            />
          )}

          {isImage && (
            <IconActionButton
              label="Download image"
              icon={<Download size={16} />}
              onClick={() => onDownload?.(creation)}
            />
          )}

          <Button
            size="sm"
            variant="dark"
            rightIcon={<ArrowRight size={16} />}
            onClick={() => onOpen?.(creation)}
          >
            Open
          </Button>

          <IconActionButton
            label="Delete creation"
            icon={<Trash2 size={16} />}
            danger
            onClick={() => onDelete?.(creation)}
          />
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.04]">
      <img
        src={imageUrl}
        alt="Generated result"
        className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white backdrop-blur-xl">
          <ImageIcon size={14} />
          Image output
        </div>
      </div>
    </div>
  );
}

function TextPreview({ text }: { text: string }) {
  return (
    <div className="min-h-56 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
      {text ? (
        <p className="line-clamp-8 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
          {truncateText(text, 520)}
        </p>
      ) : (
        <div className="grid min-h-44 place-items-center text-center">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-500">
              <Clipboard size={21} />
            </div>

            <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">
              No text preview
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Result content will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function IconActionButton({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5",
        danger
          ? "border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
          : "border-slate-200 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300",
      )}
    >
      {icon}
    </button>
  );
}

type CreationCardGridProps = {
  creations: Creation[];
  view?: "grid" | "list";
  emptyTitle?: string;
  emptyDescription?: string;
  onOpen?: (creation: Creation) => void;
  onCopy?: (creation: Creation) => void;
  onDownload?: (creation: Creation) => void;
  onDelete?: (creation: Creation) => void;
  onToggleFavorite?: (creation: Creation) => void;
  className?: string;
};

export function CreationCardGrid({
  creations,
  view = "grid",
  emptyTitle = "No creations yet",
  emptyDescription = "Generated articles, titles, images, and resume reviews will appear here.",
  onOpen,
  onCopy,
  onDownload,
  onDelete,
  onToggleFavorite,
  className,
}: CreationCardGridProps) {
  if (!creations.length) {
    return (
      <EmptyState
        variant="creations"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div
      className={cn(
        view === "grid"
          ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          : "space-y-4",
        className,
      )}
    >
      {creations.map((creation) => (
        <CreationCard
          key={creation.id}
          creation={creation}
          view={view}
          onOpen={onOpen}
          onCopy={onCopy}
          onDownload={onDownload}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

type CreationActivityItemProps = {
  creation: Creation;
  onOpen?: (creation: Creation) => void;
  className?: string;
};

export function CreationActivityItem({
  creation,
  onOpen,
  className,
}: CreationActivityItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(creation)}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
          getToolBgColor(creation.toolType),
          getToolAccentColor(creation.toolType),
        )}
      >
        <Sparkles size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950 dark:text-white">
          {getCreationTitle(creation)}
        </p>

        <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
          {getToolLabel(creation.toolType)} • {formatRelativeTime(creation.createdAt)}
        </p>
      </div>

      <ArrowRight size={16} className="text-slate-400" />
    </button>
  );
}

export function CreationCardSkeleton({
  view = "grid",
  count = 6,
}: {
  view?: "grid" | "list";
  count?: number;
}) {
  return (
    <div
      className={cn(
        view === "grid"
          ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          : "space-y-4",
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-3 h-3 w-1/2" />
            </div>
          </div>

          <Skeleton className="mt-5 h-48 rounded-[1.5rem]" />

          <div className="mt-5 flex items-center justify-between">
            <Skeleton className="h-10 w-24 rounded-2xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getOriginalFileSize(creation: Creation) {
  const value = creation.metadata?.originalFileSize;

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function getCreationTitle(creation: Creation) {
  if (creation.prompt) {
    return truncateText(creation.prompt, 64);
  }

  if (creation.resultText) {
    return truncateText(creation.resultText, 64);
  }

  return getToolLabel(creation.toolType);
}

function getCreationDescription(creation: Creation) {
  if (creation.resultText) {
    return truncateText(creation.resultText, 180);
  }

  if (creation.prompt) {
    return truncateText(creation.prompt, 180);
  }

  if (creation.resultImageUrl) {
    return "Generated image result";
  }

  return "No preview available";
}

export function createDemoCreation(
  overrides: Partial<Creation> = {},
): Creation {
  const now = new Date().toISOString();

  return {
    id: `demo-${Math.random().toString(36).slice(2, 10)}`,
    userId: "demo-user",
    toolType: "article",
    prompt: "Write an article about how AI tools help small businesses grow.",
    resultText:
      "AI tools are changing the way small businesses operate by helping teams create content faster, automate repetitive tasks, and make better decisions with less manual effort.",
    resultImageUrl: null,
    inputImageUrl: null,
    metadata: null,
    status: "completed",
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}