$(document).ready(function () {
  $('.menu .item').tab()

  $('#viewFile').click(function (){
    let rdr = new FileReader()
    rdr.onload = function(e) {
      let theRows = e.target.result.split('\n')
      for (let row in theRows) {
        let newRow = '<tr>'
        let columns = theRows[row].split(',')
        let colCount = columns.length

        for (let field in columns) {
          if (columns[field] === '') {
            if (field === 4) {
              newRow += '<td class=\'incorrect\'>Data Lost!</td></tr>'
            } else {
              newRow += '<td class=\'incorrect\'>Data Lost!</td>'
            }
          } else if (field === 4) {
            newRow += '<td>' + columns[field] + '</td></tr>'
          } else {
            newRow += '<td>' + columns[field] + '</td>'
          }
        }
        $('#totalScoreTable').append(newRow);
      }
    }
    console.log('$(\'#inputFile\')[0], ', $('#inputFile')[0])
    rdr.readAsText($('#inputFile')[0].files[0])
  })
})

function saveTotalScores (totalScores) {

}
