'use strict';

const me = require('sdk/self');
const tabs = require('sdk/tabs');
const lang = require('sdk/l10n').get;
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
      case 'startup':
      break;
    }
  });
}

// Export
exports.settings = settings;
