/**
 * Detect whether the browser can show an inline PDF (object/embed), not just
 * download it. Prefer this over viewport width: "Request desktop site" on a
 * phone still cannot embed PDFs, and tablets may be ≥ md but lack a viewer.
 */

/** True when inline PDF preview is supported in this browser. */
export function supportsInlinePdf(): boolean {
  if (typeof navigator === "undefined") return false;

  // Chromium / Firefox / Safari: reflects real embed capability (not UA spoof).
  if ("pdfViewerEnabled" in navigator) {
    return Boolean(navigator.pdfViewerEnabled);
  }

  // Legacy hint when pdfViewerEnabled is missing.
  try {
    const mime = navigator.mimeTypes?.namedItem?.("application/pdf");
    if (mime) return true;
  } catch {
    /* ignore */
  }

  return false;
}
