'use strict';

// Find DOM elements
const list = document.querySelector('section > ul');

// Data
const keys = 'abcdefghijklmnopqrstuvwxyz'.split('');
const fns = [
  ['Alt', 'alt'],
  ['Control', 'control'],
  ['Shift', 'shift'],
  ['Meta', 'meta'],
  ['Page Up', 'pageup'],
  ['Page Down', 'pagedown']
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
  ['panelOnInit', 'checkbox'],
  ['sync', 'checkbox'],
];

// Store DOM elements
const dom = { font: [], combo: [], checkbox: [], number: [], select: [] };

// Cmd command
const cmd = (name, data) => self.port.emit('cmd', name, data);

// Send startup command
cmd('startup');

// Start build DOM
createDOM();

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
      // Set values
      for (let name in prefs) {
        const item = document.getElementById(name);
        if (!item) continue;
        const value = prefs[name];
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
        const select = document.createElement('select');
        let key;
        if (i <= 1) {
          select.setAttribute('id', 'combo-mod' + i);
          // Generate function keys
          if (i) fns.unshift(['', '']);
          for (key of fns) {
            const [name, value] = key;
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            select.appendChild(option);
          }
        } else {
          select.setAttribute('id', 'combo-key');
          // Generate letters
          for (key of keys) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            select.appendChild(option);
          }
        }
        // Add 'plus' symbol
        if (i % 3) {
          const plus = document.createElement('span');
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
          const div = document.createElement('div');
          const input = document.createElement('input');
          div.className = 'number';
          input.type = 'number';
          input.setAttribute('id', 'textSize');
          div.appendChild(input);
          element.appendChild(div);
          dom[type].push(input);
        } else if (i == 1) {
          const select = document.createElement('select');
          select.setAttribute('id', 'textStyle');
          for (let font of fonts) {
            const option = document.createElement('option');
            option.textContent = font[0];
            option.value = font[1];
            select.appendChild(option);
          }
          element.appendChild(select)
          dom[type].push(select);
        } else {
          const input = document.createElement('input');
          input.type = 'color';
          input.setAttribute('id', 'textColor');
          element.appendChild(input);
          dom[type].push(input);
        }
      }
    } else if (type == 'select') {
      // Normal select element
      const select = document.createElement('select');
      select.setAttribute('id', name);
      for (let item of data) {
        const option = document.createElement('option');
        option.value = item[1];
        option.dataset.l10nId = name + '_options.' + item[0];
        select.appendChild(option);
      }
      element.appendChild(select);
      // Register event
      select.onchange = x => {
        const value = select.options[select.selectedIndex].value;
        console.log(type, '>', select.id, value);
        cmd('set', [select.id, value]);
      };
      dom[type].push(select);
    } else if (type == 'number' || type == 'checkbox') {
      // Input element
      const input = document.createElement('input');
      input.type = type;
      input.setAttribute('id', name);
      element.appendChild(input);
      if (type == 'checkbox') {
        const label = document.createElement('label');
        label.setAttribute('for', name);
        element.appendChild(label);
      }
      // Register event
      input.onchange = e => {
        let value;
        if (type == 'checkbox') {
          value = input.checked;
        } else {
          value = parseInt(input.value);
          if (value != input.value) return;
        }
        console.log(type, '>', input.id, value);
        cmd('set', [input.id, value]);
      };
      dom[type].push(input);
    }
    li.appendChild(element);
    list.appendChild(li);
  }
  // Register combo event
  let lastIndex;
  for (let item of dom.combo) {
    const t = dom.combo;
    item.onchange = e => {
      const s = i => t[i].options[t[i].selectedIndex].value;
      let mod = s(0), mod2 = s(1), key = s(2);
      // Prevent for same key modifiers
      if (lastIndex) t[1].options[lastIndex].style.display = 'block';
      lastIndex = t[0].selectedIndex + 1;
      if (lastIndex === t[1].selectedIndex) mod2 = t[1].value = '';
      t[1].options[lastIndex].style.display = 'none';
      const combo = [mod, mod2, key].filter(i => i.length).join('-');
      cmd('set', ['combo', combo]);
    };
  }
  // Register font event
  for (let item of dom.font) {
    const t = dom.font;
    item.onchange = x => {
      cmd('set', ['textSize', t[0].value]);
      cmd('set', ['textStyle', t[1].options[t[1].selectedIndex].value]);
      cmd('set', ['textColor', t[2].value]);
    };
  }
}