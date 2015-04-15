'use strict';

// Find DOM elements
const
  list = document.getElementById('list'),
  notes = document.getElementById('notes');

// Store last selected item and locatication
let lastItem, loc = {};

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
  // Item
  if (item.classList.contains('item')) {
    if (lastItem) lastItem.classList.remove('selected');
    lastItem = item;
    item.classList.add('selected');
    notes.disabled = false;
    cmd('get', item.dataset.host);
  // Pin button
  } else if (item.classList.contains('pin')) {
    const state = item.parentNode.classList.contains('pinned');
    item.parentNode.classList.toggle('pinned');
    cmd('setState', {
      host: item.parentNode.dataset.host,
      state: !state
    });
  // Remove button
  } else if (item.classList.contains('remove')) {
    list.removeChild(item.parentNode);
    notes.value = '';
    notes.disabled = true;
    // Clean list
    if (list.querySelector('li') === null) list.innerHTML = '';
    // Send remove command
    cmd('remove', item.parentNode.dataset.host);
  }
};

// Send typing text
notes.onkeyup = x => cmd('typing', {
  host: lastItem.dataset.host,
  notes: notes.value
});

// Commands
self.port.on('cmd', (name, data) => {
  switch (name) {
    // Set localization
    case 'localization':
      loc = data;
      list.dataset.label = loc.noNotesLabel;
    break;
    // Set notes
    case 'get':
      // if (document.querySelector('.item[data-host="' + data.host + '"]'))
      notes.value = data.item.notes;
    break;
    // Set list
    case 'list':
      let html = '';
      for (let item in data) {
        html += `
          <li class="item${data[item].state ? ' pinned' : ''}" data-host="${item}">
            ${item == '__null__' ? loc.globalNotes : (data[item].title || item)}
            <span class="remove" title="${loc.removeNote}"></span>
            <span class="pin" title="${loc.pinNote}"></span>
          </li>
        `;
      }
      list.innerHTML = html;
    break;
  }
});
