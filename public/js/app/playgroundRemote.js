$(document).ready(function () {
  $("#cnfr-rl-chng").modal({
    closable: false,
    // onDeny: function () {
    //   $("#cnfr-rl-chng").modal("hide");
    // },
    // onApprove: function () {
    //   socket.emit("switch role", {
    //     user: `${getVarFromScript("playgroundRemote", "data-username")}`,
    //     action: "switch role",
    //     status: $("#acpt-btn-crc").attr("value"),
    //   });
    // },
  });

  $("#rejectJoining").modal({
    closable: false,
    onApprove: function () {
      // $("#global_loader").attr({
      //   style: "display: block; position: fixed;"
      // });
      $("#pr-text-loader").text("Loading...");
      $("#playground-remote-loader").attr(
        "style",
        "display: block; position: fixed;"
      );
    },
  });
});

function getVarFromScript(scriptName, name) {
  const data = $(`script[src*=${scriptName}]`);
  const variable = data.attr(name);
  if (typeof variable === undefined) {
    console.log("Error: ", variable);
  }
  return variable;
}

/**
 * get query parameter from URL
 * @param {String} name parameter name that you want to get value from
 * http://stackoverflow.com/a/901144/4181203
 */
function getParameterByName(name) {
  const url = window.location.href;
  const terms = url.split("/");
  const index = terms.indexOf(name);
  try {
    const result = terms[index + 1];
    return result;
  } catch (err) {
    return null;
  }
}

/**
 * Dependencies declaration
 */
const socket = io("");

const roles = {
  user: "",
  partner: "",
};
const term = new Terminal({
  cols: 60,
  rows: 10,
  cursorBlink: true,
});
const uid = getVarFromScript("playgroundRemote", "data-uid");
const sectionId = getVarFromScript("playgroundRemote", "data-sectionId");
let comments = [];
// let code = null;
let editorValues = { main: "" };

let webrtc = new SimpleWebRTC({
  // the id/element dom element that will hold "our" video
  localVideoEl: "localVideo",
  // the id/element dom element that will hold remote videos
  remoteVideosEl: "remoteVideo",
  // immediately ask for camera access
  autoRequestMedia: true,
});

/**
 * Initiate local editor
 */
var projectFiles = JSON.parse(document.getElementById("projectFiles").value);
var currentTab = "main";
var partnerTab = "main";
var isCloseTab = false;
var isLight = false;
let shellprompt = "\033[1;3;31m$ \033[0m";
let termInput = "";
let isCodeRunning = false;
new ResizeSensor($("#xterm-container"), function () {
  term.fit();
});
let editor = {};
let reconTimer = 0;
let reconIntervalId = "";
projectFiles.forEach(newEditorFacade);
getActiveTab("main");

function setEditor(fileName) {
  if (!(fileName in editor)) {
    let cm = CodeMirror.fromTextArea(
      document.getElementById(fileName + "text"),
      {
        lineNumbers: true,
        mode: {
          name: "python",
          version: 3,
          singleLineStringErrors: false,
          styleActiveLine: true,
          lineNumbers: true,
          lineWrapping: true,
        },
        theme: "material",
        indentUnit: 4,
        matchBrackets: true,
      }
    );
    cm.addKeyMap({
      "Alt-R": function (cm) {
        runCode();
      },
      "Alt-S": function (cm) {
        pauseRunCode();
      },
      "Alt-V": function (cm) {
        submitCode();
      },
    });
    editor[fileName] = cm;
  }
}

/**
 * Code Mirror Change Theme
 */

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
    editor[fileName].setOption("theme", theme);
  }
}

/**
 * `Error` event that has something wrong on the server side.
 */
socket.on("err", () => {
  socket.disconnect();
});

/**
 * User join the project
 */
socket.emit("load playground", { programming_style: "Remote" });
socket.emit("join project", {
  pid: getParameterByName("project"),
  username: getVarFromScript("playgroundRemote", "data-username"),
  sectionId: getParameterByName("section"),
});

socket.on("start the project session", () => {
  socket.emit("initialize the project session", {});
});

