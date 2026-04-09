export function normalizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/")) {
    return "/";
  }

  if (path.startsWith("//")) {
    return "/";
  }

  return path;
}

export function getSafeRedirectPath(path?: string | null) {
  return normalizeRedirectPath(path);
}
