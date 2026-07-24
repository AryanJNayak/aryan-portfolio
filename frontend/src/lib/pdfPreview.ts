/**
 * Detect whether the browser can show an inline PDF (object/embed), not just
 * download it. Prefer this over viewport width: "Request desktop site" on a
 * phone still cannot embed PDFs, and tablets may be ≥ md but lack a viewer.
 */

/** True when inline PDF preview is supported in this browser. */
export function supportsInlinePdf(): boolean {
  if (typeof navigator === "undefined") return false;

  // Chromium / Firefox / Safari: reflects real embed capability (not UA spoof).
  if (typeof navigator.pdfViewerEnabled === "boolean") {
    return navigator.pdfViewerEnabled;
  }

  // Legacy hint when pdfViewerEnabled is missing (MimeTypeArray dropped from DOM typings).
  const legacy = navigator as Navigator & {
    mimeTypes?: { namedItem?: (type: string) => unknown };
  };
  try {
    if (legacy.mimeTypes?.namedItem?.("application/pdf")) return true;
  } catch {
    /* ignore */
  }

  return false;
}
