'use strict';

// Global
const
  settings = localStorage,
  runtime = chrome.runtime,
  button = chrome.browserAction,
  storage = chrome.storage.local,
  notifications = chrome.notifications,
  l = id => chrome.i18n.getMessage(id);

// Global note id
var globalNoteId = 'unote:global';

// Load sound notification file

// Defaults
const def = {
  settings: {
    popupWidth: 300,
    popupHeight: 400,
    urlLevel: 'host',
    globalNotes: false,
    allowSystemNotes: true,
    showBadge: true,
    showNotifications: true,
    badgeColor: [28, 221, 80, 255],
    textSeparator: '--------'
  },
  item: {
    title: '', notes: '',
    count: {}, time: {},
    options: {}, flags: []
  }
};

// Set setting
function getSetting(id) {
  return settings[id] && JSON.parse(settings[id]);
}

// Get setting
function setSetting(id, data) {
  if (typeOf(data) != 'string') data = JSON.stringify(data);
  return (settings[id] = data);
}

// Update button badge color
function setBadgeColor() {
  button.setBadgeBackgroundColor({ color: getSetting('badgeColor') });
}

// Update button function
function updateButton(state, updated) {
  if (state === null) button.setBadgeText({ text: '' });
  if (!getSetting('showBadge')) return;
  getTab().then(tab => {
    if (!tab) return;
    const tabId = tab.tab.id;
    if (state !== undefined) {
      const text = state ? ' ' : '';
      button.setBadgeText({ tabId, text });
    } else {
      getNote(tab.id).then(item => {
        state = item && item.notes;
        const text = state ? ' ' : '';
        button.setBadgeText({ tabId, text });
      });
    }
  });
}

// On tab changed
chrome.tabs.onActivated.addListener(x => updateButton());

// On window focus
chrome.windows.onFocusChanged.addListener(id => id > 0 && updateButton());

// On loading new page
chrome.tabs.onUpdated.addListener((id, info, tab) => {
  if (info.status == 'loading') updateButton(undefined, true);
});

// Get current tab
function getTab(isGlobal) {
  return new Promise(done => {
    chrome.tabs.query({'active': true, 'currentWindow': true}, tab => {
      tab = tab[0];
      if (!tab) return done();
      const url = document.createElement('a');
      url.href = tab.url;
      url.tab = tab;
      url.isSystem = !~['http:', 'https:'].indexOf(url.protocol);
      url.get = {
        domain: (x => {
          const list = url.hostname.split('.'); list.shift();
          return list.length == 2 ? list.join('.') : url.hostname;
        })(),
        host: url.hostname,
        url: tab.url
      }
      url.id = !isGlobal && getSetting('globalNotes') ? globalNoteId :
        url.isSystem && !getSetting('allowSystemNotes') ? globalNoteId :
          url.get[settings.urlLevel];
      console.log('url.id', url.id);
      done(url);
    });
  });
}

// Get note
function getNote(id) {
  return new Promise(done => {
    storage.get(id, items => {
      if (id) items = items[id];
      return done(items);
    });
  });
}

// Find notes
function findNotes(query) {
  const regexp = typeOf(query) == 'regexp';
  return new Promise(done => {
    getNote(null).then(items => {
      if (!items) return done({});
      const results = {};
      for (let id in items) {
        const match = regexp ? id.match(query) : id == query;
        if (!match) continue;
        const item = items[id];
        item._match = match
        results[id] = item;
      }
      return done(results);
    });
  });
}

// Set note
function setNote(id, data, set) {
  return new Promise(done => {
    data = data || def.item;
    set = set || {};
    // Check data
    if (!data.count) data.count = {};
    if (!data.time) data.time = {};
    // Save or update note
    getNote(id).then(item => {
      const now = Date.now();
      data.time.edited = now
      if (item) {
        // Item in storage
        if (set.isChanged) item.count.edited++;
        item.count.used++;
        for (let prop in item) {
          const value = item[prop];
          if (typeOf(value) == 'object') {
            for (let key in value) {
              if (data[prop][key] === undefined) {
                data[prop][key] = value[key];
              }
            }
          // } else if (typeOf(value) == 'list') {
          } else {
            if (data[prop] === undefined) {
              data[prop] = item[prop];
            }
          }
        }
        console.log('update:', data);
      } else if (set.isChanged) {
        // No item & is changed
        console.log('create:', data);
        data.count = { edited: 1, used: 1 }
        data.time.created = now;
      } else {
        // Nothing happens
        console.log('hop');
        return done();
      }
      storage.set({ [id]: data }, done);
    });
  });
}

// Update note in storage
function updateNote(event) {
  return setNote(event.tab.id, {
    title: event.elements.title.value,
    notes: event.elements.notes.value
  }, event).then(updateButton);
}

function saveSelection(data, isGlobal) {
  const promise = isGlobal ? Promise.resolve({ id: globalNoteId }) : getTab(true);
  promise.then(tab => {
    if (!tab) return;
    getNote(tab.id).then(item => {
      item = item || {};
      // Save note
      setNote(tab.id, {
        notes: (
          !item.notes ? '' : item.notes +
          '\n' + settings.textSeparator + '\n'
        ) + data.selectionText
      }, { isChanged: true }).then(updateButton);
      // Show notification
      if (getSetting('showNotifications')) {
        const name = isGlobal ? l('globalNotes') : tab.id;
        notifications.create(tab.id, {
          type: 'basic',
          iconUrl: 'static/icon.png',
          title: l('noteSavedTo') + ' ' + name,
          message: l('note') + ': ' + data.selectionText
        });
      }
    });
  });
}

// Functions
function typeOf(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

// On init
function init() {
  setBadgeColor();
  updateButton(null);
}

// Clear notification on click
notifications.onClicked.addListener(id => {
  notifications.clear(id);
});

// Create local context
chrome.contextMenus.create({
  title: l('textCopyLocal'),
  contexts: ['selection'],
  onclick: data => saveSelection(data, false)
});

// Create global context
chrome.contextMenus.create({
  title: l('textCopyGlobal'),
  contexts: ['selection'],
  onclick: data => saveSelection(data, true)
});

// On install
runtime.onInstalled.addListener(event => {
  switch (event.reason) {
    case 'install':
      console.log('install:', event);
      setSetting('firstInstall', false);
      // Set default settings
      for (let key in def.settings) setSetting(key, def.settings[key]);
      init();
    break;
    case 'update':
      console.log('update:', event);
    break;
  }
});

// On init
if (getSetting('firstInstall') === false) init();
