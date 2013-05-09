/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Handle UI specifics of message composition. Namely,
 * resetting (auto manages placeholder text), getting
 * message content, and message size
 */
var Compose = (function() {
  var placeholderClass = 'placeholder';

  var attachments = new WeakMap();

  // will be defined in init
  var dom = {
    form: null,
    message: null,
    button: null
  };

  var handlers = {
    input: []
  };

  var state = {
    empty: true,
    maxLength: null,
    lock: false
  };

  // handler for 'input' in contentEditable
  function composeCheck(e) {

    var textLength = dom.message.textContent.length;
    var empty = !textLength;

    if (state.maxLength && textLength >= state.maxLength) {
      state.lock = true;
    }

    if (empty) {
      var brs = dom.message.getElementsByTagName('br');
      var attachment = dom.message.querySelector('iframe');
      // firefox will keep an extra <br> in there
      if (brs.length > 1 || attachment !== null) {
        empty = false;
      }
    }
    var placeholding = dom.message.classList.contains(placeholderClass);
    if (placeholding && !empty) {
      dom.message.classList.remove(placeholderClass);
      compose.disable(false);
      state.empty = false;
    }
    if (!placeholding && empty) {
      dom.message.classList.add(placeholderClass);
      compose.disable(true);
      state.empty = true;
    }

    trigger('input', e);
  }

  function composeLockCheck(e) {
    // if locking and no-backspace pressed, cancel
    if (state.lock && e.which !== 8) {
      e.preventDefault();
    } else {
      state.lock = false;
    }
  }

  function trigger(type) {
    var fns = handlers[type];
    var args = [].slice(arguments, 1);
    if (fns && fns.length) {
      for (var i = 0; i < fns.length; i++) {
        fns[i].apply(this, args);
      }
    }
  }


  function insert(item) {
    var fragment = document.createDocumentFragment();

    if (item.render) { // it's an Attachment
      var node = item.render();
      attachments.set(node, item);
      fragment.appendChild(node);
    } else if (item.tagName === 'IFRAME') {
      // this iframe is generated by us
      fragment.appendChild(item);
    } else if (typeof item === 'string') {
      var container = document.createElement('div');
      container.innerHTML = item;
      [].forEach.call(container.childNodes, function(node) {
        if (node.tagName === 'BR') {
          fragment.appendChild(document.createElement('br'));
        }
        else if (node.nodeType === Node.TEXT_NODE) {
          fragment.appendChild(node);
        }
      });
    }

    return fragment;
  }

  var compose = {
    init: function thui_compose_init(formId) {
      dom.form = document.getElementById(formId);
      dom.message = dom.form.querySelector('[contenteditable]');
      dom.button = dom.form.querySelector('button');

      // update the placeholder after input
      dom.message.addEventListener('input', composeCheck);
      dom.message.addEventListener('keydown', composeLockCheck);

      this.clear();

      return this;
    },

    on: function(type, handler) {
      if (handlers[type]) {
        handlers[type].push(handler);
      }
    },

    getContent: function() {
      var content = [];
      var lastContent = 0;
      var node;
      var i;

      for (node = dom.message.firstChild; node; node = node.nextSibling) {
        // hunt for an attachment in the WeakMap and append it
        var attachment = attachments.get(node);
        if (attachment) {
          lastContent = content.push(attachment);
          continue;
        }

        var last = content.length - 1;
        var text = node.textContent;
        // append (if possible) text to the last entry
        if (text.length && typeof content[last] === 'string') {
          content[last] += text;
        } else {
          // push even if text.length === 0, there could be a <br>
          content.push(text);
        }

        // keep track of the last populated line
        if (text.length > 0) {
          lastContent = content.length;
        }
      }
      // trim away any trailing empty lines
      return content.slice(0, lastContent);
    },

    getText: function() {
      return dom.message.textContent;
    },

    isEmpty: function() {
      return state.empty;
    },

    /** Sets the max number of chars allowed in the compositio area
     * @param {mixed} Number of characters to limit input to
     *                or `false` for no limit.
     */
    setMaxLength: function(amount) {
      state.maxLength = amount;
      state.lock;
      if (this.getText().length >= state.maxLength) {
        state.lock = true;
      }
    },

    disable: function(state) {
      dom.button.disabled = state;
      return this;
    },

    /** Writes node to composition element
     * @param {mixed} item Html, DOMNode, or attachment to add
     *                     to composition element.
     * @param {Boolean} position True to append, false to prepend or
     *                           undefined/null for auto (at cursor).
     */

    prepend: function(item) {
      var fragment = insert(item);

      // If the first element is a <br>, it needs to stay first
      // insert after it but before everyting else
      if (dom.message.firstChild && dom.message.firstChild.nodeName === 'BR') {
        dom.message.insertBefore(fragment, dom.message.childNodes[1]);
      } else {
        dom.message.insertBefore(fragment, dom.message.childNodes[0]);
      }

      composeCheck();
      return this;
    },

    append: function(item) {
      var fragment = insert(item);

      if (document.activeElement === dom.message) {
        var range = window.getSelection().getRangeAt(0);
        var firstNodes = fragment.firstChild;
        range.deleteContents();
        range.insertNode(fragment);
        dom.message.focus();
        range.setStartAfter(firstNodes);
      } else {
        dom.message.appendChild(fragment);
      }
      composeCheck();
      return this;
    },

    clear: function() {
      dom.message.innerHTML = '';
      state.full = false;
      composeCheck();
      return this;
    }

  };
  return compose;
}());
