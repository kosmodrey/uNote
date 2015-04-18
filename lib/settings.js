'use strict';

const me = require('sdk/self');
const tabs = require('sdk/tabs');
const lang = require('sdk/l10n').get;
const prefs = require('sdk/simple-prefs').prefs;
const { notes } = require('notes');
const { PageMod } = require('sdk/page-mod');

const pageUrl = me.data.url('./modules/settings/index.html');

// Create page mod
const self = PageMod({
  include: pageUrl,
  contentScriptFile: './modules/settings/settings.js',
  contentScriptWhen: 'ready',
  onAttach: attachment
});

// Settings object
const settings = {
  self: self,
  open: function() {
    tabs.open(pageUrl);
  }
};

// Worker
function attachment(worker) {
  worker.port.on('cmd', (name, data) => {
    switch (name) {
      // Send data on page startup
      case 'startup':
        worker.port.emit('cmd', 'startup', { prefs: prefs });
      break;
      // Set preferences
      case 'set':
        let [name, value] = data;
        prefs[name] = value;
      break;
      // Load backup
      case 'restore':
        try {
          // Convert to object
          const json = JSON.parse(data);
          // Check for structure
          for (let item in json) {
            if (!json[item].hasOwnProperty('notes')) throw 'invalid';
          }
          // Set storage
          notes.setStorage(json);
          // Send success
          worker.port.emit('cmd', 'restore', true);
        } catch (error) {
          // Send error
          worker.port.emit('cmd', 'restore', error);
        }
      break;
    }
  });
}

// Export
exports.settings = settings;
