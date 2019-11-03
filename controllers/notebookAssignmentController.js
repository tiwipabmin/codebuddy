const mongoose = require("mongoose");
const conMysql = require("../mySql");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const moment = require("moment");
const Redis = require("ioredis");
var fs = require("fs");

const Project = mongoose.model("Project");
const Message = mongoose.model("Message");
const Score = mongoose.model("Score");
const User = mongoose.model("User");
const Comment = mongoose.model("Comment");
const History = mongoose.model("History");

var markdown = require("markdown").markdown;
const redis = new Redis();

var html2markdown = require('html2markdown');



exports.getNotebookAssignment = async (req, res) => {

    const section_id = req.query.section_id;
    const select_notebookAssignment_by_notebookAssignment_id =
      "SELECT * FROM notebook_assignment WHERE notebook_assignment_id = " +
      cryptr.decrypt(req.query.notebook_assignment_id);
    let notebookAssignment = await conMysql.selectAssignment(
      select_notebookAssignment_by_notebookAssignment_id
    );

    let title = "Notebook Assignment";
    let dataSets = {};
    let section = {};
    section.section_id = section_id;
    if (notebookAssignment.length) {
      notebookAssignment = notebookAssignment[0];
      notebookAssignment.notebook_assignment_id = cryptr.encrypt(notebookAssignment.notebook_assignment_id);
      title = notebookAssignment.title;
      notebookAssignment.title = notebookAssignment.title;
      notebookAssignment.description = notebookAssignment.description;
  
    }
    dataSets = {
      origins: { notebookAssignment: notebookAssignment, section: section },
      reforms: { notebookAssignment: JSON.stringify(notebookAssignment) }
    };
  
    var cellsRedis = await redis.hget( "notebookAssignment:"+cryptr.decrypt(req.query.notebook_assignment_id), "cells");
    let cells = JSON.parse(cellsRedis)
    // console.log("cells", cells)

    codeCellId = []

    for (x in cells) {
      if (cells[x]["cellType"] == "code") {
        codeCellId.push(x)
    }
  }
      // console.log(codeCellId)

      res.render("notebookAssignment", { dataSets, title: title , cells : cells , codeCellId : codeCellId });
  };


exports.uploadAssignment = async (req, res) => {
  console.log("uploadAssignment")
  console.log(req.body)
  let reqBody = req.body;
  let myBuffer = req.file.buffer
  let bufferToJson = JSON.parse(myBuffer);
  console.log("bufferToJson " ,  bufferToJson)
  let dataStr = JSON.stringify(bufferToJson)
  console.log(`Data ${dataStr}`)

  /**
   * generate filename
   * ex: nb_2019-10-12_16-1-85.ipynb
   */
  let randomNumber = Math.floor(Math.random() * (100000 - 0) + 0);
  let date_ob = new Date();
  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  let dateTime =
    year + "-" + month + "-" + date + "_" + hours + "-" + minutes + "-";
  var filename = "nb_" + dateTime + randomNumber + ".ipynb";
  var filePath = "./public/notebookAssignment/";


  fs.writeFileSync(filePath+filename, dataStr, 'utf8', err =>  {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log(filename + " has been saved!");

  });

  console.log("insertAssingment begin")
  let section_id = parseInt(cryptr.decrypt(req.body.section_id));
  console.log(section_id)
  let insertNotebookAssignment = "INSERT INTO notebook_assignment ( section_id, title, description, week, filePath) VALUES ?";


  const notebookValue = [
    [
      section_id,
      req.body.title,
      req.body.description,
      req.body.week,
      filename
    ]
  ]
  // console.log(insertNotebookAssignment)
  const assignment_id = await conMysql.insertAssignment(
    insertNotebookAssignment,
    notebookValue
  );

  let notebookAssingmentId = await getNotebookAssignmentId(filename)
  // console.log("notebookAssingmentId",notebookAssingmentId[0]["notebook_assignment_id"])
  let cells =  readFileNotebookAssingment(filename);
  saveFileToRedis(cells, notebookAssingmentId[0]["notebook_assignment_id"])
  
  
  res.redirect("/classroom?section_id=" +  cryptr.encrypt(section_id));

  
};

function readFileNotebookAssingment(filename){
  information = fs.readFileSync("./public/notebookAssignment/"+filename, "utf8");

    var information_obj = JSON.parse(information);
   
    var information_cells = information_obj["cells"];

    // console.log("information_cells", information_cells)
    cells = new Array()
    codeCellId = []
    for (x in information_cells) {
        // console.log("---------Cells  [" + x + "]----------");
        if (information_cells[x]["cell_type"] == "markdown") {
          // let lines = []
          let lines = ""
          for (y in information_cells[x]["source"]) {
            // console.log(markdown.toHTML(information_cells[x]["source"][y]));
            let line = markdown.toHTML(information_cells[x]["source"][y]);
            // lines.push(line)
            lines += line+"\n"
          }

          let cellType = "markdown"
          let source = lines
          let cell = {
            cellType,
            source
          }
          cell.blockId = x
          cells.push(cell)
      
        } else {
            codeCellId.push(x)
            // let linesSource = []
            let linesSource = ""
            let outputs = []
            for (y in information_cells[x]["source"]) {
              let lineSource = information_cells[x]["source"][y]
                // linesSource.push(lineSource)
                 linesSource+= lineSource
            }

            
            for (y in information_cells[x]["outputs"]) {
              let outputObject = information_cells[x]["outputs"][y]
              let linesText = []
                for(z in outputObject["text"]){
                  let lineText = outputObject["text"][z]
                  linesText.push(lineText)
                }
                outputs.push({"text": linesText})
            }
            
            let executionCount = information_cells[x]["execution_count"]
            let cellType = "code"
            let source = linesSource
            let cell = {
              cellType,
              executionCount,
              outputs,
              source
            }
            cell.blockId = x
            
            cells.push(cell)
        }
      }
      // console.log("cells",JSON.stringify(cells) )
      return JSON.stringify(cells)
}


async function saveFileToRedis(cells, notebookAssingmentId){
  console.log("TypeOf cells, ", typeof(cells))
  var code = await redis.hset(
    "notebookAssignment:"+notebookAssingmentId,
    "cells",
    cells
    );
}

async function getNotebookAssignmentId(filePath){
  const query =
  "SELECT notebook_assignment_id FROM notebook_assignment WHERE filePath = " + '"'+filePath+'"'
  // console.log("query", query)
    let notebookAssignmentId = await conMysql.selectAssignment(query);
    return notebookAssignmentId
}

exports.exportNotebookFile = async (req, res) => {

  console.log("exportNotebookFile" )

  fileExport = new Array()
   var notebookAssignmentRedis = await redis.hget( "notebookAssignment:"+notebookAssingmentId, "cells");
   var notebookAssignment = JSON.parse(notebookAssignmentRedis)
   let metadata = {}
   let fileInfo

     for (x in notebookAssignment) {
      cell_type = notebookAssignment[x]["cellType"];
      var html2Md = []
          if ( cell_type == 'markdown') {
            for (y in notebookAssignment[x]["source"]) {
              sourceInfo = html2markdown(notebookAssignment[x]["source"][y]);   
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

 console.log("fileNotebook ", fileNotebook)
 console.log("fileNotebook JSON.stringify " , JSON.stringify(fileNotebook))
    fs.writeFileSync("aew.ipynb", JSON.stringify(fileNotebook), 'utf8', err =>  {


    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log("aew.ipynb " + " has been saved!");

  });


}