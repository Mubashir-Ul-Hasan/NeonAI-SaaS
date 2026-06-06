import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpenText,
  Clipboard,
  Copy,
  Download,
  FileText,
  History,
  Loader2,
  PenLine,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PromptTextarea } from "../../components/ui/Textarea";
import {
  ARTICLE_LENGTH_OPTIONS,
  ARTICLE_TONE_OPTIONS,
  TOAST_MESSAGES,
} from "../../lib/constants";
import {
  cn,
  copyToClipboard,
  downloadTextFile,
  formatDate,
  getWordCount,
  readingTime,
  truncateText,
} from "../../lib/utils";
import {
  generateArticle,
  getApiErrorMessage,
  type GenerateArticleResponse,
} from "../../lib/api";

type ArticleLength = "short" | "medium" | "long";

type ArticleHistoryItem = {
  id: string;
  prompt: string;
  title: string;
  article: string;
  length: ArticleLength;
  tone: string;
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: string;
};

const starterPrompts = [
  "Write an article about how AI tools help small businesses grow.",
  "Explain why full-stack SaaS products need strong user onboarding.",
  "Write a beginner-friendly guide about using AI for content creation.",
  "Create an article about the future of remote software engineering.",
];

export default function WriteArticle() {
  const { getToken } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [length, setLength] = useState<ArticleLength>("medium");
  const [tone, setTone] = useState<(typeof ARTICLE_TONE_OPTIONS)[number]>(
    "Professional",
  );
  const [articleTitle, setArticleTitle] = useState("");
  const [streamedArticle, setStreamedArticle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<ArticleHistoryItem[]>([]);
  const [lastResponse, setLastResponse] =
    useState<GenerateArticleResponse | null>(null);

  const intervalRef = useRef<number | null>(null);

  const wordCount = useMemo(
    () => getWordCount(streamedArticle),
    [streamedArticle],
  );

  const readTime = useMemo(
    () => readingTime(streamedArticle),
    [streamedArticle],
  );

  const hasResult = streamedArticle.trim().length > 0;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  function stopStream() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function resetResult() {
    stopStream();
    setArticleTitle("");
    setStreamedArticle("");
    setLastResponse(null);
    setIsGenerating(false);
  }

  function streamText(text: string, onComplete?: () => void) {
    stopStream();

    let index = 0;

    setStreamedArticle("");
    setIsGenerating(true);

    intervalRef.current = window.setInterval(() => {
      index += 10;

      const nextText = text.slice(0, index);

      setStreamedArticle(nextText);

      if (index >= text.length) {
        stopStream();
        setIsGenerating(false);
        onComplete?.();
      }
    }, 12);
  }

  async function handleGenerate() {
    const cleanPrompt = prompt.trim();

    if (cleanPrompt.length < 5) {
      toast.error("Please enter a clear article topic first.");
      return;
    }

    resetResult();
    setIsGenerating(true);

    try {
      const token = await getToken({
        skipCache: true,
      });

      const response = await generateArticle(
        {
          prompt: cleanPrompt,
          length,
          tone,
        },
        {
          token,
        },
      );

      const generatedText = buildArticleMarkdown({
        title: response.article.title,
        content: response.article.content,
      });

      setLastResponse(response);
      setArticleTitle(response.article.title);

      streamText(generatedText, () => {
        const nextHistoryItem: ArticleHistoryItem = {
          id: response.creation.id,
          prompt: cleanPrompt,
          title: response.article.title,
          article: generatedText,
          length,
          tone,
          wordCount: response.article.wordCount,
          readingTimeMinutes: response.article.readingTimeMinutes,
          createdAt: response.creation.createdAt,
        };

        setHistory((current) => [nextHistoryItem, ...current].slice(0, 8));
        toast.success(TOAST_MESSAGES.generationCompleted);
      });
    } catch (error) {
      setIsGenerating(false);
      toast.error(getApiErrorMessage(error, "Article generation failed."));
    }
  }

  async function handleCopy() {
    if (!streamedArticle.trim()) {
      toast.error("There is no article to copy yet.");
      return;
    }

    await copyToClipboard(streamedArticle);
    toast.success(TOAST_MESSAGES.copied);
  }

  function handleDownload() {
    if (!streamedArticle.trim()) {
      toast.error("There is no article to download yet.");
      return;
    }

    downloadTextFile({
      filename: "quickai-article.txt",
      content: streamedArticle,
    });

    toast.success(TOAST_MESSAGES.downloaded);
  }

  function handleLoadHistory(item: ArticleHistoryItem) {
    stopStream();

    setPrompt(item.prompt);
    setLength(item.length);
    setTone(item.tone as (typeof ARTICLE_TONE_OPTIONS)[number]);
    setArticleTitle(item.title);
    setStreamedArticle(item.article);
    setIsGenerating(false);

    toast.success("Loaded previous article.");
  }

  return (
    <div className="grid min-w-0 max-w-full gap-4 overflow-hidden sm:gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="min-w-0 space-y-6">
        <Card padding="xl" className="relative overflow-hidden">
          <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Badge
                  variant="success"
                  icon={<PenLine className="h-3.5 w-3.5" />}
                >
                  Free Tool
                </Badge>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Write Article
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Enter a topic, choose article length and tone, then generate a
                  polished long-form article using your backend Gemini API.
                </p>
              </div>

              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-xl shadow-violet-500/25">
                <BookOpenText size={28} />
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <PromptTextarea
                label="Article Topic"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: Write an article about how AI tools help small businesses grow..."
                maxLength={2500}
                disabled={isGenerating}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Article Length
                  </label>

                  <div className="mt-2 grid gap-2">
                    {ARTICLE_LENGTH_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLength(option.value as ArticleLength)}
                        disabled={isGenerating}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
                          length === option.value
                            ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]",
                        )}
                      >
                        <p className="text-sm font-black">{option.label}</p>
                        <p className="mt-1 text-xs font-semibold opacity-75">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Tone
                  </label>

                  <select
                    value={tone}
                    onChange={(event) =>
                      setTone(
                        event.target
                          .value as (typeof ARTICLE_TONE_OPTIONS)[number],
                      )
                    }
                    disabled={isGenerating}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  >
                    {ARTICLE_TONE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
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
                          <span className="font-black">/api/generate-article</span>{" "}
                          and saves the result to Neon.
                        </p>
                      </div>
                    </div>
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
                {isGenerating ? "Generating Article..." : "Generate Article"}
              </Button>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge
                variant="primary"
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Starter Prompts
              </Badge>

              <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                Need a quick idea?
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
            {starterPrompts.map((starterPrompt) => (
              <button
                key={starterPrompt}
                type="button"
                onClick={() => setPrompt(starterPrompt)}
                disabled={isGenerating}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold leading-6 text-slate-600 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]"
              >
                {starterPrompt}
              </button>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge
                variant="muted"
                icon={<History className="h-3.5 w-3.5" />}
              >
                Session History
              </Badge>

              <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                Recent generated articles
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                        {truncateText(item.prompt, 90)}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-bold text-slate-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState
                variant="history"
                title="No generated articles yet"
                description="Your generated articles from this session will appear here."
              />
            )}
          </div>
        </Card>
      </section>

      <section className="min-w-0 space-y-6">
        <Card padding="xl" className="min-h-[42rem] min-w-0 overflow-hidden">
          <div className="flex min-w-0 flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <Badge
                variant={hasResult ? "success" : "muted"}
                icon={<FileText className="h-3.5 w-3.5" />}
              >
                Output
              </Badge>

              <h2 className="mt-3 max-w-full break-words text-xl font-black leading-tight text-slate-950 dark:text-white sm:text-2xl">
                {articleTitle || "Generated article preview"}
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {hasResult
                  ? `${wordCount} words • ${readTime}`
                  : "Your generated article will appear here."}
              </p>
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Copy size={16} />}
                onClick={handleCopy}
                disabled={!hasResult || isGenerating}
              >
                Copy
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

          <div className="mt-6 min-w-0 overflow-hidden">
            {isGenerating && !streamedArticle && (
              <div className="grid min-h-[26rem] place-items-center">
                <div className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>

                  <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
                    Gemini is writing your article...
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Keep this page open while the backend generates and saves
                    your result.
                  </p>
                </div>
              </div>
            )}

            {!isGenerating && !hasResult && (
              <EmptyState
                title="No article generated yet"
                description="Write a topic and click Generate Article to create your first backend-powered result."
                primaryAction={{
                label: "Use Starter Prompt",
                onClick: () => setPrompt(starterPrompts[0]),
                variant: "primary",
                icon: <Clipboard size={17} />,
              }}
  />
            )}

            {hasResult && (
              <article className="max-w-full overflow-hidden">
                <pre className="max-w-full overflow-x-hidden whitespace-pre-wrap break-words rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-7 text-slate-700 [overflow-wrap:anywhere] dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200 sm:rounded-[2rem] sm:p-5">
                  {streamedArticle}
                </pre>
              </article>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Words"
              value={String(wordCount)}
              icon={<FileText size={18} />}
            />

            <StatTile
              label="Read Time"
              value={readTime}
              icon={<BookOpenText size={18} />}
            />

            <StatTile
              label="Saved"
              value={lastResponse ? "Yes" : "No"}
              icon={<Sparkles size={18} />}
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
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

function buildArticleMarkdown(input: {
  title: string;
  content: string;
}): string {
  const cleanTitle = input.title.trim();
  const cleanContent = input.content.trim();

  if (cleanContent.startsWith("#")) {
    return cleanContent;
  }

  return [`# ${cleanTitle}`, "", cleanContent].join("\n");
}