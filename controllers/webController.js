const mongoose = require('mongoose')
const con = require('../my_sql')
const Cryptr = require('cryptr');
const cryptr = new Cryptr('codebuddy');
const moment = require('moment')
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
  console.log('Subject Id, ', req.user.subjectId)
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
  let data_set = {}
  let occupation = req.user.info.occupation;
  let select_section_by_class_code = 'SELECT * FROM section WHERE class_code = \'xxxxxxxxx\'';
  let sections = [];
  if(occupation == 'teacher') {
    occupation = 0
    select_section_by_class_code = 'SELECT * FROM section AS s JOIN course AS c ON s.course_id = c.course_id JOIN teacher AS t ON c.teacher_id = t.teacher_id AND t.email = \'' + req.user.email + '\''
    sections = await con.getSection(select_section_by_class_code)
  } else {
    occupation = 1
    select_section_by_class_code = 'SELECT * FROM course AS c JOIN section AS s ON c.course_id = s.course_id JOIN enrollment AS e ON s.section_id = e.section_id JOIN student AS st ON e.student_id = st.student_id AND st.email = \'' + req.user.email + '\''
    sections = await con.getSection(select_section_by_class_code)
  }
  for(_index in sections) {
    sections[_index].section_id = await cryptr.encrypt(sections[_index].section_id)
  }
  if(!sections.length) sections = []
  data_set = {common: {occupation: occupation, sections: sections}}
  res.render('lobby', { data_set, title: 'Lobby' })
}

exports.getPlayground = async (req, res) => {
  let data_set = {}
  if (!req.query.pid) res.redirect('/dashboard')
  const user_role = req.query.user_role
  var section_id = req.query.section_id
  var section = {}
  section.section_id = section_id
  let partner_obj = ''
  const project = await Project.findOne({ pid: req.query.pid })
  const messages = await Message
      .find({ pid: req.query.pid})
      .sort({ createdAt: 1 })
  if ('creator' == user_role && project.programming_style !== 'Individual') {
    partner_obj = await User
    .findOne({ _id: project.collaborator_id})
  } else if ('collaborator' == user_role && project.programming_style !== 'Individual'){
    partner_obj = await User
    .findOne({ _id: project.creator_id})
  } else {
    partner_obj = null
  }
  data_set = {common: {project: project, section: section}}

  // console.log('programming_style, ', project.programming_style)
  if (project.programming_style == 'Interactive') {
    res.render('playground_interactive', { data_set, title: `${project.title} - Playground`, messages, partner_obj})
  } else if(project.programming_style == 'Co-located') {
    res.render('playground_co_located', { data_set, title: `${project.title} - Playground`, messages, partner_obj})
  } else if(project.programming_style == 'Remote') {
    res.render('playground_remote', { data_set, title: `${project.title} - Playground`, messages, partner_obj})
  } else if(project.programming_style == 'Individual') {
    res.render('playgroundIndividual', { data_set, title: `${project.title} - Playground`, messages, partner_obj})
  }
}

exports.getHistory = async (req, res) => {
  const redis = new Redis()
  var code = await redis.hget(`project:${req.query.pid}`, 'editor', (err, ret) => ret)

  const project = await Project
    .findOne({ pid: req.query.pid})
  var creator = project.creator
  var collaborator = project.collaborator
  var curUser = req.query.curUser
  let userRole = null

  if(curUser==creator){
    var curUser_obj = await User
    .findOne({ username: curUser})
    var partner_obj = await User
      .findOne({ username: collaborator})
    userRole = 'creator'
  }else{
    var curUser_obj = await User
    .findOne({ username: curUser})
    var partner_obj = await User
      .findOne({ username: creator})
    userRole = 'collaborator'
  }

  const histories = await History
    .find({ pid: req.query.pid})

  data_set = {common: {section_id: req.query.section_id, userRole: userRole}}
  res.render('history', { histories, code, project, curUser_obj, partner_obj, creator, data_set, title: 'History' })
}

exports.getAboutUs = (req, res) => {
  res.render('aboutus')
}

exports.getFeature = (req, res) => {
  res.render('feature')
}

exports.getProfile = async (req, res) => {
  const username = req.user.username;
  let data_set = {}
  let pid = [];

  const projects = await Project
    .find({ $or: [{ creator: req.user.username }, { collaborator: req.user.username }] })
    .sort({ createdAt: -1 })
  for(_index in projects) {
    pid.push(projects[_index].pid)
  }

  data_set = {common: {username: username, pid: pid}}

  res.render('profile', { data_set, title: username + " Progress"})
}

exports.getProfileByTeacher = async (req, res) => {
  const username = req.query.username
  let section_id = parseInt(cryptr.decrypt(req.query.section_id))
  var assignment_id = []
  var pid = []

  var select_assignment_by_section_id = 'SELECT assignment_id FROM assignment WHERE section_id = ' + section_id
  var assignments = await con.select_assignment(select_assignment_by_section_id);
  for(_index in assignments) {
    assignment_id.push(assignments[_index].assignment_id)
  }

  const projects = await Project
    .find({
      $or: [{ creator: req.query.username }, { collaborator: req.query.username }],
      assignment_id: { $in: assignment_id }
    })
    .sort({ createdAt: -1 })
  for(_index in projects) {
    pid.push(projects[_index].pid)
  }

  data_set = {common: {username: username, pid: pid}}

  res.render('profile', { data_set, title: username + " Progress"})
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
  const select_teacher_by_username = 'SELECT teacher_id FROM teacher WHERE username = \'' + req.user.username + '\''
  const querySection = 'INSERT INTO section (course_id, section, room, class_code, day, time_start, time_end) VALUES ?';
  const teacher = await con.select_teacher(select_teacher_by_username)
  const teacher_id = teacher[0].teacher_id
  const courseValues = [[teacher_id, req.body.course_name]]
  const course_id = await con.insert_course(queryCourse, courseValues)
  const classCode = await con.is_duplicate_class_code()
  const time_start = req.body.time_start_hh + ':' + req.body.time_start_mm + '' + req.body.time_start_ap
  const time_end = req.body.time_end_hh + ':' + req.body.time_end_mm + '' + req.body.time_end_ap
  const sectionValues = [[course_id, req.body.section, req.body.room, classCode, req.body.day, time_start, time_end]]
  const sections = await con.insert_section(querySection, sectionValues)
  res.redirect('lobby')
}

exports.deleteSection = async (req, res) => {
  let section_id = parseInt(cryptr.decrypt(req.body.section_id))
  const delete_section = 'DELETE FROM section WHERE section_id = ' + section_id;
  const res_status = await con.delete_section(delete_section)
  let temp = {}
  temp['status'] = res_status
  res.json(temp).status(200)
}

exports.updateSection = async (req, res) => {
  let section_id = parseInt(cryptr.decrypt(req.body.section_id))
  const time_start = req.body.time_start_hh + ':' + req.body.time_start_mm + '' + req.body.time_start_ap
  const time_end = req.body.time_end_hh + ':' + req.body.time_end_mm + '' + req.body.time_end_ap
  const update_course = 'UPDATE course SET course_name = \'' + req.body.course_name + '\' WHERE course_id = ' + req.body.course_id;
  const update_section = 'UPDATE section SET section = ' + req.body.section + ', room = \'' + req.body.room + '\', day = \'' + req.body.day + '\', time_start = \'' + time_start + '\', time_end = \'' + time_end + '\' WHERE section_id = ' + section_id;
  var courseStatus = await con.update_course(update_course);
  var sectionStatus = await con.update_section(update_section);
  res.redirect('/classroom?section_id=' + cryptr.encrypt(section_id))
}

