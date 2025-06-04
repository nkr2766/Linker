// app.js
// Linker: Startup fade, Auth & Firestore emulators, login/signup flows, builder, download

// ───────────────────────────────────────────────────────────────────────────────
// A) FIREBASE IMPORTS (Modular v11.8.1)
// ───────────────────────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
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

// ───────────────────────────────────────────────────────────────────────────────
// B) FIREBASE CONFIGURATION (copy/paste from Firebase Console → Project Settings)
// ───────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDwfQcrwMCbbX6CA-_1UgelCNfVKCVTQ0A",
    authDomain: "linkerapp-9dd4d.firebaseapp.com",
    projectId: "linkerapp-9dd4d",
    storageBucket: "linkerapp-9dd4d.firebasestorage.app",
    messagingSenderId: "1098052666181",
    appId: "1:1098052666181:web:526d045f1c8f44f59fb42c",
    measurementId: "G-LBV1P494PR"
};

// Initialize App
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ───────────────────────────────────────────────────────────────────────────────
// C) CONNECT TO EMULATORS WHEN RUNNING LOCALLY (hostname matches “localhost” or “127.0.0.1”)
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
// Admin credentials (must match the user in the Auth emulator or production)
const ADMIN_EMAIL = "admin@linkerapp.com";
const ADMIN_PASSWORD = "?616811Nt";

// Key for saving Linktree data in localStorage
const STORAGE_KEY_LINKTREE = "linkerLinktreeData";

// State for dynamic link rows
let linkRows = [];
let profilePicDataURL = "";

// ───────────────────────────────────────────────────────────────────────────────
// E) UI ELEMENT REFERENCES
// ───────────────────────────────────────────────────────────────────────────────
//
// 1) Startup overlay
const startupScreen = document.getElementById("startup-screen");
const startupText = document.getElementById("startup-text");

// 2) Reset button
const resetBtn = document.getElementById("reset-btn");

// 3) Login landing
const loginScreen = document.getElementById("login-screen");
const btnAdminLogin = document.getElementById("btn-admin-login");
const btnUserLogin = document.getElementById("btn-user-login");
const btnUseAccessCode = document.getElementById("btn-use-access-code");

// 4) Admin login
const adminLoginScreen = document.getElementById("admin-login-screen");
const adminEmailInput = document.getElementById("admin-email");
const adminPasswordInput = document.getElementById("admin-password");
const adminError = document.getElementById("admin-error");
const adminLoginSubmit = document.getElementById("admin-login-submit");
const adminLoginBack = document.getElementById("admin-login-back");

// 5) Admin panel
const adminPanel = document.getElementById("admin-panel");
const newAccessCodeInput = document.getElementById("new-access-code");
const createCodeBtn = document.getElementById("create-code-btn");
const adminCodeSuccess = document.getElementById("admin-code-success");
const adminBuildFormBtn = document.getElementById("admin-build-form");
const adminLogoutBtn = document.getElementById("admin-logout");

// 6) User login
const userLoginScreen = document.getElementById("user-login-screen");
const userEmailInput = document.getElementById("user-email");
const userPasswordInput = document.getElementById("user-password");
const userError = document.getElementById("user-error");
const userLoginSubmit = document.getElementById("user-login-submit");
const userLoginBack = document.getElementById("user-login-back");

// 7) User signup
const userSignupScreen = document.getElementById("user-signup-screen");
const signupCodeInput = document.getElementById("signup-code");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");
const signupCodeError = document.getElementById("signup-code-error");
const signupSuccess = document.getElementById("signup-success");
const signupSubmit = document.getElementById("signup-submit");
const signupBackBtn = document.getElementById("signup-back");

// 8) Welcome (post-login)
const welcomeScreen = document.getElementById("welcome-screen");
const welcomeText = document.getElementById("welcome-text");

// 9) Builder form
const formScreen = document.getElementById("form-screen");
const profilePicFileInput = document.getElementById("profile-pic-file");
const formUsernameInput = document.getElementById("username");
const formTaglineInput = document.getElementById("tagline");
const formTaglineCount = document.getElementById("tagline-count");
const linksWrapper = document.getElementById("links-wrapper");
const addLinkBtn = document.getElementById("add-link-btn");
const generateBtn = document.getElementById("generate-btn");
const errorProfilePic = document.getElementById("error-profile-pic");
const errorUsername = document.getElementById("error-username");
const errorLinks = document.getElementById("error-links");

// 10) Loader screen
const loaderScreen = document.getElementById("loader-screen");

