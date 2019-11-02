const socket = io();
var detectFocusBlock = 0;
var editors = [];

function addBlock() {
    console.log("addbolock jj")
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

  var segmentCodeBlock = document.getElementById("segmentCodeBlock");

/**
 * Initiate local editor
 */
var projectFiles = JSON.parse(document.getElementById("projectFiles").value);
var notebookAssingmentId = document.getElementById("notebookAssingmentId").value;
console.log("notebookAssingmentId", notebookAssingmentId)



for(var i = 0; i < projectFiles.length; i++){
  if(projectFiles[i]["cellType"] == "code"){
    newEditorFacade(i)
  }
  
}




function newEditorFacade(fileName) {
  setEditor(fileName);
  // setOnChangeEditer(fileName);
  // setOnDoubleClickEditor(fileName);

  // /**
  //  * setup partner active tab
  //  **/
  // if (fileName == "main") {
  //   $("#" + partnerTab + "-file-icon").replaceWith(
  //     '<img id="' +
  //       partnerTab +
  //       '-file-icon" class="ui avatar image partner-file-icon" src="' +
  //       partner_img +
  //       '" style="position: absolute; margin-left: -32px; margin-top: -5px; width:20px; height:20px;"/>'
  //   );
  // } else {
  //   $("#" + fileName + "-file-icon").replaceWith(
  //     '<div id="' + fileName + '-file-icon"/>'
  //   );
  // }
}

function setEditor(fileName) {
  console.log(fileName)
  var cm = CodeMirror.fromTextArea(
    document.getElementById(fileName),
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

// function setOnChangeEditer(fileName) {
//   /**
//    * Local editor value is changing, to handle that we'll emit our changes to server
//    */
//   var blockObj = editors.find(obj => {
//     return obj.blockId == fileName;
//   });
//   blockObj.editor.on("change", (ins, data) => {
//     var text = data.text.toString().charCodeAt(0);
//     console.log("data.text.toString() : " + data.text.toString());
//     var enterline = parseInt(data.to.line) + 1;
//     var remove = data.removed;
//     var isEnter = false;
//     var isDelete = false;

//     /**
//      * check when enter new line
//      **/
//     if (text == 44) {
//       console.log("enter " + enterline);
//       for (var i in comments) {
//         if (comments[i].line > enterline && comments[i].file == fileName) {
//           isEnter = true;
//           comments[i].line = parseInt(comments[i].line) + 1;
//         }
//       }
//       socket.emit("move hilight", {
//         fileName: fileName,
//         comments: comments,
//         enterline: enterline,
//         isEnter: isEnter
//       });
//     }

//     /**
//      * check when delete line
//      **/
//     if (remove.length == 2) {
//       for (var i in comments) {
//         if (comments[i].line > enterline - 1 && comments[i].file == fileName) {
//           isDelete = true;
//           comments[i].line = parseInt(comments[i].line) - 1;
//         }
//       }
//       socket.emit("move hilight", {
//         fileName: fileName,
//         comments: comments,
//         enterline: enterline,
//         isDelete: isDelete
//       });
//     }

//     socket.emit("code change", {
//       code: data,
//       editor: blockObj.editor.getValue(),
//       user: user,
//       enterline: enterline,
//       isEnter: isEnter,
//       isDelete: isDelete,
//       currentTab: fileName,
//       fileName: fileName
//     });
//   });
// }

/**
 * Recieve new changes editor value from server and applied them to local editor
 */
// socket.on("editor update", payload => {
//   var blockObj = editors.find(obj => {
//     return obj.blockId == payload.fileName;
//   });
//   blockObj.editor.replaceRange(payload.text, payload.from, payload.to);
//   setTimeout(function() {
//     blockObj.editor.refresh();
//   }, 1);
// });

/**
 * User join the project
 */
socket.emit("load playground", { programming_style: "Collaborative" });
socket.emit("join project", {
  notebookAssingmentId: notebookAssingmentId
});

socket.on("init state", payload => {
  if (payload.editor != null) {
    console.log("payload.editor", payload.editor)
    var editorValues = JSON.parse(payload.editor);
    console.log("editorValues", editorValues)
    // projectFiles.forEach(setEditorValue);
    console.log("editors", editors)
    for(var i = 0; i < editorValues.length; i++){
      console.log("editorValues.length", editorValues.length)
      if(editorValues[i]["cellType"] == "code"){
        console.log("i", i)
        setEditorValue(i)
      }
     
    }
  } else {
    editors[0].editor.setValue("");
  }
 
  function setEditorValue(fileName) {
    if (editorValues != null) {
      var blockObj = editors.find(obj => {
        return obj.blockId == fileName;
      });
      blockObj.editor.setValue(editorValues[fileName]["source"]);
      currentFileName = fileName;
    }
  }

  code = payload.editor;
});