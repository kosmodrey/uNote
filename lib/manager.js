'use strict';

const me = require('sdk/self');
const tabs = require('sdk/tabs');
const lang = require('sdk/l10n').get;
const { PageMod } = require('sdk/page-mod');
const { notes } = require('./notes');

const pageUrl = me.data.url('./modules/manager/index.html');

// Create page mod
const self = PageMod({
  include: pageUrl,
  contentScriptFile: './modules/manager/manager.js',
  contentScriptWhen: 'ready',
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
  worker.port.on('cmd', (name, data) => {
    switch (name) {
      case 'startup':
        worker.port.emit('cmd', 'localization', {
          noNotes: lang('noNotes'),
          noNotesLabel: lang('noNotesLabel'),
          globalNotes: lang('global_title'),
          pinNote: lang('pinNote'),
          removeNote: lang('removeNote')
        });
      case 'list':
        data = notes.get();
        worker.port.emit('cmd', 'list', data);
      break;
      case 'get':
        worker.port.emit('cmd', 'get', { host: data, item: notes.get(data) });
      break;
      case 'setState':
        notes.setData(data.host, 'state', !!data.state);
      break;
      case 'typing':
        notes.setData(data.host, 'notes', data.notes);
      break;
      case 'remove':
        notes.remove(data);
      break;
    }
  });
}

// Export
exports.manager = manager;
