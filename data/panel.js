'use strict';

// Find DOM elements
const note = document.getElementById('notes');
const toggleGlobal = document.getElementById('toggle-global');

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
    case 'placeholder':
      // Set placeholder
      note.placeholder = data;
    break;
    case 'isGlobal':
      toggleGlobal.checked = data;
    break;
  }
});
