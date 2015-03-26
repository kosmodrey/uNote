'use strict';

const self = require('sdk/tabs');
const prefs = require('sdk/simple-prefs').prefs;
const { URL: url } = require('sdk/url');

// Disable notes
const disableList = ['unote-at-kosmodrey'];

// Tabs object
const tabs = {
  self: self,
  getHost: function(link = self.activeTab.url) {
    return prefs.global ? '__null__' : url(link).host || '__null__';
  },
  isDisabled: function(host = this.getHost()) {
    return disableList.indexOf(tabs.getHost()) !== -1;
  }
};

// Export
exports.tabs = tabs;
exports.disableList = disableList;
