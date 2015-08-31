var expect = require('chai').expect
var hocrConv = require('../index.js')
var fs = require('fs')

var sample1 = './samples/90_hocr_no_head.html'
var sample2 = './samples/a4landscape.html'
var sample3 = './samples/no_pg_dmns.html'
var no_pg_dmns = '--- Error: No page dimension found in the hocr file'

describe('hocrConv', function() {
  describe('constructor', function() {
    it('should throw an error if no value is passed in', function(){
      expect(function() { new hocrConv() }).to.throw(Error)
    })
    it('should throw an error if passed a string', function() {
      expect(function() { new hocrConv(sample1) }).to.throw(Error)
    })
    // should throw an error if invalid hocr data passed in
    it('should default to 300 dpi if none passed in', function() {
      var hObj = new hocrConv(fs.readFileSync(sample1))
      expect(hObj.dpi).to.equal(300)
    })
    it('should correctly detect rotation', function() {
      var hObj = new hocrConv(fs.readFileSync(sample1))
      expect(hObj.rotation).to.equal(90)
    })
    it('should throw an error if no page dimensions found', function() {
      expect(function() {
        new hocrConv(fs.readFileSync(sample3))
      }).to.throw(no_pg_dmns)
    })
  })
  describe('px2pt', function() {
    it('Should return Point values rounded down to two decimal places', function() {
      var hObj = new hocrConv(fs.readFileSync(sample1))
      expect(hObj.px2pt(2482)).equal(595.68)
    })
  })
  // other tests?
  // .drawParagraphBoxes
  //   returns an array with at least one element in it, an array with 4 elements
  // .drawWordBoxes
  //   returns an array with at least one element in it, an array with 4 elements
  //   somehow gets the textangle correctly if there are no span/ocrx_word elements
  // .getWords
  //   returns an array with at least one element in it, an array with 5 elements
  //   somehow gets the textangle correctly if there are no span/ocrx_word elements
  // bboxPattern gets correct matches against various text?
  //   image ""; bbox 0 0 3510 2482; ppageno 1 = 0,0,3510,2482,0
  //   bbox 166 442 267 2198 = 166,442,267,2198,0
  //   bbox 1929 2482 2206 2482; textangle 90 = 1929,2482,2206,2482,90
  // .rotate
  //   returns same coords if passed 0 or no rotation
  //   returns correctly rotated coords ?
  // .findPageSize
  //   throws an error if no dpi is passed in
  //   returns false if no pagesize found
  //   correctly returns landscape / portrait page sizes
  // .toString
  //   returns full hocr text - currently from body (which will error from no_head)
  // .getElmentText
  //   throws an error if not passed a valid cheerio element
  // .elementCoordinates
  //   returns default values 0,0,0,0,0 if nothing passed
  //   returns an array of 5 ints
  // .cleanUp
  //   throws an error if nothing passed in - if non-string passed in
  //   invalid characters are actually removed from string
  // 
})

