
var readMarkdown = require('read-markdown')

const fs = require('fs')

data = fs.readFileSync('test.ipynb', 'utf8')
// console.log(data)

var obj = JSON.parse(data)
// console.log(obj)
var cells = obj['cells']
var source = cells[0]['source']
// console.log(source[0])

var i = 0

for (x in cells){
    console.log('---------Cells  ['+x+ ']----------')
    for (y in cells[x]['source']){
        console.log(cells[x]['source'][y])

    }
    

}





