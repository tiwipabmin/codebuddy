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
        '<div output_subarea output_text style="padding-left:8em; padding-right:25px;">'+
        '<div id="'+
        blockId +
        '-div-output" style="background-color: #f5f5f5; margin-top: 10px;margin-bottom: 1em; padding-left:2em;padding-bottom:1em; padding-right:25px; border: 10px; solid #cfcfcf; border-radius: 2px;">'+
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


function deleteBlock() {

  let parameters = JSON.stringify({
    blockId:editors[detectFocusBlock].blockId,
    index: detectFocusBlock
  })
  

  $("#confirm-button").attr(
    "onclick",
    "on_click_confirm_button(" + parameters + ")"
  );
  $("#confirm-header").text("Delete Block");
  $("#confirm-message").attr(
    "value",
    "Are you sure you want to delete this block?"
  );
  $("#confirm-message").text(
    "Are you sure you want to delete this block?"
  );
  $("#confirm-modal").modal("show");

}

function addBlock() {
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




for(var i = 0; i < projectFiles.length; i++){
  let cellType = projectFiles[i]["cellType"]

    newEditorFacade(i,cellType)

}




function newEditorFacade(fileName, cellType) {
  setEditor(fileName, cellType);
  setOnChangeEditer(fileName);
  setOnDoubleClickEditor(fileName);

 
}

// function setTime () {
//   console.log("the one blockStatus = " , blockStatus);
  
//   let index = blockStatus.findIndex(x => x.id === detectFocusBlock)
//   blockStatus.splice(index, 1);
//   socket.emit("update block status", {
//     blockStatus: blockStatus
    
//   });

//   var prevFocusBlock = detectFocusBlock;

//   socket.emit("codemirror on focus", {
//     prevFocus: prevFocusBlock,
//     newFocus: -1,
//     readOnlyStatus: false
//   });

// }

function setStatusBlock(detectFocusBlock , cm){
  preFocusBlock = editors
      .map(function(obj) {
        return obj.editor;
      })
      .indexOf(cm);
  // check if owner change block
  //true = delete block id in list
  activeOwner = blockStatus.map(function(d) { return d['owner']; });
 if(activeOwner.includes(user)){
    let index = blockStatus.findIndex(x => x.owner === user);
    blockStatus.splice(index, 1);

   //delete block id in list
   socket.emit("update block status", {
    blockStatus: blockStatus
    
  });

  cm.setOption("readOnly", false); //can edit

 }
    //check if blockId in list of blockStatus ??

  const checkBlockId = blockStatus => blockStatus.id === detectFocusBlock;

  if(blockStatus.some(checkBlockId)){
    
    return "lock"

  }
  else{
    
    let block  = {
      id : detectFocusBlock,
      owner : user
    }
    // console.log("set timeout : ", setTimeout(setTime, 10000)  )
    // console.log("unlock " , block)

    // jj author
    //  let block  = {
    //     id : detectFocusBlock,
    //     owner : user

    //   }
    
    /**
     * push block status and emit
     */
    blockStatus.push(block)
    socket.emit("update block status", {
      blockStatus: blockStatus
      
    });

    // console.log("blockStatus : ",blockStatus)



  // socket.emit("update block status2", {
  //       id : detectFocusBlock,
  //       owner : user
  //   }); 
    return "unLock"

  }

}

/**
 * check point 4
 * jj author auto unlock
 */
socket.on("update block status timeout", payload => {
  
  let timeoutBlockId = payload.id
  let activeBlockId = blockStatus.map(function(d) { return d['id']; });

   if(activeBlockId.includes(timeoutBlockId)){
    let index = blockStatus.findIndex(x => x.id === timeoutBlockId);
    blockStatus.splice(index, 1);

    /**
     * check point 5
     * ส่งค่า blockStatus ไปอัปเดตทั้งสองฝั่ง
     */
   socket.emit("update block status", {
    blockStatus: blockStatus
  });


    /**
     * check point 6
     * ส่งค่า readOnlyStatus = timeout ไป เพื่ออัปเดต hightlight
     */
    socket.emit("codemirror on focus", {
      prevFocus: 0,
      newFocus: timeoutBlockId,
      readOnlyStatus: "timeout"
    });

    if(payload.owner == user){
      $("#blockTimeout").modal("show");
    }
 }
});




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
     
      if(status == 'unLock'){
        cm.setOption("cursorBlinkRate", 530); // can edit

        cm.setOption("readOnly", false);
         
        // let detectFocusBlock2 = editors[detectFocusBlock]
        
         /**
          * check point 1
          * jj author auto unlock
          * เปลี่ยนชื่อได้ ล้อมาจากชื่อเก่าของ aew
          */
          socket.emit("update block status2", {
            id : detectFocusBlock,
            owner : user,
            code: {origin:true}
          }); 

        socket.emit("codemirror on focus", {
          prevFocus: prevFocusBlock,
          newFocus: detectFocusBlock,
          readOnlyStatus: false
        });

      }else{
        console.log( " prevFocusBlock when click lock block " , prevFocusBlock )
        socket.emit("codemirror on focus", {
          prevFocus: prevFocusBlock,
          newFocus: detectFocusBlock,
          readOnlyStatus: true
        });

        cm.setOption("readOnly", true); // cant edit
        cm.setOption("cursorBlinkRate", -1); // cant edit
        
      
      }
     
    
  });
  editors.push({ blockId: fileName, editor: cm });
}

