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
  BriefcaseBusiness,
  CheckCircle2,
  Clipboard,
  Copy,
  Crown,
  Download,
  FileCheck2,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UploadCloud,
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
import { Input } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/Loader";
import {
  cn,
  copyToClipboard,
  downloadTextFile,
  formatDate,
  formatFileSize,
  truncateText,
  type UserPlan,
} from "../../lib/utils";
import {
  MAX_IMAGE_SIZE_MB,
  TOAST_MESSAGES,
} from "../../lib/constants";

type ResumeFocus =
  | "overall"
  | "ats"
  | "technical"
  | "experience"
  | "entry-level"
  | "senior";

type ResumeHistoryItem = {
  id: string;
  fileName: string;
  fileSize: number;
  focus: ResumeFocus;
  targetRole: string;
  analysis: string;
  score: number;
  strengths: string[];
  improvements: string[];
  createdAt: string;
};

const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const ACCEPTED_RESUME_EXTENSIONS = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";

const focusOptions: Array<{
  value: ResumeFocus;
  label: string;
  description: string;
}> = [
  {
    value: "overall",
    label: "Overall Review",
    description: "General resume quality, structure, clarity, and impact.",
  },
  {
    value: "ats",
    label: "ATS Optimization",
    description: "Keyword matching, formatting, and recruiter readability.",
  },
  {
    value: "technical",
    label: "Technical Resume",
    description: "Projects, skills, tools, and software engineering strength.",
  },
  {
    value: "experience",
    label: "Work Experience",
    description: "Bullet points, measurable achievements, and impact.",
  },
  {
    value: "entry-level",
    label: "Entry Level",
    description: "Portfolio, internships, education, and beginner positioning.",
  },
  {
    value: "senior",
    label: "Senior Role",
    description: "Leadership, architecture, ownership, and strategic impact.",
  },
];

export default function ReviewResume() {
  const { user } = useUser();

  const plan = useMemo<UserPlan>(() => {
    const publicPlan = user?.publicMetadata?.plan;

    return publicPlan === "premium" ? "premium" : "free";
  }, [user?.publicMetadata?.plan]);

  return (
    <PremiumGate plan={plan} toolType="resume-review" showPreview>
      <ReviewResumeWorkspace plan={plan} />
    </PremiumGate>
  );
}

