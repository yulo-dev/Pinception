// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  setupEventListeners();
});

// Load statistics from storage
function loadStats() {
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['pinnedMessages', 'quickPrompts'], (result) => {
      const pinnedCount = result.pinnedMessages?.length || 0;
      // Default prompts count is 6, according to content.js logic
      const promptCount = result.quickPrompts?.length || 6;

      if (document.getElementById('pinnedCount')) {
        document.getElementById('pinnedCount').textContent = pinnedCount;
      }
      if (document.getElementById('promptCount')) {
        document.getElementById('promptCount').textContent = promptCount;
      }
    });
  }
}

// Set up event listeners for the popup buttons
function setupEventListeners() {
  // Open ChatGPT button
  const openChatBtn = document.getElementById('openChatGPT');
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      if (chrome && chrome.tabs) {
        chrome.tabs.create({
          url: 'https://chat.openai.com',
          active: true
        });
        setTimeout(() => window.close(), 100);
      }
    });
  }

  // Reset to Default button
  const clearAllDataBtn = document.getElementById('clearAllData');
  if (clearAllDataBtn) {
    clearAllDataBtn.addEventListener('click', () => {
      showCustomConfirm(clearAllData); // Open the confirmation dialog
    });
  }
}

// --- Custom Confirmation Dialog Logic ---

const confirmOverlay = document.getElementById('custom-confirm-overlay');
const confirmOkBtn = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

// Function to show the custom dialog
function showCustomConfirm(onConfirmCallback) {
  if (!confirmOverlay) return;
  confirmOverlay.classList.remove('pinception-hidden');
  setTimeout(() => {
    confirmOverlay.classList.add('show');
  }, 10);

  confirmOkBtn.addEventListener('click', function handleOk() {
    hideCustomConfirm();
    onConfirmCallback();
  }, { once: true });

  confirmCancelBtn.addEventListener('click', function handleCancel() {
    hideCustomConfirm();
  }, { once: true });
}

// Function to hide the custom dialog
function hideCustomConfirm() {
  if (!confirmOverlay) return;
  confirmOverlay.classList.remove('show');
  setTimeout(() => {
    confirmOverlay.classList.add('pinception-hidden');
  }, 200);
}

// Clear all data from storage
function clearAllData() {
  if (chrome && chrome.storage && chrome.storage.local) {
    const clearBtn = document.getElementById('clearAllData');
    const originalContent = clearBtn.innerHTML;

    // Set button to loading state
    clearBtn.textContent = 'Clearing...';
    clearBtn.disabled = true;

    // 1. Clear all existing data
    chrome.storage.local.clear(() => {

      // 2. SET A FLAG in storage to notify content.js
      // This acts like writing a note on a shared whiteboard.
      chrome.storage.local.set({ 'status': 'dataJustReset' }, () => {

        // 3. Update the popup's own UI
        loadStats();

        // 4. Restore the button's appearance
        setTimeout(() => {
          clearBtn.innerHTML = originalContent;
          clearBtn.disabled = false;
        }, 500);
      });
    });
  }
}