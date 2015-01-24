'use strict';

// Find DOM elements
let note = document.getElementById('notes');

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
