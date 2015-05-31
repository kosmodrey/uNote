'use strict';

const
  me = require('sdk/self'),
  l = require('sdk/l10n').get,
  service = require('sdk/preferences/service'),
  prefs = require('sdk/simple-prefs'),
  pref = prefs.prefs,

  { db, notes, storage } = require('./lib/notes'),
  { tab } = require('./lib/tab'),
  { keys } = require('./lib/keys'),
  { button } = require('./lib/button'),
  { panel } = require('./lib/panel'),
  { settings } = require('./lib/settings'),
  { manager } = require('./lib/manager'),
  { contextMenu } = require('./lib/contextmenu');

const syncPref = 'services.sync.prefs.sync.extensions.' + me.id + '.syncNotes';

var
  id = null,
  preLoad = pref.preLoad;

/* Functions */
function saveNote() {
  if (!id) return;
  const data = storage.get(id[0]);
  data.timeUpdated = Date.now();
  notes.put(data);
  id = null;
  console.log('<update>', data);
}

/* Button */

button.self.on('change', state => {
  if (state.checked) {
    panel.show();
  }
});

/* Panel */

panel.self.on('hide', x => {
  button.checked(false);
  saveNote();
});

panel.self.on('show', x => {
  button.checked(true);
  if (!preLoad) panel.update();
  panel.cmd('show');
});

panel.self.port.on('cmd', (name, data) => {
  if (!id) id = tab.getId();
  switch(name) {
    case 'typing':
      return storage.setData('.', 'notes', data);
    case 'typing-title':
      return storage.setData('.', 'title', data);
    case 'button':
      panel.hide();
      if (data == 'manager') manager.open();
      else if (data == 'settings') settings.open();
    break;
    case 'toggle':
      saveNote();
      pref.global = data;
    break;
  }
});

/* Tabs */

(function() {

  tab.self.on('activate', update);
  tab.self.on('ready', update);

  function update() {
    const id = tab.getId();
    if (preLoad) panel.update();
    console.log(id);
  }

}());

/* Preferences */

prefs.on('', name => {
  switch(name) {
    case 'panelWidth':
    case 'panelHeight':
      return panel.resize();
    case 'panelPosition':
      return (panel.position = pref.panelPosition);
    case 'combo':
      return keys.update();
    case 'preLoad':
      return (preLoad = pref.preLoad);
    case 'global':
    case 'perUrl':
    case 'preLoad':
      return panel.update();
  }
});

prefs.on('openManager', x => manager.open());
prefs.on('openSettings', x => settings.open());
prefs.on('textSize', x => panel.cmd('style', { size: pref.textSize }));
prefs.on('textStyle', x => panel.cmd('style', { style: pref.textStyle }));
prefs.on('textColor', x => panel.cmd('style', { color: pref.textColor }));
prefs.on('textRTL', x => panel.cmd('style', { rtl: pref.textRTL }));

/* Database */

db.event.on('success', x => {
  panel.update();
});

/* Export */

exports.main = function(opts) {
  // if (opts.loadReason == 'install') service.set(syncPref, pref.sync);
  panel.cmd('startup', {
    loc: {
      noNotes: l('noNotes'),
      noGlobalNotes: l('noGlobalNotes'),
      globalNotes: l('globalNotes'),
    }
  });
  panel.cmd('style', {
    size: pref.textSize,
    style: pref.textStyle,
    color: pref.textColor,
    ltr: pref.textRTL
  });
};