exports.getSection = async (req, res) => {
  let data_set = {}
  let section_id = parseInt(cryptr.decrypt(req.query.section_id))
  let occupation = req.user.info.occupation;
  let select_student_by_section_id = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = ' + section_id + ' ORDER BY st.first_name ASC';
  let select_section_by_section_id = 'SELECT * FROM course AS c JOIN section AS s WHERE c.course_id = s.course_id AND s.section_id = ' + section_id + '';
  let select_assignment_by_section_id = 'SELECT * FROM assignment WHERE section_id = ' + section_id
  let select_pairing_session_by_section_id = 'SELECT * FROM pairing_session AS ps WHERE ps.section_id = ' + section_id + ' ORDER BY ps.pairing_session_id DESC';
  let section = [];
  let students = [];
  let assignments = [];
  let weeks = [];
  let pairing_sessions = [];
  let assignment_set = ''
  section = await con.getSection(select_section_by_section_id)
  students = await con.select_student(select_student_by_section_id)
  assignments = await con.select_assignment(select_assignment_by_section_id)
  pairing_sessions = await con.select_pairing_session(select_pairing_session_by_section_id)

  if(!section.length) section = []
  else {
    section = section[0]
    section.section_id = cryptr.encrypt(section.section_id)
  }

  if(!students.length) students = []
  if(!assignments.length) {
    assignments = []
  } else if (assignments.length) {
    for (_index in assignments) {
      assignments[_index].assignment_id = cryptr.encrypt(assignments[_index].assignment_id)
      assignments[_index].section_id = cryptr.encrypt(assignments[_index].section_id)
      assignments[_index].title = assignments[_index].title.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
      assignments[_index].description = assignments[_index].description.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
      weeks.indexOf(assignments[_index].week) == -1 ? weeks.push(assignments[_index].week) : null;
    }
  }

  if(!pairing_sessions.length) pairing_sessions = [{pairing_session_id: -1, status: -1}]

  if(occupation == 'teacher') {
    occupation = 0

    data_set = {common: {occupation: occupation, section: section, assignments: assignments, students: students, pairing_sessions: pairing_sessions, weeks: weeks}, json: {assignments : JSON.stringify(assignments), students: JSON.stringify(students), pairing_sessions: JSON.stringify(pairing_sessions), weeks: JSON.stringify(weeks)}}

    res.render('classroom', { data_set, title: section.course_name })
  } else {
    occupation = 1
    weeks = []
    let projects_in_section = []
    let clone_assignments = Object.assign({}, assignments)
    assignments = []
    let projects = await Project
      .find({ $and : [
          {status: {$ne : "pending"}},
          {$or: [{ creator: req.user.username }, { collaborator: req.user.username }]}
        ]
      })
      .sort({ createdAt: -1 })

    //projects change data type from array to object
    let cloneProjects = {}
    projects.forEach(function(project){
      cloneProjects[project.assignment_id] = project
    })

    for (i in clone_assignments) {
      let checkProjectFromAssignmentId = cloneProjects[cryptr.decrypt(clone_assignments[i].assignment_id)]
      if(checkProjectFromAssignmentId !== undefined) {
        let element = Object.assign({}, checkProjectFromAssignmentId)
        if (element._doc.available_project) {
          element._doc.section_id = clone_assignments[i].section_id
          projects_in_section.push(element._doc)
          assignments.push(clone_assignments[i])
          weeks.indexOf(element._doc.week) == -1 ? weeks.push(element._doc.week) : null;
        }
      }
    }

    projects_in_section.reverse()

    data_set = {common: {occupation: occupation, section: section, projects: projects_in_section, assignments: assignments, students: students, pairing_sessions: pairing_sessions, weeks: weeks}, json: {projects: JSON.stringify(projects_in_section), assignments : JSON.stringify(assignments), students: JSON.stringify(students), pairing_sessions: JSON.stringify(pairing_sessions)}}

    res.render('classroom', { data_set, title: section.course_name })
  }
}

exports.removeStudent = async (req, res) => {
  let enrollment_id = req.body.enrollment_id
  let select_pairing_record_by_enrollment_id = 'SELECT * FROM pairing_record WHERE enrollment_id = ' + enrollment_id;
  let pairing_record = await con.select_pairing_record(select_pairing_record_by_enrollment_id);
  if(!pairing_record.length) {
    let remove_enrollment_by_enrollment_id = 'DELETE FROM enrollment WHERE enrollment_id = ' + enrollment_id;
    let status = await con.remove_student(remove_enrollment_by_enrollment_id);
    let temp = {}
    temp['status'] = status
    temp['enrollment_id'] = enrollment_id
    res.json(temp).status(200)
  } else {
    let temp = {}
    temp['status'] = 'Cannot remove the student from the classroom because the student has already had pairing records!'
    res.json(temp).status(200)
  }
}

exports.joinClass = async (req, res) => {
  let querySection = 'SELECT * FROM section WHERE class_code = \'' + req.body.class_code + '\''
  let queryStudent = 'SELECT * FROM student WHERE username = \'' + req.user.username + '\''
  let section = await con.getSection(querySection).then(function(res) {
    return res
  })
  let student = await con.select_student(queryStudent).then(function(res) {
    return res
  })
  if(section.length) {
    let select_enrollment_id_from_student_id = 'SELECT * FROM enrollment WHERE student_id = ' + student[0].student_id
    let enrollment = await con.select_enrollment(select_enrollment_id_from_student_id)
    if(!enrollment.length) {
      let queryEnrollment = 'INSERT INTO enrollment (student_id, section_id, grade) VALUES ?'
      let values = [[student[0].student_id, section[0].section_id, '4']]
      let status = await con.insert_enrollment(queryEnrollment, values)
    }
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
  const users = await User.find( {
    username: {$regex: '.*' + keyword + '.*'}
  })
  res.send(users)
}

exports.updatePairingSession = async (req, res) => {
  const section_id = parseInt(cryptr.decrypt(req.body.section_id))
  const pairing_session_id = req.body.pairing_session_id
  const status = req.body.status

  //create date time at this moment
  var date_time = new Date()
  var str_date_time = date_time.toString()
  var split_date_time = str_date_time.split(' ')
  var slice_date_time = split_date_time.slice(1, 5)
  var month = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}
  var num_month = month[slice_date_time[0]]
  num_month === undefined ? num_month = '13' : null;
  var time_end = slice_date_time[2] + '-' + num_month + '-' + slice_date_time[1] + ' ' + slice_date_time[3]

  const update_pairing_session_by_pairing_session_id = 'UPDATE pairing_session SET status = ' + status + ', time_end = \'' + time_end + '\' WHERE pairing_session_id = ' + pairing_session_id;
  var res_status = await con.update_pairing_session(update_pairing_session_by_pairing_session_id)

  let select_pairing_session_by_section_id = ''
  let pairing_sessions = []
  if(res_status == 'Update completed.') {
    const resetPartner = 'UPDATE enrollment SET partner_id = NULL WHERE section_id = ' + section_id
    res_status = await con.update_enrollment(resetPartner)

    select_pairing_session_by_section_id = 'SELECT * FROM pairing_session AS ps WHERE ps.section_id = ' + section_id + ' ORDER BY ps.pairing_session_id DESC'
    pairing_sessions = await con.select_pairing_session(select_pairing_session_by_section_id)
  } else {
    res_status = 'Update a pairing date time status failed.'
  }

  //console.log('res_status : ' + res_status)
  res.send({status: res_status, time_end: time_end, pairing_sessions: JSON.stringify(pairing_sessions), section_id: cryptr.encrypt(section_id)})
}

exports.resetPair = async (req, res) => {
  const update_enrollment = 'UPDATE enrollment SET partner_id = ' + req.body.partner_id + ' WHERE section_id = ' + parseInt(cryptr.decrypt(req.body.section_id))
  const res_status = await con.update_enrollment(update_enrollment)
  res.send({status: res_status})
}

exports.searchUserByPurpose = async (req, res) => {
  const purpose = req.query.purpose
  const uid = req.query.uid
  const score = parseFloat(req.query.score)
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
  }
  res.send(users)
}

exports.searchStudent = async (req, res) => {
  const search = req.query.search
  const student_id = req.query.student_id
  const section_id = parseInt(cryptr.decrypt(req.query.section_id))
  const pairing_session_id = req.query.pairing_session_id
  const username = req.query.username
  const select_student_by_section_id_and_literal = 'SELECT * FROM enrollment AS e JOIN student AS s ON e.student_id = s.student_id WHERE e.section_id = ' + section_id + ' AND (s.first_name LIKE \'%' + search + '%\' OR s.last_name LIKE \'%' + search + '%\')'
  const students = await con.select_student(select_student_by_section_id_and_literal)
  var new_students = []
  var user;
  for (_index in students) {
    if(students[_index].username != username) {
      user = await User.findOne({
        username: students[_index].username
      })
      if(user != null) {
        students[_index].avg_score = user.avgScore
        students[_index].img = user.img
        students[_index].total_time = user.totalTime
      }
      new_students.push(students[_index])
    }
  }
  res.send({student_id: student_id, students: new_students, purpose: 'none', section_id: cryptr.encrypt(section_id), pairing_session_id: pairing_session_id, partner_keys: req.query.partner_keys, pairing_objective: req.query.pairing_objective})
}

