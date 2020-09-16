$(document).ready(function () {
  $('.menu .item').tab()
})

function validFileExtension(rdr = "", extension = "") {

  if ($('#inputFile')[0].files[0] !== undefined) {
    let fileName = $('#inputFile')[0].files[0].name
    let fileExtension = fileName.split(".")
    fileExtension = fileExtension[fileExtension.length - 1]
    console.log("File Extension, ", fileExtension)

    if (fileExtension === extension) {
      $('#totalScoreTable').empty()
      rdr.readAsText($('#inputFile')[0].files[0])
      return {status: 1, statement: ""}
    } else {
      return {status: 0, statement: "The file extension must be the \"" + extension + "\" only."}
    }
  } else {
    return {status: -1, statement: "Please choose file before press the \"Import File\" button."}
  }
}

function createDataTable (idTable, tbdClass, data) {
  // console.log("Data, ", data)
  if (Array.isArray(data)) {
    console.log("Array!")

    if (data.length) {
      $("#" + idTable).empty();
    }

    let colCount = 0
    for (let index in data) {

      index = parseInt(index)
      let newRow = '<tr>'
      let columns = data[index]

      if (!index) {
        newRow = '<thead><tr class=\'tableHeader\'>'
        colCount = columns.length
      }

      for (let field in columns) {
        if (columns.length !== colCount) {

        } else if (!index) {
          if (columns[field] === '') {
            newRow += '<th class=\'incorrect\'>Data Lost!</th>'
          } else {
            newRow += '<th>' + columns[field] + '</th>'
          }
        } else {
          if (columns[field] === '') {
            newRow += '<td class=\'tbd-importing' + columns[field] + ' incorrect\'>Data Lost!</td>'
          } else {
            newRow += '<td class=\'' + columns[field] + '\' >' + columns[field] + '</td>'
          }
        }

        if (field === colCount) {
          newRow += '</tr>'
          if (!index) {
            newRow += '</thead>'
          }
          break
        }
      }

      $("#" + idTable).append(newRow);
    }

  } else {
    console.log("Object!")
    let table = $("<table class=\"gridtable\"></table>")
    if (data.length) {
      let thead = $("<thead></thead>")
      let tr = $("<tr></tr>")
      let keysArray = Object.keys(data[0])
      for (let index in keysArray) {
        let th = $(`<th>${keysArray[index]}</th>`)
        tr.append(th)
      }
      thead.append(tr)
      table.append(thead)
    }

    for (let index in data) {
      let tbody = $("<tbody class=\"" + tbdClass + "\"></tbody>")
      let tr = $("<tr></tr>")
      let dataObjs = data[index]
      for (let key in dataObjs) {
        let th = $(`<td>${dataObjs[key]}</td>`)
        tr.append(th)
      }
      tbody.append(tr)
      table.append(tbody)
    }
    $("#" + idTable).empty()
    $("#" + idTable).append(table)
  }
  alert("Create the data table successfully!")
}

