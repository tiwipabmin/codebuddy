const socket = io();
var detectFocusBlock = 0;
var editors = [];
var comments = [];


function addBlock() {
    console.log("addbolock jj")
    console.log("detectFocusBlock ", detectFocusBlock )
    /**
     * random block id
     **/
    socket.emit("add block below", {
      blockId: detectFocusBlock+1,
      // allBlockId: editors.map(function(obj) {
      //   return obj.blockId;
      // })
    });
  }

  var segmentCodeBlock = document.getElementById("segmentCodeBlock");

/**
 * Initiate local editor
 */
var projectFiles = JSON.parse(document.getElementById("projectFiles").value);
var notebookAssingmentId = document.getElementById("notebookAssingmentId").value;
// console.log("notebookAssingmentId", notebookAssingmentId)



for(var i = 0; i < projectFiles.length; i++){
  let cellType = projectFiles[i]["cellType"]

  // if(cellType == "code"){
    newEditorFacade(i,cellType)
  // }

  
}




function newEditorFacade(fileName, cellType) {
  setEditor(fileName, cellType);
  setOnChangeEditer(fileName);
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

function setEditor(fileName, cellType) {
  // console.log(fileName)
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

  if(cellType == "markdown"){
    var cm$ = $(cm.getWrapperElement());
    //Hide
    cm$.hide();
  }
 
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

function setOnChangeEditer(fileName) {
  /**
   * Local editor value is changing, to handle that we'll emit our changes to server
   */
  var blockObj = editors.find(obj => {
    return obj.blockId == fileName;
  });

  blockObj.editor.on("change", (ins, data) => {
    var text = data.text.toString().charCodeAt(0);
    // console.log("data.text.toString() : " + data.text.toString());
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

    // var test =  blockObj.editor.getValue();
 
    // console.log("test",test )
    // var blockObj2 = editors.find(obj => {
    //   if( obj.blockId == fileName){
    //     console.log("obj[fileName].editor", obj.editor)
    //     obj.editor.setValue(test);
    //   }
    // });
    // editors.set()
    socket.emit("code change", {
      code: data,
      editor: blockObj.editor.getValue(),
      // user: user,
      enterline: enterline,
      isEnter: isEnter,
      isDelete: isDelete,
      currentTab: fileName,
      fileName: fileName
    });
  });
}

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

/**
 * User join the project
 */
socket.emit("load playground", { programming_style: "Collaborative" });
socket.emit("join project", {
  notebookAssingmentId: notebookAssingmentId,
  pid: getParameterByName("pid")
});

/**
 * Update block when add
 */
socket.on("update block", payload => {
  console.log("update block")
  // let blockId = payload.blockId;
  // let index = payload.blockId;
  // let action = payload.action;

  // if (action == "add") {
  //   var divisionCodeBlock = document.createElement("div");
  //   var html =
  //     '<div class="input">' +
  //     '<div id="' +
  //     blockId +
  //     '-in">In [&nbsp;&nbsp;]:</div>' +
  //     '<div><textarea id="' +
  //     blockId +
  //     '"></textarea></div>' +
  //     "</div>" +
  //     '<div id="file"' +
  //     '-div-output" class="code-block">' +
  //     "<div></div>" +
  //     "</div>";

  //   divisionCodeBlock.className = "cell-code_cell-rendered";
  //   divisionCodeBlock.setAttribute("id", blockId + "-div");
  //   divisionCodeBlock.innerHTML = html;

  //   segmentCodeBlock.insertBefore(
  //     divisionCodeBlock,
  //     segmentCodeBlock.children[index]
  //   );

  //   /**
  //    * TODO: refactor setEditor with index parameter
  //    * add codemirror of new into editors array
  //    **/
  //   var cm = CodeMirror.fromTextArea(
  //     document.getElementById(blockId),
  //     {
  //       lineNumbers: true,
  //       mode: {
  //         name: "python",
  //         version: 3,
  //         singleLineStringErrors: false,
  //         styleActiveLine: true,
  //         lineNumbers: true,
  //         lineWrapping: true
  //       },
  //       theme: "material",
  //       indentUnit: 4,
  //       matchBrackets: true
  //     }
  //   );

  //   cm.addKeyMap({
  //     "Alt-R": function(cm) {
  //       runCode();
  //     },
  //     "Alt-N": function(cm) {
  //       addBlock();
  //     },
  //     "Alt-D": function(cm) {
  //       deleteBlock();
  //     },
  //     "Alt-Up": function(cm) {
  //       moveBlock("up");
  //     },
  //     "Alt-Down": function(cm) {
  //       moveBlock("down");
  //     }
  //   });

  //   cm.on("focus", cm => {
  //     var prevFocusBlock = detectFocusBlock;

  //     /**
  //      * find index of focusing codemirror in editors array.
  //      **/
  //     detectFocusBlock = editors
  //       .map(function(obj) {
  //         return obj.editor;
  //       })
  //       .indexOf(cm);

  //     socket.emit("codemirror on focus", {
  //       prevFocus: prevFocusBlock,
  //       newFocus: detectFocusBlock
  //     });
  //   });

  //   editors.splice(index, 0, { blockId: blockId, editor: cm });
   
  //   projectFiles.splice(index, 0, blockId);
  //   setOnChangeEditer(blockId);
  //   // setOnDoubleClickEditor(blockId);

  //   // switch (roles.user) {
  //   //   case "coder":
  //   //     cm.setOption("readOnly", false); // show cursor
  //   //     break;
  //   //   case "reviewer":
  //   //     cm.setOption("readOnly", "nocursor"); // no cursor
  //   //     break;
  //   // }
  // } 
  // else {
  //   var divisionCodeBlock = document.getElementById(blockId + "-div");
  //   divisionCodeBlock.remove();

  //   editors.splice(detectFocusBlock, 1);
  //   projectFiles.splice(detectFocusBlock, 1);
  // }
});

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

socket.on("init state", payload => {
  if (payload.editor != null) {
    // console.log("payload.editor", payload.editor)
    var editorValues = JSON.parse(payload.editor);
    for(var i = 0; i < editorValues.length; i++){
      // if(editorValues[i]["cellType"] == "code"){
        setEditorValue(i)
      // }
     
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

function exportNotebookFile(notebookAssingmentId , notebookAssingmenTitle){



  console.log(" exportNotebookFile " + notebookAssingmentId + "  " + notebookAssingmenTitle)


  const options = {
    notebookAssingmentId : notebookAssingmentId , 
    notebookAssingmenTitle : notebookAssingmenTitle
  };

  // console.log('notebookAssingmentId: ', options.body.getAll('notebookAssingmentId'))
   

  $.post("/notebookAssignment/export", options ,  function(data){
    const status = data.status;
    if (status == "Export File Complete!!") {
      $("#alert-header").text("Export File");
      $("#alert-message").text(status);
      $("#alert-modal").modal("show");
      // alert(status);
    }


    console.log("status  " ,  status)
  })
  
}

function exportNotebookFileStudent(dirPath , notebookAssingmentId){



  console.log(" exportNotebookFile dirpath = " + dirPath)


  const options = {
    dirPath : dirPath ,
    notebookAssingmentId : notebookAssingmentId
    };

  // console.log('notebookAssingmentId: ', options.body.getAll('notebookAssingmentId'))
   

  $.post("/notebookAssignment/StudentExport", options ,  function(data){
    const status = data.status;
    if (status == "Export File Complete!!") {
      $("#alert-header").text("Export File");
      $("#alert-message").text(status);
      $("#alert-modal").modal("show");
      // alert(status);
    }


    console.log("status  " ,  status)
  })
  
}
// <<<<<<< HEAD
// $("#alert-modal").modal({
//   closable: false,
//   transition: "fade up"
// });
// =======

/**
 * If user exit or going elsewhere which can be caused this project window closed
 * `beforeunload` event will fired and sending client disconnection to the server
 */
$(window).on("beforeunload", () => {
  let pid = document.getElementById("pid").value;
  socket.emit("save code", {
    notebookAssingmentId: notebookAssingmentId,
    pid: pid
  });
  socket.disconnect();
});

