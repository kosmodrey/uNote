'use strict';

const
  settings = localStorage,
  storage = chrome.storage.local,
  l = id => chrome.i18n.getMessage(id),
  bg = chrome.extension.getBackgroundPage();

// Global
var globalData = {};

// On DOM loaded
document.addEventListener('DOMContentLoaded', x => {

  // Set popup size
  document.body.style.width = settings.popupWidth + 'px';
  document.body.style.height = settings.popupHeight + 'px';

  // Find DOM elements
  const elements = {
    title: document.getElementById('title'),
    notes: document.getElementById('notes'),
    info: document.getElementById('infobar'),
    global: document.getElementById('toggle-global'),
    settings: document.getElementById('button-settings'),
    editor: document.getElementById('button-editor')
  };

  // On global toggle change
  elements.global.onchange = x => {
    bg.updateNote(globalData).then(x => {
      globalData.isChanged = false;
      bg.setSetting('globalNotes', elements.global.checked)
      updateNotes();
    });
  };
  
  // On key press in input
  elements.title.onkeypress = elements.notes.onkeypress =
  elements.title.onkeydown = elements.notes.onkeydown = x => {
    if (!globalData.isChanged) return globalData.isChanged = true;
  };

  // On click
  elements.settings.onclick = x => chrome.tabs.create({ url: 'settings.html' });
  elements.editor.onclick = x => chrome.tabs.create({ url: 'editor.html' });

  // Save elements to global
  globalData.elements = elements;

  // On init
  updateNotes();

  // Update notes
  function updateNotes() {

    // Set checkbox
    elements.global.checked = bg.getSetting('globalNotes');

    bg.getTab().then(tab => {

      const id = tab.id;

      globalData.tab = tab;

      // Set placeholders
      if (id == bg.globalNoteId) {
        elements.global.checked = true;
        elements.title.placeholder = l('globalNotes');
        elements.notes.placeholder = l('noGlobalNotes');
      } else {
        elements.global.checked = false;
        elements.title.placeholder = id;
        elements.notes.placeholder = l('noNotes');
      }

      // Get note
      bg.getNote(id).then(item => {
        if (item) {
          // Load note
          elements.title.value = item.title || '';
          elements.notes.value = item.notes || '';
        } else {
          // Reset data
          elements.title.value = elements.notes.value = '';
        }
      });

    });
  }

  // On popup unload
  addEventListener('unload', x => {
    bg.updateNote(globalData);
  });

});
