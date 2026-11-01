/**
 * Cloudflare Pages Function: /api/resume
 * Handles dynamic resume redirection or download streaming at Cloudflare's Edge.
 */
export async function onRequestGet(context) {
  // If you maintain your latest resume on Google Drive, set your Drive export link here:
  const GOOGLE_DRIVE_DIRECT_URL = "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID";

  const url = new URL(context.request.url);
  const mode = url.searchParams.get("mode");

  if (mode === "gdrive") {
    return Response.redirect(GOOGLE_DRIVE_DIRECT_URL, 302);
  }

  // Default: redirect to the local static PDF bundled with the site
  return Response.redirect(`${url.origin}/resume.pdf`, 302);
}
