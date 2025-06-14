// Load external configuration
const CONFIG = window.APP_CONFIG || {};
console.debug('[CONFIG]', CONFIG);

// A) FIREBASE IMPORTS (Modular v11.8.1)
// ───────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

console.log("\uD83D\uDD25 app.js has loaded!");

// ───────────────────────────────────────────────────────────────────────────────
// B) FIREBASE CONFIGURATION
// Copy/paste this from your Firebase console → Project Settings (Web App)
// ───────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDwfQcrwMCbbX6CA-_1UgelCNfVKCVTQ0A",
    authDomain: "linkerapp-9dd4d.firebaseapp.com",
    projectId: "linkerapp-9dd4d",
    storageBucket: "linkerapp-9dd4d.appspot.com",
    messagingSenderId: "1098052666181",
    appId: "1:1098052666181:web:526d045f1c8f44f59fb42c",
    measurementId: "G-LBV1P494PR"
};

// Initialize Firebase App / Analytics / Auth / Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ───────────────────────────────────────────────────────────────────────────────
// C) CONNECT TO EMULATORS WHEN RUNNING LOCALLY (localhost, 127.0.0.1, ::1)
// ───────────────────────────────────────────────────────────────────────────────
const hostname = location.hostname;
if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
) {
    console.log("⚙️  Connecting to Firebase emulators…");
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
}

// ───────────────────────────────────────────────────────────────────────────────
// D) CONSTANTS & STATE
// ───────────────────────────────────────────────────────────────────────────────
// Admin’s email/password (must match the user you create in the Auth emulator):
const ADMIN_EMAIL = "admin@linkerapp.com";
const ADMIN_PASSWORD = "?616811Nt";

// localStorage key for saving the Linktree data:
const STORAGE_KEY_LINKTREE = "linkerLinktreeData";
const SIGNUP_SUCCESS_DELAY_MS = 1200; // Pause after account creation before continuing

// Keep track of link rows (for “Add Link”, “Delete”, reordering, etc.)
let linkRows = [];
// Will hold the base64‐DataURL for the uploaded profile pic
let profilePicDataURL = "";
// Optional background image for the card
let cardImageDataURL = "";

// ───────────────────────────────────────────────────────────────────────────────
// E) UI ELEMENT REFERENCES
// ───────────────────────────────────────────────────────────────────────────────
// (These IDs must match exactly what’s in index.html—don’t rename!)
let resetBtn;

let loginScreen;
let btnAdminLogin;
let btnUserLogin;
let btnUseAccessCode;

let adminLoginScreen;
let adminEmailInput;
let adminPasswordInput;
let adminError;
let adminLoginSubmit;
let adminLoginBack;

let adminPanel;
let newAccessCodeInput;
let createCodeBtn;
let adminCodeSuccess;
let adminBuildFormBtn;
let adminLogoutBtn;

let userLoginScreen;
let userEmailInput;
let userPasswordInput;
let userError;
let userLoginSubmit;
let userLoginBack;

let userSignupScreen;
let signupCodeInput;
let signupEmailInput;
let signupPasswordInput;
let signupCodeError;
let signupSuccess;
let signupSubmit;
let signupBackBtn;

let welcomeScreen;
let welcomeText;

let formScreen;
let profilePicFileInput;
let errorProfilePic;
let formUsernameInput;
let errorUsername;
let formTaglineInput;
let formTaglineCount;
let gradientStartInput;
let gradientEndInput;
let cardColorInput;
let cardTextColorInput;
let cardImageInput;
let cardImageClearBtn;
let linksWrapper;
let addLinkBtn;
let errorLinks;
let generateBtn;

let loaderScreen;

let linktreeScreen;
let outputCard;
let outputProfilePic;
let displayUsername;
let outputTagline;
let linksContainer;
let backBtn;
let downloadBtn;


// ───────────────────────────────────────────────────────────────────────────────
// F) UTILITY HELPERS
// ───────────────────────────────────────────────────────────────────────────────
function delay(ms) {
    return new window.Promise((resolve) => setTimeout(resolve, ms));
}

function hideAllScreens() {
    [
        loginScreen,
        adminLoginScreen,
        adminPanel,
        userLoginScreen,
        userSignupScreen,
        welcomeScreen,
        formScreen,
        loaderScreen,
        linktreeScreen,
    ].forEach((el) => {
        if (el) {
            el.classList.add("hidden");
            el.classList.remove("flex");
        }
    });
}

function isValidHandle(u) {
    return /^@[A-Za-z0-9_]{2,29}$/.test(u);
}

