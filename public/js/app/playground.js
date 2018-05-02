/**
 * Dependencies declaration
 */
const socket = io()
const roles = {
  user: '',
  partner: ''
}
var comments = null

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
console.log(projectFiles)
var currentTab = 'main'
let editor = {};
projectFiles.forEach(setEditor);
projectFiles.forEach(setOnChangeEditer);
getActiveTab('main');

function setEditor(fileName){
  if(!(fileName in editor)) {
    editor[fileName] = CodeMirror.fromTextArea(document.getElementById(fileName+"text"), {
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
  }
  console.log(editor)
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
    editor[fileName].setOption("theme", theme);
  }
}

/**
 * Code review modal
 */
editor[currentTab].on('dblclick', () => {
  let A1 = editor.getCursor().line
  let A2 = editor.getCursor().ch
  let B1 = editor.findWordAt({
    line: A1,
    ch: A2
  }).anchor.ch
  let B2 = editor.findWordAt({
    line: A1,
    ch: A2
  }).head.ch
  $('input.disabled.line.no').val(A1 + 1)
  let line = $('input.disabled.line.no').val()
  switch (roles.user) {
    case 'coder':    
      for(var i in comments){
        if (comments[i].line == parseInt(line)) {
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
        if (comments[i].line == parseInt(line)) {
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
  var editorValues = JSON.parse(payload.editor);
  projectFiles.forEach(setEditorValue);
  console.log(editorValues)

  function setEditorValue(fileName) {
    editor[fileName].setValue(editorValues[fileName])
  }

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
  payload.map((comment) => {
      editor.addLineClass(parseInt(comment.line)-1, 'wrap', 'CodeMirror-activeline-background')
  })
})

/**
 * Update tab when create or delete
 */
socket.on('update tab', (payload) => {
  var fileName = payload.fileName
  var action = payload.action
  console.log(action)
  if(action=='create'){
    var id = document.getElementById("file-tabs").childElementCount;
    $('.add-file').closest('a').before('<a class="item" id="'+fileName+'" data-tab="' + fileName + '" onClick="getActiveTab(\''+fileName+'\')">'+ fileName + '.py <span onClick="deleteFile(\''+fileName+'\')"><i class="delete icon" id="delete-icon"></i></span></a>');
    $('.tab-content').append('<div class="ui bottom attached tab segment" data-tab="' + fileName + '"> <textarea class="show" id="'+fileName+'text"></textarea></div>');
    $('.menu .item').tab();
  } else{
    var tab = document.getElementById(fileName);
    tab.remove();
    $(".file.menu").children('a').first().click();
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
  if (user === payload.roles.reviewer) {
    roles.user = 'reviewer'
    roles.partner = 'coder'
    projectFiles.forEach(setOptionFileNoCursor)
  } else {
    roles.user = 'coder'
    roles.partner = 'reviewer'
    projectFiles.forEach(setOptionFileShowCursor)
  }
  
  function setOptionFileNoCursor(fileName) {
    editor[fileName].setOption('readOnly', 'nocursor')
  }
  function setOptionFileShowCursor(fileName) {
    editor[fileName].setOption('readOnly', false)
  }

  $(".partner-role-label").text(`${roles.partner}`)
  $(".user-role-label").text(`${roles.user}`)
  // startCountdown()
})

/**
 * If user exit or going elsewhere which can be caused this project window closed
 * `beforeunload` event will fired and sending client disconnection to the server
 */
$(window).on('beforeunload', () => {
  socket.disconnect()
})

/**
 * Recieve new changes editor value from server and applied them to local editor
 */
socket.on('editor update', (payload) => {
  editor[payload.fileName].replaceRange(payload.text, payload.from, payload.to)
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
    line: parseInt($('input.disabled.line.no').val()),
    description: $('textarea.line.reviewer.description').val(),
  })
  $('textarea.line.description').val('')
}

socket.on('new review', (payload) => {
  comments = payload
  comments.map((comment) => {
    editor.addLineClass(parseInt(comment.line-1), 'wrap', 'CodeMirror-activeline-background')
  })
})

function deleteReview() {
  socket.emit('delete review', {
    line: $('input.disabled.line.no').val(),
    description: $('textarea.line.reviewer.description').val(),
  })
}

socket.on('update review', (payload) =>{
  comments = payload.comments
  deleteline = payload.deleteline
  editor.removeLineClass(parseInt(deleteline-1), 'wrap', 'CodeMirror-activeline-background')
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
    console.log()
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
    code: editor.getValue()
  })
  term.writeln('Running pytest.py...')
}

/**
 * Submit code
 */
function submitCode() {
  socket.emit('submit code', {
    mode: 'button submit',
    uid: uid,
    code: editor.getValue()
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
    code: editor[currentTab].getValue()
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
  $('#'+currentTab).removeClass('active');
  $('#'+currentTab+'-file').removeClass('file-active');
  $('#'+currentTab+'-header').removeClass('file-active');
  $('#'+fileName).addClass('active');
  $('#'+fileName+'-file').addClass('file-active');
  $('#'+fileName+'-header').addClass('file-active');
  currentTab = fileName
  currentTab = fileName
  setEditor(fileName)
  console.log(editor)
  console.log(currentTab)
}

function createFile(){
  var fileName =  $('.filename').val()
  socket.emit('create file', fileName)
}

function deleteFile(fileName){
  socket.emit('delete file', fileName)
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

function onClickExport(){
  var text = editor.getValue()
  var fileName = currentTab
  exportSingleFile(fileName, text)
}

function setOnChangeEditer(fileName) {
  /**
   * Local editor value is changing, to handle that we'll emit our changes to server
   */
  editor[fileName].on('change', (ins, data) => {
    socket.emit('code change', {
      fileName : fileName,
      code: data,
      editor: editor[fileName].getValue(),
      currentTab: fileName
    })

    var text = data.text.toString().charCodeAt(0)
    var enterline = parseInt(data.to.line)+1
    var remove = data.removed
    var isEnter = false
    var isDelete = false

    //check when enter new line
    if(text==44){
      console.log('enter '+enterline)
        for(var i in comments){  
          if(comments[i].line > enterline){          
            isEnter = true
            comments[i].line = parseInt(comments[i].line)+1
          }
        }
      socket.emit('move hilight',{
        comments: comments,
        enterline: enterline,
        isEnter: isEnter
      })
    }

    //check when delete line
    if(remove.length==2){
      for(var i in comments){          
        if(comments[i].line > enterline-1){
          isDelete = true        
          comments[i].line = parseInt(comments[i].line)-1
        }
      }
      socket.emit('move hilight',{
        comments: comments,
        enterline: enterline,
        isDelete: isDelete,
      })
    }

    
  })
}

// function setOnEditerUpdate(fileName) {
//   editor[currentTab].replaceRange(payload.text, payload.from, payload.to)
// }
