// Sprint 5 Enhanced: Floating Theme Toggle + Clear & Reset + a11y
(function () {
    // Screen references
    const welcomeScreen = document.getElementById('welcome-screen');
    const formScreen = document.getElementById('form-screen');
    const loaderScreen = document.getElementById('loader-screen');
    const linktreeScreen = document.getElementById('linktree-screen');
    const welcomeText = document.getElementById('welcome-text');
    const generateBtn = document.getElementById('generate-btn');
    const bypassBtn = document.getElementById('bypass-btn');
    const backBtn = document.getElementById('back-btn');
    const floatThemeToggle = document.getElementById('float-theme-toggle');
    const floatThemeIcon = document.getElementById('float-theme-icon');
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

    // LocalStorage Keys
    const STORAGE_KEY = 'linktreeData';
    const HAS_VISITED_KEY = 'hasVisited';
    const THEME_STORAGE_KEY = 'theme'; // 'light' or 'dark'

    // 1) On load: initialize theme, show welcome logic
    window.addEventListener('DOMContentLoaded', () => {
        initTheme();

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
    });

    // 2) Initialize Theme
    function initTheme() {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        const html = document.documentElement;
        if (stored === 'dark') {
            html.classList.add('dark');
            updateThemeIcon('dark');
        } else {
            html.classList.remove('dark');
            updateThemeIcon('light');
        }
    }

    // 3) Toggle Theme
    function toggleTheme() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem(THEME_STORAGE_KEY, 'light');
            updateThemeIcon('light');
        } else {
            html.classList.add('dark');
            localStorage.setItem(THEME_STORAGE_KEY, 'dark');
            updateThemeIcon('dark');
        }
    }

    // 4) Update the floating theme icon (sun ↔ moon) and aria-pressed
    function updateThemeIcon(current) {
        if (current === 'dark') {
            floatThemeIcon.className = 'fa fa-sun text-xl';
            floatThemeToggle.setAttribute('aria-pressed', 'true');
        } else {
            floatThemeIcon.className = 'fa fa-moon text-xl';
            floatThemeToggle.setAttribute('aria-pressed', 'false');
        }
    }

    // Attach floating theme toggle event
    floatThemeToggle.addEventListener('click', toggleTheme);

    // 5) Reset Button: clear localStorage and reload page
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem(HAS_VISITED_KEY);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(THEME_STORAGE_KEY);
        location.reload();
    });

    // 6) Show Welcome: fade in (0.5s), hold (1.5s), then fade up & out (3s)
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

    // 7) Show Form Screen (optionally prefill data)
    function showForm(prefillData = null) {
        welcomeScreen.classList.add('hidden');
        linktreeScreen.classList.add('hidden');
        loaderScreen.classList.add('hidden');
        formScreen.classList.remove('hidden');
        formScreen.classList.add('flex');

        // Clear existing rows & inputs
        linksWrapper.innerHTML = '';
        linkRows = [];

        // Prefill if data exists
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

    // 8) Add a New Link Row (optionally prefill a link object)
    function addLinkRow(prefill = null) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'space-y-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg';

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.placeholder = 'Label (e.g. Website)';
        labelInput.required = true;
        labelInput.className = 'w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent focus:border-emerald-500';

        const iconSelect = document.createElement('select');
        iconSelect.className = 'w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500';
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
        urlInput.className = 'w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent focus:border-emerald-500';
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

        urlInput.addEventListener('input', () => {
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

    // 9) Input Validations
    profilePicInput.addEventListener('input', () => {
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
    });

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

    taglineInput.addEventListener('input', () => {
        const len = taglineInput.value.length;
        taglineCount.textContent = `${len}/100`;
    });

    // 10) Enable/Disable Generate Button
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

    // 11) Show Linktree Output with Skeleton Loader (and save to localStorage)
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        formScreen.classList.add('hidden');

        // Gather form data
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

        // Show loader
        loaderScreen.classList.remove('hidden');
        loaderScreen.classList.add('flex');

        // After 300 ms, hide loader and show output
        setTimeout(() => {
            loaderScreen.classList.add('hidden');
            loaderScreen.classList.remove('flex');
            renderOutput(data);
        }, 300);
    });

    // 12) Bypass (Testing) Button Logic
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

    // 13) Render Output Screen with “Back to Edit”
    function renderOutput(data) {
        displayUsername.textContent = data.username || '@yourhandle';
        linksContainer.innerHTML = '';
        data.links.forEach(link => {
            if (link.label && isValidURL(link.url)) {
                const btn = document.createElement('a');
                btn.href = link.url;
                btn.target = '_blank';
                btn.className = 'flex items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-500';
                btn.innerHTML = `<i class="fa ${link.icon} mr-2"></i><span>${link.label}</span>`;
                linksContainer.appendChild(btn);
            }
        });
        linktreeScreen.classList.remove('hidden');
        linktreeScreen.classList.add('flex');
    }

    // 14) Skip to loader → output (used on returning visits)
    function skipToOutput(data) {
        loaderScreen.classList.remove('hidden');
        loaderScreen.classList.add('flex');
        setTimeout(() => {
            loaderScreen.classList.add('hidden');
            loaderScreen.classList.remove('flex');
            renderOutput(data);
        }, 300);
    }

    // 15) Back to Edit Button Logic
    backBtn.addEventListener('click', () => {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        showForm(saved);
    });

})();
  