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
  const queryCourse = 'INSERT INTO course (teacher_id, course_name) VALUES ?';
  const queryTeacher = 'SELECT teacher_id FROM teacher WHERE username = \'' + req.user.username + '\''
  const querySection = 'INSERT INTO section (course_id, section, room, class_code, day, time_start, time_end) VALUES ?';
  const teacher = await con.getTeacher(queryTeacher)
  const teacher_id = teacher[0].teacher_id
  const courseValues = [[teacher_id, req.body.course_name]]
  const course_id = await con.createCourse(queryCourse, courseValues)
  const classCode = await con.isDuplicateClassCode()
  const time_start = req.body.time_start_hh + ':' + req.body.time_start_mm + '' + req.body.time_start_ap
  const time_end = req.body.time_end_hh + ':' + req.body.time_end_mm + '' + req.body.time_end_ap
  const sectionValues = [[course_id, req.body.section, req.body.room, classCode, req.body.day, time_start, time_end]]
  const sections = await con.createSection(querySection, sectionValues)
  res.redirect('lobby')
}

exports.createPairingDateTime = async (req, res) => {
  const queryPairingDateTime = 'INSERT INTO pairing_date_time (section_id, date_time, status) VALUES ?'
  const querySection = 'SELECT * FROM section AS s WHERE s.section_id = ' + req.body.section_id + '';
  const section = await con.getSection(querySection);
  console.log('section_id : ' + section[0].section_id)
  const date_time = req.body.date_time
  const section_id =
  console.log('date_time : ' + date_time)
  const values = [[section[0].section_id, date_time, 1]]
  const pairing_date_time_id = await con.createPairingDateTime(queryPairingDateTime, values)
  let temp = {}
  temp['pairing_date_time_id'] = pairing_date_time_id
  temp['section_id'] = section[0].section_id
  temp['date_time'] = date_time
  temp['status'] = 1
  res.json(temp).status(200)
}

