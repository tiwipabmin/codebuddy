const mysql = require('mysql')
const shortid = require('shortid')

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "classroom_management_system"
})

con.connect(function(err){
  if (err) throw err;
  console.log("Connected!")
})

function makeClassCode(){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 8; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

exports.isDuplicateClassCode = () => {
  return new Promise(function (resolve, reject) {
    const classCode = makeClassCode()
    const queryClassCode = 'SELECT class_code FROM section WHERE class_code = \"' + classCode + '\"'
    con.query(queryClassCode, function(err, res) {
      if(err) reject(err);
      else if(res.length) {
        isDuplicateClassCode()
      } else resolve(classCode)
    })
  })
}

exports.createSection = (query, values) => {
  return new Promise(function(resolve, reject) {
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve('Create section complete.')
    })
  })
}

exports.deleteSection = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject('Delete the section fail.');
      resolve('Delete the section complete.')
    })
  })
}

exports.createCourse = (query, values) => {
  return new Promise(function(resolve, reject) {
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res.insertId)
    })
  })
}

exports.getCourse = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.updateCourse = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve('Update course complete.');
    })
  })
}

exports.getSection = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.updateSection = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve('Update section complete.');
    })
  })
}

exports.getEnrollment = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.postEnrollment = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve('Insert into enrollment complete!');
    })
  })
}

exports.createPairingDateTime = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject('Create pairing date time fail!');
      else resolve(res.insertId);
    })
  })
}

exports.getPairingDateTime = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      else resolve(res);
    })
  })
}

exports.get = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject('Create pairing date time fail!');
      else resolve(res.insertId);
    })
  })
}


exports.getStudent = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.removeStudent = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject('Remove the student from the classroom fail.');
      resolve('Remove the student from the classroom complete.');
    })
  })
}

exports.searchStudents = (letters) => {
  return new Promise(function(resolve, reject){
    const query = 'SELECT * FROM enrollment AS e JOIN student AS s ON e.student_id = s.student_id AND (s.first_name LIKE \'%' + letters + '%\' OR s.last_name LIKE \'%' + letters + '%\')'
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.getTeacher = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.connect = con
