'use strict';

// Find DOM elements
const list = document.querySelector('section > ul');

// Data
const keys = 'abcdefghijklmnopqrstuvwxyz'.split('');
const fns = [
  ['Control', 'control'],
  ['Shift', 'shift'],
  ['Alt (Option)', 'alt'],
  ['Meta (Command)', 'meta']
];
const fonts = [
  ['Georgia', 'Georgia, serif'],
  ['Arial', 'Arial, Helvetica, sans-serif'],
  ['Times New Roman', '\'Times New Roman\', Times, serif'],
  ['Lucida Sans', '\'Lucida Sans Unicode\', \'Lucida Grande\', sans-serif'],
  ['Verdana', 'Verdana, Geneva, sans-serif'],
  ['Comic Sans ;)', '\'Comic Sans MS\', cursive, sans-serif']
];
const models = [
  ['panelWidth', 'number'],
  ['panelHeight', 'number'],
  ['panelPosition', 'select', [
    ['Attach to Button', 'button'],
    ['Center', 'center'],
    ['Top Left', 'top-left'],
    ['Top Right', 'top-right'],
    ['Bottom Left', 'bottom-left'],
    ['Bottom Right', 'bottom-right']
  ]],
  ['font', 'font'],
  ['combo', 'combo'],
  ['panelOnCopy', 'checkbox'],
  ['perUrl', 'checkbox'],
  ['preLoad', 'checkbox'],
  // ['sync', 'checkbox'],
  ['textRTL', 'checkbox'],
  // ['backup', 'a'],
  // ['restore', 'file']
];

// Store DOM elements
const dom = {
  font: [], combo: [], checkbox: [], number: [],
  select: [], button: [], file: [], a: []
};

// Cmd command
const cmd = (name, data) => self.port.emit('cmd', name, data);

// Start build DOM
createDOM();

// Send startup command
cmd('startup');

// Commands
self.port.on('cmd', (name, data) => {
  switch (name) {
    case 'startup':
      // Set preferences values
      const prefs = data.prefs;
      // Split combo string
      const combo = prefs.combo.split('-');
      prefs['combo-mod0'] = combo[0];
      if (combo.length == 2) {
        prefs['combo-mod1'] = '';
        prefs['combo-key'] = combo[1];
      } else {
        prefs['combo-mod1'] = combo[1];
        prefs['combo-key'] = combo[2];
      }
      // Backup link
      // prefs.backup = 'data:text/json;charset=utf-8,' + prefs.syncNotes;
      // Set values
      for (let name in prefs) {
        const item = document.getElementById(name);
        if (!item) continue;
        const value = prefs[name];
        // if (name == 'backup') {
        //   item.href = value;
        //   continue;
        // }
        switch (item.type) {
          case 'color':
          case 'number':
          case 'select-one':
            item.value = value;
          break;
          case 'checkbox':
            item.checked = value;
          break;
        }
      }
    break;
    // case 'restore':
    //   if (data === true) {
    //     alert('Backup successfully loaded.');
    //   } else {
    //     alert('Error loading backup file.');
    //   }
    // break;
  }
});

