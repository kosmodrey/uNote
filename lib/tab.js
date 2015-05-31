'use strict';

const
  self = require('sdk/tabs'),
  pref = require('sdk/simple-prefs').prefs,
  { URL: site } = require('sdk/url');

// Disable notes
const disabledList = ['unote-at-kosmodrey'];

// Tabs object
const tab = {
  self: self,
  getId: function(url = self.activeTab.url) {
    let host = site(url).host, id = pref.perUrl ? url : host;
    id = pref.global ? '__global__' :
      (this.isDisabled(id) ? null : id) || '__global__';
    return [id, host, url];
  },
  isDisabled: function(url = this.getId()[0]) {
    return disabledList.indexOf(url) !== -1;
  }
};

// Export
exports.tab = tab;
