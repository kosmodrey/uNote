'use strict';

const { ToggleButton } = require('sdk/ui/button/toggle');

// Create button
const self = ToggleButton({
  id: 'unote-button',
  label: 'uNote',
  icon: {
    16: './icons/icon16.png',
    32: './icons/icon32.png',
    64: './icons/icon64.png'
  },
});

// Button object
const button = {
  self: self,
  checked: function(state) {
    self.state('window', { checked: !!state });
  },
  disabled: function(state) {
    self.state('tab', { disabled: !!state });
  }
};

// Export
exports.button = button;
