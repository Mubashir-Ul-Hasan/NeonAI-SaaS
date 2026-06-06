import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Download,
  History,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";

import {
  PremiumGate,
  PremiumToolBanner,
} from "../../components/dashboard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/Loader";
import { PromptTextarea } from "../../components/ui/Textarea";
import {
  ACCEPTED_IMAGE_TYPES,
  FILE_UPLOAD_HELPER_TEXT,
  MAX_IMAGE_SIZE_MB,
  TOAST_MESSAGES,
} from "../../lib/constants";
import {
  cn,
  formatDate,
  formatFileSize,
  truncateText,
  type UserPlan,
} from "../../lib/utils";

type ObjectRemovalHistoryItem = {
  id: string;
  fileName: string;
  fileSize: number;
  prompt: string;
  inputImageUrl: string;
  resultImageUrl: string;
  createdAt: string;
};

const objectPromptExamples = [
  "Remove the person standing in the background.",
  "Remove the car from the left side of the image.",
  "Remove the watermark from the corner.",
  "Remove the chair beside the table.",
  "Remove the unwanted object near the center.",
];

export default function RemoveObject() {
  const { user } = useUser();

  const plan = useMemo<UserPlan>(() => {
    const publicPlan = user?.publicMetadata?.plan;

    return publicPlan === "premium" ? "premium" : "free";
  }, [user?.publicMetadata?.plan]);

  return (
    <PremiumGate plan={plan} toolType="object-removal" showPreview>
      <RemoveObjectWorkspace plan={plan} />
    </PremiumGate>
  );
}