$(window).focus(() => {
  if (reconIntervalId === "") {
    $("#pr-text-loader").text("กำลังตรวจสอบการเชื่อมต่อ กรุณารอสักครู่.");
    $("#playground-remote-loader").attr("style", "display: initial");

    reconIntervalId = setInterval(() => {
      reconTimer++;
      // console.log(`Reconnect Timer: ${reconTimer}`);
      /**
       * Reconnect to server
       */
      if (reconTimer >= 1) {
        $("#pr-text-loader").text("กำลังโหลดข้อมูลล่าสุด กรุณารอสักครู่.");
        $("#playground-remote-loader").attr("style", "display: initial");

        $("#swtc-rl-btn").attr("disabled", "disabled");
        $(".countdown").empty();
        $(".auto-swap-warning").empty();

        socket.connect();
        socket.emit("load playground", { programming_style: "Remote" });
        socket.emit("join project", {
          pid: getParameterByName("project"),
          username: getVarFromScript("playgroundRemote", "data-username"),
          sectionId: getParameterByName("section"),
          state: "Starting Reconnection",
        });
        // console.log(`Reconnect Timer: ${reconTimer}`);
        // console.log(`Socket: `, socket);
        // clearInterval(reconIntervalId);
      }
    }, 3000);
    let beat = 1;
    // console.log(`PONG~`);
    socket.emit("PONG", { beat: beat });
  }
});

socket.on("PING", (payload) => {
  // console.log(`PING~`);
  $("#playground-remote-loader").attr("style", "display: none");
  clearInterval(reconIntervalId);
  reconIntervalId = "";
  reconTimer = 0;
  // beat = payload.beat;
  // if (!beat) {
  //   reconIntervalId = setInterval(() => {
  //     reconTimer++;
  //     // console.log(`Reconnect Timer: ${reconTimer}`);
  //     /**
  //      * Reconnect to server
  //      */
  //     if (reconTimer >= 2) {
  //       $("#pr-text-loader").text(
  //         "อินเทอร์เน็ตของคุณไม่เสถียร กรุณารอสักครู่."
  //       );
  //       $("#playground-remote-loader").attr("style", "display: block");
  //       $("#swtc-rl-btn").attr("disabled", "disabled");
  //       $(".countdown").empty();
  //       $(".auto-swap-warning").empty();
  //       socket.connect();
  //       socket.emit("load playground", { programming_style: "Remote" });
  //       socket.emit("join project", {
  //         pid: getParameterByName("project"),
  //         username: getVarFromScript("playgroundRemote", "data-username"),
  //         sectionId: getParameterByName("section"),
  //         state: "Starting Reconnection",
  //       });
  //       // console.log(`Reconnect Timer: ${reconTimer}`);
  //       // console.log(`Socket: `, socket);
  //       // clearInterval(reconIntervalId);
  //     }
  //   }, 3000);
  // }
  // reconTimer = 0;
  // beat++;
  // console.log(`Beat: ${beat}`);
  // socket.emit("PONG", { beat: beat });
});

socket.on("reconnected", () => {
  clearInterval(reconIntervalId);
  reconTimer = 0;
  reconIntervalId = "";
  $("#playground-remote-loader").attr("style", "display: none");
  // console.log(`ReconIntervalId was destroyed!`);
});

webrtc.on("readyToCall", function () {
  // you can name it anything
  webrtc.createRoom(getParameterByName("project"));
  webrtc.joinRoom(getParameterByName("project"));
});

/**
 * After user join the project, user will recieve initiate data to perform in local editor
 */
socket.on("init state", (payload) => {
  if (payload.editor != null) {
    editorValues = JSON.parse(payload.editor);
    projectFiles.forEach(setEditorValue);
  } else {
    editor["main"].setValue("");
  }

  // function getRulers(values) {
  //   let rulers = [];
  //   for (let i = 0; i <= values.length; i++) {
  //     rulers.push({
  //       color: "#FFFFF",
  //       column: i * 4,
  //       lineStyle: "dashed",
  //       width: 1,
  //     });
  //   }
  //   return rulers;
  // }

  function setEditorValue(fileName) {
    if (editorValues != null) {
      // let rulers = getRulers(editorValues[fileName].split("\n"));
      // console.log("Rulers, ", rulers);
      editor[fileName].setValue(editorValues[fileName]);
      // editor[fileName].setOption("rulers", rulers);
    }
  }

  // code = payload.editor;
});

