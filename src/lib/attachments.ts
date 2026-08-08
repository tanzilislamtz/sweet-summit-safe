import type { Attachment } from "@/lib/chat";

/** Max size we keep in localStorage for the demo (data URLs get big fast). */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Read a picked File into a serialisable attachment (data URL based). */
export function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () =>
      resolve({
        kind: file.type.startsWith("image/") ? "image" : "file",
        name: file.name,
        url: String(reader.result ?? ""),
        size: file.size,
        mime: file.type || "application/octet-stream",
      });
    reader.readAsDataURL(file);
  });
}

/** Trigger a browser download for an attachment. */
export function downloadAttachment(attachment: Pick<Attachment, "name" | "url">) {
  const a = document.createElement("a");
  a.href = attachment.url;
  a.download = attachment.name || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
