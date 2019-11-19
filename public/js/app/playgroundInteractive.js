$(document).ready(function() {
  $("#confirmRoleChange").modal({
    closable: false,
    onDeny: function() {
      $("#confirmRoleChange").modal("hide");
    },
    onApprove: function() {
      socket.emit("switch role", {
        user: user,
        action: "switch role",
        status: $("#ok_button_srm").attr("value")
      });
    }
  });

  $("#rejectJoining").modal({
    closable: false,
    onApprove: function() {
      $("#global_loader").attr({
        style: "display: block; position: fixed;"
      });
    }
  });
});

/**
 * Dependencies declaration
 */
const socket = io();
const roles = {
  user: "",
  partner: ""
};
var comments = [];
var code = null;

// var webrtc = new SimpleWebRTC({
//   // the id/element dom element that will hold "our" video
//   localVideoEl: 'localVideo',
//   // the id/element dom element that will hold remote videos
//   remoteVideosEl: 'remoteVideo',
//   // immediately ask for camera access
//   autoRequestMedia: true
// });

/**
 * get query parameter from URL
 * @param {String} name parameter name that you want to get value from
 * http://stackoverflow.com/a/901144/4181203
 */
function getParameterByName(name) {
  const url = window.location.href;
  const param = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + param + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);

  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Initiate local editor
 */
var projectFiles = JSON.parse(document.getElementById("projectFiles").value);
console.log("projectFiles")
console.log(projectFiles)
var currentTab = "main";
var partnerTab = "main";
var isCloseTab = false;
var editors = [];
var output = {};
var sizeOutputObjects = 0;
var detectFocusBlock = 0;
var executingBlock;
var hasError = false;

projectFiles.forEach(newEditorFacade);
// getActiveTab("main");

var segmentCodeBlock = document.getElementById("segmentCodeBlock");

function setEditor(fileName) {
  var cm = CodeMirror.fromTextArea(
    document.getElementById(fileName + "-text"),
    {
      lineNumbers: true,
      mode: {
        name: "python",
        version: 3,
        singleLineStringErrors: false,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true
      },
      theme: "material",
      indentUnit: 4,
      matchBrackets: true
    }
  );
  cm.addKeyMap({
    "Alt-R": function(cm) {
      runCode();
    },
    "Alt-N": function(cm) {
      addBlock();
    },
    "Alt-D": function(cm) {
      deleteBlock();
    },
    "Alt-Up": function(cm) {
      moveBlock("up");
    },
    "Alt-Down": function(cm) {
      moveBlock("down");
    }
  });
  cm.on("focus", cm => {
    var prevFocusBlock = detectFocusBlock;

    /**
     * find index of focusing codemirror in editors array.
     **/
    detectFocusBlock = editors
      .map(function(obj) {
        return obj.editor;
      })
      .indexOf(cm);

    socket.emit("codemirror on focus", {
      prevFocus: prevFocusBlock,
      newFocus: detectFocusBlock
    });
    console.log(`Detect focus block!! ${detectFocusBlock}`);
  });
  editors.push({ blockId: fileName, editor: cm });
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
  } else {
    var theme = "material";
    projectFiles.forEach(setTheme);
    location.hash = "#" + theme;
  }
  isLight = !isLight;

  function setTheme(fileName) {
    var blockObj = editors.find(obj => {
      return obj.blockId == fileName;
    });
    blockObj.editor.setOption("theme", theme);
  }
}

/**
 * User join the project
 */
socket.emit("load playground", { programming_style: "Interactive" });
socket.emit("join project", {
  pid: getParameterByName("pid"),
  username: user
});

// webrtc.on("readyToCall", function() {
//   // you can name it anything
//   webrtc.createRoom(getParameterByName("pid"));
//   webrtc.joinRoom(getParameterByName("pid"));
// });

/**
 * After user join the project, user will recieve initiate data to perform in local editor
 */
socket.on("init state", payload => {
  if (payload.editor != null) {
    // console.log("payload.editor ", payload.editor )
    var editorValues = JSON.parse(payload.editor);
    // console.log("editorValues", editorValues)
    projectFiles.forEach(setEditorValue);
  } else {
    editors[0].editor.setValue("");
  }
 
  function setEditorValue(fileName) {
    if (editorValues != null) {
      var blockObj = editors.find(obj => {
        return obj.blockId == fileName;
      });
      console.log("editors", editors)
      blockObj.editor.setValue(editorValues[fileName]);
      currentFileName = fileName;
    }
  }

  code = payload.editor;
});

