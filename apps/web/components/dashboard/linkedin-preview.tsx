"use client";

import Image from "next/image";

type ContentFormat = "short" | "medium" | "long";

const FORMAT_LABELS: Record<ContentFormat, string> = {
  short: "Short form",
  medium: "Medium form",
  long: "Long form",
};

const CHAR_LIMITS: Record<ContentFormat, number> = {
  short: 300,
  medium: 600,
  long: 1300,
};

function trimToFormat(content: string, format: ContentFormat) {
  const limit = CHAR_LIMITS[format];
  if (content.length <= limit) return content;
  return `${content.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
}

export function LinkedInPreview({
  content,
  format,
  onFormatChange,
  authorName,
  authorTitle,
  authorAvatarUrl,
  characterCount,
}: {
  content: string;
  format: ContentFormat;
  onFormatChange?: (format: ContentFormat) => void;
  authorName?: string;
  authorTitle?: string;
  authorAvatarUrl?: string | null;
  characterCount?: number;
}) {
  const displayName = authorName || "Your Name";
  const displayTitle = authorTitle || "Your Title · Company";
  const displayContent = trimToFormat(content || "", format);
  const count = characterCount ?? displayContent.length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {onFormatChange && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Preview as</span>
          <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
            {(["short", "medium", "long"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFormatChange(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  format === f ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-zinc-500 tabular-nums">{count} characters</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-zinc-200">
            {authorAvatarUrl ? (
              <Image
                src={authorAvatarUrl}
                alt={displayName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-zinc-500">
                {displayName[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-900 text-sm">{displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{displayTitle}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Now · 🌐</p>
          </div>
        </div>

        <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
          {displayContent || (
            <span className="text-zinc-400 italic">Your content will appear here...</span>
          )}
        </div>

        <div className="mt-5 border-t border-zinc-100 pt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">👍</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px]">❤</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px]">👏</span>
              <span className="ml-1 tabular-nums">{Math.max(1, Math.round(count * 0.12))}</span>
            </div>
            <div>
              {Math.max(0, Math.round(count * 0.02))} comments · {Math.max(0, Math.round(count * 0.003))} reposts
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 border-t border-zinc-100 pt-2 text-sm text-zinc-600">
            {["Like", "Comment", "Repost", "Send"].map((action) => (
              <button
                key={action}
                type="button"
                className="rounded-md py-2 transition-colors hover:bg-zinc-100"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
