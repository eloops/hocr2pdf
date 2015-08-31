# hocr2pdf

Takes a hocr file (output from the likes of Tesseract / Omnipage / ABBYY FineReader) and merges with an image to create a searchable PDF file. As of 30/08/2015 it will also take advantage of the textangle value in `ocr_line` class span's when processing to convert words/bbox's to their correct orientation.

I think only newer builds of Tesseract will utilise this correctly, run something like the following to generate a sample hocr file:

````
> tesseract.exe infile.tif outfile -psm 1 hocr
````

Utilises [pdfkit](http://github.com/devongovett/pdfkit) for PDF drawing and [cheerio](https://github.com/cheeriojs/cheerio) for HTML parsing.

```javascript
var fs = require('fs')
var PDFDocument = require('pdfkit')
var hocrConv = require('./index.js')

// Create new hocrConv object with hocr file
var hocrObj = new hocrConv('hocr_output.html')

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

// generate the words
hocrObj.genWords(doc)

//overlay the image - pdfkit only supports PNG & JPEG
//note you may have to check if it's rotated & rotate the image using an image library
hocrObj.overlayImage(doc, 'imagefile.png')

// optional: draw bounding boxes around paragraphs & words
hocrObj.genBounds(doc)

// finalise the PDF
doc.end()

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