function isValidURL(url) {
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Helper utilities to safely modify class lists without risking null errors
function addCls(el, ...cls) {
    if (el) {
        el.classList.add(...cls);
    } else {
        console.warn('[Warning] element missing – cannot add classes', cls);
    }
}

function removeCls(el, ...cls) {
    if (el) {
        el.classList.remove(...cls);
    } else {
        console.warn('[Warning] element missing – cannot remove classes', cls);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
//                 Then FORCE sign-out any existing user, then call initApp()

document.addEventListener('DOMContentLoaded', () => {
  console.debug('[Debug] DOMContentLoaded');
  console.debug('[CONFIG]', CONFIG);

  const lookup = (id) => {
    const el = document.getElementById(id);
    console.debug(`[Lookup] #${id} →`, el);
    if (!el) {
      console.error(`[Error] Element #${id} not found, skipping related logic`);
    }
    return el;
  };

  // grab element references now that DOM is ready
  resetBtn = lookup('reset-btn');
  loginScreen = lookup('login-screen');
  btnAdminLogin = lookup('btn-admin-login');
  btnUserLogin = lookup('btn-user-login');
  btnUseAccessCode = lookup('btn-use-access-code');
  adminLoginScreen = lookup('admin-login-screen');
  adminEmailInput = lookup('admin-email');
  adminPasswordInput = lookup('admin-password');
  adminError = lookup('admin-error');
  adminLoginSubmit = lookup('admin-login-submit');
  adminLoginBack = lookup('admin-login-back');
  adminPanel = lookup('admin-panel');
  newAccessCodeInput = lookup('new-access-code');
  createCodeBtn = lookup('create-code-btn');
  adminCodeSuccess = lookup('admin-code-success');
  adminBuildFormBtn = lookup('admin-build-form');
  adminLogoutBtn = lookup('admin-logout');
  userLoginScreen = lookup('user-login-screen');
  userEmailInput = lookup('user-email');
  userPasswordInput = lookup('user-password');
  userError = lookup('user-error');
  userLoginSubmit = lookup('user-login-submit');
  userLoginBack = lookup('user-login-back');
  userSignupScreen = lookup('user-signup-screen');
  signupCodeInput = lookup('signup-code');
  signupEmailInput = lookup('signup-email');
  signupPasswordInput = lookup('signup-password');
  signupCodeError = lookup('signup-code-error');
  signupSuccess = lookup('signup-success');
  signupSubmit = lookup('signup-submit');
  signupBackBtn = lookup('signup-back');
  welcomeScreen = lookup('welcome-screen');
  welcomeText = lookup('welcome-text');
  formScreen = lookup('form-screen');
  profilePicFileInput = lookup('profile-pic-file');
  errorProfilePic = lookup('error-profile-pic');
  formUsernameInput = lookup('username');
  errorUsername = lookup('error-username');
  formTaglineInput = lookup('tagline');
  formTaglineCount = lookup('tagline-count');
  gradientStartInput = lookup('gradient-start');
  gradientEndInput = lookup('gradient-end');
  cardColorInput = lookup('card-color');
  cardTextColorInput = lookup('card-text-color');
  cardImageInput = lookup('card-image');
  cardImageClearBtn = lookup('remove-card-image');
  linksWrapper = lookup('links-wrapper');
  addLinkBtn = lookup('add-link-btn');
  errorLinks = lookup('error-links');
  generateBtn = lookup('generate-btn');
  loaderScreen = lookup('loader-screen');
  linktreeScreen = lookup('linktree-screen');
  outputCard = lookup('output-card');
  outputProfilePic = lookup('output-profile-pic');
  displayUsername = lookup('display-username');
  outputTagline = lookup('output-tagline');
  linksContainer = lookup('links-container');
  backBtn = lookup('back-btn');
  downloadBtn = lookup('download-btn');
  const rootStyles = document.documentElement.style;
  rootStyles.setProperty("--bg-start", CONFIG.bgGradientLight[0]);
  rootStyles.setProperty("--bg-end", CONFIG.bgGradientLight[1]);
  rootStyles.setProperty("--card-start", CONFIG.cardGradientLight[0]);
  rootStyles.setProperty("--card-end", CONFIG.cardGradientLight[1]);
  rootStyles.setProperty("--accent", CONFIG.buttonHoverAccent);
  rootStyles.setProperty("--btn-bg", CONFIG.buttonNeutralBg);
  if (CONFIG.buttonNeutralFg) rootStyles.setProperty("--btn-fg", CONFIG.buttonNeutralFg);


  // 1) Apply version
  const versionEl = lookup('version');
  if (versionEl) versionEl.textContent = CONFIG.version;

  // header logo sizing
  const headerLogo = lookup('header-logo');
  if (headerLogo) {
    headerLogo.style.height = CONFIG.headerLogoHeight;
    headerLogo.style.width = CONFIG.headerLogoWidth;
  }

  // 2) Theme toggle setup
  const toggle = lookup('theme-toggle');
  if (toggle) {
    toggle.style.fontSize = CONFIG.toggleIconSize;
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    console.debug('[Theme] init →', saved);
    toggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      console.debug('[Theme] toggle →', next);
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  } else {
    console.error('[Theme] #theme-toggle not found');
  }

  // 3) Splash flow
  hideAllScreens();
  const splash = lookup('startup-screen');
  const logo   = lookup('startup-logo');
  if (splash && logo) {
    splash.style.position = 'fixed';
    splash.style.inset = '0';
    splash.style.background = '#000';
    splash.style.zIndex = '9999';
    logo.style.maxWidth = CONFIG.splashLogoMaxWidth;
    logo.style.transform = `scale(${CONFIG.splashLogoScale})`;
    splash.classList.add('reveal');
    setTimeout(() => {
      splash.remove();
      console.debug('[Splash] removed');
      console.debug('[Debug] getElementById("login-screen") →', loginScreen);
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.classList.add('flex');
      }
      initApp();
    }, CONFIG.splashGrowDuration + CONFIG.splashFadeDuration);
  } else {
    console.warn('[Splash] missing elements, skipping to initApp');
    initApp();
  }

  // extra listeners
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      generateBtn.click();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }

  // landing screen buttons
  if (btnAdminLogin) {
    btnAdminLogin.addEventListener('click', () => {
      hideAllScreens();
      removeCls(adminLoginScreen, 'hidden');
      addCls(adminLoginScreen, 'flex');
      addCls(adminError, 'hidden');
      if (adminEmailInput) adminEmailInput.value = '';
      if (adminPasswordInput) adminPasswordInput.value = '';
    });
  } else {
    console.error('missing #btn-admin-login');
  }

  if (btnUserLogin) {
    btnUserLogin.addEventListener('click', () => {
      hideAllScreens();
      removeCls(userLoginScreen, 'hidden');
      addCls(userLoginScreen, 'flex');
      addCls(userError, 'hidden');
      if (userEmailInput) userEmailInput.value = '';
      if (userPasswordInput) userPasswordInput.value = '';
    });
  }

  if (btnUseAccessCode) {
    btnUseAccessCode.addEventListener('click', () => {
      hideAllScreens();
      removeCls(userSignupScreen, 'hidden');
      addCls(userSignupScreen, 'flex');
      addCls(signupCodeError, 'hidden');
      if (signupEmailInput) signupEmailInput.value = '';
      if (signupPasswordInput) signupPasswordInput.value = '';
      if (signupCodeInput) signupCodeInput.value = '';
      addCls(signupSuccess, 'hidden');
    });
  }

  if (adminLoginSubmit) {
    adminLoginSubmit.addEventListener('click', async () => {
      const email = adminEmailInput.value.trim().toLowerCase();
      const pass = adminPasswordInput.value.trim();
      if (email === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD) {
        try {
          await signInWithEmailAndPassword(auth, email, pass);
          hideAllScreens();
          showAdminPanel();
        } catch (err) {
          console.error('Admin signIn error:', err);
          if (adminError) {
            adminError.textContent = 'Authentication error—check console.';
            removeCls(adminError, 'hidden');
          }
        }
      } else {
        if (adminError) {
          adminError.textContent = 'Incorrect admin credentials.';
          removeCls(adminError, 'hidden');
        }
      }
    });
  }

  if (adminLoginBack) {
    adminLoginBack.addEventListener('click', () => {
      hideAllScreens();
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.classList.add('flex');
      } else {
        console.warn('[Debug] #login-screen not found – skipping');
      }
    });
  }

  if (createCodeBtn) {
    createCodeBtn.addEventListener('click', async () => {
      const code = newAccessCodeInput.value.trim();
      if (!code) return;
      const docRef = doc(db, 'codes', code);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        if (adminCodeSuccess) {
          adminCodeSuccess.textContent = `Code “${code}” already exists.`;
          removeCls(adminCodeSuccess, 'hidden');
        }
      } else {
        await setDoc(docRef, { createdAt: serverTimestamp() });
        if (adminCodeSuccess) {
          adminCodeSuccess.textContent = `Code “${code}” created!`;
          removeCls(adminCodeSuccess, 'hidden');
        }
      }
      if (newAccessCodeInput) newAccessCodeInput.value = '';
    });
  }

  if (adminBuildFormBtn) {
    adminBuildFormBtn.addEventListener('click', () => {
      hideAllScreens();
      startAppFlow(ADMIN_EMAIL);
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        hideAllScreens();
        if (loginScreen) {
          removeCls(loginScreen, 'hidden');
          addCls(loginScreen, 'flex');
        } else {
          console.warn('[Debug] #login-screen not found – skipping');
        }
        if (resetBtn) {
          addCls(resetBtn, 'hidden');
        } else {
          console.warn('[Debug] #reset-btn not found – skipping');
        }
      } catch (err) {
        console.error('Error signing out admin:', err);
      }
    });
  }

  if (userLoginSubmit) {
    userLoginSubmit.addEventListener('click', async () => {
      const email = userEmailInput.value.trim().toLowerCase();
      const pass = userPasswordInput.value.trim();
      if (!email || !pass) {
        if (userError) {
          userError.textContent = 'Email & password are required.';
          removeCls(userError, 'hidden');
        }
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        hideAllScreens();
        startAppFlow(email);
      } catch (err) {
        console.error('User login error:', err);
        if (userError) {
          userError.textContent = 'Invalid email or password.';
          removeCls(userError, 'hidden');
        }
      }
    });
  }

  if (userLoginBack) {
    userLoginBack.addEventListener('click', () => {
      hideAllScreens();
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.classList.add('flex');
      } else {
        console.warn('[Debug] #login-screen not found – skipping');
      }
    });
  }

  if (signupSubmit) {
    signupSubmit.addEventListener('click', async () => {
      const code = signupCodeInput.value.trim();
      const email = signupEmailInput.value.trim().toLowerCase();
      const pass = signupPasswordInput.value.trim();
      if (!code || !email || !pass) {
        if (signupCodeError) {
          signupCodeError.textContent = 'All fields are required.';
          removeCls(signupCodeError, 'hidden');
        }
        return;
      }
      const docRef = doc(db, 'codes', code);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        if (signupCodeError) {
          signupCodeError.textContent = 'Invalid or expired access code.';
          removeCls(signupCodeError, 'hidden');
        }
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        await deleteDoc(docRef);
        addCls(signupCodeError, 'hidden');
        removeCls(signupSuccess, 'hidden');
        setTimeout(() => {
          hideAllScreens();
          startAppFlow(email);
        }, SIGNUP_SUCCESS_DELAY_MS);
      } catch (err) {
        console.error('Error creating user:', err);
        if (signupCodeError) {
          signupCodeError.textContent = 'Signup failed—email may already be in use.';
          removeCls(signupCodeError, 'hidden');
        }
      }
    });
  }

  if (signupBackBtn) {
    signupBackBtn.addEventListener('click', () => {
      hideAllScreens();
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.classList.add('flex');
      } else {
        console.warn('[Debug] #login-screen not found – skipping');
      }
    });
  }

  if (gradientStartInput) gradientStartInput.addEventListener('input', updateFormGradient);
  if (gradientEndInput) gradientEndInput.addEventListener('input', updateFormGradient);

  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => {
      if (linkRows.length < 10) addLinkRow();
      if (linkRows.length >= 10) {
        addLinkBtn.setAttribute('disabled', 'true');
        addCls(addLinkBtn, 'opacity-50', 'cursor-not-allowed');
      }
      updateGenerateButtonState();
    });
  }

  if (profilePicFileInput) {
    profilePicFileInput.addEventListener('change', () => {
      const file = profilePicFileInput.files[0];
      if (file && file.type.startsWith('image/')) {
        addCls(errorProfilePic, 'hidden');
        const reader = new FileReader();
        reader.onload = e => { profilePicDataURL = e.target.result; };
        reader.readAsDataURL(file);
      } else {
        removeCls(errorProfilePic, 'hidden');
        profilePicDataURL = '';
      }
      updateGenerateButtonState();
    });
  }

  if (cardImageInput) {
    cardImageInput.addEventListener('change', () => {
      const file = cardImageInput.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => { cardImageDataURL = e.target.result; };
        reader.readAsDataURL(file);
      } else {
        cardImageDataURL = '';
      }
    });
  }

  if (cardImageClearBtn) {
    cardImageClearBtn.addEventListener('click', () => {
      cardImageDataURL = '';
      cardImageInput.value = '';
    });
  }

  if (formUsernameInput) {
    formUsernameInput.addEventListener('blur', () => {
      let val = formUsernameInput.value.trim();
      if (!val.startsWith('@') && val.length > 0) {
        val = '@' + val;
        formUsernameInput.value = val;
      }
      if (isValidHandle(val)) {
        removeCls(formUsernameInput, 'border-red-500');
        addCls(formUsernameInput, 'border-green-500');
        addCls(errorUsername, 'hidden');
      } else {
        removeCls(formUsernameInput, 'border-green-500');
        addCls(formUsernameInput, 'border-red-500');
        removeCls(errorUsername, 'hidden');
      }
      updateGenerateButtonState();
    });
  }

  if (formTaglineInput) {
    formTaglineInput.addEventListener('input', () => {
      formTaglineCount.textContent = `${formTaglineInput.value.length}/100`;
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', async e => {
      e.preventDefault();
      hideAllScreens();
      const data = {
        profilePic: profilePicDataURL,
        username: formUsernameInput.value.trim(),
        tagline: formTaglineInput.value.trim(),
        gradientStart: gradientStartInput.value,
        gradientEnd: gradientEndInput.value,
        cardColor: cardColorInput.value,
        cardTextColor: cardTextColorInput.value,
        cardImage: cardImageDataURL,
        links: linkRows.map(r => ({ label: r.labelInput.value.trim(), icon: r.iconSelect.value, url: r.urlInput.value.trim() }))
      };
      try {
        localStorage.setItem(STORAGE_KEY_LINKTREE, JSON.stringify(data));
      } catch (err) {
        console.warn('LocalStorage quota exceeded, stripping images', err);
        const tmp = { ...data, profilePic: '', cardImage: '' };
        localStorage.setItem(STORAGE_KEY_LINKTREE, JSON.stringify(tmp));
      }
      removeCls(loaderScreen, 'hidden');
      addCls(loaderScreen, 'flex');
      await delay(CONFIG.loaderSpinnerDuration);
      addCls(loaderScreen, 'hidden');
      removeCls(loaderScreen, 'flex');
      renderOutput(data);
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || '{}');
      showBuilderForm(saved);
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || '{}');
      if (!data || !data.links || data.links.length === 0) return;
      const safeUsername = data.username.replace('@','') || 'linker';
      const safeTagline = escapeHTML(data.tagline || '');
      const safePic = data.profilePic || '';
      const bgColorStart = data.gradientStart || '#a7f3d0';
      const bgColorEnd = data.gradientEnd || '#6ee7b7';
      const cardColor = data.cardColor || '#ffffff';
      const textColor = data.cardTextColor || '#111827';
      const cardImage = data.cardImage || '';
      const outputHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHTML(data.username)}’s Linktree</title><style>body{margin:0;padding:0;font-family:Inter,sans-serif;background:linear-gradient(to bottom right,${bgColorStart},${bgColorEnd});display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;} .card{background-color:${cardColor};${cardImage ? `background-image:url('${cardImage}');background-size:cover;` : ''}border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);padding:32px;text-align:center;max-width:360px;width:90%;box-sizing:border-box;} img.profile{width:128px;height:128px;border-radius:50%;object-fit:cover;margin-bottom:16px;} h1{margin:0 0 8px;font-size:1.5rem;color:${textColor};} p.tag{margin:0 0 16px;font-size:1rem;color:${textColor};} .link-btn{display:block;width:100%;box-sizing:border-box;margin:8px 0;padding:12px 16px;background-color:#10b981;color:white;border-radius:8px;text-decoration:none;font-weight:500;font-size:1rem;transition:background-color .2s ease-in-out;} .link-btn:hover{background-color:#059669;} .link-btn i{margin-right:8px;}</style><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-papZHh3cY3VpsQa0bpo0uZtBi8gm38UH3rzZBZagh1SWlDwptG25pbLBO0e4XgbV4QYxRo/mOZxjwRF+dc+0Fg==" crossorigin="anonymous" referrerpolicy="no-referrer"/></head><body><div class="card">${safePic ? `<img src="${safePic}" alt="Profile picture" class="profile" />` : ''}<h1>${escapeHTML(data.username)}</h1>${safeTagline ? `<p class="tag">${safeTagline}</p>` : ''}${data.links.map(link=>`<a href="${escapeHTML(link.url)}" target="_blank" class="link-btn"><i class="fa ${link.icon}" aria-hidden="true"></i>${escapeHTML(link.label)}</a>`).join('\n    ')}</div></body></html>`;
      const blob = new Blob([outputHtml], { type: 'text/html' });
      const filename = `${safeUsername}-linktree.html`;
      downloadBlob(filename, blob);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      localStorage.removeItem(STORAGE_KEY_LINKTREE);
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error signing out:', err);
      }
      location.reload();
    });
  }
  console.debug('[Init] DOM ready and all guarded lookups complete');
});