function RemoveObjectWorkspace({ plan }: { plan: UserPlan }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputImageUrl, setInputImageUrl] = useState("");
  const [resultImageUrl, setResultImageUrl] = useState("");
  const [objectPrompt, setObjectPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<ObjectRemovalHistoryItem[]>([]);

  useEffect(() => {
    return () => {
      if (inputImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(inputImageUrl);
      }
    };
  }, [inputImageUrl]);

  function validateImageFile(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as never)) {
      toast.error("Please upload a JPG, PNG, or WebP image.");
      return false;
    }

    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;

    if (file.size > maxBytes) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      return false;
    }

    return true;
  }

  function handleSelectFile(file: File) {
    if (!validateImageFile(file)) return;

    if (inputImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(inputImageUrl);
    }

    const nextUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setInputImageUrl(nextUrl);
    setResultImageUrl("");
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    handleSelectFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    handleSelectFile(file);
  }

  function handleRemoveFile() {
    if (inputImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(inputImageUrl);
    }

    setSelectedFile(null);
    setInputImageUrl("");
    setResultImageUrl("");
  }

  function handleRemoveObject() {
    const cleanPrompt = objectPrompt.trim();

    if (!selectedFile || !inputImageUrl) {
      toast.error("Please upload an image first.");
      return;
    }

    if (cleanPrompt.length < 5) {
      toast.error("Please describe the object you want to remove.");
      return;
    }

    setIsProcessing(true);
    setResultImageUrl("");

    window.setTimeout(() => {
      setResultImageUrl(inputImageUrl);
      setIsProcessing(false);

      const historyItem: ObjectRemovalHistoryItem = {
        id: crypto.randomUUID(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        prompt: cleanPrompt,
        inputImageUrl,
        resultImageUrl: inputImageUrl,
        createdAt: new Date().toISOString(),
      };

      setHistory((current) => [historyItem, ...current].slice(0, 10));
      toast.success(TOAST_MESSAGES.generationCompleted);
    }, 1350);
  }

  function handleDownload() {
    if (!resultImageUrl) {
      toast.error("There is no processed image to download yet.");
      return;
    }

    const link = document.createElement("a");

    link.href = resultImageUrl;
    link.download = selectedFile
      ? `quickai-object-removed-${selectedFile.name}`
      : "quickai-object-removed-image.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(TOAST_MESSAGES.downloaded);
  }

  function handleLoadHistory(item: ObjectRemovalHistoryItem) {
    setSelectedFile(null);
    setInputImageUrl(item.inputImageUrl);
    setResultImageUrl(item.resultImageUrl);
    setObjectPrompt(item.prompt);

    toast.success("Loaded previous object removal.");
  }

  return (
    <div className="space-y-6">
      <PremiumToolBanner plan={plan} toolType="object-removal" />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <Card padding="xl" className="relative overflow-hidden">
            <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    variant="premium"
                    icon={<Crown className="h-3.5 w-3.5" />}
                  >
                    Premium Tool
                  </Badge>

                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Remove Object
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Upload an image, describe the unwanted object, and generate a
                    cleaned version. Later this will connect to a professional
                    object removal API.
                  </p>
                </div>

                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] bg-gradient-to-br from-rose-500 via-fuchsia-600 to-violet-600 text-white shadow-xl shadow-rose-500/25">
                  <WandSparkles size={28} />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative overflow-hidden rounded-[2rem] border-2 border-dashed p-6 text-center transition",
                    isDragging
                      ? "border-fuchsia-500 bg-fuchsia-500/10"
                      : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-white dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
                  )}
                >
                  {inputImageUrl ? (
                    <div className="text-left">
                      <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                        <img
                          src={inputImageUrl}
                          alt={selectedFile?.name || "Uploaded image"}
                          className="max-h-80 w-full object-contain"
                        />

                        <ObjectTargetOverlay visible={!resultImageUrl} />

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-2xl bg-slate-950/70 text-white backdrop-blur-xl transition hover:bg-rose-500"
                          aria-label="Remove uploaded image"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300">
                            <ImageIcon size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                              {selectedFile?.name || "Previously processed image"}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {selectedFile
                                ? formatFileSize(selectedFile.size)
                                : "Loaded from history"}
                            </p>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10">
                      <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-rose-500 via-fuchsia-600 to-violet-600 text-white shadow-xl shadow-rose-500/20">
                        <UploadCloud size={34} />
                      </div>

                      <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">
                        Upload image
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Drag and drop your image here, or click the button below
                        to browse from your device.
                      </p>

                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6"
                        rightIcon={<ArrowRight size={17} />}
                      >
                        Choose Image
                      </Button>

                      <p className="mt-4 text-xs font-semibold text-slate-400">
                        {FILE_UPLOAD_HELPER_TEXT}
                      </p>
                    </div>
                  )}
                </div>

                <PromptTextarea
                  label="Object to Remove"
                  value={objectPrompt}
                  onChange={(event) => setObjectPrompt(event.target.value)}
                  placeholder="Example: Remove the person standing in the background..."
                  maxLength={700}
                  disabled={isProcessing}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                      <BadgeCheck size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">
                        Describe the object clearly
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Mention location, color, and type of object. Example:
                        “remove the red bag on the floor.”
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  fullWidth
                  size="xl"
                  variant="premium"
                  onClick={handleRemoveObject}
                  isLoading={isProcessing}
                  rightIcon={<Sparkles size={19} />}
                  disabled={!inputImageUrl}
                >
                  {isProcessing ? "Removing Object..." : "Remove Object"}
                </Button>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Badge
                  variant="muted"
                  icon={<WandSparkles className="h-3.5 w-3.5" />}
                >
                  Prompt Ideas
                </Badge>

                <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                  Try a clear instruction
                </h2>
              </div>

              <RefreshCw className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 grid gap-3">
              {objectPromptExamples.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setObjectPrompt(item)}
                  disabled={isProcessing}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold leading-6 text-slate-600 transition hover:-translate-y-0.5 hover:bg-white hover:text-violet-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07] dark:hover:text-violet-300"
                >
                  {item}
                </button>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <Card padding="xl" className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <Badge
                    variant={
                      isProcessing
                        ? "info"
                        : resultImageUrl
                          ? "success"
                          : "muted"
                    }
                    icon={
                      isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <WandSparkles className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {isProcessing
                      ? "Cleaning image..."
                      : resultImageUrl
                        ? "Object Removed"
                        : "Result Preview"}
                  </Badge>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Cleaned Image
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Preview the cleaned image, then download or save it to your
                    creation history.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  onClick={handleDownload}
                  disabled={!resultImageUrl}
                >
                  Download
                </Button>
              </div>

              {isProcessing && (
                <div className="mt-6">
                  <ProgressBar value={76} label="Object removal progress" />
                </div>
              )}

              <div className="mt-6 min-h-[34rem] rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
                {resultImageUrl ? (
                  <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="relative grid min-h-[30rem] place-items-center bg-slate-100 p-5 dark:bg-slate-900">
                      <img
                        src={resultImageUrl}
                        alt="Object removed result"
                        className="max-h-[30rem] w-full rounded-2xl object-contain"
                      />

                      <div className="pointer-events-none absolute bottom-5 left-5 right-5 rounded-3xl border border-white/20 bg-slate-950/70 p-4 text-white backdrop-blur-xl">
                        <Badge
                          variant="premium"
                          icon={<Crown className="h-3.5 w-3.5" />}
                        >
                          Demo cleaned preview
                        </Badge>

                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-200">
                          Removed object: {objectPrompt || "Selected object"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            Object removal result
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Real API output will replace this demo preview.
                          </p>
                        </div>

                        <Badge
                          variant="premium"
                          icon={<Crown className="h-3.5 w-3.5" />}
                        >
                          Premium
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    variant="image"
                    title="Your cleaned image will appear here"
                    description="Upload an image, describe what to remove, then click Remove Object."
                    size="lg"
                  />
                )}
              </div>

              {resultImageUrl && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    leftIcon={<Download size={17} />}
                    onClick={handleDownload}
                    fullWidth
                  >
                    Download Image
                  </Button>

                  <Button
                    variant="dark"
                    leftIcon={<Save size={17} />}
                    onClick={() =>
                      toast.success("Image will be saved to Cloudinary later.")
                    }
                    fullWidth
                  >
                    Save to History
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Badge
                  variant="primary"
                  icon={<History className="h-3.5 w-3.5" />}
                >
                  Previous History
                </Badge>

                <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                  Recent Object Removals
                </h2>
              </div>

              <RefreshCw className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 space-y-3">
              {history.length ? (
                history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLoadHistory(item)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                      <img
                        src={item.resultImageUrl}
                        alt={item.fileName}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {truncateText(item.prompt, 80)}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {formatFileSize(item.fileSize)} •{" "}
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))
              ) : (
                <EmptyState
                  variant="history"
                  title="No object removal history yet"
                  description="Processed images will appear here during this session. Later we’ll save them permanently in Cloudinary and Neon."
                  size="sm"
                />
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

function ObjectTargetOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="relative h-28 w-28 rounded-[2rem] border-2 border-dashed border-white bg-rose-500/20 shadow-2xl shadow-rose-500/20 backdrop-blur-[1px]">
        <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white shadow-lg" />
        <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-white shadow-lg" />
        <div className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-white shadow-lg" />
        <div className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-white shadow-lg" />

        <div className="absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-black text-white backdrop-blur-xl">
            Target
          </span>
        </div>
      </div>
    </div>
  );
}