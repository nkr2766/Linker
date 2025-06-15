// ─────────────── INITIAL SETUP ───────────────

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

// --- SURGERY REGION: Splash & Loading Logic ---------------------------------
let isAppReady = false;
let isSplashShown = true;
let loaderTimer = null;
let splashFailTimer = null;

// ───────────────────────────────────────────────────────────────────────────────
// E) UI ELEMENT REFERENCES
// ───────────────────────────────────────────────────────────────────────────────
// (These IDs must match exactly what’s in index.html—don’t rename!)
const startupScreen = document.getElementById("startup-screen");
const resetBtn = document.getElementById("reset-btn");

const loginScreen = document.getElementById("login-screen");
const btnAdminLogin = document.getElementById("btn-admin-login");
const btnUserLogin = document.getElementById("btn-user-login");
const btnUseAccessCode = document.getElementById("btn-use-access-code");

const adminLoginScreen = document.getElementById("admin-login-screen");
const adminLoginForm = document.getElementById("admin-login-form");
const adminEmailInput = document.getElementById("admin-email");
const adminPasswordInput = document.getElementById("admin-password");
const adminError = document.getElementById("admin-error");
const adminLoginSubmit = document.getElementById("admin-login-submit");
const adminLoginBack = document.getElementById("admin-login-back");

const adminPanel = document.getElementById("admin-panel");
const newAccessCodeInput = document.getElementById("new-access-code");
const createCodeBtn = document.getElementById("create-code-btn");
const adminCodeSuccess = document.getElementById("admin-code-success");
const adminBuildFormBtn = document.getElementById("admin-build-form");
const adminLogoutBtn = document.getElementById("admin-logout");

const globalLoader = document.getElementById("global-loader");
const toastContainer = document.getElementById("toast-container");

const userLoginScreen = document.getElementById("user-login-screen");
const userLoginForm = document.getElementById("user-login-form");
const userEmailInput = document.getElementById("user-email");
const userPasswordInput = document.getElementById("user-password");
const userError = document.getElementById("user-error");
const userLoginSubmit = document.getElementById("user-login-submit");
const userLoginBack = document.getElementById("user-login-back");

const userSignupScreen = document.getElementById("user-signup-screen");
const userSignupForm = document.getElementById("user-signup-form");
const signupCodeInput = document.getElementById("signup-code");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");
const signupCodeError = document.getElementById("signup-code-error");
const signupSuccess = document.getElementById("signup-success");
const signupSubmit = document.getElementById("signup-submit");
const signupBackBtn = document.getElementById("signup-back");

const welcomeScreen = document.getElementById("welcome-screen");
const welcomeText = document.getElementById("welcome-text");

const formScreen = document.getElementById("form-screen");
const profilePicFileInput = document.getElementById("profile-pic-file");
const errorProfilePic = document.getElementById("error-profile-pic");
const formUsernameInput = document.getElementById("username");
const errorUsername = document.getElementById("error-username");
const formTaglineInput = document.getElementById("tagline");
const formTaglineCount = document.getElementById("tagline-count");
const gradientStartInput = document.getElementById("gradient-start");
const gradientEndInput = document.getElementById("gradient-end");
const cardColorInput = document.getElementById("card-color");
const cardTextColorInput = document.getElementById("card-text-color");
const cardImageInput = document.getElementById("card-image");
const cardImageClearBtn = document.getElementById("remove-card-image");
const linksWrapper = document.getElementById("links-wrapper");
const addLinkBtn = document.getElementById("add-link-btn");
const errorLinks = document.getElementById("error-links");
const generateBtn = document.getElementById("generate-btn");

const loaderScreen = document.getElementById("loader-screen");

const linktreeScreen = document.getElementById("linktree-screen");
const outputCard = document.getElementById("output-card");
const outputProfilePic = document.getElementById("output-profile-pic");
const displayUsername = document.getElementById("display-username");
const outputTagline = document.getElementById("output-tagline");
const linksContainer = document.getElementById("links-container");
const backBtn = document.getElementById("back-btn");
const downloadBtn = document.getElementById("download-btn");


// ───────────────────────────────────────────────────────────────────────────────
// F) UTILITY HELPERS
// ───────────────────────────────────────────────────────────────────────────────
function delay(ms) {
    return new window.Promise((resolve) => setTimeout(resolve, ms));
}

function fadeInElement(el, duration = 500) {
    if (!el) return;
    el.style.opacity = 0;
    el.classList.remove('hidden');
    el.style.transition = `opacity ${duration}ms`;
    requestAnimationFrame(() => {
        el.style.opacity = 1;
    });
}