// 11) Linktree output
const linktreeScreen = document.getElementById("linktree-screen");
const outputProfilePic = document.getElementById("output-profile-pic");
const outputTagline = document.getElementById("output-tagline");
const displayUsername = document.getElementById("display-username");
const linksContainer = document.getElementById("links-container");
const backBtn = document.getElementById("back-btn");
const downloadBtn = document.getElementById("download-btn");

// ───────────────────────────────────────────────────────────────────────────────
// F) UTILITY FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────────

// 1) Validate handle → must start “@” + 3–30 chars of letters/numbers/underscore
function isValidHandle(u) {
    return /^@[A-Za-z0-9_]{2,29}$/.test(u);
}

// 2) Validate URL
function isValidURL(url) {
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

// 3) Delay (ms)
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// 4) Hide all “screens” by toggling .hidden / .flex
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
        linktreeScreen
    ].forEach((el) => {
        el.classList.add("hidden");
        el.classList.remove("flex");
    });
}

// 5) Download a Blob as a file
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

// ───────────────────────────────────────────────────────────────────────────────
// G) STARTUP: Fade the black overlay → Then Initialize App (Auth state)       |
// ───────────────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
    // Give the browser a tiny moment, then begin the fade
    setTimeout(() => {
        // Add classes so CSS animations fade background & text over 1s
        startupScreen.classList.add("fade-bg-out");
        startupText.classList.add("fade-text-out");

        // After 1s (when fade finishes), remove the overlay entirely
        setTimeout(() => {
            startupScreen.style.display = "none";
            // Now that the overlay is gone, kick off the normal Auth‐state logic:
            initApp();
        }, 1000);
    }, 100);
});

// ───────────────────────────────────────────────────────────────────────────────
// H) INITIALIZE APP: Listen for Auth State Changes                           |
// ───────────────────────────────────────────────────────────────────────────────
function initApp() {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
            // Nobody is signed in → show landing
            hideAllScreens();
            loginScreen.classList.remove("hidden");
            loginScreen.classList.add("flex");
            resetBtn.classList.add("hidden");
        } else {
            const email = firebaseUser.email.toLowerCase();
            if (email === ADMIN_EMAIL.toLowerCase()) {
                // Admin → show Admin Panel
                showAdminPanel();
                resetBtn.classList.remove("hidden");
            } else {
                // Regular user → show “thank you for logging in” + builder
                hideAllScreens();
                resetBtn.classList.remove("hidden");
                startAppFlow(firebaseUser.email);
            }
        }
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// I) LOGIN / SIGNUP BUTTON HANDLERS (Landing screen)                        |
// ───────────────────────────────────────────────────────────────────────────────
btnAdminLogin.addEventListener("click", () => {
    hideAllScreens();
    adminLoginScreen.classList.remove("hidden");
    adminLoginScreen.classList.add("flex");
    adminError.classList.add("hidden");
    adminEmailInput.value = "";
    adminPasswordInput.value = "";
});
btnUserLogin.addEventListener("click", () => {
    hideAllScreens();
    userLoginScreen.classList.remove("hidden");
    userLoginScreen.classList.add("flex");
    userError.classList.add("hidden");
    userEmailInput.value = "";
    userPasswordInput.value = "";
});
btnUseAccessCode.addEventListener("click", () => {
    hideAllScreens();
    userSignupScreen.classList.remove("hidden");
    userSignupScreen.classList.add("flex");
    signupCodeError.classList.add("hidden");
    signupEmailInput.value = "";
    signupPasswordInput.value = "";
    signupCodeInput.value = "";
    signupSuccess.classList.add("hidden");
});

// ───────────────────────────────────────────────────────────────────────────────
// J) ADMIN LOGIN LOGIC (Email/Password)                                       |
// ───────────────────────────────────────────────────────────────────────────────
adminLoginSubmit.addEventListener("click", async () => {
    const email = adminEmailInput.value.trim().toLowerCase();
    const pass = adminPasswordInput.value.trim();
    if (email === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD) {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            hideAllScreens();
            showAdminPanel();
        } catch (err) {
            console.error("Admin signIn error:", err);
            adminError.textContent = "Authentication error—check the console.";
            adminError.classList.remove("hidden");
        }
    } else {
        adminError.textContent = "Incorrect admin credentials.";
        adminError.classList.remove("hidden");
    }
});
adminLoginBack.addEventListener("click", () => {
    hideAllScreens();
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("flex");
});

