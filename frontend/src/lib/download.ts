/**
 * downloadWithProgress
 *
 * Purpose: Fetch a file as a blob while reporting download progress, then
 *          trigger a browser save dialog. Used for resume/PDF downloads.
 *
 * Inputs:  url, filename, onProgress (0–100 callback).
 */
export function downloadWithProgress(
  url: string,
  filename: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      } else if (event.loaded > 0) {
        // Indeterminate: nudge toward ~90% until complete.
        onProgress(Math.min(90, Math.round(event.loaded / 5000)));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Download failed (${xhr.status})`));
        return;
      }
      onProgress(100);
      const blobUrl = URL.createObjectURL(xhr.response);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
      resolve();
    };

    xhr.onerror = () => reject(new Error("Network error while downloading"));
    xhr.send();
  });
}
