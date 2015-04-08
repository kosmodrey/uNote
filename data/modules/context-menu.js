'use strict';

// Send selected text on context menu click
self.on('click', x => {
  const text = window.getSelection().toString();
  self.postMessage(text);
});