/**
 * After user join the project, user will recieve initiate review to hilight in local editor
 */
socket.on("init reviews", (payload) => {
  comments = payload;
  for (var i in comments) {
    editor[comments[i].file].addLineClass(
      parseInt(comments[i].line) - 1,
      "wrap",
      "CodeMirror-activeline-background"
    );
  }
});

/**
 * Update tab when create or delete
 */
socket.on("update tab", (payload) => {
  var fileName = payload.fileName;
  var action = payload.action;
  let username = getVarFromScript("playgroundRemote", "data-username");
  if (action == "create") {
    var id = document.getElementById("file-tabs").childElementCount;
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

    /**
     * setup file
     **/
    projectFiles.push(fileName);
    newEditorFacade(fileName);
    switch (roles.user) {
      case "coder":
        setOptionFileShowCursor(fileName);
        break;
      case "reviewer":
        setOptionFileNoCursor(fileName);
        break;
    }

    var html =
      '<div class="item cursor-pointer" id="' +
      fileName +
      '-file" onClick=getActiveTab("' +
      fileName +
      '")><div id="' +
      fileName +
      '-file-icon"/><i class="file icon"/><div class="middle aligned content"><div class="header" id="' +
      fileName +
      '-header">' +
      fileName +
      ".py</div>" +
      '<div class="delete-file">' +
      '<span onClick=showDeleteFileModal("' +
      fileName +
      '")>' +
      '<i class="trash alternate outline icon" id="delete-icon"></i>' +
      "</span>" +
      '<div class="ui small modal" id="' +
      fileName +
      '-delete-file-modal">' +
      '<div class="header"> Delete File </div>' +
      '<div class="content">' +
      "<p> Do you want to delete " +
      fileName +
      ".py? </p>" +
      "</div>" +
      '<div class="actions">' +
      '<button class="ui button approve green" onClick=deleteFile("' +
      fileName +
      '")> Delete </button>' +
      '<div class="ui button approve red" data-value="cancel"> Cancel </div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div></div>";
    $("#file-list").append(html);
    $("#export-checklist").append(
      '<div class="item export-file-item" id="' +
        fileName +
        '-export-file-item"><div class="ui child checkbox"><input type="checkbox" name="checkbox-file" value="' +
        fileName +
        '"><label>' +
        fileName +
        ".py</label></div></div>"
    );

    if (username === payload.username) {
      $(`#${fileName}-file`).click();
    }
  } else {
    if (username !== payload.username) {
      $("#alert-header").text("การลบไฟล์");
      $("#alert-message").text(
        `เพื่อนของคุณลบไฟล์ที่ชื่อว่า "${fileName}.py" แล้ว`
      );
      $("#alert-modal").modal("show");
    }

    var tab = document.getElementById(fileName);
    if (tab) {
      tab.remove();
      var tabContent = document.getElementById(fileName + "-tab");
      tabContent.remove();
      var modal = document.getElementById(fileName + "-delete-file-modal");
      modal.remove();
    }
    var fileItem = document.getElementById(fileName + "-file");
    fileItem.remove();
    var exportFileItem = document.getElementById(
      fileName + "-export-file-item"
    );
    exportFileItem.remove();
    $(".file.menu").children("a").first().click();

    fileIndex = projectFiles.indexOf(fileName);
    delete projectFiles[fileIndex];
    delete editorValues[fileName];
    delete editor[fileName];
  }
});

/**
 * If there's no one select the role, then first user that come to the project must choose one
 */
socket.on("role selection", (payload) => {
  let username = getVarFromScript("playgroundRemote", "data-username");
  if (payload.activeUsers[username] === 1) {
    $("#selectRole-modal").modal({
      closable: false,
      onDeny: function () {
        socket.emit("role selected", {
          select: 0,
          partner: payload.partner,
        });
      },
      onApprove: function () {
        socket.emit("role selected", {
          select: 1,
          partner: payload.partner,
        });
      },
    });
    $("#selectRole-modal").modal("show");
    $("#playground-remote-loader").attr("style", "display: none");
    // $("#global_loader").attr("style", "display: none");
  } else {
    $("#pr-text-loader").text("รอเพื่อนของคุณเลือกบทบาทของเขา.");
  }
});

