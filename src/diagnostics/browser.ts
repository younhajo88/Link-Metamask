export interface BrowserHints {
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  browser: 'safari' | 'chrome' | 'samsung-internet' | 'other';
  isMobile: boolean;
}

export function detectBrowserHints(userAgent = navigator.userAgent): BrowserHints {
  const ua = userAgent.toLowerCase();
  const isAndroid = ua.includes('android');
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSamsung = ua.includes('samsungbrowser');
  const isChrome = ua.includes('chrome') || ua.includes('crios');
  const isSafari = ua.includes('safari') && !isChrome && !isSamsung;

  return {
    platform: isIos ? 'ios' : isAndroid ? 'android' : ua ? 'desktop' : 'unknown',
    browser: isSamsung ? 'samsung-internet' : isSafari ? 'safari' : isChrome ? 'chrome' : 'other',
    isMobile: isIos || isAndroid,
  };
}
