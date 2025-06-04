// Sprint 9: Accessibility + Reordering + Analytics (correctly wired up)

(function () {
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

    // URL validator
    function isValidURL(url) {
        try {
            const u = new URL(url);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    }
    // Username validator (must start with @, 3–30 chars total)
    function isValidUsername(u) {
        return /^@[A-Za-z0-9_]{2,29}$/.test(u);
    }

    window.addEventListener('DOMContentLoaded', () => {
        // ───────────────────────────────────────────
        // 1) Grab all the DOM elements we need
        // ───────────────────────────────────────────
        const welcomeScreen = document.getElementById('welcome-screen');
        const formScreen = document.getElementById('form-screen');
        const loaderScreen = document.getElementById('loader-screen');
        const linktreeScreen = document.getElementById('linktree-screen');
        const welcomeText = document.getElementById('welcome-text');
        const generateBtn = document.getElementById('generate-btn');
        const bypassBtn = document.getElementById('bypass-btn');
        const backBtn = document.getElementById('back-btn');
        const resetBtn = document.getElementById('reset-btn');

        // Form fields:
        const profilePicInput = document.getElementById('profile-pic');
        const usernameInput = document.getElementById('username');
        const taglineInput = document.getElementById('tagline');
        const taglineCount = document.getElementById('tagline-count');
        const linksWrapper = document.getElementById('links-wrapper');

        // **This was missing before!** Make sure the ID matches HTML exactly:
        const addLinkBtn = document.getElementById('add-link-btn');

        const errorProfilePic = document.getElementById('error-profile-pic');
        const errorUsername = document.getElementById('error-username');
        const errorLinks = document.getElementById('error-links');

        // Output fields:
        const outputProfilePic = document.getElementById('output-profile-pic');
        const outputTagline = document.getElementById('output-tagline');
        const displayUsername = document.getElementById('display-username');
        const linksContainer = document.getElementById('links-container');

        // State: an array of objects for each link‐row block
        // Each object will hold { container, labelInput, iconSelect, urlInput, errorText, deleteBtn, moveUpBtn, moveDownBtn }
        let linkRows = [];

        //
        // 2) “Reset” Button clears storage and reloads
        //
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem(HAS_VISITED_KEY);
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        });

        //
        // 3) On load → decide if first‐time or returning
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
        // 4) Show “Welcome” with fade animation, then either Form or Output
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
        // 5) Show the Form (prefill if data exists)
        //
        function showForm(prefillData = null) {
            welcomeScreen.classList.add('hidden');
            linktreeScreen.classList.add('hidden');
            loaderScreen.classList.add('hidden');
            formScreen.classList.remove('hidden');
            formScreen.classList.add('flex');

            // Clear existing link rows
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
        // 6) Add a Link‐Row Block (with optional prefill)
        //
        function addLinkRow(prefill = null) {
            const rowIndex = linkRows.length; // e.g. 0 for the first row, 1 for second, etc.
            const rowDiv = document.createElement('div');
            rowDiv.className = 'space-y-1 bg-gray-700 p-4 rounded-lg';

            // Allow mouse users to drag the row
            rowDiv.setAttribute('draggable', 'true');

            // 6.1) Label Input
            const labelInput = document.createElement('input');
            labelInput.id = `link-label-${rowIndex}`;
            labelInput.type = 'text';
            labelInput.placeholder = 'Label (e.g. Website)';
            labelInput.required = true;
            labelInput.setAttribute('aria-describedby', `error-url-${rowIndex}`);
            labelInput.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition';

            // 6.2) Icon Selector
            const iconSelect = document.createElement('select');
            iconSelect.id = `link-icon-${rowIndex}`;
            iconSelect.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400';
            ['fa-globe', 'fa-instagram', 'fa-github', 'fa-link', 'fa-camera', 'fa-pinterest'].forEach(ic => {
                const opt = document.createElement('option');
                opt.value = ic;
                opt.textContent = ic.replace('fa-', '').charAt(0).toUpperCase() + ic.replace('fa-', '').slice(1);
                iconSelect.appendChild(opt);
            });

            // 6.3) URL Input
            const urlInput = document.createElement('input');
            urlInput.id = `link-url-${rowIndex}`;
            urlInput.type = 'url';
            urlInput.placeholder = 'https://example.com';
            urlInput.required = true;
            urlInput.setAttribute('aria-describedby', `error-url-${rowIndex}`);
            urlInput.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition';

            // 6.4) Error Text for URL
            const errorText = document.createElement('p');
            errorText.id = `error-url-${rowIndex}`;
            errorText.className = 'text-sm text-red-500 hidden';
            errorText.setAttribute('role', 'alert'); // announce to screen readers
            errorText.textContent = 'Please enter a valid URL.';

            // 6.5) Delete Button
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

            // 6.6) Move Up Button
            const moveUpBtn = document.createElement('button');
            moveUpBtn.type = 'button';
            moveUpBtn.innerHTML = '<i class="fa fa-arrow-up"></i>';
            moveUpBtn.setAttribute('aria-label', 'Move this link up');
            moveUpBtn.className = 'ml-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded';
            moveUpBtn.addEventListener('click', () => {
                const idx = linkRows.findIndex(r => r.container === rowDiv);
                if (idx > 0) {
                    // Swap in the DOM
                    linksWrapper.insertBefore(rowDiv, linkRows[idx - 1].container);
                    // Swap in the array
                    [linkRows[idx - 1], linkRows[idx]] = [linkRows[idx], linkRows[idx - 1]];
                }
            });

            // 6.7) Move Down Button
            const moveDownBtn = document.createElement('button');
            moveDownBtn.type = 'button';
            moveDownBtn.innerHTML = '<i class="fa fa-arrow-down"></i>';
            moveDownBtn.setAttribute('aria-label', 'Move this link down');
            moveDownBtn.className = 'ml-1 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded';
            moveDownBtn.addEventListener('click', () => {
                const idx = linkRows.findIndex(r => r.container === rowDiv);
                if (idx < linkRows.length - 1) {
                    // Swap in the DOM
                    linksWrapper.insertBefore(linkRows[idx + 1].container, rowDiv);
                    // Swap in the array
                    [linkRows[idx], linkRows[idx + 1]] = [linkRows[idx + 1], linkRows[idx]];
                }
            });

            // 6.8) Drag & Drop (optional mouse-based reordering)
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
                    // Extract the dragged item
                    const draggedItem = linkRows.splice(draggedIndex, 1)[0];
                    // Insert at target index
                    linkRows.splice(targetIdx, 0, draggedItem);
                    // Re-render all rows in the new order
                    linksWrapper.innerHTML = '';
                    linkRows.forEach(r => linksWrapper.appendChild(r.container));
                }
            });

            // 6.9) Prefill logic
            if (prefill) {
                labelInput.value = prefill.label || '';
                if (prefill.icon) iconSelect.value = prefill.icon;
                urlInput.value = prefill.url || '';
                if (isValidURL(prefill.url)) {
                    urlInput.classList.add('border-green-500');
                }
            }

            // 6.10) Debounced URL Validation
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

            // 6.11) Append elements in order
            rowDiv.appendChild(labelInput);
            rowDiv.appendChild(iconSelect);
            rowDiv.appendChild(urlInput);
            rowDiv.appendChild(errorText);
            rowDiv.appendChild(deleteBtn);
            rowDiv.appendChild(moveUpBtn);
            rowDiv.appendChild(moveDownBtn);

            linksWrapper.appendChild(rowDiv);

            // 6.12) Finally, store this row’s references in the array
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

        // 6.13) Wire up the “Add New Link” button
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

        //
        // 7) Input Validations (debounced)
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

        //
        // 8) “Generate” → Loader → Output (save data + analytics)
        //
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logEvent('generate_clicked');

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
        // 9) “Bypass” → Loader → Placeholder Output (analytics)
        //
        bypassBtn.addEventListener('click', () => {
            logEvent('bypass_clicked');
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
        // 10) Render Output & “Back to Edit” (with Profile Pic & Tagline)
        //
        function renderOutput(data) {
            // Profile picture
            if (data.profilePic && isValidURL(data.profilePic)) {
                outputProfilePic.src = data.profilePic;
                outputProfilePic.classList.remove('hidden');
            } else {
                outputProfilePic.classList.add('hidden');
            }

            // Tagline
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

            linktreeScreen.classList.remove('hidden');
            linktreeScreen.classList.add('flex');
        }

        // If returning + get saved data, skip to output
        function skipToOutput(data) {
            loaderScreen.classList.remove('hidden');
            loaderScreen.classList.add('flex');
            setTimeout(() => {
                loaderScreen.classList.add('hidden');
                loaderScreen.classList.remove('flex');
                renderOutput(data);
            }, 300);
        }

        // “Back to Edit” populates form with saved data
        backBtn.addEventListener('click', () => {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            showForm(saved);
        });
    });
})();
  