'use strict';

const me = require('sdk/self');
const lang = require('sdk/l10n').get;
const sPrefs = require('sdk/simple-prefs');
const prefs = sPrefs.prefs;
const service = require('sdk/preferences/service');
const s = require('sdk/simple-storage');
const { tabs } = require('tabs');
const { notes } = require('notes');
const { button } = require('button');
const { panel } = require('panel');
const { contextMenu } = require('menu');
const { hotkeys } = require('keys');
const { manager } = require('manager');

// Button

// Show panel on button checked
button.self.on('change', (state) => state.checked && panel.show());

// Panel

// On panel hide, sync notes and uncheck button
panel.self.on('hide', () => {
  notes.sync();
  button.checked(false);
});

// Set current tab notes
panel.self.on('show', () => panel.cmd('notes', notes.getData('.', 'notes')));

// Receive commands
panel.self.port.on('cmd', (name, data) => {
  switch (name) {
    case 'typing':
      // Save notes in storage
      notes.setData('.', 'notes', data);
    break;
    case 'state':
      // Change note state
      let state = !notes.getData('.', 'state', data);
      notes.setData('.', 'state', state);
      button.updateIcon(state);
    break;
  }
});

// Tabs

// On active tab, set notes and update icon
tabs.self.on('activate', () => {
  const host = tabs.getHost();
  console.log('tabs > activate:', host);
  if (tabs.isDisabled(host)) {
    button.disabled(true);
  } else {
    const item = notes.get(host);
    panel.cmd('notes', item.notes);
    button.disabled(false);
    button.updateIcon(item.state);
  }
});

// On tab ready, set notes and show panel if needed, update icon
tabs.self.on('ready', () => {
  const host = tabs.getHost();
  console.log('tabs > ready:', host);
  if (tabs.isDisabled(host)) {
    button.disabled(true);
  } else {
    const item = notes.get(host);
    panel.cmd('notes', item.notes);
    button.disabled(false);
    if (prefs.panelOnInit && item.state) panel.show();
    button.updateIcon(item.state);
  }
});

// Synchronization

// Set changes to simple-storage
sPrefs.on('syncNotes', () => {
  notes.setStorage();
  panel.cmd('notes', notes.getData('.', 'notes'));
});

// Toggle sync service state
sPrefs.on('sync', () => {
  service.set('services.sync.prefs.sync.extensions.' +
    me.id + '.syncNotes', prefs.sync);
});

// Preferences

// Update panel
sPrefs.on('panelHeight', () => panel.resize());
sPrefs.on('panelWidth', () => panel.resize());
sPrefs.on('panelPosition', () => panel.position = prefs.panelPosition);

// Update text
sPrefs.on('textStyle', () => panel.cmd('textStyle', prefs.textStyle));
sPrefs.on('textColor', () => panel.cmd('textColor', prefs.textColor));

// Update hotkeys
sPrefs.on('combo', () => hotkeys.update());

// Open manager
sPrefs.on('openManager', () => manager.open());

// Export

exports.main = function(opt, args) {
  switch (opt.loadReason) {
    case 'install':
      // Set sync key
      service.set(
        'services.sync.prefs.sync.extensions.' + me.id + '.syncNotes',
        prefs.sync
      );
    break;
  }
  // Upgrade old storage
  if (s.storage.hasOwnProperty('__states__')) {
    const states = s.storage.__states__;
    delete s.storage.__states__;
    for (let item in s.storage) {
      s.storage[item] = {
        notes: s.storage[item] || '',
        state: states[item] || false
      };
    };
  }
  // Set text style
  panel.self.port.emit('cmd', 'textStyle', prefs.textStyle);
  panel.self.port.emit('cmd', 'textColor', prefs.textColor);
  panel.self.port.emit('cmd', 'placeholder', lang('noNotes'));
  // Update notes and icon
  const host = tabs.getHost();
  if (tabs.isDisabled(host)) {
    button.disabled(true);
  } else {
    const item = notes.get(host);
    panel.cmd('notes', item.notes);
    button.disabled(false);
    if (prefs.panelOnInit && item.state) panel.show();
    button.updateIcon(item.state);
  }
};
