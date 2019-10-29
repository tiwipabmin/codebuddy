const mysql = require('mysql')
const shortid = require('shortid')
const winston = require('winston')
const chalk = require('chalk')

const conMysql = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "classroom_management_system",
  port: 3306
})

conMysql.connect(function(err){
  if (err) winston.error(`[%s] ${err.message}`, chalk.red('✗'))
  else winston.info('[%s] Connect to MySql server successfully', chalk.green('✓'))
})

function createClassCode(){
  var code = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 8; i++)
    code += possible.charAt(Math.floor(Math.random() * possible.length));

  return code;
}

exports.isDuplicateClassCode = () => {
  return new Promise(function (resolve, reject) {
    const classCode = createClassCode()
    const queryClassCode = 'SELECT class_code FROM section WHERE class_code = \"' + classCode + '\"'
    conMysql.query(queryClassCode, function(err, res) {
      if(err) reject(err);
      else if(res.length) {
        isDuplicateClassCode()
      } else resolve(classCode)
    })
  })
}

exports.selectSection = (query) => {
  return new Promise(function(resolve, reject) {
    conMysql.query(query, function(err, res){
      if(err) reject(`Error: ${err}`);
      resolve(res);
    })
  })
}

exports.insertSection = (query, values) => {
  return new Promise(function(resolve, reject) {
    conMysql.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve('Create section complete.')
    })
  })
}

exports.updateSection = (query) => {
  return new Promise(function(resolve, reject) {
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      resolve('Update section complete.');
    })
  })
}

exports.deleteSection = (query) => {
  return new Promise(function(resolve, reject) {
    conMysql.query(query, function(err, res){
      if(err) reject('Delete the section fail.');
      resolve('Delete the section complete.')
    })
  })
}

exports.selectCourse = (query) => {
  return new Promise(function(resolve, reject) {
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.insertCourse = (query, values) => {
  return new Promise(function(resolve, reject) {
    conMysql.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res.insertId)
    })
  })
}

exports.updateCourse = (query) => {
  return new Promise(function(resolve, reject) {
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      resolve('Update course complete.');
    })
  })
}

exports.selectEnrollment = (query, values) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.insertEnrollment = (query, values) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, [values], function(err, res){
      if(err) reject('Insert enrollment failed.');
      resolve('Insert enrollment completed.');
    })
  })
}

exports.updateEnrollment = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject('Update failed.');
      resolve('Update completed.');
    })
  })
}

exports.deleteEnrollment = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject('Delete enrollment failed.');
      resolve('Delete enrollment completed.');
    })
  })
}

exports.selectAssignment = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.insertAssignment = (query, values) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res.insertId);
    })
  })
}

exports.updateAssignment = (query, values) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject('Update failed.');
      resolve('Update completed.');
    })
  })
}

exports.deleteAssignment = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject('delete this assignment fail.');
      resolve('delete this assignment complete.');
    })
  })
}

exports.selectPairingRecord = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      else resolve(res);
    })
  })
}

exports.insertPairingRecord = (query, values) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, [values], function(err, res){
      if(err) reject('Create failed.');
      else resolve('Create completed.');
    })
  })
}

exports.deletePairingRecord = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject('Delete failed.');
      else resolve('Delete completed.');
    })
  })
}

exports.selectPairingSession = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      else resolve(res);
    })
  })
}

exports.insertPairingSession = (query, values) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, [values], function(err, res){
      if(err) reject('Create pairing date time fail!');
      else resolve(res.insertId);
    })
  })
}

exports.updatePairingSession = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject('Update failed.');
      resolve('Update completed.');
    })
  })
}

exports.selectStudent = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.insertStudent = (query, values) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, [values], function (err, res) {
      if(err) reject('Insert Failed!')
      else resolve(res.insertId)
    })
  })
}

exports.deleteStudent = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject('Delete student failed.');
      resolve('Delete student completed.');
    })
  })
}

exports.selectTeacher = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}


exports.selectBranchType = (query) => {
  return new Promise(function(resolve, reject){
    conMysql.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}


exports.connect = conMysql