function ReviewResumeWorkspace({ plan }: { plan: UserPlan }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [focus, setFocus] = useState<ResumeFocus>("overall");
  const [targetRole, setTargetRole] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [score, setScore] = useState(0);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<ResumeHistoryItem[]>([]);

  const isImageFile = selectedFile?.type.startsWith("image/") ?? false;
  const selectedFocus = focusOptions.find((item) => item.value === focus);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function validateResumeFile(file: File) {
    if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, DOCX, PNG, JPG, or WebP resume.");
      return false;
    }

    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;

    if (file.size > maxBytes) {
      toast.error(`Resume file must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      return false;
    }

    return true;
  }

  function handleSelectFile(file: File) {
    if (!validateResumeFile(file)) return;

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysis("");
    setScore(0);
    setStrengths([]);
    setImprovements([]);
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
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setAnalysis("");
    setScore(0);
    setStrengths([]);
    setImprovements([]);
  }

  function handleReviewResume() {
    if (!selectedFile) {
      toast.error("Please upload your resume first.");
      return;
    }

    setIsReviewing(true);
    setAnalysis("");
    setScore(0);
    setStrengths([]);
    setImprovements([]);

    window.setTimeout(() => {
      const result = buildDemoResumeReview({
        fileName: selectedFile.name,
        focus,
        targetRole: targetRole.trim(),
      });

      setAnalysis(result.analysis);
      setScore(result.score);
      setStrengths(result.strengths);
      setImprovements(result.improvements);
      setIsReviewing(false);

      const historyItem: ResumeHistoryItem = {
        id: crypto.randomUUID(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        focus,
        targetRole: targetRole.trim(),
        analysis: result.analysis,
        score: result.score,
        strengths: result.strengths,
        improvements: result.improvements,
        createdAt: new Date().toISOString(),
      };

      setHistory((current) => [historyItem, ...current].slice(0, 10));
      toast.success(TOAST_MESSAGES.generationCompleted);
    }, 1300);
  }

  async function handleCopyAnalysis() {
    if (!analysis.trim()) {
      toast.error("There is no resume analysis to copy yet.");
      return;
    }

    await copyToClipboard(analysis);
    toast.success(TOAST_MESSAGES.copied);
  }

  function handleDownloadAnalysis() {
    if (!analysis.trim()) {
      toast.error("There is no resume analysis to download yet.");
      return;
    }

    downloadTextFile({
      filename: "quickai-resume-review.txt",
      content: analysis,
    });

    toast.success(TOAST_MESSAGES.downloaded);
  }

  function handleLoadHistory(item: ResumeHistoryItem) {
    setFocus(item.focus);
    setTargetRole(item.targetRole);
    setAnalysis(item.analysis);
    setScore(item.score);
    setStrengths(item.strengths);
    setImprovements(item.improvements);

    toast.success("Loaded previous resume review.");
  }

  return (
    <div className="space-y-6">
      <PremiumToolBanner plan={plan} toolType="resume-review" />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <Card padding="xl" className="relative overflow-hidden">
            <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

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
                    Review Resume
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Upload your resume and get a professional AI review with a
                    score, strengths, improvement points, and ATS-focused
                    suggestions. Later this will connect to a real AI document
                    review API.
                  </p>
                </div>

                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-xl shadow-amber-500/25">
                  <FileCheck2 size={28} />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_RESUME_EXTENSIONS}
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
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-white dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
                  )}
                >
                  {selectedFile ? (
                    <div className="text-left">
                      <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                        {isImageFile ? (
                          <img
                            src={previewUrl}
                            alt={selectedFile.name}
                            className="max-h-96 w-full object-contain"
                          />
                        ) : (
                          <div className="grid min-h-80 place-items-center bg-gradient-to-br from-slate-100 via-white to-violet-50 p-8 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/40">
                            <div className="text-center">
                              <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-xl shadow-amber-500/20">
                                <FileText size={42} />
                              </div>

                              <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">
                                {selectedFile.name}
                              </h3>

                              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Document preview will be parsed by backend later.
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-2xl bg-slate-950/70 text-white backdrop-blur-xl transition hover:bg-rose-500"
                          aria-label="Remove uploaded resume"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                            <BriefcaseBusiness size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                              {selectedFile.name}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {formatFileSize(selectedFile.size)}
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
                      <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-xl shadow-amber-500/20">
                        <UploadCloud size={34} />
                      </div>

                      <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">
                        Upload resume
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Drag and drop your resume here, or click the button
                        below to browse from your device.
                      </p>

                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6"
                        rightIcon={<ArrowRight size={17} />}
                      >
                        Choose Resume
                      </Button>

                      <p className="mt-4 text-xs font-semibold text-slate-400">
                        PDF, DOC, DOCX, PNG, JPG, or WebP. Max{" "}
                        {MAX_IMAGE_SIZE_MB}MB.
                      </p>
                    </div>
                  )}
                </div>

                <Input
                  label="Target Role"
                  helperText="Optional, but recommended for better review quality."
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Example: Junior Software Engineer, Full Stack Developer..."
                  leftIcon={<Target className="h-4 w-4" />}
                  variant="glass"
                  disabled={isReviewing}
                />

                <div>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Review Focus
                  </label>

                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    {focusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFocus(option.value)}
                        disabled={isReviewing}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                          focus === option.value
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200"
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                      <BadgeCheck size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">
                        Better role targeting gives better feedback
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Add a target job title so the review can judge resume
                        keywords, project relevance, and experience alignment.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  fullWidth
                  size="xl"
                  variant="premium"
                  onClick={handleReviewResume}
                  isLoading={isReviewing}
                  rightIcon={<Sparkles size={19} />}
                  disabled={!selectedFile}
                >
                  {isReviewing ? "Reviewing Resume..." : "Review Resume"}
                </Button>
              </div>
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
                      isReviewing ? "info" : analysis ? "success" : "muted"
                    }
                    icon={
                      isReviewing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileCheck2 className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {isReviewing
                      ? "Analyzing resume..."
                      : analysis
                        ? "Resume Analysis"
                        : "Result Preview"}
                  </Badge>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Resume Review Output
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Get a clear score, strengths, weaknesses, and practical
                    improvements.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Copy size={16} />}
                    onClick={handleCopyAnalysis}
                    disabled={!analysis}
                  >
                    Copy
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download size={16} />}
                    onClick={handleDownloadAnalysis}
                    disabled={!analysis}
                  >
                    Download
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <ResumeMetric
                  label="Score"
                  value={analysis ? `${score}/100` : "--"}
                  icon={<Star size={17} />}
                  highlight={score >= 80}
                />
                <ResumeMetric
                  label="Focus"
                  value={selectedFocus?.label ?? "Overall"}
                  icon={<Target size={17} />}
                />
                <ResumeMetric
                  label="Target"
                  value={targetRole || "General"}
                  icon={<BriefcaseBusiness size={17} />}
                />
              </div>

              {isReviewing && (
                <div className="mt-6">
                  <ProgressBar value={82} label="Resume review progress" />
                </div>
              )}

              <div className="mt-6 min-h-[34rem] rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
                {analysis ? (
                  <div className="space-y-5">
                    <ScorePanel score={score} />

                    <InsightSection
                      title="Strengths"
                      icon={<CheckCircle2 size={18} />}
                      items={strengths}
                      variant="success"
                    />

                    <InsightSection
                      title="Recommended Improvements"
                      icon={<TrendingUp size={18} />}
                      items={improvements}
                      variant="warning"
                    />

                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <Clipboard size={18} />
                        </div>

                        <h3 className="font-black text-slate-950 dark:text-white">
                          Full Analysis
                        </h3>
                      </div>

                      <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-8 text-slate-700 dark:text-slate-200">
                        {analysis}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    variant="tool"
                    title="Your resume review will appear here"
                    description="Upload your resume, choose review focus, then click Review Resume."
                    size="lg"
                  />
                )}
              </div>

              {analysis && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    leftIcon={<Copy size={17} />}
                    onClick={handleCopyAnalysis}
                    fullWidth
                  >
                    Copy Review
                  </Button>

                  <Button
                    variant="dark"
                    leftIcon={<Save size={17} />}
                    onClick={() =>
                      toast.success("Resume review will be saved to Neon later.")
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
                  Recent Resume Reviews
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
                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-lg">
                      <FileText size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {truncateText(item.fileName, 80)}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Score {item.score}/100 • {formatFileSize(item.fileSize)}{" "}
                        • {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))
              ) : (
                <EmptyState
                  variant="history"
                  title="No resume review history yet"
                  description="Resume reviews will appear here during this session. Later we’ll save them permanently in Neon."
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

function ResumeMetric({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm dark:bg-white/[0.04]",
        highlight
          ? "border-emerald-400/20"
          : "border-slate-200 dark:border-white/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
            highlight
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-300",
          )}
        >
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

function ScorePanel({ score }: { score: number }) {
  const scoreLabel =
    score >= 85 ? "Excellent" : score >= 75 ? "Strong" : score >= 65 ? "Good" : "Needs Work";

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-400/25 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
      <div className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge
            variant="premium"
            icon={<Crown className="h-3.5 w-3.5" />}
          >
            Resume Score
          </Badge>

          <h3 className="mt-4 text-4xl font-black">{score}/100</h3>

          <p className="mt-2 text-sm font-semibold text-slate-300">
            {scoreLabel} foundation with clear improvement opportunities.
          </p>
        </div>

        <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-white/10 text-center">
          <div>
            <Star className="mx-auto h-7 w-7 fill-amber-300 text-amber-300" />
            <p className="mt-2 text-xs font-black">{scoreLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightSection({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  variant: "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-5",
        variant === "success"
          ? "border-emerald-400/20 bg-emerald-400/10"
          : "border-amber-400/20 bg-amber-400/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-2xl",
            variant === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-300",
          )}
        >
          {icon}
        </div>

        <h3 className="font-black text-slate-950 dark:text-white">{title}</h3>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300"
          >
            <span
              className={cn(
                "mt-2 h-2 w-2 shrink-0 rounded-full",
                variant === "success" ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildDemoResumeReview({
  fileName,
  focus,
  targetRole,
}: {
  fileName: string;
  focus: ResumeFocus;
  targetRole: string;
}) {
  const role = targetRole || "your target role";

  const score =
    focus === "technical"
      ? 84
      : focus === "ats"
        ? 79
        : focus === "senior"
          ? 81
          : focus === "entry-level"
            ? 76
            : 82;

  const strengths = [
    "The resume has a clear professional direction and shows relevant experience.",
    "Technical skills and project-based evidence are visible enough to support the candidate profile.",
    "The structure is easy to scan and can work well for recruiter review after small improvements.",
  ];

  const improvements = [
    "Add more measurable achievements using numbers, percentages, time saved, users served, or performance improvements.",
    `Tailor the summary and skills section more directly toward ${role}.`,
    "Improve ATS keyword alignment by mirroring important terms from the job description.",
    "Strengthen project bullet points by explaining the problem, action, technology, and result.",
  ];

  const focusAdvice: Record<ResumeFocus, string> = {
    overall:
      "Overall, the resume is solid but needs sharper impact. The biggest improvement is turning responsibility-based bullets into achievement-based bullets.",
    ats:
      "For ATS optimization, the resume should include more exact keywords from the target job description. Keep formatting simple and avoid overly complex layouts.",
    technical:
      "For a technical role, the resume should highlight stack depth, project architecture, API/database experience, and measurable engineering outcomes.",
    experience:
      "The work experience section should focus less on duties and more on outcomes. Use strong verbs and quantify business or technical impact.",
    "entry-level":
      "For an entry-level candidate, projects, internships, coursework, and GitHub/portfolio links should be stronger and more specific.",
    senior:
      "For a senior role, the resume should show ownership, leadership, system design thinking, mentoring, architecture decisions, and business impact.",
  };

  const analysis = `# Resume Review: ${fileName}

## Overall Score

${score}/100

This resume has a strong foundation and can become much more competitive with clearer positioning, stronger metrics, and better alignment with ${role}.

## Focus Area

${focusAdvice[focus]}

## Key Strengths

1. ${strengths[0]}
2. ${strengths[1]}
3. ${strengths[2]}

## Recommended Improvements

1. ${improvements[0]}
2. ${improvements[1]}
3. ${improvements[2]}
4. ${improvements[3]}

## ATS Suggestions

Use standard section names such as Summary, Skills, Experience, Projects, Education, and Certifications. Avoid unusual formatting that may confuse automated parsing. Include role-specific keywords naturally instead of stuffing them.

## Bullet Point Formula

Use this formula for stronger experience bullets:

Action verb + technical task + tool/technology + measurable result.

Example:
"Built a reusable React dashboard component system with TypeScript and Tailwind, reducing UI development time by 30% across internal tools."

## Final Recommendation

Before applying to ${role}, revise the top summary, add stronger quantified project outcomes, and match the skills section to the target job description. The resume is close, but the final polish should focus on clarity, measurable proof, and keyword alignment.`;

  return {
    score,
    strengths,
    improvements,
    analysis,
  };
}