function setOnDoubleClickEditor(BID) {

  var blockObj = editors.find(obj => {
    return obj.blockId == BID;
  });
  blockObj.editor.on("dblclick", () => {
    let codeder =  document.getElementById(`${BID}-codeder`).getAttribute("value")

    if(codeder != user && codeder!="undefined"){
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
      $("input.disabled.file.name").val(BID );
      $("input.hidden.file.name").val(BID);
      let line = $("input.disabled.line.no").val();
      for (var i in comments) {
        console.log(" i = " , i)
        console.log(" comments[i].BID " , comments[i].bid)
        if (
          comments[i].bid == BID &&
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

    }else{
      $("#alert-header").text("Verification error");
      $("#alert-message").text(
        'You do not have permission to verify this code.'
      );
      $("#alert-modal").modal("show");
    }
    
  });
}
function submitReview() {

  socket.emit("submit review", {
    bid: $("input.hidden.file.name").val(),
    line: parseInt($("input.disabled.line.no").val()),
    description: $("textarea.line.reviewer.description").val()
  });
  $("textarea.line.description").val("");

  socket.emit("verification update", {
    blockId: editors[detectFocusBlock].blockId,
    pid: document.getElementById("pid").valu,
    statusCode: "unapproved",
    code: {origin:true},
    username:user
  })
}

socket.on("new review", payload => {
  comments = payload;
  comments.map(comment => {
    var blockObj = editors.find(obj => {
      return obj.blockId == comment.bid;
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
    bid: $("input.hidden.file.name").val(),
    line: $("input.disabled.line.no").val(),
    description: $("textarea.line.reviewer.description").val()
  });
}

socket.on("update after delete review", payload => {

  var blockObj = editors.find(obj => {
    return obj.blockId == payload.bid;
  });
  comments = payload.comments;
  deleteline = payload.deleteline;
  blockObj.editor.removeLineClass(
    parseInt(deleteline - 1),
    "wrap",
    "CodeMirror-activeline-background"
  );
});

function setOnChangeEditer(fileName) {
  /**
   * Local editor value is changing, to handle that we'll emit our changes to server
   */
  var blockObj = editors.find(obj => {
    return obj.blockId == fileName;
  });

 
  blockObj.editor.on("change", (ins, data) => {
   
    var text = data.text.toString().charCodeAt(0);
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

      //move red comment
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
      detectFocusBlock: detectFocusBlock,
      enterline: enterline,
      isEnter: isEnter,
      isDelete: isDelete,
      currentTab: fileName,
      fileName: fileName,
      detectFocusBlock : detectFocusBlock
    });

    // update verification icon
     socket.emit("verification update", {
        blockId: editors[detectFocusBlock].blockId,
        pid: document.getElementById("pid").value,
        statusCode: "empty",
        username:user,
        code: data,
      })
   
    
      /**
       * restart timer
       * jj author auto unlock
       * เปลี่ยนชื่อได้ ล้อมาจากชื่อเก่าของ aew
       */ 
    socket.emit("update block status2", {
      id : detectFocusBlock,
      owner : user,
      code: data
    }); 
  });
}

// function updateTimeStatus(blockChange){
//  if( blockStatus[0] != undefined){
 
//     let i = blockStatus.findIndex(x => x.id === blockChange);
   
//       if(blockStatus[i] != undefined){
//         console.log( " i = " , i)
//         clearTimeout(blockStatus[i].time)
        
//         socket.emit("update block status", {
//           blockStatus: blockStatus
          
//         });
       
//       }
//    }
// }

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

  code = payload.code
  

  var blockObj = editors.find(obj => {
    return obj.blockId == payload.fileName;
    // return obj.blockId == code.fileName;
  });
  blockObj.editor.replaceRange(payload.text, payload.from, payload.to);
  // blockObj.editor.replaceRange(code.text, code.from, code.to);
  // setTimeout(function() {
  //   blockObj.editor.refresh();
  // }, 1);

  // updateTimeStatus(payload.detectFocusBlock)
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
 
  let blockId = payload.blockId;
  let index = payload.index;
  let action = payload.action;
  
  if (action == "add") {
    let divisionCodeBlock = document.createElement("div");
    let html =
    '<div class="ui grid">'+
      '<div class="two wide column">'+
          '<div class="prompt_container" >'+
            '<div class="prompt input_prompt" id="'+blockId + '-in">'+
              '<bdi> In &nbsp;</bdi>'+
              '<bdi>[]</bdi>'+
            '</div>'+
          '</div>'+
      '</div>'+

      '<div class="four wide column">'+
        `<p id="`+blockId+`-codeder" style="color: gray; margin-left: 1em"></p>`+
      '</div>'+

      '<div class="ten wide column" style="padding-right:35px;">'+
        `<button class="ui icon button float-right empty" id="`+blockId+`-unapproved" onClick="verificationUpdate('`+blockId+`','`+ getParameterByName("pid")+`','unapproved')" data-tooltip="Un approved">`+
        '<i class="close icon"></i>'+'</button>'+
        `<button class="ui icon button  float-right empty" id="`+blockId+`-approved" onClick="verificationUpdate('`+blockId+`','`+ getParameterByName("pid")+`','approved')" data-tooltip="Approved">`+
        '<i class="check icon"></i>'+'</button>'+
        `<button class="ui icon button negative float-right" id="`+blockId+`-deleteBlock"  onClick='deleteBlock()' data-tooltip="Delete Block" >`+
        '<i class="minus icon"></i>'+'</button>'+
        `<button class="ui icon button blue float-right" id="`+blockId+`-addBlock" onClick='addBlock()'  data-tooltip="Add Block">`+
        '<i class="plus icon"></i>'+'</button>'+
        `<button class="ui icon button positive float-right" id="`+blockId+`-run" onClick='runCode()' data-tooltip="Run Code">`+
        '<i class="play icon"></i>'+'</button>'+
      '</div>' +
    '</div>'+
    '<div class="inner_cell" >'+
      '<div id="'+blockId+'-input" class="input">' +
        '<div class="input_area" style="margin-top: 8px; padding-left:8em; padding-right:25px; border: 10px; solid #cfcfcf; border-radius: 2px;">'+
            '<textarea class="show" id="'+blockId+'" > </textarea>'+
        '</div>'+
      '</div>'+
    '</div>'
   
      
    

    divisionCodeBlock.className = "cell code_cell rendered";
    divisionCodeBlock.setAttribute("id", blockId + "-div");
    divisionCodeBlock.setAttribute("syle","padding-top: 2em; padding-bottom: 2em")
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
      
        // by jj
        status = setStatusBlock(detectFocusBlock , cm)
        if(status == 'unLock'){
          cm.setOption("cursorBlinkRate", 530); // can edit
  
          cm.setOption("readOnly", false); 

           /**
            * check point 1 
            * กรณี add block
            * jj author auto unlock
            * เปลี่ยนชื่อได้ ล้อมาจากชื่อเก่าของ aew
            */
          socket.emit("update block status2", {
            id : detectFocusBlock,
            owner : user,
            code: {origin:true}
          }); 
  
          socket.emit("codemirror on focus", {
            prevFocus: prevFocusBlock,
            newFocus: detectFocusBlock,
            readOnlyStatus: false
          });

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
        }else{
          socket.emit("codemirror on focus", {
            prevFocus: prevFocusBlock,
            newFocus: detectFocusBlock,
            readOnlyStatus: true
          });
      
  
          cm.setOption("readOnly", true); // cant edit
          cm.setOption("cursorBlinkRate", -1); // cant edit 
        }
    });

    editors.splice(index, 0, { blockId: blockId, editor: cm });
   
    projectFiles.splice(index, 0, {cellType: "code", executionCount: null, outputs: Array(0), source: "", blockId: blockId.toString()});
    
    setOnChangeEditer(blockId);

    setOnDoubleClickEditor(blockId);
  }  else {
    var divisionCodeBlock = document.getElementById(blockId + "-div");
    divisionCodeBlock.remove();
    editors.splice(index, 1);
    projectFiles.splice(index, 1);
  }

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


  // socket.emit("export file", {
  //   dirPath: dirPath,
  //   notebookAssingmentId: notebookAssingmentId
  // });

  const options = {
    dirPath : dirPath ,
    notebookAssingmentId : notebookAssingmentId
    };

  $.post("/notebookAssignment/StudentExport", options ,  function(data){
    const status = data.status;
    

    let a = document.createElement("a");
    a.download;
    a.target = "_blank";
    a.style = "display: none";
  
      a.href = "/api/downloadFile?filePath=" + data.filePath;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);


  })
  
}

