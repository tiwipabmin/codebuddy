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



module.exports = (io, client,redis, Projects) => {
  /**
   * recieve project id from client and stored in projectId
   **/
  let projectId = "";
  let notebookAssingmentId = "";
  let pythonProcess = null;
  let focusBlock = null;
  let bufferOutput = { output: "", error: "" };
  let isSpawnText = false;
  let executionCount = 0;

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

  


  client.on("code change", payload => {
    const origin = !!payload.code.origin && payload.code.origin !== "setValue";
    // winston.info("origin", payload.code.origin)
    /**
     * origin mustn't be an `undefined` or `setValue` type
     */
    if (origin) {
      // winston.info(`Emitted 'editor update' to client with pid: ${projectId}`)
      payload.code.fileName = payload.fileName;
      client.to(notebookAssingmentId).emit("editor update", payload.code);
      editorName = payload.fileName;
      redis.hgetall( "notebookAssignment:"+ notebookAssingmentId,
       function(err, obj) {
        let cells = {};
        if (obj.cells != undefined) {
          cells = JSON.parse(obj.cells);
          let cellValue = cells.find(member => {
            return member.blockId == editorName
          })
          cellValue.source = payload.editor
          cells[cellValue.blockId] = cellValue;
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
  client.on("run code", payload => {
    var codeFocusBlock = payload.codeFocusBlock;
    focusBlock = payload.focusBlock;
    isSpawnText = false;

    // io.in(projectId).emit("focus block", focusBlock);
    io.emit("focus block", focusBlock);


    setTimeout(execCode, 100);

   async function execCode() {

      filePath = await getFilePath(notebookAssingmentId)
    
      fs.writeFile(
        "./public/notebookAssignment/" + filePath+"/"+projectId + "/main.py",
        codeFocusBlock,
        err => {
          if (err) throw err;
        }
      );
    
      /**
       * built-in functions of python version 3
      //  */
      console.log("pid " , projectId)

      pythonProcess.stdin.write(
        "exec(open('./public/notebookAssignment/" +
        filePath +
          "/"+projectId+"/main.py').read())\n"
      );

      


    }

    /**
     * display In[*]
     */
    // io.in(projectId).emit("update execution count", "*");
      io.emit("update execution count", "*");

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
        } else {
          output = bufferOutput.error;
        }

        if (output != "") {
          // io.in(projectId).emit("show output", output);
          io.emit("show output", output);

        }

        bufferOutput.output = "";
        bufferOutput.error = "";

        /**
         * increment execution count
         */
        // io.in(projectId).emit("update execution count", ++executionCount);
        io.emit("update execution count", ++executionCount);

      }
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
              
              // Use the turndown method from the created instance
              // to convert the first argument (HTML string) to Markdown
              sourceInfo = turndownService.turndown(notebookAssignment[x]["source"])
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