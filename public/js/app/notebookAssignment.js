const socket = io();
var detectFocusBlock = 0;
var editors = [];
var comments = [];


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
  let cellType = projectFiles[i]["cellType"]

  // if(cellType == "code"){
    newEditorFacade(i,cellType)
  // }

  
}




function newEditorFacade(fileName, cellType) {
  console.log("newEditorFacade")
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
  console.log("editors", editors)
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
    console.log("data.text.toString() : " + data.text.toString());
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
    console.log("data",  data)
    console.log("blockObj.editor.getValue()",  blockObj.editor.getValue())
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
  notebookAssingmentId: notebookAssingmentId
});

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
      console.log("editorValues[fileName]", editorValues[fileName]["source"])
      currentFileName = fileName;
    }
  }

  code = payload.editor;
});

function exportNotebookFile(notebookAssingmentId , notebookAssingmenTitle){



  console.log(" exportNotebookFile " + notebookAssingmentId + "  " + notebookAssingmenTitle)

  var formData = new FormData();
  formData.append('notebookAssingmentId',notebookAssingmentId);
  formData.append('notebookAssingmenTitle', notebookAssingmenTitle);

  const options = {
    method: 'POST',
    body: formData
  };

  // console.log('notebookAssingmentId: ', options.body.getAll('notebookAssingmentId'))
   

  $.post("/notebookAssignment/export", notebookAssingmentId +","+ notebookAssingmenTitle)
  // $.ajax({
  //   url: "/notebookAssignment/export",
  //   type: "post",
  //   data: formData,
  //   success: function(res) {
  //   }});

  // fetch('/notebookAssignment/export', options);
}