socket.on("download file", payload => {

 
  // let fileNameListLength = payload.fileNameListLength;
  // let projectId = payload.projectId;
  let a = document.createElement("a");
  a.download;
  a.target = "_blank";
  a.style = "display: none";

    a.href = "/api/downloadFile?filePath=" + payload.filePath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
 
});

socket.on("update block highlight", payload => {

  activeBlock = blockStatus.map(function(d) { return d['id']; });
 
  if(payload.readOnlyStatus == true && payload.prevFocus != 1 && !activeBlock.includes(payload.prevFocus)){   
    document.getElementById(
              editors[payload.prevFocus].blockId + "-div"
            ).style.border = "";
  }else if(!payload.readOnlyStatus){
          if(!activeBlock.includes(payload.prevFocus) && payload.prevFocus != 1){
              document.getElementById(
                editors[payload.prevFocus].blockId + "-div"
              ).style.border = "";
           }

           
           if(payload.newFocus != -1){
             document.getElementById(
                editors[payload.newFocus].blockId + "-div"
              ).style.border = "thin solid #2185d0";
              document.getElementById(
                editors[payload.newFocus].blockId + "-div"
              ).style.borderLeft = "thick solid #2185d0";
           }
         
  }else if(payload.readOnlyStatus == "timeout"){
    
    /**
     * check point 7 
     * end
     */
    document.getElementById(
      editors[payload.newFocus].blockId + "-div"
    ).style.border = "";

  }
  });

