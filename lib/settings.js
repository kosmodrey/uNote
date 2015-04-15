'use strict';

const me = require('sdk/self');
const tabs = require('sdk/tabs');
const lang = require('sdk/l10n').get;
const prefs = require('sdk/simple-prefs').prefs;
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
        worker.port.emit('cmd', 'startup', {
          prefs: prefs,
        });
      break;
      // Set preferences
      case 'set':
        const [name, value] = data;
        prefs[name] = value;
      break;
    }
  });
}

// Export
exports.settings = settings;
