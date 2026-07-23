/**
 * Media API calls.
 *
 * Purpose: Upload images/videos to the backend (GridFS) from the admin editor.
 */
import { apiClient } from "@/api/client";
import type { MediaUploadResponse } from "@/types";

/**
 * Purpose: Upload a single media file.
 * Inputs:  file (File) from an <input type="file">.
 * Output:  Promise<MediaUploadResponse> {id, url, content_type}.
 * Example: const { url } = await uploadMedia(file);
 */
export async function uploadMedia(file: File): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<MediaUploadResponse>("/api/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Purpose: Submit the public contact form.
 * Inputs:  payload {name, email, subject?, message}.
 * Output:  Promise<{ success, id, emailed }>.
 */
export async function sendContact(payload: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; id: string; emailed: boolean }> {
  const { data } = await apiClient.post<{ success: boolean; id: string; emailed: boolean }>(
    "/api/contact",
    payload,
  );
  return data;
}
