const mongoose = require('mongoose')
const con = require('../mySql')
const Redis = require('ioredis')
var fs = require('fs')

const Project = mongoose.model('Project')
const Message = mongoose.model('Message')
const Score = mongoose.model('Score')
const User = mongoose.model('User')
const Comment = mongoose.model('Comment')
const History = mongoose.model('History')

exports.getHomepage = (req, res) => {
  res.render('index')
}

exports.userSignout = (req, res) => {
  req.logout()
  res.redirect('/')
}

exports.getDashboard = async (req, res) => {
  console.log('teacher_id : ' + req.user.teacher_id)
  const projects = await Project
    .find({ $and : [
        {status: {$ne : "pending"} },
        {$or: [{ creator: req.user.username }, { collaborator: req.user.username }]}
      ]
    })
    .sort({ createdAt: -1 })
  const invitations =  await Project
    .find({ $and : [
          {status: "pending" },
          {collaborator: req.user.username }
        ]
      })
    .sort({ createdAt: -1 })
  const pendings =  await Project
  .find({ $and : [
        {status: "pending" },
        {creator: req.user.username }
      ]
    })
  .sort({ createdAt: -1 })
  // projects.forEach(element => {
  //   console.log(element)
  //   let partner = ''
  //   if(req.user.username == element.creator) {
  //     partner = await User
  //     .findOne(req.user.username)
  //   } else {
  //     partner = await User
  //     .findOne(req.user.username)
  //   }
  //   element.partner_img = partner.img
  //   console.log(element.partner_img)
  // });
  var occupation;
  if(req.user.info.occupation == 'student') {
    occupation = 0
  } else if(req.user.info.occupation == 'teacher') {
    occupation = 1
  }

  res.render('dashboard', { projects, invitations, pendings, title: 'Dashboard' })
}

exports.getLobby = async (req, res) => {
  const projects = await Project
    .find({ $and : [
        {status: {$ne : "pending"} },
        {$or: [{ creator: req.user.username }, { collaborator: req.user.username }]}
      ]
    })
    .sort({ createdAt: -1 })
  const invitations =  await Project
    .find({ $and : [
          {status: "pending" },
          {collaborator: req.user.username }
        ]
      })
    .sort({ createdAt: -1 })
  const pendings =  await Project
  .find({ $and : [
        {status: "pending" },
        {creator: req.user.username }
      ]
    })
  .sort({ createdAt: -1 })
  var occupation = req.user.info.occupation;
  var querySection = 'SELECT * FROM section WHERE class_code = \'xxxxxxxxx\'';
  var sections = [];
  if(occupation == 'teacher') {
    occupation = 0
    querySection = 'SELECT * FROM section AS s JOIN course AS c ON s.course_id = c.course_id JOIN teacher AS t ON c.teacher_id = t.teacher_id AND t.email = \'' + req.user.email + '\''
    sections = await con.getSection(querySection)
    console.log("occupation : " + occupation + ", teacher : " + req.user.info.occupation)
  } else {
    occupation = 1
    querySection = 'SELECT * FROM course AS c JOIN section AS s ON c.course_id = s.course_id JOIN enrollment AS e ON s.section_id = e.section_id JOIN student AS st ON e.student_id = st.student_id AND st.email = \'' + req.user.email + '\''
    sections = await con.getSection(querySection)
    console.log("occupation : " + occupation + ", student : " + req.user.info.occupation)
  }
  if(!sections.length) sections = []
  res.render('lobby', { projects, invitations, pendings, occupation, sections, title: 'Lobby' })
}

exports.getPlayground = async (req, res) => {
  if (!req.query.pid) res.redirect('/dashboard')
  const user_role = req.query.user_role
  let partner_obj = ''
  const project = await Project.findOne({ pid: req.query.pid })
  const messages = await Message
      .find({ pid: req.query.pid})
      .sort({ createdAt: 1 })
  if ('creator' == user_role){
    partner_obj = await User
    .findOne({ _id: project.collaborator_id})
  } else {
    partner_obj = await User
    .findOne({ _id: project.creator_id})
  }
  res.render('playground', { project, title: `${project.title} - Playground`, messages, partner_obj})
}

exports.getHistory = async (req, res) => {
  const redis = new Redis()
  var code = await redis.hget(`project:${req.query.pid}`, 'editor', (err, ret) => ret)

  const project = await Project
    .findOne({ pid: req.query.pid})
  var creator = project.creator
  var collaborator = project.collaborator
  var curUser = req.query.curUser

  if(curUser==creator){
    var curUser_obj = await User
    .findOne({ username: curUser})
    var partner_obj = await User
      .findOne({ username: collaborator})
  }else{
    var curUser_obj = await User
    .findOne({ username: curUser})
    var partner_obj = await User
      .findOne({ username: creator})
  }

  const histories = await History
    .find({ pid: req.query.pid})
  res.render('history', { histories, code, project, curUser_obj, partner_obj, creator, title: 'History' })
}

