// Sprint 6: Performance & Responsiveness (light mode only)
(function () {
    // LocalStorage Keys
    const STORAGE_KEY = 'linktreeData';
    const HAS_VISITED_KEY = 'hasVisited';

    // Utility Validators
    function isValidURL(url) {
        try {
            const u = new URL(url);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    }
    function isValidUsername(u) {
        return /^@[A-Za-z0-9_]{2,29}$/.test(u);
    }

    // Wait until DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        // Screen references
        const welcomeScreen = document.getElementById('welcome-screen');
        const formScreen = document.getElementById('form-screen');
        const loaderScreen = document.getElementById('loader-screen');
        const linktreeScreen = document.getElementById('linktree-screen');
        const welcomeText = document.getElementById('welcome-text');
        const generateBtn = document.getElementById('generate-btn');
        const bypassBtn = document.getElementById('bypass-btn');
        const backBtn = document.getElementById('back-btn');
        const resetBtn = document.getElementById('reset-btn');

        // Form field references
        const profilePicInput = document.getElementById('profile-pic');
        const usernameInput = document.getElementById('username');
        const taglineInput = document.getElementById('tagline');
        const taglineCount = document.getElementById('tagline-count');
        const linksWrapper = document.getElementById('links-wrapper');
        const addLinkBtn = document.getElementById('add-link-btn');
        const errorProfilePic = document.getElementById('error-profile-pic');
        const errorUsername = document.getElementById('error-username');
        const errorLinks = document.getElementById('error-links');

        // Loader and output references
        const displayUsername = document.getElementById('display-username');
        const linksContainer = document.getElementById('links-container');

        // State
        let linkRows = []; // Array of { container, labelInput, iconSelect, urlInput, errorText }

        //
        // 1) Reset Button: clear all and reload
        //
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem(HAS_VISITED_KEY);
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        });

        //
        // 2) On load: show welcome (first‐time or returning)
        //
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

        //
        // 3) Show Welcome Animation
        //
        function showWelcome(isReturning, hasSavedData) {
            welcomeScreen.classList.remove('hidden');
            welcomeScreen.classList.add('flex');

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

        //
        // 4) Show Form (optionally with prefill)
        //
        function showForm(prefillData = null) {
            welcomeScreen.classList.add('hidden');
            linktreeScreen.classList.add('hidden');
            loaderScreen.classList.add('hidden');
            formScreen.classList.remove('hidden');
            formScreen.classList.add('flex');

            // Clear & recreate link rows
            linksWrapper.innerHTML = '';
            linkRows = [];

            if (prefillData) {
                profilePicInput.value = prefillData.profilePic || '';
                usernameInput.value = prefillData.username || '@yourhandle';
                taglineInput.value = prefillData.tagline || '';
                taglineCount.textContent = `${prefillData.tagline?.length || 0}/100`;

                (prefillData.links || []).forEach(link => {
                    addLinkRow(link);
                });
            } else {
                addLinkRow();
            }

            updateGenerateButtonState();
        }

        //
        // 5) Add a New Link Row (optionally prefill)
        //
        function addLinkRow(prefill = null) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'space-y-1 bg-gray-100 p-4 rounded-lg';

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.placeholder = 'Label (e.g. Website)';
            labelInput.required = true;
            labelInput.className = 'w-full px-3 py-2 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent focus:border-emerald-500 transition';

            const iconSelect = document.createElement('select');
            iconSelect.className = 'w-full px-3 py-2 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500';
            const iconOptions = ['fa-globe', 'fa-instagram', 'fa-github', 'fa-link', 'fa-camera', 'fa-pinterest'];
            iconOptions.forEach(ic => {
                const opt = document.createElement('option');
                opt.value = ic;
                opt.textContent = ic.replace('fa-', '').charAt(0).toUpperCase() + ic.replace('fa-', '').slice(1);
                iconSelect.appendChild(opt);
            });

            const urlInput = document.createElement('input');
            urlInput.type = 'url';
            urlInput.placeholder = 'https://example.com';
            urlInput.required = true;
            urlInput.className = 'w-full px-3 py-2 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent focus:border-emerald-500 transition';
            urlInput.setAttribute('aria-describedby', 'error-url');

            const errorText = document.createElement('p');
            errorText.id = 'error-url';
            errorText.className = 'text-sm text-red-500 hidden';
            errorText.textContent = 'Please enter a valid URL.';

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '<i class="fa fa-trash text-red-500"></i>';
            deleteBtn.className = 'mt-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full';
            deleteBtn.setAttribute('aria-label', 'Remove link');
            deleteBtn.addEventListener('click', () => {
                linksWrapper.removeChild(rowDiv);
                linkRows = linkRows.filter(r => r.container !== rowDiv);
                if (linkRows.length < 10) {
                    addLinkBtn.removeAttribute('disabled');
                    addLinkBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                updateGenerateButtonState();
            });

            // Prefill if provided
            if (prefill) {
                labelInput.value = prefill.label || '';
                if (prefill.icon) iconSelect.value = prefill.icon;
                urlInput.value = prefill.url || '';
                if (isValidURL(prefill.url)) {
                    urlInput.classList.add('border-green-500');
                }
            }

            // Debounce URL input validation (100ms)
            let debounceTimer;
            urlInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const val = urlInput.value.trim();
                    if (isValidURL(val)) {
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

            rowDiv.appendChild(labelInput);
            rowDiv.appendChild(iconSelect);
            rowDiv.appendChild(urlInput);
            rowDiv.appendChild(errorText);
            rowDiv.appendChild(deleteBtn);
            linksWrapper.appendChild(rowDiv);

            linkRows.push({ container: rowDiv, labelInput, iconSelect, urlInput, errorText });
        }

        addLinkBtn.addEventListener('click', () => {
            if (linkRows.length < 10) addLinkRow();
            if (linkRows.length >= 10) {
                addLinkBtn.setAttribute('disabled', 'true');
                addLinkBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            updateGenerateButtonState();
        });

        //
        // 6) Input Validations (with tiny debounce for performance)
        //
        function debounce(fn, delay) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), delay);
            };
        }

        profilePicInput.addEventListener(
            'input',
            debounce(() => {
                const url = profilePicInput.value.trim();
                if (isValidURL(url)) {
                    profilePicInput.classList.remove('border-red-500');
                    profilePicInput.classList.add('border-green-500');
                    errorProfilePic.classList.add('hidden');
                } else {
                    profilePicInput.classList.remove('border-green-500');
                    profilePicInput.classList.add('border-red-500');
                    errorProfilePic.classList.remove('hidden');
                }
                updateGenerateButtonState();
            }, 100)
        );

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

        taglineInput.addEventListener('input', debounce(() => {
            const len = taglineInput.value.length;
            taglineCount.textContent = `${len}/100`;
        }, 50));

        function updateGenerateButtonState() {
            const picValid = isValidURL(profilePicInput.value.trim());
            const unameValid = isValidUsername(usernameInput.value.trim());
            const anyLinkValid = linkRows.some(r => isValidURL(r.urlInput.value.trim()) && r.labelInput.value.trim() !== '');

            if (anyLinkValid) errorLinks.classList.add('hidden');
            else errorLinks.classList.remove('hidden');

            if (picValid && unameValid && anyLinkValid) {
                generateBtn.removeAttribute('disabled');
                generateBtn.classList.remove('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
                generateBtn.classList.add('bg-emerald-500', 'text-white', 'hover:bg-emerald-600');
            } else {
                generateBtn.setAttribute('disabled', 'true');
                generateBtn.classList.remove('bg-emerald-500', 'text-white', 'hover:bg-emerald-600');
                generateBtn.classList.add('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
            }
        }

        //
        // 7) Generate → Loader → Output (and save)
        //
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            formScreen.classList.add('hidden');

            const data = {
                profilePic: profilePicInput.value.trim(),
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

        //
        // 8) Bypass (Testing) Button Logic (no validation)
        //
        bypassBtn.addEventListener('click', () => {
            formScreen.classList.add('hidden');
            const placeholderData = {
                profilePic: '',
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

        //
        // 9) Render Output + Back to Edit
        //
        function renderOutput(data) {
            displayUsername.textContent = data.username || '@yourhandle';
            linksContainer.innerHTML = '';
            data.links.forEach(link => {
                if (link.label && isValidURL(link.url)) {
                    const btn = document.createElement('a');
                    btn.href = link.url;
                    btn.target = '_blank';
                    btn.className = 'flex flex-wrap items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-500';
                    btn.innerHTML = `<i class="fa ${link.icon} mr-2"></i><span>${link.label}</span>`;
                    linksContainer.appendChild(btn);
                }
            });
            linktreeScreen.classList.remove('hidden');
            linktreeScreen.classList.add('flex');
        }

        function skipToOutput(data) {
            loaderScreen.classList.remove('hidden');
            loaderScreen.classList.add('flex');
            setTimeout(() => {
                loaderScreen.classList.add('hidden');
                loaderScreen.classList.remove('flex');
                renderOutput(data);
            }, 300);
        }

        backBtn.addEventListener('click', () => {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            showForm(saved);
        });
    });
})();
  