// ───────────────────────────────────────────────────────────────────────────────
// K) SHOW ADMIN PANEL (upon login)                                             |
// ───────────────────────────────────────────────────────────────────────────────
async function showAdminPanel() {
    hideAllScreens();
    adminPanel.classList.remove("hidden");
    adminPanel.classList.add("flex");
    newAccessCodeInput.value = "";
    adminCodeSuccess.classList.add("hidden");
}

// Create / Reuse an access code in Firestore
createCodeBtn.addEventListener("click", async () => {
    const code = newAccessCodeInput.value.trim();
    if (!code) return;
    const docRef = doc(db, "codes", code);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        adminCodeSuccess.textContent = `Code “${code}” already exists.`;
        adminCodeSuccess.classList.remove("hidden");
    } else {
        await setDoc(docRef, { createdAt: serverTimestamp() });
        adminCodeSuccess.textContent = `Code “${code}” created!`;
        adminCodeSuccess.classList.remove("hidden");
    }
    newAccessCodeInput.value = "";
});

// Go directly to builder from Admin Panel
adminBuildFormBtn.addEventListener("click", () => {
    hideAllScreens();
    startAppFlow(ADMIN_EMAIL);
});

// Admin sign out
adminLogoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        hideAllScreens();
        loginScreen.classList.remove("hidden");
        loginScreen.classList.add("flex");
        resetBtn.classList.add("hidden");
    } catch (err) {
        console.error("Error signing out admin:", err);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// L) USER LOGIN LOGIC                                                            |
// ───────────────────────────────────────────────────────────────────────────────
userLoginSubmit.addEventListener("click", async () => {
    const email = userEmailInput.value.trim().toLowerCase();
    const pass = userPasswordInput.value.trim();
    if (!email || !pass) {
        userError.textContent = "Email & password are required.";
        userError.classList.remove("hidden");
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        hideAllScreens();
        startAppFlow(email);
    } catch (err) {
        console.error("User login error:", err);
        userError.textContent = "Invalid email or password.";
        userError.classList.remove("hidden");
    }
});
userLoginBack.addEventListener("click", () => {
    hideAllScreens();
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("flex");
});

// ───────────────────────────────────────────────────────────────────────────────
// M) USER SIGNUP LOGIC (Access Code → Create Auth User → Delete Code)            |
// ───────────────────────────────────────────────────────────────────────────────
signupSubmit.addEventListener("click", async () => {
    const code = signupCodeInput.value.trim();
    const email = signupEmailInput.value.trim().toLowerCase();
    const pass = signupPasswordInput.value.trim();

    if (!code || !email || !pass) {
        signupCodeError.textContent = "All fields are required.";
        signupCodeError.classList.remove("hidden");
        return;
    }

    // Check code in Firestore
    const docRef = doc(db, "codes", code);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        signupCodeError.textContent = "Invalid or expired access code.";
        signupCodeError.classList.remove("hidden");
        return;
    }

    // Create Auth user
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        // Delete the access code in Firestore so it can’t be reused
        await deleteDoc(docRef);
        signupCodeError.classList.add("hidden");
        signupSuccess.classList.remove("hidden");

        // After a brief delay, proceed to builder
        setTimeout(() => {
            hideAllScreens();
            startAppFlow(email);
        }, 1200);
    } catch (err) {
        console.error("Error creating user:", err);
        signupCodeError.textContent = "Signup failed—maybe email is already used.";
        signupCodeError.classList.remove("hidden");
    }
});
signupBackBtn.addEventListener("click", () => {
    hideAllScreens();
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("flex");
});

