/**
 * Cloudflare Pages Function: /api/resume
 * Handles dynamic resume redirection or download streaming at Cloudflare's Edge.
 */
export async function onRequestGet(context) {
  // Official Mayank Manjul Resume on Google Drive
  const GOOGLE_DRIVE_VIEW_URL = "https://drive.google.com/file/d/1rQcI8EHY2sCMNXN2j-Doxnb8eUOrDM6y/view?usp=sharing";
  const GOOGLE_DRIVE_DIRECT_URL = "https://drive.google.com/uc?export=download&id=1rQcI8EHY2sCMNXN2j-Doxnb8eUOrDM6y";

  const url = new URL(context.request.url);
  const mode = url.searchParams.get("mode");

  if (mode === "download") {
    return Response.redirect(GOOGLE_DRIVE_DIRECT_URL, 302);
  }

  // Default: redirect directly to Google Drive resume
  return Response.redirect(GOOGLE_DRIVE_VIEW_URL, 302);
}
