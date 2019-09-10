var projectFiles = JSON.parse(document.getElementById('projectFiles').value);
var editorValues = JSON.parse(document.getElementById('code').value);
var histories = JSON.parse(document.getElementById('histories').value);
var creator = document.getElementById('creator').value;
let editor = {};

projectFiles.forEach(setEditor);
projectFiles.forEach(setEditorValue);

function setEditor(fileName){
  console.log('FileName, ', fileName)
  if(!(fileName in editor)) {
    editor[fileName] = CodeMirror.fromTextArea(document.getElementById(fileName+"text"), {
      lineNumbers: true,
      mode: {
        singleLineStringErrors: false,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true
      },
      theme: 'material',
      indentUnit: 4,
      matchBrackets: true
    })
    editor[fileName].setOption('readOnly', 'nocursor')
  }
}

function setEditorValue(fileName) {
  if(editorValues!=null){
    editor[fileName].setValue(editorValues[fileName])
  }
}

function getActiveTab(fileName){
    setTimeout(function() {
        editor[fileName].refresh();
      }, 1);
}

for(var i in histories){
  if(histories[i].user == creator){
      editor[histories[i].file].markText({line: parseInt(histories[i].line), ch: parseInt(histories[i].ch)},
      {line: parseInt(histories[i].line), ch: parseInt(histories[i].ch)+1},
      {className: "styled-background"});
      console.log('User: '+histories[i].user+', ', histories[i].line)
  } else {
      editor[histories[i].file].markText({line: parseInt(histories[i].line), ch: parseInt(histories[i].ch)},
      {line: parseInt(histories[i].line), ch: parseInt(histories[i].ch)+1},
      {className: "styled-background-2"});
      console.log('User: '+histories[i].user+', ', histories[i].line)
  }
}
