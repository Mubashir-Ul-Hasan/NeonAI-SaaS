import { useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  Copy,
  Download,
  History,
  ImageIcon,
  Loader2,
  Maximize2,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/Loader";
import { PromptTextarea } from "../../components/ui/Textarea";
import {
  IMAGE_SIZE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  TOAST_MESSAGES,
} from "../../lib/constants";
import {
  cn,
  copyToClipboard,
  formatDate,
  truncateText,
} from "../../lib/utils";

type ImageStyle = (typeof IMAGE_STYLE_OPTIONS)[number]["value"];
type ImageSize = (typeof IMAGE_SIZE_OPTIONS)[number]["value"];

type ImageHistoryItem = {
  id: string;
  prompt: string;
  negativePrompt?: string;
  style: ImageStyle;
  size: ImageSize;
  imageUrl: string;
  createdAt: string;
};

type GenerateImageApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    imageUrl?: string;
    resultImageUrl?: string;
    outputUrl?: string;
    url?: string;
    image?: {
      imageUrl?: string;
      resultImageUrl?: string;
    };
    creation?: {
      id?: string;
      resultImageUrl?: string | null;
      createdAt?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
};

const starterPrompts = [
  "A futuristic AI workspace floating above a neon city, cinematic lighting",
  "A premium SaaS dashboard interface, glassmorphism, dark mode, ultra clean",
  "A robot artist creating colorful digital art in a modern studio",
  "A luxury product photo of a glowing crystal device on a black background",
  "A peaceful cyberpunk coffee shop with programmers working at night",
];

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

function getApiUrl(path: string) {
  if (!API_BASE_URL) return path;

  return `${API_BASE_URL}${path}`;
}

function extractImageUrl(payload: GenerateImageApiResponse) {
  return (
    payload.data?.imageUrl ||
    payload.data?.resultImageUrl ||
    payload.data?.outputUrl ||
    payload.data?.url ||
    payload.data?.image?.imageUrl ||
    payload.data?.image?.resultImageUrl ||
    payload.data?.creation?.resultImageUrl ||
    ""
  );
}

function getImageExtension(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();

    if (pathname.endsWith(".webp")) return "webp";
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "jpg";
    if (pathname.endsWith(".png")) return "png";

    return "png";
  } catch {
    return "png";
  }
}

export default function GenerateImage() {
  return <GenerateImageWorkspace />;
}

