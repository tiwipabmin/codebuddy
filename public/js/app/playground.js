/**
 * Dependencies declaration
 */
const socket = io()
const roles = {
  user: '',
  partner: ''
}
var comments = []
var code = null

var webrtc = new SimpleWebRTC({
  // the id/element dom element that will hold "our" video
  localVideoEl: 'localVideo',
  // the id/element dom element that will hold remote videos
  remoteVideosEl: 'remoteVideo',
  // immediately ask for camera access
  autoRequestMedia: true
});

/**
 * get query parameter from URL
 * @param {String} name parameter name that you want to get value from
 * http://stackoverflow.com/a/901144/4181203
 */
function getParameterByName(name) {
  const url = window.location.href
  const param = name.replace(/[\[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)

  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

/**
 * Initiate local editor
 */
var projectFiles = JSON.parse(document.getElementById('projectFiles').value);
var currentTab = 'main';
var partnerTab = 'main';
var isCloseTab = false;
var editors = []
var output = {}
var codeAllBlock = [];
var sizeOutputObjects = 0;
var queueBlock = 0;
var detectFocusBlock = 0;

function getIndexBlock(key){
  var index = codeAllBlock.map(function (e) { return e.key }).indexOf(key)
  if(index < 0){
    return codeAllBlock.length
  }
  return index
}

projectFiles.forEach(newEditorFacade);
getActiveTab('main');

var segmentCodeBlock = document.getElementById("segmentCodeBlock")

function setEditor(fileName){
  var cm = CodeMirror.fromTextArea(document.getElementById(fileName+"-text"), {
    lineNumbers: true,
    mode: {
      name: 'python',
      version: 3,
      singleLineStringErrors: false,
      styleActiveLine: true,
      lineNumbers: true,
      lineWrapping: true
    },
    theme: 'material',
    indentUnit: 4,
    matchBrackets: true
  })
  cm.addKeyMap({
    "Alt-R": function(cm) { runCode() },
    "Ctrl-M": function(cm) { addBlock() }
  })
  cm.on('focus', (cm) => {
    // find index of focusing codemirror in editors array.
    detectFocusBlock = editors.map(function(obj) { return obj.editor }).indexOf(cm);
    console.log(detectFocusBlock)
  })
  editors.push({ blockId: fileName, editor: cm })
}

function getBlock(codeBlockName, value){
  if(codeBlockName != "main"){
    var divisionCodeBlock = document.createElement("div")
    var codeBlock = document.createElement("textarea")
    var map = {"Alt-R": function(cm){
      runCode()
    }}
    var index = getIndexBlock(detectFocusBlock)

    divisionCodeBlock.setAttribute('id', codeBlockName + "div")
    codeBlock.setAttribute('id', codeBlockName)

    var isOutOfBound = outOfBound(index)
    console.log("redundancyIndex : " + isOutOfBound)

    //ถ้า true จะสามารถเพิ่ม Block ใหม่ข้างใต้ Block ที่สนใจได้ ถ้า false จะเพิ่ม Block เข้าไปท้ายสุด่
    if(isOutOfBound) {
      divisionCodeBlock.appendChild(codeBlock)
      segmentCodeBlock.insertBefore(divisionCodeBlock, segmentCodeBlock.childNodes[index + 1])
    } else {
      divisionCodeBlock.appendChild(codeBlock)
      segmentCodeBlock.appendChild(divisionCodeBlock)
    }

    editors[codeBlockName] = CodeMirror.fromTextArea(document.getElementById(codeBlockName), {
      lineNumbers: true,
      mode: {
        name: 'python',
        version: 3,
        singleLineStringErrors: false,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true
      },
      theme: 'material',
      indentUnit: 4,
      matchBrackets: true,
    })
    editors[codeBlockName].addKeyMap(map)
    editors[codeBlockName].setValue(value)
    var newObjectBlock = {}
    newObjectBlock["key"] = codeBlockName
    newObjectBlock["value"] = value
    return newObjectBlock
  }
}

// ตรวจสอบ index ของ block ที่สนใจว่าเกินขอบเขตที่ index ของ array หรือไม่
function outOfBound(index) {
  if(index < (codeAllBlock.length - 1) && index >= 0){
    return true
  }
  return false
}

/**
 * Code Mirror Change Theme
 */
var isLight = false;

function changeTheme() {
  if (!isLight) {
    var theme = "default";
    projectFiles.forEach(setTheme);
    location.hash = "#" + theme;
  }
  else {
    var theme = "material";
    projectFiles.forEach(setTheme);
    location.hash = "#" + theme;
  }
  isLight = !isLight;

  function setTheme(fileName) {
    var blockObj = editors.find(obj => { return obj.blockId == fileName })
    blockObj.editor.setOption("theme", theme);
  }
}

/**
 * User join the project
 */
socket.emit('join project', {
  pid: getParameterByName('pid'),
  username: user
})

webrtc.on('readyToCall', function () {
  // you can name it anything
  webrtc.createRoom(getParameterByName('pid'));
  webrtc.joinRoom(getParameterByName('pid'));
});

/**
 * After user join the project, user will recieve initiate data to perform in local editor
 */
socket.on('init state', (payload) => {
  if(payload.editor != null) {
    var editorValues = JSON.parse(payload.editor);
    projectFiles.forEach(setEditorValue);
  } else {
    editors['main'].setValue('');
  }

  function setEditorValue(fileName) {
    if(editorValues!=null){
      var blockObj = editors.find(obj => { return obj.blockId == fileName })
      blockObj.editor.setValue(editorValues[fileName])
      currentFileName = fileName
    }
  }

  code = payload.editor
  // webrtc.on('readyToCall', function () {
  //   // you can name it anything
  //   webrtc.createRoom(getParameterByName('pid'));
  //   webrtc.joinRoom(getParameterByName('pid'));
  // });
  // webrtc.emit('readyToCall')
})

/**
 * After user join the project, user will recieve initiate review to hilight in local editor
 */

socket.on('init reviews', (payload) => {
  comments = payload
  for(var i in comments){
    var blockObj = editors.find(obj => { return obj.blockId == comments[i].file })
    blockObj.editor.addLineClass(parseInt(comments[i].line)-1, 'wrap', 'CodeMirror-activeline-background')
  }
})

/**
 * Update tab when create or delete
 */
socket.on('update tab', (payload) => {
  var fileName = payload.fileName
  var action = payload.action
  if(action=='create'){
    var id = document.getElementById("file-tabs").childElementCount;
    $('.add-file').closest('a').before('<a class="item" id="'+fileName+'" data-tab="' + fileName + '" onClick="getActiveTab(\''+fileName+'\')">'+ fileName + '.py <span onClick="closeTab(\''+fileName+'\')"><i class="delete icon" id="close-tab-icon"></i></span></a>');
    $('.tab-content').append('<div class="ui bottom attached tab segment" id="'+fileName+'-tab" data-tab="' + fileName + '"> <textarea class="show" id="'+fileName+'text"></textarea></div>');
    $('.menu .item').tab();

    //setup file
    projectFiles.push(fileName);
    newEditorFacade(fileName);
    var html = '<div class="item cursor-pointer" id="'+fileName+'-file" onClick=getActiveTab("'+fileName+'")><div id="'+fileName+'-file-icon"/><i class="file icon"/><div class="middle aligned content"><div class="header" id="'+fileName+'-header">'+fileName+'.py</div>'+
                            '<div class="delete-file">'+
                              '<span onClick=showDeleteFileModal("'+fileName+'")>'+
                                '<i class="trash alternate outline icon" id="delete-icon"></i>'+
                              '</span>'+
                              '<div class="ui small modal" id="'+fileName+'-delete-file-modal">'+
                                '<div class="header"> Delete File </div>'+
                                '<div class="content">'+
                                  '<p> Do you want to delete ' + fileName + '.py? </p>'+
                                '</div>'+
                                '<div class="actions">'+
                                  '<button class="ui button approve green" onClick=deleteFile("'+fileName+'")> Delete </button>'+
                                  '<div class="ui button approve red" data-value="cancel"> Cancel </div>'+
                                '</div>'+
                              '</div>'+
                          '</div>'+
                          '</div></div>'
    $('#file-list').append(html);
    $('#export-checklist').append('<div class="item export-file-item" id="'+fileName+'-export-file-item"><div class="ui child checkbox"><input type="checkbox" name="checkbox-file" value="'+fileName+'"><label>'+fileName+'.py</label></div></div>');
  } else{
    var tab = document.getElementById(fileName);
    tab.remove();
    var fileItem = document.getElementById(fileName+'-file');
    fileItem.remove();
    var modal = document.getElementById(fileName+'-delete-file-modal');
    modal.remove();
    var exportFileItem = document.getElementById(fileName+'-export-file-item');
    exportFileItem.remove();
    $(".file.menu").children('a').first().click();
  }

})

/**
 * Update block when create or delete
 */
socket.on('update block', (payload) => {
  var blockId = payload.blockId;
  var index = payload.index;
  var action = payload.action;

  if (action == 'add') {
    var divisionCodeBlock = document.createElement("div")
    var codeBlock = document.createElement("textarea")

    divisionCodeBlock.setAttribute('id', blockId + "div")
    codeBlock.setAttribute('id', blockId+"-text")

    // var isRedundancyIndex = redundancyIndex(index)
    // console.log("redundancyIndex : " + isRedundancyIndex)

    // if(isRedundancyIndex) {
    //   divisionCodeBlock.appendChild(codeBlock)
    //   segmentCodeBlock.insertBefore(divisionCodeBlock, segmentCodeBlock.childNodes[index + 1])
    // } else {
    //   divisionCodeBlock.appendChild(codeBlock)
    //   segmentCodeBlock.appendChild(divisionCodeBlock)
    // }

    divisionCodeBlock.appendChild(codeBlock)
    segmentCodeBlock.insertBefore(divisionCodeBlock, segmentCodeBlock.children[index])

    // TODO: refactor setEditor with index parameter
    // add codemirror of new into editors array
    var cm = CodeMirror.fromTextArea(document.getElementById(blockId+"-text"), {
      lineNumbers: true,
      mode: {
        name: 'python',
        version: 3,
        singleLineStringErrors: false,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true
      },
      theme: 'material',
      indentUnit: 4,
      matchBrackets: true
    })
    cm.addKeyMap({
      "Alt-R": function(cm) { runCode() },
      "Ctrl-M": function(cm) { addBlock() }
    })
    cm.on('focus', (cm) => {
      // find index of focusing codemirror in editors array.
      detectFocusBlock = editors.map(function(obj) { return obj.editor }).indexOf(cm);
    })
    editors.splice(index, 0, { blockId: blockId, editor: cm })
    setOnChangeEditer(blockId)
    setOnDoubleClickEditor(blockId)

    switch (roles.user) {
      case 'coder':
        cm.setOption('readOnly', false) // show cursor
        break
      case 'reviewer':
        cm.setOption('readOnly', 'nocursor') // no cursor
        break
    }
  } else {
    // TODO: delete block
    var divisionCodeBlock = document.getElementById(blockId+'-div')
    divisionCodeBlock.remove()

    editors.splice(detectFocusBlock, 1)
  }
})

/**
 * If there's no one select the role, then first user that come to the project must choose one
 */
socket.on('role selection', () => {
  $('#selectRole-modal')
    .modal({
      closable  : false,
      onDeny    : function(){
        console.log('select : reviewer')
        socket.emit('role selected', {
          select: 0,
          partner
        })
      },
      onApprove : function() {
        console.log('select : coder')
        socket.emit('role selected', {
          select: 1,
          partner
        })
      }
    })
    .modal('show')
})

socket.on('countdown', (payload) => {
  if(payload.minutes == '0' && payload.seconds <= 15){
    $(".countdown").html(`<span style="color: red;"> ${pad(payload.minutes)} : ${pad(payload.seconds)}</span> <span style="font-size:12px;">mins</span>`)
    $(".auto-swap-warning").html(`<div class="ui circular labels" style="margin-top: 10px;"><a class="ui label">Auto swaping role in ${payload.seconds} secs</a></div>`)
  } else {
    $(".countdown").html(`${pad(payload.minutes)} : ${pad(payload.seconds)} <span style="font-size:12px;">mins</span>`)
    $(".auto-swap-warning").html(``)
  }
})

socket.on('role updated', (payload) => {
  if (user === payload.projectRoles.roles.reviewer) {
    roles.user = 'reviewer'
    roles.partner = 'coder'
    projectFiles.forEach(setOptionFileNoCursor)
  } else if(user === payload.projectRoles.roles.coder) {
    roles.user = 'coder'
    roles.partner = 'reviewer'
    projectFiles.forEach(setOptionFileShowCursor)
  }else{
    if(user === payload.project.creator) {
      roles.user = 'coder'
      roles.partner = 'reviewer'
    } else {
      roles.user = 'reviewer'
      roles.partner = 'coder'
    }
  }

  function setOptionFileNoCursor(fileName) {
    var blockObj = editors.find(obj => { return obj.blockId == fileName })
    blockObj.editor.setOption('readOnly', 'nocursor')
  }
  function setOptionFileShowCursor(fileName) {
    var blockObj = editors.find(obj => { return obj.blockId == fileName })
    blockObj.editor.setOption('readOnly', false)
  }

  $(".partner-role-label").text(`${roles.partner}`)
  $(".user-role-label").text(`${roles.user}`)
  // startCountdown()
})

socket.on('show reviewer active time', (payload) => {
  if(roles.user === 'coder' && payload.counts >= 0) {
    $('#buddy_counts_min_sec').show();
    $('#buddy_counts_min_sec').text("Reviewer active time: " + payload.mins + ":" + payload.secs + " mins");
  } else {
    $('#buddy_counts_min_sec').hide();
  }
})

/**
 * If user exit or going elsewhere which can be caused this project window closed
 * `beforeunload` event will fired and sending client disconnection to the server
 */
$(window).on('beforeunload', () => {
  socket.emit('submit code', {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor()
  })
  storeActiveTime()
  socket.disconnect()
})

$(window).bind('hashchange', function() {
  socket.emit('submit code', {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor()
  })
  storeActiveTime()
 });

/**
 * Recieve new changes editor value from server and applied them to local editor
 */
socket.on('editor update', (payload) => {
  var blockObj = editors.find(obj => { return obj.blockId == payload.fileName })
  blockObj.editor.replaceRange(payload.text, payload.from, payload.to);
  setTimeout(function() {
    blockObj.editor.refresh();
  }, 1);
})

/**
 * User status checking
 */
let windowIsFocus

$(window).focus(() => {
  windowIsFocus = true
}).blur(() => {
  windowIsFocus = false
})

setInterval(() => {
  socket.emit('user status', {
    status: windowIsFocus
  })
}, 3000)

socket.on('update status', (payload) => {
  if (payload.status) {
    $(".user.status").html(`<strong><em><i class='green circle icon'></i></em></strong>`)
  } else {
    $(".user.status").html(`<strong><em><i class='grey circle icon'></i></em></strong>`)
  }
})

function submitReview() {
  socket.emit('submit review', {
    file: $('input.hidden.file.name').val(),
    line: parseInt($('input.disabled.line.no').val()),
    description: $('textarea.line.reviewer.description').val(),
  })
  $('textarea.line.description').val('')
}

socket.on('new review', (payload) => {
  comments = payload
  comments.map((comment) => {
    var blockObj = editors.find(obj => { return obj.blockId == comment.file })
    blockObj.editor.addLineClass(parseInt(comment.line-1), 'wrap', 'CodeMirror-activeline-background')
  })
})

function deleteReview() {
  socket.emit('delete review', {
    file: $('input.hidden.file.name').val(),
    line: $('input.disabled.line.no').val(),
    description: $('textarea.line.reviewer.description').val(),
  })
}

socket.on('update after delete review', (payload) =>{
  comments = payload.comments
  deleteline = payload.deleteline
  var blockObj = editors.find(obj => { return obj.blockId == payload.file })
  blockObj.editor.removeLineClass(parseInt(deleteline-1), 'wrap', 'CodeMirror-activeline-background')
})

socket.on('is typing', (payload) => {
  if (uid != payload.uid) {
    $('#show-is-typing').text(payload.text);
  }
})

/**
 * Run code
 */
const term = new Terminal({
  cols: 60,
  rows: 10,
  cursorBlink: true
})
term.open(document.getElementById('xterm-container'), false)
term._initialized = true;

var shellprompt = '\033[1;3;31m$ \033[0m';

term.prompt = function () {
  term.write('\r\n' + shellprompt);
};
term.prompt()
term.on('key', function (key, ev) {
  var printable = (
    !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
  );

  if (ev.keyCode == 13) {
    term.prompt();
  } else if (ev.keyCode == 8) {
    // Do not delete the prompt
    if (term.x > 2) {
      term.write('\b \b');
    }
  } else if (printable) {
    // console.log(`printable : ${key}`)
    term.write(key);
  }
});

function addDivOutput(textOutput, blockId){
      var divisionOutput = document.createElement("div")
      var divisionCodeBlock = document.getElementById(blockId + "-div")
      var prefomattedText = document.createElement("pre")

      divisionOutput.setAttribute("id", blockId + "-output")
      prefomattedText.setAttribute("id", blockId + "-pre")
      prefomattedText.appendChild(textOutput)
      divisionOutput.appendChild(prefomattedText)
      divisionCodeBlock.appendChild(divisionOutput)

      sizeOutputObjects++;
}

socket.on('show output', (payload) => {
  var textOutput = document.createTextNode(payload)
  var blockId = editors[detectFocusBlock].blockId
  if(payload != "don\'t have output"){
    if(blockId in output){
      output[blockId] = textOutput
      var preformattedText = document.getElementById(blockId + "-pre")
      preformattedText.removeChild(preformattedText.childNodes[0])
      preformattedText.appendChild(textOutput)
    } else {
      output[blockId] = textOutput
      addDivOutput(output[blockId], blockId)
      console.log("Output : " + payload)
    }
  }

})

//อัพเดท focus block ของทั้ง 2 คน
socket.on('focus block', (payload) => {
  detectFocusBlock = payload
})

/**
 * Pause running code
 */
function pauseRunCode() {
  socket.emit('pause run code',{})
}

/**
 * Run code
 */
function runCode() {
  socket.emit('run code', {
    codeFocusBlock: getCodeFocusBlock(),
    codeAllBlock: codeAllBlock,
    focusBlock: detectFocusBlock
  })
  term.writeln('Running pytest.py...')
}

/**
 * Restart a kernel
 */
function reKernel(){
  socket.emit('restart a kernel')
}

socket.on("restart a kernel", (payload) => {
  var keysList = Object.keys(output)
  console.log(keysList)
  for (key in keysList) {
    var divisionCodeBlock = document.getElementById(keysList[key] + "-div")
    console.log("divisionCodeBlock : " + divisionCodeBlock + ", Key : " + keysList[key])
    divisionCodeBlock.removeChild(divisionCodeBlock.childNodes[2])
  }
  output = {}
  sizeOutputObjects = 0
  term.writeln('Restart a kernel successes!')
})

/**
 * Add code block
 */
function addBlock(){
  // var key = 'Block:' + queueBlock.toString()
  // var value = ""
  // var newObjectBlock = getBlock(key, value)
  // codeAllBlock.splice(getIndexBlock(key), 0, newObjectBlock)
  // console.log(codeAllBlock)
  // var index = getIndexBlock(key)
  // editor[key].on('focus', ()=>{
  //   detectFocusBlock = key
  //   setOnChangeFocusBlock(key)
  //   console.log("detectFocusBlock : " + key)
  // })
  // queueBlock++
  // console.log("Add " + editor[key] + " Success!!!");

  // random block id
  var random = '_' + Math.random().toString(36).substr(2, 9);
  console.log("random : " + random.toString())
  socket.emit('add block', { blockId: random, index: detectFocusBlock+1, allBlockId: editors.map(function(obj) { return obj.blockId }) });
}

/**
 * Submit code
 */
function submitCode() {
  socket.emit('submit code', {
    mode: 'button submit',
    uid: uid,
    code: getAllFileEditor()
  })
  term.writeln('Scoring pytest.py...')
}

/**
 * Clear Terminal
 */
function clearTerminal() {
  term.clear()
}

/**
 * Send Message
 */
function sendMessage() {
  if (document.getElementById("inputMessage").value != '') {
    socket.emit('send message', {
      uid: uid,
      message:  document.getElementById("inputMessage").value
    })
  }
}

/**
 * Send Active Tab
 */
function sendActiveTab(tab) {
  socket.emit('send active tab', {
    uid: uid,
    activeTab: tab
  })
}

/**
 * Show score dialog
 */
socket.on('show score', (payload) => {
  console.log(payload)
  $('#showScore-modal').modal('hide')
  $('#showScore-modal').modal('show')
  $('p#show-point').text("Your score is "+parseFloat(payload.score).toFixed(2)+" points.");
  if (uid == payload.uid) {
    $('p#show-avg-point').text("Average Score : "+parseFloat(payload.avgScore).toFixed(2)+" points");
  }
  $('#showScore-modal')
  .modal({
    closable  : true,
    onApprove : function() {

    }
  })
  .modal('show')
})

/**
 * Auto update score
 */
socket.on('pause run code', (payload) => {
  term.writeln('Stop running pytest.py...')
})

/**
 * Auto update score
 */
socket.on('auto update score', (payload) => {
  socket.emit('submit code', {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor()
  })

})

/**
 * Auto update score
 */
socket.on('show auto update score', (payload) => {
  console.log(payload)
  $('p#project-score-point').text("score : " + parseFloat(payload.score));
  if (uid == payload.uid) {
    $('#user-point-label').text('score: ' + parseFloat(payload.avgScore).toFixed(2));
  } else {
    $('#partner-point-label').text('score: ' + parseFloat(payload.avgScore).toFixed(2));
  }

})

/**
 * Partner Active Tab
 */
socket.on('show partner active tab', (payload) => {
  if(payload.uid !== uid){
    $('#'+partnerTab+'-file-icon').replaceWith('<div id="'+partnerTab+'-file-icon"/>');

    //set new partner actice tab
    partnerTab = payload.activeTab
    $('#'+partnerTab+'-file-icon').replaceWith('<img id="'+partnerTab+'-file-icon" class="ui avatar image partner-file-icon" src="'+partner_img+'" style="position: absolute; margin-left: -32px; margin-top: -5px;"/>');
  }
})

/**
 * set editor value into open tab
 */
socket.on('set editor open tab', (payload) => {
  var code = JSON.parse(payload.editor)
  var fileName = payload.fileName
  editors[fileName].setValue(code[fileName])
  for(var i in comments){
    editors[comments[i].file].addLineClass(parseInt(comments[i].line)-1, 'wrap', 'CodeMirror-activeline-background')
  }
})

/**
 * Terminal socket
 */
socket.on('term update', (payload) => {
  term.writeln(payload)
  term.prompt()
})

/**
 * Terminal socket
 */
socket.on('update message', (payload) => {
  updateScroll()
  if (payload.user._id === uid) {
    $(".message-list").append("<li class='ui item'><a class='ui avatar image'></a><div class='content'></div><div class='description curve-box-user'><p>"+ payload.message.message +"</p></div></li>");
    $("#inputMessage").val("")
    // socket.emit('is typing', {
    //   uid: uid,
    //   text: ''
    // })
  } else {
    $(".message-list").append("<li class='ui item'><a class='ui avatar image'><img src='"+ payload.user.img +"'></a><div class='description curve-box'><p>"+ payload.message.message +"</p></div></li>");
  }
})

socket.on('download file', (payload) => {
  var projectId = payload
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = '../project_files/'+projectId+'/'+projectId+'.zip'
  a.download = projectId+'.zip'
  a.click();
  document.body.removeChild(a);
})

/**
 * WebRTC TEST MUTING
 */
function muteEvent(b) {
  if ($(b).hasClass("active")) {
    webrtc.mute();
  }
  else {
    webrtc.unmute();
  }
}
function videoEvent(b) {
  if ($(b).hasClass("active")) {
    webrtc.pauseVideo();
  }
  else {
    webrtc.resumeVideo();
  }
}
// attach ready event -- Video Toggle
$(document)
  .ready(function () {
    $('.ui.video.toggle.button')
      .state({
        text: {
          inactive: '<i class="pause circle icon"/>',
          active: '<i class="play video icon"/>'
        }
      });
    $('.ui.mute.toggle.button')
      .state({
        text: {
          inactive: '<i class="mute icon"/>',
          active: '<i class="unmute icon"/>'
        }
      });
    // $('#inputMessage').keydown(function() {
    //   socket.emit('is typing', {
    //     uid: uid,
    //     text: `${user} is typing...`
    //   })
    // });
    // $('#inputMessage').keyup(function() {
    //   socket.emit('is typing', {
    //     uid: uid,
    //     text: ''
    //   })
    // });
    $('#inputMessage').change(function() {
      if($('#inputMessage').val() != "") {
        console.log("is typing")
        socket.emit('is typing', {
              uid: uid,
              text: `${user} is typing...`
            })
      } else {
        socket.emit('is typing', {
              uid: uid,
              text: ''
            })
      }
    });
    $('#inputMessage').keydown(function(e) {
      if (e.keyCode == 13) {
        sendMessage()
      }
    });
    console.log("is typing : " + $('#inputMessage').val())
    updateScroll();
  });
$(document)
.ready(function () {
  if($('#inputMessage').val() != "") {
    console.log("is typing")
    socket.emit('is typing', {
          uid: uid,
          text: `${user} is typing...`
        })
  } else {
    socket.emit('is typing', {
          uid: uid,
          text: ''
        })
  }
});

$(function(){

  console.log("is typing : " + $('#inputMessage').val())
  if($('#inputMessage').val() != "") {
    console.log("is typing")
    socket.emit('is typing', {
          uid: uid,
          text: `${user} is typing...`
        })
  } else {
    socket.emit('is typing', {
          uid: uid,
          text: ''
        })
  }

  var acc = 0;
  var session_flag = 0;
  // send active time
  setInterval(function(){
    const counts = $('#counts_min_sec').attr('data-count');
    const min = $('#counts_min_sec').attr('data-min');
    const sec = $('#counts_min_sec').attr('data-sec');
    if(roles.user === "reviewer" && counts !== undefined && session_flag === 0) {
      session_flag = 1;
      acc = counts;
    }else if(roles.user === "coder" && session_flag === 1){
      session_flag = 0;
    } else if(roles.user === "reviewer" && counts >= 0 && session_flag === 1) {
      socket.emit('reviewer active time', {
        counts: counts,
        mins : pad(parseInt((counts-acc)/60)),
        secs: pad((counts-acc)%60)
      })
    }
  }, 1000);

});

console.log("is typing : " + $('#inputMessage').val())
if($('#inputMessage').val() != "") {
  console.log("is typing")
  socket.emit('is typing', {
        uid: uid,
        text: `${user} is typing...`
      })
} else {
  socket.emit('is typing', {
        uid: uid,
        text: ''
      })
}

$('.ui.video.toggle.button')
  .on('click', handler.activate);
$('.ui.video.toggle.button')
  .state({
    text: {
      inactive: '<i class="pause circle icon"/>',
      active: '<i class="play video icon"/>'
    }
  });
$('.ui.mute.toggle.button')
  .on('click', handler.activate);
$('.ui.mute.toggle.button')
  .state({
    text: {
      inactive: '<i class="mute icon"/>',
      active: '<i class="unmute icon"/>'
    }
  });

function switchRole() {
  socket.emit('switch role')
}

function updateScroll(){
  // $(".chat").animate({ scrollTop: $(document).height() }, "fast");
  $(".chat-history").animate({ scrollTop: $('.message-list').height() }, "fast");
}

function pad ( val ) { return val > 9 ? val : "0" + val; }

//add file tab
function addFile(){
  $('#filename-modal').modal('show')
  $('.filename').val('')

  //disable create button when input is empty
  $('#createBtn').prop('disabled', true);
  $('.filename').keyup(function() {
    var disable = false;
    var isExists = false;
    var fileName = $('.filename').val()
    isExists = projectFiles.indexOf(fileName)

    $('.filename').each(function() {
      if ($(this).val() == "" || isExists!=-1 || (!fileName.match(/^[0-9a-zA-Z\.]*$/)) || fileName.indexOf('.') !== -1) {
        disable = true;
        if(isExists!=-1){
          $('.file.name.exists.warning').html('<p style="margin-left:95px; margin-top:5px; color: #db2828;">This File name already exists.</p>')
        }
        if(!fileName.match(/^[0-9a-zA-Z\.]*$/) || fileName.indexOf('.') !== -1){
          $('.file.name.exists.warning').html('<p style="margin-left:95px; margin-top:5px; color: #db2828;">Filename should not have special characters.</p>')
        }
      }else{
        $('.file.name.exists.warning').html('')
      }
    });
    $('#createBtn').prop('disabled', disable);
  });
}

function getActiveTab(fileName){
  var isNewTab = true
  var openNewTab = ''
  if(fileName!='main'){
    var fileTab = document.getElementById("file-tabs").children;
    for(var i=0; i<fileTab.length; i++){
      if(fileName==fileTab[i].id){
        isNewTab = false
      }
    }
    //open tab which is already closed
    if(isNewTab&&(isCloseTab==false)){
      openTab(fileName)
    }
  }

  if(isCloseTab){currentTab='main'; fileName='main';}
  //old tab
  $('#'+currentTab).removeClass('active');
  $('#'+currentTab+'-tab').removeClass('active');
  $('#'+currentTab+'-file').removeClass('file-active');
  $('#'+currentTab+'-header').removeClass('file-active');

  //new tab
  $('#'+fileName).addClass('active');
  $('#'+fileName+'-tab').addClass('active');
  $('#'+fileName+'-file').addClass('file-active');
  $('#'+fileName+'-header').addClass('file-active');

  currentTab = fileName
  setTimeout(function() {
    editors[fileName].refresh();
  }, 1);
  sendActiveTab(currentTab)
  isCloseTab = false
}

function closeTab(fileName){
  var tab = document.getElementById(fileName);
  tab.remove();
  var tabContent = document.getElementById(fileName+'-tab');
  tabContent.remove();
  delete editors[fileName]
  $(".file.menu").children('a').first().click();
  $("#main").click();
  isCloseTab = true;
  var fileTab = document.getElementById("file-tabs").children;
}

function openTab(fileName) {
  $('.add-file').closest('a').before('<a class="item" id="'+fileName+'" data-tab="' + fileName + '" onClick="getActiveTab(\''+fileName+'\')">'+ fileName + '.py <span onClick="closeTab(\''+fileName+'\')"><i class="delete icon" id="close-tab-icon"></i></span></a>');
  $('.tab-content').append('<div class="ui bottom attached tab segment" id="'+fileName+'-tab" data-tab="' + fileName + '"> <textarea class="show" id="'+fileName+'text"></textarea></div>');
  $('.menu .item').tab();
  newEditorFacade(fileName)
  socket.emit('open tab', fileName)
}

function createFile(){
  var fileName =  $('.filename').val()
  socket.emit('create file', fileName)
}

function exportSingleFile(fileName, text){
  var element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', fileName+'.py');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function showExportModal(){
  $('#export-modal').modal('show')
}

function showDeleteFileModal(fileName){
  $('#'+fileName+'-delete-file-modal').modal('show')
}

function deleteFile(fileName){
  socket.emit('delete file', fileName)
}

function onClickExport(){
  var filenameList = []
  $('[name="checkbox-file"]').each( function (){
    if($(this).prop('checked') == true){
        filenameList.push($(this).val())
    }
  })
  socket.emit('export file', {
    fileNameList: filenameList,
    code: getAllFileEditor()
  })
  // exportSingleFile(fileName, text)
}

function setOnChangeEditer(fileName) {
  /**
   * Local editor value is changing, to handle that we'll emit our changes to server
   */
  var blockObj = editors.find(obj => { return obj.blockId == fileName })
  blockObj.editor.on('change', (ins, data) => {

    var text = data.text.toString().charCodeAt(0)
    console.log("data.text.toString() : " + data.text.toString())
    var enterline = parseInt(data.to.line)+1
    var remove = data.removed
    var isEnter = false
    var isDelete = false

    //check when enter new line
    if(text==44){
      console.log('enter '+enterline)
        for(var i in comments){
          if((comments[i].line > enterline) && (comments[i].file==fileName)){
            isEnter = true
            comments[i].line = parseInt(comments[i].line)+1
          }
        }
      socket.emit('move hilight',{
        fileName: fileName,
        comments: comments,
        enterline: enterline,
        isEnter: isEnter
      })
    }

    //check when delete line
    if(remove.length==2){
      for(var i in comments){
        if((comments[i].line > enterline-1) && (comments[i].file==fileName)){
          isDelete = true
          comments[i].line = parseInt(comments[i].line)-1
        }
      }
      socket.emit('move hilight',{
        fileName: fileName,
        comments: comments,
        enterline: enterline,
        isDelete: isDelete,
      })
    }

    socket.emit('code change', {
      code: data,
      editor: blockObj.editor.getValue(),
      user: user,
      enterline: enterline,
      isEnter: isEnter,
      isDelete: isDelete,
      currentTab: fileName,
      fileName: fileName
    })
  })
}

function setOnDoubleClickEditor(fileName) {
  /**
   * Code review modal
   */
  var blockObj = editors.find(obj => { return obj.blockId == fileName })
  blockObj.editor.on('dblclick', () => {
    let A1 = blockObj.editor.getCursor().line
    let A2 = blockObj.editor.getCursor().ch
    let B1 = blockObj.editor.findWordAt({
      line: A1,
      ch: A2
    }).anchor.ch
    let B2 = blockObj.editor.findWordAt({
      line: A1,
      ch: A2
    }).head.ch
    $('input.disabled.line.no').val(A1 + 1)
    $('input.disabled.file.name').val(fileName+".py")
    $('input.hidden.file.name').val(fileName)
    let line = $('input.disabled.line.no').val()
    switch (roles.user) {
      case 'coder':
        for(var i in comments){
          if (comments[i].file == fileName && comments[i].line == parseInt(line)) {
            $('textarea.line.coder.disabled.description').val(comments[i].description)
            break
          }else{
            $('textarea.line.coder.disabled.description').val('')
          }
        }
        $('.ui.coder.small.modal').modal('show')
        break
      case 'reviewer':
        for(var i in comments){
          if (comments[i].file == fileName && comments[i].line == parseInt(line)) {
            $('textarea.line.reviewer.description').val(comments[i].description)
            break
          }else{
            $('textarea.line.reviewer.description').val('')
          }
        }
        $('.ui.reviewer.small.modal').modal('show')
        break
    }
  })
}

function getAllFileEditor() {
  var codeEditors = {};
  projectFiles.forEach(runCodeEachFile);
  function runCodeEachFile(fileName) {
    var blockObj = editors.find(obj => { return obj.blockId == fileName })
    codeEditors[fileName] = blockObj.editor.getValue();
  }
  return codeEditors;
}

function getCodeFocusBlock() {
  var codeFocusBlock = editors[detectFocusBlock].editor.getValue();
  return codeFocusBlock;
}

function setCodeBlock(key){
  var index = getIndexBlock(key)
  var objectBlock = codeAllBlock[index]
  objectBlock["value"] = editors[key].getValue()
}

function newEditorFacade(fileName) {
  setEditor(fileName)
  setOnChangeEditer(fileName)
  setOnDoubleClickEditor(fileName)

  //setup partner active tab
  if(fileName == "main") {
    $('#'+partnerTab+'-file-icon').replaceWith('<img id="'+partnerTab+'-file-icon" class="ui avatar image partner-file-icon" src="'+partner_img+'" style="position: absolute; margin-left: -32px; margin-top: -5px; width:20px; height:20px;"/>');
  } else {
    $('#'+fileName+'-file-icon').replaceWith('<div id="'+fileName+'-file-icon"/>');
  }
}

function storeActiveTime() {
  const counts = $('#counts_min_sec').attr('data-count');
  if(counts !== undefined) {
    socket.emit('save active time',{
      uid: uid,
      time: counts
    })
  }
}
