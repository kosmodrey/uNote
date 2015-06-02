'use strict';

const
  me = require('sdk/self'),
  tabs = require('sdk/tabs'),
  pref = require('sdk/simple-prefs').prefs,
  { notes } = require('./notes'),
  { PageMod } = require('sdk/page-mod');

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
  const cmd = (name, data) => worker.port.emit('cmd', name, data);
  worker.port.on('cmd', (name, data) => {
    switch (name) {
      // Send data on page startup
      case 'startup':
        cmd('startup', { prefs: pref });
        notes.list(items => {
          const json = JSON.stringify(items);
          console.log('<uNote backup> data', json);
          cmd('backup', json);
        });
      break;
      // Set preferences
      case 'set':
        let [name, value] = data;
        pref[name] = value;
      break;
      // Load backup
      case 'restore':
        try {
          // Convert to object
          const json = JSON.parse(data);
          let name, item, box = [];
          if (json instanceof Array) {
            box = json;
          } else {
            for (name in json) {
              item = json[name];
              if (name == '__null__') name = '__global__';
              item.id = name;
              box.push(item);
            }
          }
          console.log('<uNote restore> data', box);
          // Save data
          notes.put(box).then(x => {
            cmd('restore', true);
          }).catch(error => {
            cmd('restore', error);
          });
        } catch (error) {
          // Send error
          cmd('restore', error);
        }
      break;
    }
  });
}

// Export
exports.settings = settings;
