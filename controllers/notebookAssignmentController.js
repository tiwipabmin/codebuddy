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
    const select_assignment_by_assignment_id =
      "SELECT * FROM notebook_assignment WHERE notebook_assignment_id = " +
      cryptr.decrypt(req.query.notebook_assignment_id);
    let assignment = await conMysql.selectAssignment(
      select_assignment_by_assignment_id
    );
    let title = "Assignment";
    let dataSets = {};
    let section = {};
    section.section_id = section_id;
    if (assignment.length) {
      assignment = assignment[0];
      assignment.assignment_id = cryptr.encrypt(assignment.notebook_assignment_id);
      title = assignment.title;
      assignment.title = assignment.title;
      assignment.description = assignment.description;
  
    }
    dataSets = {
      origins: { assignment: assignment, section: section },
      reforms: { assignment: JSON.stringify(assignment) }
    };
  

    let data = dataSets.reforms.assignment
    var obj = JSON.parse(data)

    information = fs.readFileSync("./public/notebookAssignment/"+obj["filePath"], "utf8");

    var information_obj = JSON.parse(information);
    // console.log(obj)
    var information_cells = information_obj["cells"];


    arrFile = new Array()

    for (x in information_cells) {
        // console.log("---------Cells  [" + x + "]----------");
        if (information_cells[x]["cell_type"] == "markdown") {
          for (y in information_cells[x]["source"]) {
            // console.log(markdown.toHTML(information_cells[x]["source"][y]));
            let markdowns = markdown.toHTML(information_cells[x]["source"][y]);
            // formData.append("markdown" , markdowns)
            let objMarkdown = {"markdown" : markdowns}
            arrFile.push(objMarkdown)
      
          }
        } else {
          for (y in information_cells[x]["source"]) {
            // console.log(information_cells[x]["source"][y]);
            let code = information_cells[x]["source"][y];
            let objCode = {"code" : code}
            arrFile.push(objCode)

          }
        }
      }
      var arrFileLength = arrFile.length


      // This is algorithm that have to show in pug
      for (var i = 0 ; i<arrFile.length; i++){
        for(var key in arrFile[i]){
            if(arrFile[i].hasOwnProperty(key)){
              if (key == 'code'){
              
                console.log(arrFile[i][key]+ " In text box")
              }else{
                console.log(arrFile[i][key] + "In area")

              }
            }
        }
      }
      // console.log("ArrFile")
      // console.log(arrFile[0][0])

          res.render("notebookAssignment", { dataSets, title: title , arrFile : arrFile , arrFileLength : arrFileLength });
  };