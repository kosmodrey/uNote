'use strict';

const me = require('sdk/self');
const lang = require('sdk/l10n').get;
const sPrefs = require('sdk/simple-prefs');
const prefs = sPrefs.prefs;
const service = require('sdk/preferences/service');
const { menu } = require('menu');
const { tabs } = require('tabs');
const { notes } = require('notes');
const { button } = require('button');
const { panel } = require('panel');
const { hotkeys } = require('keys');
const { manager } = require('manager');
const { settings } = require('settings');

/* Button */

// Show panel on button checked
button.self.on('change', state => state.checked && panel.show());

/* Panel */

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
    // Set notes
    case 'typing':
      notes.setData('.', 'notes', data);
      notes.setData('.', 'timeUpdated', Date.now());
    break;
    // Set title
    case 'typing-title':
      notes.setData('.', 'title', data);
    break;
    // Change state
    case 'state':
      let state = !notes.getData('.', 'state', data);
      notes.setData('.', 'state', state);
      button.updateIcon(state);
    break;
    // Update notes on toggle
    case 'toggle-global':
      prefs.global = data;
      panel.cmd('notes', notes.getData('.', 'notes'));
    break;
    // Buttons
    case 'button':
      panel.hide();
      switch (data) {
        case 'manager': return manager.open();
        case 'settings': return settings.open();
      }
    break;
  }
});

/* Tabs */

// On active tab
tabs.self.on('activate', x => panel.update());

// On tab ready
tabs.self.on('ready', x => panel.update());

/* Synchronization */

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

/* Preferences */

// Update panel
sPrefs.on('panelHeight', x => panel.resize());
sPrefs.on('panelWidth', x => panel.resize());
sPrefs.on('panelPosition', x => panel.position = prefs.panelPosition);

// Update global notes state
sPrefs.on('global', x => panel.updateUI());

// Update font
sPrefs.on('textStyle', x => panel.cmd('textStyle', prefs.textStyle));
sPrefs.on('textColor', x => panel.cmd('textColor', prefs.textColor));

// Update hotkeys
sPrefs.on('combo', x => hotkeys.update());

// Open manager
sPrefs.on('openManager', x => manager.open());

// Open settings
sPrefs.on('openSettings', x => settings.open());

/* Export */

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
  // Send localization data
  panel.cmd('localization', {
    noNotes: lang('noNotes'),
    globalNotes: lang('global_title'),
    noGlobalNotes: lang('noGlobalNotes')
  });
  // Set text style
  panel.cmd('textStyle', prefs.textStyle);
  panel.cmd('textColor', prefs.textColor);
  // Update notes and icon
  panel.update();
};
