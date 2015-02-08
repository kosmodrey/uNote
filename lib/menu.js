'use strict';

const lang = require('sdk/l10n').get;
const menu = require('sdk/context-menu');
const prefs = require('sdk/simple-prefs').prefs;
const { notes } = require('notes');
const { panel } = require('panel');

// Create context menu
const self = menu.Item({
  label: lang('copyNote'),
  context: menu.SelectionContext(),
  contentScriptFile: './context-menu.js',
  onMessage: function(text) {
    // Append selected text to current note
    const data = notes.get();
    notes.set((data ? data + '\n' + prefs.separator + '\n' : '') + text);
    // Show panel?
    if (prefs.panelOnCopy) {
      panel.show();
    } else {
      panel.cmd('notes', notes.get());
    }
  }
});

// Context menu object
const contextMenu = {
  self: self
};

// Export
exports.contextMenu = contextMenu;
