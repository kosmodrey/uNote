'use strict';

let { Panel } = require('sdk/panel');
let { ToggleButton } = require('sdk/ui/button/toggle');
let { URL: url } = require('sdk/url');

let self = require('sdk/self');
let tabs = require('sdk/tabs');
let sp = require('sdk/simple-prefs');
let prefs = sp.prefs;
let menu = require('sdk/context-menu');
let storage = require('sdk/simple-storage').storage;

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

panel.port.on('typed-text', (text) => {
  storage[getHost(tabs.activeTab.url)] = text;
});

// Context menu

let contextMenu = menu.Item({
  label: 'Send to μNote...',
  context: menu.SelectionContext(),
  contentScriptFile: './context-menu.js',
  onMessage: (text) => {
    let data = storage[getHost(tabs.activeTab.url)];
    storage[getHost(tabs.activeTab.url)] = 
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

// Tabs and Windows

tabs.on('ready', initNote);
tabs.on('activate', initNote);

// Preferences

sp.on('panelHeight', panelResize);
sp.on('panelWidth', panelResize);

// Export

exports.main = initNote;

// Functions

function initNote() {
  panel.port.emit('init', storage[getHost(tabs.activeTab.url)]);
}

function panelResize() {
  panel.resize(prefs.panelWidth, prefs.panelHeight);
}

function getHost(link) {
  return url(link).host || '__null__';
}
