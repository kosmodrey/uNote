'use strict';

const
  pref = require('sdk/simple-prefs').prefs,
  { Panel } = require('sdk/panel'),
  { notes, storage } = require('./notes'),
  { button } = require('./button'),
  { tab } = require('./tab');

// Panel positions
const positionNames = {
  'button': button.self,
  'center': null,
  'top-left': { top: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'bottom-left': { bottom: 0, left: 0 },
  'bottom-right': { bottom: 0, right: 0 }
};

// Create panel
const self = Panel({
  width: pref.panelWidth,
  height: pref.panelHeight,
  contextMenu: true,
  contentURL: './modules/panel/index.html',
  contentScriptFile: './modules/panel/panel.js'
});

// Panel object
const panel = {
  self: self,
  position: pref.panelPosition,
  show: function(pos = this.position) {
    self.show({ position: positionNames[pos] });
  },
  hide: function() {
    self.hide();
  },
  resize: function() {
    self.resize(pref.panelWidth, pref.panelHeight);
  },
  update: function(id = tab.getId()) {
    const self = this, host = id[1];
    id = id[0];
    notes.get(id).then(item => {
      item = item || { id: id, host: host, title: '', notes: '', flags: [] };
      storage.set(id, item);
      self.cmd('update', item);
    });
  },
  cmd: function(name, data) {
    self.port.emit('cmd', name, data);
  }
};

// Export
exports.panel = panel;
