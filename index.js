'use strict';

const
  me = require('sdk/self'),
  l = require('sdk/l10n').get,
  service = require('sdk/preferences/service'),
  prefs = require('sdk/simple-prefs'),
  pref = prefs.prefs,

  { notes } = require('./lib/notes'),
  { tab } = require('./lib/tab'),
  { keys } = require('./lib/keys'),
  { button } = require('./lib/button'),
  { panel } = require('./lib/panel'),
  { settings } = require('./lib/settings'),
  { manager } = require('./lib/manager'),
  { contextMenu } = require('./lib/contextmenu');

var
  memory = {},
  preLoad = pref.preLoad;

/* Button */

button.self.on('change', state => {
  if (state.checked) {
    panel.show();
  }
});

/* Panel */

panel.self.on('hide', x => {
  button.checked(false);
  saveMemory();
});

panel.self.on('show', x => {
  button.checked(true);
  if (!preLoad) panel.update();
  panel.cmd('show');
});

panel.self.port.on('cmd', (name, data) => {
  switch(name) {
    case 'typing':
      setMemory();
      return (memory.notes = data);
    case 'typing-title':
      setMemory();
      return (memory.title = data);
    case 'button':
      panel.hide();
      if (data == 'manager') manager.open();
      else if (data == 'settings') settings.open();
    break;
    case 'toggle':
      setMemory();
      saveMemory();
      pref.global = data;
    break;
  }
});

/* Tabs */

tab.self.on('activate', x => preLoad && panel.update());
tab.self.on('ready', x => preLoad && panel.update());

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

/* Functions */

function setMemory() {
  [memory.id, memory.host, memory.url] = tab.getId();
}

function saveMemory() {
  if (!memory.id) return;
  if (memory.notes === undefined && memory.title == undefined) return;
  memory.timeUpdated = Date.now();
  notes.update(memory.id, memory);
  memory = {};
}

/* Export */

exports.main = function(opts) {
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

exports.memory = memory;
