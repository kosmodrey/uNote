'use strict';

// Find DOM elements
const
  list = document.getElementById('list'),
  notes = document.getElementById('notes');

// Store last selected item and localization
var lastItem, loc = {};

// Cmd command
const cmd = (name, data) => self.port.emit('cmd', name, data);

// Disable and clean textarea
notes.disabled = true;
notes.value = '';

// Send startup command
cmd('startup');

// On item clicked
list.onclick = evt => {
  const item = evt.target;
  if (!item) return;
  if (item.classList.contains('item')) {
    if (lastItem) lastItem.classList.remove('selected');
    lastItem = item;
    item.classList.add('selected');
    notes.disabled = false;
    cmd('get', item.dataset.id);
  } else if (item.classList.contains('remove')) {
    list.removeChild(item.parentNode);
    notes.value = '';
    notes.disabled = true;
    if (list.querySelector('li') === null) list.innerHTML = '';
    cmd('remove', item.parentNode.dataset.id);
  }
};

// Send typing text
notes.onkeyup = x => cmd('typing', {
  id: lastItem.dataset.id,
  notes: notes.value
});

// Commands
self.port.on('cmd', (name, data) => {
  switch (name) {
    case 'startup':
      loc = data.loc;
      list.dataset.label = loc.noNotesLabel;
      notes.placeholder = loc.noNotes;
      notes.setAttribute('dir', data.rtl ? 'rtl' : 'auto');
    break;
    case 'get':
      if (document.querySelector('.item[data-id="' + data.id + '"]')) {
        notes.value = data.notes || '';
      }
    break;
    case 'list':
      for (let item of data) {
        const li = document.createElement('li'),
          div = document.createElement('div'),
          remove = document.createElement('span');
        li.className = 'item';
        li.dataset.id = item.id;
        li.dataset.host = item.host;
        div.textContent =
          item.title || (item.id == '__global__' ? loc.globalNotes : item.id);
        remove.className = 'remove';
        remove.title = loc.removeNote;
        li.appendChild(div);
        li.appendChild(remove);
        list.appendChild(li);
      }
    break;
  }
});
