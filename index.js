var fs = require('fs')
var $ = require('cheerio')
var paperSizes = require('./papersizes.js')

var boxPattern = /(\d+)\s(\d+)\s(\d+)\s(\d+).{0,12}(\d{0,3})/
var inch = 72

function hocrConv(hocrFile, dpi) {  

  hocrConv.prototype.px2pt = function(pxl) {
    var point = parseFloat(pxl * (inch / this.dpi))
    return +(Math.round(point + "e+2") + "e-2")
  }

  hocrConv.prototype.wordStr = function() {
    var self = this
    var wordString = ''

    // sanity check: if there's no span/ocrx_word elements, we'll use the span/ocr_line elements
    if (self.hocr('span').hasClass('ocrx_word')) {
      var elemclass = 'ocrx_word'
    } else {
      var elemclass = 'ocr_line'
    }

    // iterate through span elements
    self.hocr('span').map(function(i, ocr_words) {
      var words = ''
      var tClass = $(this).attr('class')
      // only use it if it's what we want
      if ( elemclass === tClass) {
        words = self.cleanUp($(this).text())
        words = words.replace(/\r?\n|\r/g, ' ')
      }
      
      // if there are words to be drawn, draw them.
      if (words) {
        wordString += words + ' '
      }
    })
    return wordString
  }

  hocrConv.prototype.rotate = function(coords, rotation) {
    var self = this
    var rotCoords = [0,0,0,0,0]
    if (coords.length !== 5 || !rotation) {
      return coords
    }

    var pWidth = this.dmns[3] - this.dmns[1]
    var pHeight = this.dmns[4] - this.dmns[2]

    if (rotation == 90) {
      rotCoords = [pHeight - coords[3], coords[0], pHeight - coords[1], coords[2], 90]
    } else if (rotation == 180) {
      rotCoords = [pWidth - coords[2], pHeight - coords[3], pWidth - coords[0], pHeight - coords[1], 180]
    } else if (rotation == 270) {
      rotCoords = [coords[1], pWidth - coords[2], coords[3], pWidth - coords[0], 270]
    } else {
      rotCoords = [coords[0],coords[1],coords[2],coords[3],0]
    }
    return rotCoords
  }
  
  hocrConv.prototype.findPageSize = function(dpi) {
    var self = this
    var bestGuess = [0, 0, '', '']

    for (key in paperSizes) {
      if (Math.abs(paperSizes[key][0] - self.width) < 4
        && Math.abs(paperSizes[key][1] - self.height) < 4) {
        bestGuess[0] = paperSizes[key][0]
        bestGuess[1] = paperSizes[key][1]
        bestGuess[2] = key
        bestGuess[3] = 'Portrait'
      }
      if (Math.abs(paperSizes[key][0] - self.height) < 4
        && Math.abs(paperSizes[key][1] - self.width) < 4) {
        bestGuess[0] = paperSizes[key][1]
        bestGuess[1] = paperSizes[key][0]
        bestGuess[2] = key
        bestGuess[3] = 'Landscape'
      }
    }
    if (!bestGuess[2]) {
      return false
    } else {
      return bestGuess
    }
  }
  
  hocrConv.prototype.string = function() {
    var self = this
    if (!self.hocr) {
      return ''
    }
    var body = self.hocr('body')
    if (body) {
      return self.getElementText(body)
    } else {
      return ''
    }
  }
  
  hocrConv.prototype.getElementText = function(element) {
    var text = ''
    if (element.text()) {
      text = text + element.text()
    }
    return text
  }
  
  hocrConv.prototype.elementCoordinates = function(element) {
    var out = [0,0,0,0,0]
    if (element.attr('title')) {
      var coords = element.attr('title').match(boxPattern)
      out = [parseInt(coords[1]),parseInt(coords[2]),parseInt(coords[3]),parseInt(coords[4])]
      // grab the rotation if it is detected
      out[4] = (coords[5]) ? coords[5] : 0
    }
    return out
  }
  
  hocrConv.prototype.cleanUp = function(inpStr) {
    inpStr = inpStr.replace(/\s*$/, '')
    inpStr = inpStr.replace(/\uFB01/g, '')
    inpStr = inpStr.replace(/\uFB02/g, '')
    return inpStr
  }
  
  hocrConv.prototype.drawParagraphBoxes = function() {
    var self = this
    var bboxes = []

    // iterate through paragraphs & draw paragraph bounding boxes if enabled
    self.hocr('p').map(function(i, ocr_par) {
      var isPara = false
      var tClass = $(this).attr('class')
      if ( 'ocr_par' === tClass) {
        isPara = true
      }
      
      // note textangle is on span/ocr_line, which is a child of span/ocr_par 
      var rot = self.elementCoordinates($(this).children('.ocr_line'))[4]
      var pCoords = self.elementCoordinates($(this))
      pCoords = self.rotate(pCoords, rot)
      var px1 = self.px2pt(pCoords[0])
      var py1 = self.px2pt(pCoords[1])
      var px2 = self.px2pt(pCoords[2] - pCoords[0])
      var py2 = self.px2pt(pCoords[3] - pCoords[1])

      if (isPara) {
        bboxes.push([px1,py1,px2,py2])
      }
      
    })
    return bboxes
  }
  
  hocrConv.prototype.drawWordBoxes = function() {
    var self = this
    var bboxes = []

    // sanity check: if there's no span/ocrx_word elements, we'll use the span/ocr_line elements
    if (self.hocr('span').hasClass('ocrx_word')) {
      var elemclass = 'ocrx_word'
    } else {
      var elemclass = 'ocr_line'
    }

    // iterate through span elements
    self.hocr('span').map(function(i, ocr_words) {
      var isWord = false
      var tClass = $(this).attr('class')
      // only use it if it's what we want
      if ( elemclass === tClass) {
        isWord = true
      }

      // note textangle is on span/ocr_line, which is a parent of span/ocrx_word
      var rot = self.elementCoordinates($(this).parent('.ocr_line'))[4]
      var wCoords = self.elementCoordinates($(this))
      wCoords = self.rotate(wCoords, rot)
      
      var wx1 = self.px2pt(wCoords[0])
      var wy1 = self.px2pt(wCoords[1])
      var wx2 = self.px2pt(wCoords[2] - wCoords[0])
      var wy2 = self.px2pt(wCoords[3] - wCoords[1])
     
      if (isWord) {
        bboxes.push([wx1,wy1,wx2,wy2])
      }
      
    })
    return bboxes
  }
  
  hocrConv.prototype.getWords = function() {
    var self = this
    var bboxes = []

    // sanity check: if there's no span/ocrx_word elements, we'll use the span/ocr_line elements
    if (self.hocr('span').hasClass('ocrx_word')) {
      var elemclass = 'ocrx_word'
    } else {
      var elemclass = 'ocr_line'
    }

    // iterate through span elements
    self.hocr('span').map(function(i, ocr_words) {
      var words = ''
      var tClass = $(this).attr('class')
      // only use it if it's what we want
      if ( elemclass === tClass) {
        words = self.cleanUp($(this).text())
      }

      // grab the co-ordinates from the title attribute, check rotation
      var rot = self.elementCoordinates($(this).parent('.ocr_line'))[4]
      var wCoords = self.elementCoordinates($(this))
      wCoords = self.rotate(wCoords, rot)

      var wx1 = self.px2pt(wCoords[0])
      var wy1 = self.px2pt(wCoords[1])
      var wx2 = self.px2pt(wCoords[2] - wCoords[0])
      var wy2 = self.px2pt(wCoords[3] - wCoords[1])
      
      // if there are words to be drawn, draw them.
      if (words) {
        bboxes.push([wx1,wy1,wx2,wy2,words])
      }
    })
    return bboxes
  }

  // init vars
  this.rotation = 0
  this.dpi = (!dpi) ? 300 : dpi // default 300 dpi
  this.width = 0
  this.height = 0
  
  // read in the given hocr file
  // this.htmlString = fs.readFileSync(hocrFile).toString()
  this.hocr = $.load(hocrFile.toString())
  
  // find the overall rotation of the doc as reported by tesseract
  var countOrients = [0,0,90,0,180,0,270,0]
  this.hocr('.ocr_line').map(function(i, ocr_lines) {
    // [0, 90, 180, 270]
    var coords = $(this).attr('title').match(boxPattern)
    if (coords[5] === '90') {
      countOrients[3] += 1
    } else if (coords[5] === '180') {
      countOrients[5] += 1
    } else if (coords[5] === '270') {
      countOrients[7] += 1
    } else {
      countOrients[1] += 1
    }
  })

  var count = 0
  for (var a = 1; a <= countOrients.length; a++) {
    if (countOrients[a] > count) {
      count = countOrients[a]
      this.rotation = countOrients[a-1]
    }
    a++
  }

  // grab basic dimensions from hocr file
  this.dmns = this.hocr('.ocr_page')
    .attr('title')
    .match(boxPattern)

  // translate to rotated, correct page dimensions
  if (this.rotation === 90 || this.rotation === 270) {
    this.width = this.px2pt(this.dmns[4] - this.dmns[2])
    this.height = this.px2pt(this.dmns[3] - this.dmns[1])
  } else {
    this.width = this.px2pt(this.dmns[3] - this.dmns[1])
    this.height = this.px2pt(this.dmns[4] - this.dmns[2])
  }
  
  if (this.width === 0) {
    throw new Error('--- Error: No page dimension found in the hocr file')
  }
}

module.exports = hocrConv
