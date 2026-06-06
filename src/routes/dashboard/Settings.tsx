import { useMemo, useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CreditCard,
  Crown,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { DashboardPlanBadge, UpgradeStrip } from "../../components/dashboard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ROUTES } from "../../lib/routes";
import { SUPPORT_EMAIL } from "../../lib/constants";
import {
  cn,
  formatDate,
  getInitials,
  type UserPlan,
} from "../../lib/utils";
import { useTheme } from "../../hooks/useTheme";

type NotificationSettings = {
  productUpdates: boolean;
  usageAlerts: boolean;
  billingAlerts: boolean;
  creationEmails: boolean;
};

type PreferenceSettings = {
  compactMode: boolean;
  autoSave: boolean;
  showPremiumHints: boolean;
  defaultTool: string;
};

const defaultNotifications: NotificationSettings = {
  productUpdates: true,
  usageAlerts: true,
  billingAlerts: true,
  creationEmails: false,
};

const defaultPreferences: PreferenceSettings = {
  compactMode: false,
  autoSave: true,
  showPremiumHints: true,
  defaultTool: "write-article",
};

export default function Settings() {
  const { user } = useUser();
  const { isDark, toggleTheme } = useTheme();

  const [notifications, setNotifications] =
    useState<NotificationSettings>(defaultNotifications);

  const [preferences, setPreferences] =
    useState<PreferenceSettings>(defaultPreferences);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const plan = useMemo<UserPlan>(() => {
    const publicPlan = user?.publicMetadata?.plan;

    return publicPlan === "premium" ? "premium" : "free";
  }, [user?.publicMetadata?.plan]);

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Creator";

  const email = user?.primaryEmailAddress?.emailAddress || "Not connected";

  function handleSaveSettings() {
    toast.success("Settings saved locally. Backend sync will be connected later.");
  }

  function handleDeleteAccount() {
    setIsDeleteModalOpen(false);
    toast.info("Account deletion will be handled securely through Clerk later.");
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10">
        <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge
              variant="premium"
              icon={<WandSparkles className="h-3.5 w-3.5" />}
            >
              Account Settings
            </Badge>

            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
              Control your profile, preferences, security, and workspace.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This settings page is ready for Clerk profile management, plan
              metadata, notification preferences, theme control, and account
              safety options.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center gap-4">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="h-16 w-16 rounded-[1.5rem] object-cover shadow-xl shadow-black/20"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-[1.5rem] bg-white/10 text-xl font-black text-white">
                  {getInitials(displayName) || <UserRound size={28} />}
                </div>
              )}

              <div className="min-w-0">
                <DashboardPlanBadge plan={plan} />
                <p className="mt-2 max-w-48 truncate text-xl font-black">
                  {displayName}
                </p>
                <p className="max-w-48 truncate text-xs font-semibold text-slate-400">
                  {email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <ProfileCard
            displayName={displayName}
            email={email}
            imageUrl={user?.imageUrl}
            createdAt={user?.createdAt ? formatDate(user.createdAt) : "Recently"}
            plan={plan}
          />

          <PreferencesCard
            preferences={preferences}
            setPreferences={setPreferences}
            onSave={handleSaveSettings}
          />

          <NotificationsCard
            notifications={notifications}
            setNotifications={setNotifications}
            onSave={handleSaveSettings}
          />
        </section>

        <aside className="space-y-6">
          <AppearanceCard isDark={isDark} onToggleTheme={toggleTheme} />

          <SecurityCard />

          <PlanCard plan={plan} />

          <SupportCard />

          <DangerZoneCard onDelete={() => setIsDeleteModalOpen(true)} />
        </aside>
      </div>

      <UpgradeStrip plan={plan} />

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete account?"
        description="This is a sensitive action. Later, account deletion will be handled through Clerk and backend cleanup."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              leftIcon={<Trash2 size={17} />}
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        }
      >
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
          <p className="text-sm font-semibold leading-6 text-rose-700 dark:text-rose-200">
            This demo action will not delete anything yet. Later, this should
            remove the user account, saved creations, Cloudinary assets, and
            database records after confirmation.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function ProfileCard({
  displayName,
  email,
  imageUrl,
  createdAt,
  plan,
}: {
  displayName: string;
  email: string;
  imageUrl?: string;
  createdAt: string;
  plan: UserPlan;
}) {
  return (
    <Card padding="xl" className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <Badge
              variant="primary"
              icon={<UserRound className="h-3.5 w-3.5" />}
            >
              Profile
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Account information
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Your public profile is managed by Clerk. Later we can add editable
              app-specific profile fields inside Neon.
            </p>
          </div>

          <UserButton
            afterSignOutUrl={ROUTES.home}
            appearance={{
              elements: {
                avatarBox: "h-12 w-12 rounded-2xl",
              },
            }}
          />
        </div>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="h-24 w-24 rounded-[2rem] object-cover shadow-xl shadow-slate-950/10"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-3xl font-black text-white shadow-xl shadow-violet-500/20">
              {getInitials(displayName) || <UserRound size={36} />}
            </div>
          )}

          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <Input
              label="Display Name"
              value={displayName}
              readOnly
              leftIcon={<UserRound className="h-4 w-4" />}
              helperText="Managed by Clerk profile."
              variant="glass"
            />

            <Input
              label="Email Address"
              value={email}
              readOnly
              leftIcon={<Mail className="h-4 w-4" />}
              helperText="Verified email from Clerk."
              variant="glass"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ProfileInfoTile
            icon={BadgeCheck}
            label="Plan"
            value={plan === "premium" ? "Premium" : "Free"}
            description="Current access level"
          />

          <ProfileInfoTile
            icon={ShieldCheck}
            label="Security"
            value="Protected"
            description="Clerk authentication"
          />

          <ProfileInfoTile
            icon={Sparkles}
            label="Joined"
            value={createdAt}
            description="Account created"
          />
        </div>
      </div>
    </Card>
  );
}

