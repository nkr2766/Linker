// public/config.js
// base animation + sizing constants
export const ANIMATION_TIMING = '0.3s';
export const ELEMENT_SIZE = '16px';

// Auto-increment and persist version number in localStorage
let version = parseInt(localStorage.getItem('app_version') || '26', 10);
version += 1;
localStorage.setItem('app_version', version.toString());

// Clearly log updated version to console
console.log(`[Config] Current Version: v${version}`);

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
  version:              `v${version}`
};

if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
}
// ─────────────────────────
