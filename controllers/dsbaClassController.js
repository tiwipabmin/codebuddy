const mongoose = require("mongoose");
const conMysql = require("../mySql");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const Redis = require("ioredis");
const redis = new Redis();
const markdown = require("markdown").markdown;

const fs = require("fs");
const User = mongoose.model("User");
const CollaborativeProject = mongoose.model("CollaborativeProject");
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
    " ORDER BY st.student_id ASC";
    
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
          resStudents[index].partner_id="";
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

  const studentsGroup = req.body;
  const group = studentsGroup["group"]
  const sectionId = parseInt(cryptr.decrypt(studentsGroup["section_id"]));
  let status = "Confirm completed.";
  
  console.log("group", group)
  console.log("sectionId", sectionId)

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

      const querycollaborativeSession = "SELECT * FROM collaborative_session WHERE section_id = " +sectionId +
      " ORDER BY collaborative_session_id DESC";

      collaborativeSession = await conMysql.selectCollaborativeSession(querycollaborativeSession);
      
      collaborativeSessionId = collaborativeSession[0].collaborative_session_id

      for(i = 0 ; i < group.length ; i++){
        console.log(" i = " , group[i])
        for(index = 0 ; index < group[i].length ; index++){
          console.log(" group " , group[i][index])
            groupRecords = [
              [
                parseInt(collaborativeSession[0].collaborative_session_id),
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

    // jj
    let queryNotebookAssignment =
    "SELECT * FROM notebook_assignment WHERE section_id = " + sectionId;
    assignments = await conMysql.selectAssignment(queryNotebookAssignment);

    let weeks = [];
    if (!assignments.length) {
      assignments = [];
    } else if (assignments.length) {
      for (let index in assignments) {
        assignments[index].notebook_assignment_id = cryptr.encrypt(
          assignments[index].notebook_assignment_id
        );
        assignments[index].section_id = cryptr.encrypt(
          assignments[index].section_id
        );
        assignments[index].title = assignments[index].title;

        assignments[index].description = assignments[index].description;

        weeks.indexOf(assignments[index].week) == -1
          ? weeks.push(assignments[index].week)
          : null;
      }
    }

    let weeklyDatas = {
      assignments: JSON.stringify(assignments),
      username: req.user.info.username,
      img: req.user.img,
      weeks: weeks
    };
    let data = {
      status: status,
      collaborativeSession: JSON.stringify(collaborativeSession),
      sectionId: cryptr.encrypt(sectionId),
      weeklyDatas: JSON.stringify(weeklyDatas)
    }

    res.send(data);
    }
    else {
      res.send({ status: "Please pair all students!" });

    }

}

exports.completeGroupSession = async (req, res) => {
  
  console.log("req ", req.body)
  let collaborativeSessionId = req.body.collaborative_session_id
  let section_id = parseInt(cryptr.decrypt(req.body.section_id))
  let status = req.body.status;
  timeEnd = getCurrentTime()

  const update_group_session_status =
    "UPDATE collaborative_session SET status = " +
    status +
    ", time_end = '" +
    timeEnd +
    "' WHERE collaborative_session_id = " +
    collaborativeSessionId;
  let resStatus = await conMysql.updateGroupSession(
    update_group_session_status
  );
if(resStatus == "Update completed."){
  let queryCollaborativeSession =
  "SELECT * FROM collaborative_session  WHERE section_id = " +
  section_id +
  " ORDER BY collaborative_session_id DESC";
  console.log(queryCollaborativeSession)
  collaborativeSession = await conMysql.selectCollaborativeSession(queryCollaborativeSession);
  console.log("collaborativeSession", collaborativeSession)
}else {
    resStatus = "Update a pairing date time status failed.";

} 

  res.send({
    resStatus: resStatus,
    collaborativeSession: JSON.stringify(collaborativeSession),
    sectionId: cryptr.encrypt(section_id)
  });
};

exports.assignAssignment = async (req, res) => {


  let cloneAssignmentSet = {};

  let assignmentSet = req.body.assignment_set;
  for (_index in assignmentSet) {
    assignmentSet[_index].notebook_assignment_id = cryptr.decrypt(
      assignmentSet[_index].notebook_assignment_id
    );
    
  }
 
  for (let _index in assignmentSet) {
    cloneAssignmentSet[assignmentSet[_index].notebook_assignment_id] =
      assignmentSet[_index];
  }

 
  let collaborative_session_id = req.body.collaborative_session_id;
  let selectStudent =
    "SELECT * FROM student  AS st JOIN collaborative_record AS cr  on (st.student_id  =  cr.student_id )INNER JOIN enrollment AS e ON (st.student_id = e.student_id) where collaborative_session_id = " +
    collaborative_session_id;
  let students = await conMysql.selectStudent(selectStudent);

  let swaptime = "1";
  let language = "0";
  let creator = "username@Codebuddy";
  let collaborator = "examiner@codebuddy";
  let cloneStudents = {};
  let collaborativeProject = new CollaborativeProject();
  let group = {};
  let tempStudents = {};
  let assignment_id = 1;
  let assignment_of_each_pair = {};
  
  let queryCollaborativeSession =
    "SELECT * FROM collaborative_session WHERE collaborative_session_id = " +
    collaborative_session_id;
  let CollaborativeSession = await conMysql.selectCollaborativeSession(
    queryCollaborativeSession
  );

  let timeStart = CollaborativeSession[0].time_start;
  timeStart = timeStart.split(" ");
  timeStart = timeStart[0];

  for (let _index in students) {
    cloneStudents[students[_index].enrollment_id] = students[_index];
  }

  tempStudents = Object.assign({}, cloneStudents);
  
// แก้
 for (key in tempStudents) {

    if(group[tempStudents[key].group_id] == undefined){
      group[tempStudents[key].group_id] = []
      group[tempStudents[key].group_id].push(tempStudents[key].enrollment_id)
    }else{

      group[tempStudents[key].group_id].push(tempStudents[key].enrollment_id)
    }
}
// console.log("group ----------------------------------------------------", group)
let findProject = {};
let count = 0;

for (let _index in assignmentSet) {
  for (let key in group) {
        /*
        * assignment is a interactive.
        */
       
        // ถ้าตอนยกเลิกการ assign assignment  พัง ให้กลับมาดูตรงนี้ เงื่อนไขการ find อาจจะผิด
        findProject = await CollaborativeProject.findOne({
             assignment_id: assignmentSet[_index].notebook_assignment_id,
              creator: cloneStudents[group[key][0]].username,
              createdAt: { $gt: new Date(timeStart) }
        });

        if (findProject == null) {
         count++;
         
          if(assignment_of_each_pair[group[key][0]] == undefined){
            assignment_of_each_pair[group[key][0]] = []
          assignment_of_each_pair[group[key][0]].push(assignmentSet[_index].notebook_assignment_id);
          }else{
            assignment_of_each_pair[group[key][0]].push(assignmentSet[_index].notebook_assignment_id);
          } 
        }  
  }
}

  let start_time  = getCurrentTime()
  let countMember = 0;
  for (let key in assignment_of_each_pair) {
    countMember++;
      for (let _index in assignment_of_each_pair[key]) {
        assignment_id = assignment_of_each_pair[key][_index];
        collaborativeProject = new CollaborativeProject();
        collaborativeProject.title = cloneAssignmentSet[assignment_id].title;
        collaborativeProject.description = cloneAssignmentSet[assignment_id].description;
        collaborativeProject.programming_style =
        cloneAssignmentSet[assignment_id].programming_style;
        collaborativeProject.status = "";
        collaborativeProject.week = cloneAssignmentSet[assignment_id].week;
        collaborativeProject.available_project = true;
        collaborativeProject.createdAt = start_time;
        collaborativeProject.file = cryptr.encrypt(cloneAssignmentSet[assignment_id].notebook_assignment_id)
        creator = cloneStudents[key].username;
      
        // add group to collaborative
        collaborator = []; 
        for(let member = 1; member <  group[countMember].length; member++){
          collaborator.push(cloneStudents[group[countMember][member]].username);
        }
        collaborativeProject.creator = creator;
        collaborativeProject.collaborator = collaborator;
        creator = await User.findOne({ username: creator });
        let isCreatePro = false;
     
        if (creator != null) {
          collaborator = await User.findOne({ username: collaborator });
            if (collaborator != null) {
                collaborativeProject = await collaborativeProject.save();
                await CollaborativeProject.updateOne(
                  {
                    _id: collaborativeProject._id
                  },
                  {
                    $set:{
                      creator_id: creator._id,
                      collaborator_id: collaborator._id,
                      assignment_id: assignment_id
                    }
                  },
                  err=>{
                    if(err)throw err;
                  }
                );
               
              isCreatePro = true;
            } else {
              console.log("error", "Can't find @" + collaborator);
            }
          
        } else {
          console.log("error", "Can't find @" + creator);
        }

          let dirPathMain = "./public/notebookAssignment/";
          let dirPathSub  = dirPathMain +  cloneAssignmentSet[assignment_id].filePath.split(".ipynb")[0]+"/"+collaborativeProject.pid;
          let filePath = dirPathSub+"/" +  cloneAssignmentSet[assignment_id].filePath;
          let filePathRead = dirPathMain+cloneAssignmentSet[assignment_id].filePath.split(".ipynb")[0]+"/" +cloneAssignmentSet[assignment_id].filePath
          
        
          let information = fs.readFileSync(filePathRead, "utf8");
  
          let cells = JSON.parse(information);
          let dataStr = JSON.stringify(cells)
  
          // Create folder path
          if (!fs.existsSync(dirPathMain)) {
            fs.mkdirSync(dirPathMain);
          }
         
          if (!fs.existsSync(dirPathSub)) {
            fs.mkdirSync(dirPathSub);
          }
          fs.writeFileSync(filePath, dataStr, 'utf8', err =>  {
            // throws an error, you could also catch it here
            if (err) throw err;
        
            // success case, the file was saved
            console.log(filename + " has been saved!");
          });
      }
    }

    if (!count) {
      res.send({ res_status: "You already assigned these assignments!" });
    } else {
      res.send({ res_status: "Successfully assigned this assignment!" });
    }

}

function getCurrentTime(){
  console.log("getCurrentTime")
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