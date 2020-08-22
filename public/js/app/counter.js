$(document).ready(function () {
  $('.menu .item').tab()
  $('#previousData').val('[]')

  $('#viewFile').click(function (){
    let rdr = new FileReader()
    $('#totalScoreTable').empty()
    rdr.onload = function(e) {
      let theRows = e.target.result.split('\n')
      console.log('theRows, ', theRows)
      for (let columns in theRows) {
        console.log('before, ', theRows[columns])
        theRows[columns] = theRows[columns].replace(/"/g, '')
        console.log('after, ', theRows[columns])
      }
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
              newRow += '<td class=\'' + columns[field] + ' incorrect\'>Data Lost!</td>'
            } else {
              newRow += '<td class=\'' + columns[field] + '\' >' + columns[field] + '</td>'
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
      // console.log('totalScores, ', totalScores)
      $('#updateTotalScores').attr('onclick', 'onClickUpdateTotalScoresBtn('+JSON.stringify(totalScores)+')')
    }
    console.log('$(\'#inputFile\')[0], ', $('#inputFile')[0])
    rdr.readAsText($('#inputFile')[0].files[0])
  })
})

function onClickUpdateTotalScoresBtn (totalScores) {
  // console.log('Click Total Scores Btn!!, ', totalScores)
  totalScores = {totalScores: totalScores}
  $.ajax({
    url: '/dataService/updateTotalScoreAllStudent',
    type: 'put',
    data: totalScores,
    success: function(data){
      let status = data.status
      let failure = data.failure
      console.log('Failure, ', failure)
      for (let clss in failure) {
        console.log('Clss, ', clss)
        $('.' + clss).attr({
          class: clss + ' incorrect',
          ["data-tooltip"]: 'Cannot update total score because the username is incorrect.'
        })
      }
      alert(status)
    }
  })
}

function onClickViewDataButton(name) {
  $('tbody').remove(".tbd-exporting")
  if (name === "comment") {
    getComments()
  } else if (name === "history") {
    getHistories()
  } else if (name === "message") {
    getMessages()
  } else if (name === "project") {
    getProjects()
  } else if (name === "score") {
    getScores()
  } else if (name === "user") {
    getUsers()
  }
}

function setViewDataButton (e) {
  console.log(e.attr("id"))
  let splitId = e.attr("id").split('-')
  let name = splitId[0]

  $('#view-data').attr({
    onclick: `onClickViewDataButton(\"${name}\")`
  })
}

function getComments() {
  $.ajax({
    url: '/dataService/getcomments',
    type: 'get',
    data: {},
    success: function(data) {
      let comments = data.comments
      let table = $("<table class=\"gridtable\"></table>")
      for (let index1 in comments) {
        if (!parseInt(index1)) {
          let thead = $("<thead></thead>")
          let tr = $("<tr></tr>")
          let subArray = comments[index1]
          for (let index2 in subArray) {
            let th = $(`<th>${subArray[index2]}</th>`)
            tr.append(th)
          }
          thead.append(tr)
          table.append(thead)
        } else {
          let tbody = $("<tbody class=\"tbd-exporting\"></tbody>")
          let tr = $("<tr></tr>")
          let subArray = comments[index1]
          for (let index2 in subArray) {
            let th = $(`<td>${subArray[index2]}</td>`)
            tr.append(th)
          }
          tbody.append(tr)
          table.append(tbody)
        }
      }
      $("#comment-table").empty()
      $("#comment-table").append(table)
      $("#exportCsvFile").attr({
        onclick: `downloadCsvFile(${JSON.stringify(comments)}, "comments")`
      })
    }
  })
}

function getHistories() {
  $.ajax({
    url: '/dataService/gethistories',
    type: 'get',
    data: {},
    success: function(data) {
      let histories = data.histories
      let table = $("<table class=\"gridtable\"></table>")
      for (let index1 in histories) {
        if (!parseInt(index1)) {
          let thead = $("<thead></thead>")
          let tr = $("<tr></tr>")
          let subArray = histories[index1]
          for (let index2 in subArray) {
            let th = $(`<th>${subArray[index2]}</th>`)
            tr.append(th)
          }
          thead.append(tr)
          table.append(thead)
        } else {
          let tbody = $("<tbody class=\"tbd-exporting\"></tbody>")
          let tr = $("<tr></tr>")
          let subArray = histories[index1]
          for (let index2 in subArray) {
            let th = $(`<td>${subArray[index2]}</td>`)
            tr.append(th)
          }
          tbody.append(tr)
          table.append(tbody)
        }
      }
      $("#history-table").empty()
      $("#history-table").append(table)
      $("#exportCsvFile").attr({
        onclick: `downloadCsvFile(${JSON.stringify(histories)}, "histories")`
      })
    }
  })
}

function getMessages() {
  $.ajax({
    url: '/dataService/getmessages',
    type: 'get',
    data: {},
    success: function(data) {
      let messages = data.messages
      let table = $("<table class=\"gridtable\"></table>")
      for (let index1 in messages) {
        if (!parseInt(index1)) {
          let thead = $("<thead></thead>")
          let tr = $("<tr></tr>")
          let subArray = messages[index1]
          for (let index2 in subArray) {
            let th = $(`<th>${subArray[index2]}</th>`)
            tr.append(th)
          }
          thead.append(tr)
          table.append(thead)
        } else {
          let tbody = $("<tbody class=\"tbd-exporting\"></tbody>")
          let tr = $("<tr></tr>")
          let subArray = messages[index1]
          for (let index2 in subArray) {
            let th = $(`<td>${subArray[index2]}</td>`)
            tr.append(th)
          }
          tbody.append(tr)
          table.append(tbody)
        }
      }
      $("#message-table").empty()
      $("#message-table").append(table)
      $("#exportCsvFile").attr({
        onclick: `downloadCsvFile(${JSON.stringify(messages)}, "messages")`
      })
    }
  })
}

function getProjects() {
  $.ajax({
    url: '/dataService/getprojects',
    type: 'get',
    data: {},
    success: function(data) {
      let projects = data.projects
      let table = $("<table class=\"gridtable\"></table>")
      for (let index1 in projects) {
        if (!parseInt(index1)) {
          let thead = $("<thead></thead>")
          let tr = $("<tr></tr>")
          let subArray = projects[index1]
          for (let index2 in subArray) {
            let th = $(`<th>${subArray[index2]}</th>`)
            tr.append(th)
          }
          thead.append(tr)
          table.append(thead)
        } else {
          let tbody = $("<tbody class=\"tbd-exporting\"></tbody>")
          let tr = $("<tr></tr>")
          let subArray = projects[index1]
          for (let index2 in subArray) {
            let th = $(`<td>${subArray[index2]}</td>`)
            tr.append(th)
          }
          tbody.append(tr)
          table.append(tbody)
        }
      }
      $("#project-table").empty()
      $("#project-table").append(table)
      $("#exportCsvFile").attr({
        onclick: `downloadCsvFile(${JSON.stringify(projects)}, "projects")`
      })
    }
  })
}

function getScores() {
  $.ajax({
    url: '/dataService/getscores',
    type: 'get',
    data: {},
    success: function(data) {
      let scores = data.scores
      let table = $("<table class=\"gridtable\"></table>")
      for (let index1 in scores) {
        if (!parseInt(index1)) {
          let thead = $("<thead></thead>")
          let tr = $("<tr></tr>")
          let subArray = scores[index1]
          for (let index2 in subArray) {
            let th = $(`<th>${subArray[index2]}</th>`)
            tr.append(th)
          }
          thead.append(tr)
          table.append(thead)
        } else {
          let tbody = $("<tbody class=\"tbd-exporting\"></tbody>")
          let tr = $("<tr></tr>")
          let subArray = scores[index1]
          for (let index2 in subArray) {
            let th = $(`<td>${subArray[index2]}</td>`)
            tr.append(th)
          }
          tbody.append(tr)
          table.append(tbody)
        }
      }
      $("#score-table").empty()
      $("#score-table").append(table)
      $("#exportCsvFile").attr({
        onclick: `downloadCsvFile(${JSON.stringify(scores)}, "scores")`
      })
    }
  })
}

function getUsers() {
  $.ajax({
    url: '/dataService/getusers',
    type: 'get',
    data: {},
    success: function(data) {
      let users = data.users
      let table = $("<table class=\"gridtable\"></table>")
      for (let index1 in users) {
        if (!parseInt(index1)) {
          let thead = $("<thead></thead>")
          let tr = $("<tr></tr>")
          let subArray = users[index1]
          for (let index2 in subArray) {
            let th = $(`<th>${subArray[index2]}</th>`)
            tr.append(th)
          }
          thead.append(tr)
          table.append(thead)
        } else {
          let tbody = $("<tbody class=\"tbd-exporting\"></tbody>")
          let tr = $("<tr></tr>")
          let subArray = users[index1]
          for (let index2 in subArray) {
            let th = $(`<td>${subArray[index2]}</td>`)
            tr.append(th)
          }
          tbody.append(tr)
          table.append(tbody)
        }
      }
      $("#user-table").empty()
      $("#user-table").append(table)
      $("#exportCsvFile").attr({
        onclick: `downloadCsvFile(${JSON.stringify(users)}, "users")`
      })
    }
  })
}

function downloadCsvFile(data, name) {

  let csvContent = "data:text/csv;charset=utf-8,"
  + data.map( e => e.join(",")).join("\n");

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${name}.csv`);
  document.body.appendChild(link); // Required for FF

  link.click();
}