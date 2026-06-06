import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Clipboard,
  Copy,
  Download,
  Hash,
  History,
  Lightbulb,
  ListChecks,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
  Tags,
  WandSparkles,
} from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import {
  BLOG_CATEGORY_OPTIONS,
  BLOG_TITLE_STYLE_OPTIONS,
  TOAST_MESSAGES,
} from "../../lib/constants";
import {
  cn,
  copyToClipboard,
  downloadTextFile,
  formatDate,
  truncateText,
} from "../../lib/utils";
import {
  generateTitles,
  getApiErrorMessage,
  type GenerateTitlesResponse,
} from "../../lib/api";

type BlogTitleHistoryItem = {
  id: string;
  prompt: string;
  category: string;
  style: string;
  count: number;
  titles: string[];
  createdAt: string;
};

const starterTopics = [
  "AI tools for small business owners",
  "Remote work productivity for software engineers",
  "Beginner guide to building a SaaS product",
  "How students can use AI for better learning",
  "Marketing ideas for a new startup",
];

const titleCountOptions = [5, 8, 10, 12];

export default function BlogTitles() {
  const { getToken } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [category, setCategory] =
    useState<(typeof BLOG_CATEGORY_OPTIONS)[number]>("Technology");
  const [style, setStyle] =
    useState<(typeof BLOG_TITLE_STYLE_OPTIONS)[number]>("SEO Optimized");
  const [count, setCount] = useState(8);
  const [titles, setTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<BlogTitleHistoryItem[]>([]);
  const [lastResponse, setLastResponse] =
    useState<GenerateTitlesResponse | null>(null);

  const titleText = useMemo(() => titles.join("\n"), [titles]);
  const hasResult = titles.length > 0;

  async function handleGenerate() {
    const cleanPrompt = prompt.trim();

    if (cleanPrompt.length < 3) {
      toast.error("Please enter a blog topic first.");
      return;
    }

    setIsGenerating(true);
    setTitles([]);
    setLastResponse(null);

    try {
      const token = await getToken({
        skipCache: true,
      });

      const response = await generateTitles(
        {
          topic: cleanPrompt,
          category,
          style,
          count,
        },
        {
          token,
        },
      );

      setTitles(response.titles);
      setLastResponse(response);

      const historyItem: BlogTitleHistoryItem = {
        id: response.creation.id,
        prompt: cleanPrompt,
        category,
        style,
        count,
        titles: response.titles,
        createdAt: response.creation.createdAt,
      };

      setHistory((current) => [historyItem, ...current].slice(0, 10));

      toast.success(TOAST_MESSAGES.generationCompleted);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Blog title generation failed."));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyAll() {
    if (!titles.length) {
      toast.error("There are no titles to copy yet.");
      return;
    }

    await copyToClipboard(titleText);
    toast.success(TOAST_MESSAGES.copied);
  }

  async function handleCopySingle(title: string) {
    await copyToClipboard(title);
    toast.success("Title copied.");
  }

  function handleDownload() {
    if (!titles.length) {
      toast.error("There are no titles to download yet.");
      return;
    }

    downloadTextFile({
      filename: "quickai-blog-titles.txt",
      content: titleText,
    });

    toast.success(TOAST_MESSAGES.downloaded);
  }

  function handleLoadHistory(item: BlogTitleHistoryItem) {
    setPrompt(item.prompt);
    setCategory(item.category as (typeof BLOG_CATEGORY_OPTIONS)[number]);
    setStyle(item.style as (typeof BLOG_TITLE_STYLE_OPTIONS)[number]);
    setCount(item.count);
    setTitles(item.titles);

    toast.success("Loaded previous title set.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-6">
        <Card padding="xl" className="relative overflow-hidden">
          <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge
                  variant="success"
                  icon={<Hash className="h-3.5 w-3.5" />}
                >
                  Free Tool
                </Badge>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Blog Titles
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Enter a blog topic, choose a category and style, then generate
                  catchy SEO-friendly titles using your backend Gemini API.
                </p>
              </div>

              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-500 text-white shadow-xl shadow-violet-500/25">
                <Megaphone size={28} />
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <Input
                label="Blog Topic"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: Remote work productivity tips for software engineers..."
                leftIcon={<Search className="h-4 w-4" />}
                inputSize="lg"
                variant="glass"
                disabled={isGenerating}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Blog Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target
                          .value as (typeof BLOG_CATEGORY_OPTIONS)[number],
                      )
                    }
                    disabled={isGenerating}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  >
                    {BLOG_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Title Style
                  </label>

                  <select
                    value={style}
                    onChange={(event) =>
                      setStyle(
                        event.target
                          .value as (typeof BLOG_TITLE_STYLE_OPTIONS)[number],
                      )
                    }
                    disabled={isGenerating}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  >
                    {BLOG_TITLE_STYLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Number of Titles
                </label>

                <div className="mt-2 grid grid-cols-4 gap-2">
                  {titleCountOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCount(option)}
                      disabled={isGenerating}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
                        count === option
                          ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                    <WandSparkles size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      Backend connected
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      This page now calls{" "}
                      <span className="font-black">/api/generate-titles</span>{" "}
                      and saves the result to Neon.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                onClick={handleGenerate}
                disabled={isGenerating}
                rightIcon={
                  isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight size={17} />
                  )
                }
              >
                {isGenerating ? "Generating Titles..." : "Generate Titles"}
              </Button>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge
                variant="muted"
                icon={<Lightbulb className="h-3.5 w-3.5" />}
              >
                Starter Topics
              </Badge>

              <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                Need an idea?
              </h2>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => setPrompt("")}
              disabled={isGenerating}
            >
              Clear
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {starterTopics.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                disabled={isGenerating}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold leading-6 text-slate-600 transition hover:-translate-y-0.5 hover:bg-white hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07] dark:hover:text-violet-300"
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <div>
            <Badge
              variant="primary"
              icon={<History className="h-3.5 w-3.5" />}
            >
              Session History
            </Badge>

            <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
              Recent title sets
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {history.length ? (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLoadHistory(item)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                      {truncateText(item.prompt, 80)}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.count} titles • {item.style} •{" "}
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))
            ) : (
              <EmptyState
                variant="history"
                title="No title history yet"
                description="Generated title sets from this session will appear here."
                size="sm"
              />
            )}
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <Card padding="xl" className="min-h-[42rem]">
          <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-start">
            <div>
              <Badge
                variant={isGenerating ? "info" : hasResult ? "success" : "muted"}
                icon={
                  isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ListChecks className="h-3.5 w-3.5" />
                  )
                }
              >
                {isGenerating
                  ? "AI is generating..."
                  : hasResult
                    ? "Generated Result"
                    : "Result Preview"}
              </Badge>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Blog Title Output
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Review your generated title ideas, then copy or download them.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Copy size={16} />}
                onClick={handleCopyAll}
                disabled={!hasResult || isGenerating}
              >
                Copy All
              </Button>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={handleDownload}
                disabled={!hasResult || isGenerating}
              >
                Download
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <TitleMetric
              label="Titles"
              value={String(titles.length)}
              icon={<ListChecks size={17} />}
            />

            <TitleMetric
              label="Category"
              value={category}
              icon={<Tags size={17} />}
            />

            <TitleMetric
              label="Saved"
              value={lastResponse ? "Yes" : "No"}
              icon={<BadgeCheck size={17} />}
            />
          </div>

          <div className="mt-6 min-h-[30rem] rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
            {isGenerating && !hasResult ? (
              <div className="grid min-h-[26rem] place-items-center">
                <div className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>

                  <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
                    Creating your titles...
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Keep this page open while your backend generates and saves
                    the title set.
                  </p>
                </div>
              </div>
            ) : hasResult ? (
              <div className="space-y-3">
                {titles.map((title, index) => (
                  <div
                    key={`${title}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-sm font-black text-violet-600 dark:text-violet-300">
                          {index + 1}
                        </div>

                        <p className="pt-1 text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">
                          {title}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopySingle(title)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-white/10 dark:hover:text-violet-300"
                        aria-label="Copy title"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="tool"
                title="Your blog titles will appear here"
                description="Enter a topic, choose your settings, then click Generate Titles."
                size="lg"
                primaryAction={{
                  label: "Use Starter Topic",
                  onClick: () => setPrompt(starterTopics[0]),
                  variant: "primary",
                  icon: <Clipboard size={17} />,
                }}
              />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function TitleMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
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