function fadeOutElement(el, duration = 500) {
    if (!el) return;
    el.style.opacity = 1;
    el.style.transition = `opacity ${duration}ms`;
    requestAnimationFrame(() => {
        el.style.opacity = 0;
    });
    setTimeout(() => {
        el.classList.add('hidden');
    }, duration);
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
        el.classList.add("hidden");
        el.classList.remove("flex");
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

function showGlobalLoader() {
    if (globalLoader) globalLoader.classList.remove('hidden');
}
function hideGlobalLoader() {
    if (globalLoader) globalLoader.classList.add('hidden');
}

function showToast(msg, type = 'info') {
    if (!toastContainer) return;
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = msg;
    toastContainer.appendChild(div);
    setTimeout(() => div.remove(), 4300);
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function logStep(message, data = null) {
    console.log(`[Step] ${message}`, data);
}

function checkEssentialElements() {
    const ids = [
        'login-screen',
        'admin-login-screen',
        'admin-panel',
        'user-login-screen',
        'user-signup-screen'
    ];
    ids.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`[UI] Missing element: #${id}`);
            showToast('Critical UI missing. Please reload.', 'error');
        }
    });
}

// ───────────────────────────────────────────────────────────────────────────────
//                 Then FORCE sign-out any existing user, then call initApp()
window.addEventListener('load', () => {
  logStep('Starting splash animation');
  hideAllScreens();
  document.body.appendChild(startupScreen);

  const screen = document.getElementById('startup-screen');
  const logo   = document.getElementById('startup-logo');
  if (logo) logo.style.maxWidth = '190px';
  if (screen) screen.classList.add('reveal');

  loaderTimer = setTimeout(() => {
    if (!isAppReady) showGlobalLoader();
  }, 1000);

  splashFailTimer = setTimeout(() => {
    if (!isAppReady) {
      console.warn('[Splash] failsafe triggered');
      markAppReady();
      initApp();
    }
  }, 3000);

  setTimeout(() => {
    if (!isAppReady) initApp();
  }, 1200);
});

function removeSplash() {
    const screen = document.getElementById('startup-screen');
    if (screen) {
        screen.classList.add('reveal');
        setTimeout(() => screen.remove(), 500);
    }
    isSplashShown = false;
}

function markAppReady() {
    if (isAppReady) return;
    isAppReady = true;
    clearTimeout(loaderTimer);
    clearTimeout(splashFailTimer);
    hideGlobalLoader();
    if (isSplashShown) removeSplash();
}

// ───────────────────────────────────────────────────────────────────────────────
// H) initApp(): Listen for Auth state changes → show the correct “screen”        //
// ───────────────────────────────────────────────────────────────────────────────
function initApp() {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
            // No one signed in → show landing screen
            hideAllScreens();
            loginScreen.classList.remove("hidden");
            loginScreen.classList.add("flex");
            resetBtn.style.display = "none";
            markAppReady();
        } else {
            const email = firebaseUser.email.toLowerCase();
            if (email === ADMIN_EMAIL.toLowerCase()) {
                // Admin signed in
                showAdminPanel();
                resetBtn.style.display = "block";
                markAppReady();
            } else {
                // Regular user signed in
                hideAllScreens();
                resetBtn.style.display = "block";
                startAppFlow(firebaseUser.email);
                markAppReady();
            }
        }
    }, err => {
        console.error('[Auth] onAuthStateChanged error', err);
        showToast('Authentication error', 'error');
        markAppReady();
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// I) BUTTON HANDLERS ON LANDING SCREEN                                           //
// ───────────────────────────────────────────────────────────────────────────────
// Button handlers moved inside DOMContentLoaded for safety

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOM Ready] All DOM-dependent logic starts here.');
    checkEssentialElements();

    function safeAddEventListener(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
        else console.error(`[Error] Element with id '${id}' not found for '${event}' listener.`);
    }

    safeAddEventListener('btn-admin-login', 'click', () => {
        logStep('Admin login clicked');
        hideAllScreens();
        adminLoginScreen.classList.remove('hidden');
        adminLoginScreen.classList.add('flex');
    });

    safeAddEventListener('btn-user-login', 'click', () => {
        logStep('User login clicked');
        hideAllScreens();
        userLoginScreen.classList.remove('hidden');
        userLoginScreen.classList.add('flex');
    });

    safeAddEventListener('btn-use-access-code', 'click', () => {
        hideAllScreens();
        userSignupScreen.classList.remove('hidden');
        userSignupScreen.classList.add('flex');
    });

    // All other event listeners use this same safe pattern
});

