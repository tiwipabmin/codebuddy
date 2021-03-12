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
const term = new Terminal({
  cols: 60,
  rows: 10,
  cursorBlink: true,
});
const uid = getVarFromScript("playgroundIndividual", "data-uid");
var comments = [];
var code = null;

/**
 * Initiate local editor
 */
var projectFiles = JSON.parse(document.getElementById("projectFiles").value);
var currentTab = "main";
var partnerTab = "main";
var isCloseTab = false;
var isLight = false;
let shellprompt = "\033[1;3;31m$ \033[0m";
let termInputm = "";
let isCodeRunning = false;
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
 * User join the project
 */
socket.emit("load playground", { programming_style: "Individual" });
socket.emit("join project", {
  pid: getParameterByName("project"),
  username: getVarFromScript("playgroundIndividual", "data-username"),
});

$(window).focus(() => {
  if (reconIntervalId === "") {
    reconIntervalId = setInterval(() => {
      reconTimer++;
      // console.log(`Reconnect Timer: ${reconTimer}`);
      /**
       * Reconnect to server
       */
      if (reconTimer >= 1) {
        $("#pr-text-loader").text("กำลังโหลดข้อมูลล่าสุด กรุณารอสักครู่.");
        $("#plyg-indv-ldr").attr("style", "display: block");

        socket.connect();
        socket.emit("load playground", { programming_style: "Individual" });
        socket.emit("join project", {
          pid: getParameterByName("project"),
          username: getVarFromScript("playgroundIndividual", "data-username"),
          sectionId: getParameterByName("section"),
          state: "Starting Reconnection",
        });
        console.log(`Reconnect Timer: ${reconTimer}`);
        console.log(`Socket: `, socket);
        // clearInterval(reconIntervalId);
      }
    }, 3000);
    let beat = 1;
    console.log(`PONG~`);
    socket.emit("PONG", { beat: beat });
  }
});

socket.on("PING", (payload) => {
  console.log(`PING~`);
  clearInterval(reconIntervalId);
  reconIntervalId = "";
  reconTimer = 0;
});

socket.on("reconnected", () => {
  clearInterval(reconIntervalId);
  reconTimer = 0;
  reconIntervalId = "";
  $("#plyg-indv-ldr").attr("style", "display: none");
  // console.log(`ReconIntervalId was destroyed!`);
});

/**
 * After user join the project, user will recieve initiate data to perform in local editor
 */
socket.on("init state", (payload) => {
  if (payload.editor != null) {
    var editorValues = JSON.parse(payload.editor);
    projectFiles.forEach(setEditorValue);
  } else {
    editor["main"].setValue("");
  }

  function setEditorValue(fileName) {
    if (editorValues != null) {
      editor[fileName].setValue(editorValues[fileName]);
    }
  }

  code = payload.editor;
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

    //setup file
    projectFiles.push(fileName);
    newEditorFacade(fileName);
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
  } else {
    var tab = document.getElementById(fileName);
    tab.remove();
    var fileItem = document.getElementById(fileName + "-file");
    fileItem.remove();
    var modal = document.getElementById(fileName + "-delete-file-modal");
    modal.remove();
    var exportFileItem = document.getElementById(
      fileName + "-export-file-item"
    );
    exportFileItem.remove();
    $(".file.menu").children("a").first().click();
  }
});

socket.on("denied to join", (curUser) => {
  let a = document.getElementById("backToClass");
  a.click();
});

/**
 * If user exit or going elsewhere which can be caused this project window closed
 * `beforeunload` event will fired and sending client disconnection to the server
 */
$(window).on("beforeunload", () => {
  socket.emit("submit code", {
    mode: "auto",
    uid: uid,
    code: getAllFileEditor(),
  });
  socket.disconnect();
});

$(window).bind("hashchange", function () {
  socket.emit("submit code", {
    mode: "auto",
    uid: uid,
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

function submitReview() {
  socket.emit("submit review", {
    file: $("input.hidden.file.name").val(),
    line: parseInt($("input.disabled.line.no").val()),
    description: $("textarea.line.reviewer.description").val(),
  });
  $("textarea.line.description").val("");
}

/**
 * Run code
 */
term.open(document.getElementById("xterm-container"), false);
term._initialized = true;

function resizeTerm() {
  term.fit();
}

term.prompt = function () {
  term.write("\r\n" + shellprompt);
};
term.prompt();
term.on("key", function (key, ev) {
  var printable = !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey;

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
      console.log(`Term Input: ${termInput}`);
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
      termInput += key;
    }
    term.write(key);
  }
});

// term.on("keypress", function (key) {
//   termInput += key;
// });

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
  term.writeln("Running pytest.py...");
}

/**
 * Submit code
 */
function submitCode() {
  $("#pr-text-loader").text("กำลังตรวจสอบ กรุณารอสักครู่.");
  $("#plyg-indv-ldr").attr({
    style: "display: block; position: fixed;",
  });
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
        $("#plyg-indv-ldr").attr("style", "display: none");
      },
    })
    .modal("show");
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
 * Show auto update score
 */
socket.on("show auto update score", (payload) => {
  $("#project-score-point").text(
    "project score : " + parseFloat(payload.score)
  );
  if (uid == payload.uid) {
    $("#user-point-label").text(
      "average score: " + parseFloat(payload.avgScore).toFixed(2)
    );
    console.log("Display: none!!");
    $("#plyg-indv-ldr").attr("style", "display: none");
  }
});

/**
 * Set editor value into open tab
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
 * Terminal socket
 */
socket.on("term update", (data="", state="closed") => {
  if (state === "running") {
    term.write(data);
  } else {
    termInput = "";
    isCodeRunning = false;
    term.prompt();
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
   * Old tab
   **/
  $("#" + currentTab).removeClass("active");
  $("#" + currentTab + "-tab").removeClass("active");
  $("#" + currentTab + "-file").removeClass("file-active");
  $("#" + currentTab + "-header").removeClass("file-active");

  /**
   * New tab
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
  } else {
    alert('Please, selected file before click "Export" button.');
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
    let username = getVarFromScript("playgroundIndividual", "data-username");

    /**
     * Check when enter new line
     **/
    if (text == 44) {
      // console.log('enter '+enterline)
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
        isEnter: isEnter,
      });
    }

    /**
     * Check when delete line
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
  });
}

function getAllFileEditor() {
  var codeEditors = {};
  projectFiles.forEach(runCodeEachFile);
  function runCodeEachFile(fileName) {
    codeEditors[fileName] = editor[fileName].getValue();
  }
  return codeEditors;
}

function newEditorFacade(fileName) {
  setEditor(fileName);
  setOnChangeEditer(fileName);

  /**
   * setup partner active tab
   **/
  // if (fileName == "main") {
  //   $("#" + partnerTab + "-file-icon").replaceWith(
  //     '<img id="' +
  //       partnerTab +
  //       '-file-icon" class="ui avatar image partner-file-icon" src="' +
  //       getVarFromScript('playgroundIndividual', 'data-partnerImg') +
  //       '" style="position: absolute; margin-left: -32px; margin-top: -5px; width:20px; height:20px;"/>'
  //   );
  // } else {
  //   $("#" + fileName + "-file-icon").replaceWith(
  //     '<div id="' + fileName + '-file-icon"/>'
  //   );
  // }
}
