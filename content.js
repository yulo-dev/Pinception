(function() {
  'use strict';

  // --- SVG Icons ---
  const ICONS = {
    tag: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    favoriteEmpty: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`,
    favoriteFilled: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB300" stroke="#f7dd7e" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
    delete: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
  };

  let pinnedMessages = [];
  let quickPrompts = [];
  let initialized = false;

  const cachedElements = {
    pinBtn: null,
    promptBtn: null,
    pinPopup: null,
    promptPopup: null
  };

  function getDefaultPrompts() {
    return [
      { category: 'STUDY SUPPORT', text: 'Explain this concept as if I\'m a beginner, using analogies and simple examples.', favorite: false },
      { category: 'STUDY SUPPORT', text: 'Create a quick quiz with 5 questions based on this content.', favorite: false },
      { category: 'HEALTH & WELLNESS', text: 'Give me a 3-day meal plan that\'s gut-friendly and warm, avoiding raw foods.', favorite: false },
      { category: 'HEALTH & WELLNESS', text: 'Suggest a short evening routine to help improve my sleep quality.', favorite: false },
      { category: 'WORK & WRITING', text: 'Rewrite this message to sound polite and professional in a business email.', favorite: false },
      { category: 'WORK & WRITING', text: 'Summarize this meeting transcript into 5 action points.', favorite: false }
    ];
  }

  function loadData() {
    return new Promise((resolve) => {
      if (chrome.storage) {
        chrome.storage.local.get(['pinnedMessages', 'quickPrompts'], (result) => {
          pinnedMessages = result.pinnedMessages || [];
          quickPrompts = result.quickPrompts || getDefaultPrompts();
          quickPrompts = quickPrompts.map(p => ({ ...p, favorite: p.favorite || false }));
          resolve();
        });
      }
    });
  }

  function saveData() {
    if (chrome.storage) {
      chrome.storage.local.set({ pinnedMessages, quickPrompts });
    }
  }

  function createFloatingButtons() {
    if (cachedElements.promptBtn) return;
    cachedElements.promptBtn = document.createElement('button');
    cachedElements.promptBtn.className = 'floating-btn prompt-btn';
    cachedElements.promptBtn.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21C9 21.5523 9.44772 22 10 22H14C14.5523 22 15 21.5523 15 21V20H9V21Z" stroke="#333" stroke-width="1.3" fill="none"/><path d="M12 2C8.13401 2 5 5.13401 5 9C5 10.8906 5.89543 12.5634 7.25 13.6056V17C7.25 17.4142 7.58579 17.75 8 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17V13.6056C18.1046 12.5634 19 10.8906 19 9C19 5.13401 15.866 2 12 2Z" fill="none" stroke="#333" stroke-width="2"/><path d="M12 6V10" stroke="#333" stroke-width="2" stroke-linecap="round"/><path d="M10 8H14" stroke="#333" stroke-width="2" stroke-linecap="round"/></svg>`;
    cachedElements.promptBtn.title = 'Quick Prompts';
    cachedElements.promptBtn.addEventListener('click', togglePromptPopup);
    document.body.appendChild(cachedElements.promptBtn);
    cachedElements.pinBtn = document.createElement('button');
    cachedElements.pinBtn.className = 'floating-btn pin-btn';
    cachedElements.pinBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" stroke="#333" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    cachedElements.pinBtn.title = 'Pinned Content';
    cachedElements.pinBtn.addEventListener('click', togglePinPopup);
    document.body.appendChild(cachedElements.pinBtn);
    cachedElements.promptPopup = document.createElement('div');
    cachedElements.promptPopup.className = 'prompt-popup';
    document.body.appendChild(cachedElements.promptPopup);
    cachedElements.pinPopup = document.createElement('div');
    cachedElements.pinPopup.className = 'pin-popup';
    document.body.appendChild(cachedElements.pinPopup);
    document.addEventListener('click', handleOutsideClick);
  }

  function handleOutsideClick(e) {
    if (cachedElements.promptPopup.style.opacity === '1' && !cachedElements.promptBtn.contains(e.target) && !cachedElements.promptPopup.contains(e.target)) {
      hidePopup(cachedElements.promptPopup);
    }
    if (cachedElements.pinPopup.style.opacity === '1' && !cachedElements.pinBtn.contains(e.target) && !cachedElements.pinPopup.contains(e.target)) {
      hidePopup(cachedElements.pinPopup);
    }
    const openMenu = document.querySelector('.prompt-menu-dropdown');
    if (openMenu && !openMenu.contains(e.target) && !e.target.closest('.prompt-menu-btn')) {
        openMenu.remove();
    }
  }

  function showPopup(popupElement) { popupElement.style.visibility = 'visible'; popupElement.style.opacity = '1'; }
  function hidePopup(popupElement) { popupElement.style.visibility = 'hidden'; popupElement.style.opacity = '0'; document.querySelector('.prompt-menu-dropdown')?.remove(); }

  function togglePromptPopup() {
    const isVisible = cachedElements.promptPopup.style.opacity === '1';
    if (isVisible) hidePopup(cachedElements.promptPopup);
    else { updatePromptPopupContent(); showPopup(cachedElements.promptPopup); cachedElements.promptPopup.querySelector('.prompt-search-input')?.focus(); }
  }

  function togglePinPopup() {
    const isVisible = cachedElements.pinPopup.style.opacity === '1';
    if (isVisible) hidePopup(cachedElements.pinPopup);
    else { updatePinPopupContent(); showPopup(cachedElements.pinPopup); }
  }

  function updatePinPopupContent() {
    const popupElement = cachedElements.pinPopup;
    popupElement.innerHTML = '';

    if (pinnedMessages.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-message';
      emptyMsg.textContent = 'No pinned content yet';
      popupElement.appendChild(emptyMsg);
      return;
    }

    // Create a fragment to append items efficiently
    const fragment = document.createDocumentFragment();
    pinnedMessages.slice().reverse().forEach(msg => {
      const item = createPinItem(msg);
      fragment.appendChild(item);
    });
    popupElement.appendChild(fragment);
  }

  function createPinItem(msg) {
    const item = document.createElement('div');
    item.className = 'pin-item-new';

    const text = document.createElement('div');
    text.className = 'pin-text-new clamp-4';
    text.textContent = msg.text;
    text.addEventListener('click', () => {
      findAndHighlightMessage(msg);
      hidePopup(cachedElements.pinPopup);
    });

    const metaRow = document.createElement('div');
    metaRow.className = 'pin-meta-row-new';

    const leftInfo = document.createElement('div');
    leftInfo.className = 'pin-left-info';

    if (msg.tag && msg.tag.trim()) {
      const tagElement = document.createElement('div');
      tagElement.className = 'pin-tag-new';
      tagElement.title = msg.tag;

      // Use the SVG string from ICONS constant
      tagElement.innerHTML = ICONS.tag + ` ${msg.tag}`;

      leftInfo.appendChild(tagElement);
    }

    const timestamp = document.createElement('div');
    timestamp.className = 'pin-timestamp-new';
    timestamp.textContent = msg.timestamp;
    leftInfo.appendChild(timestamp);

    const actions = document.createElement('div');
    actions.className = 'pin-actions-new';

    const findBtn = document.createElement('button');
    findBtn.className = 'pin-find-btn-new';
    findBtn.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21l-4.35-4.35"/>
      </svg>
      Find
    `;
    findBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      findAndHighlightMessage(msg);
      hidePopup(cachedElements.pinPopup);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pin-delete-btn-new';
    deleteBtn.innerHTML = ICONS.delete; // Using from ICONS constant is fine here
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteMessage(msg.id);
      updatePinPopupContent();
    });

    actions.appendChild(findBtn);
    actions.appendChild(deleteBtn);
    metaRow.appendChild(leftInfo);
    metaRow.appendChild(actions);

    item.appendChild(text);
    item.appendChild(metaRow);

    return item;
  }

  function deleteMessage(id) {
    const messageToDelete = pinnedMessages.find(msg => msg.id === id);
    pinnedMessages = pinnedMessages.filter(msg => msg.id !== id);
    saveData();

    if (messageToDelete?.elementId) {
      const messageElement = document.getElementById(messageToDelete.elementId);
      if (messageElement) {
        const pinButton = messageElement.querySelector('.pin-button');
        if (pinButton) updatePinButtonUI(pinButton, false);
        messageElement.removeAttribute('id');
      }
    }

    showNotification('Deleted successfully', 'success');
  }

  function updatePromptPopupContent() {
    const popup = cachedElements.promptPopup;
    popup.innerHTML = '';
    const searchContainer = document.createElement('div');
    searchContainer.className = 'prompt-search-container';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search prompts...';
    searchInput.className = 'prompt-search-input';
    let searchTimeout;
    searchInput.addEventListener('input', (e) => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => renderPrompts(e.target.value.toLowerCase()), 200); });
    searchContainer.appendChild(searchInput);
    const contentContainer = document.createElement('div');
    contentContainer.className = 'prompt-content-container';
    popup.appendChild(searchContainer);
    popup.appendChild(contentContainer);
    const renderPrompts = (searchTerm = '') => {
        contentContainer.innerHTML = '';
        let filtered = searchTerm ? quickPrompts.filter(p => p.text.toLowerCase().includes(searchTerm) || (p.category && p.category.toLowerCase().includes(searchTerm))) : quickPrompts;
        if (filtered.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = searchTerm ? 'No prompts found.' : 'No prompts yet.';
            contentContainer.appendChild(emptyMsg);
        } else {
            const favorites = filtered.filter(p => p.favorite && !searchTerm);
            if (favorites.length > 0) {
                const favHeader = document.createElement('div');
                favHeader.className = 'category-header-simple favorite-header';
                favHeader.innerHTML = `${ICONS.favoriteFilled} Favorites`;
                contentContainer.appendChild(favHeader);
                favorites.forEach(p => contentContainer.appendChild(createPromptItem(p)));
            }
            const nonFavorites = filtered.filter(p => !p.favorite || searchTerm);
            const grouped = nonFavorites.reduce((acc, p) => {
                const category = p.category || 'GENERAL';
                acc[category] = acc[category] || [];
                acc[category].push(p);
                return acc;
            }, {});
            Object.keys(grouped).sort().forEach(category => {
                if (grouped[category].length > 0) {
                    const header = document.createElement('div');
                    header.className = 'category-header-simple';
                    header.textContent = category;
                    contentContainer.appendChild(header);
                    grouped[category].forEach(p => contentContainer.appendChild(createPromptItem(p)));
                }
            });
        }
        const addBtn = document.createElement('button');
        addBtn.className = 'prompt-add-btn';
        addBtn.textContent = '+ Add New Prompt';
        addBtn.onclick = addNewPrompt;
        contentContainer.appendChild(addBtn);
    };
    renderPrompts();
  }

  function createPromptItem(promptData) {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'prompt-item-container';
    const itemText = document.createElement('div');
    itemText.className = 'prompt-item-simple';
    itemText.textContent = promptData.text;
    const menuBtn = document.createElement('button');
    menuBtn.className = 'prompt-menu-btn';
    menuBtn.innerHTML = '⋯';
    menuBtn.title = 'More options';
    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePromptMenu(e, promptData, menuBtn); });
    itemContainer.addEventListener('click', (e) => {
      if (!e.target.closest('.prompt-menu-btn')) {
        insertPrompt(promptData.text);
        itemContainer.classList.add('prompt-selected');
        setTimeout(() => {
          itemContainer.classList.remove('prompt-selected');
          hidePopup(cachedElements.promptPopup);
        }, 1000);
      }
    });
    itemContainer.appendChild(itemText);
    itemContainer.appendChild(menuBtn);
    return itemContainer;
  }

  function togglePromptMenu(event, promptData, menuBtn) {
    document.querySelector('.prompt-menu-dropdown')?.remove();
    const menu = document.createElement('div');
    menu.className = 'prompt-menu-dropdown';
    const createOption = (html, onClick) => {
      const option = document.createElement('button');
      option.className = 'menu-option';
      option.innerHTML = html;
      option.onclick = () => { menu.remove(); onClick(); };
      menu.appendChild(option);
      return option;
    };
    const findIndex = () => quickPrompts.findIndex(p => p.text === promptData.text && p.category === promptData.category);

    const favoriteText = promptData.favorite
      ? `${ICONS.favoriteEmpty} Unfavorite`
      : `${ICONS.favoriteFilled} Favorite`;

    createOption(favoriteText, () => toggleFavorite(findIndex()));
    createOption(`${ICONS.edit} Edit`, () => editPrompt(findIndex()));
    createOption(`${ICONS.delete} Delete`, () => deletePrompt(findIndex())).classList.add('menu-option-delete');

    const rect = menuBtn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 4}px`; // Added a bit more space
    menu.style.right = `${window.innerWidth - rect.right}px`;
    document.body.appendChild(menu);
  }

  function addNewPrompt() {
    const text = window.prompt('Enter new prompt content:');
    if (!text?.trim()) return;
    const category = (window.prompt('Enter category:', 'GENERAL') || 'GENERAL').trim().toUpperCase();
    quickPrompts.push({ category, text, favorite: false });
    saveData();
    updatePromptPopupContent();
    showNotification('Prompt added successfully', 'success');
  }

  function editPrompt(index) {
    if (index === -1) return;
    const prompt = quickPrompts[index];
    const newText = window.prompt('Edit prompt content:', prompt.text);
    if (newText === null || !newText.trim()) return;
    const newCategory = (window.prompt('Edit category:', prompt.category) || 'GENERAL').trim().toUpperCase();
    quickPrompts[index] = { ...prompt, text: newText, category: newCategory };
    saveData();
    updatePromptPopupContent();
    showNotification('Prompt updated successfully', 'success');
  }

  function deletePrompt(index) {
    if (index === -1) return;
    if (window.confirm(`Delete this prompt?\n"${quickPrompts[index].text}"`)) {
        quickPrompts.splice(index, 1);
        saveData();
        updatePromptPopupContent();
        showNotification('Prompt deleted', 'success');
    }
  }

  function toggleFavorite(index) {
    if (index === -1) return;
    const prompt = quickPrompts[index];
    prompt.favorite = !prompt.favorite;
    saveData();
    updatePromptPopupContent();
    showNotification(prompt.favorite ? 'Added to favorites' : 'Removed from favorites', 'success');
  }

  function insertPrompt(text) {
    const selectors = [
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'div[contenteditable="true"]',
      'textarea'
    ];

    let foundElement = null;

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 20 && !el.disabled && !el.readOnly) {
          foundElement = el;
          break;
        }
      }
      if (foundElement) break;
    }

    if (foundElement) {
      try {
        foundElement.focus();

        if (foundElement.isContentEditable) {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(foundElement);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);

          const currentText = foundElement.innerText.trim();
          const textToInsert = currentText === '' ? text : '\n' + text;
          document.execCommand('insertText', false, textToInsert);
          foundElement.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          // textarea
          const currentValue = foundElement.value;
          const newValue = currentValue.trim() === '' ? text : currentValue + '\n' + text;

          const nativeTextareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          nativeTextareaSetter.call(foundElement, newValue);

          foundElement.setSelectionRange(newValue.length, newValue.length);

          foundElement.dispatchEvent(new Event('input', { bubbles: true }));
        }

        showNotification('Prompt inserted successfully', 'success');
      } catch (error) {
        showNotification('Insertion failed: ' + error.message, 'error');
      }
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          showNotification('Input field not found. Copied to clipboard', 'error');
        }).catch(() => {
          showNotification('Input field not found. Please copy manually', 'error');
        });
      } else {
        showNotification('Input field not found. Please copy manually', 'error');
      }
    }
  }

  function showNotification(message, type = 'info', duration = 3000) {
    document.getElementById('assistant-notification')?.remove();
    const notification = document.createElement('div');
    notification.id = 'assistant-notification';
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
  }

  function updatePinButtonUI(button, isPinned) {
      button.innerHTML = isPinned
          ? `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" fill="#8D6E63" stroke="#5D4037" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="8" r="2" fill="#5D4037"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" stroke="#757575" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="8" r="1.5" fill="#757575"/></svg>`;
      button.title = isPinned ? 'Unpin this conversation' : 'Pin this conversation';
      button.classList.toggle('bg-pin-yellow', isPinned);
      button.classList.toggle('bg-white', !isPinned);
  }

  function addPinButtons() {
    document.querySelectorAll('main [data-testid^="conversation-turn"]:not([data-pin-added])').forEach(msg => {
      msg.setAttribute('data-pin-added', 'true');

      const btn = document.createElement('button');
      btn.className = 'pin-button';
      const existingPin = findExistingPin(msg);
      updatePinButtonUI(btn, !!existingPin);
      if (existingPin) msg.id = existingPin.elementId;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentPin = findExistingPin(msg);
        currentPin ? unpinMessage(currentPin.id, btn, msg) : pinMessage(msg, btn);
      });
      msg.style.position = 'relative';
      msg.appendChild(btn);
    });
  }

  function resetAllPinButtonStates() {
    document.querySelectorAll('.pin-button').forEach(button => {
      updatePinButtonUI(button, false);
    });
    document.querySelectorAll('[data-pin-added="true"][id^="pinned-"]').forEach(messageElement => {
      messageElement.removeAttribute('id');
    });
  }

  function findExistingPin(messageElement) {
    if (messageElement.id) {
      const pinById = pinnedMessages.find(pin => pin.elementId === messageElement.id);
      if (pinById) return pinById;
    }
    const messageText = messageElement.textContent.toLowerCase();
    return pinnedMessages.find(pin => messageText.includes(pin.text.toLowerCase().replace('...', '')));
  }

  function pinMessage(messageElement, buttonElement) {
    const tag = window.prompt('Add a tag (optional):');
    if (tag === null) return;
    const id = Date.now().toString();
    const elementId = `pinned-${id}`;
    messageElement.id = elementId;
    const conversationTitle = getConversationTitle();
    pinnedMessages.push({
      id, text: cleanPrefixText(messageElement.textContent).substring(0, 150) + '...', tag: tag.trim(),
      timestamp: new Date().toLocaleString(), elementId, fullText: messageElement.textContent,
      conversationId: window.location.pathname,
      conversationTitle: conversationTitle
    });
    saveData();
    updatePinButtonUI(buttonElement, true);
    highlightAndScrollTo(messageElement);

    if (cachedElements.pinPopup.style.visibility === 'visible') {
      setTimeout(() => updatePinPopupContent(), 100);
    }

    showNotification('Pinned successfully', 'success'); // Restored wording
  }

  function unpinMessage(pinId, buttonElement, messageElement) {
    pinnedMessages = pinnedMessages.filter(msg => msg.id !== pinId);
    saveData();
    updatePinButtonUI(buttonElement, false);
    if (messageElement?.id.startsWith('pinned-')) {
      messageElement.removeAttribute('id');
    }
    showNotification('Unpinned successfully', 'success'); // Restored wording
  }

  function cleanPrefixText(text) {
    return text
      .replace(/^ChatGPT\s*(said|says|說|dijo|dit|sagte|言った)\s*[:：]\s*/i, '')
      .replace(/^(You|你|妳|Tú|Tu|Sie|Vous|あなた)\s*(said|說|dijiste|as dit|sagten|言った)?\s*[:：]\s*/i, '')
      .trim();
  }

  function getConversationTitle() {
    const title = document.title;
    if (title && title !== 'ChatGPT' && !title.includes('ChatGPT')) {
      return title.replace(/\s*\|\s*ChatGPT.*$/, '').trim().substring(0, 50);
    }

    const pathParts = window.location.pathname.split('/');
    const conversationId = pathParts[pathParts.length - 1];
    return `Conversation ${conversationId.substring(0, 8)}`;
  }

  function findAndHighlightMessage(msg) {
    const element = document.getElementById(msg.elementId);
    if (element) {
      highlightAndScrollTo(element);
      showNotification('Pinned message located', 'success');
    } else {
      if (msg.conversationId && msg.conversationId !== window.location.pathname) {
        const title = msg.conversationTitle || 'Unknown conversation';
        showNotification(`This message is from another chat: "${title}"`, 'info', 3500);
      } else {
        showNotification('Content not found - may have been deleted', 'error');
      }
    }
  }

  function highlightAndScrollTo(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    element.classList.add('highlight-effect');
    setTimeout(() => element.classList.remove('highlight-effect'), 2000);
  }

  function setupMutationObserver() {
    const observer = new MutationObserver(() => {
        clearTimeout(observer.debounce);
        observer.debounce = setTimeout(addPinButtons, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function init() {
    if (initialized) return;
    initialized = true;
    await loadData();
    createFloatingButtons();
    setupMutationObserver();
    addPinButtons();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  // --- Storage Change Listener ---
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      // Check if the 'status' key was changed to 'dataJustReset'
      if (changes.status && changes.status.newValue === 'dataJustReset') {

        // 1. Reload data. This will fetch the default prompts because storage is empty.
        loadData().then(() => {
          // 2. If the prompt popup is currently open, update its content immediately.
          if (cachedElements.promptPopup && cachedElements.promptPopup.style.opacity === '1') {
            updatePromptPopupContent();
          }
          // If the pin popup is open, update it too.
          if (cachedElements.pinPopup && cachedElements.pinPopup.style.opacity === '1') {
            updatePinPopupContent();
          }
          // Reset all pin buttons on the page to their unpinned state.
          resetAllPinButtonStates();
        });

        // 3. Remove the flag from storage so this doesn't run again.
        chrome.storage.local.remove('status');
      }
    });
  }
})();
