(function (global, $, doc) {
  'use strict'
  // Markdown regular expression with the *priority*
  // todo: use array
  var mdReg = {
    heading: /^\s*(#{1,6})\s+(.*?)\n*$/,
    strong: /\*{2}(.*?)\*{2}/,
    emphasis: /\*{1}(.*?)\*{1}/,
    paragraph: '/[\S]*$/'
    // paragraph: /^\n*(.*)$/,
  }
  var type = {
    block: ['heading'],
    inline: ['strong']
  }

  var htmlTemplate = {
    heading: '<h{level}>{text}</h{level}>\n',
    strong: '<b>{text}</b>',
    emphasis: '<i>{text}</i>',
    code: '<pre><code>{text}</code></pre>',
    paragraph: '<p>{text}</p>\n',
  }

  var attrFunctions = {
    level: function (level) {
      return level.length
    },
  }
  var limitations = {
    heading: {
      allow: true,
      content: ['code', 'strong', 'strike', 'emphasis']
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
    _getMdLimitation: function (item) {
      var limitation = limitations[item]
      if (!limitation) return []
      return limitation.allow ? utils.difference(Object.keys(mdReg), limitation.content) : limitation.content
    },
    _formatTemplate: function (item) {
      // Create a simple regular expression for this template
      // Format: {propertyName}
      // Get the function to handle attr
      var attrs = Array.prototype.slice.call(arguments, 1)
      var reg = /\{(\w+)\}/g,
        obj = {},
        index = 0,
        template = htmlTemplate[item]
      return template.replace(reg, function (_, attr) {
        if (attr in obj) return obj[attr]
        var attrFunc = attrFunctions[attr]
        var val = attrFunc instanceof Function ? attrFunc(attrs[index]) : attrs[index] 
        obj[attr] = val
        index++
        return val
      })
    },
    _handleBlock: function (src, reg, item) {
      var result = src.match(reg)
      if (result instanceof Array) {
        var tag = result[1],
          next = result[2]
        this.currentLimitations = this.currentLimitations.concat(this._getMdLimitation(item))
        return this._formatTemplate(item, tag, this._scanMD(next))
      }
      return false
    },
    _handleInline: function (src, reg, item) {
      return src.replace(reg, function (_, attr) {
        return this._formatTemplate(item, attr)
      }.bind(this))
    },
    _scanMD: function (src) {
      for (var item in mdReg) {
        if (this.currentLimitation.indexOf(item) > -1) continue
        var reg
        // Match successfully
        if (type['block'].indexOf(item) > -1) {
          reg = mdReg[item]
          var result = this._handleBlock(src, reg, item)
          if (result) {
            return result
          }
        } else {
          reg = new RegExp(mdReg[item], 'g')
          return this._handleInline(src, reg, item)
        }
      }
      // Match unsuccessfully
      return src
    },
    parse: function (src) {
      if (!src) return ''
      var output
      var lines = src.split(/\n/)
      lines.map(function (line) {
        this.currentLimitation = []
        output += this._scanMD(line)
      }.bind(this))
      return output
    },
    init: function () {

    }

  }

  global.MD = MD

})(window, window.jQuery, document)
