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
      var arrFileLength = cells.length
      console.log(cells)
      console.log(cells[3]["outputs"][0]["text"])

      res.render("notebookAssignment", { dataSets, title: title , cells : cells , arrFileLength : arrFileLength });
  };