exports.searchStudentByPurpose = async (req, res) => {
  const student_id = req.query.student_id
  const pairing_session_id = req.query.pairing_session_id
  const username = req.query.username
  const avg_score = parseFloat(req.query.avg_score)
  const section_id = parseInt(cryptr.decrypt(req.query.section_id))
  const purpose = req.query.purpose
  let students = []
  let users = []
  if("quality"==purpose){
    users = await User.find({
      avgScore: { $lte: avg_score+10, $gte : avg_score-10},
      username: {$ne: username}
    })
  } else if ("experience"==purpose){
    users = await User.find({
      $or:[
        {avgScore: {$gt : avg_score+10, $lt : avg_score+20}},
        {avgScore: {$lt : avg_score-10, $gt : avg_score-20}}
      ],
      username: {$ne: username}
    })
  } else {
    users = await User.find({
      $or:[
        {avgScore: {$gt : avg_score+20, $lt : avg_score+30}},
        {avgScore: {$lt : avg_score-20, $gt : avg_score-30}}
      ],
      username: {$ne: username}
    })
  }
  let count = 0;
  for(_index in users){
    let queryStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND username = \'' + users[_index].username + '\' AND e.section_id = ' + section_id
    let student = await con.select_student(queryStudent)
    if(student.length) {
      students[count] = student[0]
      students[count].avg_score = users[_index].avgScore
      students[count].img = users[_index].img
      students[count].total_time = users[_index].totalTime
      count++;
    }
  }
  res.send({student_id: student_id, pairing_session_id: pairing_session_id, students: students, purpose: purpose, section_id: cryptr.encrypt(section_id), partner_keys: req.query.partner_keys, pairing_objective: req.query.pairing_objective})
}

exports.getPairing = async (req, res) => {
  let pairing_session_id = parseInt(req.query.pairing_session_id)
  let section_id = parseInt(cryptr.decrypt(req.query.section_id))
  const select_pairing_record_by_pairing_session_id = 'SELECT * FROM pairing_record WHERE pairing_session_id = ' + pairing_session_id
  let pairing_record = await con.select_pairing_record(select_pairing_record_by_pairing_session_id)

  const select_enrollment_by_section_id = 'SELECT * FROM enrollment WHERE section_id = ' + section_id
  let enrollment = await con.select_enrollment(select_enrollment_by_section_id)

  let pairing_record_objects = {}
  let enrollment_objects = {}
  for (_index in pairing_record) {
    pairing_record_objects[pairing_record[_index].enrollment_id] = pairing_record[_index]
  }

  for(_index in enrollment) {
    enrollment_objects[enrollment[_index].enrollment_id] = enrollment[_index]
  }
  // console.log('pairing_record_objects, ', pairing_record_objects, ', enrollment_objects, ', enrollment_objects)

  let partner_keys = {}
  let pairing_objective = {}
  for (var element_en in enrollment_objects) {
    if (enrollment_objects[element_en].partner_id == null){
      // console.log('enrollment_objects[element_en].partner_id, ', enrollment_objects[element_en].partner_id, ', enrollment_id, ', enrollment_objects[element_en].enrollment_id)
      partner_keys[enrollment_objects[element_en].enrollment_id] = -1
      pairing_objective[enrollment_objects[element_en].enrollment_id] = -1

      delete enrollment_objects[enrollment_objects[element_en].enrollment_id]
    } else {
      for (var element_pair in pairing_record_objects) {
        if(enrollment_objects[element_en].enrollment_id == pairing_record_objects[element_pair].enrollment_id) {
          if(pairing_record_objects[element_pair].role == 'host') {
            partner_keys[enrollment_objects[element_en].enrollment_id] = enrollment_objects[element_en].partner_id
          } else if(pairing_record_objects[element_pair].role == 'partner') {
            partner_keys[enrollment_objects[element_en].partner_id] = enrollment_objects[element_en].enrollment_id
          }

          pairing_objective[enrollment_objects[element_en].enrollment_id] = pairing_record_objects[element_pair].pairing_objective
          pairing_objective[enrollment_objects[element_en].partner_id] = pairing_record_objects[element_pair].pairing_objective
          //console.log('partner_keys, ', partner_keys, ', pairing_objective, ', pairing_objective, ', pairing_record_objects[element_pair].pairing_objective', pairing_record_objects[element_pair].pairing_objective)
          delete pairing_record_objects[enrollment_objects[element_en]]
          delete enrollment_objects[enrollment_objects[element_en].partner_id]
          delete enrollment_objects[enrollment_objects[element_en]]
          delete pairing_record_objects[pairing_record_objects[element_pair]]
        }
      }
    }
  }

  res.send({status: "Pull information successfully", pairing_session_id: pairing_session_id, section_id: cryptr.encrypt(section_id), partner_keys: JSON.stringify(partner_keys), pairing_objective: JSON.stringify(pairing_objective)})
}

exports.getAssignmentWeek = async (req, res) => {
  let action = req.query.action
  let weeks = []
  if(action == 'enable') {
    let project = await Project.find({
      available_project: false
    })
    project.forEach(function (e){
      weeks.indexOf(e.week) == -1 ? weeks.push(e.week) : null;
    })
  } else if (action == 'disable') {
    let project = await Project.find({
      available_project: true
    })
    project.forEach(function (e){
      weeks.indexOf(e.week) == -1 ? weeks.push(e.week) : null;
    })
  }
  res.send({weeks: JSON.stringify(weeks)})
}

exports.manageAssignment = async (req, res) => {
  let action = req.body.action
  let week = parseInt(req.body.week)
  if(week < 0) {
    if(action == 'enable') {
      res.send({status: "No disable assignment."})
    } else if (action == 'disable') {
      res.send({status: "Not yet assigned assignment."})
    }
    return
  }
  if (action == 'enable') {
    if(!week) {
      let project = await Project.updateMany(
        {available_project: false},
        {$set: {"available_project": true}}
      )
    } else if (week) {
      let project = await Project.updateMany(
        {week: week},
        {$set: {"available_project": true}}
      )
    }

    res.send({status: "Enable assignments successfully."})
    return
  } else if (action == 'disable') {
    if(!week) {
      let project = await Project.updateMany(
        {available_project: true},
        {$set: {"available_project": false}}
      )
    } else if (week) {
      let project = await Project.updateMany(
        {week: week},
        {$set: {"available_project": false}}
      )
    }

    res.send({status: "Disable assignments successfully."})
    return
  }
}

