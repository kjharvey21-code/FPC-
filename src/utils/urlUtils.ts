export function normalizeSafeHttpUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject dangerous schemes explicitly
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    // Allow shorthand domains such as "drive.google.com/..." or "www.canva.com/..."
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([/?#].*)?$/.test(candidate)) {
      candidate = `https://${candidate}`;
    } else {
      return null;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isDisplayableImageUrl(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('/')) return true;
  if (trimmed.toLowerCase().startsWith('data:image/')) return true;

  const safeHttp = normalizeSafeHttpUrl(trimmed);
  if (!safeHttp) return false;

  try {
    const parsed = new URL(safeHttp);
    return /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function getLinkDomainLabel(rawUrl?: string | null): string {
  const safeHttp = normalizeSafeHttpUrl(rawUrl);
  if (!safeHttp) return 'External Link';
  try {
    const parsed = new URL(safeHttp);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return 'External Link';
  }
}
