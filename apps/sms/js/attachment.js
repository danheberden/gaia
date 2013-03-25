/** Creates an Attachment object
 * @param {String} type of attachment (image, video, etc).
 * @param {String} uri Location or datauri of image to show.
 * @param {Number} size Size of attachment in bytes.
 * @return {Attachment} new attachment object.
 *
 * The render method creates an iframe to represent the
 * attachment in the message composition area. An iframe
 * is used because Gecko will still try to put the
 * cursor into elements with [contentEditable=false].
 * Instead of a bunch of JavaScript to manage where the
 * caret is and what to delete on backspace, the
 * contentEditable region treats the iframe as a simple
 * block. Win.
 *
 * It uses the main sms.css stylesheet so that styles
 * can be defined in that.
 */

'use strict';

function Attachment(type, uri, size) {
  this.type = type;
  this.uri = uri;
  this.size = size;
}
Attachment.prototype = {
  render: function() {
    var el = document.createElement('iframe');
    var size = Math.floor(this.size / 102.4) / 10 + 'K';
    var origin = location.protocol + '//' + location.hostname;
    el.src = this._template(this.uri, size, origin);
    el.className = 'attachment';
    return el;
  },
  _template: function(uri, size, base) {
    return [
      'data:text/html,',
      '<base href="' + base + '">',
      '<link rel="stylesheet" href="/style/sms.css">',
      '<body class="attachment"><img src="' + uri + '">',
      '<div>' + size + '</div>'
    ].join('');
  }
};
