var fs = require('fs')
var PDFDocument = require('pdfkit')
var hocrConv = require('./index.js')

var sample = __dirname + '\\samples\\180_hocr.html'
var output = __dirname + '\\output.pdf'
var image = __dirname + '\\samples\\180.png'

var newFile = new hocrConv(sample)



var options = {
  size: [
    newFile.width,
    newFile.height,
  ],
  margin: 0
}


// var testCoords = [577,1089,644,1516]
// console.log(newFile.width, + ' ' + newFile.height)
console.log(newFile.width, newFile.height)
// console.log(newFile.rotate(testCoords, 180))
var pdfFile = new PDFDocument(options)

var stream = fs.createWriteStream(output)

pdfFile.pipe(stream)
newFile.genWords(pdfFile)
// newFile.overlayImage(pdfFile, image)
newFile.genBounds(pdfFile)

pdfFile.end()
// 115.5 1767.75 139.5 23.25
// 154   2357    340   2388