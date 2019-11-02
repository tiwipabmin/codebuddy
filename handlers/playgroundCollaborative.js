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
        // winston.info("notebookAssingmentId " + cryptr.decrypt(notebookAssingmentId))
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


//   client.on("code change", payload => {
//     const origin = !!payload.code.origin && payload.code.origin !== "setValue";
//     /**
//      * origin mustn't be an `undefined` or `setValue` type
//      */
//     if (origin) {
//       // winston.info(`Emitted 'editor update' to client with pid: ${projectId}`)
//       payload.code.fileName = payload.fileName;
//       client.to(projectId).emit("editor update", payload.code);
//       editorName = payload.fileName;
//       redis.hgetall( "notebookAssignment:"+ cryptr.decrypt(notebookAssingmentId),
//        function(err, obj) {
//         var editorJson = {};
//         if (obj.editor != undefined) {
//           var editorJson = JSON.parse(obj.editor);
//         }
//         editorJson[editorName] = payload.editor;
//         redis.hset(
//             "notebookAssignment:"+ cryptr.decrypt(notebookAssingmentId),
//             "editor",
//             JSON.stringify(editorJson)
//         );
//       });

//       /**
//        * ------ history -----
//        */
//       var enterText = payload.code.text;
//       var removeText = payload.code.removed;
//       var action = payload.code.origin;
//       var fromLine = payload.code.from.line;
//       var fromCh = payload.code.from.ch;
//       var toLine = payload.code.to.line;
//       var toCh = payload.code.to.ch;
//       var moreLine = false;
//       var fileName = payload.fileName;

//       for (var i = 0; i < removeText.length; i++) {
//         if (removeText[i].length) {
//           moreLine = true;
//           break;
//         }
//       }

//       /**
//        * save input text to mongoDB
//        */
//       if (action == "+input") {
//         if (enterText.length == 1) {
//           /**
//            * input ch
//            */
//           if (removeText[0].length != 0) {
//             /**
//              * select some text and add input
//              */
//             if (removeText.length == 1) {
//               /**
//                * select text in 1 line
//                */
//               deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh);
//               updateTextAfter(
//                 projectId,
//                 fileName,
//                 fromLine,
//                 fromLine,
//                 fromCh + 1,
//                 toCh
//               );
//             } else if (
//               (removeText.length > 1 && moreLine) ||
//               (removeText[0].length == 0 && removeText[1].length == 0)
//             ) {
//               /**
//                * select more than 1 line || delete line
//                */
//               deleteMoreLine(
//                 projectId,
//                 fileName,
//                 toLine,
//                 fromLine,
//                 fromCh,
//                 toCh,
//                 action
//               );
//             }
//           } else {
//             /**
//              * move right ch of cursor
//              */
//             History.find(
//               {
//                 pid: projectId,
//                 file: fileName,
//                 line: fromLine,
//                 ch: { $gte: fromCh }
//               },
//               { line: 1, ch: 1, text: 1, _id: 0 },
//               function(err, res) {
//                 if (err) return handleError(err);
//                 var textInLine = res;
//                 for (var i = 0; i < textInLine.length; i++) {
//                   History.update(
//                     {
//                       pid: projectId,
//                       file: fileName,
//                       line: textInLine[i].line,
//                       ch: textInLine[i].ch,
//                       text: textInLine[i].text
//                     },
//                     {
//                       $set: {
//                         line: fromLine,
//                         ch: fromCh + i + 1
//                       }
//                     },
//                     err => {
//                       if (err) throw err;
//                     }
//                   );
//                 }
//               }
//             );
//           }

//           /**
//            * save ch to mongoDB
//            */
//           const historyModel = {
//             pid: projectId,
//             file: fileName,
//             line: fromLine,
//             ch: fromCh,
//             text: payload.code.text.toString(),
//             user: payload.user,
//             createdAt: Date.now()
//           };
//           new History(historyModel, err => {
//             if (err) throw err;
//           }).save();
//         } else if (enterText.length == 2) {
//           /**
//            * enter new line
//            * first line -> move right ch of cursor to new line
//            */
//           if (removeText[0].length != 0) {
//             /**
//              * enter delete text
//              */
//             deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh);
//           }

//           History.find(
//             {
//               pid: projectId,
//               file: fileName,
//               line: fromLine,
//               ch: { $gte: fromCh }
//             },
//             { line: 1, ch: 1, text: 1, _id: 0 },
//             function(err, res) {
//               if (err) return handleError(err);
//               var textInLine = res;
//               for (var i = 0; i < textInLine.length; i++) {
//                 History.update(
//                   {
//                     pid: projectId,
//                     file: fileName,
//                     line: textInLine[i].line,
//                     ch: textInLine[i].ch,
//                     text: textInLine[i].text
//                   },
//                   {
//                     $set: {
//                       line: fromLine + 1,
//                       ch: i
//                     }
//                   },
//                   err => {
//                     if (err) throw err;
//                   }
//                 );
//               }
//             }
//           );

//           /**
//            * not first line -> line+1
//            */
//           History.find(
//             { pid: projectId, file: fileName, line: { $gt: fromLine } },
//             { line: 1, ch: 1, text: 1, _id: 0 },
//             function(err, res) {
//               if (err) return handleError(err);
//               var textInLine = res;

//               for (var i = 0; i < textInLine.length; i++) {
//                 History.update(
//                   {
//                     pid: projectId,
//                     file: fileName,
//                     line: textInLine[i].line,
//                     ch: textInLine[i].ch,
//                     text: textInLine[i].text
//                   },
//                   {
//                     $set: {
//                       line: textInLine[i].line + 1
//                     }
//                   },
//                   err => {
//                     if (err) throw err;
//                   }
//                 );
//               }
//             }
//           );
//         }
//       } else if (action == "+delete") {
//         /**
//          * delete text from mongoDB
//          */
//         if (removeText.length == 1) {
//           /**
//            * delete select text
//            */
//           deleteInOneLine(projectId, fileName, fromLine, fromCh, toCh);
//           updateTextAfter(
//             projectId,
//             fileName,
//             fromLine,
//             fromLine,
//             fromCh,
//             toCh
//           );
//         } else if (
//           (removeText.length > 1 && moreLine) ||
//           (removeText[0].length == 0 && removeText[1].length == 0)
//         ) {
//           /**
//            * delete more than 1 line || delete line
//            */
//           deleteMoreLine(
//             projectId,
//             fileName,
//             toLine,
//             fromLine,
//             fromCh,
//             toCh,
//             action
//           );
//         }
//       }
//       /**
//        * ------ end history -----
//        */
//     }
//   });
};