/**
 * The one of users want to change the role.
 * @param {Object} roles consist of coder and reviewer.
 * @param {String} requestedBy The username of user requesting to switch role.
 */
socket.on("manually switch role", (roles, requestedBy) => {
  let username = getVarFromScript("playgroundRemote", "data-username");
  if (requestedBy !== username) {
    roles.requestedBy = requestedBy;
    $("#hdr-crc").text(
      `คุณ ${requestedBy} ต้องการเปลี่ยนบทบาทตอนนี้ คุณเห็นด้วยหรือไม่คะ?`
    );
    $("#acpt-btn-crc").attr({
      style: "display:initial;",
      onclick: `acceptSwitchRole("accept", ${JSON.stringify(roles)})`,
    });
    $("#dcln-btn-crc").attr({
      style: "display:initial;",
      onclick: `declineSwitchRole("decline", ${JSON.stringify(roles)})`,
    });
    $("#cnfr-rl-chng").modal("show");
  } else {
    $("#pr-text-loader").text("รอเพื่อนของคุณตอบรับคำร้องขอสลับบทบาทค่ะ.");
    $("#playground-remote-loader").attr(
      "style",
      "display: block; position: fixed;"
    );
  }
});

function acceptSwitchRole(answer = undefined, roles = undefined) {
  socket.emit("confirm to switch role", answer, roles);
}

function declineSwitchRole(answer = undefined, roles = undefined) {
  socket.emit("confirm to switch role", answer, roles);
}

/**
 * `auto role change` event fired when system force users to change role.
 * @param {Object} payload
 */
socket.on("auto role change", () => {
  $("#acpt-btn-crc").attr("style", "display:none;");
  $("#acpt-btn-crc").removeAttr("onclick");
  $("#dcln-btn-crc").attr("style", "display:none;");
  $("#dcln-btn-crc").removeAttr("onclick");

  $("#swtc-rl-btn").attr("disabled", "disabled");
  $("#hdr-crc").text(`เพื่อนของคุณออกจากหน้าเขียนโปรแกรมแล้วค่ะ.`);
  $("#acpt-btn-crc").attr("onclick", 'switchRole("disconnected")');
  $("#acpt-btn-crc").attr("style", "display:block;");
  $("#cnfr-rl-chng").modal("show");
  $(".countdown").empty();
  $(".auto-swap-warning").empty();
});

