const mongoose = require('mongoose')

const Project = mongoose.model('Project')
const Message = mongoose.model('Message')
const Score = mongoose.model('Score')
const User = mongoose.model('User')

exports.getHomepage = (req, res) => {
  res.render('index')
}

exports.userSignout = (req, res) => {
  req.logout()
  res.redirect('/')
}

exports.getDashboard = async (req, res) => {
  const projects = await Project
    .find({ $or: [{ creator: req.user.username }, { collaborator: req.user.username }] })
    .sort({ createdAt: -1 })
  res.render('dashboard', { projects, title: 'Dashboard' })
}

exports.getPlayground = async (req, res) => {
  if (!req.query.pid) res.redirect('/dashboard')
  const project = await Project.findOne({ pid: req.query.pid })
  const messages = await Message
      .find({ pid: req.query.pid})
      .sort({ createdAt: 1 })
  res.render('playground', { project, title: `${project.title} - Playground`, messages})
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
  res.render('notifications', { projects })    
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
  } else {
    req.flash('error', "Can't find @" + req.body.collaborator)
  }
  res.redirect('dashboard')
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
  const score = req.query.score
  console.log(req.query.purpose+" "+ req.query.uid+" "+req.query.score)
  const users = await User.find( { 
    avgScore: 0
  })
  res.send(users)
}