exports.updatePairing = async (req, res) => {
  //console.log('cloning_partner_keys, ', req.body.cloning_partner_keys, ', partner_keys, ', req.body.partner_keys)
  let partner_keys = req.body.partner_keys
  let cloning_partner_keys = req.body.cloning_partner_keys
  let cloning_pairing_objective = req.body.cloning_pairing_objective
  let pairing_objective = req.body.pairing_objective
  let pairing_session_id = req.body.pairing_session_id
  let section_id = parseInt(cryptr.decrypt(req.body.section_id))
  let only_changed_partner_keys = {}
  let count = 0

  /*
  ** if there aren't student pairing, server will send message which 'Please, pair all student!'
  */
  for(key in partner_keys) {
    if(parseInt(partner_keys[key]) < 0) {
      res.send({status: 'Please pair all students!'})
      return
    }

    if (cloning_partner_keys[key] === undefined) {
      count++
      only_changed_partner_keys[key] = partner_keys[key]
    } else if (cloning_partner_keys[key] != partner_keys[key]){
      count++
      only_changed_partner_keys[key] = partner_keys[key]
    }

    if(cloning_pairing_objective[key] != pairing_objective[key]) {
      count++
      only_changed_partner_keys[key] = partner_keys[key]
    }
  }

  if(!count) {
    res.send({status: 'Nothing update'})
    return
  }

  const select_pairing_session_by_pairing_session_id = 'SELECT * FROM pairing_session WHERE pairing_session_id = ' + pairing_session_id
  let pairing_session = await con.select_pairing_session(select_pairing_session_by_pairing_session_id)
  let time_start = pairing_session[0].time_start
  time_start = time_start.split(' ')
  time_start = time_start[0]

  const select_student_by_section_id = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = ' + section_id + ' ORDER BY st.first_name ASC';
  const students = await con.select_student(select_student_by_section_id)

  const select_pairing_record_by_pairing_session_id = 'SELECT * FROM pairing_record WHERE pairing_session_id = ' + pairing_session_id;
  let pairing_record = await con.select_pairing_record(select_pairing_record_by_pairing_session_id)

  let pairing_record_objects = {}
  for(_index in pairing_record) {
    pairing_record_objects[pairing_record[_index].enrollment_id] = pairing_record[_index].role
  }

  let student_objects = {}

  for(_index in students) {
    student_objects[students[_index].enrollment_id] = {
      username: students[_index].username,
      role: pairing_record_objects[students[_index].enrollment_id]
    }
  }

  let status = ''
  let project_array = []
  count = 0
  let out_loop = false
  for(var key in only_changed_partner_keys) {
    if(student_objects[key].role == 'host') {
      status = await Project.find({
        $or: [{
          creator: student_objects[key].username,
          createdAt: {$gt: new Date(time_start)}
        }, {
          creator: student_objects[key].username,
          createdAt: {$eq: new Date(time_start)}
        }]
      })
    } else if (student_objects[key].role == 'partner') {
      status = await Project.find({
        $or: [{
          collaborator: student_objects[key].username,
          createdAt: {$gt: new Date(time_start)}
        }, {
          collaborator: student_objects[key].username,
          createdAt: {$eq: new Date(time_start)}
        }]
      })
    }
    //console.log('Project1, ', status, ', username, ', student_objects[key].username, ', role, ', student_objects[key].role)
    out_loop = false
    for(_index_s in status){
      for(_index_p in project_array) {
        if(project_array[_index_p].indexOf(status[_index_s].pid) != -1) {
          out_loop = true
          break
        }
      }

      if(out_loop){
        break
      }
    }

    if(!out_loop) {
      project_array.push([])
      status.forEach(function(e){
        project_array[count].push(e.pid)
      })
      count++
    }

    if(student_objects[only_changed_partner_keys[key]].role == 'host') {
      status = await Project.find({
        $or: [{
          creator: student_objects[only_changed_partner_keys[key]].username,
          createdAt: {$gt: new Date(time_start)}
        }, {
          creator: student_objects[only_changed_partner_keys[key]].username,
          createdAt: {$eq: new Date(time_start)}
        }]
      })
    } else if (student_objects[only_changed_partner_keys[key]].role == 'partner') {
      status = await Project.find({
        $or: [{
          collaborator: student_objects[only_changed_partner_keys[key]].username,
          createdAt: {$gt: new Date(time_start)}
        }, {
          collaborator: student_objects[only_changed_partner_keys[key]].username,
          createdAt: {$eq: new Date(time_start)}
        }]
      })
    }
    //console.log('Project2, ', status, ', username, ', student_objects[only_changed_partner_keys[key]].username, ', role, ', student_objects[only_changed_partner_keys[key]].role)
    out_loop = false
    for(_index_s in status){
      for(_index_p in project_array) {
        if(project_array[_index_p].indexOf(status[_index_s].pid) != -1) {
          out_loop = true
          break
        }
      }

      if(out_loop){
        break
      }
    }

    if(!out_loop) {
      project_array.push([])
      status.forEach(function(e){
        project_array[count].push(e.pid)
      })
      count++
    }
  }

  for(_index_o in project_array) {
    for(_index_i in project_array[_index_o]) {
      status = await History.deleteMany({
        pid: project_array[_index_o][_index_i]
      })
      status = await  Score.deleteMany({
        pid: project_array[_index_o][_index_i]
      })
      status = await  Message.deleteMany({
        pid: project_array[_index_o][_index_i]
      })
    }
  }

  //delete many project in one week
  for (var key in only_changed_partner_keys) {
    if(student_objects[key].role == 'host') {
      status = await Project.deleteMany({
        creator: student_objects[key].username,
        $or: [{createdAt: {$gt: new Date(time_start)}}, {createdAt: {$eq: new Date(time_start)}}]
      })
    } else if (student_objects[key].role == 'partner') {
      status = await Project.deleteMany({
        collaborator: student_objects[key].username,
        $or: [{createdAt: {$gt: new Date(time_start)}}, {createdAt: {$eq: new Date(time_start)}}]
      })
    }

    if(student_objects[only_changed_partner_keys[key]].role == 'host') {
      status = await Project.deleteMany({
        creator: student_objects[only_changed_partner_keys[key]].username,
        $or: [{createdAt: {$gt: new Date(time_start)}}, {createdAt: {$eq: new Date(time_start)}}]
      })
    } else if (student_objects[only_changed_partner_keys[key]].role == 'partner') {
      status = await Project.deleteMany({
        collaborator: student_objects[only_changed_partner_keys[key]].username,
        $or: [{createdAt: {$gt: new Date(time_start)}}, {createdAt: {$eq: new Date(time_start)}}]
      })
    }
  }

  let sumScore = []
  // sumScore
  for (var key in only_changed_partner_keys) {
    let uid = [key, only_changed_partner_keys[key]]
    for(_index in uid) {
      await User.findOne({
        username: student_objects[uid[_index]].username
      }, async function (err, element){
        if(err) {
          console.log(err)
        }

        sumScore = await Score.aggregate([
          { $match:{
              uid: (element._id).toString()
          }},
          { $group: {
              _id: '$uid',
              avg: {$avg: '$score'}
          }}
        ], function (err, results) {
            if (err) {
              console.log(err)
              return
            }
            if (results) {
              // sum = 0;
              results.forEach(function (result) {
                // start update
                User.updateOne({
                  _id: result._id
                }, {
                  $set: {
                    avgScore: result.avg
                  }
                }, function (err, userReturn) {
                  if (err);
                  if (userReturn) {
                    console.log(userReturn)
                  }
                });
              })

              if(!results.length) {
                User.updateOne({
                  _id: element._id
                }, {
                  $set: {
                    avgScore: 0
                  }
                }, function (err, userReturn) {
                  if (err);
                  if (userReturn) {
                    console.log(userReturn)
                  }
                });
              }
            }
        });
      })
    }
  }

  let delete_pairing_record_by_enrollment_id_and_pairing_session_id = ''
  let insert_pairing_record = ''
  let update_enrollment_by_enrollment_id = ''
  let pairing_record_values = []
  let enrollment = ''
  for (var key in only_changed_partner_keys) {
    delete_pairing_record_by_enrollment_id_and_pairing_session_id = 'DELETE FROM pairing_record WHERE enrollment_id = ' + parseInt(key) + ' AND pairing_session_id = ' + pairing_session_id;
    pairing_record = await con.select_pairing_record(delete_pairing_record_by_enrollment_id_and_pairing_session_id)

    // console.log('Delete completed, ', key)
    update_enrollment_by_enrollment_id = 'UPDATE enrollment SET partner_id = ' + parseInt(only_changed_partner_keys[key]) + ' WHERE enrollment_id = ' + key
    enrollment = await con.update_enrollment(update_enrollment_by_enrollment_id);

    // console.log('Update completed, ', key)
    insert_pairing_record = 'INSERT INTO pairing_record (enrollment_id, pairing_session_id, partner_id, pairing_objective, role) VALUES ?'
    pairing_record_values = [[parseInt(key), pairing_session_id, parseInt(only_changed_partner_keys[key]), pairing_objective[key], 'host']]
    pairing_record = await con.insert_pairing_record(insert_pairing_record, pairing_record_values)
    // console.log('Create completed, ', key)

    delete_pairing_record_by_enrollment_id_and_pairing_session_id = 'DELETE FROM pairing_record WHERE enrollment_id = ' + parseInt(only_changed_partner_keys[key]) + ' AND pairing_session_id = ' + pairing_session_id;
    pairing_record = await con.select_pairing_record(delete_pairing_record_by_enrollment_id_and_pairing_session_id)

    // console.log('Delete completed, ', only_changed_partner_keys[key])
    update_enrollment_by_enrollment_id = 'UPDATE enrollment SET partner_id = ' + key + ' WHERE enrollment_id = ' + only_changed_partner_keys[key]
    enrollment = await con.update_enrollment(update_enrollment_by_enrollment_id);

    // console.log('Update completed, ', only_changed_partner_keys[key])
    insert_pairing_record = 'INSERT INTO pairing_record (enrollment_id, pairing_session_id, partner_id, pairing_objective, role) VALUES ?'
    pairing_record_values = [[parseInt(only_changed_partner_keys[key]), pairing_session_id, parseInt(key), pairing_objective[only_changed_partner_keys[key]], 'partner']]
    pairing_record = await con.insert_pairing_record(insert_pairing_record, pairing_record_values)
    // console.log('Create completed, ', key)
  }

  //console.log('only_changed_partner_keys, ', only_changed_partner_keys, ', time_start, ', time_start, ', student_objects, ', student_objects)
  res.send({status: "Update pairing successfully"})
}

