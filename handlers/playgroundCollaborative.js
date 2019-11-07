const winston = require("winston");
const mongoose = require("mongoose");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const conMysql = require("../mySql");
const html2markdown = require('html2markdown');
const fs = require("fs");

module.exports = (io, client,redis, Projects) => {
    /**
   * recieve project id from client and stored in projectId
   **/
  winston.info("Client connected");

  client.on("join project", async payload => {
    try {
        
        notebookAssingmentId = payload.notebookAssingmentId
        initRemainder();
    } catch (e) {
    
    }
   
  });

  async function initRemainder() {
      console.log("notebookAssingmentId", cryptr.decrypt(notebookAssingmentId))
    client.emit("init state", {
      editor: await redis.hget(
        "notebookAssignment:"+ cryptr.decrypt(notebookAssingmentId),
        "cells",
        (err, res) => res
      )
    });
  }


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
      redis.hgetall( "notebookAssignment:"+ cryptr.decrypt(notebookAssingmentId),
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
            "notebookAssignment:"+ cryptr.decrypt(notebookAssingmentId),
            "cells",
            JSON.stringify(cells)
        );
      });
    }
  });


   client.on ("save code", async payload => {
    const notebookAssingmentId = cryptr.decrypt(payload.notebookAssingmentId);
    const pid = payload.pid;

    let filename = await getFilePath(notebookAssingmentId)
    let fileNotebook = await getFileNotebook(notebookAssingmentId)
    let filePath = "./public/notebookAssignment/"+filename+"/"+pid+"/"+filename+".ipynb"
    fs.writeFileSync(filePath, fileNotebook, 'utf8', err =>  {
      // throws an error, you could also catch it here
      if (err) throw err;
  
      // success case, the file was saved
      // console.log(filePath + " has been saved!");
  
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
            let execution_count = null
            let outputs = []

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
  client.on("disconnect", () => {
    // disconnect
    try {
      winston.info("Client disconnected");
    } catch (error) {
      winston.info(`catching error: ${error}`);
    }
  });


};