// ───────────────────────────────────────────────────────────────────────────────
// N) MAIN APP FLOW (Welcome → Builder or Skip if saved)                          |
// ───────────────────────────────────────────────────────────────────────────────
async function startAppFlow(currentEmail) {
    hideAllScreens();
    welcomeScreen.classList.remove("hidden");
    welcomeScreen.classList.add("flex");

    // “Thank you for logging in” message
    const isAdmin = currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    welcomeText.textContent = isAdmin
        ? `Thank you for logging in, Admin. Let’s build your Linktree next!`
        : `Thank you for logging in, ${currentEmail}! Let’s build your Linktree!`;

    // Fade the welcome text in/out
    welcomeText.classList.remove("opacity-0");
    await delay(2500);
    welcomeText.classList.add("opacity-0");

    // Check localStorage for existing Linktree
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "null");
    if (savedData) {
        skipToOutput(savedData);
    } else {
        showBuilderForm(savedData);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// O) BUILDER FORM (display form, optionally prefill)                            |
// ───────────────────────────────────────────────────────────────────────────────
function showBuilderForm(prefillData = null) {
    hideAllScreens();
    formScreen.classList.remove("hidden");
    formScreen.classList.add("flex");

    // Reset state
    linksWrapper.innerHTML = "";
    linkRows = [];
    profilePicDataURL = "";

    // Hide prior errors
    errorProfilePic.classList.add("hidden");
    errorUsername.classList.add("hidden");
    errorLinks.classList.add("hidden");

    if (prefillData) {
        // Prefill profile pic
        if (prefillData.profilePic) {
            profilePicDataURL = prefillData.profilePic;
        }
        formUsernameInput.value = prefillData.username || "";
        formTaglineInput.value = prefillData.tagline || "";
        formTaglineCount.textContent = `${prefillData.tagline?.length || 0}/100`;
        (prefillData.links || []).forEach((link) => addLinkRow(link));
    } else {
        // One blank row
        formUsernameInput.value = "";
        formTaglineInput.value = "";
        formTaglineCount.textContent = "0/100";
        addLinkRow();
    }
    updateGenerateButtonState();
}

// ───────────────────────────────────────────────────────────────────────────────
// P) ADD A LINK ROW (with optional prefill)                                     |
// ───────────────────────────────────────────────────────────────────────────────
function addLinkRow(prefill = null) {
    const rowIndex = linkRows.length;
    const rowDiv = document.createElement("div");
    rowDiv.className = "space-y-1 bg-gray-700 p-4 rounded-lg";
    rowDiv.setAttribute("draggable", "true");

    // Label input
    const labelInput = document.createElement("input");
    labelInput.id = `link-label-${rowIndex}`;
    labelInput.type = "text";
    labelInput.placeholder = "Label (e.g. Website)";
    labelInput.required = true;
    labelInput.setAttribute("aria-describedby", `error-url-${rowIndex}`);
    labelInput.className =
        "w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition";

    // Icon select
    const iconSelect = document.createElement("select");
    iconSelect.id = `link-icon-${rowIndex}`;
    iconSelect.className =
        "w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400";
    ["fa-globe", "fa-instagram", "fa-github", "fa-link", "fa-camera", "fa-pinterest"].forEach((ic) => {
        const opt = document.createElement("option");
        opt.value = ic;
        opt.textContent = ic.replace("fa-", "").charAt(0).toUpperCase() + ic.replace("fa-", "").slice(1);
        iconSelect.appendChild(opt);
    });

    // URL input
    const urlInput = document.createElement("input");
    urlInput.id = `link-url-${rowIndex}`;
    urlInput.type = "url";
    urlInput.placeholder = "https://example.com";
    urlInput.required = true;
    urlInput.setAttribute("aria-describedby", `error-url-${rowIndex}`);
    urlInput.className =
        "w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition";

    // Error text below URL
    const errorText = document.createElement("p");
    errorText.id = `error-url-${rowIndex}`;
    errorText.className = "text-sm text-red-500 hidden";
    errorText.setAttribute("role", "alert");
    errorText.textContent = "Please enter a valid URL.";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.innerHTML = '<i class="fa fa-trash text-red-500"></i>';
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

    // Move Up button
    const moveUpBtn = document.createElement("button");
    moveUpBtn.type = "button";
    moveUpBtn.innerHTML = '<i class="fa fa-arrow-up"></i>';
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

    // Move Down button
    const moveDownBtn = document.createElement("button");
    moveDownBtn.type = "button";
    moveDownBtn.innerHTML = '<i class="fa fa-arrow-down"></i>';
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

    // Drag & Drop (optional)
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

    // Prefill if passed
    if (prefill) {
        labelInput.value = prefill.label || "";
        if (prefill.icon) iconSelect.value = prefill.icon;
        urlInput.value = prefill.url || "";
        if (isValidURL(urlInput.value.trim())) {
            urlInput.classList.add("border-green-500");
        }
    }

    // URL validation (debounce)
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

    // Assemble row
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
// Q) "+ Add New Link" Button                                                     |
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
// R) VALIDATE INPUTS & ENABLE “Generate”                                          |
// ───────────────────────────────────────────────────────────────────────────────

// Profile picture upload
profilePicFileInput.addEventListener("change", () => {
    const file = profilePicFileInput.files[0];
    if (file && file.type.startsWith("image/")) {
        errorProfilePic.classList.add("hidden");
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePicDataURL = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        errorProfilePic.classList.remove("hidden");
        profilePicDataURL = "";
    }
    updateGenerateButtonState();
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
        errorUsername.classList.add("hidden");
    } else {
        formUsernameInput.classList.remove("border-green-500");
        formUsernameInput.classList.add("border-red-500");
        errorUsername.classList.remove("hidden");
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
        errorLinks.classList.add("hidden");
    } else {
        errorLinks.classList.remove("hidden");
    }

    if (picValid && unameValid && anyLinkValid) {
        generateBtn.removeAttribute("disabled");
        generateBtn.classList.remove("bg-gray-600", "text-gray-300", "cursor-not-allowed");
        generateBtn.classList.add("bg-emerald-500", "text-white", "hover:bg-emerald-600");
    } else {
        generateBtn.setAttribute("disabled", "true");
        generateBtn.classList.remove("bg-emerald-500", "text-white", "hover:bg-emerald-600");
        generateBtn.classList.add("bg-gray-600", "text-gray-300", "cursor-not-allowed");
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// S) “Generate My Linktree” → SHOW LOADER → RENDER OUTPUT                          |
// ───────────────────────────────────────────────────────────────────────────────
generateBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    hideAllScreens();

    const data = {
        profilePic: profilePicDataURL,
        username: formUsernameInput.value.trim(),
        tagline: formTaglineInput.value.trim(),
        links: linkRows.map((r) => ({
            label: r.labelInput.value.trim(),
            icon: r.iconSelect.value,
            url: r.urlInput.value.trim()
        }))
    };
    localStorage.setItem(STORAGE_KEY_LINKTREE, JSON.stringify(data));

    loaderScreen.classList.remove("hidden");
    loaderScreen.classList.add("flex");
    await delay(300);
    loaderScreen.classList.add("hidden");
    loaderScreen.classList.remove("flex");
    renderOutput(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// T) RENDER OUTPUT (in-app Linktree with Download + Back-to-Edit)                 |
// ───────────────────────────────────────────────────────────────────────────────
function renderOutput(data) {
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

    displayUsername.textContent = data.username || "@yourhandle";

    linksContainer.innerHTML = "";
    data.links.forEach((link) => {
        if (link.label && isValidURL(link.url)) {
            const btn = document.createElement("a");
            btn.href = link.url;
            btn.target = "_blank";
            btn.className =
                "flex items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-400";
            btn.innerHTML = `<i class="fa ${link.icon} mr-2"></i><span>${link.label}</span>`;
            linksContainer.appendChild(btn);
        }
    });

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
// U) DOWNLOAD: Standalone HTML with only the Linktree (no extra buttons)        |
// ───────────────────────────────────────────────────────────────────────────────
downloadBtn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "{}");
    if (!data || !data.links || data.links.length === 0) return;

    // Build minimal HTML
    const safeUsername = data.username || "@yourhandle";
    const safeTagline = data.tagline || "";
    const safePic = data.profilePic || "";
    const bgColorStart = "#a7f3d0"; // Tailwind green-200
    const bgColorEnd = "#6ee7b7"; // Tailwind green-300

    const outputHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeUsername}’s Linktree</title>
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
    background-color: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 32px;
    text-align: center;
    max-width: 360px;
    width: 90%;
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
    color: #111827;
  }
  p.tag {
    margin: 0 0 16px 0;
    font-size: 1rem;
    color: #4b5563;
  }
  .link-btn {
    display: block;
    width: 100%;
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
    ${safePic
            ? `<img src="${safePic}" alt="Profile picture" class="profile" />`
            : ``
        }
    <h1>${safeUsername}</h1>
    ${safeTagline ? `<p class="tag">${safeTagline}</p>` : ``}
    ${data.links
            .map(
                (link) =>
                    `<a href="${link.url}" target="_blank" class="link-btn"><i class="fa ${link.icon}"></i>${link.label}</a>`
            )
            .join("\n    ")}
  </div>
</body>
</html>`;

    const blob = new Blob([outputHtml], { type: "text/html" });
    const filename = `${safeUsername.replace("@", "")}-linktree.html`;
    downloadBlob(filename, blob);
});

// ───────────────────────────────────────────────────────────────────────────────
// V) “Skip to Output” (if localStorage has saved Linktree)                       |
// ───────────────────────────────────────────────────────────────────────────────
function skipToOutput(data) {
    loaderScreen.classList.remove("hidden");
    loaderScreen.classList.add("flex");
    setTimeout(() => {
        loaderScreen.classList.add("hidden");
        loaderScreen.classList.remove("flex");
        renderOutput(data);
    }, 300);
}

// ───────────────────────────────────────────────────────────────────────────────
// W) RESET: Clear localStorage, Sign Out, Reload                                 |
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
