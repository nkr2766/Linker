// app.js
// Firebase Auth + Firestore for Access Codes + Linktree Builder (ESM)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

(async function () {
    // ───────────────────────────────────────────────
    // A) FIREBASE INITIALIZATION
    // ───────────────────────────────────────────────

    // Paste your exact firebaseConfig here:
    const firebaseConfig = {
        apiKey: "AIzaSyDwfQcrwMCbbX6CA-_1UgelCNfVKCVTQ0A",
        authDomain: "linkerapp-9dd4d.firebaseapp.com",
        projectId: "linkerapp-9dd4d",
        storageBucket: "linkerapp-9dd4d.firebasestorage.app",
        messagingSenderId: "1098052666181",
        appId: "1:1098052666181:web:526d045f1c8f44f59fb42c",
        measurementId: "G-LBV1P494PR"
    };

    // Initialize Firebase App, Analytics, Auth, Firestore
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // ───────────────────────────────────────────────
    // B) CONFIGURATION / CONSTANTS
    // ───────────────────────────────────────────────

    // Admin’s Firebase Auth credentials (must match user you created in console)
    const ADMIN_EMAIL = "admin@linkerapp.com";
    const ADMIN_PASSWORD = "?616811Nt";

    // Firestore collection for access codes
    const CODES_COLLECTION = db.collection("codes");

    // localStorage key to store the built Linktree data
    const STORAGE_KEY_LINKTREE = "linkerLinktreeData";

    // ───────────────────────────────────────────────
    // C) UI ELEMENT REFERENCES
    // ───────────────────────────────────────────────

    // 0) Reset button
    const resetBtn = document.getElementById("reset-btn");

    // 1) Login / Signup screen
    const loginScreen = document.getElementById("login-screen");
    const btnAdminLogin = document.getElementById("btn-admin-login");
    const btnUserLogin = document.getElementById("btn-user-login");
    const btnUseAccessCode = document.getElementById("btn-use-access-code");

    // 2) Admin login form
    const adminLoginScreen = document.getElementById("admin-login-screen");
    const adminEmailInput = document.getElementById("admin-email");
    const adminPasswordInput = document.getElementById("admin-password");
    const adminError = document.getElementById("admin-error");
    const adminLoginSubmit = document.getElementById("admin-login-submit");
    const adminLoginBack = document.getElementById("admin-login-back");

    // 3) Admin panel
    const adminPanel = document.getElementById("admin-panel");
    const newAccessCodeInput = document.getElementById("new-access-code");
    const createCodeBtn = document.getElementById("create-code-btn");
    const adminCodeSuccess = document.getElementById("admin-code-success");
    const adminBuildFormBtn = document.getElementById("admin-build-form");
    const adminLogoutBtn = document.getElementById("admin-logout");

    // 4) User login form
    const userLoginScreen = document.getElementById("user-login-screen");
    const userEmailInput = document.getElementById("user-email");
    const userPasswordInput = document.getElementById("user-password");
    const userError = document.getElementById("user-error");
    const userLoginSubmit = document.getElementById("user-login-submit");
    const userLoginBack = document.getElementById("user-login-back");

    // 5) User signup form (with access code)
    const userSignupScreen = document.getElementById("user-signup-screen");
    const signupCodeInput = document.getElementById("signup-code");
    const signupEmailInput = document.getElementById("signup-email");
    const signupPasswordInput = document.getElementById("signup-password");
    const signupCodeError = document.getElementById("signup-code-error");
    const signupSuccess = document.getElementById("signup-success");
    const signupSubmit = document.getElementById("signup-submit");
    const signupBackBtn = document.getElementById("signup-back");

    // 6) Welcome animation screen
    const welcomeScreen = document.getElementById("welcome-screen");
    const welcomeText = document.getElementById("welcome-text");

    // 7) Builder form (Linktree form)
    const formScreen = document.getElementById("form-screen");
    const profilePicFileInput = document.getElementById("profile-pic-file");
    const formUsernameInput = document.getElementById("username"); // “@handle”
    const formTaglineInput = document.getElementById("tagline");
    const formTaglineCount = document.getElementById("tagline-count");
    const linksWrapper = document.getElementById("links-wrapper");
    const addLinkBtn = document.getElementById("add-link-btn");
    const generateBtn = document.getElementById("generate-btn");
    const bypassBtn = document.getElementById("bypass-btn");
    const errorProfilePic = document.getElementById("error-profile-pic");
    const errorUsername = document.getElementById("error-username");
    const errorLinks = document.getElementById("error-links");

    // 8) Loader screen
    const loaderScreen = document.getElementById("loader-screen");

    // 9) Linktree output screen
    const linktreeScreen = document.getElementById("linktree-screen");
    const outputProfilePic = document.getElementById("output-profile-pic");
    const outputTagline = document.getElementById("output-tagline");
    const displayUsername = document.getElementById("display-username");
    const linksContainer = document.getElementById("links-container");
    const backBtn = document.getElementById("back-btn");
    const downloadBtn = document.getElementById("download-btn");

    // State for builder form
    let linkRows = [];
    let profilePicDataURL = "";

    // ───────────────────────────────────────────────
    // D) UTILITY FUNCTIONS
    // ───────────────────────────────────────────────

    // Validate “@handle” (3–30 chars, must start with @, letters/numbers/_)
    function isValidHandle(u) {
        return /^@[A-Za-z0-9_]{2,29}$/.test(u);
    }

    // Validate URLs (http:// or https://)
    function isValidURL(url) {
        try {
            const u = new URL(url);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    }

    // Delay helper
    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Hide all screens/divs
    function hideAllScreens() {
        loginScreen.classList.add("hidden");
        adminLoginScreen.classList.add("hidden");
        adminPanel.classList.add("hidden");
        userLoginScreen.classList.add("hidden");
        userSignupScreen.classList.add("hidden");
        welcomeScreen.classList.add("hidden");
        formScreen.classList.add("hidden");
        loaderScreen.classList.add("hidden");
        linktreeScreen.classList.add("hidden");
    }

    // ───────────────────────────────────────────────
    // E) INITIAL ENTRY POINT
    // ───────────────────────────────────────────────

    function initApp() {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                // No one is signed in → show login screen
                hideAllScreens();
                loginScreen.classList.remove("hidden");
                loginScreen.classList.add("flex");
            } else {
                // Someone is signed in → check if Admin
                const email = firebaseUser.email.toLowerCase();
                if (email === ADMIN_EMAIL.toLowerCase()) {
                    showAdminPanel();
                } else {
                    hideAllScreens();
                    startAppFlow();
                }
            }
        });
    }
    initApp();

    // ───────────────────────────────────────────────
    // F) LOGIN / SIGNUP SCREEN BUTTONS
    // ───────────────────────────────────────────────

    // a) Admin Login button → show Admin Login form
    btnAdminLogin.addEventListener("click", () => {
        hideAllScreens();
        adminLoginScreen.classList.remove("hidden");
        adminLoginScreen.classList.add("flex");
        adminError.classList.add("hidden");
        adminEmailInput.value = "";
        adminPasswordInput.value = "";
    });

    // b) User Login button → show User Login form
    btnUserLogin.addEventListener("click", () => {
        hideAllScreens();
        userLoginScreen.classList.remove("hidden");
        userLoginScreen.classList.add("flex");
        userError.classList.add("hidden");
        userEmailInput.value = "";
        userPasswordInput.value = "";
    });

    // c) Sign Up with Access Code → show User Signup form
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

    // ───────────────────────────────────────────────
    // G) ADMIN LOGIN LOGIC
    // ───────────────────────────────────────────────

    adminLoginSubmit.addEventListener("click", async () => {
        const email = adminEmailInput.value.trim().toLowerCase();
        const pass = adminPasswordInput.value.trim();

        if (email === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD) {
            try {
                // Sign in as Admin via Firebase Auth
                await signInWithEmailAndPassword(auth, email, pass);
                hideAllScreens();
                showAdminPanel();
            } catch (err) {
                adminError.textContent = "Auth error—check console.";
                adminError.classList.remove("hidden");
                console.error("Firebase admin signIn error:", err);
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

    // ───────────────────────────────────────────────
    // H) ADMIN PANEL LOGIC
    // ───────────────────────────────────────────────

    async function showAdminPanel() {
        hideAllScreens();
        adminPanel.classList.remove("hidden");
        adminPanel.classList.add("flex");
        newAccessCodeInput.value = "";
        adminCodeSuccess.classList.add("hidden");
    }

    // a) Create new Access Code (write to Firestore)
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

    // b) Build Form (go to Linktree builder as Admin)
    adminBuildFormBtn.addEventListener("click", () => {
        hideAllScreens();
        startAppFlow();
    });

    // c) Admin Logout
    adminLogoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            hideAllScreens();
            loginScreen.classList.remove("hidden");
            loginScreen.classList.add("flex");
        } catch (err) {
            console.error("Error signing out admin:", err);
        }
    });

    // ───────────────────────────────────────────────
    // I) USER LOGIN LOGIC (Firebase Auth)
    // ───────────────────────────────────────────────

    userLoginSubmit.addEventListener("click", async () => {
        const email = userEmailInput.value.trim().toLowerCase();
        const pass = userPasswordInput.value.trim();
        if (!email || !pass) {
            userError.textContent = "Email and password are required.";
            userError.classList.remove("hidden");
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            hideAllScreens();
            startAppFlow();
        } catch (err) {
            userError.textContent = "Invalid email or password.";
            userError.classList.remove("hidden");
        }
    });

    userLoginBack.addEventListener("click", () => {
        hideAllScreens();
        loginScreen.classList.remove("hidden");
        loginScreen.classList.add("flex");
    });

    // ───────────────────────────────────────────────
    // J) USER SIGNUP LOGIC (Access Code → Firebase Auth)
    // ───────────────────────────────────────────────

    signupSubmit.addEventListener("click", async () => {
        const code = signupCodeInput.value.trim();
        const email = signupEmailInput.value.trim().toLowerCase();
        const pass = signupPasswordInput.value.trim();

        // 1) All fields required
        if (!code || !email || !pass) {
            signupCodeError.textContent = "All fields are required.";
            signupCodeError.classList.remove("hidden");
            return;
        }

        // 2) Check Access Code in Firestore
        const docRef = doc(db, "codes", code);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            signupCodeError.textContent = "Invalid or expired access code.";
            signupCodeError.classList.remove("hidden");
            return;
        }

        // 3) Create the Firebase user (email/password)
        try {
            await createUserWithEmailAndPassword(auth, email, pass);

            // 4) Consume the access code (delete from Firestore)
            await deleteDoc(docRef);

            // 5) Show success & redirect to builder
            signupCodeError.classList.add("hidden");
            signupSuccess.classList.remove("hidden");
            setTimeout(() => {
                hideAllScreens();
                startAppFlow();
            }, 1200);
        } catch (err) {
            console.error("Error creating user:", err);
            signupCodeError.textContent = "Signup failed—email may already be in use.";
            signupCodeError.classList.remove("hidden");
        }
    });

    signupBackBtn.addEventListener("click", () => {
        hideAllScreens();
        loginScreen.classList.remove("hidden");
        loginScreen.classList.add("flex");
    });

    // ───────────────────────────────────────────────
    // K) MAIN APP FLOW (Welcome → Builder)
    // ───────────────────────────────────────────────

    async function startAppFlow() {
        hideAllScreens();
        welcomeScreen.classList.remove("hidden");
        welcomeScreen.classList.add("flex");

        const firebaseUser = auth.currentUser;
        const isAdmin = firebaseUser && firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        welcomeText.textContent = isAdmin
            ? `Hello Admin! Build your Linktree.`
            : `Welcome, ${firebaseUser.email}! Let's build your Linktree.`;

        welcomeText.classList.remove("opacity-0", "fade-up-out");
        welcomeText.classList.add("fade-in");
        await delay(2500);
        welcomeText.classList.remove("fade-in");
        welcomeText.classList.add("fade-up-out");
        await delay(2500);

        // Check if we have saved Linktree data in localStorage
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "null");
        if (savedData) {
            skipToOutput(savedData);
        } else {
            showBuilderForm(null);
        }
    }

    // ───────────────────────────────────────────────
    // L) BUILDER FORM (Prefill if Data)
    // ───────────────────────────────────────────────

    function showBuilderForm(prefillData = null) {
        hideAllScreens();
        formScreen.classList.remove("hidden");
        formScreen.classList.add("flex");

        // Reset builder state
        linksWrapper.innerHTML = "";
        linkRows = [];
        profilePicDataURL = "";

        // Hide errors
        errorProfilePic.classList.add("hidden");
        errorUsername.classList.add("hidden");
        errorLinks.classList.add("hidden");

        if (prefillData) {
            if (prefillData.profilePic) profilePicDataURL = prefillData.profilePic;
            formUsernameInput.value = prefillData.username || "";
            formTaglineInput.value = prefillData.tagline || "";
            formTaglineCount.textContent = `${prefillData.tagline?.length || 0}/100`;
            (prefillData.links || []).forEach((link) => {
                addLinkRow(link);
            });
        } else {
            addLinkRow();
            formUsernameInput.value = "";
            formTaglineInput.value = "";
            formTaglineCount.textContent = "0/100";
        }
        updateGenerateButtonState();
    }

    // ───────────────────────────────────────────────
    // M) ADD A LINK ROW (with optional prefill)
    // ───────────────────────────────────────────────

    function addLinkRow(prefill = null) {
        const rowIndex = linkRows.length;
        const rowDiv = document.createElement("div");
        rowDiv.className = "space-y-1 bg-gray-700 p-4 rounded-lg";
        rowDiv.setAttribute("draggable", "true");

        // Label
        const labelInput = document.createElement("input");
        labelInput.id = `link-label-${rowIndex}`;
        labelInput.type = "text";
        labelInput.placeholder = "Label (e.g. Website)";
        labelInput.required = true;
        labelInput.setAttribute("aria-describedby", `error-url-${rowIndex}`);
        labelInput.className =
            "w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition";

        // Icon
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

        // URL
        const urlInput = document.createElement("input");
        urlInput.id = `link-url-${rowIndex}`;
        urlInput.type = "url";
        urlInput.placeholder = "https://example.com";
        urlInput.required = true;
        urlInput.setAttribute("aria-describedby", `error-url-${rowIndex}`);
        urlInput.className =
            "w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition";

        // Error
        const errorText = document.createElement("p");
        errorText.id = `error-url-${rowIndex}`;
        errorText.className = "text-sm text-red-500 hidden";
        errorText.setAttribute("role", "alert");
        errorText.textContent = "Please enter a valid URL.";

        // Delete
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

        // Move Up
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

        // Move Down
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

        // Prefill if provided
        if (prefill) {
            labelInput.value = prefill.label || "";
            if (prefill.icon) iconSelect.value = prefill.icon;
            urlInput.value = prefill.url || "";
            if (urlInput.value && isValidURL(urlInput.value)) {
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

        // Append elements
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

    // ───────────────────────────────────────────────
    // N) “Add New Link” Button
    // ───────────────────────────────────────────────

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

    // ───────────────────────────────────────────────
    // O) INPUT VALIDATIONS & FILE UPLOAD
    // ───────────────────────────────────────────────

    // Profile picture upload validation
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

    // Username (@handle) validation on blur
    formUsernameInput.addEventListener("blur", () => {
        let val = formUsernameInput.value.trim();
        if (!val.startsWith("@")) {
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

    // Tagline character counter
    formTaglineInput.addEventListener("input", () => {
        formTaglineCount.textContent = `${formTaglineInput.value.length}/100`;
    });

    // Update “Generate” button state
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

    // ───────────────────────────────────────────────
    // P) “Generate” → Loader → Output
    // ───────────────────────────────────────────────

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

    // ───────────────────────────────────────────────
    // Q) “Bypass” (Testing)
    // ───────────────────────────────────────────────

    bypassBtn.addEventListener("click", () => {
        hideAllScreens();
        const placeholderData = {
            profilePic: "",
            username: "@testuser",
            tagline: "",
            links: [
                { label: "Website", icon: "fa-globe", url: "https://example.com" },
                { label: "Instagram", icon: "fa-instagram", url: "https://instagram.com" },
                { label: "GitHub", icon: "fa-github", url: "https://github.com" }
            ]
        };
        localStorage.setItem(STORAGE_KEY_LINKTREE, JSON.stringify(placeholderData));
        loaderScreen.classList.remove("hidden");
        loaderScreen.classList.add("flex");
        setTimeout(() => {
            loaderScreen.classList.add("hidden");
            loaderScreen.classList.remove("flex");
            renderOutput(placeholderData);
        }, 300);
    });

    // ───────────────────────────────────────────────
    // R) RENDER OUTPUT & “Back to Edit”
    // ───────────────────────────────────────────────

    function renderOutput(data) {
        // Profile picture
        if (data.profilePic) {
            outputProfilePic.src = data.profilePic;
            outputProfilePic.classList.remove("hidden");
        } else {
            outputProfilePic.classList.add("hidden");
        }

        // Tagline
        if (data.tagline?.trim()?.length > 0) {
            outputTagline.textContent = data.tagline;
            outputTagline.classList.remove("hidden");
        } else {
            outputTagline.classList.add("hidden");
        }

        // Username
        displayUsername.textContent = data.username || "@yourhandle";

        // Links
        linksContainer.innerHTML = "";
        data.links.forEach((link) => {
            if (link.label && isValidURL(link.url)) {
                const btn = document.createElement("a");
                btn.href = link.url;
                btn.target = "_blank";
                btn.className =
                    "flex flex-wrap items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-400";
                btn.innerHTML = `<i class="fa ${link.icon} mr-2"></i><span>${link.label}</span>`;
                linksContainer.appendChild(btn);
            }
        });

        hideAllScreens();
        linktreeScreen.classList.remove("hidden");
        linktreeScreen.classList.add("flex");
    }

    backBtn.addEventListener("click", () => {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKTREE) || "{}");
        showBuilderForm(saved);
    });

    // ───────────────────────────────────────────────
    // S) SKIP TO OUTPUT (if revisit)
    // ───────────────────────────────────────────────

    function skipToOutput(data) {
        loaderScreen.classList.remove("hidden");
        loaderScreen.classList.add("flex");
        setTimeout(() => {
            loaderScreen.classList.add("hidden");
            loaderScreen.classList.remove("flex");
            renderOutput(data);
        }, 300);
    }

    // ───────────────────────────────────────────────
    // T) RESET BUTTON (clear localStorage + sign out)
    // ───────────────────────────────────────────────

    resetBtn.addEventListener("click", async () => {
        // Clear localStorage (Linktree data)
        localStorage.removeItem(STORAGE_KEY_LINKTREE);
        // Sign out of Firebase
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Error signing out:", err);
        }
        // Reload so state is reset
        location.reload();
    });
})();
