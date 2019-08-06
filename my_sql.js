const mysql = require('mysql')
const shortid = require('shortid')

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "codebuddy",
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

exports.is_duplicate_class_code = () => {
  return new Promise(function (resolve, reject) {
    const classCode = makeClassCode()
    const queryClassCode = 'SELECT class_code FROM section WHERE class_code = \"' + classCode + '\"'
    con.query(queryClassCode, function(err, res) {
      if(err) reject(err);
      else if(res.length) {
        is_duplicate_class_code()
      } else resolve(classCode)
    })
  })
}

exports.insert_section = (query, values) => {
  return new Promise(function(resolve, reject) {
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve('Create section complete.')
    })
  })
}

exports.delete_section = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject('Delete the section fail.');
      resolve('Delete the section complete.')
    })
  })
}

exports.insert_course = (query, values) => {
  return new Promise(function(resolve, reject) {
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res.insertId)
    })
  })
}

exports.select_course = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.update_course = (query) => {
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

exports.update_section = (query) => {
  return new Promise(function(resolve, reject) {
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve('Update section complete.');
    })
  })
}

exports.select_enrollment = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.insert_enrollment = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve('Insert into enrollment complete!');
    })
  })
}

exports.update_enrollment = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject('Update failed.');
      resolve('Update completed.');
    })
  })
}

exports.insert_assignment = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject(err);
      resolve(res.insertId);
    })
  })
}

exports.delete_assignment = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject('delete this assignment fail.');
      resolve('delete this assignment complete.');
    })
  })
}

exports.update_assignment = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject('Update failed.');
      resolve('Update completed.');
    })
  })
}

exports.select_assignment = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.insert_pairing_record = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject('Create failed.');
      else resolve('Create completed.');
    })
  })
}

exports.select_pairing_record = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      else resolve(res);
    })
  })
}

exports.delete_pairing_record = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject('Delete failed.');
      else resolve('Delete completed.');
    })
  })
}

exports.insert_pairing_session = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function(err, res){
      if(err) reject('Create pairing date time fail!');
      else resolve(res.insertId);
    })
  })
}

exports.select_pairing_session = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      else resolve(res);
    })
  })
}

exports.update_pairing_session = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject('Update failed.');
      resolve('Update completed.');
    })
  })
}

exports.insertStudent = (query, values) => {
  return new Promise(function(resolve, reject){
    con.query(query, [values], function (err, res) {
      if(err) reject('Insert Failed!')
      else resolve(res.insertId)
    })
  })
}

exports.select_student = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.remove_student = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject('Remove the student from the classroom fail.');
      resolve('Remove the student from the classroom complete.');
    })
  })
}

exports.select_teacher = (query) => {
  return new Promise(function(resolve, reject){
    con.query(query, function(err, res){
      if(err) reject(err);
      resolve(res);
    })
  })
}

exports.connect = con