// ───────────────────────────────────────────────────────────────────────────────
// H) initApp(): Listen for Auth state changes → show the correct “screen”        //
// ───────────────────────────────────────────────────────────────────────────────
  function initApp() {
      onAuthStateChanged(auth, (user) => {
          console.debug('[Auth] state changed start', user);
          const formScreen = document.getElementById('form-screen');
          console.debug('[Auth] lookup #form-screen →', formScreen);
          const outputScreen = document.getElementById('output-screen');
          console.debug('[Auth] lookup #output-screen →', outputScreen);
          const builderScreen = document.getElementById('builder-screen');
          console.debug('[Auth] lookup #builder-screen →', builderScreen);
          const displayNameEl = document.getElementById('display-username');
          console.debug('[Auth] lookup #display-username →', displayNameEl);
          if (user) {
              if (formScreen) {
                  formScreen.classList.add('hidden');
              } else {
                  console.error('[Auth Error] #form-screen not found; user=', user);
              }
              if (outputScreen) {
                  outputScreen.classList.add('hidden');
              } else {
                  console.error('[Auth Error] #output-screen not found; user=', user);
              }
              if (builderScreen) {
                  builderScreen.classList.remove('hidden');
              } else {
                  console.error('[Auth Error] #builder-screen not found; user=', user);
              }
              if (displayNameEl) {
                  displayNameEl.textContent = user.displayName || user.email;
              } else {
                  console.error('[Auth Error] #display-username not found; user=', user);
              }
          } else {
              if (formScreen) {
                  formScreen.classList.remove('hidden');
              } else {
                  console.error('[Auth Error] #form-screen not found; user=', user);
              }
              if (outputScreen) {
                  outputScreen.classList.add('hidden');
              } else {
                  console.error('[Auth Error] #output-screen not found; user=', user);
              }
              if (builderScreen) {
                  builderScreen.classList.add('hidden');
              } else {
                  console.error('[Auth Error] #builder-screen not found; user=', user);
              }
          }
          console.debug('[Auth] state changed end');
      });
  }

