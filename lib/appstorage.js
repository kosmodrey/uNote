'use strict';

const { indexedDB } = require('sdk/indexed-db');

const AppStorage = function(name, options = {}) {

  const self = this;
  
  this.name = name || 'storage';
  this.db = null;
  this.lastVersion = 0;
  this.storageList = {};
  this.event = new Port();
  this.options = { debug: options.debug || false };

  // Storage upgrade event
  this.event.on('upgrade', evt => {
    self.debug('upgrade:', evt);
    const db = evt.target.result,
      storeObject = self.storageList[evt.newVersion];
    // Upgrade storages and indexes
    for (var storeName in storeObject.stores) {
      const model = storeObject.stores[storeName], indexes = model.indexes,
        // Create or get store
        store = db.objectStoreNames.contains(storeName) ?
          db.objectStore(storeName) :
            db.createObjectStore(storeName, model.key);
      // Delete all indexes form store
      for (var index of store.indexNames) {
        self.debug('upgrade > delete index:', index);
        store.deleteIndex(index);
      }
      // Create new store indexes
      if (Object.keys(indexes).length) {
        for (index in indexes) {
          index = indexes[index];
          self.debug('upgrade > create index:', index);
          // Create index
          store.createIndex(index.name, index.keyPath, {
            unique: index.unique,
            multiEntry: index.multiEntry
          });
        }
      }
    }
    // Upgrade version
    if (storeObject.upgrade) storeObject.upgrade(db);
  });

};

