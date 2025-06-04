// app.js
// Sprint 10: Upload‐Photo + Password Protection + Accessibility + Reordering + Analytics

(function () {
    // ------------- Configuration -------------
    // Replace this with whatever password you choose.
    // (Anyone without this password cannot see the form.)
    const CORRECT_PASSWORD = "YourSecretPassword123";

    // LocalStorage keys
    const STORAGE_KEY = 'linktreeData';
    const HAS_VISITED_KEY = 'hasVisited';

    // Simple analytics stub (debounced event logging)
    function logEvent(eventName) {
        if (!window._analyticsDebounce) window._analyticsDebounce = {};
        if (window._analyticsDebounce[eventName]) return;
        console.log(`[Analytics] Event: ${eventName}`);
        window._analyticsDebounce[eventName] = true;
        setTimeout(() => {
            window._analyticsDebounce[eventName] = false;
        }, 500);
    }

    // Validate username (must start with @, 3–30 chars)
    function isValidUsername(u) {
        return /^@[A-Za-z0-9_]{2,29}$/.test(u);
    }

    // Validate file is an image (by MIME type)
    function isValidImageFile(file) {
        return file && file.type.startsWith('image/');
    }

    window.addEventListener('DOMContentLoaded', () => {
        // ---------- DOM References -----------

        // Auth overlay elements
        const authOverlay = document.getElementById('auth-overlay');
        const authPassword = document.getElementById('auth-password');
        const authSubmit = document.getElementById('auth-submit');
        const authError = document.getElementById('auth-error');

        // Core screens
        const welcomeScreen = document.getElementById('welcome-screen');
        const welcomeText = document.getElementById('welcome-text');
        const formScreen = document.getElementById('form-screen');
        const loaderScreen = document.getElementById('loader-screen');
        const linktreeScreen = document.getElementById('linktree-screen');

        // Buttons
        const resetBtn = document.getElementById('reset-btn');
        const generateBtn = document.getElementById('generate-btn');
        const bypassBtn = document.getElementById('bypass-btn');
        const backBtn = document.getElementById('back-btn');

        // Form inputs
        const profilePicFileInput = document.getElementById('profile-pic-file');
        const usernameInput = document.getElementById('username');
        const taglineInput = document.getElementById('tagline');
        const taglineCount = document.getElementById('tagline-count');
        const linksWrapper = document.getElementById('links-wrapper');

        // Make sure this ID matches exactly what’s in index.html
        const addLinkBtn = document.getElementById('add-link-btn');

        const errorProfilePic = document.getElementById('error-profile-pic');
        const errorUsername = document.getElementById('error-username');
        const errorLinks = document.getElementById('error-links');

        // Output elements
        const outputProfilePic = document.getElementById('output-profile-pic');
        const outputTagline = document.getElementById('output-tagline');
        const displayUsername = document.getElementById('display-username');
        const linksContainer = document.getElementById('links-container');

        // State: store link‐row objects in this array
        // Each entry: { container, labelInput, iconSelect, urlInput, errorText, deleteBtn, moveUpBtn, moveDownBtn }
        let linkRows = [];

        // Temporarily holds the uploaded image DataURL
        let profilePicDataURL = "";

        // ------------- 1) PASSWORD PROTECTION (Lock & Key) -------------

        // Hide everything except the auth overlay initially
        function hideAllScreens() {
            welcomeScreen.classList.add('hidden');
            formScreen.classList.add('hidden');
            loaderScreen.classList.add('hidden');
            linktreeScreen.classList.add('hidden');
        }
        hideAllScreens();

        authSubmit.addEventListener('click', () => {
            const pwd = authPassword.value.trim();
            if (pwd === CORRECT_PASSWORD) {
                // Correct → hide overlay & start the normal flow
                authOverlay.classList.add('hidden');
                startAppFlow();
            } else {
                authError.classList.remove('hidden');
            }
        });

        // Trigger unlock on Enter key in password field
        authPassword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                authSubmit.click();
            }
        });

        // ------------- 2) START MAIN APP FLOW -------------

        function startAppFlow() {
            // Once unlocked, we proceed exactly as before: show “Welcome/Welcome Back,” etc.
            const hasVisited = localStorage.getItem(HAS_VISITED_KEY);
            const savedData = localStorage.getItem(STORAGE_KEY);

            if (hasVisited) {
                welcomeText.textContent = 'Welcome back! 👋';
                showWelcome(true, !!savedData);
            } else {
                welcomeText.textContent = 'Welcome! Thanks for purchasing ✨';
                showWelcome(false, false);
            }
            localStorage.setItem(HAS_VISITED_KEY, 'true');
        }

        // ------------- 3) SHOW WELCOME (Fade & Route to Form/Output) -------------

        function showWelcome(isReturning, hasSavedData) {
            hideAllScreens();
            welcomeScreen.classList.remove('hidden');
            welcomeScreen.classList.add('flex');

            // Animate in/out
            welcomeText.classList.remove('opacity-0', 'fade-up-out');
            welcomeText.classList.add('fade-in');
            setTimeout(() => {
                welcomeText.classList.remove('fade-in');
                welcomeText.classList.add('fade-up-out');
                setTimeout(() => {
                    welcomeScreen.classList.add('hidden');
                    if (isReturning && hasSavedData) {
                        skipToOutput(JSON.parse(localStorage.getItem(STORAGE_KEY)));
                    } else {
                        showForm(isReturning ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : null);
                    }
                }, 3000);
            }, 2000);
        }

        // ------------- 4) SHOW FORM (Prefill if Data Exists) -------------

        function showForm(prefillData = null) {
            hideAllScreens();
            formScreen.classList.remove('hidden');
            formScreen.classList.add('flex');

            // Reset any previous state
            linksWrapper.innerHTML = '';
            linkRows = [];
            profilePicDataURL = ""; // clear previous image

            // Clear error messages:
            errorProfilePic.classList.add('hidden');
            errorUsername.classList.add('hidden');
            errorLinks.classList.add('hidden');

            if (prefillData) {
                // Prefill uploaded image data if stored
                if (prefillData.profilePic) {
                    profilePicDataURL = prefillData.profilePic;
                }
                usernameInput.value = prefillData.username || '@yourhandle';
                taglineInput.value = prefillData.tagline || '';
                taglineCount.textContent = `${prefillData.tagline?.length || 0}/100`;
                // Prefill link rows
                (prefillData.links || []).forEach(link => {
                    addLinkRow(link);
                });
            } else {
                // No prefill: create a blank first row
                addLinkRow();
                usernameInput.value = '';
                taglineInput.value = '';
                taglineCount.textContent = '0/100';
            }

            updateGenerateButtonState();
        }

        // ------------- 5) ADD A LINK ROW (with optional prefill) -------------

        function addLinkRow(prefill = null) {
            const rowIndex = linkRows.length; // unique index for IDs
            const rowDiv = document.createElement('div');
            rowDiv.className = 'space-y-1 bg-gray-700 p-4 rounded-lg';
            rowDiv.setAttribute('draggable', 'true'); // for drag‐and‐drop reposition

            // ---------- A) Label Input ----------
            const labelInput = document.createElement('input');
            labelInput.id = `link-label-${rowIndex}`;
            labelInput.type = 'text';
            labelInput.placeholder = 'Label (e.g. Website)';
            labelInput.required = true;
            labelInput.setAttribute('aria-describedby', `error-url-${rowIndex}`);
            labelInput.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition';

            // ---------- B) Icon Selector ----------
            const iconSelect = document.createElement('select');
            iconSelect.id = `link-icon-${rowIndex}`;
            iconSelect.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400';
            ['fa-globe', 'fa-instagram', 'fa-github', 'fa-link', 'fa-camera', 'fa-pinterest'].forEach(ic => {
                const opt = document.createElement('option');
                opt.value = ic;
                opt.textContent = ic.replace('fa-', '').charAt(0).toUpperCase() + ic.replace('fa-', '').slice(1);
                iconSelect.appendChild(opt);
            });

            // ---------- C) URL Input ----------
            const urlInput = document.createElement('input');
            urlInput.id = `link-url-${rowIndex}`;
            urlInput.type = 'url';
            urlInput.placeholder = 'https://example.com';
            urlInput.required = true;
            urlInput.setAttribute('aria-describedby', `error-url-${rowIndex}`);
            urlInput.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition';

            // ---------- D) Error Message for URL ----------
            const errorText = document.createElement('p');
            errorText.id = `error-url-${rowIndex}`;
            errorText.className = 'text-sm text-red-500 hidden';
            errorText.setAttribute('role', 'alert'); // announce to screen readers
            errorText.textContent = 'Please enter a valid URL.';

            // ---------- E) Delete Button ----------
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '<i class="fa fa-trash text-red-500"></i>';
            deleteBtn.setAttribute('aria-label', 'Remove this link');
            deleteBtn.className = 'mt-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full';
            deleteBtn.addEventListener('click', () => {
                linksWrapper.removeChild(rowDiv);
                linkRows = linkRows.filter(r => r.container !== rowDiv);
                if (linkRows.length < 10) {
                    addLinkBtn.removeAttribute('disabled');
                    addLinkBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                updateGenerateButtonState();
            });

            // ---------- F) Move Up Button (Keyboard Reordering) ----------
            const moveUpBtn = document.createElement('button');
            moveUpBtn.type = 'button';
            moveUpBtn.innerHTML = '<i class="fa fa-arrow-up"></i>';
            moveUpBtn.setAttribute('aria-label', 'Move this link up');
            moveUpBtn.className = 'ml-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded';
            moveUpBtn.addEventListener('click', () => {
                const idx = linkRows.findIndex(r => r.container === rowDiv);
                if (idx > 0) {
                    // Swap in DOM
                    linksWrapper.insertBefore(rowDiv, linkRows[idx - 1].container);
                    // Swap in array
                    [linkRows[idx - 1], linkRows[idx]] = [linkRows[idx], linkRows[idx - 1]];
                }
            });

            // ---------- G) Move Down Button (Keyboard Reordering) ----------
            const moveDownBtn = document.createElement('button');
            moveDownBtn.type = 'button';
            moveDownBtn.innerHTML = '<i class="fa fa-arrow-down"></i>';
            moveDownBtn.setAttribute('aria-label', 'Move this link down');
            moveDownBtn.className = 'ml-1 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded';
            moveDownBtn.addEventListener('click', () => {
                const idx = linkRows.findIndex(r => r.container === rowDiv);
                if (idx < linkRows.length - 1) {
                    // Swap in DOM
                    linksWrapper.insertBefore(linkRows[idx + 1].container, rowDiv);
                    // Swap in array
                    [linkRows[idx], linkRows[idx + 1]] = [linkRows[idx + 1], linkRows[idx]];
                }
            });

            // ---------- H) Drag & Drop (Mouse‐based Reordering) ----------
            rowDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', linkRows.findIndex(r => r.container === rowDiv));
                e.dataTransfer.effectAllowed = 'move';
                rowDiv.classList.add('opacity-50');
            });
            rowDiv.addEventListener('dragend', () => {
                rowDiv.classList.remove('opacity-50');
            });
            rowDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            rowDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const targetIdx = linkRows.findIndex(r => r.container === rowDiv);
                if (draggedIndex !== targetIdx) {
                    // Extract dragged item from array
                    const draggedItem = linkRows.splice(draggedIndex, 1)[0];
                    // Insert at new position
                    linkRows.splice(targetIdx, 0, draggedItem);
                    // Re‐render in correct order
                    linksWrapper.innerHTML = '';
                    linkRows.forEach(r => linksWrapper.appendChild(r.container));
                }
            });

            // ---------- I) Prefill (if provided) ----------
            if (prefill) {
                labelInput.value = prefill.label || '';
                if (prefill.icon) iconSelect.value = prefill.icon;
                urlInput.value = prefill.url || '';
                if (urlInput.value && isValidURL(urlInput.value)) {
                    urlInput.classList.add('border-green-500');
                }
            }

            // ---------- J) URL Validation (debounced) ----------
            let debounceTimer;
            urlInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const val = urlInput.value.trim();
                    if (val && isValidURL(val)) {
                        urlInput.classList.remove('border-red-500');
                        urlInput.classList.add('border-green-500');
                        errorText.classList.add('hidden');
                    } else {
                        urlInput.classList.remove('border-green-500');
                        urlInput.classList.add('border-red-500');
                        errorText.classList.remove('hidden');
                    }
                    updateGenerateButtonState();
                }, 100);
            });

            // ---------- K) Append elements in desired order ----------
            rowDiv.appendChild(labelInput);
            rowDiv.appendChild(iconSelect);
            rowDiv.appendChild(urlInput);
            rowDiv.appendChild(errorText);
            rowDiv.appendChild(deleteBtn);
            rowDiv.appendChild(moveUpBtn);
            rowDiv.appendChild(moveDownBtn);

            // Insert row into the wrapper
            linksWrapper.appendChild(rowDiv);

            // ---------- L) Store references in linkRows array ----------
            linkRows.push({
                container: rowDiv,
                labelInput,
                iconSelect,
                urlInput,
                errorText,
                deleteBtn,
                moveUpBtn,
                moveDownBtn
            });
        }

        // ------------- 6) “Add New Link” Button Listener -------------

        addLinkBtn.addEventListener('click', () => {
            if (linkRows.length < 10) {
                addLinkRow();
            }
            if (linkRows.length >= 10) {
                addLinkBtn.setAttribute('disabled', 'true');
                addLinkBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            updateGenerateButtonState();
        });

        // ------------- 7) INPUT VALIDATIONS + FILE UPLOAD -------------

        // A) Profile Picture Upload Validation
        profilePicFileInput.addEventListener('change', () => {
            const file = profilePicFileInput.files[0];
            if (isValidImageFile(file)) {
                // Hide any previous error
                errorProfilePic.classList.add('hidden');

                // Read file as Data URL (Base64)
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePicDataURL = e.target.result; // store in global variable
                };
                reader.readAsDataURL(file);
            } else {
                // Show error
                errorProfilePic.classList.remove('hidden');
                profilePicDataURL = ""; // clear any previous data
            }
            updateGenerateButtonState();
        });

        // B) Username Validation on blur
        usernameInput.addEventListener('blur', () => {
            let val = usernameInput.value.trim();
            if (!val.startsWith('@')) {
                val = '@' + val;
                usernameInput.value = val;
            }
            if (isValidUsername(val)) {
                usernameInput.classList.remove('border-red-500');
                usernameInput.classList.add('border-green-500');
                errorUsername.classList.add('hidden');
            } else {
                usernameInput.classList.remove('border-green-500');
                usernameInput.classList.add('border-red-500');
                errorUsername.classList.remove('hidden');
            }
            updateGenerateButtonState();
        });

        // C) Tagline character counter
        taglineInput.addEventListener('input', () => {
            const len = taglineInput.value.length;
            taglineCount.textContent = `${len}/100`;
        });

        // D) Update Generate button state
        function updateGenerateButtonState() {
            const picValid = profilePicDataURL !== "";
            const unameValid = isValidUsername(usernameInput.value.trim());
            const anyLinkValid = linkRows.some(r => {
                const u = r.urlInput.value.trim();
                return r.labelInput.value.trim() !== '' && isValidURL(u);
            });

            if (anyLinkValid) {
                errorLinks.classList.add('hidden');
            } else {
                errorLinks.classList.remove('hidden');
            }

            if (picValid && unameValid && anyLinkValid) {
                generateBtn.removeAttribute('disabled');
                generateBtn.classList.remove('bg-gray-600', 'text-gray-300', 'cursor-not-allowed');
                generateBtn.classList.add('bg-emerald-500', 'text-white', 'hover:bg-emerald-600');
            } else {
                generateBtn.setAttribute('disabled', 'true');
                generateBtn.classList.remove('bg-emerald-500', 'text-white', 'hover:bg-emerald-600');
                generateBtn.classList.add('bg-gray-600', 'text-gray-300', 'cursor-not-allowed');
            }
        }

        // ------------- 8) “Generate” → Loader → Output (save to localStorage) -------------

        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logEvent('generate_clicked');

            formScreen.classList.add('hidden');

            const data = {
                profilePic: profilePicDataURL,                 // Base64 Data URL
                username: usernameInput.value.trim(),
                tagline: taglineInput.value.trim(),
                links: linkRows.map(r => ({
                    label: r.labelInput.value.trim(),
                    icon: r.iconSelect.value,
                    url: r.urlInput.value.trim()
                }))
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            loaderScreen.classList.remove('hidden');
            loaderScreen.classList.add('flex');

            setTimeout(() => {
                loaderScreen.classList.add('hidden');
                loaderScreen.classList.remove('flex');
                renderOutput(data);
            }, 300);
        });

        // ------------- 9) “Bypass” → Loader → Placeholder Output -------------

        bypassBtn.addEventListener('click', () => {
            logEvent('bypass_clicked');
            formScreen.classList.add('hidden');

            const placeholderData = {
                profilePic: "",        // no image
                username: '@testuser',
                tagline: '',
                links: [
                    { label: 'Website', icon: 'fa-globe', url: 'https://example.com' },
                    { label: 'Instagram', icon: 'fa-instagram', url: 'https://instagram.com' },
                    { label: 'GitHub', icon: 'fa-github', url: 'https://github.com' }
                ]
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(placeholderData));

            loaderScreen.classList.remove('hidden');
            loaderScreen.classList.add('flex');

            setTimeout(() => {
                loaderScreen.classList.add('hidden');
                loaderScreen.classList.remove('flex');
                renderOutput(placeholderData);
            }, 300);
        });

        // ------------- 10) RENDER OUTPUT & “Back to Edit” -------------

        function renderOutput(data) {
            // Show or hide profile pic
            if (data.profilePic) {
                outputProfilePic.src = data.profilePic;
                outputProfilePic.classList.remove('hidden');
            } else {
                outputProfilePic.classList.add('hidden');
            }

            // Show or hide tagline
            if (data.tagline && data.tagline.trim().length > 0) {
                outputTagline.textContent = data.tagline;
                outputTagline.classList.remove('hidden');
            } else {
                outputTagline.classList.add('hidden');
            }

            // Username
            displayUsername.textContent = data.username || '@yourhandle';

            // Links
            linksContainer.innerHTML = '';
            data.links.forEach(link => {
                if (link.label && isValidURL(link.url)) {
                    const btn = document.createElement('a');
                    btn.href = link.url;
                    btn.target = '_blank';
                    btn.className = 'flex flex-wrap items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-400';
                    btn.innerHTML = `<i class="fa ${link.icon} mr-2"></i><span>${link.label}</span>`;
                    linksContainer.appendChild(btn);
                }
            });

            hideAllScreens();
            linktreeScreen.classList.remove('hidden');
            linktreeScreen.classList.add('flex');
        }

        // ------------- 11) Skip Directly to Output (if returning) -------------

        function skipToOutput(data) {
            loaderScreen.classList.remove('hidden');
            loaderScreen.classList.add('flex');
            setTimeout(() => {
                loaderScreen.classList.add('hidden');
                loaderScreen.classList.remove('flex');
                renderOutput(data);
            }, 300);
        }

        // ------------- 12) “Back to Edit” -------------

        backBtn.addEventListener('click', () => {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            showForm(saved);
        });
    });
})();
  