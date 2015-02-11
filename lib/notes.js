'use strict';

const tabs = require('sdk/tabs');
const prefs = require('sdk/simple-prefs').prefs;
const s = require('sdk/simple-storage');
const { URL: url } = require('sdk/url');

// Note object
const notes = {
  // Get item object
  get: function(item) {
    console.log('notes > get:', item);
    if (item == '.') item = getHost();
    return item ? s.storage[item] || {} : s.storage;
  },
  // Set item object
  set: function(item, data) {
    console.log('notes > set:', item, data);
    if (item == '.') item = getHost();
    s.storage[item] = data;
  },
  // Set item data
  setData: function(item, what, data) {
    console.log('notes > setData:', item, what, data);
    if (item == '.') item = getHost();
    if (!s.storage.hasOwnProperty(item)) s.storage[item] = {};
    s.storage[item][what] = data;
  },
  getData: function(item, what) {
    console.log('notes > getData:', item, what);
    if (item == '.') item = getHost();
    return s.storage.hasOwnProperty(item) ? s.storage[item][what] : undefined;
  },
  remove: function(item) {
    delete s.storage[item];
  },
  // Set data to storage
  setStorage: function(data = JSON.parse(prefs['syncNotes'])) {
    console.log('notes > setStorage:', data);
    s.storage = data;
  },
  // Sync storage
  sync: function(data = s.storage) {
    console.log('notes > sync:', data);
    prefs['syncNotes'] = JSON.stringify(data);
  }
};

// Get host from url
function getHost(link = tabs.activeTab.url) {
  return url(link).host || '__null__';
}

// Export
exports.notes = notes;