exports.startAutoPairingByPurpose = async (req, res) => {
  // let diffScore = req.query.diffScore
  let pairingPurpose = req.query.pairingPurpose
  let command = req.query.command
  let partnerKeys = {}
  let pairingObjectives = {}
  let pairingSessionId = req.query.pairingSessionId
  let sectionId = req.query.sectionId

  let selectStudentsBySectionId = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = ' + cryptr.decrypt(sectionId) + ' ORDER BY st.first_name ASC';
  let getStudents = await con.select_student(selectStudentsBySectionId)

  let students = {}

  let eachStudentScores = {}
  let allOfScores = []

  let previousPartnersOfEachStudents = {}
  let numberAllOfStudent = 0
  /*
   * "-1" means student have not partner
   */
  for (let index in getStudents) {
    let enrollmentId = getStudents[index].enrollment_id
    let username = getStudents[index].username
    partnerKeys[enrollmentId] = -1
    pairingObjectives[enrollmentId] = -1
    students[enrollmentId] = username

    let selectPairingRecordByEnrollmentId = 'select partner_id from pairing_record where enrollment_id = ' + enrollmentId
    let getPairingRecord = await con.select_pairing_record(selectPairingRecordByEnrollmentId)

    // previous partner of each student
    let previousPartners = []
    for (let index in getPairingRecord) {
      if (previousPartners.indexOf(getPairingRecord[index].partner_id) < 0) {
        previousPartners.push(getPairingRecord[index].partner_id)
      }
    }
    previousPartnersOfEachStudents[enrollmentId] = previousPartners
    numberAllOfStudent++

    // avg score of each student
    let user = await User.findOne({
      username: username
    })
    eachStudentScores[enrollmentId] = user.avgScore
    allOfScores.push(user.avgScore)
  }
  numberAllOfStudent = Math.floor(numberAllOfStudent/2)
  allOfScores.sort(function(a, b){return b-a})
  console.log('partnerKeys, ', partnerKeys)
  console.log('students, ', students)
  console.log('previousPartnersOfEachStudents, ', previousPartnersOfEachStudents)
  console.log('allOfScores, ', allOfScores)
  console.log('eachStudentScores, ', eachStudentScores)

  let expert = {}
  let novice = {}
  // half of student is assigned to expert by score is identifier, score is sorted from higher to lower
  for (let index = 0; index < numberAllOfStudent; index++) {
    for (let enrollmentId in students) {
      if (eachStudentScores[enrollmentId] === allOfScores[index]) {
        expert[enrollmentId] = allOfScores[index]
        delete students[enrollmentId]
      }
    }
  }
  console.log('expert, ', expert)

  let numberOfNoviceRemaining = 0
  for (let enrollmentId in students) {
    novice[enrollmentId] = eachStudentScores[enrollmentId]
    numberOfNoviceRemaining++
  }
  console.log('novice, ', novice)
  let resStatus = 'Start Auto Pairing By Purpose Successfully!., ' + pairingPurpose

  let isCompletedPairing = false
  let timerId = setTimeout(function (resStatus, isCompletedPairing, timerId){
    resStatus = 'Out of time, Please start new auto pairing!'
    isCompletedPairing = true
    clearInterval(timerId)
  }, 1000, resStatus, isCompletedPairing, timerId)

  let count = null
  for (let enrollmentIdEx in expert) {
    count = 0
    for (let enrollmentIdNo in novice) {
      /*
       * enrollmentIdEx has paired enrollmentIdNo
       */
      if (previousPartnersOfEachStudents[enrollmentIdEx].indexOf(enrollmentIdNo) > 0) {
        count++
      }
    }

    if (count === previousPartnersOfEachStudents[enrollmentIdEx].length && count) {
      res.send({resStatus: 'Some student has paired all friend.'})
      return
    }
  }

  let cloneExperts = null
  let cloneNovices = null
  do {

    cloneExperts = Object.assign({}, expert)
    cloneNovices = Object.assign({}, novice)

    /*
     * "-1" means student have not partner
     */
    for (let key in partnerKeys) {
      if (partnerKeys[key] != -1) {
        partnerKeys[partnerKeys[key]] = -1
        partnerKeys[key] = -1
      }
    }

    for (let enrollmentIdEx in cloneExperts) {
      count = 0
      for (let enrollmentIdNo in cloneNovices) {
        /*
         * enrollmentIdEx has never paired with enrollmentIdNo
         */
        if (previousPartnersOfEachStudents[enrollmentIdEx].indexOf(enrollmentIdNo) < 0) {
          /*
           * Both of student must have at least 10 different scores.
           */
          if (eachStudentScores[enrollmentIdEx] - eachStudentScores[enrollmentIdNo] > 10) {
            partnerKeys[enrollmentIdEx] = enrollmentIdNo
            delete cloneNovices[enrollmentIdNo]
            numberOfNoviceRemaining--
            break
          } else {
            count++
          }
        }
      }

      // Has not suitable partner.
      if(count === numberOfNoviceRemaining) {
        console.log('Score difference is less than 10 points., ', count, numberAllOfStudent)
        isCompletedPairing = true
      }
    }
  } while (!isCompletedPairing)

  res.send({resStatus: resStatus})
}

exports.createPairingRecord = async (req, res) => {
  const partner_keys = JSON.parse(req.body.partner_keys)
  const pairing_objective = JSON.parse(req.body.pairing_objective)
  const section_id = parseInt(cryptr.decrypt(req.body.section_id))
  let res_status = 'Confirm completed.'
  let count = 0;

  console.log('partner_keys, ', partner_keys, ', pairing_objective, ', pairing_objective, ', section_id, ', section_id)

  let pairing_record_values = []
  let add_partner_to_student;
  let select_enrollment_by_enrollment_id;
  let enrollment_value;
  let pairing_record_value;

  //if there aren't student pairing, server will send message which 'Please, pair all student!'
  for(key in partner_keys){
    if(partner_keys[key] < 0) {
      res_status = 'Please pair all students!'
      res.send({res_status: res_status})
      return
    }
    count++;
  }

  //if there aren't student in classroom, server will send message which 'There aren't student in classroom!'
  if(!count){
    res_status = 'There is no student in the classroom!'
    res.send({res_status: res_status})
    return
  }

  //define sesstion time
  let select_pairing_session_by_section_id = 'SELECT * FROM pairing_session WHERE section_id = ' + section_id
  let pairing_session = await con.select_pairing_session(select_pairing_session_by_section_id)
  const pairing_time = pairing_session.length

  //create new pairing session
  const insert_pairing_session = 'INSERT INTO pairing_session (section_id, time_start, status) VALUES ?'
  const querySection = 'SELECT * FROM section AS s WHERE s.section_id = ' + section_id + '';
  const section = await con.getSection(querySection);

  //create date time at this moment
  let date_time = new Date()
  let str_date_time = date_time.toString()
  let split_date_time = str_date_time.split(' ')
  let slice_date_time = split_date_time.slice(1, 5)
  let month = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}
  let num_month = month[slice_date_time[0]]
  num_month === undefined ? num_month = '13' : null;
  let date = slice_date_time[2] + '-' + num_month + '-' + slice_date_time[1] + ' ' + slice_date_time[3]

  const values = [[section[0].section_id, date, 1]]
  const pairing_session_id = await con.insert_pairing_session(insert_pairing_session, values)

  if(typeof pairing_session_id == 'number') {

    count = 0;
    for(key in partner_keys){
      add_partner_to_student = 'UPDATE enrollment SET partner_id = ' + partner_keys[key] + ' WHERE enrollment_id = ' + key
      res_status = await con.update_enrollment(add_partner_to_student);

      if(res_status == 'Update failed.') {
        res.send({res_status: res_status})
        return
      } else {
        select_enrollment_by_enrollment_id = 'SELECT * FROM enrollment WHERE enrollment_id = ' + key
        enrollment_value = await con.select_enrollment(select_enrollment_by_enrollment_id)
        pairing_record_value = [parseInt(key), parseInt(pairing_session_id), partner_keys[key], pairing_objective[key], "host"]
        pairing_record_values[count] = pairing_record_value
        count++;

        add_partner_to_student = 'UPDATE enrollment SET partner_id = ' + key + ' WHERE enrollment_id = ' + partner_keys[key]
        res_status = await con.update_enrollment(add_partner_to_student);

        if(res_status == 'Update failed.') {
          res.send({res_status: res_status})
        } else {

          select_enrollment_by_enrollment_id = 'SELECT * FROM enrollment WHERE enrollment_id = ' + partner_keys[key]
          enrollment_value = await con.select_enrollment(select_enrollment_by_enrollment_id)
          pairing_record_value = [partner_keys[key], parseInt(pairing_session_id), parseInt(key), pairing_objective[partner_keys[key]], "partner"]
          pairing_record_values[count] = pairing_record_value
          count++;
        }
      }
    }

    //console.log('pairing_record_values: ', pairing_record_values)
    const insert_pairing_record = 'INSERT INTO pairing_record (enrollment_id, pairing_session_id, partner_id, pairing_objective, role) VALUES ?'
    res_status = await con.insert_pairing_record(insert_pairing_record, pairing_record_values)

    if(res_status == 'Create completed.'){
      const update_pairing_session_by_pairing_session_id = 'UPDATE pairing_session SET status = 1 WHERE pairing_session_id = ' + pairing_session_id
      res_status = await con.update_pairing_session(update_pairing_session_by_pairing_session_id)
    }

    select_pairing_session_by_section_id = 'SELECT * FROM pairing_session AS ps WHERE ps.section_id = ' + section_id + ' ORDER BY ps.pairing_session_id DESC'
    pairing_sessions = await con.select_pairing_session(select_pairing_session_by_section_id)

    let select_assignment_by_section_id = 'SELECT * FROM assignment WHERE section_id = ' + section_id
    assignments = await con.select_assignment(select_assignment_by_section_id)

    let weeks = [];
    if(!assignments.length) {
      assignments = []
    } else if (assignments.length) {
      for (_index in assignments) {
        assignments[_index].assignment_id = cryptr.encrypt(assignments[_index].assignment_id)
        assignments[_index].section_id = cryptr.encrypt(assignments[_index].section_id)
        assignments[_index].title = assignments[_index].title.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
        assignments[_index].description = assignments[_index].description.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
        weeks.indexOf(assignments[_index].week) == -1 ? weeks.push(assignments[_index].week) : null;
      }
    }

    let data_for_weeks_dropdown_function = {assignments: JSON.stringify(assignments), username: req.user.info.username, img: req.user.img, weeks: weeks}

    res.send({res_status: res_status, pairing_sessions: JSON.stringify(pairing_sessions), section_id: cryptr.encrypt(section_id), data_for_weeks_dropdown_function: JSON.stringify(data_for_weeks_dropdown_function)})

    // res.send({res_status: res_status, pairing_session_id: pairing_session_id, pairing_time: pairing_time, time_start: date, time_end: '-'})
  } else {
    res.send({res_status: 'Update failed.'})
  }
}