/**
 * After user join the project, user will recieve initiate review to hilight in local editor
 */

socket.on("init reviews", payload => {
  comments = payload;
  for (var i in comments) {
    var blockObj = editors.find(obj => {
      return obj.blockId == comments[i].file;
    });
    blockObj.editor.addLineClass(
      parseInt(comments[i].line) - 1,
      "wrap",
      "CodeMirror-activeline-background"
    );
  }
});

/**
 * Update block when add or delete
 */
socket.on("update block", payload => {
  var blockId = payload.blockId;
  var index = payload.index;
  console.log("index ", index)
  console.log("blockId ", blockId)
  var action = payload.action;

  if (action == "add") {
    var divisionCodeBlock = document.createElement("div");
    var html =
      '<div class="code-block">' +
      '<div id="' +
      blockId +
      '-in">In [&nbsp;&nbsp;]:</div>' +
      '<div><textarea id="' +
      blockId +
      '-text"></textarea></div>' +
      "</div>" +
      '<div id="' +
      blockId +
      '-div-output" class="code-block">' +
      "<div></div>" +
      "</div>";

    divisionCodeBlock.className = "code-block-container";
    divisionCodeBlock.setAttribute("id", blockId + "-div");
    divisionCodeBlock.innerHTML = html;

    segmentCodeBlock.insertBefore(
      divisionCodeBlock,
      segmentCodeBlock.children[index]
    );

    /**
     * TODO: refactor setEditor with index parameter
     * add codemirror of new into editors array
     **/
    var cm = CodeMirror.fromTextArea(
      document.getElementById(blockId + "-text"),
      {
        lineNumbers: true,
        mode: {
          name: "python",
          version: 3,
          singleLineStringErrors: false,
          styleActiveLine: true,
          lineNumbers: true,
          lineWrapping: true
        },
        theme: "material",
        indentUnit: 4,
        matchBrackets: true
      }
    );

    cm.addKeyMap({
      "Alt-R": function(cm) {
        runCode();
      },
      "Alt-N": function(cm) {
        addBlock();
      },
      "Alt-D": function(cm) {
        deleteBlock();
      },
      "Alt-Up": function(cm) {
        moveBlock("up");
      },
      "Alt-Down": function(cm) {
        moveBlock("down");
      }
    });

    cm.on("focus", cm => {
      var prevFocusBlock = detectFocusBlock;

      /**
       * find index of focusing codemirror in editors array.
       **/
      detectFocusBlock = editors
        .map(function(obj) {
          return obj.editor;
        })
        .indexOf(cm);

      socket.emit("codemirror on focus", {
        prevFocus: prevFocusBlock,
        newFocus: detectFocusBlock
      });
    });

    console.log("editors ", editors)
    editors.splice(index, 0, { blockId: blockId, editor: cm });
    console.log("editors splice ", editors)
    projectFiles.splice(index, 0, blockId);
    setOnChangeEditer(blockId);
    setOnDoubleClickEditor(blockId);

    switch (roles.user) {
      case "coder":
        cm.setOption("readOnly", false); // show cursor
        break;
      case "reviewer":
        cm.setOption("readOnly", "nocursor"); // no cursor
        break;
    }
  } else {
    var divisionCodeBlock = document.getElementById(blockId + "-div");
    divisionCodeBlock.remove();

    editors.splice(detectFocusBlock, 1);
    projectFiles.splice(detectFocusBlock, 1);
  }
});

/**
 * If there's no one select the role, then first user that come to the project must choose one
 */
socket.on("role selection", payload => {
  $("#selectRole-modal").modal({
    closable: false,
    onDeny: function() {
      socket.emit("role selected", {
        select: 0,
        partner: payload.partner
      });
    },
    onApprove: function() {
      socket.emit("role selected", {
        select: 1,
        partner: payload.partner
      });
    }
  });
  $("#selectRole-modal").modal("show");
  $("#global_loader").attr("style", "display: none");
});

/**
 * If there's no one select the role, then first user that come to the project must choose one
 */