// ───────────────────────────────────────────────────────────────────────────────
// N) MAIN APP FLOW (After any successful login)                                  //
//    1) Show “Thank you for logging in…” banner for 2.5s → fade out in 0.3s      //
//    2) If saved data exists, show loader for 0.3s then call renderOutput()       //
//    3) Else show the builder form                                             //
// ───────────────────────────────────────────────────────────────────────────────
async function startAppFlow(currentEmail) {
    hideAllScreens();
    removeCls(welcomeScreen, "hidden");
    addCls(welcomeScreen, "flex");

    const h = new Date().getHours();
    const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    welcomeText.textContent = `${greet}, ${currentEmail}! Ready to Link?`;

    // Fade banner in/out:
    removeCls(welcomeText, "opacity-0");    // show it
    await delay(CONFIG.welcomeBannerDuration);                            // keep it visible 2.5s
    addCls(welcomeText, "opacity-0");       // fade it out
    await delay(CONFIG.welcomeBannerFade);                             // wait 0.3s for fade to complete
    // Hide the welcome overlay before proceeding
    addCls(welcomeScreen, "hidden");
    removeCls(welcomeScreen, "flex");

    // Now either show loader + output or show builder form
    let savedData = null;
    try {
        savedData = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "null");
    } catch (err) {
        console.warn("Failed to parse saved Linktree data, clearing", err);
        localStorage.removeItem(STORAGE_KEY_LINKTREE);
    }
    if (savedData) {
        removeCls(loaderScreen, "hidden");
        addCls(loaderScreen, "flex");
        await delay(CONFIG.loaderSpinnerDuration);                           // spinner for 0.3s
        addCls(loaderScreen, "hidden");
        removeCls(loaderScreen, "flex");
        renderOutput(savedData);
    } else {
        hideAllScreens();
        removeCls(formScreen, 'hidden');
        addCls(formScreen, 'flex');
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// O) SHOW BUILDER FORM (prefill if saved)                                        //
// ───────────────────────────────────────────────────────────────────────────────
function updateFormGradient() {
    const start = gradientStartInput.value || "#a7f3d0";
    const end = gradientEndInput.value || "#6ee7b7";
    if (formScreen) {
        formScreen.style.background = `linear-gradient(to bottom right, ${start}, ${end})`;
    }
}

function showBuilderForm(prefillData = null) {
    hideAllScreens();
    removeCls(formScreen, "hidden");
    addCls(formScreen, "flex");

    updateFormGradient();

    // Reset state
    linksWrapper.innerHTML = "";
    linkRows = [];
    profilePicDataURL = "";
    cardImageDataURL = "";
    cardImageInput.value = "";

    // Hide errors
    addCls(errorProfilePic, "hidden");
    addCls(errorUsername, "hidden");
    addCls(errorLinks, "hidden");

    if (prefillData) {
        // Prefill picture (we’ll use data URL)
        if (prefillData.profilePic) {
            profilePicDataURL = prefillData.profilePic;
        }
        formUsernameInput.value = prefillData.username || "";
        formTaglineInput.value = prefillData.tagline || "";
        formTaglineCount.textContent = `${prefillData.tagline?.length || 0}/100`;
        gradientStartInput.value = prefillData.gradientStart || "#a7f3d0";
        gradientEndInput.value = prefillData.gradientEnd || "#6ee7b7";
        cardColorInput.value = prefillData.cardColor || "#ffffff";
        cardTextColorInput.value = prefillData.cardTextColor || "#111827";
        if (prefillData.cardImage) {
            cardImageDataURL = prefillData.cardImage;
        }
        cardImageInput.value = "";

        (prefillData.links || []).forEach((link) => addLinkRow(link));
    } else {
        formUsernameInput.value = "";
        formTaglineInput.value = "";
        formTaglineCount.textContent = "0/100";
        gradientStartInput.value = "#a7f3d0";
        gradientEndInput.value = "#6ee7b7";
        cardColorInput.value = "#ffffff";
        cardTextColorInput.value = "#111827";
        cardImageInput.value = "";
        addLinkRow();

    }
    updateGenerateButtonState();
    [
        "fa-globe",
        "fa-instagram",
        "fa-github",
        "fa-link",
        "fa-camera",
        "fa-pinterest",
        "fa-twitter",
        "fa-facebook",
        "fa-youtube",
        "fa-linkedin",
        "fa-tiktok",
        "fa-snapchat",
        "fa-discord",
        "fa-reddit",
    ].forEach((ic) => {
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// P) ADD A LINK ROW (optionally prefill). Builds the HTML elements + event listeners
// ───────────────────────────────────────────────────────────────────────────────
function addLinkRow(prefill = null) {
    const rowIndex = linkRows.length;
    const rowDiv = document.createElement("div");
    rowDiv.className = "space-y-1 bg-gray-800 p-4 rounded-lg";
    rowDiv.setAttribute("draggable", "true");

    // 1) Label input
    const labelInput = document.createElement("input");
    labelInput.id = `link-label-${rowIndex}`;
    labelInput.type = "text";
    labelInput.placeholder = "Label (e.g. Website)";
    labelInput.required = true;
    labelInput.autocomplete = "off";
    labelInput.setAttribute("aria-describedby", `error-url-${rowIndex}`);
    labelInput.className =
        "w-full px-3 py-2 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition";

    // 2) Icon select
    const iconSelect = document.createElement("select");
    iconSelect.id = `link-icon-${rowIndex}`;
    iconSelect.className =
        "w-full px-3 py-2 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400";
    [
        "fa-globe",
        "fa-instagram",
        "fa-github",
        "fa-link",
        "fa-camera",
        "fa-pinterest",
        "fa-twitter",
        "fa-facebook",
        "fa-youtube",
        "fa-linkedin",
        "fa-tiktok",
        "fa-snapchat",
        "fa-discord",
        "fa-reddit",
    ].forEach((ic) => {
        const opt = document.createElement("option");
        opt.value = ic;
        opt.textContent = ic.replace("fa-", "").charAt(0).toUpperCase() + ic.replace("fa-", "").slice(1);
        iconSelect.appendChild(opt);
    });

    // 3) URL input
    const urlInput = document.createElement("input");
    urlInput.id = `link-url-${rowIndex}`;
    urlInput.type = "url";
    urlInput.placeholder = "https://example.com";
    urlInput.required = true;
    urlInput.autocomplete = "off";
    urlInput.setAttribute("aria-describedby", `error-url-${rowIndex}`);
    urlInput.className =
        "w-full px-3 py-2 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition";

    // 4) Error text below URL
    const errorText = document.createElement("p");
    errorText.id = `error-url-${rowIndex}`;
    errorText.className = "text-sm text-red-500 hidden";
    errorText.setAttribute("role", "alert");
    errorText.textContent = "Please enter a valid URL.";

    // 5) Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.innerHTML = '<i class="fa fa-trash text-red-500" aria-hidden="true"></i>';
    deleteBtn.setAttribute("aria-label", "Remove this link");
    deleteBtn.className = "mt-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full";
    deleteBtn.addEventListener("click", () => {
        linksWrapper.removeChild(rowDiv);
        linkRows = linkRows.filter((r) => r.container !== rowDiv);
        if (linkRows.length < 10) {
            if (addLinkBtn) {
                addLinkBtn.removeAttribute("disabled");
                removeCls(addLinkBtn, "opacity-50", "cursor-not-allowed");
            }
        }
        updateGenerateButtonState();
    });

    // 6) Move Up button
    const moveUpBtn = document.createElement("button");
    moveUpBtn.type = "button";
    moveUpBtn.innerHTML = '<i class="fa fa-arrow-up" aria-hidden="true"></i>';
    moveUpBtn.setAttribute("aria-label", "Move this link up");
    moveUpBtn.className =
        "ml-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded";
    moveUpBtn.addEventListener("click", () => {
        const idx = linkRows.findIndex((r) => r.container === rowDiv);
        if (idx > 0) {
            linksWrapper.insertBefore(rowDiv, linkRows[idx - 1].container);
            [linkRows[idx - 1], linkRows[idx]] = [linkRows[idx], linkRows[idx - 1]];
        }
    });

    // 7) Move Down button
    const moveDownBtn = document.createElement("button");
    moveDownBtn.type = "button";
    moveDownBtn.innerHTML = '<i class="fa fa-arrow-down" aria-hidden="true"></i>';
    moveDownBtn.setAttribute("aria-label", "Move this link down");
    moveDownBtn.className =
        "ml-1 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded";
    moveDownBtn.addEventListener("click", () => {
        const idx = linkRows.findIndex((r) => r.container === rowDiv);
        if (idx < linkRows.length - 1) {
            linksWrapper.insertBefore(linkRows[idx + 1].container, rowDiv);
            [linkRows[idx], linkRows[idx + 1]] = [linkRows[idx + 1], linkRows[idx]];
        }
    });

    // 8) Drag & Drop (optional)
    rowDiv.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", linkRows.findIndex((r) => r.container === rowDiv));
        e.dataTransfer.effectAllowed = "move";
        rowDiv.classList.add("opacity-50");
    });
    rowDiv.addEventListener("dragend", () => {
        rowDiv.classList.remove("opacity-50");
    });
    rowDiv.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    });
    rowDiv.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const targetIdx = linkRows.findIndex((r) => r.container === rowDiv);
        if (draggedIndex !== targetIdx) {
            const draggedItem = linkRows.splice(draggedIndex, 1)[0];
            linkRows.splice(targetIdx, 0, draggedItem);
            linksWrapper.innerHTML = "";
            linkRows.forEach((r) => linksWrapper.appendChild(r.container));
        }
    });

    // Prefill if provided
    if (prefill) {
        labelInput.value = prefill.label || "";
        if (prefill.icon) iconSelect.value = prefill.icon;
        urlInput.value = prefill.url || "";
        if (isValidURL(urlInput.value.trim())) {
            urlInput.classList.add("border-green-500");
        }
    }

    // URL validation (debounced)
    let debounceTimer;
    urlInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const val = urlInput.value.trim();
            if (val && isValidURL(val)) {
                urlInput.classList.remove("border-red-500");
                urlInput.classList.add("border-green-500");
                errorText.classList.add("hidden");
            } else {
                urlInput.classList.remove("border-green-500");
                urlInput.classList.add("border-red-500");
                errorText.classList.remove("hidden");
            }
            updateGenerateButtonState();
        }, 100);
    });

    // Assemble the row
    rowDiv.appendChild(labelInput);
    rowDiv.appendChild(iconSelect);
    rowDiv.appendChild(urlInput);
    rowDiv.appendChild(errorText);
    rowDiv.appendChild(deleteBtn);
    rowDiv.appendChild(moveUpBtn);
    rowDiv.appendChild(moveDownBtn);
    linksWrapper.appendChild(rowDiv);

    linkRows.push({ container: rowDiv, labelInput, iconSelect, urlInput, errorText });
}

