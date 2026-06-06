import {
  useEffect,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./Button";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[96rem]",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  contentClassName,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open || !closeOnEscape) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={closeOnOverlayClick ? onClose : undefined}
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-md transition dark:bg-black/70"
      />

      <div
        className={cn(
          "relative max-h-[92vh] w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-white/10 dark:bg-slate-950 dark:text-white",
          sizeClasses[size],
          className,
        )}
      >
        <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        {(title || description || showCloseButton) && (
          <div className="relative flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5 dark:border-white/10">
            <div>
              {title && (
                <h2
                  id={titleId}
                  className="text-2xl font-black tracking-tight text-slate-950 dark:text-white"
                >
                  {title}
                </h2>
              )}

              {description && (
                <p
                  id={descriptionId}
                  className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400"
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative max-h-[calc(92vh-9rem)] overflow-y-auto px-6 py-6",
            contentClassName,
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="relative border-t border-slate-200 px-6 py-5 dark:border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "primary";
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "danger",
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        Please check carefully before continuing.
      </div>
    </Modal>
  );
}

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close drawer overlay"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-md dark:bg-black/70"
      />

      <aside
        className={cn(
          "absolute top-0 h-full w-full max-w-md border-slate-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-white/10 dark:bg-slate-950 dark:text-white",
          side === "right"
            ? "right-0 border-l"
            : "left-0 border-r",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-white/10">
            <div>
              {title && (
                <h2 className="text-2xl font-black tracking-tight">
                  {title}
                </h2>
              )}

              {description && (
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

          {footer && (
            <div className="border-t border-slate-200 px-6 py-5 dark:border-white/10">
              {footer}
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

export function ModalSection({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}