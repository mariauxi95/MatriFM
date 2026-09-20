/** Prefix public asset paths with Vite `base` (needed on GitHub Pages). */
export function assetUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  const cleaned = path.replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${cleaned}`;
}
