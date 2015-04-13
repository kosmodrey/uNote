'use strict';

// Find DOM elements
const
  title = document.getElementById('title'),
  notes = document.getElementById('notes'),
  manager = document.getElementById('button-manager'),
  settings = document.getElementById('button-settings'),
  global = document.getElementById('toggle-global');

// Store localization
let loc = {};

// Cmd funcion
const cmd = (name, data) => self.port.emit('cmd', name, data);

// On typing
notes.onkeyup = x => cmd('typing', notes.value);
title.onkeyup = x => cmd('typing-title', title.value);
// On double click
title.ondblclick = x => cmd('state');
// Buttons
manager.onclick = x => cmd('button', 'manager');
settings.onclick = x => cmd('button', 'settings');
// Toggles
global.onchange = x => cmd('toggle-global', global.checked);

// Commands
self.port.on('cmd', (name, data) => {
  switch (name) {
    // Set localization data
    case 'localization':
      loc = data;
    break;
    // Set notes
    case 'notes':
      notes.value = data || '';
      notes.scrollTop = 0;
      notes.focus();
    break;
    // Set text style
    case 'textStyle':
      notes.style.font = data;
    break;
    // Set text color
    case 'textColor':
      notes.style.color = data;
    break;
    // Update user interface
    case 'update':
      global.checked = data.global;
      // Set labels
      if (data.host == '__null__' || global.checked) {
        notes.placeholder = loc.noGlobalNotes;
        title.placeholder = loc.globalNotes;
        title.value = data.item.title || title.placeholder;
      } else {
        notes.placeholder = loc.noNotes;
        title.placeholder = data.host;
        title.value = data.item.title || data.host;
      }
    break;
  }
});
