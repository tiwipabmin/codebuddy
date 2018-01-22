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
      comments.map((comment) => {
        console.log(comment)
        if (comment.line == line) {
          $('textarea.line.coder.disabled.description').val(comment.description)
        }
      })
      $('.ui.coder.small.modal').modal('show')
      break
    case 'reviewer':
      comments.map((comment) => {
        if (comment.line == line) {
          $('textarea.line.reviewer.description').val(comment.description)
        }
      })
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
    $(".countdown").html(`${payload.minutes} : ${payload.seconds}`)
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
 * Local editor value is changing, to handle that we'll emit our changes to server
 */
editor.on('change', (ins, data) => {
  socket.emit('code change', {
    code: data,
    editor: editor.getValue()
  })
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
    $(".user.status").html(`<strong><em><i class='green circle icon'></i>${partner} (${roles.partner})</em></strong>`)
  } else {
    $(".user.status").html(`<strong><em><i class='grey circle icon'></i>${partner} (${roles.partner})</em></strong>`)
  }
})

function submitReview() {
  socket.emit('submit review', {
    line: $('input.disabled.line.no').val(),
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
  cols: 120,
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
  $('a#project-score-point').text("score : " + parseFloat(payload.score));
  if (uid == payload.uid) {
    $('#user-point-label').text(parseFloat(payload.avgScore).toFixed(2)); 	
  } else {
    $('#partner-point-label').text(parseFloat(payload.avgScore).toFixed(2));
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
  $(".message-list").append("<li class='ui item'><a class='ui avatar image'><img src='"+ payload.user.img +"'></a><div class='content'></div><div class='description curve-box'><p>"+ payload.message.message +"</p></div></li>");
  updateScroll()
  if (payload.user._id === uid) {
    $("#inputMessage").val("")
    socket.emit('is typing', {
      uid: uid,
      text: ''
    })
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
    alert(b);
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
  $(".chat").animate({ scrollTop: $('.message-list').height() }, "fast");
}

