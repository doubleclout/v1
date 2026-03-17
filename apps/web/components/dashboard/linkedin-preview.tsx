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
  const count = characterCount ?? content.length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Format selector */}
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

      {/* LinkedIn-style post card */}
      <div className="p-4">
        {/* Profile header - mimics LinkedIn post author */}
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
          </div>
        </div>

        {/* Post content */}
        <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
          {content || (
            <span className="text-zinc-400 italic">Your content will appear here...</span>
          )}
        </div>

        {/* Engagement bar - LinkedIn style */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-4 text-zinc-500">
          <div className="flex items-center gap-1">
            <span className="text-xs">👍</span>
            <span className="text-xs">Celebrate</span>
            <span className="text-xs">Love</span>
          </div>
          <span className="text-xs">Like</span>
          <span className="text-xs">Comment</span>
          <span className="text-xs">Repost</span>
          <span className="text-xs">Send</span>
          <div className="ml-auto">
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {count} characters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