// ───────────────────────────────────────────────────────────────────────────────
// J) ADMIN LOGIN LOGIC                                                           //
// ───────────────────────────────────────────────────────────────────────────────
adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showGlobalLoader();
    const email = adminEmailInput.value.trim().toLowerCase();
    const pass = adminPasswordInput.value.trim();

    if (email === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD) {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            hideAllScreens();
            showAdminPanel();
        } catch (err) {
            console.error("Admin signIn error:", err);
            adminError.textContent = "Authentication error—check console.";
            fadeInElement(adminError);
            showToast('Admin login failed', 'error');
        }
    } else {
        adminError.textContent = "Incorrect admin credentials.";
        fadeInElement(adminError);
    }
    hideGlobalLoader();
});

adminLoginBack.addEventListener("click", () => {
    hideAllScreens();
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("flex");
    fadeOutElement(adminError);
});

// ───────────────────────────────────────────────────────────────────────────────
// K) SHOW ADMIN PANEL                                                            //
// ───────────────────────────────────────────────────────────────────────────────
async function showAdminPanel() {
    logStep('Loading Admin Panel', { user: auth.currentUser?.email });
    hideAllScreens();
    adminPanel.classList.remove("hidden");
    adminPanel.classList.add("flex");
    newAccessCodeInput.value = "";
    adminCodeSuccess.classList.add("hidden");
    fadeOutElement(adminError);
}

// Generate a new access code (Firestore “codes” collection)
createCodeBtn.addEventListener("click", async () => {
    showGlobalLoader();
    const code = newAccessCodeInput.value.trim();
    if (!code) { hideGlobalLoader(); return; }

    const docRef = doc(db, "codes", code);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        adminCodeSuccess.textContent = `Code "${code}" already exists.`;
        fadeInElement(adminCodeSuccess);
        setTimeout(() => fadeOutElement(adminCodeSuccess), 1500);
        showToast('Code already exists', 'warning');
    } else {
        await setDoc(docRef, { createdAt: serverTimestamp() });
        adminCodeSuccess.textContent = `Code "${code}" created!`;
        fadeInElement(adminCodeSuccess);
        setTimeout(() => fadeOutElement(adminCodeSuccess), 1500);
        showToast('Access code created', 'success');
    }
    newAccessCodeInput.value = "";
    hideGlobalLoader();
});

// Build Form (skip directly to the Linktree builder)
adminBuildFormBtn.addEventListener("click", () => {
    hideAllScreens();
    startAppFlow(ADMIN_EMAIL);
});

// Admin “Logout”
adminLogoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        hideAllScreens();
        loginScreen.classList.remove("hidden");
        loginScreen.classList.add("flex");
        resetBtn.style.display = "none";
    } catch (err) {
        console.error("Error signing out admin:", err);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// L) USER LOGIN LOGIC                                                            //
// ───────────────────────────────────────────────────────────────────────────────
userLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showGlobalLoader();
    const email = userEmailInput.value.trim().toLowerCase();
    const pass = userPasswordInput.value.trim();

    if (!email || !pass) {
        userError.textContent = "Email & password are required.";
        fadeInElement(userError);
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        hideAllScreens();
        startAppFlow(email);
        showToast('Logged in', 'success');
    } catch (err) {
        console.error("User login error:", err);
        userError.textContent = "Invalid email or password.";
        fadeInElement(userError);
        showToast('Login failed', 'error');
    }
    hideGlobalLoader();
});

userLoginBack.addEventListener("click", () => {
    hideAllScreens();
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("flex");
});

