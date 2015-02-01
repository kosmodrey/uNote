'use strict';

let { Panel } = require('sdk/panel');
let { ToggleButton } = require('sdk/ui/button/toggle');
let { Hotkey } = require('sdk/hotkeys');
let { URL: url } = require('sdk/url');

let _ = require('sdk/l10n').get;
let self = require('sdk/self');
let tabs = require('sdk/tabs');
let sp = require('sdk/simple-prefs');
let prefs = sp.prefs;
let serv = require('sdk/preferences/service');
let menu = require('sdk/context-menu');
let s = require('sdk/simple-storage');

// Store notes in memory
var notes = s.storage || {};
// Combo state
var comboState = false;

// Panel

let panel = Panel({
  width: prefs.panelWidth,
  height: prefs.panelHeight,
  contextMenu: true,
  contentURL: './panel.html',
  contentScriptFile: './note.js',
  onHide: (state) => button.state('window', { checked: false })
});

panel.on('show', initNote);

panel.on('hide', () => {
  // set current notes to sync storage
  prefs['syncNotes'] = JSON.stringify(notes);
  initNote();
});

panel.port.on('typed-text', (text) => {
  notes[getHost(tabs.activeTab.url)] = text;
});

// Context menu

let contextMenu = menu.Item({
  label: _('copyNote'),
  context: menu.SelectionContext(),
  contentScriptFile: './context-menu.js',
  onMessage: (text) => {
    let data = notes[getHost(tabs.activeTab.url)];
    notes[getHost(tabs.activeTab.url)] = 
      (data ? data + '\n' + prefs.separator + '\n' : '') + text;
    if (prefs.panelOnCopy) {
      panel.show({ position: button });
    } else {
      initNote();
    }
  }
});

// Toolbar button

let button = ToggleButton({
  id: 'show-note',
  label: 'μNote',
  icon: './icon.svg' ,
  onChange: (state) => {
    if (state.checked) panel.show({ position: button });
  }
});

// Hotkey combo

let hotkey = createCombo();

// Tabs and Windows

tabs.on('ready', initNote);
tabs.on('activate', initNote);

// Preferences

sp.on('panelHeight', panelResize);
sp.on('panelWidth', panelResize);

sp.on('textStyle', () => {
  panel.port.emit('cmd', 'textStyle', prefs.textStyle);
});

sp.on('textColor', () => {
  panel.port.emit('cmd', 'textColor', prefs.textColor);
});

sp.on('combo', createCombo);

sp.on('sync', () => {
  serv.set('services.sync.prefs.sync.extensions.' + self.id
    + '.syncNotes', prefs.sync);
});

// Synchronization

sp.on('syncNotes', () => {
  // set changes to simple-storage and update note
  s.storage = JSON.parse(prefs['syncNotes']);
  notes = s.storage;
  initNote();
});

// Export

exports.main = (options) => {
  switch(options.loadReason) {
    case 'install':
      // set sync key
      serv.set('services.sync.prefs.sync.extensions.' + self.id
        + '.syncNotes', prefs.sync);
      break;
  }
  panel.port.emit('cmd', 'placeholder', _('noNotes'));
  panel.port.emit('cmd', 'textStyle', prefs.textStyle);
  panel.port.emit('cmd', 'textColor', prefs.textColor);
  initNote();
};

// Functions

function createCombo() {
  // Show or hide note panel
  if (hotkey) hotkey.destroy();
  hotkey = Hotkey({
    combo: prefs.combo || 'accel-m',
    onPress: () => {
      if (comboState) {
        comboState = false;
        panel.hide();
      } else {
        comboState = true;
        panel.show({ position: button });
        initNote();
      }
    }
  });
  return hotkey;
}

function initNote() {
  panel.port.emit('init', notes[getHost(tabs.activeTab.url)]);
}

function panelResize() {
  panel.resize(prefs.panelWidth, prefs.panelHeight);
}

function getHost(link) {
  return url(link).host || '__null__';
}
