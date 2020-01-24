const mongoose = require("mongoose");
const conMysql = require("../mySql");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const Redis = require("ioredis");
// var fs = require("fs");
// var markdown = require("markdown").markdown;
const redis = new Redis();

// // Import Turndown module
// const TurndownService = require('turndown');

// // Create an instance of the turndown service
// let turndownService = new TurndownService();

const User = mongoose.model("User");

exports.getStudentsFromSection = async (req, res) => {
    console.log("getStudentsFromSection");
    let collaborative_session_id = req.query.pairingSessionId
    console.log("collaborative_session_id ", collaborative_session_id)
    let section_id = parseInt(cryptr.decrypt(req.query.section_id));
    let command = req.query.command
  
    let queryStudent =
    "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = " +
    section_id +
    " ORDER BY st.first_name ASC";
    
    let resStudents = await conMysql.selectStudent(queryStudent);
    let queryCollaborativeSession =
    "SELECT * FROM collaborative_session WHERE collaborative_session_id = " +
    collaborative_session_id;

    let resCollaborativeSessions = await conMysql.selectCollaborativeSession(
      queryCollaborativeSession
    );

    console.log("resCollaborativeSessions ",resCollaborativeSessions)

    for (let index in resStudents) {
        if (resStudents[index].partner_id != null) {
          isPairingActive = true;
        }
        let user = await User.findOne({
          username: resStudents[index].username
        });
        
        if (user !== null) {
          resStudents[index].img = user.img;
          resStudents[index].status = -1;
        } else {
          console.log("User instance is null in getStudentsFromSection function");
        }
      }

      // let students = {};
      // for (let index in resStudents) {
      //   students[resStudents[index].enrollment_id] = resStudents[index];
      // }
      console.log("resStudents ", resStudents)
      if (!resCollaborativeSessions.length) resCollaborativeSessions = [{ status: -1 }];
    
    res.send({
        students: resStudents,
        command: command,
        collaborativeSessionStatus:resCollaborativeSessions[0].status
      });


}