// ───────────────────────────────────────────────────────────────────────────────
// M) USER SIGNUP LOGIC (Access Code → Create Auth User → Delete Code)            //
// ───────────────────────────────────────────────────────────────────────────────
userSignupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showGlobalLoader();
    const code = signupCodeInput.value.trim();
    const email = signupEmailInput.value.trim().toLowerCase();
    const pass = signupPasswordInput.value.trim();

    if (!code || !email || !pass) {
        signupCodeError.textContent = "All fields are required.";
        fadeInElement(signupCodeError);
        return;
    }

    // Verify code in Firestore
    const docRef = doc(db, "codes", code);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        signupCodeError.textContent = "Invalid or expired access code.";
        fadeInElement(signupCodeError);
        return;
    }

    // Create Auth user
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        // Delete the used code so it can’t be reused
        await deleteDoc(docRef);

        showToast('Account created', 'success');

        fadeOutElement(signupCodeError);
        fadeInElement(signupSuccess);
        setTimeout(() => fadeOutElement(signupSuccess), SIGNUP_SUCCESS_DELAY_MS);

        // Slight pause so user sees “Account created!” briefly
        setTimeout(() => {
            hideAllScreens();
            startAppFlow(email);
        }, SIGNUP_SUCCESS_DELAY_MS);
    } catch (err) {
        console.error("Error creating user:", err);
        signupCodeError.textContent = "Signup failed—email may already be in use.";
        fadeInElement(signupCodeError);
        showToast('Signup failed', 'error');
    }
    hideGlobalLoader();
});

signupBackBtn.addEventListener("click", () => {
    hideAllScreens();
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("flex");
});