exports.getStudentsFromSection = async (req, res) => {
  var partner_keys = JSON.parse(req.query.partner_keys)
  var pairing_objective = JSON.parse(req.query.pairing_objective)
  const pairing_session_id = req.query.pairing_session_id
  const command = req.query.command
  let section_id = parseInt(cryptr.decrypt(req.query.section_id))
  //console.log('partner_keys: ' + partner_keys + ', pairing_objective: ' + pairing_objective)
  const queryStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = ' + section_id + ' ORDER BY st.first_name ASC';
  const students = await con.select_student(queryStudent)
  const select_pairing_session_by_pairing_session_id = 'SELECT * FROM pairing_session WHERE pairing_session_id = ' + pairing_session_id;
  let pairing_session = await con.select_pairing_session(select_pairing_session_by_pairing_session_id)

  var arePairingsActive = false;
  for(i in students){
    if(students[i].partner_id != null) {
      arePairingsActive = true;
    }
    let user = await User.findOne({
      username: students[i].username
    })
    students[i].avg_score = user.avgScore
    students[i].img = user.img
    students[i].total_time = user.totalTime
  }
  var count = 0
  for(_index in partner_keys){
    count++;
    break
  }
  if(!count && !arePairingsActive && command == 'pair'){
    for(_index in students) {
      partner_keys[students[_index].enrollment_id] = -1
      pairing_objective[students[_index].enrollment_id] = -1
    }
  } else if (command == 'view') {
    const select_pairing_record_by_pairing_session_id = 'SELECT * FROM pairing_record WHERE pairing_session_id = ' + pairing_session_id
    const pairing_record_values = await con.select_pairing_record(select_pairing_record_by_pairing_session_id);
    var pairing_record_objects = {}
    for(_index in pairing_record_values) {
      pairing_record_objects[pairing_record_values[_index].enrollment_id] = pairing_record_values[_index]
      //console.log('objects' + pairing_record_values[_index].enrollment_id + ' : ', pairing_record_objects[pairing_record_values.enrollment_id])
    }
    var key;
    for(_index in pairing_record_values) {
      //find key from value
      key = Object.keys(partner_keys).find(key => partner_keys[key] === pairing_record_values[_index].enrollment_id)
      if(partner_keys[pairing_record_values[_index].enrollment_id] === undefined && partner_keys[key] === undefined) {
        if(pairing_record_objects[pairing_record_values[_index].enrollment_id].role == 'host') {
          partner_keys[pairing_record_values[_index].enrollment_id] = pairing_record_values[_index].partner_id
        } else if(pairing_record_objects[pairing_record_values[_index].enrollment_id].role == 'partner') {
          partner_keys[pairing_record_values[_index].partner_id] = pairing_record_values[_index].enrollment_id
        }
        pairing_objective[pairing_record_values[_index].enrollment_id] = pairing_record_objects[pairing_record_values[_index].enrollment_id].pairing_objective
        pairing_objective[pairing_record_values[_index].partner_id] = pairing_record_objects[pairing_record_values[_index].partner_id].pairing_objective
      }

    }
  }
  var student_objects = {}
  for(_index in students) {
    student_objects[students[_index].enrollment_id] = students[_index]
  }
  if(!pairing_session.length) pairing_session = [{status: -1}]
  // console.log('partner_keys, ', partner_keys)
  res.send({student_objects: student_objects, partner_keys: partner_keys, pairing_objective: pairing_objective, command: command, pairing_session_status: pairing_session[0].status})
}

exports.createAssignment = async (req, res) => {
  //console.log('section_id: ' + parseInt(req.body.section_id) + ', title: ' + req.body.title + ', description: ' + req.body.description + ', input_specification: ' + req.body.input_specification + ', output_specification: ' + req.body.output_specification + ', sample_input: ' + req.body.sample_input + ', sample_output: ' + req.body.sample_output)
  let section_id = parseInt(cryptr.decrypt(req.body.section_id))
  let data_set = {}
  var section = {}
  section.section_id = cryptr.encrypt(section_id)
  const title = (req.body.title).replace(/\s/g, "\\n")
  const week = parseInt(req.body.week)
  const description = (req.body.description).replace(/\s/g, "\\n");
  const input_specification = (req.body.input_specification).replace(/\s/g, "\\n")
  const output_specification = (req.body.output_specification).replace(/\s/g, "\\n")
  const sample_input = (req.body.sample_input).replace(/\s/g, "\\n")
  const sample_output = (req.body.sample_output).replace(/\s/g, "\\n")
  const programming_style = req.body.programming_style;
  const insert_assignment = 'INSERT INTO assignment (section_id, title, description, input_specification, output_specification, sample_input, sample_output, programming_style, week) VALUES ?'
  const values = [[section_id, title, description, input_specification, output_specification, sample_input, sample_output, programming_style, week]]
  const assignment_id = await con.insert_assignment(insert_assignment, values)
  var assignment = {}
  if(typeof assignment_id == 'number') {
    assignment.assignment_id = cryptr.encrypt(assignment_id)
    assignment.title = title.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.week = week
    assignment.description = description.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.input_specification = input_specification.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.output_specification = output_specification.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.sample_input = sample_input.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.sample_output = sample_output.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.programming_style = programming_style
    data_set = {common: {assignment: assignment, section: section}}
    res.render('assignment', {data_set, title: title})
  } else {
    res.redirect('/classroom?section_id=' + section_id)
  }
}

exports.deleteAssignment = async (req, res) => {
  let assignment_is_selected = req.body.assignment_is_selected
  let max_length = assignment_is_selected.length
  let count = 0
  for (_index in assignment_is_selected) {
    let delete_assignment = 'DELETE FROM assignment WHERE assignment_id = ' + cryptr.decrypt(assignment_is_selected[_index].assignment_id);
    let res_status = await con.delete_assignment(delete_assignment)

    if(res_status === 'delete this assignment complete.') {
      count++
    }
  }

  if(count === max_length) {
    let section_id = cryptr.decrypt(assignment_is_selected[0].section_id)
    let select_pairing_session_by_section_id = 'SELECT * FROM pairing_session AS ps WHERE ps.section_id = ' + section_id + ' ORDER BY ps.pairing_session_id DESC';
    let pairing_sessions = await con.select_pairing_session(select_pairing_session_by_section_id)

    let select_assignment_by_section_id = 'SELECT * FROM assignment WHERE section_id = ' + section_id
    let assignments =  await con.select_assignment(select_assignment_by_section_id);

    let weeks = [];
    if(!assignments.length) {
      assignments = []
    } else if (assignments.length) {
      for (_index in assignments) {
        assignments[_index].assignment_id = cryptr.encrypt(assignments[_index].assignment_id)
        assignments[_index].section_id = cryptr.encrypt(assignments[_index].section_id)
        assignments[_index].title = assignments[_index].title.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
        assignments[_index].description = assignments[_index].description.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
        weeks.indexOf(assignments[_index].week) == -1 ? weeks.push(assignments[_index].week) : null;
      }
    }

    !pairing_sessions.length ? pairing_sessions = [{pairing_session_id: -1, status: -1}] : pairing_sessions = pairing_sessions[0]

    console.log('Completed: count, ', count, ', max_length, ', max_length)
    data_set = {common: {status: 'Delete all of these assignment successfully.', username: req.user.username, img: req.user.img, weeks: weeks, pairing_session_id: pairing_sessions.pairing_session_id}, json: {assignments: JSON.stringify(assignments)}}
    res.send({data_set: data_set})
    return
  }
  console.log('Failured: count, ', count, ', max_length, ', max_length)
  res.send({data_set: {common: {status: 'Found error while is be processing!'}}})
}

