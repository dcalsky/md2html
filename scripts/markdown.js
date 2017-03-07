(function (global, $, doc) {
  'use strict'
  // Markdown regular expression with the *priority*
  // todo: use array
  var mdReg = {
    heading: /^\s*(#{1,6})\s+(.*?)\n*$/,
    strong: /\*{2}([\S]+)\*{2}/,
    emphasis: /\*{1}([\S]+)\*{1}/,
    code: /\`{1}(.*)\`{1}/,
    // paragraph: /\n*(.*)/,
  }
  var type = {
    block: ['heading'],
    inline: ['strong', 'emphasis', 'code']
  }

  var htmlTemplate = {
    heading: '<h{level}>{text}</h{level}>',
    strong: '<b>{text}</b>',
    emphasis: '<i>{text}</i>',
    code: '<code>{text}</code>',
    paragraph: '<p>{text}</p>',
  }

  var attrFunctions = {
    level: function (level) {
      return level.length
    },
  }
  var limitations = {
    heading: {
      allow: true,
      content: ['code', 'strong', 'strike', 'emphasis'],
    },
    code: {
      allow: false,
      content: ['code']
    }
  }
  var utils = {
    // Default: a2 ∈ a1
    // Simple difference function
    difference: function (a1, a2) {
      return a1.filter(function (i) {
        return a2.indexOf(i) < 0
      })
    }
  }
  var MD = function (options) {
    options = options || {}
    this.src = null
    this.output = null
    this.currentLimitations = []
    this.init()
  }

  MD.prototype = {
    constructor: MD,
    // According to *limitations*, return the all unavailable rules
    _getMdLimitation: function (item) {
      var limitation = limitations[item]
      if (!limitation) return []
      return limitation.allow ? utils.difference(Object.keys(mdReg), limitation.content) : limitation.content
    },
    // Core function to fill content of the html element template
    // @args: Get all arguments from block handler or inline hanlder without item name
    // @attrs: Get all propertys of block display type element
    // @text: It's the *next* in block hanlder or inline handler. It will be filled into html template as content
    // @reg: Important regular expression for parsing the opening data of htmlTemplates
    _formatTemplate: function (item) {
      // Create a simple regular expression for this template
      // Format: {propertyName}
      // Get the function to handle attr
      var args = Array.prototype.slice.call(arguments, 1),
        len = args.length

      var attrs = args.slice(0, len - 1),
        text = args[len - 1]

      var reg = /\{(\w+)\}/g,
        obj = {},
        index = 0,
        template = htmlTemplate[item]

      return template.replace(reg, function (_, attr) {
        if (attr === 'text') return text
        if (attr in obj) return obj[attr]
        var attrFunc = attrFunctions[attr]
        var val = attrFunc instanceof Function ? attrFunc(attrs[index]) : attrs[index]
        obj[attr] = val
        index++
        return val
      })
    },
    // The block display type element hanlder
    // Block element can be split as two parts: *attributes* and *next*
    // @Attributes(attrs): propertys of the element, like <h{1}>, <h{2}>, they have a number to distinguish elements of the same class
    // @next: Inline handler also has this parts. To ensure the content of this element has no more markdown text can be parsed, \
    // we need to scan it again (using scanMD function).
    // Finally, send them all to the turn of template format
    _handleBlock: function (judge, item) {
      var len = judge.length
      var attrs = judge.slice(1, len - 1),
        nextMD = judge[len - 1]
      var next = this._scanMD(nextMD)
      return this._formatTemplate(item, attrs, next)
    },
    // As same as block hanlder, just lacking of the attributes part. Usually, attrs part is not must in inline elements 
    // @next: As same as the *next* property of the block hanlder
    _handleInline: function (src, reg, item) {
      return src.replace(reg, function (_, attr) {
        var next = this._scanMD(attr)
        return this._formatTemplate(item, next)
      }.bind(this))
    },
    // Scan one line markdown text
    // Firstly, match the markdown text by every exist regular expressions
    // If matched, judge the element display type like: "block" or "inline"
    // Then send it to the turn of special handler
    // Finally, if no regular expression matches this line, just return itself
    _scanMD: function (src) {
      for (var item in mdReg) {
        if (this.currentLimitations.indexOf(item) > -1) continue
        var isBlock = type['block'].indexOf(item) > -1
        var reg = isBlock ? mdReg[item] : new RegExp(mdReg[item], 'g')
        var judge = src.match(reg)
        if (!judge) continue
        // Match successfully
        // Add limitation into current limitations
        this.currentLimitations = this.currentLimitations.concat(this._getMdLimitation(item))
        var result = isBlock ? this._handleBlock(judge, item) : this._handleInline(src, reg, item)
        return result
      }
      // Match unsuccessfully
      return src
    },
    // Input whole markdown text. todo: should use increment mode
    // Split text by line feed char
    parse: function (src) {
      if (!src) return ''
      var output = ''
      var lines = src.split(/\n/)
      lines.map(function (line) {
        this.currentLimitations = []
        output += this._scanMD(line)
      }.bind(this))
      return output
    },
    init: function () {
      // Do some test!
    }
  }
  global.MD = MD

})(window, window.jQuery, document)
