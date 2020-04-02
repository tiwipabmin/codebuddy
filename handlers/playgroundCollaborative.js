const winston = require("winston");
const mongoose = require("mongoose");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const conMysql = require("../mySql");
const fs = require("fs");
const Project = mongoose.model("Project");
const childprocess = require("child_process");
const Comment = mongoose.model("commentNotebookAssignment");
const VerificationProject = mongoose.model("VerificationProject")
const User = mongoose.model("User")
const Message = mongoose.model("collaborativeMessage");



// Import Turndown module
const TurndownService = require('turndown');

// Create an instance of the turndown service
let turndownService = new TurndownService();
var maxExecution;
let curUser = "";


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
  let comments = [];


  spawnPython();
  detectOutput();
  winston.info("Client connected");

  client.on("join project", async payload => {
    curUser = payload.username;
    console.log(" curUser ------------ " , curUser)
    try {
        notebookAssingmentId = cryptr.decrypt(payload.notebookAssingmentId),
        projectId = payload.pid;
        winston.info(`User ${payload.username} joined at pid: ${payload.pid}`);
        client.join(projectId);
        initRemainder();
    } catch (e) {
    
    }
  });


  client.on("update block status",  payload => {
    io.in(projectId).emit("update blockStatus", payload.blockStatus );

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

      
      // client.to(projectId).emit("editor update", payload.code);
      io.in(projectId).emit("editor update", {
        code: payload.code,
        detectFocusBlock: payload.detectFocusBlock
      });


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
  const theOneFunc = delay => {
    console.log("the one ");

  }

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
                cellValue.executionCount = maxExecution

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
   * `delete block` event fired when user click delete block
   * @param {Object} payload fileName
   */
  client.on("delete block", async payload => {
    /**
     * delete code in redis
     **/
    let code = JSON.parse(
      await redis.hget(`notebookAssignment:${notebookAssingmentId}`, "cells", (err, res) => res)
    );
   
    if (code != null) {
      code.splice(payload.index, 1)
      redis.hset(`notebookAssignment:${notebookAssingmentId}`, "cells", JSON.stringify(code));
    }

    io.in(projectId).emit("update block", {
      blockId: payload.blockId,
      index: payload.index,
      action: "delete"
    });
  });

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
      blockId:payload.blockId.toString(),
      statusCode:"empty"
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
    
    listExe = []
    let notebookAssignmentRedis = await redis.hget( "notebookAssignment:"+notebookAssingmentId, "cells");
    let notebookAssignment = JSON.parse(notebookAssignmentRedis)
    
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
      newFocus: payload.newFocus,
      readOnlyStatus: payload.readOnlyStatus
    });
  });
  
  /**
   * set review to mongoDB
   **/
  client.on("submit review", payload => {
    var found = false;
    console.log( "payload.des =  " , payload.description)
    /**
     * if there's no comment in array => add to DB and array
     **/
    if (comments.length == 0) {
      saveComment(payload);
    } else {
      /**
       * edit comment in exist line => update in DB
       **/
      for (var i in comments) {
        if (
          comments[i].line == payload.line &&
          comments[i].bid == payload.bid
        ) {
          found = true;
          index = i;
        }
      }
      if (found) {
        if (payload.description == "") {
          Comment.findOne({
            bid: payload.bid,
            pid: projectId,
            line: payload.line
          })
            .remove()
            .exec();
          comments.splice(index, 1);
        } else {
          Comment.update(
            {
              bid: payload.bid,
              pid: projectId,
              line: payload.line
            },
            {
              $set: {
                description: payload.description
              }
            },
            err => {
              if (err) throw err;
            }
          );
          updateDesc(payload.bid, payload.line, payload.description);
        }
      } else {
        saveComment(payload);
      }
    }
    io.in(projectId).emit("new review", comments);
  });

  function saveComment(payload) {
    const commentModel = {
      bid: payload.bid,
      line: parseInt(payload.line),
      pid: projectId,
      description: payload.description,
      createdAt: Date.now()
    };
    new Comment(commentModel, err => {
      if (err) throw err;
    }).save();
    comments.push({
      bid: payload.bid,
      line: parseInt(payload.line),
      description: payload.description
    });
  }

  client.on("delete review", payload => {
    Comment.findOne({
      bid: payload.bid,
      pid: projectId,
      line: payload.line
    })
      .remove()
      .exec();
    /**
     * remove deleted comment from list
     **/
    for (var i in comments) {
      if (
        comments[i].file == payload.file &&
        comments[i].line == payload.line
      ) {
        comments.splice(i, 1);
        break;
      }
    }

    io.in(projectId).emit("update after delete review", {
      comments: comments,
      bid: payload.bid,
      deleteline: payload.line
    });
  });
  
  client.on("disconnect", () => {
    try {
      winston.info("Client disconnected");
    } catch (error) {
      winston.info(`catching error: ${error}`);
    }
  });

  /**
   * `send message` event fired when user send chat message from front-end
   * @param {Object} payload code from editor
   */
  client.on("send message", payload => {
    const message = payload.message;
    const uid = payload.uid;

    
    const user = User.where({ _id: uid }).findOne(function(err, user) {
      if (err);
      if (user) {
        const messageModel = {
          pid: projectId,
          uid: uid,
          message: message,
          createdAt: Date.now(),
          img : user.img
        };
        new Message(messageModel, err => {
          if (err) throw err;
        }).save();
        const response = {
          user: user,
          message: messageModel
        };
        io.in(projectId).emit("update message", response);
      }
    });
  });


  client.on("verification update", async payload => {
    
    const origin = !!payload.code.origin && payload.code.origin !== "setValue"
    if(origin){
      let blockId = payload.blockId;
      let pid = payload.pid;
  
      let verification = await VerificationProject.findOne({$and: [{bid: blockId},{pid: pid}]})
      let user = await User.findOne({username: payload.username})
      
      let result = "";
      if(verification!==null){
        if(payload.statusCode == "empty"){
          let verificationProject = await VerificationProject.updateOne({
            $and: [{bid: blockId},{pid: pid}]},
            {
              $set:{
                codderId: curUser,
                statusCode: "edited",
                verificationStudentId: ""
              }
            }
          )
          
        }else if(payload.statusCode == "approved" || payload.statusCode == "unapproved"){
          let verificationProject = await VerificationProject.updateOne({
            $and: [{bid: blockId},{pid: pid}]},
            {
              $set:{
                amountTofix: verification.amountTofix +1,
                statusCode: payload.statusCode,
                verificationStudentId: curUser
              }
            }
          )
        }
      }else{
        if(payload.statusCode == "empty"){
          let verification = await new VerificationProject({
            pid: pid,
            bid:blockId,
            codderId: curUser,
            statusCode: "empty",
            amountTofix : 0,
            verificationStudentId:""
          }).save()
        }
      }

      let response = {
        blockId:blockId,
        statusCode:payload.statusCode,
        codderFullname: user.info.firstname+" "+user.info.lastname,
        codderId : user.username
      }
      io.in(projectId).emit("update approve icon", response);
    }
   
  })
};