exports.updateAssignment = async (req, res) => {
  const assignment_id = cryptr.decrypt(req.body.assignment_id)
  const section_id = parseInt(cryptr.decrypt(req.body.section_id))
  const title = (req.body.title).replace(/\s/g, "\\\\n");
  const description = (req.body.description).replace(/\s/g, "\\\\n");
  const week = parseInt(req.body.week)
  //console.log('des---- :', description);
  const input_specification = (req.body.input_specification).replace(/\s/g, "\\\\n");
  const output_specification = (req.body.output_specification).replace(/\s/g, "\\\\n");
  const sample_input = (req.body.sample_input).replace(/\s/g, "\\\\n");
  const sample_output = (req.body.sample_output).replace(/\s/g, "\\\\n");
  const programming_style = req.body.programming_style;
  // console.log('assignment_id: ' + assignment_id + ', section_id: ' + section_id)
  //console.log('title: ' + title + ', description: ' + description + ', input_specification: ' + input_specification + ', output_specification: ' + output_specification + ', sample_input: ' + sample_input + ', sample_output: ' + sample_output)
  const update_assignment = 'UPDATE assignment SET title = \'' + title + '\', description = \'' + description + '\', input_specification = \'' + input_specification + '\', output_specification = \'' + output_specification + '\', sample_input = \'' + sample_input + '\', sample_output = \'' + sample_output + '\', programming_style = \'' + programming_style + '\', week = ' + week + ' WHERE assignment_id = ' + assignment_id
  //console.log('update_assignment : ', update_assignment)
  const res_status = await con.update_assignment(update_assignment)
  res.redirect('/assignment?section_id='+cryptr.encrypt(section_id)+'&assignment_id='+cryptr.encrypt(assignment_id))
}

exports.getAssignment = async (req, res) => {
  const section_id = req.query.section_id
  const select_assignment_by_assignment_id = 'SELECT * FROM assignment WHERE assignment_id = ' + cryptr.decrypt(req.query.assignment_id)
  let assignment = await con.select_assignment(select_assignment_by_assignment_id)
  let title = 'Assignment'
  let data_set = {}
  let section = {}
  section.section_id = section_id

  if(assignment.length) {
    assignment = assignment[0]
    assignment.assignment_id = cryptr.encrypt(assignment.assignment_id)
    title = assignment.title.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.title = assignment.title.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.description = assignment.description.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.input_specification = assignment.input_specification.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.output_specification = assignment.output_specification.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.sample_input = assignment.sample_input.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
    assignment.sample_output = assignment.sample_output.replace(/\\n\\n/g, "<br>").replace(/\\n/g, " ")
  }
  data_set = {common: {assignment: assignment, section: section}}
  res.render('assignment', {data_set, title: title})
}

