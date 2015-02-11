'use strict';

const me = require('sdk/self');
const lang = require('sdk/l10n').get;
const sPrefs = require('sdk/simple-prefs');
const prefs = sPrefs.prefs;
const service = require('sdk/preferences/service');
const { tabs } = require('tabs');
const { notes } = require('notes');
const { button } = require('button');
const { panel } = require('panel');
const { contextMenu } = require('menu');
const { hotkeys } = require('keys');

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
  const item = notes.get('.');
  console.log('tabs > activate:', item);
  panel.cmd('notes', item.notes);
  button.updateIcon(item.state);
});

// On tab ready, set notes and show panel if needed, update icon
tabs.self.on('ready', () => {
  const item = notes.get('.');
  console.log('tabs > ready:', item);
  panel.cmd('notes', item.notes);
  if (prefs.panelOnInit && item.state) panel.show();
  button.updateIcon(item.state);
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
  const item = notes.get();
  // Set host notes at load
  panel.cmd('notes', item.notes);
  // Set text style
  panel.self.port.emit('cmd', 'textStyle', prefs.textStyle);
  panel.self.port.emit('cmd', 'textColor', prefs.textColor);
  panel.self.port.emit('cmd', 'placeholder', lang('noNotes'));
  // Update icon 
  button.updateIcon(item.state);
  // Show note on start
  if (prefs.panelOnInit && item.state) panel.show();
};
