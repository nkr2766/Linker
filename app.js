// … (previous code from Sprint 8) …

window.addEventListener('DOMContentLoaded', () => {
    // … (previous references) …

    // State: array of { container, labelInput, iconSelect, urlInput, errorText, moveUpBtn, moveDownBtn, deleteBtn }
    let linkRows = [];

    // … (reset button logic, showWelcome, etc.) …

    function addLinkRow(prefill = null) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'space-y-1 bg-gray-700 p-4 rounded-lg';

        // SPRINT 9 CHANGE: Make row draggable for optional drag‐and‐drop
        rowDiv.setAttribute('draggable', 'true');

        // Label input (same as before)
        const labelInput = document.createElement('input');
        labelInput.id = `link-label-${linkRows.length}`; // give a unique ID
        labelInput.type = 'text';
        labelInput.placeholder = 'Label (e.g. Website)';
        labelInput.required = true;
        labelInput.setAttribute('aria-describedby', `error-url-${linkRows.length}`);
        labelInput.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition';

        // Icon dropdown
        const iconSelect = document.createElement('select');
        iconSelect.id = `link-icon-${linkRows.length}`;
        iconSelect.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400';
        const iconOptions = ['fa-globe', 'fa-instagram', 'fa-github', 'fa-link', 'fa-camera', 'fa-pinterest'];
        iconOptions.forEach(ic => {
            const opt = document.createElement('option');
            opt.value = ic;
            opt.textContent = ic.replace('fa-', '').charAt(0).toUpperCase() + ic.replace('fa-', '').slice(1);
            iconSelect.appendChild(opt);
        });

        // URL input
        const urlInput = document.createElement('input');
        urlInput.id = `link-url-${linkRows.length}`;
        urlInput.type = 'url';
        urlInput.placeholder = 'https://example.com';
        urlInput.required = true;
        urlInput.setAttribute('aria-describedby', `error-url-${linkRows.length}`);
        urlInput.className = 'w-full px-3 py-2 rounded-md bg-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 transition';

        // Error message for URL
        const errorText = document.createElement('p');
        errorText.id = `error-url-${linkRows.length}`;
        errorText.className = 'text-sm text-red-500 hidden';
        errorText.setAttribute('role', 'alert'); // **SPRINT 9: announce errors**
        errorText.textContent = 'Please enter a valid URL.';

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '<i class="fa fa-trash text-red-500"></i>';
        deleteBtn.setAttribute('aria-label', 'Remove link');
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

        // SPRINT 9 CHANGE: Move Up button
        const moveUpBtn = document.createElement('button');
        moveUpBtn.type = 'button';
        moveUpBtn.innerHTML = '<i class="fa fa-arrow-up"></i>';
        moveUpBtn.setAttribute('aria-label', 'Move this link up');
        moveUpBtn.className = 'ml-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded';
        moveUpBtn.addEventListener('click', () => {
            const idx = linkRows.findIndex(r => r.container === rowDiv);
            if (idx > 0) {
                // Swap DOM nodes
                linksWrapper.insertBefore(rowDiv, linkRows[idx - 1].container);
                // Swap array entries
                [linkRows[idx - 1], linkRows[idx]] = [linkRows[idx], linkRows[idx - 1]];
            }
        });

        // SPRINT 9 CHANGE: Move Down button
        const moveDownBtn = document.createElement('button');
        moveDownBtn.type = 'button';
        moveDownBtn.innerHTML = '<i class="fa fa-arrow-down"></i>';
        moveDownBtn.setAttribute('aria-label', 'Move this link down');
        moveDownBtn.className = 'ml-1 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded';
        moveDownBtn.addEventListener('click', () => {
            const idx = linkRows.findIndex(r => r.container === rowDiv);
            if (idx < linkRows.length - 1) {
                // Swap DOM nodes
                linksWrapper.insertBefore(linkRows[idx + 1].container, rowDiv);
                // Swap array entries
                [linkRows[idx], linkRows[idx + 1]] = [linkRows[idx + 1], linkRows[idx]];
            }
        });

        // SPRINT 9 OPTIONAL: Drag‐and‐Drop for mouse users
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
                // Extract dragged item data
                const draggedItem = linkRows.splice(draggedIndex, 1)[0];
                // Insert at new index
                linkRows.splice(targetIdx, 0, draggedItem);
                // Rebuild DOM in new order
                linksWrapper.innerHTML = '';
                linkRows.forEach(r => linksWrapper.appendChild(r.container));
            }
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

        // Debounced URL validation
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

        // Assemble row in DOM order:
        rowDiv.appendChild(labelInput);
        rowDiv.appendChild(iconSelect);
        rowDiv.appendChild(urlInput);
        rowDiv.appendChild(errorText);
        rowDiv.appendChild(deleteBtn);
        rowDiv.appendChild(moveUpBtn);   // SPRINT 9: Move Up
        rowDiv.appendChild(moveDownBtn); // SPRINT 9: Move Down

        linksWrapper.appendChild(rowDiv);

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

    addLinkBtn.addEventListener('click', () => {
        if (linkRows.length < 10) addLinkRow();
        if (linkRows.length >= 10) {
            addLinkBtn.setAttribute('disabled', 'true');
            addLinkBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        updateGenerateButtonState();
    });

    // … (rest of code unchanged: validations, generate/bypass, renderOutput, etc.) …

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

    // … (skipToOutput and backBtn logic unchanged) …
});
  