socket.on("confirm role change", payload => {
  $("#close_button_srm").attr("style", "display:none;");
  $("#ok_button_srm").attr("style", "display:none;");
  if (payload.status === "disconnect") {
    $("#global_loader").attr({
      style: "display: block; position: fixed;"
    });
    $("#header_serm").empty();
    $("#header_serm").text("เพื่อนของคุณออกจากหน้าเขียนโปรแกรมแล้วครับ/ค่ะ");
    $("#reviewer_button").attr("style", "display:none;");
    socket.emit("join project", {
      pid: getParameterByName("pid"),
      username: user
    });
  } else if (
    user === payload.projectRoles.roles.reviewer &&
    payload.numUser == 2
  ) {
    $("#header_srm").text('ถึงเวลาที่คุณเป็น "Coder" แล้วครับ/ค่ะ');
    $("#confirmRoleChange").modal("show");
  } else if (
    user === payload.projectRoles.roles.coder &&
    payload.numUser == 2
  ) {
    $("#header_srm").text('ถึงเวลาที่คุณเป็น "Reviewer" แล้วครับ/ค่ะ');
    $("#ok_button_srm").attr({
      style: "display:block;",
      value: payload.status
    });
    $("#confirmRoleChange").modal("show");
  } else if (payload.numUser == 1) {
    socket.emit("switch role", {
      user: user,
      action: "switch role"
    });
  }
});

socket.on("countdown", payload => {
  if (payload.minutes == "0" && payload.seconds <= 15) {
    $(".countdown").html(
      `<span style="color: red;"> ${pad(payload.minutes)} : ${pad(
        payload.seconds
      )}</span> <span style="font-size:12px;">mins</span>`
    );
    $(".auto-swap-warning").html(
      `<div class="ui circular labels" style="margin-top: 10px;"><a class="ui label">Auto swaping role in ${payload.seconds} secs</a></div>`
    );
  } else {
    $(".countdown").html(
      `${pad(payload.minutes)} : ${pad(
        payload.seconds
      )} <span style="font-size:12px;">mins</span>`
    );
    $(".auto-swap-warning").html(``);
  }
});

socket.on("reject joining", payload => {
  let a = document.getElementById("backToClass");
  a.click();
});

socket.on("clear interval", () => {
  socket.emit("clear interval");
});

socket.on("role updated", payload => {
  if (user === payload.projectRoles.roles.reviewer) {
    roles.user = "reviewer";
    roles.partner = "coder";
    $("#global_loader").attr("style", "display: none");
    projectFiles.forEach(setOptionFileNoCursor);
  } else if (user === payload.projectRoles.roles.coder) {
    roles.user = "coder";
    roles.partner = "reviewer";
    $("#global_loader").attr("style", "display: none");
    $("#close_button_srm").attr("style", "display:block;");
    projectFiles.forEach(setOptionFileShowCursor);
  } else {
    if (user === payload.project.creator) {
      roles.user = "coder";
      roles.partner = "reviewer";
    } else {
      roles.user = "reviewer";
      roles.partner = "coder";
    }
  }

  /**
   * Editor is configured cursor according to the user's role.
   * @param {object} fileName receive a file name.
   */
  function setOptionFileNoCursor(fileName) {
    var blockObj = editors.find(obj => {
      return obj.blockId == fileName;
    });
    blockObj.editor.setOption("readOnly", "nocursor");
  }
  function setOptionFileShowCursor(fileName) {
    var blockObj = editors.find(obj => {
      return obj.blockId == fileName;
    });
    blockObj.editor.setOption("readOnly", false);
  }

  $(".partner-role-label").text(`${roles.partner}`);
  $(".user-role-label").text(`${roles.user}`);
});

socket.on("show reviewer active time", payload => {
  if (roles.user === "coder" && payload.counts >= 0) {
    $("#buddy_counts_min_sec").show();
    $("#buddy_counts_min_sec").text(
      "Reviewer active time: " + payload.mins + ":" + payload.secs + " mins"
    );
  } else {
    $("#buddy_counts_min_sec").hide();
  }
});

/**
 * If user exit or going elsewhere which can be caused this project window closed
 * `beforeunload` event will fired and sending client disconnection to the server
 */
$(window).on("beforeunload", () => {
  // storeActiveTime()
  socket.emit("submit code", {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor()
  });
  socket.disconnect();
});

$(window).bind("hashchange", function() {
  // storeActiveTime()
  socket.emit("submit code", {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor()
  });
});

/**
 * Recieve new changes editor value from server and applied them to local editor
 */
socket.on("editor update", payload => {
  var blockObj = editors.find(obj => {
    return obj.blockId == payload.fileName;
  });
  blockObj.editor.replaceRange(payload.text, payload.from, payload.to);
  setTimeout(function() {
    blockObj.editor.refresh();
  }, 1);
});

socket.on("update status", payload => {
  if (payload.status && payload.numUser == 2) {
    $(".user.status").html(
      `<strong><em><i class='green circle icon'></i></em></strong>`
    );
  } else {
    $(".user.status").html(
      `<strong><em><i class='grey circle icon'></i></em></strong>`
    );
  }
});

