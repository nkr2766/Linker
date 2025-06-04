// Sprint 4: LocalStorage & “Back to Edit” integration
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

    // 1) On load, check localStorage
    window.addEventListener('DOMContentLoaded', () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            // If data exists, skip welcome → form, go straight to loader → output
            const data = JSON.parse(saved);
            skipToOutput(data);
        } else {
            // Otherwise, show welcome as normal
            showWelcome();
        }
    });

    // 2) Show Welcome: fade in (0.5s), hold (1.5s), then fade up & out (3s)
    function showWelcome() {
        welcomeScreen.classList.remove('hidden');
        welcomeScreen.classList.add('flex');

        welcomeText.classList.add('fade-in');
        setTimeout(() => {
            welcomeText.classList.remove('fade-in');
            welcomeText.classList.add('fade-up-out');
            setTimeout(showForm, 3000);
        }, 2000);
    }

    // 3) Show Form Screen
    function showForm(prefillData = null) {
        welcomeScreen.classList.add('hidden');
        linktreeScreen.classList.add('hidden');
        loaderScreen.classList.add('hidden');
        formScreen.classList.remove('hidden');
        formScreen.classList.add('flex');

        // Clear existing rows
        linksWrapper.innerHTML = '';
        linkRows = [];

        // If prefillData provided, populate fields
        if (prefillData) {
            profilePicInput.value = prefillData.profilePic || '';
            usernameInput.value = prefillData.username || '@yourhandle';
            taglineInput.value = prefillData.tagline || '';
            taglineCount.textContent = `${prefillData.tagline?.length || 0}/100`;

            (prefillData.links || []).forEach(link => {
                addLinkRow(link);
            });
        } else {
            // Otherwise, create one blank row
            addLinkRow();
        }

        updateGenerateButtonState();
    }

    // 4) Add a New Link Row (optionally prefill a link object)
    function addLinkRow(prefill = null) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'space-y-1 bg-gray-800 p-4 rounded-lg';
        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.placeholder = 'Label (e.g. Website)';
        labelInput.required = true;
        labelInput.className = 'w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border';

        const iconSelect = document.createElement('select');
        iconSelect.className = 'w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
        const iconOptions = ['fa-globe', 'fa-camera', 'fa-pinterest', 'fa-instagram', 'fa-link', 'fa-github'];
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
        urlInput.className = 'w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border';

        const errorText = document.createElement('p');
        errorText.className = 'text-sm text-red-500 hidden';
        errorText.textContent = 'Please enter a valid URL.';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '<i class="fa fa-trash text-red-500"></i>';
        deleteBtn.className = 'mt-2';
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

    // 5) Input Validations (unchanged from Sprint 2)
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

    // 6) Enable/Disable Generate Button
    function updateGenerateButtonState() {
        const picValid = isValidURL(profilePicInput.value.trim());
        const unameValid = isValidUsername(usernameInput.value.trim());
        const anyLinkValid = linkRows.some(r => isValidURL(r.urlInput.value.trim()) && r.labelInput.value.trim() !== '');

        if (anyLinkValid) errorLinks.classList.add('hidden');
        else errorLinks.classList.remove('hidden');

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

    // 7) Show Linktree Output with Skeleton Loader (and save to localStorage)
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        formScreen.classList.add('hidden');

        // Gather all form data into an object
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
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Show loader
        loaderScreen.classList.remove('hidden');
        loaderScreen.classList.add('flex');

        // After 300 ms, hide loader and show actual output
        setTimeout(() => {
            loaderScreen.classList.add('hidden');
            loaderScreen.classList.remove('flex');
            renderOutput(data);
        }, 300);
    });

    // 8) Bypass (Testing) Button Logic (filling localStorage with placeholder)
    bypassBtn.addEventListener('click', () => {
        formScreen.classList.add('hidden');

        // Placeholder data
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
        // Save placeholder to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(placeholderData));

        // Show loader
        loaderScreen.classList.remove('hidden');
        loaderScreen.classList.add('flex');

        // After 300 ms, hide loader and show placeholder output
        setTimeout(() => {
            loaderScreen.classList.add('hidden');
            loaderScreen.classList.remove('flex');
            renderOutput(placeholderData);
        }, 300);
    });

    // 9) Render Output Screen with Back to Edit
    function renderOutput(data) {
        displayUsername.textContent = data.username || '@yourhandle';
        linksContainer.innerHTML = '';
        data.links.forEach(link => {
            if (link.label && isValidURL(link.url)) {
                const btn = document.createElement('a');
                btn.href = link.url;
                btn.target = '_blank';
                btn.className = 'flex items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition';
                btn.innerHTML = `<i class="fa ${link.icon} mr-2"></i><span>${link.label}</span>`;
                linksContainer.appendChild(btn);
            }
        });
        // Show the linktree screen
        linktreeScreen.classList.remove('hidden');
        linktreeScreen.classList.add('flex');
    }

    // 10) Skip directly to loader → output (used on initial load if localStorage exists)
    function skipToOutput(data) {
        // Immediately show loader
        loaderScreen.classList.remove('hidden');
        loaderScreen.classList.add('flex');
        // After 300 ms, hide loader and show output
        setTimeout(() => {
            loaderScreen.classList.add('hidden');
            loaderScreen.classList.remove('flex');
            renderOutput(data);
        }, 300);
    }

    // 11) Back to Edit Button Logic
    backBtn.addEventListener('click', () => {
        // Retrieve saved data
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        // Show form with prefilled data
        showForm(saved);
    });

    // Kick off (handled in event listener for DOMContentLoaded)
    // window.addEventListener('DOMContentLoaded', ...) was already set above.

})();
  