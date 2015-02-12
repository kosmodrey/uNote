'use strict';

const list = document.getElementById('list');
const notes = document.getElementById('notes');

let lastItem;
let lang = {};

// Send startup command
self.port.emit('cmd', 'startup');

// On item clicked
list.addEventListener('click', function(evt) {
  const item = evt.target;
  if (!item) return;
  // Item
  if (item.classList.contains('item')) {
    if (lastItem) lastItem.classList.remove('selected');
    lastItem = item;
    item.classList.add('selected');
    self.port.emit('cmd', 'get', item.dataset.host);
  // Pin button
  } else if (item.classList.contains('pin')) {
    const state = item.parentNode.classList.contains('pinned');
    item.parentNode.classList.toggle('pinned');
    self.port.emit('cmd', 'setState', {
      host: item.parentNode.dataset.host,
      state: !state
    });
  // Remove button
  } else if (item.classList.contains('remove')) {
    list.removeChild(item.parentNode);
    notes.value = '';
    self.port.emit('cmd', 'remove', item.parentNode.dataset.host);
  }
});

// Send key data
notes.addEventListener('keyup', () => {
  self.port.emit('cmd', 'typing', {
    host: lastItem.dataset.host,
    notes: notes.value
  });
});

// Recive Commands
self.port.on('cmd', (name, data) => {
  switch (name) {
    case 'lang':
      lang = data;
    break;
    case 'get':
      setNotes(data);
    break;
    case 'list':
      setList(data);
    break;
  }
});

// Set list
function setList(data) {
  let html = '';
  for (let item in data) {
    html += `
      <div class="item${data[item].state ? ' pinned' : ''}" data-host="${item}">
        ${item == '__null__' ? lang.blankPage : item}
        <span class="remove" title="${lang.removeNote}"></span>
        <span class="pin" title="${lang.pinNote}"></span>
      </div>
    `;
  }
  list.innerHTML = html;
}

// Set notes
function setNotes(data) {
  const item = document.querySelector('.item[data-host="' + data.host + '"]');
  if (!item) return;
  notes.value = data.item.notes;
}
