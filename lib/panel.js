'use strict';

const sPrefs = require('sdk/simple-prefs');
const prefs = sPrefs.prefs;
const { Panel } = require('sdk/panel');
const { button } = require('button');

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
  width: prefs.panelWidth,
  height: prefs.panelHeight,
  contextMenu: true,
  contentURL: './panel.html',
  contentScriptFile: './panel.js'
});

// Panel object
const panel = {
  self: self,
  position: prefs.panelPosition,
  // Show panel
  show: function(position = this.position) {
    self.show({ position: positionNames[position] });
  },
  // Resize panel
  resize: function(width = prefs.panelWidth, height = prefs.panelHeight) {
    self.resize(width, height);
  },
  // Send command
  cmd: function(name, data) {
    self.port.emit('cmd', name, data);
  }
};

// Export
exports.panel = panel;
