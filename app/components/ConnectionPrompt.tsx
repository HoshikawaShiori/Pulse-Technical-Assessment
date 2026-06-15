"use client";

export default function ConnectionPrompt({
  title,
  subtitle,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
}: {
  title: string;
  subtitle?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6" style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-xs rounded-2xl p-6 text-center shadow-xl" style={{ background: "var(--surface)", color: "var(--fg)" }}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: "var(--border-strong)", color: "var(--fg-muted)" }}
          >
            {declineLabel}
          </button>
          <button
            onClick={onAccept}
            className="flex-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}