socket.on("countdown", (payload) => {
  $("#swtc-rl-btn").removeAttr("disabled");
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

socket.on("denied to join", (curUser) => {
  username = getVarFromScript("playgroundRemote", "data-username");
  if (curUser === username) {
    let a = document.getElementById("backToClass");
    a.click();
  }
});

socket.on("clear interval", (name) => {
  socket.emit("clear interval", name);
});

socket.on("role timer", () => {
  socket.emit("role timer started");
});

/**
 * Editor is configured cursor according to the user's role.
 * @param {object} fileName receive a file name.
 */
function setOptionFileNoCursor(fileName) {
  editor[fileName].setOption("readOnly", "nocursor");
}
function setOptionFileShowCursor(fileName) {
  editor[fileName].setOption("readOnly", false);
}

/**
 * `update role` event fired when the project initialize and
 * the role is manually changed by the one of users.
 * @param {Object} payload the object instance
 */
socket.on("update role", (payload) => {
  let username = getVarFromScript("playgroundRemote", "data-username");
  $("#acpt-btn-crc").attr("style", "display:none;");
  $("#acpt-btn-crc").removeAttr("onclick");
  $("#dcln-btn-crc").attr("style", "display:none;");
  $("#dcln-btn-crc").removeAttr("onclick");

  if (payload.roles) {
    if (username === payload.roles.reviewer) {
      if (payload.connected) {
        if (payload.connected !== username) {
          $("#hdr-crc").text("เพื่อนของคุณเชื่อมต่อเข้ามาแล้วค่ะ.");
          $("#acpt-btn-crc").attr("style", "display:block;");
          $("#cnfr-rl-chng").modal("show");
        } else {
          $("#hdr-crc").text("คุณถูกมอบหมายให้เป็น Reviewer ค่ะ.");
          $("#acpt-btn-crc").attr("style", "display:block;");
          $("#cnfr-rl-chng").modal("show");
        }
      } else {
        $("#hdr-crc").text("คุณถูกมอบหมายให้เป็น Reviewer ค่ะ.");
        $("#acpt-btn-crc").attr("style", "display:block;");
        $("#cnfr-rl-chng").modal("show");
      }
      roles.user = "reviewer";
      roles.partner = "coder";

      projectFiles.forEach(setOptionFileNoCursor);
    } else if (username === payload.roles.coder) {
      if (payload.connected) {
        if (payload.connected !== username) {
          $("#hdr-crc").text("เพื่อนของคุณเชื่อมต่อเข้ามาแล้วค่ะ.");
          $("#acpt-btn-crc").attr("style", "display:block;");
          $("#cnfr-rl-chng").modal("show");
        } else {
          $("#hdr-crc").text("คุณถูกมอบหมายให้เป็น Coder ค่ะ.");
          $("#acpt-btn-crc").attr("style", "display:block;");
          $("#cnfr-rl-chng").modal("show");
        }
      } else {
        $("#hdr-crc").text("คุณถูกมอบหมายให้เป็น Coder ค่ะ.");
        $("#acpt-btn-crc").attr("style", "display:block;");
        $("#cnfr-rl-chng").modal("show");
      }
      roles.user = "coder";
      roles.partner = "reviewer";

      projectFiles.forEach(setOptionFileShowCursor);
    } else {
      if (username === payload.project.creator) {
        roles.user = "coder";
        roles.partner = "reviewer";
      } else {
        roles.user = "reviewer";
        roles.partner = "coder";
      }
    }

    // /**
    //  * Editor is configured cursor according to the user's role.
    //  * @param {object} fileName receive a file name.
    //  */
    // function setOptionFileNoCursor(fileName) {
    //   editor[fileName].setOption("readOnly", "nocursor");
    // }
    // function setOptionFileShowCursor(fileName) {
    //   editor[fileName].setOption("readOnly", false);
    // }

    $(".partner-role-label").text(`${roles.partner}`);
    $(".user-role-label").text(`${roles.user}`);
  } else {
    if (payload.requestedBy === username) {
      $("#hdr-crc").text("เพื่อนของคุณปฏิเสธการสลับบทบาทตอนนี้ค่ะ.");
      $("#acpt-btn-crc").attr("style", "display:block;");
      $("#cnfr-rl-chng").modal("show");
    }
  }
  $("#playground-remote-loader").attr("style", "display:none");
});

socket.on("show reviewer active time", (payload) => {
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
    code: getAllFileEditor(),
  });
  socket.disconnect();
});

$(window).bind("hashchange", function () {
  // storeActiveTime()
  socket.emit("submit code", {
    mode: "auto",
    code: getAllFileEditor(),
  });
});

/**
 * Recieve new changes editor value from server and applied them to local editor
 */
socket.on("editor update", (payload) => {
  editor[payload.fileName].replaceRange(payload.text, payload.from, payload.to);
  setTimeout(function () {
    editor[payload.fileName].refresh();
  }, 1);
});

socket.on("update status", (payload) => {
  if (payload.status) {
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
    description: $("textarea.line.reviewer.description").val(),
  });
  $("textarea.line.description").val("");
}

