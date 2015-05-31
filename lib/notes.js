'use strict';

const
  s = { storage: {} },
  // s = require('sdk/simple-storage'),
  pref = require('sdk/simple-prefs').prefs,
  { tab } = require('./tab'),
  { AppStorage } = require('./appstorage.js');

const db = new AppStorage('storage');

// Defaults
const defNotes = [
  {
    id: '__global__',
    host: '__global__',
    title: '',
    notes: '',
    flags: [],
    timeUpdated: Date.now()
  }
];

// Set database version
db.version(1).stores({
  notes: ['id', 'host', '*flags', 'timeUpdated']
}).populate((done, error) => {
  db.store('notes').add(defNotes).then(done).catch(error);
});

// Open database
db.open();

// Notes object
const notes = {
  get: function(id) {
    return db.store('notes').get(id);
  },
  list: function(cb) {
    return db.store('notes').getArray(cb);
  },
  put: function(data) {
    return db.store('notes').put(data);
  },
  update: function(id, data) {
    return db.store('notes').update(id, data);
  },
  remove: function(id) {
    return db.store('notes').delete(id);
  }
};

// Storage object
const storage  = {
  get: function(item) {
    if (item == '.') item = tab.getId()[0];
    return item ? s.storage[item] || {} : s.storage;
  },
  set: function(item, data) {
    if (item == '.') item = tab.getId()[0];
    s.storage[item] = data;
  },
  setData: function(item, what, data) {
    if (item == '.') item = tab.getId()[0];
    if (!s.storage.hasOwnProperty(item)) s.storage[item] = {};
    s.storage[item][what] = data;
  },
  getData: function(item, what) {
    if (item == '.') item = tab.getId()[0];
    return s.storage.hasOwnProperty(item) ? s.storage[item][what] : undefined;
  },
  remove: function(item) {
    delete s.storage[item]
  },
  setStorage: function(data = JSON.parse(pref['syncNotes'])) {
    s.storage = data;
  },
  sync: function(data = s.storage) {
    pref['syncNotes'] = JSON.stringify(data);
  }
};

// Export
exports.db = db;
exports.notes = notes;
exports.storage = storage;
