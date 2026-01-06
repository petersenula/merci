export function openInBrowser(url: string) {
  // Android: force Chrome
  if (typeof window !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    const intentUrl =
      `intent://${url.replace(/^https?:\/\//, '')}` +
      `#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return;
  }

  // iOS / desktop
  window.open(url, '_blank', 'noopener,noreferrer');
}
