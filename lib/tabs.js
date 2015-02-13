'use strict';

const self = require('sdk/tabs');
const { URL: url } = require('sdk/url');

// Disable notes
const disableList = ['unote-at-kosmodrey'];

// Tabs object
const tabs = {
  self: self,
  getHost: function(link = self.activeTab.url) {
    return url(link).host || '__null__';
  },
  isDisabled: function(host = this.getHost()) {
    return disableList.indexOf(tabs.getHost()) !== -1;
  }
};

// Export
exports.tabs = tabs;
exports.disableList = disableList;
