'use strict';

const
  pref = require('sdk/simple-prefs').prefs,
  { Hotkey } = require('sdk/hotkeys'),
  { panel } = require('./panel');

// Create combo
let combo = createCombo();

// Hotkeys object
const keys = {
  self: combo,
  update: function() {
    combo = createCombo();
  }
}

// Create new combo object
function createCombo() {
  if (combo) combo.destroy();
  combo = Hotkey({
    combo: pref.combo,
    onPress: function() {
      if (panel.self.isShowing) {
        panel.hide();
      } else {
        panel.show();
      }
    }
  });
  return combo;
}

// Export
exports.keys = keys;