// ───────────────────────────────────────────────────────────────────────────────
// N) MAIN APP FLOW (After any successful login)                                  //
//    1) Show “Thank you for logging in…” banner for 2.5s → fade out in 0.3s      //
//    2) If saved data exists, show loader for 0.3s then call renderOutput()       //
//    3) Else show the builder form                                             //
// ───────────────────────────────────────────────────────────────────────────────
async function startAppFlow(currentEmail) {
    hideAllScreens();
    welcomeScreen.classList.remove("hidden");
    welcomeScreen.classList.add("flex");

    const h = new Date().getHours();
    const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    welcomeText.textContent = `${greet}, ${currentEmail}! Ready to Link?`;

    // Fade banner in/out:
    welcomeText.classList.remove("opacity-0");    // show it
    await delay(2500);                            // keep it visible 2.5s
    welcomeText.classList.add("opacity-0");       // fade it out
    await delay(300);                             // wait 0.3s for fade to complete
    // Hide the welcome overlay before proceeding
    welcomeScreen.classList.add("hidden");
    welcomeScreen.classList.remove("flex");

    // Now either show loader + output or show builder form
    let savedData = null;
    try {
        savedData = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "null");
    } catch (err) {
        console.warn("Failed to parse saved Linktree data, clearing", err);
        localStorage.removeItem(STORAGE_KEY_LINKTREE);
    }
    if (savedData) {
        loaderScreen.classList.remove("hidden");
        loaderScreen.classList.add("flex");
        await delay(300);                           // spinner for 0.3s
        loaderScreen.classList.add("hidden");
        loaderScreen.classList.remove("flex");
        renderOutput(savedData);
    } else {
        hideAllScreens();
        formScreen.classList.remove('hidden');
        formScreen.classList.add('flex');
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// O) SHOW BUILDER FORM (prefill if saved)                                        //
// ───────────────────────────────────────────────────────────────────────────────
function updateFormGradient() {
    const start = gradientStartInput.value || "#a7f3d0";
    const end = gradientEndInput.value || "#6ee7b7";
    formScreen.style.background = `linear-gradient(to bottom right, ${start}, ${end})`;
}
gradientStartInput.addEventListener("input", updateFormGradient);
gradientEndInput.addEventListener("input", updateFormGradient);

function showBuilderForm(prefillData = null) {
    hideAllScreens();
    formScreen.classList.remove("hidden");
    formScreen.classList.add("flex");

    updateFormGradient();

    // Reset state
    linksWrapper.innerHTML = "";
    linkRows = [];
    profilePicDataURL = "";
    cardImageDataURL = "";
    cardImageInput.value = "";

    // Hide errors
    fadeOutElement(errorProfilePic, 0);
    fadeOutElement(errorUsername, 0);
    fadeOutElement(errorLinks, 0);

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
            addLinkBtn.removeAttribute("disabled");
            addLinkBtn.classList.remove("opacity-50", "cursor-not-allowed");
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
// Q) “+ Add New Link” Button                                                     //
// ───────────────────────────────────────────────────────────────────────────────
addLinkBtn.addEventListener("click", () => {
    if (linkRows.length < 10) {
        addLinkRow();
    }
    if (linkRows.length >= 10) {
        addLinkBtn.setAttribute("disabled", "true");
        addLinkBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
    updateGenerateButtonState();
});

// ───────────────────────────────────────────────────────────────────────────────
// R) VALIDATE INPUTS & ENABLE “Generate”                                          //
// ───────────────────────────────────────────────────────────────────────────────
// Profile picture upload
profilePicFileInput.addEventListener("change", () => {
    const file = profilePicFileInput.files[0];
    if (file && file.type.startsWith("image/")) {
        fadeOutElement(errorProfilePic);
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePicDataURL = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        fadeInElement(errorProfilePic);
        profilePicDataURL = "";
    }
    updateGenerateButtonState();
});

// Card background image upload (optional)
cardImageInput.addEventListener("change", () => {
    const file = cardImageInput.files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            cardImageDataURL = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        cardImageDataURL = "";
    }
});

cardImageClearBtn.addEventListener("click", () => {
    cardImageDataURL = "";
    cardImageInput.value = "";
});

// Username validation on blur
formUsernameInput.addEventListener("blur", () => {
    let val = formUsernameInput.value.trim();
    if (!val.startsWith("@") && val.length > 0) {
        val = "@" + val;
        formUsernameInput.value = val;
    }
    if (isValidHandle(val)) {
        formUsernameInput.classList.remove("border-red-500");
        formUsernameInput.classList.add("border-green-500");
        fadeOutElement(errorUsername);
    } else {
        formUsernameInput.classList.remove("border-green-500");
        formUsernameInput.classList.add("border-red-500");
        fadeInElement(errorUsername);
    }
    updateGenerateButtonState();
});

// Tagline counter
formTaglineInput.addEventListener("input", () => {
    formTaglineCount.textContent = `${formTaglineInput.value.length}/100`;
});

// Show/hide Generate button
function updateGenerateButtonState() {
    const picValid = profilePicDataURL !== "";
    const unameValid = isValidHandle(formUsernameInput.value.trim());
    const anyLinkValid = linkRows.some((r) => {
        const u = r.urlInput.value.trim();
        return r.labelInput.value.trim() !== "" && isValidURL(u);
    });

    if (anyLinkValid) {
        fadeOutElement(errorLinks);
    } else {
        fadeInElement(errorLinks);
    }

    if (picValid && unameValid && anyLinkValid) {
        generateBtn.removeAttribute("disabled");
        generateBtn.classList.remove("bg-gray-600", "text-gray-300", "cursor-not-allowed");
        generateBtn.classList.add("bg-emerald-500", "text-white", "hover:bg-emerald-600");
    } else {
        generateBtn.setAttribute("disabled", "true");
        generateBtn.classList.add("bg-gray-600", "text-gray-300", "cursor-not-allowed");
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// S) “Generate My Linktree” → SHOW LOADER → RENDER OUTPUT                          //
// ───────────────────────────────────────────────────────────────────────────────
generateBtn.addEventListener("click", async (e) => {
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
        links: linkRows.map((r) => ({
            label: r.labelInput.value.trim(),
            icon: r.iconSelect.value,
            url: r.urlInput.value.trim()
        }))
    };
    try {
        localStorage.setItem(STORAGE_KEY_LINKTREE, JSON.stringify(data));
    } catch (err) {
        console.warn("LocalStorage quota exceeded, stripping images", err);
        const tmp = { ...data, profilePic: "", cardImage: "" };
        localStorage.setItem(STORAGE_KEY_LINKTREE, JSON.stringify(tmp));
    }

    loaderScreen.classList.remove("hidden");
    loaderScreen.classList.add("flex");
    await delay(300);
    loaderScreen.classList.add("hidden");
    loaderScreen.classList.remove("flex");
    renderOutput(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// T) RENDER OUTPUT (in-app Linktree with Download + Back-to-Edit)                 //
// ───────────────────────────────────────────────────────────────────────────────
function renderOutput(data) {
    document.body.style.background = `linear-gradient(to bottom right, ${data.gradientStart || "#a7f3d0"}, ${data.gradientEnd || "#6ee7b7"})`;
    outputCard.style.backgroundColor = data.cardColor || "#ffffff";
    if (data.cardImage) {
        outputCard.style.backgroundImage = `url(${data.cardImage})`;
        outputCard.style.backgroundSize = "cover";
    } else {
        outputCard.style.backgroundImage = "none";
    }
    if (data.profilePic) {
        outputProfilePic.src = data.profilePic;
        outputProfilePic.classList.remove("hidden");
    } else {
        outputProfilePic.classList.add("hidden");
    }

    if (data.tagline?.trim()?.length > 0) {
        outputTagline.textContent = data.tagline;
        outputTagline.classList.remove("hidden");
    } else {
        outputTagline.classList.add("hidden");
    }

    const textColor = data.cardTextColor || "#111827";
    displayUsername.style.color = textColor;
    outputTagline.style.color = textColor;

    displayUsername.textContent = data.username || "@yourhandle";

    linksContainer.innerHTML = "";
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
            linksContainer.appendChild(btn);
        }
    });

    outputCard.classList.remove("animate-pulse");
    outputCard.classList.add("animate-fadeInUp");

    hideAllScreens();
    linktreeScreen.classList.remove("hidden");
    linktreeScreen.classList.add("flex");
}

// “Back to Edit”
backBtn.addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "{}");
    showBuilderForm(saved);
});

