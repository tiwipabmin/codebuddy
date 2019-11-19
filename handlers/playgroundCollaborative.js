const winston = require("winston");
const mongoose = require("mongoose");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const conMysql = require("../mySql");
const html2markdown = require('html2markdown');
const fs = require("fs");
const Project = mongoose.model("Project");

module.exports = (io, client,redis, Projects) => {
  /**
   * recieve project id from client and stored in projectId
   **/
  let projectId = "";
  let notebookAssingmentId = "";

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
        // console.log("TypeOf obj, ", typeof(obj), ', Values, ', obj)
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
      // console.log(filePath + " has been saved!");
  
    });
  });

  /**
   * `add block` event  when user add new block
   * @param {Object} payload blockId
   */
  client.on("add block below", async payload => {
    console.log("add block payload")
    /**
     * add new blockId to selected index
     **/
    console.log("projectId ", projectId)
    // console.log("notebookAssingmentId ", notebookAssingmentId)

    let notebookAssignmentRedis = await redis.hget( "notebookAssignment:"+notebookAssingmentId, "cells");
    let notebookAssignment = JSON.parse(notebookAssignmentRedis)

    for(i in notebookAssignment){
      // console.log("index ", i)
      if(i >=  payload.blockId){
        notebookAssignment[i]["blockId"] = (parseInt(i) + 1).toString()
        // console.log("notebookAssignment[i] " , notebookAssignment[i])
      }
    }

   

    item = {
      cellType: 'code',
      executionCount: null,
      outputs: [],
      source:"",
      blockId:payload.blockId
    }

    notebookAssignment.splice(payload.blockId, 0 , item)
    
    /**
     * save file to redis
     **/
    redis.hset("notebookAssignment:"+notebookAssingmentId, "cells", JSON.stringify(notebookAssignment));
    console.log("DSBA PROjectid ", projectId)
    
   

    io.in(projectId).emit("update block", {
      blockId: payload.blockId,
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
              splitMD = notebookAssignment[x]["source"].split("\n")
              for (y in splitMD) {
                sourceInfo = html2markdown(splitMD[y]);   
                html2Md.push(sourceInfo)   
                source = html2Md 
              }
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
    console.log("codemirror on focus")
    console.log("payload.prevFocus ", payload.prevFocus)
    console.log("payload.newFocus ", payload.newFocus)
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