function onClickFilterUser() {

  let readMultiFiles = function(files) {
    let rdr = new FileReader();

    function readFile(index, dataObj = {}) {
      if( index >= files.length ) return;
      let file = files[index];
      rdr.onload = function(e) {
        // get file content
        dataObj["data" + index] = e.target.result.split('\n');
        let tmpArray1 = [...dataObj["data" + index]]
        let tmpArray2 = []
        for (let index1 in tmpArray1) {
          let tmpArray1_1 = tmpArray1[index1].split(",")
          for (let index2 in tmpArray1_1) {
            let data = tmpArray1_1[index2]
            tmpArray1_1[index2] = data.replace(/"/g, "");
          }
          tmpArray2.push(tmpArray1_1)
        }
        tmpArray2.splice(0, 1)
        dataObj["data" + index] = [...tmpArray2]
      }

      rdr.onloadend = function (e) {

        if ( index === files.length - 1) {
          let dataObjKeys = Object.keys(dataObj)

          /**
           * dataObj = { data1: [[], [], []], data2: [[], [], []]}
           */
          let createUserJson = (dataObjKeys, dataObj) => {
            let tmpUsersObj = {}
            let exceptedUser = []
            for (let index1 in dataObjKeys) {
              let dataArray1 = dataObj[dataObjKeys[index1]]
              for (let index2 in dataArray1) {
                let dataArray2 = dataArray1[index2]
                let user = tmpUsersObj[dataArray2[0]]
                if (user === undefined) {
                  if (parseInt(dataArray2[4]) !== 0 && exceptedUser.indexOf(dataArray2[0]) < 0) {
                    tmpUsersObj[dataArray2[0]] = {name: dataArray2[1], problemScore: dataArray2[2], quizScore: dataArray2[3], total: dataArray2[4]}
                  } else {
                    if (exceptedUser.indexOf(dataArray2[0]) < 0) {
                      exceptedUser.push(dataArray2[0])
                    }
                  }
                } else if (parseInt(user.total) < parseInt(dataArray2[4])) {
                  tmpUsersObj[dataArray2[0]]["total"] = dataArray2[4]
                }
              }
            }
            delete tmpUsersObj[""]
            return tmpUsersObj
          }

          let usersObj = createUserJson(dataObjKeys, dataObj);

          let verifyParticipating = (usersObj = {}, dataObjKeys, dataObj = {}) => {
            let isParticipateds = {...usersObj}
            let fullyParticipate = dataObjKeys.length
            for (let index1 in dataObjKeys) {
              let tmpDataArray = dataObj[dataObjKeys[index1]]
              for (let index2 in tmpDataArray) {
                let stdId = tmpDataArray[index2][0]
                isParticipateds[stdId] === undefined ? true : isParticipateds[stdId]["isParticipated"] === undefined ? isParticipateds[stdId]["isParticipated"] = 1 : isParticipateds[stdId]["isParticipated"] === fullyParticipate ? isParticipateds[stdId]["isParticipated"] = true : isParticipateds[stdId]["isParticipated"] + 1 === fullyParticipate ? isParticipateds[stdId]["isParticipated"]  = true : isParticipateds[stdId]["isParticipated"] += 1;
              }
            }
            return isParticipateds;
          }

          usersObj = {...verifyParticipating(usersObj, dataObjKeys, dataObj)}

          let cutLostUserDataOut = (usersObj) => {
            for (let key in usersObj) {
              let user = usersObj[key]
              if (typeof(user["isParticipated"]) === "number") {
                delete usersObj[key]
              }
            }
            return usersObj
          }

          usersObj = {...cutLostUserDataOut(usersObj)}

          let usersArray1 = []
          let usersArray2 = [["Username", "Name", "Problem Score", "Quiz Score", "Total"]]
          for (let key in usersObj) {
            usersArray2.push([key, usersObj[key].name, usersObj[key].problemScore, usersObj[key].quizScore, usersObj[key].total])
            usersArray1.push({username: key, name: usersObj[key].name, problem_score: usersObj[key].problemScore, quiz_score: usersObj[key].quizScore, total: usersObj[key].total})
          }

          createDataTable("filter-user-segment", "tbd-data-cleaning", usersArray1)
          $(".export-csv-file").attr({
            onclick: `downloadCsvFile(${JSON.stringify(usersArray2)}, "student_list")`
          })
        } else {
          readFile(index+1, dataObj)
        }

      }

      rdr.readAsText(file);
    }

    readFile(0);
  }

  readMultiFiles([$("#inputFileFt1")[0].files[0], $("#inputFileFt2")[0].files[0]])
}

function cleanUserData() {
  let readMultiFiles = function(files) {
    let rdr = new FileReader();

    let readFile = function (index = 0, dataObj = {}) {
      if (index > files.length) return;
      let file = files[index]

      rdr.onload = function(e) {
        dataObj["data" + index] = e.target.result.split('\n');
        let tmpArray1 = [...dataObj["data" + index]]
        let tmpArray2 = []
        for (let index1 in tmpArray1) {
          let tmpArray1_1 = tmpArray1[index1].split(",")
          for (let index2 in tmpArray1_1) {
            let data = tmpArray1_1[index2]
            tmpArray1_1[index2] = data.replace(/"/g, "");
          }
          tmpArray2.push(tmpArray1_1)
        }
        tmpArray2.splice(0, 1)
        dataObj["data" + index] = [...tmpArray2]
      }

      rdr.onloadend = function (e) {

        if ( index === files.length - 1 ) {
  
          /**
           * dataObj = { data0: [[], [], []], data1: [[], [], []]}
           */
          let createUserJson = (data = []) => {
            let tmpUsersObj = {}
            for (let index in data) {
              let tmpData = data[index]
              let user = tmpUsersObj[tmpData[0]]
              if (user === undefined) {
                tmpUsersObj[tmpData[0]] = {name: tmpData[1], total: tmpData[4]}
              }
            }
  
            return tmpUsersObj
          }
  
          let usersObj = createUserJson(dataObj["data0"]);
  
          let updateUsersObj = (usersObj = {}, data = []) => {

            for (let index in data) {
              let tmpData = data[index]
              user = usersObj[tmpData[8]]
              if (user !== undefined) {
                user.uid = tmpData[7]
                user.gender = tmpData[3]
                user.totalTime = tmpData[5]
                user.systemAccessTime = tmpData[6]
              }
            }

            return usersObj
          }
    
          usersObj = updateUsersObj(usersObj, dataObj["data1"])
  
          let usersArray1 = []
          let usersArray2 = [["Uid", "Username", "Name", "Gender", "System Access Time", "Total Time", "Total Score"]]
          for (let key in usersObj) {
            usersArray2.push([usersObj[key].uid, key, usersObj[key].name, usersObj[key].gender, usersObj[key].systemAccessTime, usersObj[key].totalTime, usersObj[key].total])
            usersArray1.push({uid: usersObj[key].uid, username: key, name: usersObj[key].name, gender: usersObj[key].gender, systemAccessTime: usersObj[key].systemAccessTime, totalTime: usersObj[key].totalTime, totalScore: usersObj[key].total})
          }

          createDataTable("cleaned-user-segment", "tbd-data-cleaning", usersArray1)
          $(".export-csv-file").attr({
            onclick: `downloadCsvFile(${JSON.stringify(usersArray2)}, "student_list_of_user_table")`
          })
        } else {
          readFile(index+1, dataObj)
        }
      }

      rdr.readAsText(file)
    }

    readFile(0)
  }

  readMultiFiles([$("#inputFileUt1")[0].files[0], $("#inputFileUt2")[0].files[0]])
}

function cleanProjectData() {
  let readMultiFiles = function(files) {
    let rdr = new FileReader();

    let readFile = function (index = 0, dataObj = {}) {
      if (index > files.length) return;
      let file = files[index]

      rdr.onload = function(e) {
        dataObj["data" + index] = e.target.result.split('\n');
        let tmpArray1 = [...dataObj["data" + index]]
        let tmpArray2 = []
        for (let index1 in tmpArray1) {
          let tmpArray1_1 = tmpArray1[index1].split(",")
          for (let index2 in tmpArray1_1) {
            let data = tmpArray1_1[index2]
            tmpArray1_1[index2] = data.replace(/"/g, "");
          }
          tmpArray2.push(tmpArray1_1)
        }
        tmpArray2.splice(0, 1)
        dataObj["data" + index] = [...tmpArray2]
      }

      rdr.onloadend = function (e) {

        if ( index === files.length - 1 ) {
  
          /**
           * dataObj = { data0: [[], [], []], data1: [[], [], []]}
           */
          let createUserJson = (data = []) => {
            let tmpUsersObj = {}
            for (let index in data) {
              let tmpData = data[index]
              let user = tmpUsersObj[tmpData[1]]
              if (user === undefined) {
                tmpUsersObj[tmpData[1]] = {uid: tmpData[0], name: tmpData[2], gender: tmpData[3], systemAccessTime: tmpData[4], totalTime: tmpData[5], totalScore: tmpData[6]}
              }
            }
  
            return tmpUsersObj
          }
  
          let usersObj = createUserJson(dataObj["data0"]);
          console.log("User Obj 0: ", usersObj)
  
          let updateUsersObj = (usersObj = {}, data = []) => {

            for (let index in data) {
              let tmpData = data[index]
              creator = usersObj[tmpData[6]]
              collaborator = usersObj[tmpData[7]]
              if (creator !== undefined) {
                creator.pid === undefined ? creator.pid = [tmpData[5]] : creator.pid.push(tmpData[5]);
                creator.programmingStyle === undefined ? creator.programmingStyle = [tmpData[3]] : creator.programmingStyle.push(tmpData[3]);
              }

              if (collaborator !== undefined) {
                collaborator.pid === undefined ? collaborator.pid = [tmpData[5]] : collaborator.pid.push(tmpData[5]);
                collaborator.programmingStyle === undefined ? collaborator.programmingStyle = [tmpData[3]] : collaborator.programmingStyle.push(tmpData[3]);
              }
            }

            return usersObj
          }

          usersObj = updateUsersObj(usersObj, dataObj["data1"])

          let usersArray1 = []
          let usersArray2 = [["Uid", "Username", "Name", "Gender", "System Access Time", "Total Time", "Pid", "Programming Style", "Total Score"]]
          for (let key in usersObj) {
            if (usersObj[key].pid !== undefined && usersObj[key].programmingStyle !== undefined) {
              usersArray2.push([usersObj[key].uid, key, usersObj[key].name, usersObj[key].gender, usersObj[key].systemAccessTime, usersObj[key].totalTime, usersObj[key].pid.join("\/"), usersObj[key].programmingStyle.join("\/"), usersObj[key].totalScore])
              usersArray1.push({uid: usersObj[key].uid, username: key, name: usersObj[key].name, gender: usersObj[key].gender, systemAccessTime: usersObj[key].systemAccessTime, totalTime: usersObj[key].totalTime, pid: usersObj[key].pid.join("\/"), programmingStyle: usersObj[key].programmingStyle.join("\/"), totalScore: usersObj[key].totalScore})
            }
          }

          createDataTable("cleaned-project-segment", "tbd-data-cleaning", usersArray1)
          $(".export-csv-file").attr({
            onclick: `downloadCsvFile(${JSON.stringify(usersArray2)}, "student_list_of_project_table")`
          })
        } else {
          readFile(index+1, dataObj)
        }
      }

      rdr.readAsText(file)
    }

    readFile(0)
  }

  readMultiFiles([$("#inputFilePro1")[0].files[0], $("#inputFilePro2")[0].files[0]])
}

function cleanScoreData() {
  let readMultiFiles = function(files) {
    let rdr = new FileReader();

    let readFile = function (index = 0, dataObj = {}) {
      if (index > files.length) return;
      let file = files[index]

      rdr.onload = function(e) {
        dataObj["data" + index] = e.target.result.split('\n');
        let tmpArray1 = [...dataObj["data" + index]]
        let tmpArray2 = []
        for (let index1 in tmpArray1) {
          let tmpArray1_1 = tmpArray1[index1].split(",")
          for (let index2 in tmpArray1_1) {
            let data = tmpArray1_1[index2]
            tmpArray1_1[index2] = data.replace(/"/g, "");
          }
          tmpArray2.push(tmpArray1_1)
        }
        tmpArray2.splice(0, 1)
        dataObj["data" + index] = [...tmpArray2]
      }

      rdr.onloadend = function (e) {

        if ( index === files.length - 1 ) {
  
          /**
           * dataObj = { data0: [[], [], []], data1: [[], [], []]}
           */
          let createUserJson = (data = []) => {
            let tmpUsersObj = {}
            for (let index in data) {
              let tmpData = data[index]
              let user = tmpUsersObj[tmpData[0]]
              if (user === undefined) {
                let splitedPid = tmpData[6].split("\/")
                console.log("Splited Pid, ", splitedPid)
                tmpUsersObj[tmpData[0]] = {username: tmpData[1], name: tmpData[2], pid: tmpData[6].split("\/")}
              }
            }
  
            return tmpUsersObj
          }
  
          let usersObj = createUserJson(dataObj["data0"]);
          console.log("User Obj 0: ", usersObj)
  
          let updateUsersObj = (usersObj = {}, data = []) => {

            for (let index in data) {
              let tmpData = data[index]
              let tmpPid = tmpData[2]
              let tmpUid = tmpData[3]
              let user = usersObj[tmpUid]
              if (user !== undefined) {
                let projectIndex = user.pid.indexOf(tmpPid)
                if (projectIndex >= 0) {
                  user.pid.splice(projectIndex, 1, [tmpPid, tmpData[0], tmpData[1], tmpData[4], tmpData[5], tmpData[6], tmpData[7]])
                }
              }
            }

            return usersObj
          }

          usersObj = updateUsersObj(usersObj, dataObj["data1"])
          console.log("User Obj 1: ", usersObj)

          let usersArray1 = []
          let usersArray2 = [["Username", "Name", "Pid", "Enter", "Pairing", "Score", "Time", "Lines of Code", "Error Count"]]
          for (let key in usersObj) {
            if (usersObj[key].pid !== undefined) {
              // usersObj[key].pid = usersObj[key].pid.map(e => e.join("\/"))
              let tmpPid = usersObj[key].pid
              for (let index in tmpPid) {
                usersArray2.push([usersObj[key].username, usersObj[key].name, tmpPid[index][0], tmpPid[index][1], tmpPid[index][2], tmpPid[index][3], tmpPid[index][4], tmpPid[index][5], tmpPid[index][6]])
              }
              usersArray2.push(['', '', '', '', '', '', '', ''])
              // usersArray2.push([key, usersObj[key].username, usersObj[key].pid.join(";"), usersObj[key].name])
              // usersArray1.push({uid: key, username: usersObj[key].username, pid: usersObj[key].pid.join(";"), name: usersObj[key].name})
            }
          }

          console.log("Users Array 2, ", usersArray2)

          createDataTable("cleaned-score-table", "tbd-data-cleaning", usersArray2)
          $(".export-csv-file").attr({
            onclick: `downloadCsvFile(${JSON.stringify(usersArray2)}, "student_list_of_score_table")`
          })
        } else {
          readFile(index+1, dataObj)
        }
      }

      rdr.readAsText(file)
    }

    readFile(0)
  }

  readMultiFiles([$("#inputFileScore1")[0].files[0], $("#inputFileScore2")[0].files[0]])
}

function onClickImportFile (tab = "totalScore") {
  let rdr = new FileReader()
  let isFileExtension = {status: -1, statement: "Please choose file before press the \"Import File\" button."}

  if (tab === "totalScore") {

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
              newRow += '<td class=\'tbd-importing' + columns[field] + ' incorrect\'>Data Lost!</td>'
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

    isFileExtension = validFileExtension(rdr, "csv")

  } else if (tab === "jsonFile") {

    rdr.onload = function(e) {
      let jsonData = JSON.parse(e.target.result)
      
      createDataTable("json-data-table", "tbd-importing", jsonData)

      // $("#export-json-file-btn").attr({
      //   onclick: "downloadJsonFile("+JSON.stringify(jsonData)+", \"json_data\")"
      // })

      $('#json-data').attr('value', JSON.stringify(jsonData))
    }

    isFileExtension = validFileExtension(rdr, "json")
  }

  if (isFileExtension.status !== undefined && isFileExtension.status !== 1) {
    alert(isFileExtension.statement)
  }

  console.log('$(\'#inputFile\')[0], ', $('#inputFile')[0].files[0])
  
}

async function onClickSearchBtn (typing = "NoNe") {
  try {
    let jsonData = JSON.parse($("#json-data").val())

    let filter = async (jsonData, tmpJsonData = []) => {
      for (let index in jsonData) {
        let dataObjs = jsonData[index]
  
        for (let key in dataObjs) {
          let data = dataObjs[key]
          let isFindData = data.search(typing)
  
          if (isFindData >= 0) {
            tmpJsonData.push(dataObjs)
            break;
          }
        }
      }
      return tmpJsonData
    }

    let tmpJsonData = await filter(jsonData, [])
    jsonData = [...tmpJsonData]

    if (jsonData.length) {
      createDataTable("json-data-table", "tbd-importing", jsonData)

      // $("#export-json-file-btn").attr({
      //   onclick: "downloadJsonFile("+JSON.stringify(jsonData)+", \""+typing+"\")"
      // })

    } else {
      $('tbody').remove(".tbd-exporting")
    }

  } catch (err) {
    console.log("Error from onClickSearchBtn function: ", err)
  }
}

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
  } else if (name === "totalScore") {
    onClickImportFile(name)
  } else if (name === "jsonFile") {
    onClickImportFile(name)
  }
}

function refreshData() {
  $("tbody").remove(".tbd-exporting")
  $("tbody").remove(".tbd-importing")
  $("tbody").remove(".tbd-data-cleaning")
}

function setViewDataButton (id) {
  let splitId = id.split('-')
  let name = splitId[0]

  $('.view-data').attr({
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

      /**
       * records and updates a new data to the "dataContainer" container.
       */
      let dataContainer = JSON.parse($("#data-container").val())
      if (dataContainer.comments === undefined) {
        dataContainer.comments = JSON.stringify(comments)
      }
      $("#data-container").val(JSON.stringify(dataContainer))

      // $(".export-csv-file").attr({
      //   onclick: `downloadCsvFile(${JSON.stringify(comments)}, "comments")`
      // })
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
      $(".export-csv-file").attr({
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
      $(".export-csv-file").attr({
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
      $(".export-csv-file").attr({
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
      $(".export-csv-file").attr({
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
      $(".export-csv-file").attr({
        onclick: `downloadCsvFile(${JSON.stringify(users)}, "users")`
      })
    }
  })
}

function downloadCsvFile(data, name = "") {

  let csvContent = "data:text/csv;charset=utf-8,"
  + data.map( e => e.join(",")).join("\n");

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${name}.csv`);
  document.body.appendChild(link); // Required for FF

  link.click();
}

// function onClickExportButton(data, extension) {

//   if (typeof(data) === "string") data = JSON.parse(data);

//   if (extension === "csv") {
//     downloadCsvFile(data)
//   } else if (extention === "json") {
//     downloadJsonFile(data)
//   }
// }

function onClickExportButton() {
  $("#exportingFileModal").modal("show");
}

function downloadJsonFile(data, name = "") {
  let jsonContent = "data:text/json;charset=utf-8,"
  + encodeURIComponent(JSON.stringify(data));

  name = name === "" ? getTime() : name;

  let link = document.createElement("a");
  link.setAttribute("href", jsonContent);
  link.setAttribute("download", `${name}.json`);
  document.body.appendChild(link); // Required for FF

  link.click();
}

function getTime() {
  let dateTime = new Date();
  let strDataTime = dateTime.toString();
  let splitDataTime = strDataTime.split(" ");
  let sliceDataTime = splitDataTime.slice(1, 5);
  let month = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12"
  };
  let numMonth = month[sliceDataTime[0]];
  numMonth === undefined ? (numMonth = "13") : null;
  let thisMoment = `${sliceDataTime[2]}_${numMonth}_${sliceDataTime[1]}_${sliceDataTime[3]}`
  return thisMoment
}