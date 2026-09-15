/**
 * Helper to open WhatsApp cleanly on mobile and desktop
 * On mobile/PWA, invokes the native whatsapp:// URI protocol so it doesn't replace the app window or open stuck browser pages.
 */
export const openWhatsApp = (customMessage?: string) => {
  const phone = '5511953292570';
  const defaultText = 'Olá! Tenho uma sugestão/dúvida sobre o aplicativo GKD Mobility: ';
  const message = encodeURIComponent(customMessage || defaultText);

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || ''
  );

  if (isMobile) {
    // Direct native application intent
    const nativeUri = `whatsapp://send?phone=${phone}&text=${message}`;
    
    // Create an anchor and click it to avoid replacing window history
    const link = document.createElement('a');
    link.href = nativeUri;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Fallback if WhatsApp is not installed on mobile device
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        const fallbackUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    }, 1500);
  } else {
    // Desktop: opens in a new tab/window safely
    const desktopUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
    window.open(desktopUrl, '_blank', 'noopener,noreferrer');
  }
};
