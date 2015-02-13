'use strict';

const prefs = require('sdk/simple-prefs').prefs;
const s = require('sdk/simple-storage');
const { tabs } = require('tabs');

// Note object
const notes = {
  // Get item object
  get: function(item) {
    if (item == '.') item = tabs.getHost();
    return item ? s.storage[item] || {} : s.storage;
  },
  // Set item object
  set: function(item, data) {
    if (item == '.') item = tabs.getHost();
    s.storage[item] = data;
  },
  // Set item data
  setData: function(item, what, data) {
    if (item == '.') item = tabs.getHost();
    if (!s.storage.hasOwnProperty(item)) s.storage[item] = {};
    s.storage[item][what] = data;
  },
  // Get specific data from item
  getData: function(item, what) {
    if (item == '.') item = tabs.getHost();
    return s.storage.hasOwnProperty(item) ? s.storage[item][what] : undefined;
  },
  // Remove item
  remove: function(item) {
    delete s.storage[item];
  },
  // Set data to storage
  setStorage: function(data = JSON.parse(prefs['syncNotes'])) {
    s.storage = data;
  },
  // Sync storage
  sync: function(data = s.storage) {
    prefs['syncNotes'] = JSON.stringify(data);
  }
};

// Export
exports.notes = notes;
