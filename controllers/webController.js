const mongoose = require('mongoose')
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
  
  res.render('dashboard', { projects, invitations, pendings, title: 'Dashboard' })
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
  if (project.programming_style == 'interactive') {
    res.render('playground_interactive', { project, title: `${project.title} - Playground`, messages, partner_obj})
  } else {
    res.render('playground_conventional', { project, title: `${project.title} - Playground`, messages, partner_obj})
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
    fs.open('./public/project_files/'+project.pid+'/main.py', 'w', function (err, file) {
      if (err) throw err;
      console.log('file '+project.pid+'.py is created');
    })

  } else {
    req.flash('error', "Can't find @" + req.body.collaborator)
  }
  res.redirect('dashboard')
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
  let projectTitles = [];
  let projectTimes = [];
  let projectScores = [];
  let linesOfCodes = [];
  let productivitys = [];
  let errors = [];

  const user = await User.findOne({ 
    _id: uid
  })

  const scores = await Score.find({
    uid: uid
  })

  for(var i = 0; i < scores.length; i++) {
    // project title (label)
    project = await Project.findOne({
      pid: scores[i].pid
    })
    projectTitles.push(project.title)

    // project time data
    projectTimes.push((scores[i].time/60).toFixed(2))

    // project score data
    projectScores.push(scores[i].score)

    // lines of code data
    linesOfCodes.push(scores[i].lines_of_code)
    
    // productivity
    productivitys.push((scores[i].lines_of_code/(scores[i].time/3600)).toFixed(2))
    
    // error data
    errors.push(scores[i].error_count)
  }

  data['fullname'] = user.info.firstname + ' ' + user.info.lastname;
  data['username'] = user.username;
  data['user-score'] = user.avgScore;
  data['user-time'] = parseFloat(user.totalTime/60);
  data['projectTitles'] = projectTitles;
  data['projectTimes'] = projectTimes;
  data['projectScores'] = projectScores;
  data['linesOfCodes'] = linesOfCodes;
  data['productivitys'] = productivitys;
  data['errors'] = errors;
  console.log(data)
  res.send(data)
}


