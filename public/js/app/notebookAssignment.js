const socket = io();
var detectFocusBlock = 0;
var editors = [];
var comments = [];
var executingBlock;
var output = {};
var sizeOutputObjects = 0;
var blockStatus = []

function getCodeFocusBlock() {
  var codeFocusBlock = editors[detectFocusBlock].editor.getValue();
  return codeFocusBlock;
}

socket.on("update blockStatus", payload => {
  console.log(" payload.sattus front" , payload)
  blockStatus = payload
});
/**
 * Run code
 */
function runCode() {
  socket.emit("run code", {
    codeFocusBlock: getCodeFocusBlock(),
    focusBlock: detectFocusBlock,
    blockId: editors[detectFocusBlock].blockId
  });

}

socket.on("show output", payload => {
  let blockId = editors[executingBlock].blockId;
  
 
  if(payload.length == 0){
    // output is null but interface has old output
    checkOutput = document.getElementById(blockId + "-div-output")
    if(checkOutput != null){
      $("div").remove("#"+blockId + "-div-output");
    }
  }else {
    let outputs = ""
    for(i in payload){
      outputs += payload[i].replace('\n','<br>') 
    }
    
    checkOutput = document.getElementById(blockId + "-div-output")
    
    if(checkOutput == null){
      // output is not null and interface has old output
      addDivOutput(outputs , blockId)
    }else{
       // output is not null and interface don't has old output
      document.getElementById(blockId + "-div-output").innerHTML = outputs;
    }
  }
  
});

function addDivOutput(textOutput, blockId) {

  let divisionCodeBlock = document.createElement("div");
  let html =
        '<div output_subarea output_text style="padding-left:8em; padding-right:25px; ">'+
        '<div id="'+
        blockId +
        '-div-output" style="background-color: #f5f5f5; margin-top: 25px;margin-bottom: 1em; padding-left:2em;padding-top:1em;padding-bottom:1em; padding-right:25px; border: 10px; solid #cfcfcf; border-radius: 2px;">'+
        '</div>'+'</div>'
  divisionCodeBlock.className = blockId+"-output";

  divisionCodeBlock.innerHTML = html;
 
  $(divisionCodeBlock).insertAfter('div#'+blockId+'-input.input');
 
  document.getElementById(blockId + "-div-output").innerHTML = textOutput;

}

function insertAfter(el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

function getCodeFocusBlock() {
  var codeFocusBlock = editors[detectFocusBlock].editor.getValue();
  return codeFocusBlock;
}
socket.on("update execution count", payload => {
  var blockId = editors[executingBlock].blockId;
  document.getElementById(blockId + "-in").innerHTML = "In [" + payload + "]:";
});

function addBlock() {
  console.log("editors 1 ", editors)
    socket.emit("add block below", {
      blockId: Object.keys(projectFiles).length+1,
      index:  detectFocusBlock+1,
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

    newEditorFacade(i,cellType)

}

function newEditorFacade(fileName, cellType) {
  setEditor(fileName, cellType);
  setOnChangeEditer(fileName);
  setOnDoubleClickEditor(fileName);

 
}
function setOnDoubleClickEditor(fileName) {
  console.log(" setOnDoubleClickEditor ------------------")
}

function setStatusBlock(detectFocusBlock , cm){

  preFocusBlock = editors
      .map(function(obj) {
        // console.log("obj ", obj)
        return obj.editor;
      })
      .indexOf(cm);
  // check if owner change block
  //true = delete block id in list
  activeOwner = blockStatus.map(function(d) { return d['owner']; });
 if(activeOwner.includes(user)){
    const index = blockStatus.findIndex(x => x.owner === user);
    blockStatus.splice(index, 1);

   //delete block id in list
   socket.emit("update block status", {
    blockStatus: blockStatus
    
  });

  cm.setOption("readOnly", false); 

 }
    //check if blockId in list of blockStatus ??

  const checkBlockId = blockStatus => blockStatus.id === detectFocusBlock;

  if(blockStatus.some(checkBlockId)){
    console.log(" IN ")
    console.log(" lock ---------------" , blockStatus)

    return "lock"

  }else{
    console.log(" OUT ")
    let block  = {
      id : detectFocusBlock,
      owner : user
      
    }

    blockStatus.push(block)
    socket.emit("update block status", {
      blockStatus: blockStatus
      
    });
    console.log(" unLock ---------------" , blockStatus)

    return "unLock"

  }


}

function setEditor(fileName, cellType) {
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
        // console.log("obj ", obj)
        return obj.editor;
      })
      .indexOf(cm);

      console.log(`SET Detect focus block!! ${detectFocusBlock}`);
      status = setStatusBlock(detectFocusBlock , cm)
      console.log("editors[detectFocusBlock].blockId " , editors[detectFocusBlock].blockId)

      if(status == 'unLock'){
        cm.setOption("cursorBlinkRate", 0); // cant edit

        cm.setOption("readOnly", false); 

        socket.emit("codemirror on focus", {
          prevFocus: prevFocusBlock,
          newFocus: detectFocusBlock
        });
    
        document.getElementById(
          editors[prevFocusBlock].blockId + "-div"
        ).style.border = "";
        document.getElementById(
          editors[detectFocusBlock].blockId + "-div"
        ).style.border = "thin solid #2185d0";
        document.getElementById(
          editors[detectFocusBlock].blockId + "-div"
        ).style.borderLeft = "thick solid #2185d0";

      }else{
        socket.emit("codemirror on focus", {
          prevFocus: prevFocusBlock,
          newFocus: detectFocusBlock
        });
        document.getElementById(
          editors[prevFocusBlock].blockId + "-div"
        ).style.border = "";

        cm.setOption("readOnly", true); // cant edit
        cm.setOption("cursorBlinkRate", -1); // cant edit

      
      }
  
    
  });
  editors.push({ blockId: fileName, editor: cm });
}


