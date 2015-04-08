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
panel.self.on('hide', x => {
  notes.sync();
  button.checked(false);
});

// Set current tab notes
panel.self.on('show', x => {
  button.checked(true);
});

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
    case 'toggle-global':
      // Update notes
      prefs.global = data;
      panel.cmd('notes', notes.getData('.', 'notes'));
    break;
  }
});

// Tabs

// On active tab, set notes and update icon
tabs.self.on('activate', x => {
  const host = tabs.getHost();
  if (tabs.isDisabled(host)) {
    button.disabled(true);
  } else {
    const item = notes.get(host);
    panel.cmd('notes', item.notes);
    button.disabled(false);
    button.updateIcon(item.state);
  }
  panel.updateGlobal(host);
});

// On tab ready, set notes and show panel if needed, update button and icon
tabs.self.on('ready', x => {
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
  panel.updateGlobal(host);
});

// Synchronization

// Set changes to simple-storage
sPrefs.on('syncNotes', x => {
  notes.setStorage();
  panel.cmd('notes', notes.getData('.', 'notes'));
});

// Toggle sync service state
sPrefs.on('sync', x => {
  service.set('services.sync.prefs.sync.extensions.' +
    me.id + '.syncNotes', prefs.sync);
});

// Preferences

// Update panel
sPrefs.on('panelHeight', x => panel.resize());
sPrefs.on('panelWidth', x => panel.resize());
sPrefs.on('panelPosition', x => panel.position = prefs.panelPosition);
sPrefs.on('global', x => panel.updateGlobal());

// Update text
sPrefs.on('textStyle', x => panel.cmd('textStyle', prefs.textStyle));
sPrefs.on('textColor', x => panel.cmd('textColor', prefs.textColor));

// Update hotkeys
sPrefs.on('combo', x => hotkeys.update());

// Open manager
sPrefs.on('openManager', x => manager.open());

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
  // Send localization data
  panel.cmd('localization', {
    noNotes: lang('noNotes'),
    noGlobalNotes: lang('noGlobalNotes')
  });
  // Set text style
  panel.cmd('textStyle', prefs.textStyle);
  panel.cmd('textColor', prefs.textColor);
  panel.updateGlobal();
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