exports.getAboutUs = (req, res) => {
  res.render('aboutus')
}

exports.getFeature = (req, res) => {
  res.render('feature')
}

exports.getProfile = async (req, res) => {
  const projects = await Project
    .find({ $or: [{ creator: req.user.username }, { collaborator: req.user.username }] })
    .sort({ createdAt: -1 })
  res.render('profile', { projects })
}

exports.getNotifications = async (req, res) => {
  const projects = await Project
    .find({ $or: [{ creator: req.user.username }, { collaborator: req.user.username }] })
    .sort({ createdAt: -1 })
  res.render('notifications', { projects , title: 'Notifications'})
}

exports.createProject = async (req, res) => {
  const collaborator = await User
  .findOne({ username: req.body.collaborator})
  if (collaborator != null) {
    const project = await (new Project(req.body)).save()
    Project.update({
      _id: project._id
    }, {
      $set: {
        collaborator_id: collaborator._id
      }
    }, (err) => {
      if (err) throw err
    })
    req.flash('success', `Successfully Created ${project.title} Project.`)
    //create directory
    var dir1 = './public/project_files';
    var dir2 = './public/project_files/'+project.pid;
    if (!fs.existsSync(dir1)){
      fs.mkdirSync(dir1);
    }
    if (!fs.existsSync(dir2)){
      fs.mkdirSync(dir2);
    }
    fs.writeFile('./public/project_files/'+project.pid+'/json.json', JSON.stringify([{ id:'0', type:'code', source:''}]), function (err) {
      if (err) throw err;
      console.log('file '+project.pid+'.json is created');
    });

  } else {
    req.flash('error', "Can't find @" + req.body.collaborator)
  }
  res.redirect('dashboard')
}

exports.createSection = async (req, res) => {
  console.log('req : ' + req.body.section + ', ' + req.body.room + ', ' + req.body.day + ', ' + req.body.time_start + ', ' + req.body.time_end)
  const courseQuery = 'INSERT INTO course (teacher_id, course_name) VALUES ?';
  const teacherQuery = 'SELECT teacher_id FROM teacher WHERE username = \'' + req.user.username + '\''
  con.connect.query(teacherQuery, function (err, result) {
    if(err) throw err;
    const courseValues = [[result[0].teacher_id, req.body.course_name]]
    con.connect.query(courseQuery, [courseValues], function (err, result) {
        if(err) throw err;
        con.isDuplicateClassCode(result.insertId, req.body)
      }
    )
  })
  res.redirect('lobby')
}

exports.updateSection = async (req, res) => {
  const time_start = req.body.time_start_hh + ':' + req.body.time_start_mm + '' + req.body.time_start_ap
  const time_end = req.body.time_end_hh + ':' + req.body.time_end_mm + '' + req.body.time_end_ap
  const queryCourse = 'UPDATE course SET course_name = \'' + req.body.course_name + '\' WHERE course_id = ' + req.body.course_id;
  const querySection = 'UPDATE section SET section = ' + req.body.section + ', room = \'' + req.body.room + '\', day = \'' + req.body.day + '\', time_start = \'' + time_start + '\', time_end = \'' + time_end + '\' WHERE section_id = ' + req.body.section_id;
  var courseStatus = await con.updateCourse(queryCourse);
  var sectionStatus = await con.updateSection(querySection);
  res.redirect('/classroom?section_id=' + req.body.section_id)
}

exports.getSection = async (req, res) => {
  var occupation = req.user.info.occupation;
  var querySection = 'SELECT * FROM course AS c JOIN section AS s WHERE c.course_id = s.course_id AND s.section_id = ' + req.query.section_id + '';
  var queryStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = \'' + req.query.section_id + '\''
  var section = [];
  var students = [];
  if(occupation == 'teacher') {
    occupation = 0
  } else {
    occupation = 1
  }
  section = await con.getSection(querySection)
  students = await con.getStudent(queryStudent)
  if(!section.length) section = []
  else section = section[0]

  if(!students.length) students = []
  res.render('classroom', { occupation, section, students, title: section.course_name })
}

exports.removeStudent = async (req, res) => {
  console.log('student_id : ' + req.body.enrollment_id)
  var removeStudent = 'DELETE FROM enrollment WHERE enrollment_id = ' + req.body.enrollment_id;
  var status = await con.removeStudent(removeStudent);
  let temp = {}
  temp['status'] = status
  console.log('temp : ' + temp + ', ' + status)
  res.json(temp).status(200)
}

exports.searchStudents = async (req, res) => {
  var letters = req.query.letters
  console.log('letters : ' + letters)
  const students = await con.searchStudents(letters)
  console.log('students : ' + students)
  let temp = []
  for (student in students) {
    temp[student] = students[student]
  }
  console.log('temp : ' + temp)
  res.json(temp).status(200)
}

