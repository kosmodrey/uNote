'use strict';

const prefs = require('sdk/simple-prefs').prefs;
const { Hotkey } = require('sdk/hotkeys');
const { panel } = require('panel'); 

// Create combo
let combo = createCombo();

// Hotkeys object
const hotkeys = {
  self: combo,
  update: function() {
    // console.log('keys > update');
    combo = createCombo();
  }
}

// Create new combo object
function createCombo() {
  if (combo) combo.destroy();
  combo = Hotkey({
    combo: prefs.combo || 'accel-m',
    onPress: function() {
      // Hide or show panel
      if (panel.self.isShowing) {
        panel.self.hide();
      } else {
        panel.show();
      }
    }
  });
  return combo;
}

// Export
exports.hotkeys = hotkeys;
