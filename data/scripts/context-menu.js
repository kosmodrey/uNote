'use strict';

// Send selected text on context menu click
self.on('click', () => {
  const text = window.getSelection().toString();
  self.postMessage(text);
});