function ProfileInfoTile({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Icon size={18} />
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

      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function PreferencesCard({
  preferences,
  setPreferences,
  onSave,
}: {
  preferences: PreferenceSettings;
  setPreferences: React.Dispatch<React.SetStateAction<PreferenceSettings>>;
  onSave: () => void;
}) {
  return (
    <Card padding="xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <Badge
            variant="success"
            icon={<Sparkles className="h-3.5 w-3.5" />}
          >
            Preferences
          </Badge>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Workspace preferences
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Customize how your dashboard feels. Later these preferences can be
            saved to the database per user.
          </p>
        </div>

        <Button leftIcon={<Save size={17} />} onClick={onSave}>
          Save
        </Button>
      </div>

      <div className="mt-8 grid gap-4">
        <SettingToggle
          icon={Save}
          title="Auto-save generations"
          description="Automatically save generated articles, titles, images, and resume reviews."
          checked={preferences.autoSave}
          onChange={(value) =>
            setPreferences((current) => ({
              ...current,
              autoSave: value,
            }))
          }
        />

        <SettingToggle
          icon={Laptop}
          title="Compact dashboard mode"
          description="Use tighter spacing for dense dashboards and smaller screens."
          checked={preferences.compactMode}
          onChange={(value) =>
            setPreferences((current) => ({
              ...current,
              compactMode: value,
            }))
          }
        />

        <SettingToggle
          icon={Crown}
          title="Show premium hints"
          description="Display upgrade suggestions and premium tool previews."
          checked={preferences.showPremiumHints}
          onChange={(value) =>
            setPreferences((current) => ({
              ...current,
              showPremiumHints: value,
            }))
          }
        />

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <label className="text-sm font-black text-slate-950 dark:text-white">
            Default starting tool
          </label>

          <select
            value={preferences.defaultTool}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                defaultTool: event.target.value,
              }))
            }
            className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          >
            <option value="write-article">Write Article</option>
            <option value="blog-titles">Blog Titles</option>
            <option value="generate-image">Generate Image</option>
            <option value="remove-background">Background Removal</option>
            <option value="remove-object">Remove Object</option>
            <option value="review-resume">Review Resume</option>
          </select>

          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            This can control where users land after pressing “Get Started”.
          </p>
        </div>
      </div>
    </Card>
  );
}

function NotificationsCard({
  notifications,
  setNotifications,
  onSave,
}: {
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onSave: () => void;
}) {
  return (
    <Card padding="xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <Badge
            variant="primary"
            icon={<Bell className="h-3.5 w-3.5" />}
          >
            Notifications
          </Badge>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Email and app alerts
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            These controls are UI-ready. Later you can store preferences in Neon
            and send emails through a transactional email service.
          </p>
        </div>

        <Button variant="secondary" leftIcon={<Save size={17} />} onClick={onSave}>
          Save
        </Button>
      </div>

      <div className="mt-8 grid gap-4">
        <SettingToggle
          icon={Sparkles}
          title="Product updates"
          description="Receive updates about new AI tools, features, and improvements."
          checked={notifications.productUpdates}
          onChange={(value) =>
            setNotifications((current) => ({
              ...current,
              productUpdates: value,
            }))
          }
        />

        <SettingToggle
          icon={Bell}
          title="Usage alerts"
          description="Notify me when I’m close to my monthly usage limit."
          checked={notifications.usageAlerts}
          onChange={(value) =>
            setNotifications((current) => ({
              ...current,
              usageAlerts: value,
            }))
          }
        />

            <SettingToggle
            icon={CreditCard}
            title="Billing alerts"
            description="Important subscription, invoice, and payment notifications."
            checked={notifications.billingAlerts}
            onChange={(value) =>
            setNotifications((current) => ({
            ...current,
            billingAlerts: value,
        }))
    }
    />

        <SettingToggle
          icon={Mail}
          title="Creation emails"
          description="Send generated results to my email after completion."
          checked={notifications.creationEmails}
          onChange={(value) =>
            setNotifications((current) => ({
              ...current,
              creationEmails: value,
            }))
          }
        />
      </div>
    </Card>
  );
}