socket.on("new review", (payload) => {
  comments = payload;
  comments.map((comment) => {
    editor[comment.file].addLineClass(
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
    description: $("textarea.line.reviewer.description").val(),
  });
}

socket.on("update after delete review", (payload) => {
  comments = payload.comments;
  deleteline = payload.deleteline;
  editor[payload.file].removeLineClass(
    parseInt(deleteline - 1),
    "wrap",
    "CodeMirror-activeline-background"
  );
});

socket.on("is typing", (payload) => {
  let username = getVarFromScript("playgroundRemote", "data-username");
  if (username != payload.username) {
    $("#show-is-typing").text(payload.text);
  }
});

/**
 * Run code
 */
term.open(document.getElementById("xterm-container"), false);
term._initialized = true;

function smallSize() {
  $("#xterm-container").height(190);
}

function mediumSize() {
  $("#xterm-container").height(380);
}

function largeSize() {
  $("#xterm-container").height(570);
}

term.prompt = function (text = "") {
  term.write("\r\n" + shellprompt + text);
};

term.prompt();

term.on("key", function (key, ev) {
  var printable = !ev.altKey && !ev.altGraphKey && !ev.metaKey;

  if (ev.keyCode == 13) {
    // if (termInput !== "input@codebuddy") {
    //   termInput = termInput.slice(termInput.indexOf("y") + 1, termInput.length);
    //   socket.emit("get input", {
    //     termInput: termInput,
    //   });
    //   term.writeln("");
    //   termInput = "input@codebuddy";
    //   return;
    // }
    if (isCodeRunning) {
      socket.emit("get input", {
        termInput: termInput,
      });
      termInput = "";
      term.writeln("");
      return;
    }
    term.prompt();
  } else if (ev.keyCode == 8) {
    if (isCodeRunning) {
      term.write("\b \b");
      if (termInput.length) {
        termInput = termInput.slice(0, termInput.length - 1);
      }
      // console.log(`Term Input: ${termInput}`);
    } else {
      /**
       * Don't remove the prompt
       **/
      if (term.x > 2) {
        term.write("\b \b");
      }
    }
  } else if (printable) {
    if (isCodeRunning) {
      /**
       * This 67 KeyCode is equivalent to the "Ctrl + c" KeyMap.
       * This 86 KeyCode is equivalent to the "Ctrl + v" KeyMap.
       */
      if (ev.keyCode == 67) {
        const username = getVarFromScript("playgroundRemote", "data-username");
        term.write("^C");
        socket.emit("terminate child process", username);
      } else if (ev.keyCode == 86) {
        theClipboard = navigator.clipboard;
        theClipboard.readText().then((clipText) => {
          let clipTexts = clipText.split("\n");
          termInput += clipText;

          for (let index in clipTexts) {
            if (parseInt(index) === clipTexts.length - 1) {
              term.write(clipTexts[index]);
            } else {
              term.writeln(clipTexts[index]);
            }
          }
        });
      } else {
        termInput += key;
      }
    }
    term.write(key);
  }
});

/**
 * Pause running code
 */
function pauseRunCode() {
  socket.emit("pause run code", {});
}

/**
 * Run code
 */
function runCode() {
  isCodeRunning = true;
  socket.emit("run code", {
    uid: uid,
    code: getAllFileEditor(),
  });
  socket.emit("save lines of code", {
    uid: uid,
  });
}

/**
 * Submit code
 */
function submitCode() {
  // $("#global_loader").attr({
  //   style: "display: block; position: fixed;"
  // });
  $("#pr-text-loader").text("กำลังตรวจสอบคุณภาพโค้ด กรุณารอสักครู่.");
  $("#playground-remote-loader").attr(
    "style",
    "display: block; position: fixed;"
  );
  socket.emit("submit code", {
    mode: "button submit",
    uid: uid,
    code: getAllFileEditor(),
  });
  term.writeln("Scoring pytest.py...");
}

/**
 * Clear Terminal
 */
function clearTerminal() {
  term.clear();
}

/**
 * Send Message on Chatbox
 */
function sendMessage() {
  if (document.getElementById("inputMessage").value != "") {
    socket.emit("send message", {
      uid: uid,
      message: document.getElementById("inputMessage").value,
    });
  }
}

/**
 * Send Active Tab
 */
function sendActiveTab(tab) {
  socket.emit("send active tab", {
    uid: uid,
    activeTab: tab,
  });
}

/**
 * Show score dialog
 */
socket.on("show score", (payload) => {
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
      closable: false,
      onDeny: function () {
        // $("#global_loader").attr("style", "display: none");
      },
    })
    .modal("show");
  $("#playground-remote-loader").attr("style", "display: none;");
});

/**
 * Pause run code
 */
socket.on("pause run code", (payload) => {
  term.writeln("Stop running pytest.py...");
});

/**
 * Auto update score
 */
socket.on("auto update score", (payload) => {
  socket.emit("submit code", {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor(),
  });
  term.writeln("Scoring pytest.py...");
});

/**
 * Auto update score
 */
