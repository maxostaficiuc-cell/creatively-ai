// Error codes shared by /api/analyze and the Analyze page. The server only
// ever sends these codes plus safe text; technical detail stays in its logs.

export type AnalyzeErrorCode =
  | "session_expired"
  | "no_file"
  | "unsupported_type"
  | "file_too_large"
  | "upload_failed" // the file did not reach the server (network, size limit, platform error)
  | "storage_failed" // the server could not store the file
  | "insufficient_credits"
  | "plan_inactive"
  | "in_progress"
  | "rate_limited"
  | "ai_unavailable"
  | "ai_timeout"
  | "ai_rejected_image"
  | "ai_bad_response"
  | "save_failed"
  | "server_error";

export type AnalyzeErrorKind = "upload" | "analysis" | "file" | "credits" | "session";

export const ANALYZE_ERRORS: Record<AnalyzeErrorCode, { kind: AnalyzeErrorKind; title: string; message: string; retryable: boolean }> = {
  session_expired: { kind: "session", title: "Your session has expired", message: "Log in again to analyze this creative.", retryable: false },
  no_file: { kind: "file", title: "No file selected", message: "Choose an image to analyze.", retryable: false },
  unsupported_type: {
    kind: "file",
    title: "Unsupported file type",
    message: "Upload a JPG, PNG, WebP or GIF image. iPhone HEIC photos need to be exported as JPG first.",
    retryable: false,
  },
  file_too_large: { kind: "file", title: "File too large", message: "This file is too large to analyze. Use an image under 5 MB.", retryable: false },
  upload_failed: {
    kind: "upload",
    title: "Upload failed",
    message: "We couldn't upload your creative. Check your connection and try again.",
    retryable: true,
  },
  storage_failed: {
    kind: "upload",
    title: "Upload failed",
    message: "We couldn't store your creative. Please try again in a moment.",
    retryable: true,
  },
  insufficient_credits: { kind: "credits", title: "Not enough credits", message: "You don't have enough AI credits for this analysis.", retryable: false },
  plan_inactive: { kind: "credits", title: "No active plan", message: "Analyses need an active plan. Choose a plan to continue.", retryable: false },
  in_progress: {
    kind: "analysis",
    title: "Already analyzing",
    message: "This creative is still being analyzed. Give it a few seconds, then try again.",
    retryable: true,
  },
  rate_limited: {
    kind: "analysis",
    title: "Analysis is busy",
    message: "Our AI is handling a lot of requests right now. Please try again in a few seconds.",
    retryable: true,
  },
  ai_unavailable: {
    kind: "analysis",
    title: "Analysis couldn't be completed",
    message: "The AI service is temporarily unavailable. Please try again shortly.",
    retryable: true,
  },
  ai_timeout: {
    kind: "analysis",
    title: "Analysis couldn't be completed",
    message: "The analysis took too long to finish. Please try again.",
    retryable: true,
  },
  ai_rejected_image: {
    kind: "file",
    title: "We couldn't read this image",
    message: "The AI couldn't process this file. Try exporting it again as a JPG or PNG.",
    retryable: false,
  },
  ai_bad_response: {
    kind: "analysis",
    title: "Analysis couldn't be completed",
    message: "The analysis came back incomplete. Please try again.",
    retryable: true,
  },
  save_failed: {
    kind: "analysis",
    title: "Analysis couldn't be completed",
    message: "We couldn't save your report. Please try again.",
    retryable: true,
  },
  server_error: {
    kind: "analysis",
    title: "Analysis couldn't be completed",
    message: "Something went wrong on our side. Please try again.",
    retryable: true,
  },
};

/** The JSON body /api/analyze returns on failure. */
export type AnalyzeErrorBody = {
  error: string; // human message (kept as a string for older callers)
  code: AnalyzeErrorCode;
  retryable: boolean;
  /** false = confirmed nothing was charged (or the hold was refunded); null = could not confirm */
  charged: boolean | null;
  requestId: string;
  retryAfter?: number | null;
  balance?: number | null;
};