function AppearanceCard({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <Card padding="xl">
      <Badge
        variant="primary"
        icon={<Palette className="h-3.5 w-3.5" />}
      >
        Appearance
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Theme mode
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Switch between day and night UI instantly.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={!isDark ? undefined : onToggleTheme}
          className={cn(
            "rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5",
            !isDark
              ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200"
              : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
          )}
        >
          <Sun size={22} />
          <p className="mt-3 text-sm font-black">Light</p>
          <p className="mt-1 text-xs font-semibold opacity-75">Day mode</p>
        </button>

        <button
          type="button"
          onClick={isDark ? undefined : onToggleTheme}
          className={cn(
            "rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5",
            isDark
              ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200"
              : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
          )}
        >
          <Moon size={22} />
          <p className="mt-3 text-sm font-black">Dark</p>
          <p className="mt-1 text-xs font-semibold opacity-75">Night mode</p>
        </button>
      </div>
    </Card>
  );
}

function SecurityCard() {
  return (
    <Card padding="xl">
      <Badge
        variant="success"
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
      >
        Security
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Account protection
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Clerk handles secure sessions, social login, email verification, and
        account management.
      </p>

      <div className="mt-6 grid gap-3">
        <SecurityRow
          icon={KeyRound}
          title="Authentication"
          description="Google login and email verification code."
          status="Active"
        />

        <SecurityRow
          icon={LockKeyhole}
          title="Protected routes"
          description="Dashboard routes require a signed-in user."
          status="Enabled"
        />

        <SecurityRow
          icon={ShieldCheck}
          title="Session management"
          description="Clerk manages active sessions and sign out."
          status="Secure"
        />
      </div>
    </Card>
  );
}

function SecurityRow({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="font-black text-slate-950 dark:text-white">{title}</p>
          <Badge variant="success" size="sm">
            {status}
          </Badge>
        </div>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: UserPlan }) {
  return (
    <Card padding="xl">
      <Badge
        variant={plan === "premium" ? "premium" : "primary"}
        icon={
          plan === "premium" ? (
            <Crown className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )
        }
      >
        Current Plan
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        {plan === "premium" ? "Premium Creator" : "Free Creator"}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {plan === "premium"
          ? "You have access to all AI tools and premium usage limits."
          : "You can use free writing tools. Upgrade to unlock premium image and resume tools."}
      </p>

      <Link to={ROUTES.billing} className="mt-6 block">
        <Button
          variant={plan === "premium" ? "secondary" : "premium"}
          fullWidth
          rightIcon={<ArrowRight size={17} />}
        >
          {plan === "premium" ? "Manage Billing" : "Upgrade Plan"}
        </Button>
      </Link>
    </Card>
  );
}

function SupportCard() {
  return (
    <Card padding="xl">
      <Badge
        variant="muted"
        icon={<Mail className="h-3.5 w-3.5" />}
      >
        Support
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Need help?
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Contact support for account, billing, or AI tool issues.
      </p>

      <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-6 block">
        <Button
          variant="secondary"
          fullWidth
          rightIcon={<ArrowRight size={17} />}
        >
          Email Support
        </Button>
      </a>

      <p className="mt-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        {SUPPORT_EMAIL}
      </p>
    </Card>
  );
}

function DangerZoneCard({ onDelete }: { onDelete: () => void }) {
  return (
    <Card padding="xl" className="border-rose-500/20">
      <Badge
        variant="danger"
        icon={<Trash2 className="h-3.5 w-3.5" />}
      >
        Danger Zone
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Account deletion
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Later this will permanently delete the user, creations, uploaded assets,
        and billing references after a secure confirmation flow.
      </p>

      <Button
        variant="danger"
        fullWidth
        leftIcon={<Trash2 size={17} />}
        onClick={onDelete}
        className="mt-6"
      >
        Delete Account
      </Button>
    </Card>
  );
}

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
          checked
            ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
            : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400",
        )}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-black text-slate-950 dark:text-white">
              {title}
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition",
              checked
                ? "bg-gradient-to-r from-violet-600 to-cyan-500"
                : "bg-slate-300 dark:bg-white/15",
            )}
            aria-label={`Toggle ${title}`}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition",
                checked ? "left-6" : "left-1",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
