(function (global, $, MD, doc) {
  'use strict'
  var Md2html = function (options) {
    options = options || {}
    this.parser = new MD()
    // Format: action, elementName + function
    // Get words while typing
    this.eventsMap = {
      'input propertychange, #md-input': 'handleValue',
    }
    // Elements which should be bind as the jquery element
    this.elements = {
      body: 'body',
      md: '#md-input',
      html: '#html-output'
    }
    this.init()
  }

  Md2html.prototype = {
    constructor: Md2html,
    handleValue: function (e) {
      var value = this.md.val()
      this.html.val(this.parser.parse(value))
    },
    _bindElement: function () {
      var elements = this.elements
      // Register all DOM elements as jquery element into instance of Md2html 
      // Visit all DOM elements by jquery
      for (var ele in elements) {
        this[ele] = $(elements[ele])
      }
    },
    _bindEvents: function (reverse) {
      // Build the Regular expression to split the eventsMap
      // Match `eventNames, elementName` : `functionName`
      var reg = /^(.*?),\s*(.*?)$/
      var maps = this.eventsMap
      for (var item in maps) {
        item = item.trim()
        var result = item.match(reg)
        // If reverse, unbind the element; Else, bind the element to the function with its action
        // Format: $(document).(on|off)(eventName, elementName, functionName)
        if (reverse) {
          doc.off(result[1], result[2], this[maps[item]])
        } else {
          doc.on(result[1], result[2], this[maps[item]].bind(this))
        }
      }
    },
    init: function () {
      this._bindElement()
      this._bindEvents()
    }
  }
  // Register the Md2html as global model
  global.Md2html = Md2html
  doc = $(doc)
  // Md2html begins to construct after the DOM tree is built
  doc.ready(function () {
    new Md2html()
  })

})(window, window.jQuery, MD, document)
