'use strict';

const me = require('sdk/self');
const lang = require('sdk/l10n').get;
const sPrefs = require('sdk/simple-prefs');
const prefs = sPrefs.prefs;
const service = require('sdk/preferences/service');
const { menu } = require('./lib/menu');
const { tabs } = require('./lib/tabs');
const { notes } = require('./lib/notes');
const { button } = require('./lib/button');
const { panel } = require('./lib/panel');
const { hotkeys } = require('./lib/keys');
const { manager } = require('./lib/manager');
const { settings } = require('./lib/settings');

const syncPref = 'services.sync.prefs.sync.extensions.' + me.id + '.syncNotes';

/* Button */

// Show panel on button checked
button.self.on('change', state => state.checked && panel.show());

/* Panel */

// On panel hide, sync notes and uncheck button
panel.self.on('hide', x => {
  button.checked(false);
  notes.sync();
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
  service.set(syncPref, prefs.sync);
});

/* Preferences */

// Update panel
sPrefs.on('panelHeight', x => panel.resize());
sPrefs.on('panelWidth', x => panel.resize());
sPrefs.on('panelPosition', x => panel.position = prefs.panelPosition);

// Update global notes state
sPrefs.on('global', x => panel.updateUI());

// Update font
sPrefs.on('textSize', x => panel.cmd('font', { size: prefs.textSize }));
sPrefs.on('textStyle', x => panel.cmd('font', { style: prefs.textStyle }));
sPrefs.on('textColor', x => panel.cmd('font', { color: prefs.textColor }));

// Update hotkeys
sPrefs.on('combo', x => hotkeys.update());

// Open manager
sPrefs.on('openManager', x => manager.open());

// Open settings
sPrefs.on('openSettings', x => settings.open());

/* Export */

exports.main = function(opts) {
  // Set sync key
  if (opts.loadReason == 'install') service.set(syncPref, prefs.sync);
  // Send localization data
  panel.cmd('localization', {
    noNotes: lang('noNotes'),
    globalNotes: lang('global_title'),
    noGlobalNotes: lang('noGlobalNotes')
  });
  // Set text style
  panel.cmd('font', {
    size: prefs.textSize,
    style: prefs.textStyle,
    color: prefs.textColor
  });
  // Update notes and icon
  panel.update();
};