function submitReview() {
  socket.emit("submit review", {
    file: $("input.hidden.file.name").val(),
    line: parseInt($("input.disabled.line.no").val()),
    description: $("textarea.line.reviewer.description").val()
  });
  $("textarea.line.description").val("");
}

socket.on("new review", payload => {
  comments = payload;
  comments.map(comment => {
    var blockObj = editors.find(obj => {
      return obj.blockId == comment.file;
    });
    blockObj.editor.addLineClass(
      parseInt(comment.line - 1),
      "wrap",
      "CodeMirror-activeline-background"
    );
  });
});

function deleteReview() {
  socket.emit("delete review", {
    file: $("input.hidden.file.name").val(),
    line: $("input.disabled.line.no").val(),
    description: $("textarea.line.reviewer.description").val()
  });
}

socket.on("update after delete review", payload => {
  comments = payload.comments;
  deleteline = payload.deleteline;
  var blockObj = editors.find(obj => {
    return obj.blockId == payload.file;
  });
  blockObj.editor.removeLineClass(
    parseInt(deleteline - 1),
    "wrap",
    "CodeMirror-activeline-background"
  );
});

socket.on("is typing", payload => {
  if (uid != payload.uid) {
    $("#show-is-typing").text(payload.text);
  }
});

function addDivOutput(textOutput, blockId) {
  var divisionCodeBlock = document.getElementById(blockId + "-div-output");
  var divisionOutput = document.createElement("div");
  var prefomattedText = document.createElement("pre");

  divisionOutput.setAttribute("id", blockId + "-stdout");
  prefomattedText.setAttribute("id", blockId + "-pre");
  prefomattedText.appendChild(textOutput);
  divisionOutput.appendChild(prefomattedText);
  divisionCodeBlock.appendChild(divisionOutput);
  sizeOutputObjects++;
}

socket.on("show output", payload => {
  var textOutput = document.createTextNode(payload);
  var blockId = editors[executingBlock].blockId;
  if (blockId in output) {
    output[blockId] = textOutput;
    var preformattedText = document.getElementById(blockId + "-pre");
    preformattedText.removeChild(preformattedText.childNodes[0]);
    preformattedText.appendChild(output[blockId]);
  } else {
    output[blockId] = textOutput;
    addDivOutput(output[blockId], blockId);
    console.log("Output : " + payload);
  }
});

socket.on("update execution count", payload => {
  var blockId = editors[executingBlock].blockId;
  document.getElementById(blockId + "-in").innerHTML = "In [" + payload + "]:";
});

socket.on("update block highlight", payload => {
  document.getElementById(
    editors[payload.prevFocus].blockId + "-div"
  ).style.border = "";
  document.getElementById(
    editors[payload.newFocus].blockId + "-div"
  ).style.border = "thin solid #2185d0";
  document.getElementById(
    editors[payload.newFocus].blockId + "-div"
  ).style.borderLeft = "thick solid #2185d0";
});

/**
 * Update focus block of both user
 **/
socket.on("focus block", payload => {
  executingBlock = payload;
  if (executingBlock != editors.length - 1) {
    detectFocusBlock += 1;
    socket.emit("codemirror on focus", {
      prevFocus: detectFocusBlock - 1,
      newFocus: detectFocusBlock
    });
    editors[detectFocusBlock].editor.focus();
    editors[detectFocusBlock].editor.setCursor(0, 0);
  }
});

/**
 * Run code
 */
function runCode() {
  socket.emit("run code", {
    codeFocusBlock: getCodeFocusBlock(),
    focusBlock: detectFocusBlock
  });
  socket.emit("save lines of code", {
    uid: uid
  });
}

/**
 * Restart a kernel
 */
function reKernel() {
  socket.emit("restart a kernel");
}

socket.on("restart a kernel", payload => {
  /**
   * remove output div
   **/
  var keysList = Object.keys(output);
  for (key in keysList) {
    var divisionCodeBlock = document.getElementById(keysList[key] + "-stdout");
    divisionCodeBlock.remove();
  }

  /**
   * reset execution count
   **/
  var allBlockId = editors.map(function(obj) {
    return obj.blockId;
  });
  for (i = 0; i < allBlockId.length; i++) {
    document.getElementById(allBlockId[i] + "-in").innerHTML =
      "In [&nbsp;&nbsp;]:";
  }

  output = {};
  sizeOutputObjects = 0;
});