AppStorage.prototype = {
  // Set storage version
  version: function(number) {
    const self = this;
    self.debug('version: ' + number);
    // Set new version object
    if (!self.storageList.hasOwnProperty(number))
      self.storageList[number] = { version: number };
    // Set last version
    if (number > self.lastVersion) self.lastVersion = number;
    // Upgrade store
    function upgradeStore(fn) {
      self.storageList[number].upgrade = fn;
      return {
        populate: populateStore,
        init: initStore
      }
    };
    // Upgrade store
    function populateStore(fn) {
      self.storageList[number].populate = fn;
      return {
        init: initStore
      }
    };
    // Upgrade store
    function initStore(fn) {
      self.storageList[number].init = fn;
    };
    // Return stores object
    return {
      stores: function(models) {
        self.storageList[number].stores = {};
        // Process store list
        for (var store in models) {
          self.storageList[number].stores[store] = { key: {}, indexes: {} };
          const verObject = self.storageList[number].stores[store],
            key = verObject.key,
            indexes = verObject.indexes;
          var keyField = true,
            fieldList = models[store];
          // If string key in model
          if (isType(fieldList, 'String') || isType(fieldList, 'Null'))
            fieldList = [fieldList];
          // Process field list
          for (var field of fieldList) {
            // First field is a store key
            if (keyField) {
              // Add store key
              key.autoIncrement = (field && field.charAt(0)) == '+';
              key.keyPath = key.autoIncrement ?
                field.slice(1) || null : field || null;
              keyField = false;
            } else {
              // Store indexes
              var mode = field.charAt(0);
              if (mode == '!' || mode == '*') field = field.slice(1);
              else mode = null;
              // Add index object
              indexes[field] = {
                name: field,
                keyPath: field,
                multiEntry: mode == '*',
                unique: mode == '!'
              };
            }
          }
        }
        // Return actions
        return {
          upgrade: upgradeStore,
          populate: populateStore,
          init: initStore
        };
      }
    };
  },
  // Open storage
  open: function() {
    const self = this;
    var upgrade = false;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(self.name, self.lastVersion);
      // Fail to open
      request.onerror = request.onblocked = evt => {
        self.debug('open > ' + evt.type + ':', evt);
        // Send event
        self.event.send(evt.type, evt);
        // Reject promise
        return reject(evt.target.error);
      };
      // Successfully opened
      request.onupgradeneeded = request.onsuccess = evt => {
        self.db = request.result;
        // Transaction error
        self.db.onabort = self.db.onerror = e => {
          self.debug('open > ' + e.type + ':', e);
          self.event.send(e.type, e);
        };
        // Version change
        self.db.onversionchange = e => {
          self.debug('open > versionchange:', e);
          self.event.send('version', e);
        };
        // Global storage event 
        if (evt.type == 'success') {
          // On storage success
          self.debug('open > onsuccess:', evt);
          const storage = self.storageList[self.db.version];
          var next = Promise.resolve();
          // Call populate on upgrade
          if (upgrade && storage.populate)
            next = next.then(x => new Promise((done, error) => {
              storage.populate(done, error);
            }));
          // Storage initialize
          if (storage.init)
            next = next.then(x => new Promise((done, error) => {
              storage.init(done, error);
            }));
          // Resolve promise
          next.then(x => {
            self.event.send('success', evt);
            resolve(true);
          }).catch(reject);
        } else {
          // On storage upgrade
          self.debug('open > onupgrade:', evt);
          upgrade = true;
          self.event.send('upgrade', evt);
        }
      };
    });
  },
  // Store
  store: function(storeName) {
    const self = this;
    self.debug('store:', storeName);
    var store = getStore('r');
    var query = { index: null, next: undefined, limit: null, range: null };
    const indexes = self.storageList[self.lastVersion]
      .stores[storeName].indexes || {};
    // Get database indexes
    if (!Object.keys(indexes).length)
      for (var index of store.indexNames) indexes[index] = store.index(index);
    // Store info object
    const info = {
      name: store.name,
      key: store.keyPath,
      autoKey: store.autoIncrement,
      indexes: indexes
    };
    // Get store object
    function getStore(mode) {
      return self.getStore(
        storeName, mode == 'rw' ? 'readwrite' : 'readonly'
      );
    }
    // Store info object
    const actions = {
      where: function(name) {
        return extend(this.then(r => {
          self.debug('where:', name);
          if (indexes[name]) query.where = name;
          return Promise.resolve();
        }), actions);
      },
      next: function(next) {
        const list = ['next', 'nextunique', 'prev', 'prevunique'];
        return extend(this.then(r => {
          self.debug('next:', next);
          query.next = list.indexOf(next) !== -1 ? next : undefined;
          return Promise.resolve();
        }), actions);         
      },
      limit: function(value) {
        return extend(this.then(r => {
          self.debug('limit:', value);
          query.limit = value;
          return Promise.resolve();
        }), actions);
      },
      above: function(value) {
        return extend(this.then(r => {
          self.debug('above:', value);
          query.range = IDBKeyRange.lowerBound(value, true);
          return Promise.resolve();
        }), actions);
      },
      aboveAnd: function(value) {
        return extend(this.then(r => {
          self.debug('aboveAnd:', value);
          query.range = IDBKeyRange.lowerBound(value);
          return Promise.resolve();
        }), actions);
      },
      below: function(value) {
        return extend(this.then(r => {
          self.debug('below:', value);
          query.range = IDBKeyRange.upperBound(value, true);
          return Promise.resolve();
        }), actions);
      },
      belowAnd: function(value) {
        return extend(this.then(r => {
          self.debug('belowAnd:', value);
          query.range = IDBKeyRange.upperBound(value);
          return Promise.resolve();
        }), actions);
      },
      equals: function(value) {
        return extend(this.then(r => {
          self.debug('equals:', value);
          query.range = IDBKeyRange.only(value);
          return Promise.resolve();
        }), actions);
      },
      between: function(lower, upper) {
        return extend(this.then(r => {
          self.debug('between:', lower, upper);
          query.range = IDBKeyRange.bound(lower, upper);
          return Promise.resolve();
        }), actions);
      },
      count: function() {
        return extend(this.then(r => {
          self.debug('count');
          store = getStore('r');
          var where = indexes[query.where] ? store.index(query.where) : store;
          if (!query.range && !query.next) return newBind(where.count());
          return new Promise((resolve, reject) => {
            var index = 0;
            const request = where.openCursor(query.range, query.next);
            request.onsuccess = e => {
              const cursor = e.target.result;
              if (!cursor || query.limit && query.limit == index) {
                query = {};
                return resolve(index);
              }
              index++;
              cursor.continue();
            };
            request.onerror = e => {
              query = {};
              reject(e.target.error);
            };
          });
        }), actions);
      },
      getEach: function(fn) {
        return extend(this.then(r => {
          self.debug('getEach');
          store = getStore('r');
          var where = indexes[query.where] ? store.index(query.where) : store;
          return new Promise((resolve, reject) => {
            var index = 0;
            const request = where.openCursor(query.range, query.next);
            request.onsuccess = e => {
              const cursor = e.target.result;
              if (!cursor || query.limit && query.limit == index) {
                query = {};
                fn.call(this, null);
                return resolve(index);
              }
              index++;
              const next = fn.call(this, cursor.value);
              if (next !== false) {
                cursor.continue();
              } else {
                return resolve(index);
              }
            };
            request.onerror = e => {
              query = {};
              reject(e.target.error);
            };
          });
        }), actions);
      },
      getArray: function(fn) {
        return extend(this.then(r => {
          self.debug('getArray');
          store = getStore('r');
          var where = indexes[query.where] ? store.index(query.where) : store;
          return new Promise((resolve, reject) => {
            var resultList = [];
            const request = where.openCursor(query.range, query.next);
            request.onsuccess = e => {
              const cursor = e.target.result;
              if (!cursor || query.limit &&
                query.limit == resultList.length) {
                  query = {};
                  fn.call(this, resultList);
                  return resolve(resultList);
              }
              resultList.push(cursor.value);
              cursor.continue(); 
            };
            request.onerror = e => {
              query = {};
              reject(e.target.error);
            };
          });
        }), actions);
      },
      getOne: function(fn) {
        return extend(this.then(r => {
          self.debug('getOne');
          store = getStore('r');
          var where = indexes[query.where] ? store.index(query.where) : store;
          return new Promise((resolve, reject) => {
            const request = where.openCursor(query.range, query.next);
            request.onsuccess = e => {
              var cursor = e.target.result;
              if (!cursor) cursor = { value: null }; 
              query = {};
              fn.call(this, cursor.value);
              resolve(cursor.value);
            };
            request.onerror = e => {
              query = {};
              reject(e.target.error);
            };
          });
        }), actions);
      },
      get: function(key) {
        return extend(this.then(r => {
          self.debug('get:', key);
          store = getStore('r');
          return newBind(store.get(key));
        }), actions);
      },
      deleteEach: function() {
        return extend(this.then(r => {
          self.debug('deleteEach');
          store = getStore('rw');
          var where = indexes[query.where] ? store.index(query.where) : store;
          return new Promise((resolve, reject) => {
            var index = 0;
            const request = where.openCursor(query.range, query.next);
            request.onsuccess = e => {
              const cursor = e.target.result;
              if (!cursor || query.limit && query.limit == index) {
                query = {};
                return resolve(index);
              }
              index++;
              cursor.delete();
              cursor.continue(); 
            };
            request.onerror = e => {
              query = {};
              reject(e.target.error);
            };
          });
        }), actions);
      },
      delete: function(items) {
        return extend(this.then(r => {
          self.debug('delete:', items);
          store = getStore('rw');
          if (!isType(items, 'Array')) return newBind(store.delete(items));
          return new Promise((resolve, reject) => {
            var index = 0;
            const resultList = [];
            for (var item of items) {
              const request = store.delete(item);
              request.onsuccess = e => {
                index++;
                resultList.push(e.target.result);
                if (index == items.length) return resolve(resultList);
              };
              request.onerror = e => reject(e.target.error);
            }
          });
        }), actions);
      },
      add: function(items) {
        return extend(this.then(r => {
          self.debug('add:', items);
          store = getStore('rw');
          if (!isType(items, 'Array')) return newBind(store.add(items));
          return new Promise((resolve, reject) => {
            var index = 0;
            const resultList = [];
            for (var item of items) {
              const request = store.add(item);
              request.onsuccess = e => {
                index++;
                resultList.push(e.target.result);
                if (index == items.length) return resolve(resultList);
              };
              request.onerror = e => reject(e.target.error);
            }
          });
        }), actions);
      },
      put: function(items) {
        return extend(this.then(r => {
          self.debug('put:', items);
          store = getStore('rw');
          if (!isType(items, 'Array')) return newBind(store.put(items));
          return new Promise((resolve, reject) => {
            var index = 0;
            const resultList = [];
            for (var item of items) {
              const request = store.put(item);
              request.onsuccess = e => {
                index++;
                resultList.push(e.target.result);
                if (index == items.length) return resolve(resultList);
              };
              request.onerror = e => reject(e.target.error);
            }
          });
        }), actions);
      },
      update: function(key, data) {
        return extend(this.then(r => {
          self.debug('update:', key, 'data:', data);
          store = getStore('rw');
          return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = e => {
              var newData, oldData = e.target.result || {};
              if (isType(data, 'Function')) {
                newData = data(oldData);
              } else {
                newData = oldData;
                for (var name in data) newData[name] = data[name];
              }
              return newBind(store.put(newData)).then(resolve, reject);
            };
            request.onerror = e => reject(e.target.error);
          });
        }), actions);
      },
      clearStore: function() {
        return extend(this.then(r => {
          self.debug('clearStore');
          return newBind(getStore('rw').clear());
        }), actions);
      }
    };
    return extend(
      Promise.resolve(actions),
      extend(actions, info)
    );
  },
  // Store functions
  isStore: function(name) {
    this.debug('isStore:', name);
    return this.db.objectStoreNames.contains(name);
  },
  getStore: function(name, mode) {
    this.debug('getStore: ', name, 'mode:', mode);
    return this.db.transaction(name, mode).objectStore(name);
  },
  deleteStore: function(name) {
    this.debug('deleteStore:', name);
    return this.db.deleteObjectStore(name);
  },
  createStore: function(name, key) {
    this.debug('createStore:', name, 'key:', key);
    return this.db.createObjectStore(name, key);
  },
  getStoreList: function() {
    this.debug('getStoreList');
    return this.db.objectStoreNames;
  },
  // Close current storage
  close: function() {
    this.debug('close: ' + this.name);
    this.db.close();
  },
  // Delete current storage
  deleteStorage: function() {
    this.debug('deleteStorage: ' + this.name);
    this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);
      request.onsuccess = e => resolve(true);
      request.onerror = e => reject(e.target.error);
    });
  },
  // Debug storage
  debug: function(...args) {
    if (this.options.debug !== true) return;
    console.info(
      'AppStorage > ' + this.name + '.' + this.lastVersion, ...args
    );
  }
}

