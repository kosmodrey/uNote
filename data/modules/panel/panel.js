'use strict';

// Find DOM elements
const
  title = document.getElementById('title'),
  notes = document.getElementById('notes'),
  manager = document.getElementById('button-manager'),
  settings = document.getElementById('button-settings'),
  toggle = document.getElementById('toggle-global'),
  bottom = document.querySelector('.bottom');

var loc = {};

const cmd = (name, data) => self.port.emit('cmd', name, data);

notes.onkeyup = x => cmd('typing', notes.value);
title.onkeyup = x => cmd('typing-title', title.value);
notes.onmouseup = title.onmouseup = e =>
  (e.which == 2) && setTimeout(e.target.onkeyup, 500);
manager.onclick = x => cmd('button', 'manager');
settings.onclick = x => cmd('button', 'settings');
toggle.onchange = x => cmd('toggle', toggle.checked);

self.port.on('cmd', (name, data) => {
  switch(name) {
    case 'startup':
      loc = data.loc;
    break;
    case 'style':
      if (data.size)
        title.style.fontSize = notes.style.fontSize = data.size + 'px';
      if (data.style)
       title.style.fontFamily = notes.style.fontFamily = data.style;
      if (data.color)
        title.style.color = notes.style.color = bottom.style.color = data.color;
      if (data.rtl !== undefined) {
        if (data.rtl) {
          title.dir = notes.dir = 'rtl';
        } else {
          title.dir = notes.dir = 'ltr';
        }
      }
    break;
    case 'update':
      toggle.checked = (data.id == '__global__');
      if (toggle.checked) {
        notes.placeholder = loc.noGlobalNotes;
        title.placeholder = loc.globalNotes;
      } else {
        notes.placeholder = loc.noNotes;
        title.placeholder = data.id;
      }
      title.value = data.title || '';
      notes.value = data.notes || '';
    break;
    case 'show':
      // notes.scrollTop = 0;
      notes.focus();
    break;
  }
});
