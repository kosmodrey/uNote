'use strict';

// Send selected text on click
self.on('click', () => {
  let text = window.getSelection().toString();
  self.postMessage(text);
});
