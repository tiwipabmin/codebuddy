/**
 * Middlewears handler
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
 const con = require('../my_sql')

exports.isSignedIn = (req, res, next) => {
  return req.isAuthenticated() ? next() : res.redirect('/signin')
}

exports.isLoggedOut = (req, res, next) => {
  return req.isAuthenticated() ? res.redirect('/lobby') : next()
}

exports.validateSection = async (req, res, next) => {
  console.log('section_id : ' + req.query.section_id)
  var occupation = req.user.info.occupation
  var query;
  var res_object;
  console.log('req.user.occupation : ' + occupation)
  if(occupation == 'teacher') {

    query = 'SELECT * FROM teacher AS t JOIN course AS c ON t.teacher_id = c.teacher_id JOIN section AS s ON c.course_id = s.course_id WHERE s.section_id = ' + req.query.section_id + ' AND t.username = \'' + req.user.username + '\''
    res_object = await con.getTeacher(query)
  } else {
    query = 'SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id WHERE e.section_id = ' + req.query.section_id + ' AND st.username = \'' + req.user.username + '\''
    res_object = await con.getStudent(query)
  }

  console.log('res_object : ', res_object)
  if(res_object.length) {
    return next()
  } else {
    return res.redirect('/signin')
  }
}
