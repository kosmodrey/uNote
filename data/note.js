'use strict';

// Storage
let store = {};
// Find DOM elements
let note = document.getElementById('notes');

// On double click
note.addEventListener('dblclick', () => {
  self.port.emit('cmd', 'state');
});

// Register and send key data
note.addEventListener('keyup', () => {
  self.port.emit('typed-text', note.value);
});

// Listen events
self.port.on('init', (text) => {
  note.value = text || '';
  note.scrollTop = 0;
  note.focus();
});

self.port.on('cmd', (name, data) => {
  switch (name) {
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
    case 'state':
      // Set state
      store.state = data;
      break;
  }
});
