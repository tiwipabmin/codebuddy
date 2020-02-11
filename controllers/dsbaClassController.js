const mongoose = require("mongoose");
const conMysql = require("../mySql");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const Redis = require("ioredis");
const redis = new Redis();



const User = mongoose.model("User");

exports.getStudentsFromSection = async (req, res) => {
  
    console.log("getStudentsFromSection ");
    let collaborative_session_id = req.query.pairingSessionId
    // console.log("collaborative_session_id ", collaborative_session_id)
    let section_id = parseInt(cryptr.decrypt(req.query.section_id));
    let command = req.query.command
    console.log("getStudentsFromSection " , collaborative_session_id);

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
        resStudents[index].fullName = resStudents[index].first_name + ":" + resStudents[index].last_name
      }

      if (!resCollaborativeSessions.length) resCollaborativeSessions = [{ status: -1 }];
    
    res.send({
        students: resStudents,
        command: command,
        collaborativeSessionStatus:resCollaborativeSessions[0].status
      });


}
exports.createGroupRecord = async (req, res) => {
  console.log(" createGroupRecord  back")


  const studentsGroup = req.query;
  const group = studentsGroup["group"]
  const sectionId = parseInt(cryptr.decrypt(studentsGroup["section_id"]));
  let status = "Confirm completed.";


  date = getCurrentTime()
  

    console.log(" length " , group)
    if(group != undefined){
      const insertGroupSession =
        "INSERT INTO collaborative_session (section_id, time_start, status) VALUES ?";
      const values = [[sectionId, date, 1]];
      const groupSessionId = await conMysql.insertGroupSession(
        insertGroupSession,
        values
      );

      const querycollaborativeSession = "SELECT collaborative_session_id FROM collaborative_session WHERE section_id = " +sectionId 

      collaborativeSession = await conMysql.selectCollaborativeSession(querycollaborativeSession);
      // collaborativeSession = JSON.stringify(collaborativeSession)
      collaborativeSessionId = collaborativeSession[0].collaborative_session_id

      for(i = 0 ; i < group.length ; i++){
        console.log(" i = " , group[i])
        for(index = 0 ; index < group[i].length ; index++){
          console.log(" group " , group[i][index])
            groupRecords = [
              [
                parseInt(collaborativeSessionId),
                i+1,
                parseInt(group[i][index])
              ]
            
            ];
            insertGroupRecord =
            "INSERT INTO collaborative_record (collaborative_session_id, group_id, student_id) VALUES ?";
            insertGroup = await conMysql.insertGroupRecord(
              insertGroupRecord,
              groupRecords
            );
        }

      }
      res.send({ status: status ,
        collaborativeSessionId : collaborativeSessionId});
    }
    else {
      res.send({ status: "Please pair all students!" });

    }

}

exports.completeGroupSession = async (req, res) => {
  
  console.log(" completeGroupSession  back")
  const collaborativeSessionId = req.query.collaborative_session_id
  
  timeEnd = getCurrentTime()

  const update_group_session_status =
    "UPDATE collaborative_session SET status = " +
    0 +
    ", time_end = '" +
    timeEnd +
    "' WHERE collaborative_session_id = " +
    collaborativeSessionId;
  let resStatus = await conMysql.updateGroupSession(
    update_group_session_status
  );

  if (resStatus != "Update completed.") {
    resStatus = "Update a pairing date time status failed.";

  } 

  res.send({
    resStatus: resStatus,
    sectionId: req.query.section_id
  });
}

exports.assignAssignment = async (req, res) => {
  // console.log("assign Assignment" , req.body.assignment_set)
  const assignmentSet = req.body.assignment_set;
  for (_index in assignmentSet) {
    assignmentSet[_index].notebook_assignment_id = cryptr.decrypt(
      assignmentSet[_index].notebook_assignment_id
    );
    // let programmingStyle = assignmentSet[_index].programming_style;
    // if (proStyles.indexOf(programmingStyle)) {
    //   proStyles.push(programmingStyle);
    // }
  }

  for (let _index in assignmentSet) {
    cloneAssignmentSet[assignmentSet[_index].notebook_assignment_id] =
      assignmentSet[_index];
  }

}
function getCurrentTime(){
  var dateTime = new Date();
  var strDataTime = dateTime.toString();
  var splitDataTime = strDataTime.split(" ");
  var sliceDataTime = splitDataTime.slice(1, 5);
  var month = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12"
  };
  var numMonth = month[sliceDataTime[0]];
  numMonth === undefined ? (numMonth = "13") : null;
  var timeEnd =
    sliceDataTime[2] +
    "-" +
    numMonth +
    "-" +
    sliceDataTime[1] +
    " " +
    sliceDataTime[3];

    return timeEnd
}