/**
 * Add code block
 */
function addBlock() {
  /**
   * random block id
   **/
  var random = Math.random()
    .toString(36)
    .substr(2, 9);
  socket.emit("add block", {
    blockId: random,
    index: detectFocusBlock + 1,
    allBlockId: editors.map(function(obj) {
      return obj.blockId;
    })
  });
}

/**
 * Submit code
 */
function submitCode() {
  socket.emit("submit code", {
    mode: "button submit",
    uid: uid,
    code: getAllFileEditor()
  });
}

/**
 * Send Message
 */
function sendMessage() {
  if (document.getElementById("inputMessage").value != "") {
    socket.emit("send message", {
      uid: uid,
      message: document.getElementById("inputMessage").value
    });
  }
}

/**
 * Send Active Tab
 */
function sendActiveTab(tab) {
  socket.emit("send active tab", {
    uid: uid,
    activeTab: tab
  });
}

/**
 * Show score dialog
 */
socket.on("show score", payload => {
  $("#showScore-modal").modal("hide");
  $("#showScore-modal").modal("show");
  $("p#show-point").text(
    "Your score is " + parseFloat(payload.score).toFixed(2) + " points."
  );
  if (uid == payload.uid) {
    $("p#show-avg-point").text(
      "Average Score : " + parseFloat(payload.avgScore).toFixed(2) + " points"
    );
  }
  $("#showScore-modal")
    .modal({
      closable: true,
      onApprove: function() {}
    })
    .modal("show");
});

/**
 * Auto update score
 */
socket.on("auto update score", payload => {
  socket.emit("submit code", {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor()
  });
});

/**
 * Auto auto update score
 */
socket.on("show auto update score", payload => {
  $("p#project-score-point").text(
    "project score : " + parseFloat(payload.score)
  );
  if (uid == payload.uid) {
    $("#user-point-label").text(
      "average score: " + parseFloat(payload.avgScore).toFixed(2)
    );
  } else {
    $("#partner-point-label").text(
      "average score: " + parseFloat(payload.avgScore).toFixed(2)
    );
  }
});

/**
 * Partner Active Tab
 */
socket.on("show partner active tab", payload => {
  if (payload.uid !== uid) {
    $("#" + partnerTab + "-file-icon").replaceWith(
      '<div id="' + partnerTab + '-file-icon"/>'
    );

    /**
     * set new partner actice tab
     **/
    partnerTab = payload.activeTab;
    $("#" + partnerTab + "-file-icon").replaceWith(
      '<img id="' +
        partnerTab +
        '-file-icon" class="ui avatar image partner-file-icon" src="' +
        partner_img +
        '" style="position: absolute; margin-left: -32px; margin-top: -5px;"/>'
    );
  }
});

/**
 * set editor value into open tab
 */
socket.on("set editor open tab", payload => {
  var code = JSON.parse(payload.editor);
  var fileName = payload.fileName;
  editors[fileName].setValue(code[fileName]);
  for (var i in comments) {
    editors[comments[i].file].addLineClass(
      parseInt(comments[i].line) - 1,
      "wrap",
      "CodeMirror-activeline-background"
    );
  }
});

/**
 * Update message
 */
socket.on("update message", payload => {
  updateScroll();
  if (payload.user._id === uid) {
    $(".message-list").append(
      "<li class='ui item'><a class='ui avatar image'></a><div class='content'></div><div class='description curve-box-user'><p>" +
        payload.message.message +
        "</p></div></li>"
    );
    $("#inputMessage").val("");
  } else {
    $(".message-list").append(
      "<li class='ui item'><a class='ui avatar image'><img src='" +
        payload.user.img +
        "'></a><div class='description curve-box'><p>" +
        payload.message.message +
        "</p></div></li>"
    );
  }
});

