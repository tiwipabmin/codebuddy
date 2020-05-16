var editors = [];
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
  setEditorValue(fileName)
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
 
  cm.on("focus", cm => {
    cm.setOption("readOnly", true); // cant edit
    cm.setOption("cursorBlinkRate", -1); // cant edit 
  });
  editors.push({ blockId: fileName, editor: cm });
}

function setEditorValue(fileName) {
  if (projectFiles != null) {
    var blockObj = editors.find(obj => {
      return obj.blockId == fileName;
    });
    blockObj.editor.setValue(projectFiles[fileName]["source"]);
  }
}
