'use strict';

const tabs = require('sdk/tabs');
const prefs = require('sdk/simple-prefs').prefs;
const s = require('sdk/simple-storage');
const { URL: url } = require('sdk/url');

// Store notes in memory
let memory = s.storage || {};

// Note object
const notes = {
  // Get host notes
  get: function(host = getHost()) {
    // console.log('notes > get:', host, memory[host]);
    return host ? memory[host] : memory;
  },
  // Set host notes
  set: function(notes) {
    // console.log('notes > set:', getHost(), notes);
    return memory[getHost()] = notes;
  },
  // Get note state
  getState: function() {
    // console.log('notes > getState');
    return memory['__states__'][getHost()];
  },
  // Set note state
  setState: function(state) {
    // console.log('notes > setState:', state);
    memory['__states__'][getHost()] = state;
  },
  // Set data to storage
  setStorage: function(data = JSON.parse(prefs['syncNotes'])) {
    // console.log('notes > setStorage:', data);
    s.storage = data;
  },
  // Set data to memory
  setMemory: function(data = s.storage) {
    // console.log('notes > setMemory:', data);
    memory = data;
  },
  // Sync storage
  sync: function(data = memory) {
    // console.log('notes > synging:', memory);
    prefs['syncNotes'] = JSON.stringify(data);
  }
};

// Get host from url
function getHost(link = tabs.activeTab.url) {
  return url(link).host || '__null__';
}

// Export
exports.notes = notes;
exports.memory = memory;
