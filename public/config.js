// public/config.js
// ────────── App Configuration ─────────
window.APP_CONFIG = {
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

  // Global animation + size configs
  ANIMATION_TIMING:      '0.6s',
  SIZE_CONFIG:           '18px',

  // Theme toggle icon size
  toggleIconSize:       '1.5rem',

  // App version
  version:              'v26'
};
// Export for module usage
export const ANIMATION_TIMING = window.APP_CONFIG.ANIMATION_TIMING;
export const SIZE_CONFIG = window.APP_CONFIG.SIZE_CONFIG;
// ─────────────────────────
