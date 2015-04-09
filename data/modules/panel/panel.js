'use strict';

// Find DOM elements
const
  notes = document.getElementById('notes'),
  toggleGlobal = document.getElementById('toggle-global');

// Store localization
let loc = {};

// Cmd funcion
const cmd = (name, data) => self.port.emit('cmd', name, data);

// On typing
notes.onkeyup = x => cmd('typing', notes.value);
// On double click
notes.ondblclick = x => cmd('state');
// Global switch
toggleGlobal.onchange = x => cmd('toggle-global', toggleGlobal.checked);

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
    // Set global toggle button
    case 'isGlobal':
      toggleGlobal.checked = data.value;
      // Set label
      if (data.host == '__null__' || toggleGlobal.checked) {
        data = loc.noGlobalNotes;
      } else {
        data = loc.noNotes
      }
      notes.placeholder = data;
    break;
  }
});
