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
  

    let data = dataSets.reforms.notebookAssignment
    var obj = JSON.parse(data)

    information = fs.readFileSync("./public/notebookAssignment/"+obj["filePath"], "utf8");

    var information_obj = JSON.parse(information);
    // console.log(obj)
    var information_cells = information_obj["cells"];


    cells = new Array()
    codeCellId = []
    for (x in information_cells) {
        // console.log("---------Cells  [" + x + "]----------");
        if (information_cells[x]["cell_type"] == "markdown") {
          let lines = []
          for (y in information_cells[x]["source"]) {
            // console.log(markdown.toHTML(information_cells[x]["source"][y]));
            let line = markdown.toHTML(information_cells[x]["source"][y]);
            lines.push(line)
          }

          let cellType = "markdown"
          let source = lines
          let cell = {
            cellType,
            source
          }  
          cells.push(cell)
      
        } else {
            codeCellId.push(x)
            let linesSource = []
            let outputs = []
            for (y in information_cells[x]["source"]) {
              // console.log(markdown.toHTML(information_cells[x]["source"][y]));
              let lineSource = information_cells[x]["source"][y]
                linesSource.push(lineSource)
            }

            
            for (y in information_cells[x]["outputs"]) {
              // console.log(markdown.toHTML(information_cells[x]["source"][y]));
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
            cells.push(cell)
        }
      }
      console.log(codeCellId)

      res.render("notebookAssignment", { dataSets, title: title , cells : cells , codeCellId : codeCellId });
  };


exports.uploadAssignment = async (req, res) => {
  console.log("uploadAssignment")
  console.log(req.body)
  let reqBody = req.body;
  let myBuffer = req.file.buffer
  let bufferToJson = JSON.parse(myBuffer);
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
          let lines = []
          for (y in information_cells[x]["source"]) {
            // console.log(markdown.toHTML(information_cells[x]["source"][y]));
            let line = markdown.toHTML(information_cells[x]["source"][y]);
            lines.push(line)
          }

          let cellType = "markdown"
          let source = lines
          let cell = {
            cellType,
            source
          }  
          cells.push(cell)
          // let cell = [] 
          // cell.push(cellType)
          // cell.push(source)
          // cells.x = cell.toString()
      
        } else {
            codeCellId.push(x)
            let linesSource = []
            let outputs = []
            for (y in information_cells[x]["source"]) {
              // console.log(markdown.toHTML(information_cells[x]["source"][y]));
              let lineSource = information_cells[x]["source"][y]
                linesSource.push(lineSource)
            }

            
            for (y in information_cells[x]["outputs"]) {
              // console.log(markdown.toHTML(information_cells[x]["source"][y]));
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
            
            cells.push(cell)
        }
      }
      console.log("cells",JSON.stringify(cells) )
      // console.log("sprit", cells["x"].split("-text,"))
      return JSON.stringify(cells)
}


async function saveFileToRedis(cells, notebookAssingmentId){
  // console.log("cells", cells)
  // console.log(typeof cells)
  // console.log("saveFileToRedis")
  // let jsonObj = Object.values(cells)
  
  // console.log("jsonObj", jsonObj.toString())
  // console.log(typeof jsonObj)
  const redis = new Redis();
  var code = await redis.hset(
    "notebookAssignment:"+notebookAssingmentId,
    "cells",
    cells
    );
   
    var code2 = await redis.hget( "notebookAssignment:"+notebookAssingmentId, "cells");
    let value = JSON.parse(code2)
    console.log("Check, ", typeof(JSON.parse(code2)), ', value, ', value)
      // console.log("code2",code2[0])
}

async function getNotebookAssignmentId(filePath){
  const query =
  "SELECT notebook_assignment_id FROM notebook_assignment WHERE filePath = " + '"'+filePath+'"'
  console.log("query", query)
    let notebookAssignmentId = await conMysql.selectAssignment(query);
    return notebookAssignmentId
}