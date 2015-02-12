'use strict';

const self = require('sdk/tabs');
const { URL: url } = require('sdk/url');

// Tabs object
const tabs = {
  self: self,
  getHost: function(link = self.activeTab.url) {
    return url(link).host || '__null__';
  }
};

// Export
exports.tabs = tabs;
