const winston = require("winston");
const mongoose = require("mongoose");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const moment = require("moment");
const fs = require("fs");
const archiver = require("archiver");
const nodepty = require("node-pty");
const childprocess = require("child_process");

const Project = mongoose.model("Project");
const Message = mongoose.model("Message");
const Score = mongoose.model("Score");
const User = mongoose.model("User");
const Comment = mongoose.model("Comment");
const History = mongoose.model("History");

module.exports = (io, client,redis, Projects) => {
    /**
   * recieve project id from client and stored in projectId
   **/
  let projectId = "";
  let curUser = "";
  let timerId = {};
  let comments = [];
  let index = null;
  let pythonProcess = null;
  let focusBlock = null;
  let bufferOutput = { output: "", error: "" };
  let isSpawnText = false;
  let executionCount = 0;


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
    // io.in(projectId).emit("auto update score");
    // client.emit("init reviews", comments);
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
};