# hocr2pdf

Takes a hocr file (output from the likes of Tesseract / Omnipage / ABBYY FineReader) and merges with an image to create a searchable PDF file. As of 30/08/2015 it will also take advantage of the textangle value in `ocr_line` class span's when processing to convert words/bbox's to their correct orientation.

I think only newer builds of Tesseract will utilise this correctly, run something like the following to generate a sample hocr file:

````
> tesseract.exe infile.tif outfile -psm 1 hocr
````

Use [pdfkit](http://github.com/devongovett/pdfkit) to draw PDF files.

Utilises [cheerio](https://github.com/cheeriojs/cheerio) for HTML parsing.

```javascript
var fs = require('fs')
var PDFDocument = require('pdfkit')
var sharp = require('sharp') // http://sharp.dimens.io
var hocrConv = require('./index.js')

// Create new hocrConv object with hocr file
var hocrObj = new hocrConv(fs.readFileSync('hocr_output.html'))
var image = fs.readFileSync('image.png')

var options = {
  size: [
    hocrObj.width,
    hocrObj.height,
  ],
  margin: 0  // you want a margin of zero
}

//start a new PDF doc
var doc = new PDFDocument(options)
var stream = fs.createWriteStream('output.pdf')
doc.pipe(stream)

// Open up the image file in sharp
sharp(fs.readFileSync(imageFile)).rotate(newFile.rotation).toBuffer(function(err, data, info) {
  if (err) { throw err }

  // this allows doing manipulations of the image before inserting it into the PDF document

  // generate the words
  var words = hocrObj.getWords()
  for (var x = 0; x < words.length; x++) {
    // use height of bbox
    hocrObj.fontSize(words[x][3])
    hocrObj.font('Helvetica')
    hocrObj.fillColor('black')
    hocrObj.text(words[x][4], words[x][0], words[x][1]), {
      width: words[x][2],
      height: words[x][3],
      aligh: 'centre'
    }
  }
  
  // optional: draw bounding boxes around paragraphs and/or words
  var wordboxes = newFile.drawWordBoxes()
  for (var w = 0; w < wordboxes.length; w++) {
    pdfFile.rect(wordboxes[w][0],wordboxes[w][1],
                wordboxes[w][2],wordboxes[w][3])
          .strokeColor('#ADD8E6')
          .fillColor('#ADD8E6')
          .lineWidth(0)
          .fillOpacity(1)
          .stroke()
  }
  
  var paraboxes = newFile.drawParagraphBoxes()
  for (var p = 0; p < paraboxes.length; p++) {
    pdfFile.rect(paraboxes[p][0],paraboxes[p][1],
                paraboxes[p][2],paraboxes[p][3])
          .strokeColor('#90EE90')
          .lineWidth(0.5)
          .fillColor('#90EE90')
          .fillOpacity(0.5)
          .dash(6, {space: 3})
          .stroke()
  }
  
  pdfFile.image(data, 0, 0, {
    fit: [newFile.width, newFile.height]
  })
  
  // finalise the PDF
  doc.end()

})
//thats it.
```

Note that the PDF canvas creates a new layer every time you draw / write / insert an image. So the order you do it in matters.

Oh, and:
```javascript
var dpi_of_original_image = 300

hocrObj.findPageSize(dpi_of_original_image)
// will return an array with width, height, name & orientation of page size
// ie [595, 842, 'A4', 'Portrait']

console.log(hocrObj.rotation) // detected rotation
console.log(hocrObj.dmns) // raw dimensions array from searching hocr file
console.log(hocrObj.width)
console.log(hocrObj.height)
console.log(hocrObj.hocr) // cheerio object for doing DOM traversal etc.

```

Yeah I'm not sure what I needed that for (`findPageSize`). It might come in handy later?
