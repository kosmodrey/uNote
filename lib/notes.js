'use strict';

const
  s = require('sdk/simple-storage'),
  pref = require('sdk/simple-prefs').prefs,
  { AppStorage } = require('./appstorage.js');

const db = new AppStorage('storage', { debug: false });

// Defaults
const defNotes = [];

// Set database version
db.version(1).stores({
  notes: ['id', 'host', '*flags', 'timeUpdated']
}).populate((done, error) => {
  db.store('notes').add(defNotes).then(done).catch(error);
}).init((done, error) => {
  if (Object.keys(s.storage).length) {
    const box = [];
    let item, data;
    for (item in s.storage) {
      data = s.storage[item];
      if (item == '__null__') item = '__global__';
      box.push({
        id: item,
        title: data.title,
        notes: data.notes,
        timeUpdated: Date.now(),
        flags: []
      });
    }
    console.log('<uNote upgrade> items:', box);
    db.store('notes').put(box).then(x => {
      console.log('<uNote upgrade> done!');
      s.storage = {};
      done();
    }).catch(x => {
      console.error('<uNote upgrade> error:', x);
      error();
    });
  }
  done();
});

// Open database
db.open();

// Notes object
const notes = {
  put: function(items) {
    return db.store('notes').put(items);
  },
  get: function(id) {
    return db.store('notes').get(id);
  },
  list: function(cb) {
    return db.store('notes').getArray(cb);
  },
  update: function(id, data) {
    return db.store('notes').update(id, data);
  },
  remove: function(id) {
    return db.store('notes').delete(id);
  }
};

// Export
exports.db = db;
exports.notes = notes;
