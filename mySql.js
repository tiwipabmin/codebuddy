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

exports.isDuplicateClassCode = (course_id, body) => {
  shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@')
  const classCode = shortid.generate()
  const selectQuery = 'SELECT class_code FROM section WHERE class_code = \"' + classCode + '\"'
  const sectionQuery = 'INSERT INTO section (course_id, section, room, class_code, day, time_start, time_end) VALUES ?';
  con.query(selectQuery, function(err, result){
    if(err) throw err;
    else if(result.length){
      isDuplicateClassCode(course_id, body)
      return;
    } else {
      const sectionValues = [[course_id, body.section, body.room, classCode, body.day, body.time_start, body.time_end]]
      con.query(sectionQuery, [sectionValues], function (err, result) {
          if(err) throw err;
          console.log('Class code is not duplicate! : ' + classCode + 'and create a classroom successfully!')
        }
      )
    }
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

exports.connect = con
