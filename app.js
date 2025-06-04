// Sprint 3 + Bypass: include a bypass button that uses placeholder data
(function () {
    // Screen references
    const welcomeScreen = document.getElementById('welcome-screen');
    const formScreen = document.getElementById('form-screen');
    const loaderScreen = document.getElementById('loader-screen');
    const linktreeScreen = document.getElementById('linktree-screen');
    const welcomeText = document.getElementById('welcome-text');
    const generateBtn = document.getElementById('generate-btn');
    const bypassBtn = document.getElementById('bypass-btn');

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
    let linkRows = []; // Each item: { container, labelInput, iconSelect, urlInput, errorText }

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
        // Must start with @, 3–30 chars, letters/numbers/underscore after @
        return /^@[A-Za-z0-9_]{2,29}$/.test(u);
    }

    // 1) Show Welcome: fade in (0.5s), hold (1.5s), then fade up & out (3s)
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

    // 2) Show Form Screen
    function showForm() {
        welcomeScreen.classList.add('hidden');
        formScreen.classList.remove('hidden');
        formScreen.classList.add('flex');
        if (linkRows.length === 0) addLinkRow();
        updateGenerateButtonState();
    }

    // 3) Add a New Link Row (same as Sprint 2)
    function addLinkRow() {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'space-y-1 bg-gray-800 p-4 rounded-lg';
        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.placeholder = 'Label (e.g. Website)';
        labelInput.required = true;
        labelInput.className = 'w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

        const iconSelect = document.createElement('select');
        iconSelect.className = 'w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
        const iconOptions = ['fa-globe', 'fa-camera', 'fa-pinterest', 'fa-instagram', 'fa-link'];
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
        urlInput.className = 'w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

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

    // 4) Input Validations (unchanged from Sprint 2)
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

    // 5) Enable/Disable Generate Button
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

    // 6) Show Linktree Output with Skeleton Loader (using real data)
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        formScreen.classList.add('hidden');

        // Show loader
        loaderScreen.classList.remove('hidden');
        loaderScreen.classList.add('flex');

        // After 300 ms, hide loader and show actual output
        setTimeout(() => {
            loaderScreen.classList.add('hidden');
            loaderScreen.classList.remove('flex');

            // Populate displayUsername
            const uname = usernameInput.value.trim() || '@yourhandle';
            displayUsername.textContent = uname;

            // Populate links dynamically
            linksContainer.innerHTML = '';
            linkRows.forEach(r => {
                const labelVal = r.labelInput.value.trim();
                const iconVal = r.iconSelect.value;
                const urlVal = r.urlInput.value.trim();
                if (labelVal && isValidURL(urlVal)) {
                    const btn = document.createElement('a');
                    btn.href = urlVal;
                    btn.target = '_blank';
                    btn.className = 'flex items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition';
                    btn.innerHTML = `<i class="fa ${iconVal} mr-2"></i><span>${labelVal}</span>`;
                    linksContainer.appendChild(btn);
                }
            });

            linktreeScreen.classList.remove('hidden');
            linktreeScreen.classList.add('flex');
        }, 300);
    });

    // 7) Bypass (Testing) Button Logic
    bypassBtn.addEventListener('click', () => {
        formScreen.classList.add('hidden');

        // Show loader
        loaderScreen.classList.remove('hidden');
        loaderScreen.classList.add('flex');

        // After 300 ms, hide loader and show placeholder output
        setTimeout(() => {
            loaderScreen.classList.add('hidden');
            loaderScreen.classList.remove('flex');

            // Placeholder username
            displayUsername.textContent = '@testuser';

            // Placeholder links
            linksContainer.innerHTML = '';
            const placeholders = [
                { label: 'Website', icon: 'fa-globe', url: 'https://example.com' },
                { label: 'Instagram', icon: 'fa-instagram', url: 'https://instagram.com' },
                { label: 'GitHub', icon: 'fa-github', url: 'https://github.com' }
            ];
            placeholders.forEach(ph => {
                const btn = document.createElement('a');
                btn.href = ph.url;
                btn.target = '_blank';
                btn.className = 'flex items-center justify-center bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition';
                btn.innerHTML = `<i class="fa ${ph.icon} mr-2"></i><span>${ph.label}</span>`;
                linksContainer.appendChild(btn);
            });

            linktreeScreen.classList.remove('hidden');
            linktreeScreen.classList.add('flex');
        }, 300);
    });

    // Kick off
    window.addEventListener('DOMContentLoaded', showWelcome);
})();
  