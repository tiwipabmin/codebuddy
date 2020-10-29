/**
 * Module dependencies
 */
const mongoose = require("mongoose");
const LocalStrategy = require("passport-local").Strategy;

const User = mongoose.model("User");
const Notification = mongoose.model("Notification");
const Project = mongoose.model("Project");
const bcrypt = require("bcrypt");
const Redis = require("ioredis");
const conMysql = require("../mySql");

function config(passport) {
  /**
   * serialize users and only parse the user id to the session
   * @param {Object} user user instance
   * @param {Function} done callback function
   */
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  /**
   * deserialize users out of the session to get the ID that used to find user
   * @param {String} id user id
   * @param {Function} done callback function
   */
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

  /**
   * passport strategy for local register
   */
  passport.use(
    "local-register",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        // checks if user or email is already exists
        if (
          await User.findOne({
            $or: [{ email }, { username: req.body.username }],
          })
        ) {
          return done(null, false, {
            message: "Username or Email is already exist",
          });
        }
        let username = req.body.username;
        let firstname = req.body.firstname.trim();
        let lastname = req.body.lastname.trim();
        let occupation = req.body.occupation;
        let gender = req.body.gender;
        let insertStudent =
          "INSERT INTO " +
          occupation +
          " (username, first_name, last_name, email, gender) VALUES ?";
        let values = [[username, firstname, lastname, email, gender]];
        let subjectId = await conMysql.insertStudent(insertStudent, values);
        if (subjectId != "Insert Failed!") {
          // saves user to database
          let user = await new User({
            username: username,
            email: email,
            password: password,
            img:
              "/images/user_img_" + Math.floor(Math.random() * 7 + 0) + ".jpg",
            info: {
              firstname: firstname,
              lastname: lastname,
              occupation: occupation,
              gender: gender,
            },
            subjectId: subjectId,
          }).save();
          return done(null, user);
        }
        return done(null, false, { message: "Error, please register again." });
      }
    )
  );

  /**
   * Passport strategy for local sign in
   */
  passport.use(
    "local-signin",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const redis = new Redis();
          const user = await User.findOne({
            $or: [{ email }, { username: email }],
          });
          if (!user) {
            return done(null, false, {
              message: "Username or Email is not exist",
            });
          }
          let verifyPassword = await user.verifyPassword(password);
          if (verifyPassword) {
            const systemAccessTime = user.systemAccessTime + 1;
            const resStatus = await User.updateOne(
              {
                $or: [{ email }, { username: email }],
              },
              {
                $set: {
                  systemAccessTime: systemAccessTime,
                },
              },
              (err) => {
                if (err) throw err;
              }
            );

            let sections = {};
            const occupation = user.info.occupation;
            const username = user.username;
            if (occupation === "student") {
              const queryStudent = `select enrollment_id from student as std
              join enrollment as en on en.student_id = std.student_id
              where std.username = \"${username}\"`;
              const resEnrollmentId = await conMysql
                .selectEnrollment(queryStudent)
                .catch((err) => {
                  throw err;
                });

              for (let index in resEnrollmentId) {
                const enrollmentId = resEnrollmentId[index].enrollment_id;
                const querySection = `select * from enrollment as en
                join section as sec on sec.section_id = en.section_id
                join course as c on c.course_id = sec.course_id
                where en.enrollment_id = ${enrollmentId}`;
                const resSections = await conMysql
                  .selectSection(querySection)
                  .catch((err) => {
                    throw err;
                  });

                const tmps = { ...resSections[0] };
                Object.assign(sections, { [resSections[0].section_id]: tmps });
              }

              for (let key in sections) {
                if (sections[key].partner_id !== null) {
                  const queryPartner =
                    "select * from student as st join enrollment as e on e.student_id = st.student_id where e.enrollment_id = " +
                    sections[key].partner_id;
                  const resPartners = await conMysql
                    .selectStudent(queryPartner)
                    .catch((err) => {
                      throw err;
                    });
                  const tmps = { ...resPartners[0] };
                  sections[key].partner_info = tmps;
                }
              }
            }

            for (let key in sections) {
              if (sections[key].partner_id !== null) {
                let notifications = new Notification();
                notifications.receiver = [
                  { username: username, status: `interacted` },
                  {
                    username: sections[key].partner_info.username,
                    status: `no interact`,
                  },
                ];
                notifications.link = `/`;
                notifications.head = `Partner: การแจ้งเตือนจากเพื่อนโปรเจ็กต์ของคุณ`;
                notifications.content = `${username} เข้าสู่ระบบ Codebuddy แล้ว.`;
                notifications.status = `pending`;
                notifications.type = `systemUsage`;
                notifications.createdBy = username;
                notifications.info = { operation: `sign in` };
                notifications = await notifications.save();
              }
            }

            // console.log('user, user , verifyPassword, ', verifyPassword, ', username, ', user.username, ', resStatus, ', resStatus)
            return done(null, user);
          } else {
            return done(null, false, { message: "Wrong password" });
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

/**
 * Expose `config` for passport instance
 */
module.exports = config;
