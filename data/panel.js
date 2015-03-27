'use strict';

// Find DOM elements
const note = document.getElementById('notes');
const toggleGlobal = document.getElementById('toggle-global');

// Store localization
let loc = {};

// On double click
note.addEventListener('dblclick', () => {
  self.port.emit('cmd', 'state');
});

// Register and send key data
note.addEventListener('keyup', () => {
  self.port.emit('cmd', 'typing', note.value);
});

// Toggle global switch
toggleGlobal.onchange = () => {
  self.port.emit('cmd', 'toggle-global', toggleGlobal.checked);
};

// Commands
self.port.on('cmd', (name, data) => {
  switch (name) {
    case 'localization':
      // Set localization strings
      loc = data;
    break;
    case 'notes':
      // Set notes
      note.value = data || '';
      note.scrollTop = 0;
      note.focus();
    break;
    case 'textStyle':
      // Set text style
      note.style.font = data;
    break;
    case 'textColor':
      // Set text color
      note.style.color = data;
    break;
    case 'isGlobal':
      toggleGlobal.checked = data.value;
      // Set placeholder
      if (data.host == '__null__' || toggleGlobal.checked) {
        data = loc.noGlobalNotes;
      } else {
        data = loc.noNotes
      }
      note.placeholder = data;
    break;
  }
});
