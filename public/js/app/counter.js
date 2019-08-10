$(document).ready(function () {
  $('.menu .item').tab()
  $('#previousData').val('[]')

  $('#viewFile').click(function (){
    let rdr = new FileReader()
    $('#totalScoreTable').empty()
    rdr.onload = function(e) {
      let theRows = e.target.result.split('\n')
      let totalScores = {}
      let colCount = 0
      for (let row in theRows) {
        row = parseInt(row)
        let newRow = '<tr>'
        let columns = theRows[row].split(',')
        if (!row) {
          newRow = '<thead><tr class=\'tableHeader\'>'
          colCount = columns.length
        } else {
          if (columns[0] !== '' && columns[columns.length - 1] !== '') {
            try {
              totalScores[columns[0]] = parseFloat(columns[columns.length - 1])
            } catch (err) {
              console.log('Error, the total score is not number!')
            }
          }
        }

        for (let field in columns) {
          if (columns.length !== colCount) {

          } else if (!row) {
            if (columns[field] === '') {
              newRow += '<th class=\'incorrect\'>Data Lost!</th>'
            } else {
              newRow += '<th>' + columns[field] + '</th>'
            }
          } else {
            if (columns[field] === '') {
              newRow += '<td class=\'incorrect\'>Data Lost!</td>'
            } else {
              newRow += '<td>' + columns[field] + '</td>'
            }
          }

          if (field === colCount) {
            newRow += '</tr>'
            if (!row) {
              newRow += '</thead>'
            }
            break
          }
        }
        $('#totalScoreTable').append(newRow);
      }
      console.log('totalScores, ', totalScores)
      $('#updateTotalScores').attr('onclick', 'onClickUpdateTotalScoresBtn('+JSON.stringify(totalScores)+')')
    }
    console.log('$(\'#inputFile\')[0], ', $('#inputFile')[0])
    rdr.readAsText($('#inputFile')[0].files[0])
  })
})

function onClickUpdateTotalScoresBtn (totalScores) {
  console.log('Click Total Scores Btn!!, ', totalScores)
  totalScores = {totalScores: totalScores}
  $.ajax({
    url: '/dataService/updateTotalScoreAllStudent',
    type: 'put',
    data: totalScores,
    success: function(data){
      let status = data.status
      alert(status)
    }
  })
}
