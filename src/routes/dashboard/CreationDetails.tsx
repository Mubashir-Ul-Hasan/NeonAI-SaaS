import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileText,
  ImageIcon,
  Info,
  Layers3,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Trash2,
  WandSparkles,
  XCircle,
} from "lucide-react";

import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { ROUTES } from "../../lib/routes";
import {
  cn,
  copyToClipboard,
  downloadTextFile,
  formatDate,
  formatFileSize,
  formatRelativeTime,
  getToolDescription,
  getToolGradient,
  getToolLabel,
  getWordCount,
  truncateText,
} from "../../lib/utils";
import {
  getCreationErrorMessage,
  getCreationPreview,
  getCreationTitle,
  useCreationFromCache,
  useCreations,
  useDeleteCreation,
} from "../../hooks/useCreations";
import type { PublicCreation } from "../../lib/api";

export default function CreationDetails() {
  const navigate = useNavigate();
  const params = useParams();

  const creationId = params.creationId ?? params.id;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const cachedCreation = useCreationFromCache(creationId);

  const creationsQuery = useCreations(
    {
      page: 1,
      limit: 100,
      includeFailed: true,
    },
    {
      enabled: !cachedCreation,
    },
  );

  const creation = useMemo(() => {
    if (cachedCreation) return cachedCreation;

    return creationsQuery.data?.creations.find(
      (item) => item.id === creationId,
    );
  }, [cachedCreation, creationsQuery.data?.creations, creationId]);

  const relatedCreations = useMemo(() => {
    const items = creationsQuery.data?.creations ?? [];

    if (!creation) return [];

    return items
      .filter((item) => item.id !== creation.id)
      .filter((item) => item.toolType === creation.toolType)
      .slice(0, 3);
  }, [creation, creationsQuery.data?.creations]);

  const deleteCreationMutation = useDeleteCreation({
    onSuccess: () => {
      toast.success("Creation deleted successfully.");
      navigate(ROUTES.creations);
    },
    onError: (error) => {
      toast.error(getCreationErrorMessage(error));
    },
  });

  const isLoading = creationsQuery.isLoading || creationsQuery.isFetching;

  if (isLoading && !creation) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[28rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading creation...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching saved result from your Neon database.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (creationsQuery.isError && !creation) {
    return (
      <Card padding="xl">
        <EmptyState
          variant="history"
          title="Could not load this creation"
          description={getCreationErrorMessage(creationsQuery.error)}
          primaryAction={{
            label: "Back to Creations",
            onClick: () => navigate(ROUTES.creations),
            variant: "primary",
            icon: <ArrowLeft size={17} />,
          }}
        />
      </Card>
    );
  }

  if (!creation) {
    return (
      <Card padding="xl">
        <EmptyState
          variant="history"
          title="Creation not found"
          description="This saved creation may have been deleted, or it is not available in your current history page."
          primaryAction={{
            label: "Back to Creations",
            onClick: () => navigate(ROUTES.creations),
            variant: "primary",
            icon: <ArrowLeft size={17} />,
          }}
        />
      </Card>
    );
  }

  const isImage = Boolean(creation.resultImageUrl);
  const isText = Boolean(creation.resultText);
  const title = getCreationTitle(creation);

  async function handleCopy() {
    if (!creation) return;

    const content = creation.resultText || creation.prompt || "";

    if (!content.trim()) {
      toast.error("There is no text to copy.");
      return;
    }

    await copyToClipboard(content);
    toast.success("Copied to clipboard.");
  }

  async function handleCopyPrompt() {
    if (!creation) return;

    const content = creation.prompt || title;

    if (!content.trim()) {
      toast.error("There is no prompt to copy.");
      return;
    }

    await copyToClipboard(content);
    toast.success("Prompt copied.");
  }

  function handleDownload() {
    if (!creation) return;

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

      toast.success("Text file downloaded.");
      return;
    }

    toast.error("There is nothing to download.");
  }

  function handleDelete() {
    if (!creation) return;

    deleteCreationMutation.mutate({
      creationId: creation.id,
      deleteCloudinaryAsset: true,
    });

    setIsDeleteModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10">
        <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative">
          <Link
            to={ROUTES.creations}
            className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to creations
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="premium"
                  icon={<WandSparkles className="h-3.5 w-3.5" />}
                >
                  Creation Details
                </Badge>

                <StatusBadge status={creation.status} />

                {creation.isFavorite && (
                  <Badge
                    variant="warning"
                    icon={<Star className="h-3.5 w-3.5 fill-current" />}
                  >
                    Favorite
                  </Badge>
                )}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                {getToolDescription(creation.toolType)}
              </p>
            </div>

            <div
              className={cn(
                "grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br text-white shadow-2xl",
                getToolGradient(creation.toolType),
              )}
            >
              {isImage ? <ImageIcon size={34} /> : <FileText size={34} />}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailMetric
              label="Tool"
              value={getToolLabel(creation.toolType)}
              icon={<Sparkles size={17} />}
            />

            <DetailMetric
              label="Created"
              value={formatRelativeTime(creation.createdAt)}
              icon={<CalendarClock size={17} />}
            />

            <DetailMetric
              label={isImage ? "Output" : "Words"}
              value={
                isImage
                  ? "Image"
                  : String(getWordCount(creation.resultText || ""))
              }
              icon={isImage ? <ImageIcon size={17} /> : <FileText size={17} />}
            />

            <DetailMetric
              label="Status"
              value={capitalize(creation.status)}
              icon={<BadgeCheck size={17} />}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <Card padding="xl" className="relative overflow-hidden">
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                getToolGradient(creation.toolType),
              )}
            />

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <Badge
                  variant="primary"
                  icon={<Eye className="h-3.5 w-3.5" />}
                >
                  Result Preview
                </Badge>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Generated Output
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  View, copy, download, or delete this saved result.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isText && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Copy size={16} />}
                    onClick={handleCopy}
                  >
                    Copy
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </div>
            </div>

            <div className="mt-6 min-h-[34rem] rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
              {isImage && creation.resultImageUrl ? (
                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
                  <img
                    src={creation.resultImageUrl}
                    alt={title}
                    className="max-h-[42rem] w-full object-contain"
                  />

                  <div className="border-t border-slate-200 p-4 dark:border-white/10">
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      Generated image output
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Stored image URL is loaded from your saved creation record.
                    </p>
                  </div>
                </div>
              ) : isText && creation.resultText ? (
                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-slate-700 dark:text-slate-200">
                    {creation.resultText}
                  </pre>
                </article>
              ) : (
                <EmptyState
                  variant="tool"
                  title="No output available"
                  description={
                    creation.status === "failed"
                      ? creation.errorMessage ||
                        "This generation failed before a result was saved."
                      : "This creation does not have a saved result yet."
                  }
                  size="lg"
                />
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Button
                variant="secondary"
                leftIcon={<Share2 size={17} />}
                onClick={handleCopyPrompt}
                fullWidth
              >
                Copy Prompt
              </Button>

              <Button
                variant="secondary"
                leftIcon={<Download size={17} />}
                onClick={handleDownload}
                fullWidth
              >
                Download
              </Button>

              <Button
                variant="danger"
                leftIcon={<Trash2 size={17} />}
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={deleteCreationMutation.isPending}
                fullWidth
              >
                {deleteCreationMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </Card>

          <Card padding="xl">
            <Badge
              variant="muted"
              icon={<Clipboard className="h-3.5 w-3.5" />}
            >
              Original Prompt
            </Badge>

            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              User Input
            </h2>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">
                {creation.prompt || "No prompt was saved for this creation."}
              </p>
            </div>

            <Button
              variant="secondary"
              leftIcon={<Copy size={17} />}
              onClick={handleCopyPrompt}
              className="mt-5"
            >
              Copy Prompt
            </Button>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card padding="xl">
            <Badge
              variant="primary"
              icon={<Info className="h-3.5 w-3.5" />}
            >
              Metadata
            </Badge>

            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              Creation Info
            </h2>

            <div className="mt-6 grid gap-3">
              <MetadataRow label="Creation ID" value={creation.id} />
              <MetadataRow
                label="Tool Type"
                value={getToolLabel(creation.toolType)}
              />
              <MetadataRow
                label="Created At"
                value={formatDate(creation.createdAt)}
              />
              <MetadataRow
                label="Updated At"
                value={formatDate(creation.updatedAt)}
              />
              <MetadataRow
                label="Status"
                value={capitalize(creation.status)}
              />
              <MetadataRow
                label="Favorite"
                value={creation.isFavorite ? "Yes" : "No"}
              />

              <MetadataRow
                label="File Size"
                value={
                  getOriginalFileSize(creation) !== null
                    ? formatFileSize(getOriginalFileSize(creation)!)
                    : "Not available"
                }
              />

              {Object.entries(creation.metadata ?? {}).map(([key, value]) => (
                <MetadataRow
                  key={key}
                  label={formatMetadataLabel(key)}
                  value={formatMetadataValue(value)}
                />
              ))}
            </div>
          </Card>

          <Card padding="xl">
            <Badge
              variant="success"
              icon={<Layers3 className="h-3.5 w-3.5" />}
            >
              Related
            </Badge>

            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              Similar Creations
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Other saved results from the same tool type.
            </p>

            <div className="mt-6 space-y-3">
              {relatedCreations.length ? (
                relatedCreations.map((item) => (
                  <RelatedCreationCard
                    key={item.id}
                    creation={item}
                    onOpen={() => navigate(`${ROUTES.creations}/${item.id}`)}
                  />
                ))
              ) : (
                <EmptyState
                  variant="history"
                  title="No related creations"
                  description="Generate more with this tool to see related results here."
                  size="sm"
                />
              )}
            </div>
          </Card>

          <Card padding="xl">
            <Badge
              variant="premium"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Actions
            </Badge>

            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              Keep working
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Return to your creation archive or generate another result.
            </p>

            <div className="mt-5 grid gap-3">
              <Link to={ROUTES.creations}>
                <Button
                  variant="secondary"
                  leftIcon={<ArrowLeft size={17} />}
                  fullWidth
                >
                  Back to Creations
                </Button>
              </Link>

              <Button
                variant="danger"
                leftIcon={<Trash2 size={17} />}
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={deleteCreationMutation.isPending}
                fullWidth
              >
                Delete Creation
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete this creation?"
        description="This will permanently remove the saved creation from your database."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteCreationMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              leftIcon={
                deleteCreationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle size={17} />
                )
              }
              onClick={handleDelete}
              disabled={deleteCreationMutation.isPending}
            >
              {deleteCreationMutation.isPending
                ? "Deleting..."
                : "Delete Creation"}
            </Button>
          </div>
        }
      >
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
          <p className="text-sm font-semibold leading-6 text-rose-700 dark:text-rose-200">
            You are about to delete “{title}”. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-cyan-200">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-black text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>

      <span className="max-w-[12rem] break-words text-right text-sm font-bold text-slate-700 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}

function RelatedCreationCard({
  creation,
  onOpen,
}: {
  creation: PublicCreation;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white",
            getToolGradient(creation.toolType),
          )}
        >
          {creation.resultImageUrl ? <ImageIcon size={17} /> : <FileText size={17} />}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
            {getCreationTitle(creation)}
          </p>

          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
            {truncateText(getCreationPreview(creation), 90)}
          </p>
        </div>
      </div>
    </button>
  );
}

function getOriginalFileSize(creation: PublicCreation) {
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

function formatMetadataLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}