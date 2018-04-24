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
let editor = CodeMirror.fromTextArea(document.getElementById("demotext"), {
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

/**
 * Code Mirror Change Theme
 */
var isLight = false;

function changeTheme() {
  if (!isLight) {
    var theme = "default";
    editor.setOption("theme", theme);
    location.hash = "#" + theme;
  }
  else {
    var theme = "material";
    editor.setOption("theme", theme);
    location.hash = "#" + theme;
  }
  isLight = !isLight;
}

/**
 * Code review modal
 */
editor.on('dblclick', () => {
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
  editor.setValue(payload.editor)
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
    editor.setOption('readOnly', 'nocursor')
    roles.user = 'reviewer'
    roles.partner = 'coder'
  } else {
    roles.user = 'coder'
    roles.partner = 'reviewer'
    editor.setOption('readOnly', false)
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
  socket.disconnect()
})

/**
 * Local editor value is changing, to handle that we'll emit our changes to server
 */
editor.on('change', (ins, data) => {
  socket.emit('code change', {
    code: data,
    editor: editor.getValue()
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

/**
 * Recieve new changes editor value from server and applied them to local editor
 */
socket.on('editor update', (payload) => {
  editor.replaceRange(payload.text, payload.from, payload.to)
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
  // socket.emit('delete review', {
  //   line: $('input.disabled.line.no').val(),
  //   description: $('textarea.line.reviewer.description').val(),
  // })
  // editor.addLineClass(parseInt(line-1), 'wrap', 'CodeMirror-unactiveline-background')
  // $('textarea.line.description').val('')
  
}

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
    code: editor.getValue()
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

  var acc = 0;
  var session_flag = 0;
  // send active time
  setInterval(function(){
    const counts = $('#counts_min_sec').attr('data-count');
    const min = $('#counts_min_sec').attr('data-min');
    const sec = $('#counts_min_sec').attr('data-sec');
    if(roles.user === "reviewer" && session_flag === 0) {
      session_flag = 1;
      acc = counts;
    }else if(roles.user === "coder" && session_flag === 1){
      session_flag = 0;
    } else if(roles.user === "reviewer" && counts >= 0) {
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
  $(".chat").animate({ scrollTop: $('.message-list').height() }, "fast");
}

function pad ( val ) { return val > 9 ? val : "0" + val; }

