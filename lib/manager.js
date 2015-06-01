'use strict';

const
  me = require('sdk/self'),
  tabs = require('sdk/tabs'),
  l = require('sdk/l10n').get,
  pref = require('sdk/simple-prefs').prefs,
  { PageMod } = require('sdk/page-mod'),
  { setTimeout, clearTimeout } = require('sdk/timers'),
  { notes } = require('./notes');

const pageUrl = me.data.url('./modules/manager/index.html');

// Create page mod
const self = PageMod({
  include: pageUrl,
  contentScriptWhen: 'ready',
  contentScriptFile: './modules/manager/manager.js',
  onAttach: attachment
});

// Manager object
const manager = {
  self: self,
  open: function() {
    tabs.open(pageUrl);
  }
};

// Worker
function attachment(worker) {
  let timer = null;
  const cmd = (name, data) => worker.port.emit('cmd', name, data);
  worker.port.on('cmd', (name, data) => {
    switch (name) {
      case 'startup':
        worker.port.emit('cmd', 'startup', {
          rtl: pref.textRTL,
          loc: {
            noNotes: l('noNotes'),
            noNotesLabel: l('noNotesLabel'),
            globalNotes: l('globalNotes'),
            removeNote: l('removeNote')
          }
        });
      case 'list':
        notes.list(list => cmd('list', list));
      break;
      case 'get':
        notes.get(data).then(item => cmd('get', item));
      break;
      case 'typing':
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(x => {
          notes.update(data.id, data);
          cmd('update', data);
        }, 1000);
      break;
      case 'remove':
        notes.remove(data);
      break;
    }
  });
}

// Export
exports.manager = manager;