exports.getStudents = async (req, res) => {
  var letters = req.query.section_id
  var queryStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = \'' + req.query.section_id + '\''
  const students = await con.getStudent(queryStudent)
  console.log('students : ' + students)
  let temp = []
  for (student in students) {
    temp[student] = students[student]
  }
  console.log('temp : ' + temp)
  res.json(temp).status(200)
}

exports.joinClass = async (req, res) => {
  var querySection = 'SELECT * FROM section WHERE class_code = \'' + req.body.class_code + '\''
  var queryStudent = 'SELECT * FROM student WHERE username = \'' + req.user.username + '\''
  var section = await con.getSection(querySection).then(function(res) {
    console.log('section : ' + res[0])
    return res
  })
  var student = await con.getStudent(queryStudent).then(function(res) {
    console.log('student : ' + res[0])
    return res
  })
  if(section.length) {
    var queryEnrollment = 'INSERT INTO enrollment (student_id, section_id, grade) VALUES ?'
    var values = [[student[0].student_id, section[0].section_id, '4']]
    var status = await con.postEnrollment(queryEnrollment, values)
  }
  res.redirect('/lobby')
}

exports.editProject = async (req, res) => {
  const id = req.body.pid
  Project.update({
      pid: id
    }, {
      $set: {
        title: req.body.title,
        description: req.body.description,
        swaptime: req.body.swaptime
      }
    }, function(err, result){
      if(err) throw err
    })
  res.redirect('/dashboard')
}

exports.deleteProject = async (req, res) => {
  const id = req.body.id
  Score.remove({
    pid: id
    },  function(err, result){
      if(err) throw err
  })
  Project.remove({
      pid: id
    },  function(err, result){
      if(err) throw err
    })
  Message.remove({
      pid: id
    }, function(err, result){
      if(err) throw err
    })
  Comment.remove({
      pid: id
    }, function(err, result){
      if(err) throw err
      res.end()
    })

}

exports.searchUser = async (req, res) => {
  const keyword = req.query.search
  console.log(req.query.search)
  const users = await User.find( {
    username: {$regex: '.*' + keyword + '.*'}
  })
  res.send(users)
}

exports.searchUserByPurpose = async (req, res) => {
  const purpose = req.query.purpose
  const uid = req.query.uid
  const score = parseFloat(req.query.score)
  console.log(req.query.purpose+" "+ req.query.uid+" "+req.query.score)
  let user = []
  if("quality"==purpose){
    users = await User.find({
      avgScore: { $lt: score+10, $gt : score-10},
      _id: {$ne: uid}
    })
  } else if ("experience"==purpose){
    users = await User.find({
      $or:[
        {avgScore: {$gt : score+10, $lt : score+20}},
        {avgScore: {$lt : score-10, $gt : score-20}}
      ],
      _id: {$ne: uid}
    })
  } else {
    users = await User.find({
      $or:[
        {avgScore: {$gt : score+20, $lt : score+30}},
        {avgScore: {$lt : score-20, $gt : score-30}}
      ],
      _id: {$ne: uid}
    })
    console.log(purpose)
  }
  res.send(users)
}

exports.acceptInvite = async (req, res) => {
  const id = req.body.id
  Project.update({
      pid: id
    }, {
      $set: {
        status: ""
      }
    }, function(err, result){
      if(err) res.send("error")
      if(result) {
        res.send("success")
        // res.redirect(303,'/dashboard')
      }
    })
}

exports.declineInvite = async (req, res) => {
  const id = req.body.id
  Project.remove({
      pid: id
    }, function(err, result){
      if(err) res.send("error")
      if(result) {
        res.send("success")
        // res.redirect(303,'/dashboard')
      }
    })
}

exports.getProgress = async (req, res) => {
  const uid = req.query.uid
  let data = {};
  let scoreGraph = [];
  let timeGraph = [];
  let progressGraph = [];

  const user = await User.findOne( {
    _id: uid
  })

  const scores = await Score.find({
    uid: uid
  })

  for(var i=0; i<scores.length; i++){
    let dotScore = {};
    let dotTime = {};
    let dotProgress = {};
    project = await Project.findOne({
      pid: scores[i].pid
    })

    //calculate progress
    let acc = 0;
    for(var j=0; j<i+1; j++){
      acc = acc + scores[j].score;
    }
    dotProgress['x'] = i+1;
    dotProgress['y'] = parseFloat(acc/(i+1));
    progressGraph.push(dotProgress);

    dotScore['label'] = project.title;
    dotScore['y'] = scores[i].score;
    scoreGraph.push(dotScore);

    dotTime['label'] = project.title;
    dotTime['y'] = parseFloat(scores[i].time/60);
    timeGraph.push(dotTime)
  }
  data['user-score'] = user.avgScore;
  data['user-time'] = parseFloat(user.totalTime/60);
  data['progressGraph'] = progressGraph;
  data['scoreGraph'] = scoreGraph;
  data['timeGraph'] = timeGraph;
  console.log(data)
  res.send(data)
}
