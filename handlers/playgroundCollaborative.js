const winston = require("winston");
const mongoose = require("mongoose");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const conMysql = require("../mySql");
const fs = require("fs");
const Project = mongoose.model("Project");
const childprocess = require("child_process");


// Import Turndown module
const TurndownService = require('turndown');

// Create an instance of the turndown service
let turndownService = new TurndownService();
var maxExecution;


module.exports = (io, client,redis, Projects) => {
  /**
   * recieve project id from client and stored in projectId
   **/
  let projectId = "";
  let notebookAssingmentId = "";
  let blockId = ""
  let pythonProcess = null;
  let focusBlock = null;
  let bufferOutput = { output: "", error: "" };
  let isSpawnText = false;
  let executionCount;

  spawnPython();
  detectOutput();
  winston.info("Client connected");

  client.on("join project", async payload => {
    try {
        notebookAssingmentId = cryptr.decrypt(payload.notebookAssingmentId),
        projectId = payload.pid;
        client.join(projectId);
        initRemainder();
    } catch (e) {
    
    }
  });

  


  client.on("code change",  payload => {
    const origin = !!payload.code.origin && payload.code.origin !== "setValue";
    // console.log("detectFocusBlock: ", payload.detectFocusBlock)
    // winston.info("origin", payload.code.origin)
    /**
     * origin mustn't be an `undefined` or `setValue` type
     */
    if (origin) {
      // winston.info(`Emitted 'editor update' to client with pid: ${projectId}`)
      payload.code.fileName = payload.fileName;
      client.to(projectId).emit("editor update", payload.code);
      editorName = payload.fileName;
      console.log("editorName: ", editorName)
      redis.hgetall( "notebookAssignment:"+ notebookAssingmentId,
       function(err, obj) {
        let cells = {};
        if (obj.cells != undefined) {
          cells = JSON.parse(obj.cells);
          // console.log("celss test: ", cells)
          let cellValue = cells.find(member => {
            return member.blockId == editorName
          })
          // console.log("[cellValue.blockId]: ", [cellValue.blockId])
          cellValue.source = payload.editor
          // console.log("cellValue: ", cellValue)
          cells[payload.detectFocusBlock] = cellValue;
        }
        else{
          console.log("undefind")
        }
        redis.hset(
            "notebookAssignment:"+ notebookAssingmentId,
            "cells",
            JSON.stringify(cells)
        );
      });
     
    }
  });


  client.on ("save code", async payload => {
    let filename = await getFilePath(notebookAssingmentId)
    let fileNotebook = await getFileNotebook(notebookAssingmentId)
    let filePath = "./public/notebookAssignment/"+filename+"/"+ payload.pid+"/"+filename+".ipynb"
    fs.writeFileSync(filePath, fileNotebook, 'utf8', err =>  {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log(filePath + " has been saved!");
  
    });
  });

  /**
   * `run code` event fired when user click on run button from front-end
   * @param {Object} payload code from editor
   */
  client.on("run code", async payload => {

    blockId = payload.blockId
    let codeFocusBlock = payload.codeFocusBlock;
    focusBlock = payload.focusBlock;
    isSpawnText = false;
    io.in(projectId).emit("focus block", focusBlock);

    filePath = await getFilePath(notebookAssingmentId)
      fs.writeFile(
        "./public/notebookAssignment/" + filePath+"/"+projectId + "/main.py",
        codeFocusBlock,
        err => {
          if (err) throw err;
        }
      );

      
    setTimeout(execCode, 100);
    function execCode() {
      /**
       * built-in functions of python version 3
      //  */

      pythonProcess.stdin.write(
        "exec(open('./public/notebookAssignment/" +
        filePath +
          "/"+projectId+"/main.py').read())\n"
      );
      }

    /**
     * display In[*]
     */
    //ดูวิธีเรียกตรงนี้อีกที คิดว่าต้องใช้ io.in
    getCurrentExecute(notebookAssingmentId)

  });

  function spawnPython() {
    pythonProcess = childprocess.spawn("python", ["-i"], {});
    isSpawnText = true;
  }

  function detectOutput() {
    /**
     * detection output is a execution code
     */

    pythonProcess.stdout.on("data", data => {
      if (bufferOutput.error == "" && data.toString() != "") {
        bufferOutput.output = data.toString();
      }
    });
    /**
     * detection code execute error
     */
    pythonProcess.stderr.on("data", data => {
      output = data.toString();

      var arrowLocation = output.indexOf(">>>");
      var drawArrow = "";

      if (arrowLocation == 0) {
        drawArrow = output.slice(0, 3);
      } else {
        drawArrow = output.slice(arrowLocation, arrowLocation + 3);
        output = output.slice(0, arrowLocation - 1);
      }

      if (output.indexOf("Error") != -1) {
        bufferOutput.error += output;
      } else if (drawArrow != ">>>" && !isSpawnText) {
        bufferOutput.error = bufferOutput.error + output + "\n";
      }

      /**
       * execute code process finised
       */
      if (drawArrow == ">>>" && !isSpawnText) {
        if (bufferOutput.error == "" && bufferOutput.output != "") {
          output = bufferOutput.output;
          output = output.split("\n")
              for (i  in output) {
                output[i] = output[i].replace(new RegExp('\r', 'g'), '\n')
                if(output[i] == ''){
                  output.pop();
                }
              }
  
          redis.hgetall( "notebookAssignment:"+ notebookAssingmentId,
          function(err, obj) {
            let cells = {};
            if (obj.cells != undefined) {
              cells = JSON.parse(obj.cells);
              let cellValue = cells.find(member => {
                return member.blockId == blockId
              })

              cellValue.executionCount = maxExecution
              cellValue.outputs = [ { text: output}]
              cells[focusBlock] = cellValue;
              
            }
            redis.hset(
                "notebookAssignment:"+ notebookAssingmentId,
                "cells",
                JSON.stringify(cells)
            );
          });
        }
        else {
          output = bufferOutput.error;
        }
        
        if (output != "") {
          io.in(projectId).emit("show output", output);
        }else {
            output = []
            redis.hgetall( "notebookAssignment:"+ notebookAssingmentId,
            function(err, obj) {
              let cells = {};
              if (obj.cells != undefined) {
                cells = JSON.parse(obj.cells);
               
                let cellValue = cells.find(member => {
                  return member.blockId == blockId
                })
                cellValue.outputs = output
                cells[focusBlock] = cellValue;
              }

              redis.hset(
                  "notebookAssignment:"+ notebookAssingmentId,
                  "cells",
                  JSON.stringify(cells)
              );
            });

            io.in(projectId).emit("show output", output);
           
        }

        bufferOutput.output = "";
        bufferOutput.error = "";

        /**
         * increment execution count
         */
        // io.in(projectId).emit("update execution count", ++executionCount);

      }
      // getCurrentExecute(notebookAssingmentId)
      // io.emit("update execution count", ++executionCount);

    });
  }
  /**
   * `add block` event  when user add new block
   * @param {Object} payload blockId
   */
  client.on("add block below", async payload => {
 
    let notebookAssignmentRedis = await redis.hget( "notebookAssignment:"+notebookAssingmentId, "cells");
    let notebookAssignment = JSON.parse(notebookAssignmentRedis)
    
    item = {
      cellType: 'code',
      executionCount: null,
      outputs: [],
      source:"",
      blockId:payload.blockId.toString()
    }

    notebookAssignment.splice(payload.index, 0 , item)
   
    /**
     * save file to redis
     **/
    redis.hset("notebookAssignment:"+notebookAssingmentId, "cells", JSON.stringify(notebookAssignment));
  

    io.in(projectId).emit("update block", {
      blockId: payload.blockId,
      index: payload.index,
      action: "add"
    });
  });

  async function getCurrentExecute (notebookAssingmentId){
    console.log("getCurrentExecute")
    listExe = []
    let notebookAssignmentRedis = await redis.hget( "notebookAssignment:"+notebookAssingmentId, "cells");
    let notebookAssignment = JSON.parse(notebookAssignmentRedis)
    // console.log("notebookAssignment: ", notebookAssignment)
    for (x in notebookAssignment) {
      cell_type = notebookAssignment[x]["cellType"];
      if ( cell_type != 'markdown') {
         execution_count = notebookAssignment[x]["executionCount"]
          listExe.push(execution_count)
      }

    }
    let maxExe = Math.max.apply(Math, listExe);
     maxExecution = maxExe

    console.log("listExe = " , maxExe)
    io.in(projectId).emit("update execution count", ++maxExecution);


  }

  async function getFilePath (notebookAssingmentId){
    const queryNotebookAssignment =
    "SELECT * FROM notebook_assignment WHERE notebook_assignment_id = " + notebookAssingmentId;
    let notebookAssignment = await conMysql.selectAssignment(queryNotebookAssignment);
    return notebookAssignment[0]["filePath"].split(".ipynb")[0]
  }

  async function getFileNotebook(notebookAssingmentId){
    fileExport = new Array()
    let metadata = {}
    let notebookAssignmentRedis = await redis.hget( "notebookAssignment:"+notebookAssingmentId, "cells");
    let notebookAssignment = JSON.parse(notebookAssignmentRedis)

    for (x in notebookAssignment) {
      cell_type = notebookAssignment[x]["cellType"];
      var html2Md = []
          if ( cell_type == 'markdown') {
            let sourceX = notebookAssignment[x]["source"];
            sourceX = sourceX.replace(new RegExp('<', 'g'), '&lt;').replace(new RegExp('>', 'g'), '&gt;')
                
              // Use the turndown method from the created instance
              // to convert the first argument (HTML string) to Markdown
              sourceInfo = turndownService.turndown(sourceX)
              html2Md.push(sourceInfo)   
              source = html2Md 
              let fileInfo = {
                cell_type,
              metadata,
              source
              } 
              fileExport.push(fileInfo)
          }
          else{
            source = notebookAssignment[x]["source"]; 
            source = source.replace("\n","\n,,").split(",,")
            let execution_count = notebookAssignment[x]["executionCount"]
            if(notebookAssignment[x]["outputs"].length != 0){
              let name = "stdout"
              let output_type = "stream"
              key = "text"
              let text =  notebookAssignment[x]["outputs"][0][key]
                outputs = [{
                name , 
                output_type,
                text
              }]
  
            }else{
              outputs = []
            }
  
  
            let fileInfo = {
            cell_type,
            execution_count,
            metadata,
            outputs,
            source
            } 
  
            fileExport.push(fileInfo)
  
          }

        } 
    
    let fileNotebook = 
      {
        "cells": fileExport,
        "metadata": {
          "kernelspec": {
          "display_name": "Python 3",
          "language": "python",
          "name": "python3"
          },
          "language_info": {
            "codemirror_mode": {
            "name": "ipython",
            "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.7.3"
          }
          },
          "nbformat": 4,
          "nbformat_minor": 2
      }
    
    return JSON.stringify(fileNotebook)
  }

  async function initRemainder() {
    client.emit("init state", {
      editor: await redis.hget(
        "notebookAssignment:"+ notebookAssingmentId,
        "cells",
        (err, res) => res
      )
    });
  }

  client.on("codemirror on focus", payload => {
    io.in(projectId).emit("update block highlight", {
      prevFocus: payload.prevFocus,
      newFocus: payload.newFocus
    });
  });
  

  client.on("disconnect", () => {
    try {
      winston.info("Client disconnected");
    } catch (error) {
      winston.info(`catching error: ${error}`);
    }
  });


};