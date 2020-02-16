const mongoose = require("mongoose");
const conMysql = require("../mySql");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const Redis = require("ioredis");
const redis = new Redis();
const markdown = require("markdown").markdown;

const fs = require("fs");
const Project = mongoose.model("Project");
const Score = mongoose.model("Score");
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

      const querycollaborativeSession = "SELECT * FROM collaborative_session WHERE section_id = " +sectionId + " ORDER BY collaborative_session_id DESC";


      collaborativeSession = await conMysql.selectCollaborativeSession(querycollaborativeSession);

      console.log(" collaborativeSession ------ " , collaborativeSession)

      // collaborativeSession = JSON.stringify(collaborativeSession)
      collaborativeSessionId = collaborativeSession[0].collaborative_session_id

      for(i = 0 ; i < group.length ; i++){
        for(index = 0 ; index < group[i].length ; index++){
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
      res.send({ status: "Please group all students!" });

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
  console.log("assign Assignment" , req.body)

  let proStyles = [];
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

  console.log("assignmentSet ======================================", assignmentSet)
 
  let collaborative_session_id = req.body.collaborative_session_id;
  let selectStudent =
    "SELECT * FROM student  AS st JOIN collaborative_record AS cr  on (st.student_id  =  cr.student_id )INNER JOIN enrollment AS e ON (st.student_id = e.student_id) where collaborative_session_id = " +
    collaborative_session_id;
  let students = await conMysql.selectStudent(selectStudent);
  console.log("students ", students)

  let swaptime = "1";
  let language = "0";
  let creator = "username@Codebuddy";
  let collaborator = "examiner@codebuddy";
  let cloneStudents = {};
  let project = new Project();
  let programming_style = "Collaborative";
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
    console.log("timeStart ", timeStart)
  for (let _index in students) {
    cloneStudents[students[_index].enrollment_id] = students[_index];
  }

  console.log("cloneStudents ", cloneStudents )

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
console.log("group ----------------------------------------------------", group)
let findProject = {};
let count = 0;

for (let _index in assignmentSet) {
  for (let key in group) {
    console.log("key ",group[ key][0])
    console.log(cloneStudents[group[key][0]])
    console.log("assignmentSet[_index].notebook_assignment_id ", assignmentSet[_index].notebook_assignment_id)
        /*
        * assignment is a interactive.
        */
        findProject = await Project.findOne({
          $or: [
            {
              assignment_id: assignmentSet[_index].notebook_assignment_id,
              creator: cloneStudents[group[key][0]].username,
              collaborator: cloneStudents[group[key][1]].username,
              createdAt: { $gt: new Date(timeStart) }
            },
            {
              assignment_id: assignmentSet[_index].notebook_assignment_id,
              creator: cloneStudents[group[key][0]].username,
              collaborator: cloneStudents[group[key][1]].username,
              createdAt: { $lt: new Date(timeStart) }
            },
            {
              assignment_id: assignmentSet[_index].notebook_assignment_id,
              creator: cloneStudents[group[key][1]].username,
              collaborator: cloneStudents[group[key][0]].username,
              createdAt: { $gt: new Date(timeStart) }
            },
            {
              assignment_id: assignmentSet[_index].notebook_assignment_id,
              creator: cloneStudents[group[key][1]].username,
              collaborator: cloneStudents[group[key][0]].username,
              createdAt: { $lt: new Date(timeStart) }
            }
          ]
        });

        console.log("findProject", findProject)
        console.log("group[key][0] ", group[key][0])
        if (findProject == null) {
          // console.log("findProject null")
          // console.log("assignmentSet[_index].notebook_assignment_id ", assignmentSet[_index].notebook_assignment_id)
          count++;
          // console.log("assignment_of_each_pair ", assignment_of_each_pair)
          if(assignment_of_each_pair[group[key][0]] == undefined){
            assignment_of_each_pair[group[key][0]] = []
          assignment_of_each_pair[group[key][0]].push(assignmentSet[_index].notebook_assignment_id);
          }else{
            assignment_of_each_pair[group[key][0]].push(assignmentSet[_index].notebook_assignment_id);

          }
          
        }
        console.log("assignment_of_each_pair ", assignment_of_each_pair)
  }
}

  let start_time  = getCurrentTime()
    
  console.log("start_time ", start_time)
  for (let key in assignment_of_each_pair) {
      for (let _index in assignment_of_each_pair[key]) {
        console.log( "key-------", key)
        console.log("assignment_of_each_pair[key] ", assignment_of_each_pair[key])
        console.log(" _index", _index)
        console.log("cloneAssignmentSet ", cloneAssignmentSet)
        assignment_id = assignment_of_each_pair[key][_index];
        project = new Project();
        project.title = cloneAssignmentSet[assignment_id].title;
        project.description = cloneAssignmentSet[assignment_id].description;
        project.programming_style =
          cloneAssignmentSet[assignment_id].programming_style;
        project.language = language;
        project.swaptime = swaptime;
        project.status = "";
        project.week = cloneAssignmentSet[assignment_id].week;
        // project.end_time = new Date(end_time)
        project.available_project = true;
        project.createdAt = start_time;
        
        
        project.files.pop();
        project.files.push(cryptr.encrypt(cloneAssignmentSet[assignment_id].notebook_assignment_id)) 
       
        console.log(" cloneStudents ", cloneStudents )
        creator = cloneStudents[key].username;
        console.log("group[cloneStudents[key].group_id[1]] ", group[cloneStudents[key].group_id][1])
        collaborator = cloneStudents[group[cloneStudents[key].group_id][1]].username;
        console.log(" collaborator ", collaborator )
        project.creator = creator;
        project.collaborator = collaborator;
        creator = await User.findOne({ username: creator });
        console.log("project ", project)
        let isCreatePro = false;
        if (creator != null) {
          console.log("creator != null ")
            collaborator = await User.findOne({ username: collaborator });
            console.log(" collaborator ", collaborator)
            if (collaborator != null) {
                project = await project.save();
                await Project.updateOne(
                  {
                    _id: project._id
                  },
                  {
                    $set: {
                      creator_id: creator._id,
                      collaborator_id: collaborator._id,
                      assignment_id: assignment_id
                    }
                  },
                  err => {
                    if (err) throw err;
                  }
                );
              // timeoutHandles.push(project._id)
  
              // Insert score records
              console.log("creator._id ", creator._id)
              console.log(" collaborator._id ", collaborator._id)
              const uids = [creator._id, collaborator._id];
              console.log("project.pid ", project.pid)
              uids.forEach(function(uid) {
                const scoreModel = {
                  pid: project.pid,
                  uid: uid,
                  score: 0,
                  time: 0,
                  lines_of_code: 0,
                  error_count: 0,
                  participation: {
                    enter: 0,
                    pairing: 0
                  },
                  createdAt: Date.now()
                };
                new Score(scoreModel).save();
              });
              isCreatePro = true;
            } else {
              console.log("error", "Can't find @" + collaborator);
            }
          
        } else {
          console.log("error", "Can't find @" + creator);
        }
        console.log("project.pid ", project.pid)
          let dirPathMain = "./public/notebookAssignment/";
          let dirPathSub  = dirPathMain +  cloneAssignmentSet[assignment_id].filePath.split(".ipynb")[0]+"/"+project.pid;
          let filePath = dirPathSub+"/" +  cloneAssignmentSet[assignment_id].filePath;
          let filePathRead = dirPathMain+cloneAssignmentSet[assignment_id].filePath.split(".ipynb")[0]+"/" +cloneAssignmentSet[assignment_id].filePath
          console.log("filePathRead ", filePathRead)
        
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
          console.log("filePath ", filePath)
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