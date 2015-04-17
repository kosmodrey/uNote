'use strict';

const self = require('sdk/tabs');
const prefs = require('sdk/simple-prefs').prefs;
const { URL: url } = require('sdk/url');

// Disable notes
const disableList = ['unote-at-kosmodrey'];

// Tabs object
const tabs = {
  self: self,
  getHost: function(host = self.activeTab.url) {
    host = url(host).host;
    return prefs.global ? '__null__' :
      (this.isDisabled(host) ? null : host) || '__null__';
  },
  isDisabled: function(host = this.getHost()) {
    return disableList.indexOf(host) !== -1;
  }
};

// Export
exports.tabs = tabs;
exports.disableList = disableList;