exports.assignAssignment = async (req, res) => {
  const selectEnrollmentBySectionId = 'SELECT * FROM enrollment WHERE section_id = ' + cryptr.decrypt(req.body.assignment_set[0].section_id)
  const enrollments = await con.select_enrollment(selectEnrollmentBySectionId);
  const assignmentSet = req.body.assignment_set
  // let isThereIndividualPro = false
  // let isTherePairPro = false
  let proStyles = []
  for(_index in assignmentSet) {
    assignmentSet[_index].assignment_id = cryptr.decrypt(assignmentSet[_index].assignment_id)
    let programmingStyle = assignmentSet[_index].programming_style
    if (proStyles.indexOf(programmingStyle)) {
      proStyles.push(programmingStyle)
      if (proStyles.length > 1) {
        res.send({res_status: 'Do not allow to assign assignment that have different programming type by once time!'})
        return
      }
    }
    // if (assignmentSet[_index].programming_style === 'Individual') {
    //   isThereIndividualPro = true
    // } else if (assignmentSet[_index].programming_style === 'Remote' || assignmentSet[_index].programming_style === 'Co-located') {
    //   isTherePairPro = true
    // }

    // if(isThereIndividualPro && isTherePairPro) {
    //   res.send({res_status: 'Do not allow to assign assignment that have different programming style by once time!'})
    //   return
    // }
  }
  console.log('proStyles, ', proStyles)
  let count = 0;
  //check student pairing
  for (_index in enrollments) {
    if(enrollments[_index].partner_id != null) {
      count++;
      break
    }
  }

  if(!count){
    res.send({res_status: 'Please pair all students before assign the assignment!'})
    return
  }

  const pairingSessionId = req.body.pairing_session_id;
  const swaptime = '1';
  const language = '0';
  const selectStudent = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id JOIN pairing_record AS ph ON e.enrollment_id = ph.enrollment_id WHERE pairing_session_id = ' + pairingSessionId
  var students = await con.select_student(selectStudent);
  var creator = 'username';
  var collaborator = 'username';
  var cloneStudents = {}
  var project = new Project();
  let programming_style = 'Remote';
  let clonePartnerKeys = {};
  let assignment_id = 1;
  let partnerKeys = {}
  let assignment_of_each_pair = {}
  let cloneAssignmentSet = {}
  // let end_time = req.body.end_time

  const selectPairingSessionByPairingSessionId = 'SELECT * FROM pairing_session WHERE pairing_session_id = ' + pairingSessionId
  let pairingSession = await con.select_pairing_session(selectPairingSessionByPairingSessionId)
  let timeStart = pairingSession[0].time_start
  timeStart = timeStart.split(' ')
  timeStart = timeStart[0]

  for(_index in students) {
    cloneStudents[students[_index].enrollment_id] = students[_index]
  }

  for(_index in assignmentSet) {
    cloneAssignmentSet[assignmentSet[_index].assignment_id] = assignmentSet[_index]
  }

  clonePartnerKeys = Object.assign({}, cloneStudents)
  for(key in clonePartnerKeys) {
    if(clonePartnerKeys[key].role == 'host') {
      partnerKeys[key] = clonePartnerKeys[key].partner_id
      assignment_of_each_pair[key] = []
    } else {
      partnerKeys[clonePartnerKeys[key].partner_id] = key
      assignment_of_each_pair[clonePartnerKeys[key].partner_id] = []
    }

    delete clonePartnerKeys[clonePartnerKeys[key].partner_id]
    delete clonePartnerKeys[key]
  }

  let findProject = {};

  count = 0
  let proStyle = proStyles[0]
  for(_index in assignmentSet){
    for(let key in partnerKeys){
      if (proStyle === 'Remote' || proStyle === 'Co-located') {
        /*
         * assignment is a remote pair-programming or conventional pair-programming.
         */
        findProject = await Project.findOne({
          $or: [{
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[key].username,
            collaborator: cloneStudents[partnerKeys[key]].username,
            createdAt: {$gt: new Date(timeStart)}
          }, {
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[key].username,
            collaborator: cloneStudents[partnerKeys[key]].username,
            createdAt: {$lt: new Date(timeStart)}
          }, {
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[partnerKeys[key]].username,
            collaborator: cloneStudents[key].username,
            createdAt: {$gt: new Date(timeStart)}
          }, {
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[partnerKeys[key]].username,
            collaborator: cloneStudents[key].username,
            createdAt: {$lt: new Date(timeStart)}
          }]
        })
        if(findProject == null) {
          count++
          assignment_of_each_pair[key].push(assignmentSet[_index].assignment_id)
        }
      } else if (proStyle === 'Individual'){
        /*
         * assignment is a individual pair-programming.
         */
        console.log('partnerKeys, ', key)
        findProject = await Project.findOne({
          $or: [{
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[key].username,
            createdAt: {$gt: new Date(timeStart)}
          }, {
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[key].username,
            createdAt: {$lt: new Date(timeStart)}
          }, {
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[partnerKeys[key]].username,
            createdAt: {$gt: new Date(timeStart)}
          }, {
            assignment_id: assignmentSet[_index].assignment_id,
            creator: cloneStudents[partnerKeys[key]].username,
            createdAt: {$lt: new Date(timeStart)}
          }]
        })
        if(findProject == null) {
          count++
          assignment_of_each_pair[key].push(assignmentSet[_index].assignment_id)
        }
      } else {
        res.send({res_status: 'Error!'})
        return
      }
    }
  }
  // if (!isThereIndividualPro && isTherePairPro) {
  //   /*
  //    * assignment is a remote pair-programming or conventional pair-programming.
  //    */
  //   for(_index in assignmentSet){
  //     for(let key in partnerKeys){
  //       findProject = await Project.findOne({
  //         $or: [{
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[key].username,
  //           collaborator: cloneStudents[partnerKeys[key]].username,
  //           createdAt: {$gt: new Date(timeStart)}
  //         }, {
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[key].username,
  //           collaborator: cloneStudents[partnerKeys[key]].username,
  //           createdAt: {$lt: new Date(timeStart)}
  //         }, {
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[partnerKeys[key]].username,
  //           collaborator: cloneStudents[key].username,
  //           createdAt: {$gt: new Date(timeStart)}
  //         }, {
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[partnerKeys[key]].username,
  //           collaborator: cloneStudents[key].username,
  //           createdAt: {$lt: new Date(timeStart)}
  //         }]
  //       })
  //       if(findProject == null) {
  //         count++
  //         assignment_of_each_pair[key].push(assignmentSet[_index].assignment_id)
  //       }
  //     }
  //   }
  // } else if (isThereIndividualPro && !isTherePairPro){
  //   /*
  //    * assignment is a individual pair-programming.
  //    */
  //   for(_index in assignmentSet){
  //     for(let key in partnerKeys){
  //       console.log('partnerKeys, ', key)
  //       findProject = await Project.findOne({
  //         $or: [{
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[key].username,
  //           createdAt: {$gt: new Date(timeStart)}
  //         }, {
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[key].username,
  //           createdAt: {$lt: new Date(timeStart)}
  //         }, {
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[partnerKeys[key]].username,
  //           createdAt: {$gt: new Date(timeStart)}
  //         }, {
  //           assignment_id: assignmentSet[_index].assignment_id,
  //           creator: cloneStudents[partnerKeys[key]].username,
  //           createdAt: {$lt: new Date(timeStart)}
  //         }]
  //       })
  //       if(findProject == null) {
  //         count++
  //         assignment_of_each_pair[key].push(assignmentSet[_index].assignment_id)
  //       }
  //     }
  //   }
  // } else {
  //   res.send({res_status: 'Error!'})
  //   return
  // }

  let date_time = new Date()
  let str_date_time = date_time.toString()
  let split_date_time = str_date_time.split(' ')
  let slice_date_time = split_date_time.slice(1, 5)
  let month = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}
  let num_month = month[slice_date_time[0]]
  num_month === undefined ? num_month = '13' : null;
  let start_time = slice_date_time[2] + '-' + num_month + '-' + slice_date_time[1] + 'T' + slice_date_time[3] + 'Z'

  // let time_left = moment(new Date(end_time)).diff(moment(new Date(start_time)))
  // console.log('time_left, ', time_left, ', start_time, ', start_time, ', end_time, ', end_time)
  // if(time_left < 0) {
  //   res.send({res_status: 'Please, set end time again!'})
  //   return
  // }

  // let timeoutHandles = []
  // Assign each assignment to the all of student
  for (key in assignment_of_each_pair) {
    for (_index in assignment_of_each_pair[key]) {
      assignment_id = assignment_of_each_pair[key][_index]

      project = new Project()
      project.title = cloneAssignmentSet[assignment_id].title;
      project.description = cloneAssignmentSet[assignment_id].description;
      project.programming_style = cloneAssignmentSet[assignment_id].programming_style;
      project.language = language;
      project.swaptime = swaptime;
      project.status = '';
      project.week = cloneAssignmentSet[assignment_id].week
      // project.end_time = new Date(end_time)
      project.available_project = true
      project.createdAt = start_time

      if (proStyle === 'Remote' || proStyle === 'Co-located') {
        creator = cloneStudents[key].username
        collaborator = cloneStudents[partnerKeys[key]].username
      } else if (proStyle === 'Individual') {
        creator = cloneStudents[key].username
        collaborator = 'examiner@codebuddy'
      } else {
        res.send({res_status: 'Error!'})
        return
      }

      project.creator = creator;
      project.collaborator = collaborator;
      creator = await User.findOne({ username: creator})
      collaborator = await User.findOne({ username: collaborator})

      if (collaborator != null && (proStyle === 'Remote' || proStyle === 'Co-located')) {
        project = await (project).save()
        Project.update({
          _id: project._id
          }, {
          $set: {
            creator_id: creator._id,
            collaborator_id: collaborator._id,
            assignment_id: assignment_id
          }
        }, (err) => {
          if (err) throw err
        })

        // timeoutHandles.push(project._id)

        // Insert score records
        const uids = [creator._id, collaborator._id]
        uids.forEach(function (uid) {
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
          }
          new Score(scoreModel).save()
        })

      } else if (collaborator === null && proStyle === 'Individual') {
        console.log('creator_id, ', creator._id)
        project = await (project).save()
        Project.update({
          _id: project._id
          }, {
          $set: {
            creator_id: creator._id,
            collaborator_id: 'examiner@codebuddy',
            assignment_id: assignment_id
          }
        }, (err) => {
          if (err) throw err
        })

        // timeoutHandles.push(project._id)

        // Insert score records
        const scoreModel = {
          pid: project.pid,
          uid: creator._id,
          score: 0,
          time: 0,
          lines_of_code: 0,
          error_count: 0,
          participation: {
            enter: 0,
            pairing: 0
          },
          createdAt: Date.now()
        }
        new Score(scoreModel).save()
      } else {
        console.log('error', "Can't find @" + collaborator)
      }

      //create directory
      var dir1 = './public/project_files';
      var dir2 = './public/project_files/'+project.pid;
      if (!fs.existsSync(dir1)){
        fs.mkdirSync(dir1);
      }
      if (!fs.existsSync(dir2)){
        fs.mkdirSync(dir2);
      }
      fs.open('./public/project_files/'+project.pid+'/main.py', 'w', function (err, file) {
        if (err) throw err;
        console.log('file '+project.pid+'.py is created');
      })
    }
  }

  // setTimeout(async function(){
  //   console.log('setTimeout started!!!!!!!!!!!!!!!!!')
  //   for (_index in timeoutHandles) {
  //     await Project.update({
  //       _id: timeoutHandles[_index]
  //     }, {
  //       $set: {
  //         available_project: false
  //       }
  //     })
  //   }
  // }, time_left)


  if(!count) {
    res.send({res_status: 'You already assigned these assignments!'})
  } else {
    res.send({res_status: 'Successfully assigned this assignment!'})
  }
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
  const username = req.query.username;
  const pid = JSON.parse(req.query.pid);
  let data = {};
  let projectTitles = [];
  let projectTimes = [];
  let projectScores = [];
  let linesOfCodes = [];
  let productivitys = [];
  let errors = [];
  let enters = [];
  let pairings = [];

  const user = await User.findOne({
    username: username
  })
  const scores = await Score.find({
    uid: user._id,
    pid: { $in: pid }
  })
  console.log('scores: ', scores)
  for(var i = 0; i < scores.length; i++) {
    // project title (label)
    project = await Project.findOne({
      pid: scores[i].pid
    })
    projectTitles.push(project.title)

    // project time data
    projectTimes.push(scores[i].time)

    // project score data
    projectScores.push(scores[i].score)

    // lines of code data
    linesOfCodes.push(scores[i].lines_of_code)

    // productivity
    productivitys.push((scores[i].lines_of_code/(scores[i].time/3600)).toFixed(2))

    // error data
    errors.push(scores[i].error_count)

    // enter data
    enters.push(scores[i].participation.enter)

    // pairing data
    pairings.push(scores[i].participation.pairing)
  }

  data['fullname'] = user.info.firstname + ' ' + user.info.lastname;
  data['subjectId'] = user.subjectId
  data['username'] = user.username;
  data['user-score'] = user.avgScore;
  data['user-time'] = parseFloat(user.totalTime/60);
  data['projectTitles'] = projectTitles;
  data['projectTimes'] = projectTimes;
  data['projectScores'] = projectScores;
  data['linesOfCodes'] = linesOfCodes;
  data['productivitys'] = productivitys;
  data['errors'] = errors;
  data['enters'] = enters;
  data['pairings'] = pairings;
  console.log(data)
  res.send(data)
}