// ───────────────────────────────────────────────────────────────────────────────

// Show/hide Generate button
function updateGenerateButtonState() {
    const picValid = profilePicDataURL !== "";
    const unameValid = isValidHandle(formUsernameInput.value.trim());
    const anyLinkValid = linkRows.some((r) => {
        const u = r.urlInput.value.trim();
        return r.labelInput.value.trim() !== "" && isValidURL(u);
    });

    if (anyLinkValid) {
        addCls(errorLinks, "hidden");
    } else {
        removeCls(errorLinks, "hidden");
    }

    if (picValid && unameValid && anyLinkValid) {
        if (generateBtn) {
            generateBtn.removeAttribute("disabled");
            removeCls(generateBtn, "bg-gray-600", "text-gray-300", "cursor-not-allowed");
            addCls(generateBtn, "bg-emerald-500", "text-white", "hover:bg-emerald-600");
        }
    } else {
        if (generateBtn) {
            generateBtn.setAttribute("disabled", "true");
            addCls(generateBtn, "bg-gray-600", "text-gray-300", "cursor-not-allowed");
        }
    }
}


// ───────────────────────────────────────────────────────────────────────────────
// T) RENDER OUTPUT (in-app Linktree with Download + Back-to-Edit)                 //
// ───────────────────────────────────────────────────────────────────────────────
function renderOutput(data) {
    document.body.style.background = `linear-gradient(to bottom right, ${data.gradientStart || "#a7f3d0"}, ${data.gradientEnd || "#6ee7b7"})`;
    if (outputCard) {
        outputCard.style.backgroundColor = data.cardColor || "#ffffff";
        if (data.cardImage) {
            outputCard.style.backgroundImage = `url(${data.cardImage})`;
            outputCard.style.backgroundSize = "cover";
        } else {
            outputCard.style.backgroundImage = "none";
        }
    } else {
        console.warn('[Debug] #output-card not found – skipping card styles');
    }
    if (outputProfilePic) {
        if (data.profilePic) {
        outputProfilePic.src = data.profilePic;
        removeCls(outputProfilePic, "hidden");
      } else {
        addCls(outputProfilePic, "hidden");
      }
    }

    if (outputTagline) {
        if (data.tagline?.trim()?.length > 0) {
            outputTagline.textContent = data.tagline;
            removeCls(outputTagline, "hidden");
        } else {
            addCls(outputTagline, "hidden");
        }
    } else {
        console.warn('[Debug] #output-tagline not found – skipping');
    }

    const textColor = data.cardTextColor || "#111827";
    if (displayUsername) {
        displayUsername.style.color = textColor;
        displayUsername.textContent = data.username || "@yourhandle";
    } else {
        console.warn('[Debug] #display-username not found – skipping');
    }
    if (outputTagline) {
        outputTagline.style.color = textColor;
    }
    if (linksContainer) {
        linksContainer.innerHTML = "";
    }
    data.links.forEach((link) => {
        if (link.label && isValidURL(link.url)) {
            const btn = document.createElement("a");
            btn.href = link.url;
            btn.target = "_blank";
            btn.className =
                "flex items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-400";
            const icon = document.createElement("i");
            icon.className = `fa ${link.icon} mr-2`;
            icon.setAttribute("aria-hidden", "true");
            const span = document.createElement("span");
            span.textContent = link.label;
            btn.appendChild(icon);
            btn.appendChild(span);
            if (linksContainer) {
                linksContainer.appendChild(btn);
            }
        }
    });

    if (outputCard) {
        removeCls(outputCard, "animate-pulse");
        addCls(outputCard, "animate-fadeInUp");
    }

    hideAllScreens();
    if (linktreeScreen) {
        removeCls(linktreeScreen, "hidden");
        addCls(linktreeScreen, "flex");
    } else {
        console.warn('[Debug] #linktree-screen not found – cannot display output');
    }
}
