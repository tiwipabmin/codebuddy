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

exports.getSection = (query, callback) => {
  con.query(query, function(err, result){
    if(err) callback(err, null);
    callback(null, result)
  })
}

exports.connect = con