function on_click_confirm_button(parameters){

  const message = $("#confirm-message").attr("value");

  if(message == "Are you sure you want to delete this block?"){
      socket.emit("delete block", {
        blockId: parameters.blockId,
        index: parameters.index
      });
  }else if(message == "Are you sure you want to approved this block?" || message == "Are you sure you want to unapproved this block?"){

    socket.emit("verification update", {
      blockId: parameters.blockId,
      pid: parameters.pid,
      statusCode: parameters.statusCode,
      code: {origin:true},
      username:user
    })
  }
}

function on_click_cancel_button() {
  const message = $("#confirm-message").attr("value");
  if ( message == "Are you sure you want to approved this block?" 
  || message == "Are you sure you want to unapproved this block?"
  || message == "Are you sure you want to delete this block?") {
    $("#confirm-modal").modal("hide");
  } 
}
function verificationUpdate(blockId, pid, statusCode){
  let codeder =  document.getElementById(`${blockId}-codeder`).getAttribute("value")
  if(codeder != user && codeder!="undefined" && codeder !== null){
    let parameters = JSON.stringify({
      blockId: blockId,
      pid: pid,
      statusCode: statusCode
    })
   
    $("#confirm-button").attr(
      "onclick",
      "on_click_confirm_button(" + parameters + ")"
    );
    
    $("#confirm-header").text("Verify Block");
    $("#confirm-message").attr(
      "value",
      `Are you sure you want to ${statusCode} this block?`
    );
    $("#confirm-message").text(
      `Are you sure you want to ${statusCode} this block?`
    );
    $("#confirm-modal").modal("show");
  }else{
    $("#alert-header").text("Verification error");
    $("#alert-message").text(
      'You do not have permission to verify this code.'
    );
    $("#alert-modal").modal("show");
  }
  
}