socket.on("show auto update score", (payload) => {
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
socket.on("show partner active tab", (payload) => {
  if (payload.uid !== uid) {
    $("#" + partnerTab + "-file-icon").replaceWith(
      '<div id="' + partnerTab + '-file-icon"/>'
    );

    /**
     * set new partner active tab
     **/
    partnerTab = payload.activeTab;
    $("#" + partnerTab + "-file-icon").replaceWith(
      '<img id="' +
        partnerTab +
        '-file-icon" class="ui avatar image partner-file-icon" src="' +
        getVarFromScript("playgroundRemote", "data-partnerImg") +
        '" style="position: absolute; margin-left: -32px; margin-top: -5px;"/>'
    );
  }
});

/**
 * set editor value into open tab
 */
socket.on("set editor open tab", (payload) => {
  var code = JSON.parse(payload.editor);
  var fileName = payload.fileName;
  editor[fileName].setValue(code[fileName]);
  for (var i in comments) {
    editor[comments[i].file].addLineClass(
      parseInt(comments[i].line) - 1,
      "wrap",
      "CodeMirror-activeline-background"
    );
  }
});

/**
 * Terminal update data
 */
socket.on("term update", (data = "", state = "closed") => {
  if (state === "started") {
    term.writeln("Running pytest.py...");
  } else if (state === "forced") {
    // console.log("Run code again!");
    term.prompt();
    runCode();
  } else if (state === "closed") {
    $("#playground-remote-loader").attr("style", "display: none");
    termInput = "";
    isCodeRunning = false;
    if (data != "") {
      term.writeln(data);
    }
    term.prompt();
  } else {
    term.write(data);
  }
});

/**
 * Update message on Chatbox.
 */
socket.on("update message", (payload) => {
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

socket.on("download file", (payload) => {
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
 * attach ready event -- Video Toggle and Chatbox status.
 **/
$(document).ready(function () {
  $(".ui.video.toggle.button").state({
    text: {
      inactive: '<i class="pause circle icon"/>',
      active: '<i class="play video icon"/>',
    },
  });
  $(".ui.mute.toggle.button").state({
    text: {
      inactive: '<i class="mute icon"/>',
      active: '<i class="unmute icon"/>',
    },
  });
  $("#inputMessage").keydown(function () {
    socket.emit("is typing", {
      username: getVarFromScript("playgroundRemote", "data-username"),
      text: `${getVarFromScript(
        "playgroundRemote",
        "data-username"
      )} is typing...`,
    });
    clearTimeout(parseInt($("#inputMessage").attr("data-timeId")));
  });
  $("#inputMessage").keyup(function () {
    let timeId = setTimeout(function () {
      socket.emit("is typing", {
        username: getVarFromScript("playgroundRemote", "data-username"),
        text: "",
      });
    }, 5000);
    $("#inputMessage").attr("data-timeId", timeId);
  });
  $("#inputMessage").keydown(function (e) {
    if (e.keyCode == 13) {
      sendMessage();
    }
  });
  updateScroll();
});

/**
 * is just jQuery short-hand for $(document).ready(function(){...})
 **/
$(function () {
  var acc = 0;
  var session_flag = 0;
  /**
   * send active time
   **/
  setInterval(function () {
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
        secs: pad((counts - acc) % 60),
      });
    }
  }, 1000);

  var lastSavedTime = 0;

  setInterval(function () {
    const counts = $("#counts_min_sec").attr("data-count");
    let add = counts - lastSavedTime;

    if (counts !== undefined && add > 0) {
      socket.emit("save active time", {
        uid: uid,
        time: add,
      });

      lastSavedTime = counts;
    }
  }, 10000);
});

function switchRole(requestedBy) {
  let username = getVarFromScript("playgroundRemote", "data-username");
  socket.emit("switch role", {
    user: username,
    requestedBy: requestedBy,
  });
}

function updateScroll() {
  // $(".chat").animate({ scrollTop: $(document).height() }, "fast");
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
  $(".filename").keyup(function () {
    var disable = false;
    var isExists = false;
    var fileName = $(".filename").val();
    isExists = projectFiles.indexOf(fileName);

    $(".filename").each(function () {
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
  setTimeout(function () {
    editor[fileName].refresh();
  }, 1);
  sendActiveTab(currentTab);
  isCloseTab = false;
}

function closeTab(fileName) {
  var tab = document.getElementById(fileName);
  tab.remove();
  var tabContent = document.getElementById(fileName + "-tab");
  tabContent.remove();
  delete editor[fileName];
  $(".file.menu").children("a").first().click();
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
  let username = getVarFromScript("playgroundRemote", "data-username");
  socket.emit("create file", fileName, username);
}

function showExportModal() {
  $(".checkbox-item").prop("checked", false);
  $("#export-modal").modal("show");
}

function showDeleteFileModal(fileName) {
  $("#" + fileName + "-delete-file-modal").modal("show");
}

function deleteFile(fileName) {
  let username = getVarFromScript("playgroundRemote", "data-username");
  socket.emit("delete file", fileName, username);
}

function onClickExport() {
  let fileNameList = [];
  $('[name="checkbox-file"]').each(function () {
    if ($(this).prop("checked") == true) {
      fileNameList.push($(this).val());
    }
  });
  if (fileNameList.length) {
    socket.emit("export file", {
      fileNameList: fileNameList,
      code: getAllFileEditor(),
    });
  }
}

function setOnChangeEditer(fileName) {
  /**
   * Local editor value is changing, to handle that we'll emit our changes to server
   */
  editor[fileName].on("change", (ins, data) => {
    let text = data.text.toString().charCodeAt(0);
    let enterline = parseInt(data.to.line) + 1;
    let remove = data.removed;
    let isEnter = false;
    let isDelete = false;
    let username = getVarFromScript("playgroundRemote", "data-username");

    /**
     * check when enter new line
     **/
    if (text == 44) {
      for (let i in comments) {
        if (comments[i].line > enterline && comments[i].file == fileName) {
          isEnter = true;
          comments[i].line = parseInt(comments[i].line) + 1;
        }
      }
      socket.emit("move hilight", {
        fileName: fileName,
        comments: comments,
        enterline: enterline,
        isEnter: isEnter,
      });
    }

    /**
     * check when delete line
     **/
    if (remove.length == 2) {
      for (let i in comments) {
        if (comments[i].line > enterline - 1 && comments[i].file == fileName) {
          isDelete = true;
          comments[i].line = parseInt(comments[i].line) - 1;
        }
      }
      socket.emit("move hilight", {
        fileName: fileName,
        comments: comments,
        enterline: enterline,
        isDelete: isDelete,
      });
    }

    socket.emit("code change", {
      code: data,
      editor: editor[fileName].getValue(),
      user: username,
      enterline: enterline,
      isEnter: isEnter,
      isDelete: isDelete,
      currentTab: fileName,
      fileName: fileName,
    });

    editorValues[fileName] = editor[fileName].getValue();
  });
}

function setOnDoubleClickEditor(fileName) {
  /**
   * Code review modal
   */
  editor[fileName].on("dblclick", () => {
    let A1 = editor[fileName].getCursor().line;
    let A2 = editor[fileName].getCursor().ch;
    let B1 = editor[fileName].findWordAt({
      line: A1,
      ch: A2,
    }).anchor.ch;
    let B2 = editor[fileName].findWordAt({
      line: A1,
      ch: A2,
    }).head.ch;
    $("input.disabled.line.no").val(A1 + 1);
    $("input.disabled.file.name").val(fileName + ".py");
    $("input.hidden.file.name").val(fileName);
    let line = $("input.disabled.line.no").val();
    switch (roles.user) {
      case "coder":
        for (let i in comments) {
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
        for (let i in comments) {
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
  // let codeEditors = {};
  // try {
  //   projectFiles.forEach(runCodeEachFile);
  //   return codeEditors;
  // } catch (err) {
  // $("#alert-header").text("ข้อผิดพลาดการนำเข้า");
  // $("#alert-message").text(
  //   "ข้อผิดพลาดของการนำเข้าฟังก์ชันหรือคำสั่งจากไฟล์อื่นที่ถูกปิดไปแล้ว"
  // );
  // $("#alert-modal").modal("show");
  //   console.error(`Catching error: ${err}`);
  //   return null;
  // }
  // function runCodeEachFile(fileName) {
  //   codeEditors[fileName] = editor[fileName].getValue();
  // }
  return editorValues;
}

function newEditorFacade(fileName) {
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
        getVarFromScript("playgroundRemote", "data-partnerImg") +
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
      time: counts,
    });
  }
}