function submitReview() {

  console.log("submit   Review ")
  // socket.emit("submit review", {
  //   file: $("input.hidden.file.name").val(),
  //   line: parseInt($("input.disabled.line.no").val()),
  //   description: $("textarea.line.reviewer.description").val()
  // });
  // $("textarea.line.description").val("");
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
      detectFocusBlock: detectFocusBlock,
      enterline: enterline,
      isEnter: isEnter,
      isDelete: isDelete,
      currentTab: fileName,
      fileName: fileName
    });
  });
}

/**
 * Update focus block of both user
 **/
socket.on("focus block", payload => {
  executingBlock = payload;
  if (executingBlock != editors.length - 1) {
   
    editors[detectFocusBlock].editor.focus();
    editors[detectFocusBlock].editor.setCursor(0, 0);
  }
});

/**
 * Recieve new changes editor value from server and applied them to local editor
 */
socket.on("editor update", payload => {
  console.log("editor update")
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
  pid: getParameterByName("pid"),
  username: user

});

/**
 * Update block when add
 */
socket.on("update block", payload => {
  
  console.log("update block ---------------*")
  let blockId = payload.blockId;
  let index = payload.index;

  let action = payload.action;
  
  if (action == "add") {
    let divisionCodeBlock = document.createElement("div");
    let html =
      '<div id="'+blockId+'-input" class="input">' +
        '<div class="prompt_container" >'+
          '<div class="prompt input_prompt" id="'+blockId + '-in">'+
            '<bdi> In &nbsp;</bdi>'+
            '<bdi>[]</bdi>'+
          '</div>'+
        '</div>'+
        
        '<div class="inner_cell" >'+
          '<div class="input_area" style="margin-top: 25px; padding-left:8em; padding-right:25px; border: 10px; solid #cfcfcf; border-radius: 2px;">'+
            '<textarea class="show" id="'+blockId+'" > </textarea>'+
          '</div>'+
        '</div>'+
      '</div>'
     

    divisionCodeBlock.className = "cell code_cell rendered";
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
      document.getElementById(blockId),
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
    setOnChangeEditer(blockId);
    setOnDoubleClickEditor(blockId);

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

      console.log("prevFocusBlock ", prevFocusBlock)
      console.log("detectFocusBlock ", detectFocusBlock)
      //update focus block when after user addblock and focus that block
      socket.emit("codemirror on focus", {
        prevFocus: prevFocusBlock,
        newFocus: detectFocusBlock
      });
      document.getElementById(
        editors[prevFocusBlock].blockId + "-div"
      ).style.border = "";
      document.getElementById(
        editors[detectFocusBlock].blockId + "-div"
      ).style.border = "thin solid #2185d0";
      document.getElementById(
        editors[detectFocusBlock].blockId + "-div"
      ).style.borderLeft = "thick solid #2185d0";
      console.log(`update Detect focus block!! ${detectFocusBlock}`);
      let c = cm.getCursor();
      let lineText = cm.getRange({line: c.line, ch: 0}, {line: c.line, ch: c.ch});
      let SPACES_REGEXP = /^( +$)/;
      // Detecting whether the lineText contains only spaces.
      let m = SPACES_REGEXP.exec(lineText);
      if (m) {
        // If only spaces, deleting at most 4 spaces.
        let numDelete = m[1].length < 4 ? m[1].length : 4;
        cm.replaceRange('', {line: c.line, ch: 0}, {line: c.line, ch: numDelete});
      } 
    });


    
    editors.splice(index, 0, { blockId: blockId, editor: cm });
   
    projectFiles.splice(index, 0, {cellType: "code", executionCount: null, outputs: Array(0), source: "", blockId: blockId.toString()});

    setOnChangeEditer(blockId);
    setOnDoubleClickEditor(blockId);
  
  } 
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
   
    var editorValues = JSON.parse(payload.editor);
    //  console.log("editorValues", editorValues)

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



function exportNotebookFileStudent(dirPath , notebookAssingmentId){



  console.log(" exportNotebookFile dirpath = " + dirPath)


  const options = {
    dirPath : dirPath ,
    notebookAssingmentId : notebookAssingmentId
    };

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
