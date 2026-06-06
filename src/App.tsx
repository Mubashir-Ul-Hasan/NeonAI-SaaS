import { Link, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ArrowRight, PanelLeft } from "lucide-react";

import { Home, SignInPage, SignUpPage } from "./routes";

import {
  Billing,
  BlogTitles,
  CreationDetails,
  Creations,
  DashboardHome,
  DashboardLayout,
  GenerateImage,
  RemoveBackground,
  RemoveObject,
  ReviewResume,
  Settings,
  WriteArticle,
} from "./routes/dashboard";

import {
  AdminLayout,
  AdminLogin,
  AdminOverview,
  CreationsMonitor,
  RevenueAnalytics,
  UsageAnalytics,
  UsersTable,
} from "./routes/admin";

import { ROUTES } from "./lib/routes";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-[#050816] dark:text-white">
      <Routes>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={`${ROUTES.signIn}/*`} element={<SignInPage />} />
        <Route path={`${ROUTES.signUp}/*`} element={<SignUpPage />} />

        <Route path={ROUTES.dashboard} element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="write-article" element={<WriteArticle />} />
          <Route path="blog-titles" element={<BlogTitles />} />
          <Route path="generate-image" element={<GenerateImage />} />
          <Route path="remove-background" element={<RemoveBackground />} />
          <Route path="remove-object" element={<RemoveObject />} />
          <Route path="review-resume" element={<ReviewResume />} />
          <Route path="creations" element={<Creations />} />
          <Route path="creations/:creationId" element={<CreationDetails />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path={ROUTES.adminLogin} element={<AdminLogin />} />

        <Route path={ROUTES.admin} element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<UsersTable />} />
          <Route path="revenue" element={<RevenueAnalytics />} />
          <Route path="usage" element={<UsageAnalytics />} />
          <Route path="creations" element={<CreationsMonitor />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{
          className:
            "rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white",
        }}
      />
    </div>
  );
}

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 dark:bg-[#050816]">
      <div className="max-w-lg text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[2rem] bg-violet-500/10 text-violet-500">
          <PanelLeft size={34} />
        </div>

        <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 dark:text-white">
          Page not found
        </h1>

        <p className="mt-4 text-slate-500 dark:text-slate-400">
          The page you are trying to open does not exist.
        </p>

        <Link
          to={ROUTES.home}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
        >
          Back Home
          <ArrowRight size={17} />
        </Link>
      </div>
    </main>
  );
}