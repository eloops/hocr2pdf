var fs = require('fs')
var PDFDocument = require('pdfkit')
var hocrConv = require('./index.js')
var sharp = require('sharp')

var sample = __dirname + '\\samples\\90_hocr_no_head.html'
var output = __dirname + '\\output.pdf'
var imageFile = 'E:\\node\\hocr2pdf\\samples\\90.png'

var newFile = new hocrConv(fs.readFileSync(sample))

var options = {
  size: [
    newFile.width,
    newFile.height,
  ],
  margin: 0
}

console.log(newFile.width, newFile.height)

var pdfFile = new PDFDocument(options)
var stream = fs.createWriteStream(output)
pdfFile.pipe(stream)

sharp(fs.readFileSync(imageFile))
  .rotate(newFile.rotation)
  .toBuffer(function(err, data, info) {
    if (err) { throw err }
  
    console.log(newFile.wordStr())
    // var words = newFile.getWords()
    // for (var x = 0; x < words.length; x++) {
    //   // use height of bbox
    //   pdfFile.fontSize(words[x][3])
    //   pdfFile.font('Helvetica')
    //   pdfFile.fillColor('black')
    //   pdfFile.text(words[x][4], words[x][0], words[x][1]), {
    //     width: words[x][2],
    //     height: words[x][3],
    //     aligh: 'centre'
    //   }
    // }
    
    // var paraboxes = newFile.drawParagraphBoxes()
    // var wordboxes = newFile.drawWordBoxes()
    // 
    // for (var w = 0; w < wordboxes.length; w++) {
    //   pdfFile.rect(wordboxes[w][0],wordboxes[w][1],
    //               wordboxes[w][2],wordboxes[w][3])
    //          .strokeColor('#ADD8E6')
    //          .fillColor('#ADD8E6')
    //          .lineWidth(0)
    //          .fillOpacity(1)
    //          .stroke()
    // }
    // for (var p = 0; p < paraboxes.length; p++) {
    //   pdfFile.rect(paraboxes[p][0],paraboxes[p][1],
    //               paraboxes[p][2],paraboxes[p][3])
    //          .strokeColor('#90EE90')
    //          .lineWidth(0.5)
    //          .fillColor('#90EE90')
    //          .fillOpacity(0.5)
    //          .dash(6, {space: 3})
    //          .stroke()
    // }
    
    pdfFile.image(data, 0, 0, {
      fit: [newFile.width, newFile.height]
    })
    
    pdfFile.end()
  }
)