// ───────────────────────────────────────────────────────────────────────────────
// U) DOWNLOAD: Standalone HTML (just the Linktree, no extra buttons)             //
// ───────────────────────────────────────────────────────────────────────────────
downloadBtn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "{}");
    if (!data || !data.links || data.links.length === 0) return;

    const safeUsername = data.username.replace("@", "") || "linker";
    const safeTagline = escapeHTML(data.tagline || "");
    const safePic = data.profilePic || "";
    const bgColorStart = data.gradientStart || "#a7f3d0";
    const bgColorEnd = data.gradientEnd || "#6ee7b7";
    const cardColor = data.cardColor || "#ffffff";
    const textColor = data.cardTextColor || "#111827";
    const cardImage = data.cardImage || "";

    // Build minimal HTML
    const outputHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHTML(data.username)}’s Linktree</title>
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: "Inter", sans-serif;
    background: linear-gradient(to bottom right, ${bgColorStart}, ${bgColorEnd});
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
  .card {
    background-color: ${cardColor};
    ${cardImage ? `background-image: url('${cardImage}'); background-size: cover;` : ""}
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 32px;
    text-align: center;
    max-width: 360px;
    width: 90%;
    box-sizing: border-box;
  }
  img.profile {
    width: 128px;
    height: 128px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 16px;
  }
  h1 {
    margin: 0 0 8px 0;
    font-size: 1.5rem;
    color: ${textColor};
  }
  p.tag {
    margin: 0 0 16px 0;
    font-size: 1rem;
    color: ${textColor};
  }
  .link-btn {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin: 8px 0;
    padding: 12px 16px;
    background-color: #10b981; /* emerald-500 */
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 1rem;
    transition: background-color 0.2s ease-in-out;
  }
  .link-btn:hover {
    background-color: #059669; /* emerald-600 */
  }
  .link-btn i {
    margin-right: 8px;
  }
</style>
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  integrity="sha512-papZHh3cY3VpsQa0bpo0uZtBi8gm38UH3rzZBZagh1SWlDwptG25pbLBO0e4XgbV4QYxRo/mOZxjwRF+dc+0Fg=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
/>
</head>
<body>
  <div class="card">
    ${safePic ? `<img src="${safePic}" alt="Profile picture" class="profile" />` : ""}
    <h1>${escapeHTML(data.username)}</h1>
    ${safeTagline ? `<p class="tag">${safeTagline}</p>` : ""}
    ${data.links
            .map(
                (link) =>
                    `<a href="${escapeHTML(link.url)}" target="_blank" class="link-btn"><i class="fa ${link.icon}" aria-hidden="true"></i>${escapeHTML(link.label)}</a>`
            )
            .join("\n    ")}
  </div>
</body>
</html>`;

    const blob = new Blob([outputHtml], { type: "text/html" });
    const filename = `${safeUsername}-linktree.html`;
    downloadBlob(filename, blob);
});

// ───────────────────────────────────────────────────────────────────────────────
// W) RESET BUTTON: Clear localStorage + Sign Out + reload page                   //
// ───────────────────────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", async () => {
    localStorage.removeItem(STORAGE_KEY_LINKTREE);
    try {
        await signOut(auth);
    } catch (err) {
        console.error("Error signing out:", err);
    }
    location.reload();
});

document.addEventListener('DOMContentLoaded', () => {
  console.debug('[Theme] DOMContentLoaded');
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    console.error('[Theme] toggle not found');
    return;
  }
  // set icon size
  toggle.style.fontSize = '1.5rem';

  const saved = localStorage.getItem('theme') || 'light';
  console.debug('[Theme] init →', saved);
  document.documentElement.setAttribute('data-theme', saved);

  toggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    console.debug('[Theme] toggle →', next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  onAuthStateChanged(auth, user => {
    if (user && user.email !== ADMIN_EMAIL) {
      hideAllScreens();
      formScreen.classList.remove('hidden');
      formScreen.classList.add('flex');
    }
  });

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      generateBtn.click();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }
});