/*
  Functions
*/

// Check object type
function isType(obj, type) {
  return Object.prototype.toString.call(obj) === '[object ' + type + ']';
}

// Get object Type
function getType(obj) {
  return Object.prototype.toString.call(obj).split(' ')[1].slice(0, -1);
}

// Extend source object
function extend(src, obj) {
  if (Object.assign) return Object.assign(src, obj);
  for (var prop in obj) src[prop] = obj[prop];
  return src;
}

// Bind event
function newBind(fn, fnNames) {
  fnNames = fnNames || ['onerror', 'onsuccess'];
  return new Promise((resolve, reject) => {
    for (var name of fnNames) {
      if (fn[name] === undefined) continue;
      fn[name] = name == 'onerror' ?
        e => reject(e.target.error) :
          e => resolve(e.target.result);
    }
  });
}

const Port = function() {
  this.eventList = {};
};

Port.prototype = {
  on: function(type, callback) {
    if (!this.eventList.hasOwnProperty(type)) this.eventList[type] = [];
    const events = this.eventList[type];
    if (events.indexOf(callback) !== -1) return;
    events.push(callback);
  },
  send: function(type, data) {
    const events = this.eventList[type];
    if (!events || !events.length) return;
    const details = { port: this, type: type, time: Date.now() };
    for (var evt of events)
      if (typeof evt === 'function') evt.call(this, data, details);
  }
};

// Exports
exports.AppStorage = AppStorage;