socket.on("update approve icon", payload => {
  
    if(payload.statusCode == "approved"){
      document.getElementById(payload.blockId+"-approved").setAttribute("class","ui icon button approved float-right")
      document.getElementById(payload.blockId+"-unapproved") .removeAttribute("enabled", "");
      document.getElementById(payload.blockId+"-unapproved").setAttribute("disabled", "");
    }else if(payload.statusCode == "unapproved"){
      document.getElementById(payload.blockId+"-unapproved").setAttribute("class","ui icon button unapproved float-right")
      document.getElementById(payload.blockId+"-unapproved") .removeAttribute("disabled", "");
      document.getElementById(payload.blockId+"-unapproved").setAttribute("enabled", "");
      document.getElementById(payload.blockId+"-approved") .removeAttribute("enabled", "");
      document.getElementById(payload.blockId+"-approved").setAttribute("disabled", "");
      document.getElementById(payload.blockId+"-approved").setAttribute("class", `ui icon button empty float-right`)
      

    }else if (payload.statusCode == "empty"||payload.statusCode == "edited") {
      document.getElementById(payload.blockId+"-unapproved").setAttribute("class", `ui icon button empty float-right`)
      document.getElementById(payload.blockId+"-unapproved").setAttribute("enabled", "");
      document.getElementById(payload.blockId+"-unapproved") .removeAttribute("disabled", "");
      document.getElementById(payload.blockId+"-approved").setAttribute("class", `ui icon button empty float-right`)
      document.getElementById(payload.blockId+"-approved").setAttribute("enabled", "");
      document.getElementById(payload.blockId+"-approved") .removeAttribute("disabled", "");
      
      // show coddername
      document.getElementById(`${payload.blockId}-codeder`).setAttribute("value", payload.codderId);
      $(`#${payload.blockId}-codeder`).text(payload.codderFullname)
    }
})

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

/**
 * Send Message
 */
function sendMessage(img) {
  if (document.getElementById("inputMessage").value != "") {

    socket.emit("send message", {
      uid: uid,
      message: document.getElementById("inputMessage").value
    });
  }
}

/**
 * Update message
 */
socket.on("update message", payload => {
  console.log(payload)
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
function updateScroll() {
  $(".chat-history").animate(
    { scrollTop: $(".message-list").height() },
    "fast"
  );
}