exports.deleteSection = async (req, res) => {
  const deleteSection = 'DELETE FROM section WHERE section_id = ' + req.body.section_id;
  const status = await con.deleteSection(deleteSection)
  let temp = {}
  temp['status'] = status
  console.log('temp : ' + temp.status + ', ' + req.body.section_id)
  res.json(temp).status(200)
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
  var queryStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = ' + req.query.section_id + ' ORDER BY st.first_name ASC';
  var queryPairingDateTime = 'SELECT * FROM pairing_date_time AS pdt WHERE pdt.section_id = ' + req.query.section_id + ' ORDER BY pdt.pairing_date_time_id DESC';
  var section = [];
  var students = [];
  var pairingDateTimes = [];
  if(occupation == 'teacher') {
    occupation = 0
  } else {
    occupation = 1
  }
  section = await con.getSection(querySection)
  students = await con.getStudent(queryStudent)
  pairingDateTimes = await con.getPairingDateTime(queryPairingDateTime)
  if(!section.length) section = []
  else section = section[0]

  if(!students.length) students = []
  const pairingTimes = pairingDateTimes.length
  if(!pairingTimes) {
    pairingDateTimes = [{status: -1}]
  }

  res.render('classroom', { occupation, section, students, pairingDateTimes, pairingTimes, title: section.course_name })
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

exports.updatePairingDateTimeStatus = async (req, res) => {
  console.log('status : ' + req.body.status + ', pairing_id : ' + req.body.pairing_date_time_id + ', section_id : ' + req.body.section_id)
  const updateStatus = 'UPDATE pairing_date_time SET status = ' + req.body.status + ' WHERE pairing_date_time_id = ' + req.body.pairing_date_time_id
  const queryEnrollment = 'SELECT * FROM enrollment WHERE section_id = ' + req.body.section_id
  const enrollments = await con.getEnrollment(queryEnrollment)

  if(!enrollments.length){
    res.send({status: 'There aren\'t student in classroom!'})
    return;
  }

  for(index in enrollments) {
    if(enrollments[index].partner_id == null){
      console.log('partner_id = ' + enrollments[index].enrollment_id + ' : ' + enrollments[index].partner_id)
      res.send({status: 'Please, pair all student!'})
      return;
    }
  }

  const res_status = await con.updatePairingDateTime(updateStatus)
  console.log('res_status : ' + res_status)
  res.send({status: res_status, pairing_date_time_id: req.body.pairing_date_time_id})
}

exports.getPairingDateTime = async (req, res) => {
  const queryPairingDateTime = 'SELECT * FROM pairing_date_time WHERE section_id = ' + req.query.section_id
  const pairingDateTime = await con.getPairingDateTime(queryPairingDateTime)
  const pairingTime = pairingDateTime.length
  res.send({pairingTime: pairingTime})
}

exports.resetPair = async (req, res) => {
  const updateEnrollment = 'UPDATE enrollment SET partner_id = ' + req.body.partner_id + ' WHERE section_id = ' + req.body.section_id
  const res_status = await con.updateEnrollment(updateEnrollment)
  res.send({status: res_status})
}

exports.searchUserByPurpose = async (req, res) => {
  const purpose = req.query.purpose
  const uid = req.query.uid
  const score = parseFloat(req.query.score)
  console.log(req.query.purpose+" "+ req.query.uid+" "+req.query.score)
  let users = []
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

exports.searchStudentByPurpose = async (req, res) => {
  const purpose = req.query.purpose
  const section_id = req.query.section_id
  const avg_score = parseFloat(req.query.avg_score)
  const username = req.query.username
  let students = []
  let users = []
  if("quality"==purpose){
    users = await User.find({
      avgScore: { $lt: avg_score+10, $gt : avg_score-10},
      username: {$ne: username}
    })
    console.log('purpose : ' + req.query.purpose + ', avg_score : ' + parseFloat(req.query.avg_score) + ', users : ' + users.length)
  } else if ("experience"==purpose){
    users = await User.find({
      $or:[
        {avgScore: {$gt : avg_score+10, $lt : avg_score+20}},
        {avgScore: {$lt : avg_score-10, $gt : avg_score-20}}
      ],
      username: {$ne: username}
    })
    console.log('purpose : ' + req.query.purpose + ', avg_score : ' + parseFloat(req.query.avg_score) + ', users : ' + users.length)
  } else {
    users = await User.find({
      $or:[
        {avgScore: {$gt : avg_score+20, $lt : avg_score+30}},
        {avgScore: {$lt : avg_score-20, $gt : avg_score-30}}
      ],
      username: {$ne: username}
    })
    console.log('purpose : ' + req.query.purpose + ', avg_score : ' + parseFloat(req.query.avg_score) + ', users : ' + users.length)
  }
  let count = 0;
  for(_index in users){
    let queryStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND username = \'' + users[_index].username + '\' AND e.section_id = ' + section_id
    let student = await con.getStudent(queryStudent)
    if(student.length) {
      students[count] = student[0]
      students[count].avg_score = users[_index].avgScore
      students[count].img = users[_index].img
      students[count].total_time = users[_index].totalTime
      count++;
    }
  }
  res.send(students)
}

exports.createPairingHistory = async (req, res) => {

}

exports.getStudentsFromSection = async (req, res) => {
  const queryStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = ' + req.query.section_id + ' ORDER BY st.first_name ASC';
  const students = await con.getStudent(queryStudent)
  for(i in students){
    let user = await User.findOne({
      username: students[i].username
    })
    students[i].avg_score = user.avgScore
    students[i].img = user.img
    students[i].total_time = user.totalTime
  }
  let student_objects = {}
  let _hosts = []
  let _partners = []
  for(_index in students) {
    student_objects[students[_index].enrollment_id] = students[_index]
  }
  let index = 0
  for(id in student_objects) {
    if(student_objects[id].partner_id == null) {
      _hosts[index] = student_objects[id]
      _partners[index] = {partner_id: null}
    } else {
      if(student_objects[id].role == 'host') {
        let partner_id = student_objects[id].partner_id
        _hosts[index] = student_objects[id]
        _partners[index] = student_objects[partner_id]
        delete student_objects[partner_id]
      } else {
        let host_id = student_objects[id].partner_id
        _hosts[index] = student_objects[host_id]
        _partners[index] = student_objects[id]
        delete student_objects[host_id]
      }
    }
    index++;
  }
  res.send({hosts: _hosts, partners:_partners})
}

exports.addPartnerToStudent = async (req, res) => {
  console.log('host_id : ' + req.body.host_id + ', partner_id : ' + req.body.partner_id + ', p_status : ' + req.body.p_status)
  const h_status = req.body.h_status
  const p_status = req.body.p_status
  var setNullToPartner_id;
  var setNullStatus;
  if(h_status != 'null'){
    setNullToPartner_id = 'UPDATE enrollment SET partner_id = NULL , role = \'host\' WHERE enrollment_id = ' + h_status
    setNullStatus = await con.addPartnerToStudent(setNullToPartner_id)
  }
  if(p_status != 'null'){
    setNullToPartner_id = 'UPDATE enrollment SET partner_id = NULL , role = \'host\' WHERE enrollment_id = ' + p_status
    setNullStatus = await con.addPartnerToStudent(setNullToPartner_id)
  }
  const addPartner = 'UPDATE enrollment SET partner_id = ' + req.body.partner_id + ', role = \'host\' WHERE enrollment_id = ' + req.body.host_id
  var hostStatus = await con.addPartnerToStudent(addPartner)
  var partnerStatus = 'Add failed.';
  if(hostStatus == 'Add completed.') {
    const addHost = 'UPDATE enrollment SET partner_id = ' + req.body.host_id + ', role = \'partner\' WHERE enrollment_id = ' + req.body.partner_id
    partnerStatus = await con.addPartnerToStudent(addHost)
    if(partnerStatus == 'Add failed.') {
      hostStatus = 'Add failed.'
    } else {
      hostStatus = 'Add completed.'
    }
  }
  res.send({hostStatus: hostStatus})
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
