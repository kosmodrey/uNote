'use strict';

const prefs = require('sdk/simple-prefs').prefs;
const s = require('sdk/simple-storage');
const { tabs } = require('tabs');

// Note object
const notes = {
  // Get item object
  get: function(item) {
    console.log('notes > get:', item);
    if (item == '.') item = tabs.getHost();
    return item ? s.storage[item] || {} : s.storage;
  },
  // Set item object
  set: function(item, data) {
    console.log('notes > set:', item, data);
    if (item == '.') item = tabs.getHost();
    s.storage[item] = data;
  },
  // Set item data
  setData: function(item, what, data) {
    console.log('notes > setData:', item, what, data);
    if (item == '.') item = tabs.getHost();
    if (!s.storage.hasOwnProperty(item)) s.storage[item] = {};
    s.storage[item][what] = data;
  },
  getData: function(item, what) {
    console.log('notes > getData:', item, what);
    if (item == '.') item = tabs.getHost();
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

// Export
exports.notes = notes;