socket.on("download file", payload => {
  let fileNameListLength = payload.fileNameListLength;
  let projectId = payload.projectId;
  let a = document.createElement("a");
  a.download;
  a.target = "_blank";
  a.style = "display: none";

  if (fileNameListLength === 1) {
    a.href = "/api/downloadFile?filePath=" + payload.filePath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    a.href = "/api/downloadFile?filePath=" + payload.filePath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
});

/**
 * WebRTC TEST MUTING
 */
function muteEvent(b) {
  if ($(b).hasClass("active")) {
    webrtc.mute();
  } else {
    webrtc.unmute();
  }
}
function videoEvent(b) {
  if ($(b).hasClass("active")) {
    webrtc.pauseVideo();
  } else {
    webrtc.resumeVideo();
  }
}

/**
 * attach ready event -- Video Toggle
 **/
$(document).ready(function() {
  $(".ui.video.toggle.button").state({
    text: {
      inactive: '<i class="pause circle icon"/>',
      active: '<i class="play video icon"/>'
    }
  });
  $(".ui.mute.toggle.button").state({
    text: {
      inactive: '<i class="mute icon"/>',
      active: '<i class="unmute icon"/>'
    }
  });
  $("#inputMessage").keydown(function() {
    socket.emit("is typing", {
      uid: uid,
      text: `${user} is typing...`
    });
    clearTimeout(parseInt($("#inputMessage").attr("data-timeId")));
  });
  $("#inputMessage").keyup(function() {
    let timeId = setTimeout(function() {
      socket.emit("is typing", {
        uid: uid,
        text: ""
      });
    }, 5000);
    $("#inputMessage").attr("data-timeId", timeId);
  });
  $("#inputMessage").keydown(function(e) {
    if (e.keyCode == 13) {
      sendMessage();
    }
  });
  updateScroll();
});

/**
 * is just jQuery short-hand for $(document).ready(function(){...})
 **/
$(function() {
  var acc = 0;
  var session_flag = 0;
  /**
   * send active time
   **/
  setInterval(function() {
    const counts = $("#counts_min_sec").attr("data-count");
    const min = $("#counts_min_sec").attr("data-min");
    const sec = $("#counts_min_sec").attr("data-sec");
    if (
      roles.user === "reviewer" &&
      counts !== undefined &&
      session_flag === 0
    ) {
      session_flag = 1;
      acc = counts;
    } else if (roles.user === "coder" && session_flag === 1) {
      session_flag = 0;
    } else if (roles.user === "reviewer" && counts >= 0 && session_flag === 1) {
      socket.emit("reviewer active time", {
        counts: counts,
        mins: pad(parseInt((counts - acc) / 60)),
        secs: pad((counts - acc) % 60)
      });
    }
  }, 1000);

  var lastSavedTime = 0;

  setInterval(function() {
    const counts = $("#counts_min_sec").attr("data-count");
    let add = counts - lastSavedTime;

    if (counts !== undefined && add > 0) {
      socket.emit("save active time", {
        uid: uid,
        time: add
      });

      lastSavedTime = counts;
    }
  }, 10000);
});

function switchRole() {
  socket.emit("switch role");
}

function updateScroll() {
  $(".chat-history").animate(
    { scrollTop: $(".message-list").height() },
    "fast"
  );
}

function pad(val) {
  return val > 9 ? val : "0" + val;
}

/**
 * add file tab
 **/
function addFile() {
  $("#filename-modal").modal("show");
  $(".filename").val("");

  /**
   * disable create button when input is empty
   **/
  $("#createBtn").prop("disabled", true);
  $(".filename").keyup(function() {
    var disable = false;
    var isExists = false;
    var fileName = $(".filename").val();
    isExists = projectFiles.indexOf(fileName);

    $(".filename").each(function() {
      if (
        $(this).val() == "" ||
        isExists != -1 ||
        !fileName.match(/^[0-9a-zA-Z\.]*$/) ||
        fileName.indexOf(".") !== -1
      ) {
        disable = true;
        if (isExists != -1) {
          $(".file.name.exists.warning").html(
            '<p style="margin-left:95px; margin-top:5px; color: #db2828;">This File name already exists.</p>'
          );
        }
        if (
          !fileName.match(/^[0-9a-zA-Z\.]*$/) ||
          fileName.indexOf(".") !== -1
        ) {
          $(".file.name.exists.warning").html(
            '<p style="margin-left:95px; margin-top:5px; color: #db2828;">Filename should not have special characters.</p>'
          );
        }
      } else {
        $(".file.name.exists.warning").html("");
      }
    });
    $("#createBtn").prop("disabled", disable);
  });
}

function getActiveTab(fileName) {
  var isNewTab = true;
  var openNewTab = "";
  if (fileName != "main") {
    var fileTab = document.getElementById("file-tabs").children;
    for (var i = 0; i < fileTab.length; i++) {
      if (fileName == fileTab[i].id) {
        isNewTab = false;
      }
    }
    /**
     * open tab which is already closed
     **/
    if (isNewTab && isCloseTab == false) {
      openTab(fileName);
    }
  }

  if (isCloseTab) {
    currentTab = "main";
    fileName = "main";
  }
  /**
   * old tab
   **/
  $("#" + currentTab).removeClass("active");
  $("#" + currentTab + "-tab").removeClass("active");
  $("#" + currentTab + "-file").removeClass("file-active");
  $("#" + currentTab + "-header").removeClass("file-active");

  /**
   * new tab
   **/
  $("#" + fileName).addClass("active");
  $("#" + fileName + "-tab").addClass("active");
  $("#" + fileName + "-file").addClass("file-active");
  $("#" + fileName + "-header").addClass("file-active");

  currentTab = fileName;
  setTimeout(function() {
    editors[fileName].refresh();
  }, 1);
  sendActiveTab(currentTab);
  isCloseTab = false;
}

function closeTab(fileName) {
  var tab = document.getElementById(fileName);
  tab.remove();
  var tabContent = document.getElementById(fileName + "-tab");
  tabContent.remove();
  delete editors[fileName];
  $(".file.menu")
    .children("a")
    .first()
    .click();
  $("#main").click();
  isCloseTab = true;
  var fileTab = document.getElementById("file-tabs").children;
}

function openTab(fileName) {
  $(".add-file")
    .closest("a")
    .before(
      '<a class="item" id="' +
        fileName +
        '" data-tab="' +
        fileName +
        '" onClick="getActiveTab(\'' +
        fileName +
        "')\">" +
        fileName +
        ".py <span onClick=\"closeTab('" +
        fileName +
        '\')"><i class="delete icon" id="close-tab-icon"></i></span></a>'
    );
  $(".tab-content").append(
    '<div class="ui bottom attached tab segment" id="' +
      fileName +
      '-tab" data-tab="' +
      fileName +
      '"> <textarea class="show" id="' +
      fileName +
      'text"></textarea></div>'
  );
  $(".menu .item").tab();
  newEditorFacade(fileName);
  socket.emit("open tab", fileName);
}

function createFile() {
  var fileName = $(".filename").val();
  socket.emit("create file", fileName);
}

function showExportModal() {
  $("#export-modal").modal("show");
}

function showDeleteFileModal(fileName) {
  $("#" + fileName + "-delete-file-modal").modal("show");
}

function deleteFile(fileName) {
  socket.emit("delete file", fileName);
}

function deleteBlock() {
  socket.emit("delete block", {
    blockId: editors[detectFocusBlock].blockId,
    index: detectFocusBlock
  });
}

function moveBlock(key) {
  var temp;
  var segmentCodeBlock = document.getElementsByClassName(
    "code-block-container"
  );

  if (key == "up" && detectFocusBlock != 0) {
    segmentCodeBlock[detectFocusBlock].parentNode.insertBefore(
      segmentCodeBlock[detectFocusBlock],
      segmentCodeBlock[detectFocusBlock - 1]
    );

    temp = projectFiles[detectFocusBlock];
    projectFiles[detectFocusBlock] = projectFiles[detectFocusBlock - 1];
    projectFiles[detectFocusBlock - 1] = temp;

    temp = editors[detectFocusBlock];
    editors[detectFocusBlock] = editors[detectFocusBlock - 1];
    editors[detectFocusBlock - 1] = temp;

    detectFocusBlock -= 1;
  } else if (key == "down" && detectFocusBlock != editors.length - 1) {
    /**
     * there is no insertAfter, so we basically swap the bottom block up
     **/
    segmentCodeBlock[detectFocusBlock + 1].parentNode.insertBefore(
      segmentCodeBlock[detectFocusBlock + 1],
      segmentCodeBlock[detectFocusBlock]
    );

    temp = projectFiles[detectFocusBlock];
    projectFiles[detectFocusBlock] = projectFiles[detectFocusBlock + 1];
    projectFiles[detectFocusBlock + 1] = temp;

    temp = editors[detectFocusBlock];
    editors[detectFocusBlock] = editors[detectFocusBlock + 1];
    editors[detectFocusBlock + 1] = temp;

    detectFocusBlock += 1;
  }

  editors[detectFocusBlock].editor.focus();
  socket.emit("move block", { projectFiles: projectFiles });
}

function onClickExport() {
  var filenameList = [];
  $('[name="checkbox-file"]').each(function() {
    if ($(this).prop("checked") == true) {
      filenameList.push($(this).val());
    }
  });
  socket.emit("export file", {
    fileNameList: filenameList,
    code: getAllFileEditor()
  });
}

function setOnChangeEditer(fileName) {
  /**
   * Local editor value is changing, to handle that we'll emit our changes to server
   */
  var blockObj = editors.find(obj => {
    return obj.blockId == fileName;
  });

  console.log("blockObj", blockObj)
  blockObj.editor.on("change", (ins, data) => {
    var text = data.text.toString().charCodeAt(0);
    console.log("data.text.toString() : " + data.text.toString())
    console.log("data.text.toString() : " + text)
    var enterline = parseInt(data.to.line) + 1;
    var remove = data.removed;
    var isEnter = false;
    var isDelete = false;

    /**
     * check when enter new line
     **/
    if (text == 44) {
      console.log("enter " + enterline);
      for (var i in comments) {
        if (comments[i].line > enterline && comments[i].file == fileName) {
          isEnter = true;
          comments[i].line = parseInt(comments[i].line) + 1;
        }
      }
      socket.emit("move hilight", {
        fileName: fileName,
        comments: comments,
        enterline: enterline,
        isEnter: isEnter
      });
    }

    /**
     * check when delete line
     **/
    if (remove.length == 2) {
      for (var i in comments) {
        if (comments[i].line > enterline - 1 && comments[i].file == fileName) {
          isDelete = true;
          comments[i].line = parseInt(comments[i].line) - 1;
        }
      }
      socket.emit("move hilight", {
        fileName: fileName,
        comments: comments,
        enterline: enterline,
        isDelete: isDelete
      });
    }

    socket.emit("code change", {
      code: data,
      editor: blockObj.editor.getValue(),
      user: user,
      enterline: enterline,
      isEnter: isEnter,
      isDelete: isDelete,
      currentTab: fileName,
      fileName: fileName
    });
  });
}

function setOnDoubleClickEditor(fileName) {
  /**
   * Code review modal
   */
  var blockObj = editors.find(obj => {
    return obj.blockId == fileName;
  });
  blockObj.editor.on("dblclick", () => {
    let A1 = blockObj.editor.getCursor().line;
    let A2 = blockObj.editor.getCursor().ch;
    let B1 = blockObj.editor.findWordAt({
      line: A1,
      ch: A2
    }).anchor.ch;
    let B2 = blockObj.editor.findWordAt({
      line: A1,
      ch: A2
    }).head.ch;
    $("input.disabled.line.no").val(A1 + 1);
    $("input.disabled.file.name").val(fileName + ".py");
    $("input.hidden.file.name").val(fileName);
    let line = $("input.disabled.line.no").val();
    switch (roles.user) {
      case "coder":
        for (var i in comments) {
          if (
            comments[i].file == fileName &&
            comments[i].line == parseInt(line)
          ) {
            $("textarea.line.coder.disabled.description").val(
              comments[i].description
            );
            break;
          } else {
            $("textarea.line.coder.disabled.description").val("");
          }
        }
        $(".ui.coder.small.modal").modal("show");
        break;
      case "reviewer":
        for (var i in comments) {
          if (
            comments[i].file == fileName &&
            comments[i].line == parseInt(line)
          ) {
            $("textarea.line.reviewer.description").val(
              comments[i].description
            );
            break;
          } else {
            $("textarea.line.reviewer.description").val("");
          }
        }
        $(".ui.reviewer.small.modal").modal("show");
        break;
    }
  });
}

function getAllFileEditor() {
  var codeEditors = {};
  projectFiles.forEach(runCodeEachFile);
  function runCodeEachFile(fileName) {
    var blockObj = editors.find(obj => {
      return obj.blockId == fileName;
    });
    codeEditors[fileName] = blockObj.editor.getValue();
  }
  return codeEditors;
}

function getCodeFocusBlock() {
  var codeFocusBlock = editors[detectFocusBlock].editor.getValue();
  return codeFocusBlock;
}

function newEditorFacade(fileName) {
  console.log("fileName", fileName)
  setEditor(fileName);
  setOnChangeEditer(fileName);
  setOnDoubleClickEditor(fileName);

  /**
   * setup partner active tab
   **/
  if (fileName == "main") {
    $("#" + partnerTab + "-file-icon").replaceWith(
      '<img id="' +
        partnerTab +
        '-file-icon" class="ui avatar image partner-file-icon" src="' +
        partner_img +
        '" style="position: absolute; margin-left: -32px; margin-top: -5px; width:20px; height:20px;"/>'
    );
  } else {
    $("#" + fileName + "-file-icon").replaceWith(
      '<div id="' + fileName + '-file-icon"/>'
    );
  }
}

function storeActiveTime() {
  const counts = $("#counts_min_sec").attr("data-count");
  if (counts !== undefined) {
    socket.emit("save active time", {
      uid: uid,
      time: counts
    });
  }
}
