// public/config.js
// ────────── App Configuration ─────────
export const APP_CONFIG = {
  // Splash screen
  splashLogoScale:      0.85,
  splashLogoMaxWidth:   '180px',
  splashGrowDuration:   1200,
  splashFadeDuration:   500,

  // Header logo (top-left)
  headerLogoHeight:     '2.5rem',
  headerLogoWidth:      'auto',

  // Background gradients
  bgGradientLight:      ['#f5f7fa','#c3cfe2'],
  bgGradientDark:       ['#2c3e50','#4ca1af'],

  // Card gradients (opposing)
  cardGradientLight:    ['#c3cfe2','#f5f7fa'],
  cardGradientDark:     ['#4ca1af','#2c3e50'],

  // Button styling
  buttonNeutralBg:      'rgba(255,255,255,0.85)',
  buttonNeutralFg:      '',
  buttonHoverAccent:    'var(--accent)',

  // Animation timing
  welcomeBannerDuration:2500,
  welcomeBannerFade:    300,
  loaderSpinnerDuration:300,

  // Theme toggle icon size
  toggleIconSize:       '1.5rem',

  // App version
  version:              'v26'
};

export const ANIMATION_TIMING = `${APP_CONFIG.loaderSpinnerDuration}ms`;
export const SIZE_CONFIG = APP_CONFIG.toggleIconSize || '16px';

if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
}
// ─────────────────────────
