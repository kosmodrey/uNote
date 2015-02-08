'use strict';

const { ToggleButton } = require('sdk/ui/button/toggle');

// Create button
const self = ToggleButton({
  id: 'button-note',
  label: 'μNote',
  icon: './icons/icon.svg'
});

// Button object
const button = {
  self: self,
  checked: function(state) {
    self.state('window', { checked: !!state });
  },
  updateIcon: function(state) {
    self.state(self, {
      icon: state ? './icons/icon-pinned.svg' : './icons/icon.svg'
    });
  }
};

// Export
exports.button = button;
