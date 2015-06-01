'use strict';

const
  loc = require('sdk/l10n').get,
  menu = require('sdk/context-menu'),
  pref = require('sdk/simple-prefs').prefs,
  { tab } = require('./tab'),
  { panel } = require('./panel'),
  { notes } = require('./notes');

// Create context menu
const self = menu.Item({
  label: loc('copyText'),
  context: menu.SelectionContext(),
  contentScriptFile: './modules/contextMenu.js',
  onMessage: function(text) {
    const [id, host, url] = tab.getId();
    notes.get(id).then(item => {
      item = item || {
        id: id,
        url: url,
        host: host,
        title: '',
        notes: '',
        flags: []
      };
      item.notes = (
        item.notes.length ? item.notes + '\n' + pref.separator + '\n' : ''
      ) + text;
      item.timeUpdated = Date.now();
      notes.update(item.id, item);
      panel.cmd('update', item);
      if (pref.panelOnCopy) panel.show();
    });
  }
});

// Context menu object
const contextMenu = {
  self: self
};

// Export
exports.contextMenu = contextMenu;