// Create DOM
function createDOM() {
  for (let index of models) {
    let [name, type, data] = index;
    const
      li = document.createElement('li'),
      head = document.createElement('div'),
      title = document.createElement('div'),
      descr = document.createElement('div'),
      element = document.createElement('div');
    // Head
    head.className = 'head';
    title.className = 'title';
    title.dataset.l10nId = name + '_title';
    descr.className = 'description';
    descr.dataset.l10nId = name + '_description';
    head.appendChild(title);
    head.appendChild(descr);
    li.appendChild(head);
    // Element
    element.className = 'element ' + name + ' ' + type;
    // Types
    if (type == 'combo') {
      // Hotkey elements
      for (let i = 0; i <= 2; i++) {
        let key, select = document.createElement('select');
        if (i <= 1) {
          select.setAttribute('id', 'combo-mod' + i);
          // Generate function keys
          if (i) fns.unshift(['', '']);
          for (key of fns) {
            let [name, value] = key, option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            select.appendChild(option);
          }
        } else {
          select.setAttribute('id', 'combo-key');
          // Generate letters
          for (key of keys) {
            let option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            select.appendChild(option);
          }
        }
        // Add 'plus' symbol
        if (i % 3) {
          let plus = document.createElement('span');
          plus.className = 'plus';
          plus.textContent = '+';
          element.appendChild(plus);
        }
        element.appendChild(select);
        dom[type].push(select);
      }
    } else if (type == 'font') {
      // Font elements
      for (let i = 0; i <= 2; i++) {
        if (i == 0) {
          let div = document.createElement('div'),
            input = document.createElement('input');
          div.className = 'number';
          input.type = 'number';
          input.setAttribute('id', 'textSize');
          div.appendChild(input);
          element.appendChild(div);
          dom[type].push(input);
        } else if (i == 1) {
          let select = document.createElement('select');
          select.setAttribute('id', 'textStyle');
          for (let font of fonts) {
            let option = document.createElement('option');
            option.textContent = font[0];
            option.value = font[1];
            select.appendChild(option);
          }
          element.appendChild(select)
          dom[type].push(select);
        } else {
          let input = document.createElement('input');
          input.type = 'color';
          input.setAttribute('id', 'textColor');
          element.appendChild(input);
          dom[type].push(input);
        }
      }
    } else if (type == 'select') {
      // Normal select element
      let select = document.createElement('select');
      select.setAttribute('id', name);
      for (let item of data) {
        let option = document.createElement('option');
        option.value = item[1];
        option.dataset.l10nId = name + '_options.' + item[0];
        select.appendChild(option);
      }
      element.appendChild(select);
      // Register event
      select.onchange = x => {
        let value = select.options[select.selectedIndex].value;
        cmd('set', [select.id, value]);
      };
      dom[type].push(select);
    } else if (name == 'backup') {
      // Button element
      let a = document.createElement('a');
      a.setAttribute('id', name);
      a.dataset.l10nId = name;
      a.download = 'uNote-backup-' + Date.now() + '.json';
      element.appendChild(a);
      dom[type].push(a);
    } else {
      // Input element
      let input = document.createElement('input');
      input.type = type;
      input.setAttribute('id', name);
      element.appendChild(input);
      if (type == 'checkbox') {
        let label = document.createElement('label');
        label.setAttribute('for', name);
        element.appendChild(label);
      }
      // Register event
      if (type == 'file') {
        input.onchange = x => {
          let reader = new FileReader();
          reader.onload = e => cmd('restore', e.target.result);
          reader.readAsText(input.files[0]);
        }
      } else {
        input.onchange = e => {
          let value;
          if (type == 'checkbox') {
            value = input.checked;
          } else {
            value = parseInt(input.value);
            if (value != input.value) return;
          }
          cmd('set', [input.id, value]);
        };
      }
      dom[type].push(input);
    }
    li.appendChild(element);
    list.appendChild(li);
  }
  // Register combo event
  let lastIndex;
  for (let item of dom.combo) {
    let t = dom.combo;
    item.onchange = e => {
      let s = i => t[i].options[t[i].selectedIndex].value;
      let mod = s(0), mod2 = s(1), key = s(2);
      // Prevent for same key modifiers
      if (lastIndex) t[1].options[lastIndex].style.display = 'block';
      lastIndex = t[0].selectedIndex + 1;
      if (lastIndex === t[1].selectedIndex) mod2 = t[1].value = '';
      t[1].options[lastIndex].style.display = 'none';
      let combo = [mod, mod2, key].filter(i => i.length).join('-');
      cmd('set', ['combo', combo]);
    };
  }
  // Register font event
  for (let item of dom.font) {
    let t = dom.font;
    item.onchange = x => {
      cmd('set', ['textSize', t[0].value]);
      cmd('set', ['textStyle', t[1].options[t[1].selectedIndex].value]);
      cmd('set', ['textColor', t[2].value]);
    };
  }
}