function GenerateImageWorkspace() {
  const { getToken } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState<ImageStyle>("realistic");
  const [size, setSize] = useState<ImageSize>("square");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);

  const selectedStyle = useMemo(
    () => IMAGE_STYLE_OPTIONS.find((item) => item.value === style),
    [style],
  );

  const selectedSize = useMemo(
    () => IMAGE_SIZE_OPTIONS.find((item) => item.value === size),
    [size],
  );

  async function handleGenerate() {
    const cleanPrompt = prompt.trim();
    const cleanNegativePrompt = negativePrompt.trim();

    if (cleanPrompt.length < 5) {
      toast.error("Please enter a clear image prompt first.");
      return;
    }

    try {
      setIsGenerating(true);
      setImageUrl("");

      const token = await getToken({
        skipCache: true,
      });

      if (!token) {
        toast.error("You must be signed in to generate images.");
        return;
      }

      const response = await fetch(getApiUrl("/api/generate-image"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          negativePrompt: cleanNegativePrompt || undefined,
          style,
          size,
        }),
      });

      const payload = (await response.json()) as GenerateImageApiResponse;

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error?.message ||
            payload.message ||
            "Image generation failed.",
        );
      }

      const generatedImageUrl = extractImageUrl(payload);

      if (!generatedImageUrl) {
        throw new Error("No image URL was returned from the backend.");
      }

      setImageUrl(generatedImageUrl);

      const historyItem: ImageHistoryItem = {
        id: payload.data?.creation?.id ?? crypto.randomUUID(),
        prompt: cleanPrompt,
        negativePrompt: cleanNegativePrompt || undefined,
        style,
        size,
        imageUrl: generatedImageUrl,
        createdAt: payload.data?.creation?.createdAt ?? new Date().toISOString(),
      };

      setHistory((current) => [historyItem, ...current].slice(0, 10));
      toast.success(TOAST_MESSAGES.generationCompleted);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again later.";

      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyPrompt() {
    if (!prompt.trim()) {
      toast.error("There is no prompt to copy.");
      return;
    }

    await copyToClipboard(prompt);
    toast.success(TOAST_MESSAGES.copied);
  }

  async function handleCopyImageUrl() {
    if (!imageUrl) {
      toast.error("There is no generated image URL yet.");
      return;
    }

    await copyToClipboard(imageUrl);
    toast.success("Image URL copied.");
  }

  async function handleDownloadImage() {
    if (!imageUrl) {
      toast.error("There is no image to download yet.");
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const extension = getImageExtension(imageUrl);

      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `quickai-generated-image.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);

      toast.success(TOAST_MESSAGES.downloaded);
    } catch {
      toast.error("Unable to download the generated image.");
    }
  }

  function handleLoadHistory(item: ImageHistoryItem) {
    setPrompt(item.prompt);
    setNegativePrompt(item.negativePrompt ?? "");
    setStyle(item.style);
    setSize(item.size);
    setImageUrl(item.imageUrl);

    toast.success("Loaded previous image generation.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <Card padding="xl" className="relative overflow-hidden">
            <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    variant="primary"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Free Tool
                  </Badge>

                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Generate Image
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Describe your idea, choose a visual style and image size,
                    then generate a free AI image.
                  </p>
                </div>

                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-xl shadow-cyan-500/25">
                  <ImageIcon size={28} />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <PromptTextarea
                  label="Image Prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: A futuristic workspace floating above a neon city, cinematic lighting..."
                  maxLength={1200}
                  disabled={isGenerating}
                />

                <Input
                  label="Negative Prompt"
                  helperText="Optional: describe what you do not want in the image."
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="Example: blurry, low quality, distorted face..."
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  variant="glass"
                  disabled={isGenerating}
                />

                <div>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Image Style
                  </label>

                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    {IMAGE_STYLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStyle(option.value)}
                        disabled={isGenerating}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                          style === option.value
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white">
                            <Palette size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-black">
                              {option.label}
                            </p>

                            <p className="mt-1 line-clamp-1 text-xs font-semibold opacity-75">
                              {option.promptPrefix}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Image Size
                  </label>

                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    {IMAGE_SIZE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSize(option.value)}
                        disabled={isGenerating}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5",
                          size === option.value
                            ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]",
                        )}
                      >
                        <p className="text-sm font-black">{option.label}</p>
                        <p className="mt-1 text-xs font-semibold opacity-75">
                          {option.value}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  fullWidth
                  size="xl"
                  variant="primary"
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  rightIcon={<Sparkles size={19} />}
                >
                  {isGenerating ? "Generating Image..." : "Generate Image"}
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
                  Starter Prompts
                </Badge>

                <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                  Try a visual idea
                </h2>
              </div>

              <RefreshCw className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 grid gap-3">
              {starterPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(item)}
                  disabled={isGenerating}
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
            <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <Badge
                    variant={
                      isGenerating ? "info" : imageUrl ? "success" : "muted"
                    }
                    icon={
                      isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {isGenerating
                      ? "Creating visual..."
                      : imageUrl
                        ? "Generated Image"
                        : "Image Preview"}
                  </Badge>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Image Output
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Preview the generated image, then download or copy the image
                    URL.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Copy size={16} />}
                    onClick={handleCopyPrompt}
                    disabled={!prompt}
                  >
                    Prompt
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Copy size={16} />}
                    onClick={handleCopyImageUrl}
                    disabled={!imageUrl}
                  >
                    URL
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download size={16} />}
                    onClick={handleDownloadImage}
                    disabled={!imageUrl}
                  >
                    Download
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <ImageMetric
                  label="Style"
                  value={selectedStyle?.label ?? "Realistic"}
                  icon={<Palette size={17} />}
                />
                <ImageMetric
                  label="Size"
                  value={selectedSize?.label ?? "Square"}
                  icon={<Maximize2 size={17} />}
                />
                <ImageMetric
                  label="Type"
                  value="AI Image"
                  icon={<Sparkles size={17} />}
                />
              </div>

              {isGenerating && (
                <div className="mt-6">
                  <ProgressBar value={68} label="Generation progress" />
                </div>
              )}

              <div className="mt-6 min-h-[34rem] rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
                {imageUrl ? (
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
                    <img
                      src={imageUrl}
                      alt={prompt}
                      className="aspect-square w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5">
                      <Badge
                        variant="success"
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                      >
                        Generated Image
                      </Badge>

                      <p className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-white">
                        {prompt}
                      </p>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    variant="image"
                    title="Your generated image will appear here"
                    description="Enter a prompt, choose style and size, then click Generate Image."
                    size="lg"
                  />
                )}
              </div>

              {imageUrl && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    leftIcon={<Download size={17} />}
                    onClick={handleDownloadImage}
                    fullWidth
                  >
                    Download Image
                  </Button>

                  <Button
                    variant="dark"
                    leftIcon={<Save size={17} />}
                    onClick={() =>
                      toast.success("Image is already saved to your history.")
                    }
                    fullWidth
                  >
                    Saved to History
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
                  Recent Images
                </h2>
              </div>
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
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {truncateText(item.prompt, 80)}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {item.style} • {item.size} • {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState
                  variant="history"
                  title="No image history yet"
                  description="Generated images from this session will appear here."
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

function ImageMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
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