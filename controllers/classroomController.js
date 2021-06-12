const mongoose = require("mongoose");
const conMysql = require("../mySql");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");
const Redis = require("ioredis");
const fs = require("fs");

const Notification = mongoose.model("Notification");
const Comment = mongoose.model("Comment");
const Message = mongoose.model("Message");
const History = mongoose.model("History");
const Project = mongoose.model("Project");
const Score = mongoose.model("Score");
const User = mongoose.model("User");

exports.getSection = async (req, res) => {
    let dataSets = {};
    console.log(req.params.section_id)
    let section_id = parseInt(cryptr.decrypt(req.params.section_id));
    let occupation = req.user.info.occupation;
    let queryStudent =
        "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = " +
        section_id +
        " ORDER BY st.first_name ASC";
    let querySection =
        "SELECT * FROM course AS c JOIN section AS s WHERE c.course_id = s.course_id AND s.section_id = " +
        section_id +
        "";
    let queryAssignment =
        "SELECT * FROM assignment WHERE section_id = " + section_id;
    let queryPairingSession =
        "SELECT * FROM pairing_session AS ps WHERE ps.section_id = " +
        section_id +
        " ORDER BY ps.pairing_session_id DESC";
    let section = [];
    let students = [];
    let assignments = [];
    let weeks = [];
    let pairingSessions = [];
    section = await conMysql.selectSection(querySection);
    students = await conMysql.selectStudent(queryStudent);
    assignments = await conMysql.selectAssignment(queryAssignment);
    pairingSessions = await conMysql.selectPairingSession(queryPairingSession);

    if (!section.length) section = [];
    else {
        section = section[0];
        section.section_id = cryptr.encrypt(section.section_id);
    }

    if (!students.length) students = [];
    if (!assignments.length) {
        assignments = [];
    } else if (assignments.length) {
        for (_index in assignments) {
            assignments[_index].assignment_id = cryptr.encrypt(
                assignments[_index].assignment_id
            );
            assignments[_index].section_id = cryptr.encrypt(
                assignments[_index].section_id
            );
            assignments[_index].title = assignments[_index].title;

            assignments[_index].description = assignments[_index].description;

            weeks.indexOf(assignments[_index].week) == -1
                ? weeks.push(assignments[_index].week)
                : null;
        }
    }

    if (!pairingSessions.length)
        pairingSessions = [{ pairing_session_id: -1, status: -1 }];

    if (occupation == "teacher") {
        occupation = 0;

        weeks.sort((a, b) => { return a - b })

        dataSets = {
            origins: {
                occupation: occupation,
                section: section,
                assignments: assignments,
                students: students,
                pairingSessions: pairingSessions,
                weeks: weeks,
            },
            reforms: {
                assignments: JSON.stringify(assignments),
                students: JSON.stringify(students),
                pairingSessions: JSON.stringify(pairingSessions),
                weeks: JSON.stringify(weeks),
            },
        };
    } else {
        occupation = 1;
        let cloneAssignments = Object.assign({}, assignments);
        let projects = await Project.find({
            $and: [
                { status: { $ne: "pending" } },
                {
                    $or: [
                        { creator: req.user.username },
                        { collaborator: req.user.username },
                    ],
                },
            ],
        }).sort({ createdAt: -1 });

        /**
         * projects change data type from array to object
         */
        let cloneProjects = {};
        projects.forEach(function (project) {
            cloneProjects[project.assignment_id] = project;
        });

        projects = [];
        assignments = [];
        weeks = [];
        for (i in cloneAssignments) {
            let checkProjectFromAssignmentId =
                cloneProjects[cryptr.decrypt(cloneAssignments[i].assignment_id)];
            if (checkProjectFromAssignmentId !== undefined) {
                let element = Object.assign({}, checkProjectFromAssignmentId);
                if (element._doc.available_project) {
                    element._doc.section_id = cloneAssignments[i].section_id;
                    projects.push(element._doc);
                    assignments.push(cloneAssignments[i]);
                    weeks.indexOf(element._doc.week) == -1
                        ? weeks.push(element._doc.week)
                        : null;
                }
            }
        }

        projects.reverse();
        weeks.sort((a, b) => { return a - b })

        dataSets = {
            origins: {
                occupation: occupation,
                section: section,
                projects: projects,
                assignments: assignments,
                students: students,
                pairingSessions: pairingSessions,
                weeks: weeks,
            },
            reforms: {
                projects: JSON.stringify(projects),
                assignments: JSON.stringify(assignments),
                students: JSON.stringify(students),
                pairingSessions: JSON.stringify(pairingSessions),
            },
        };
    }
    res.render("classroom", { dataSets, title: section.course_name });
};

exports.createSection = async (req, res) => {
    const queryCourse = "INSERT INTO course (teacher_id, course_name) VALUES ?";
    const queryTeacher =
        "SELECT teacher_id FROM teacher WHERE username = '" +
        req.user.username +
        "'";
    const querySection =
        "INSERT INTO section (course_id, section, room, class_code, day, time_start, time_end) VALUES ?";
    const teacher = await conMysql.selectTeacher(queryTeacher);
    const teacherId = teacher[0].teacher_id;
    const courseValues = [[teacherId, req.body.course_name]];
    const courseId = await conMysql.insertCourse(queryCourse, courseValues);
    const classCode = await conMysql.isDuplicateClassCode();
    const timeStart =
        req.body.time_start_hh +
        ":" +
        req.body.time_start_mm +
        "" +
        req.body.time_start_ap;
    const timeEnd =
        req.body.time_end_hh +
        ":" +
        req.body.time_end_mm +
        "" +
        req.body.time_end_ap;
    const sectionValues = [
        [
            courseId,
            req.body.section,
            req.body.room,
            classCode,
            req.body.day,
            timeStart,
            timeEnd,
        ],
    ];
    const sections = await conMysql.insertSection(querySection, sectionValues);
    res.redirect("lobby");
};

exports.searchStudentByPurpose = async (req, res) => {
    const studentId = req.query.studentId;
    const pairingSessionId = req.query.pairingSessionId;
    const username = req.query.username;
    const avgScore = parseFloat(req.query.avgScore);
    const sectionId = parseInt(cryptr.decrypt(req.query.sectionId));
    const purpose = req.query.purpose;
    let students = [];
    let users = [];
    if ("quality" == purpose) {
        users = await User.find({
            avgScore: { $lte: avgScore + 10, $gte: avgScore - 10 },
            username: { $ne: username },
        });
    } else if ("experience" == purpose) {
        users = await User.find({
            $or: [
                { avgScore: { $gt: avgScore + 10, $lt: avgScore + 20 } },
                { avgScore: { $lt: avgScore - 10, $gt: avgScore - 20 } },
            ],
            username: { $ne: username },
        });
    } else {
        users = await User.find({
            $or: [
                { avgScore: { $gt: avgScore + 20, $lt: avgScore + 30 } },
                { avgScore: { $lt: avgScore - 20, $gt: avgScore - 30 } },
            ],
            username: { $ne: username },
        });
    }
    let count = 0;
    for (index in users) {
        let queryStudent =
            "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND username = '" +
            users[index].username +
            "' AND e.section_id = " +
            sectionId;
        let resStudent = await conMysql.selectStudent(queryStudent);
        if (resStudent.length && resStudent instanceof Array) {
            students[count] = resStudent[0];
            students[count].avg_score = users[index].avgScore;
            students[count].img = users[index].img;
            students[count].total_time = users[index].totalTime;
            count++;
        }
    }
    res.send({
        studentId: studentId,
        pairingSessionId: pairingSessionId,
        students: students,
        purpose: purpose,
        sectionId: cryptr.encrypt(sectionId),
        partnerKeys: req.query.partnerKeys,
        pairingObjectives: req.query.pairingObjectives,
    });
};

exports.getStudentsFromSection = async (req, res) => {
    let partnerKeys = JSON.parse(req.query.partnerKeys);
    let pairingObjectives = JSON.parse(req.query.pairingObjectives);
    let pairingSessionId = req.query.pairingSessionId;
    let command = req.query.command;
    let sectionId = parseInt(cryptr.decrypt(req.query.sectionId));
    let queryStudent =
        "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = " +
        sectionId +
        " ORDER BY st.first_name ASC";
    let resStudents = await conMysql.selectStudent(queryStudent);
    let queryPairingSession =
        "SELECT * FROM pairing_session WHERE pairing_session_id = " +
        pairingSessionId;
    let resPairingSessions = await conMysql.selectPairingSession(
        queryPairingSession
    );

    let isPairingActive = false;
    for (let index in resStudents) {
        if (resStudents[index].partner_id != null) {
            isPairingActive = true;
        }
        let user = await User.findOne({
            username: resStudents[index].username,
        });
        if (user !== null) {
            resStudents[index].avg_score = user.avgScore;
            resStudents[index].img = user.img;
            resStudents[index].total_time = user.totalTime;
        } else {
            console.log("User instance is null in getStudentsFromSection function");
        }
    }
    let count = 0;
    for (let index in partnerKeys) {
        count++;
        break;
    }
    if (!count && !isPairingActive && command == "pair") {
        for (let index in resStudents) {
            partnerKeys[resStudents[index].enrollment_id] = -1;
            pairingObjectives[resStudents[index].enrollment_id] = -1;
        }
    } else if (command == "view") {
        let queryPairingRecord =
            "SELECT * FROM pairing_record WHERE pairing_session_id = " +
            pairingSessionId;
        let resPairingRecords = await conMysql.selectPairingRecord(
            queryPairingRecord
        );
        let pairingRecords = {};
        for (let index in resPairingRecords) {
            pairingRecords[resPairingRecords[index].enrollment_id] =
                resPairingRecords[index];
        }
        let key;
        for (let index in resPairingRecords) {
            /**
             * find key from value
             */
            key = Object.keys(partnerKeys).find(
                (key) => partnerKeys[key] === resPairingRecords[index].enrollment_id
            );
            if (
                partnerKeys[resPairingRecords[index].enrollment_id] === undefined &&
                partnerKeys[key] === undefined
            ) {
                if (
                    pairingRecords[resPairingRecords[index].enrollment_id].role == "host"
                ) {
                    partnerKeys[resPairingRecords[index].enrollment_id] =
                        resPairingRecords[index].partner_id;
                } else if (
                    pairingRecords[resPairingRecords[index].enrollment_id].role ==
                    "partner"
                ) {
                    partnerKeys[resPairingRecords[index].partner_id] =
                        resPairingRecords[index].enrollment_id;
                }
                pairingObjectives[resPairingRecords[index].enrollment_id] =
                    pairingRecords[
                        resPairingRecords[index].enrollment_id
                    ].pairing_objective;
                pairingObjectives[resPairingRecords[index].partner_id] =
                    pairingRecords[resPairingRecords[index].partner_id].pairing_objective;
            }
        }
    }
    let students = {};
    for (let index in resStudents) {
        students[resStudents[index].enrollment_id] = resStudents[index];
    }
    if (!resPairingSessions.length) resPairingSessions = [{ status: -1 }];
    res.send({
        students: students,
        partnerKeys: partnerKeys,
        pairingObjectives: pairingObjectives,
        command: command,
        pairingSessionStatus: resPairingSessions[0].status,
    });
};

exports.searchStudent = async (req, res) => {
    const search = req.query.search;
    const studentId = req.query.student_id;
    const sectionId = parseInt(cryptr.decrypt(req.query.section_id));
    const pairingSessionId = req.query.pairing_session_id;
    const username = req.query.username;
    const studentQuery =
        "SELECT * FROM enrollment AS\
     e JOIN student AS s ON e.student_id = s.student_id WHERE e.section_id = \
     " +
        sectionId +
        " AND (s.first_name LIKE '%" +
        search +
        "%'\
      OR s.last_name LIKE '%" +
        search +
        "%' OR s.username LIKE '%" +
        search +
        "%')";
    const resStudents = await conMysql.selectStudent(studentQuery);
    let students = [];
    let user = null;
    if (resStudents instanceof Array) {
        for (let index in resStudents) {
            if (resStudents[index].username != username) {
                user = await User.findOne({
                    username: resStudents[index].username,
                });
                if (user != null) {
                    resStudents[index].avg_score = user.avgScore;
                    resStudents[index].img = user.img;
                    resStudents[index].total_time = user.totalTime;
                }
                students.push(resStudents[index]);
            }
        }
    }
    console.log("Search Student: partnerKeys, ", req.query.partner_keys);
    res.send({
        studentId: studentId,
        students: students,
        purpose: "none",
        sectionId: cryptr.encrypt(sectionId),
        pairingSessionId: pairingSessionId,
        partnerKeys: req.query.partner_keys,
        pairingObjectives: req.query.pairing_objective,
    });
};

exports.searchPartner = async (req, res) => {
    const search = req.query.search;
    const username = req.user.username;
    const sectionId = parseInt(cryptr.decrypt(req.query.sectionId));
    const studentQuery =
        "SELECT * FROM enrollment AS\
     e JOIN student AS s ON e.student_id = s.student_id WHERE e.section_id = \
     " +
        sectionId +
        " AND (s.first_name LIKE '%" +
        search +
        "%'\
      OR s.last_name LIKE '%" +
        search +
        "%' OR s.username LIKE '%" +
        search +
        "%')";
    const resStudents = await conMysql.selectStudent(studentQuery);
    console.log("resStudents, ", resStudents);
    let students = [];
    let user = null;
    if (resStudents instanceof Array) {
        for (let index in resStudents) {
            if (resStudents[index].username != username) {
                user = await User.findOne({
                    username: resStudents[index].username,
                });
                if (user != null) {
                    resStudents[index].avgScore = user.avgScore;
                    resStudents[index].img = user.img;
                    resStudents[index].totalTime = user.totalTime;
                }
                students.push(resStudents[index]);
            }
        }
    }
    res.send({
        students: students,
        purpose: "none",
    });
};

exports.getPairing = async (req, res) => {
    let pairingSessionId = parseInt(req.query.pairing_session_id);
    let sectionId = parseInt(cryptr.decrypt(req.query.section_id));
    let dataSets = await getPairingByPairingSessionId(
        conMysql,
        pairingSessionId,
        sectionId
    );

    res.send({
        status: "Pull information successfully",
        pairingSessionId: pairingSessionId,
        sectionId: cryptr.encrypt(sectionId),
        partnerKeys: JSON.stringify(dataSets.partnerKeys),
        pairingObjectives: JSON.stringify(dataSets.pairingObjectives),
    });
};

exports.getWeeklyAssignments = async (req, res) => {
    let action = req.query.action;
    let weeks = [];
    if (action == "enable") {
        let project = await Project.find({
            available_project: false,
        });
        project.forEach(function (e) {
            weeks.indexOf(e.week) == -1 ? weeks.push(e.week) : null;
        });
    } else if (action == "disable") {
        let project = await Project.find({
            available_project: true,
        });
        project.forEach(function (e) {
            weeks.indexOf(e.week) == -1 ? weeks.push(e.week) : null;
        });
    }
    res.send({ weeks: JSON.stringify(weeks) });
};

exports.getEnableAssignments = async (req, res) => {
    const sectionId = cryptr.decrypt(req.query.sectionId);
    const weeks = [];
    const assignments = [];

    const queryAssignment = `SELECT assignment_id FROM assignment WHERE section_id = ${sectionId}`;
    await conMysql.selectAssignment(queryAssignment).then((data) => {
        if (typeof data === `string`) {
            console.log('Message from the "getEnableAssignments" function: ', data);
        } else {
            for (let index in data) {
                assignments.push({ assignment_id: data[index].assignment_id });
            }
        }
    });

    let project = await Project.find({
        $and: [{ available_project: true }, { $or: assignments }],
    });

    project.forEach(function (e) {
        weeks.indexOf(e.week) == -1 ? weeks.push(e.week) : null;
    });

    console.log("Weeks: ", weeks, ", Section id: ", sectionId);
    res.send({
        weeks: JSON.stringify(weeks),
        sectionId: cryptr.encrypt(sectionId),
    });
};

exports.getDisableAssignments = async (req, res) => {
    const sectionId = cryptr.decrypt(req.query.sectionId);
    const weeks = [];
    const assignments = [];

    const queryAssignment = `SELECT assignment_id FROM assignment WHERE section_id = ${sectionId}`;
    await conMysql.selectAssignment(queryAssignment).then((data) => {
        if (typeof data === `string`) {
            console.log('Message from the "getEnableAssignments" function: ', data);
        } else {
            for (let index in data) {
                assignments.push({ assignment_id: data[index].assignment_id });
            }
        }
    });

    let project = await Project.find({
        $and: [{ available_project: false }, { $or: assignments }],
    });

    project.forEach(function (e) {
        weeks.indexOf(e.week) == -1 ? weeks.push(e.week) : null;
    });

    res.send({
        weeks: JSON.stringify(weeks),
        sectionId: cryptr.encrypt(sectionId),
    });
};

exports.startAutoPairingByPurpose = async (req, res) => {
    // let diffScore = req.query.diffScore
    let pairingPurpose = req.query.pairingPurpose;
    let command = req.query.command;
    let partnerKeys = {};
    let pairingObjectives = {};
    let pairingSessionId = req.query.pairingSessionId;
    let sectionId = req.query.sectionId;

    let selectStudentsBySectionId =
        "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = " +
        cryptr.decrypt(sectionId) +
        " ORDER BY st.first_name ASC";
    let getStudents = await conMysql.selectStudent(selectStudentsBySectionId);

    let students = {};

    let eachStudentScores = {};
    let allOfScores = [];

    let previousPartnersOfEachStudents = {};
    let numberAllOfStudent = 0;
    /*
     * "-1" means student have not partner
     */
    for (let index in getStudents) {
        let enrollmentId = getStudents[index].enrollment_id;
        let username = getStudents[index].username;
        partnerKeys[enrollmentId] = -1;
        pairingObjectives[enrollmentId] = -1;
        students[enrollmentId] = username;

        let selectPairingRecordByEnrollmentId =
            "select partner_id from pairing_record where enrollment_id = " +
            enrollmentId;
        let getPairingRecord = await conMysql.selectPairingRecord(
            selectPairingRecordByEnrollmentId
        );

        // previous partner of each student
        let previousPartners = [];
        for (let index in getPairingRecord) {
            if (previousPartners.indexOf(getPairingRecord[index].partner_id) < 0) {
                previousPartners.push(getPairingRecord[index].partner_id);
            }
        }
        previousPartnersOfEachStudents[enrollmentId] = previousPartners;
        numberAllOfStudent++;

        // avg score of each student
        let user = await User.findOne({
            username: username,
        });
        eachStudentScores[enrollmentId] = user.avgScore;
        allOfScores.push(user.avgScore);
    }
    numberAllOfStudent = Math.floor(numberAllOfStudent / 2);
    allOfScores.sort(function (a, b) {
        return b - a;
    });

    let expert = {};
    let novice = {};
    // half of student is assigned to expert by score is identifier, score is sorted from higher to lower
    for (let index = 0; index < numberAllOfStudent; index++) {
        for (let enrollmentId in students) {
            if (eachStudentScores[enrollmentId] === allOfScores[index]) {
                expert[enrollmentId] = allOfScores[index];
                delete students[enrollmentId];
            }
        }
    }

    let numberOfNoviceRemaining = 0;
    for (let enrollmentId in students) {
        novice[enrollmentId] = eachStudentScores[enrollmentId];
        numberOfNoviceRemaining++;
    }
    let resStatus =
        "Start Auto Pairing By Purpose Successfully!., " + pairingPurpose;

    let isCompletedPairing = false;
    let timerId = setTimeout(
        function (resStatus, isCompletedPairing, timerId) {
            resStatus = "Out of time, Please start new auto pairing!";
            isCompletedPairing = true;
            clearInterval(timerId);
        },
        1000,
        resStatus,
        isCompletedPairing,
        timerId
    );

    let count = null;
    for (let enrollmentIdEx in expert) {
        count = 0;
        for (let enrollmentIdNo in novice) {
            /*
             * enrollmentIdEx has paired enrollmentIdNo
             */
            if (
                previousPartnersOfEachStudents[enrollmentIdEx].indexOf(enrollmentIdNo) >
                0
            ) {
                count++;
            }
        }

        if (
            count === previousPartnersOfEachStudents[enrollmentIdEx].length &&
            count
        ) {
            res.send({ resStatus: "Some student has paired all friend." });
            return;
        }
    }

    let cloneExperts = null;
    let cloneNovices = null;
    do {
        cloneExperts = Object.assign({}, expert);
        cloneNovices = Object.assign({}, novice);

        /*
         * "-1" means student have not partner
         */
        for (let key in partnerKeys) {
            if (partnerKeys[key] != -1) {
                partnerKeys[partnerKeys[key]] = -1;
                partnerKeys[key] = -1;
            }
        }

        for (let enrollmentIdEx in cloneExperts) {
            count = 0;
            for (let enrollmentIdNo in cloneNovices) {
                /*
                 * enrollmentIdEx has never paired with enrollmentIdNo
                 */
                if (
                    previousPartnersOfEachStudents[enrollmentIdEx].indexOf(
                        enrollmentIdNo
                    ) < 0
                ) {
                    /*
                     * Both of student must have at least 10 different scores.
                     */
                    if (
                        eachStudentScores[enrollmentIdEx] -
                        eachStudentScores[enrollmentIdNo] >
                        10
                    ) {
                        partnerKeys[enrollmentIdEx] = enrollmentIdNo;
                        delete cloneNovices[enrollmentIdNo];
                        numberOfNoviceRemaining--;
                        break;
                    } else {
                        count++;
                    }
                }
            }

            // Has not suitable partner.
            if (count === numberOfNoviceRemaining) {
                isCompletedPairing = true;
            }
        }
    } while (!isCompletedPairing);

    res.send({ resStatus: resStatus });
};

exports.startAutoPairingByScoreDiff = async (req, res) => {
    let scoreDiff = parseInt(req.query.scoreDiff);
    let resStatus = "Start Auto Pairing By Score Diff Successfully!";
    if (scoreDiff || scoreDiff === 0) {
    } else {
        res.send({ resStatus: "This score difference is not valid!" });
        return;
    }
    let command = req.query.command;
    let partnerKeys = {};
    let pairingObjectives = {};
    let pairingSessionId = req.query.pairingSessionId;
    let sectionId = req.query.sectionId;

    let selectStudentsBySectionId =
        "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id AND e.section_id = " +
        cryptr.decrypt(sectionId) +
        " ORDER BY st.first_name ASC";
    let getStudents = await conMysql.selectStudent(selectStudentsBySectionId);

    let students = {};

    let eachStudentScores = {};
    let allOfScores = [];

    let previousPartnersOfEachStudents = {};
    let numberAllOfStudent = 0;
    /*
     * "-1" means student have not partner
     */
    for (let index in getStudents) {
        let enrollmentId = getStudents[index].enrollment_id;
        let username = getStudents[index].username;
        partnerKeys[enrollmentId] = -1;
        pairingObjectives[enrollmentId] = "scoreDiff";
        students[enrollmentId] = username;

        let selectPairingRecordByEnrollmentId =
            "select partner_id from pairing_record where enrollment_id = " +
            enrollmentId;
        let getPairingRecord = await conMysql.selectPairingRecord(
            selectPairingRecordByEnrollmentId
        );

        /**
         *  previous partner of each student
         */
        let previousPartners = [];
        for (let index in getPairingRecord) {
            if (previousPartners.indexOf(getPairingRecord[index].partner_id) < 0) {
                previousPartners.push(getPairingRecord[index].partner_id);
            }
        }
        previousPartnersOfEachStudents[enrollmentId] = previousPartners;
        numberAllOfStudent++;

        /**
         * avg score of each student
         */
        let user = await User.findOne({
            username: username,
        });
        eachStudentScores[enrollmentId] = user.avgScore;
        allOfScores.push(user.avgScore);
    }
    // if (numberAllOfStudent % 2 === 0) {
    //   numberAllOfStudent = Math.floor(numberAllOfStudent/2)
    // } else {
    //   res.send({resStatus: 'Number of student is not even!'})
    //   return
    // }
    allOfScores.sort(function (a, b) {
        return b - a;
    });

    let randomKey = function (obj) {
        let keys = Object.keys(obj);
        return keys[(keys.length * Math.random()) << 0];
    };

    for (let enrollmentIdSd in students) {
        let previousRandSd = {};
        let numberOfStudents = Object.keys(students).length;
        let numberOfPreviousRandSds = Object.keys(previousRandSd).length;

        while (numberOfStudents !== numberOfPreviousRandSds) {
            let enrollmentIdPn = randomKey(students);
            let result =
                eachStudentScores[enrollmentIdSd] - eachStudentScores[enrollmentIdPn];
            if (
                ((result <= scoreDiff && result >= 0) ||
                    (result >= -scoreDiff && result <= 0)) &&
                enrollmentIdSd != enrollmentIdPn &&
                previousPartnersOfEachStudents[enrollmentIdSd].indexOf(
                    parseInt(enrollmentIdPn)
                ) < 0
            ) {
                partnerKeys[parseInt(enrollmentIdSd)] = parseInt(enrollmentIdPn);
                delete partnerKeys[enrollmentIdPn];
                delete students[enrollmentIdSd];
                delete students[enrollmentIdPn];
                break;
            } else if (enrollmentIdSd != enrollmentIdPn) {
                previousRandSd[enrollmentIdPn] = eachStudentScores[enrollmentIdPn];
            }

            /*
             * not excluding enrllmentIdSd
             */
            numberOfStudents = Object.keys(students).length - 1;

            numberOfPreviousRandSds = Object.keys(previousRandSd).length;
        }
    }

    for (let key in partnerKeys) {
        if (partnerKeys[key] < 0) {
            pairingObjectives[key] = -1;
        }
    }

    res.send({
        resStatus: resStatus,
        partnerKeys: JSON.stringify(partnerKeys),
        pairingObjectives: JSON.stringify(pairingObjectives),
        pairingSessionId: pairingSessionId,
        sectionId: sectionId,
    });
};

exports.updatePairingSession = async (req, res) => {
    const sectionId = parseInt(cryptr.decrypt(req.body.section_id));
    const pairing_session_id = req.body.pairing_session_id;
    const status = req.body.status;

    /**
     * create date time at this moment
     */
    let dateTime = new Date();
    let strDataTime = dateTime.toString();
    let splitDataTime = strDataTime.split(" ");
    let sliceDataTime = splitDataTime.slice(1, 5);
    let month = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
    };
    let numMonth = month[sliceDataTime[0]];
    numMonth === undefined ? (numMonth = "13") : null;
    let timeEnd =
        sliceDataTime[2] +
        "-" +
        numMonth +
        "-" +
        sliceDataTime[1] +
        " " +
        sliceDataTime[3];

    const update_pairing_session_by_pairing_session_id =
        "UPDATE pairing_session SET status = " +
        status +
        ", time_end = '" +
        timeEnd +
        "' WHERE pairing_session_id = " +
        pairing_session_id;
    let resStatus = await conMysql.updatePairingSession(
        update_pairing_session_by_pairing_session_id
    );

    let queryPairingSession = "";
    let pairingSessions = [];
    if (resStatus == "Update completed.") {
        const queryStudent = `SELECT * FROM enrollment AS en JOIN student AS st ON en.student_id = st.student_id WHERE en.section_id = ${sectionId}`;
        const resStudents = await conMysql.selectStudent(queryStudent);

        for (let index in resStudents) {
            let partner = resStudents.find((e) => {
                return (e.enrollment_id = resStudents[index].partner_id);
            });

            if (partner !== undefined) {
                await Notification.updateMany(
                    {
                        $and: [
                            {
                                $or: [
                                    {
                                        "receiver.username": resStudents[index].username,
                                    },
                                    {
                                        "receiver.username": partner.username,
                                    },
                                ],
                            },
                            {
                                $or: [
                                    {
                                        type: `project`,
                                    },
                                    {
                                        type: `systemUsage`,
                                    },
                                ],
                            },
                            {
                                status: `pending`,
                            },
                        ],
                    },
                    { $set: { status: `finished` } }
                );

                let partnerIndex = resStudents
                    .map((e) => {
                        return e.username;
                    })
                    .indexOf(partner.username);

                resStudents.splice(partnerIndex, 1);
            }
        }

        const resetPartner =
            "UPDATE enrollment SET partner_id = NULL WHERE section_id = " + sectionId;
        resStatus = await conMysql.updateEnrollment(resetPartner);

        queryPairingSession =
            "SELECT * FROM pairing_session AS ps WHERE ps.section_id = " +
            sectionId +
            " ORDER BY ps.pairing_session_id DESC";
        pairingSessions = await conMysql.selectPairingSession(queryPairingSession);
    } else {
        resStatus = "Update a pairing date time status failed.";
    }

    const queryAssignment = `select * from assignment where section_id = ${sectionId}`;
    const resAssignments = await conMysql.selectAssignment(queryAssignment);
    let assignments = {};
    for (let index in resAssignments) {
        const tmp = { ...resAssignments[index] };
        Object.assign(assignments, { [tmp.assignment_id]: tmp });
    }

    queryPairingSession = `select * from pairing_session where pairing_session_id = ${pairing_session_id}`;
    const resPairingSessions = await conMysql.selectPairingSession(
        queryPairingSession
    );

    // console.log('Assignments, ', assignments)
    const projects = await Project.find({
        $and: [
            {
                available_project: true,
            },
            {
                createdAt: {
                    $gt: new Date(resPairingSessions[0].time_start),
                },
            },
        ],
    });
    // console.log("Projects Before, ", projects);

    for (let index in projects) {
        const assignmentId = projects[index].assignment_id;
        if (assignments[assignmentId] !== undefined) {
            const updatProject = await Project.updateOne(
                { assignment_id: assignmentId },
                { $set: { available_project: false } }
            );
        }
    }
    // console.log("Projects After, ", projects);

    res.send({
        resStatus: resStatus,
        pairingSessions: JSON.stringify(pairingSessions),
        sectionId: cryptr.encrypt(sectionId),
    });
};

exports.resetPair = async (req, res) => {
    const queryEnrollment =
        "UPDATE enrollment SET partner_id = " +
        req.body.partner_id +
        " WHERE section_id = " +
        parseInt(cryptr.decrypt(req.body.section_id));
    const resStatus = await conMysql.updateEnrollment(queryEnrollment);
    res.send({ resStatus: resStatus });
};

exports.updatePairing = async (req, res) => {
    let partnerKeys = req.body.partnerKeys;
    let pairingObjectives = req.body.pairingObjectives;
    let pairingSessionId = req.body.pairingSessionId;
    let sectionId = parseInt(cryptr.decrypt(req.body.sectionId));
    let changedPartnerKeys = {};
    let count = 0;

    let dataSets = await getPairingByPairingSessionId(
        conMysql,
        pairingSessionId,
        sectionId
    );

    /*
     ** if there aren't student pairing, server will send message which 'Please, pair all student!'.
     */
    for (key in partnerKeys) {
        if (parseInt(partnerKeys[key]) < 0) {
            res.send({ status: "Please pair all students!" });
            return;
        }

        /*
         * if students join to the classroom after the teacher matched students, students don't have a partner.
         */
        if (dataSets.partnerKeys[key] === undefined) {
            count++;
            changedPartnerKeys[key] = partnerKeys[key];
        } else if (dataSets.partnerKeys[key] != partnerKeys[key]) {
            count++;
            changedPartnerKeys[key] = partnerKeys[key];
        }

        /*
         * if pairing objective changes new objective, old pair changes new partner.
         */
        if (dataSets.pairingObjectives[key] != pairingObjectives[key]) {
            count++;
            changedPartnerKeys[key] = partnerKeys[key];
        }
    }

    if (!count) {
        res.send({ status: "Nothing update" });
        return;
    }

    const pairingSessionQuery =
        "SELECT * FROM pairing_session WHERE pairing_session_id = " +
        pairingSessionId;
    let resPairingSession = await conMysql.selectPairingSession(
        pairingSessionQuery
    );
    let timeStart = resPairingSession[0].time_start;
    timeStart = timeStart.split(" ");
    timeStart = timeStart[0];

    let studentQuery =
        "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id =" +
        "\
     e.student_id AND e.section_id = " +
        sectionId +
        " ORDER BY st.first_name ASC";
    let resStudents = await conMysql.selectStudent(studentQuery);

    let pairingRecordQuery =
        "SELECT * FROM pairing_record WHERE pairing_session_id = " +
        pairingSessionId;
    let resPairingRecord = await conMysql.selectPairingRecord(pairingRecordQuery);

    let pairingRecordRoles = {};
    for (let index in resPairingRecord) {
        pairingRecordRoles[resPairingRecord[index].enrollment_id] =
            resPairingRecord[index].role;
    }

    let newStudents = {};

    for (let index in resStudents) {
        newStudents[resStudents[index].enrollment_id] = {
            username: resStudents[index].username,
            role: pairingRecordRoles[resStudents[index].enrollment_id],
        };
    }

    let resProject = [];
    let projects = [];
    count = 0;
    for (let key in changedPartnerKeys) {
        /*
         * Old pair changes a new partner.
         */
        if (newStudents[key].role == "host") {
            resProject = await Project.find({
                $or: [
                    {
                        creator: newStudents[key].username,
                        createdAt: { $gt: new Date(timeStart) },
                    },
                    {
                        creator: newStudents[key].username,
                        createdAt: { $eq: new Date(timeStart) },
                    },
                ],
            });
        } else if (newStudents[key].role == "partner") {
            resProject = await Project.find({
                $or: [
                    {
                        collaborator: newStudents[key].username,
                        createdAt: { $gt: new Date(timeStart) },
                    },
                    {
                        collaborator: newStudents[key].username,
                        createdAt: { $eq: new Date(timeStart) },
                    },
                ],
            });
        }

        /*
         * if projects don't has pid, projects save pid
         */
        let outLoop = false;
        resProject.length != 0 ? true : (resProject = []);
        for (let indexResPro in resProject) {
            for (let indexPro in projects) {
                if (projects[indexPro].indexOf(resProject[indexResPro].pid) != -1) {
                    outLoop = true;
                    break;
                }
            }

            if (outLoop) {
                break;
            }
        }

        if (!outLoop) {
            projects.push([]);
            resProject.forEach(function (e) {
                projects[count].push(e.pid);
            });
            count++;
        }

        if (newStudents[changedPartnerKeys[key]].role == "host") {
            resProject = await Project.find({
                $or: [
                    {
                        creator: newStudents[changedPartnerKeys[key]].username,
                        createdAt: { $gt: new Date(timeStart) },
                    },
                    {
                        creator: newStudents[changedPartnerKeys[key]].username,
                        createdAt: { $eq: new Date(timeStart) },
                    },
                ],
            });
        } else if (newStudents[changedPartnerKeys[key]].role == "partner") {
            resProject = await Project.find({
                $or: [
                    {
                        collaborator: newStudents[changedPartnerKeys[key]].username,
                        createdAt: { $gt: new Date(timeStart) },
                    },
                    {
                        collaborator: newStudents[changedPartnerKeys[key]].username,
                        createdAt: { $eq: new Date(timeStart) },
                    },
                ],
            });
        }
        outLoop = false;
        resProject.length != 0 ? true : (resProject = []);
        for (let indexResPro in resProject) {
            for (let indexPro in projects) {
                if (projects[indexPro].indexOf(resProject[indexResPro].pid) != -1) {
                    outLoop = true;
                    break;
                }
            }

            if (outLoop) {
                break;
            }
        }

        if (!outLoop) {
            projects.push([]);
            resProject.forEach(function (e) {
                projects[count].push(e.pid);
            });
            count++;
        }
    }

    for (let indexMainPro in projects) {
        for (let indexSubPro in projects[indexMainPro]) {
            status = await History.deleteMany({
                pid: projects[indexMainPro][indexSubPro],
            });
            status = await Score.deleteMany({
                pid: projects[indexMainPro][indexSubPro],
            });
            status = await Message.deleteMany({
                pid: projects[indexMainPro][indexSubPro],
            });
        }
    }

    /*
     * Delete many projects in one week.
     */
    for (var key in changedPartnerKeys) {
        if (newStudents[key].role == "host") {
            status = await Project.deleteMany({
                creator: newStudents[key].username,
                $or: [
                    { createdAt: { $gt: new Date(timeStart) } },
                    { createdAt: { $eq: new Date(timeStart) } },
                ],
            });
        } else if (newStudents[key].role == "partner") {
            status = await Project.deleteMany({
                collaborator: newStudents[key].username,
                $or: [
                    { createdAt: { $gt: new Date(timeStart) } },
                    { createdAt: { $eq: new Date(timeStart) } },
                ],
            });
        }

        if (newStudents[changedPartnerKeys[key]].role == "host") {
            status = await Project.deleteMany({
                creator: newStudents[changedPartnerKeys[key]].username,
                $or: [
                    { createdAt: { $gt: new Date(timeStart) } },
                    { createdAt: { $eq: new Date(timeStart) } },
                ],
            });
        } else if (newStudents[changedPartnerKeys[key]].role == "partner") {
            status = await Project.deleteMany({
                collaborator: newStudents[changedPartnerKeys[key]].username,
                $or: [
                    { createdAt: { $gt: new Date(timeStart) } },
                    { createdAt: { $eq: new Date(timeStart) } },
                ],
            });
        }
    }

    let sumScore = [];
    /*
     * Sum new scores.
     */
    for (let key in changedPartnerKeys) {
        let uid = [key, changedPartnerKeys[key]];
        for (let index in uid) {
            await User.findOne(
                {
                    username: newStudents[uid[index]].username,
                },
                async function (err, element) {
                    if (err) {
                        console.log(err);
                    }

                    sumScore = await Score.aggregate(
                        [
                            {
                                $match: {
                                    uid: element._id.toString(),
                                },
                            },
                            {
                                $group: {
                                    _id: "$uid",
                                    avg: { $avg: "$score" },
                                },
                            },
                        ],
                        function (err, results) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            if (results) {
                                // sum = 0;
                                results.forEach(function (result) {
                                    // start update
                                    User.updateOne(
                                        {
                                            _id: result._id,
                                        },
                                        {
                                            $set: {
                                                avgScore: result.avg,
                                            },
                                        },
                                        function (err, userReturn) {
                                            if (err);
                                            if (userReturn) {
                                                console.log(userReturn);
                                            }
                                        }
                                    );
                                });

                                if (!results.length) {
                                    User.updateOne(
                                        {
                                            _id: element._id,
                                        },
                                        {
                                            $set: {
                                                avgScore: 0,
                                            },
                                        },
                                        function (err, userReturn) {
                                            if (err);
                                            if (userReturn) {
                                                console.log(userReturn);
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    );
                }
            );
        }
    }

    let enrollmentQuery = "";
    let resEnrollment = [];
    let pairingRecordValues = [];
    for (let key in changedPartnerKeys) {
        pairingRecordQuery =
            "DELETE FROM pairing_record WHERE enrollment_id = " +
            parseInt(key) +
            "\
       AND pairing_session_id = " +
            pairingSessionId;
        resPairingRecord = await conMysql.selectPairingRecord(pairingRecordQuery);

        enrollmentQuery =
            "UPDATE enrollment SET partner_id = " +
            parseInt(changedPartnerKeys[key]) +
            " WHERE enrollment_id = " +
            key;
        resEnrollment = await conMysql.updateEnrollment(enrollmentQuery);

        pairingRecordQuery =
            "INSERT INTO pairing_record (enrollment_id, pairing_session_id, partner_id, pairing_objective, role) VALUES ?";
        pairingRecordValues = [
            [
                parseInt(key),
                pairingSessionId,
                parseInt(changedPartnerKeys[key]),
                pairingObjectives[key],
                "host",
            ],
        ];
        resPairingRecord = await conMysql.insertPairingRecord(
            pairingRecordQuery,
            pairingRecordValues
        );

        pairingRecordQuery =
            "DELETE FROM pairing_record WHERE enrollment_id = " +
            parseInt(changedPartnerKeys[key]) +
            "\
       AND pairing_session_id = " +
            pairingSessionId;
        resPairingRecord = await conMysql.selectPairingRecord(pairingRecordQuery);

        enrollmentQuery =
            "UPDATE enrollment SET partner_id = " +
            key +
            " WHERE enrollment_id = " +
            changedPartnerKeys[key];
        resEnrollment = await conMysql.updateEnrollment(enrollmentQuery);

        pairingRecordQuery =
            "INSERT INTO pairing_record (enrollment_id, pairing_session_id, partner_id, pairing_objective, role) VALUES ?";
        pairingRecordValues = [
            [
                parseInt(changedPartnerKeys[key]),
                pairingSessionId,
                parseInt(key),
                pairingObjectives[changedPartnerKeys[key]],
                "partner",
            ],
        ];
        resPairingRecord = await conMysql.insertPairingRecord(
            pairingRecordQuery,
            pairingRecordValues
        );
    }

    res.send({ status: "Update pairing successfully" });
};

exports.manageAssignment = async (req, res) => {
    let action = req.body.action;
    let week = parseInt(req.body.week);
    if (week < 0) {
        if (action == "enable") {
            res.send({ status: "No disable assignment." });
        } else if (action == "disable") {
            res.send({ status: "Not yet assigned assignment." });
        }
        return;
    }
    if (action == "enable") {
        if (!week) {
            let project = await Project.updateMany(
                { available_project: false },
                { $set: { available_project: true } }
            );
        } else if (week) {
            let project = await Project.updateMany(
                { week: week },
                { $set: { available_project: true } }
            );
        }

        res.send({ status: "Enable assignments successfully." });
        return;
    } else if (action == "disable") {
        if (!week) {
            let project = await Project.updateMany(
                { available_project: true },
                { $set: { available_project: false } }
            );
        } else if (week) {
            let project = await Project.updateMany(
                { week: week },
                { $set: { available_project: false } }
            );
        }

        res.send({ status: "Disable assignments successfully." });
        return;
    }
};

exports.disableAssignments = async (req, res) => {
    const week = parseInt(req.body.week);
    const sectionId = cryptr.decrypt(req.body.sectionId);

    if (week < 0) {
        res.send({ status: "Cannot disable assignment." });
        return;
    }

    const assignments = [];

    const queryAssignment = `SELECT assignment_id FROM assignment WHERE section_id = ${sectionId}`;
    await conMysql.selectAssignment(queryAssignment).then((data) => {
        if (typeof data === `string`) {
            console.log('Message from the "disableAssignments" function: ', data);
        } else {
            for (let index in data) {
                assignments.push({ assignment_id: data[index].assignment_id });
            }
        }
    });

    if (!week) {
        await Project.updateMany(
            { $and: [{ available_project: true }, { $or: assignments }] },
            { $set: { available_project: false } }
        );
    } else if (week) {
        await Project.updateMany(
            { $and: [{ week: week }, { $or: assignments }] },
            { $set: { available_project: false } }
        );
    }

    res.send({ status: "Disable assignments successfully." });
};

exports.enableAssignments = async (req, res) => {
    const week = parseInt(req.body.week);
    const sectionId = cryptr.decrypt(req.body.sectionId);

    if (week < 0) {
        res.send({ status: "Cannot enable assignment." });
        return;
    }

    const assignments = [];

    const queryAssignment = `SELECT assignment_id FROM assignment WHERE section_id = ${sectionId}`;
    await conMysql.selectAssignment(queryAssignment).then((data) => {
        if (typeof data === `string`) {
            console.log('Message from the "enableAssignments" function: ', data);
        } else {
            for (let index in data) {
                assignments.push({ assignment_id: data[index].assignment_id });
            }
        }
    });

    if (!week) {
        await Project.updateMany(
            { $and: [{ available_project: false }, { $or: assignments }] },
            { $set: { available_project: true } }
        );
    } else if (week) {
        await Project.updateMany(
            { $and: [{ week: week }, { $or: assignments }] },
            { $set: { available_project: true } }
        );
    }

    res.send({ status: "Enable assignments successfully." });
};

exports.joinClass = async (req, res) => {
    let querySection =
        "SELECT * FROM section WHERE class_code = '" + req.body.class_code + "'";
    let queryStudent =
        "SELECT * FROM student WHERE username = '" + req.user.username + "'";
    let resSections = await conMysql.selectSection(querySection);
    let resStudents = await conMysql.selectStudent(queryStudent);
    if (resSections.length && resSections instanceof Array) {
        let queryEnrollment =
            "SELECT * FROM enrollment WHERE student_id = " +
            resStudents[0].student_id;
        let resEnrollments = await conMysql.selectEnrollment(queryEnrollment);
        if (!resEnrollments.length && resEnrollments instanceof Array) {
            queryEnrollment =
                "INSERT INTO enrollment (student_id, section_id, grade) VALUES ?";
            let values = [
                [resStudents[0].student_id, resSections[0].section_id, "4"],
            ];
            await conMysql.insertEnrollment(queryEnrollment, values);
        }
    }
    res.redirect("/lobby");
};

exports.updateSection = async (req, res) => {
    let section_id = parseInt(cryptr.decrypt(req.body.section_id));
    const time_start =
        req.body.time_start_hh +
        ":" +
        req.body.time_start_mm +
        "" +
        req.body.time_start_ap;
    const time_end =
        req.body.time_end_hh +
        ":" +
        req.body.time_end_mm +
        "" +
        req.body.time_end_ap;
    const updateCourse =
        "UPDATE course SET course_name = '" +
        req.body.course_name +
        "' WHERE course_id = " +
        req.body.course_id;
    const updateSection =
        "UPDATE section SET section = " +
        req.body.section +
        ", room = '" +
        req.body.room +
        "', day = '" +
        req.body.day +
        "', time_start = '" +
        time_start +
        "', time_end = '" +
        time_end +
        "' WHERE section_id = " +
        section_id;
    var courseStatus = await conMysql.updateCourse(updateCourse);
    var sectionStatus = await conMysql.updateSection(updateSection);
    res.redirect("/classroom/" + cryptr.encrypt(section_id));
};

exports.assignAssignment = async (req, res) => {
    const selectEnrollmentBySectionId =
        "SELECT * FROM enrollment WHERE section_id = " +
        cryptr.decrypt(req.body.assignment_set[0].section_id);
    const enrollments = await conMysql.selectEnrollment(
        selectEnrollmentBySectionId
    );
    const assignmentSet = req.body.assignment_set;
    // let isThereIndividualPro = false
    // let isTherePairPro = false
    let proStyles = [];
    for (_index in assignmentSet) {
        assignmentSet[_index].assignment_id = cryptr.decrypt(
            assignmentSet[_index].assignment_id
        );
        let programmingStyle = assignmentSet[_index].programming_style;
        if (proStyles.indexOf(programmingStyle)) {
            proStyles.push(programmingStyle);
            if (proStyles.length > 1) {
                res.send({
                    res_status:
                        "Do not allow to assign assignment that have different programming type by once time!",
                });
                return;
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
    let isPairing = false;
    /**
     * check student pairing
     */
    for (_index in enrollments) {
        if (enrollments[_index].partner_id != null) {
            isPairing = true;
            break;
        }
    }

    let proStyle = proStyles[0];
    if (!isPairing && proStyle !== "Individual") {
        res.send({
            res_status: "Please pair all students before assign the assignment!",
        });
        return;
    }

    const pairingSessionId = req.body.pairing_session_id;
    const swaptime = "15";
    const language = "0";
    const selectStudent =
        "SELECT * FROM student AS st JOIN enrollment AS e ON st.student_id = e.student_id JOIN pairing_record AS ph ON e.enrollment_id = ph.enrollment_id WHERE pairing_session_id = " +
        pairingSessionId;
    var students = await conMysql.selectStudent(selectStudent);
    var creator = "username@Codebuddy";
    var collaborator = "examiner@codebuddy";
    var cloneStudents = {};
    var project = new Project();
    let tempStudents = {};
    let assignment_id = 1;
    let partnerKeys = {};
    let assignment_of_each_pair = {};
    let cloneAssignmentSet = {};
    // let end_time = req.body.end_time

    const selectPairingSessionByPairingSessionId =
        "SELECT * FROM pairing_session WHERE pairing_session_id = " +
        pairingSessionId;
    let pairingSession = await conMysql.selectPairingSession(
        selectPairingSessionByPairingSessionId
    );
    let timeStart = pairingSession[0].time_start;
    timeStart = timeStart.split(" ");
    timeStart = timeStart[0];

    for (let _index in students) {
        cloneStudents[students[_index].enrollment_id] = students[_index];
    }

    for (let _index in assignmentSet) {
        cloneAssignmentSet[assignmentSet[_index].assignment_id] =
            assignmentSet[_index];
    }

    tempStudents = Object.assign({}, cloneStudents);
    if (
        proStyle === "Remote" ||
        proStyle === "Co-located" ||
        proStyle === "Interactive"
    ) {
        for (key in tempStudents) {
            if (tempStudents[key].role == "host") {
                partnerKeys[key] = tempStudents[key].partner_id;
                assignment_of_each_pair[key] = [];
            } else {
                partnerKeys[tempStudents[key].partner_id] = key;
                assignment_of_each_pair[tempStudents[key].partner_id] = [];
            }

            delete tempStudents[tempStudents[key].partner_id];
            delete tempStudents[key];
        }
    } else {
        for (key in tempStudents) {
            partnerKeys[key] = -1;
            assignment_of_each_pair[key] = [];

            delete tempStudents[key];
        }
    }

    let findProject = {};

    let count = 0;
    for (let _index in assignmentSet) {
        for (let key in partnerKeys) {
            if (
                proStyle === "Remote" ||
                proStyle === "Co-located" ||
                proStyle === "Interactive"
            ) {
                /*
                 * assignment is a remote pair-programming or conventional pair-programming.
                 */
                findProject = await Project.findOne({
                    $or: [
                        {
                            assignment_id: assignmentSet[_index].assignment_id,
                            creator: cloneStudents[key].username,
                            collaborator: cloneStudents[partnerKeys[key]].username,
                            createdAt: { $gt: new Date(timeStart) },
                        },
                        {
                            assignment_id: assignmentSet[_index].assignment_id,
                            creator: cloneStudents[key].username,
                            collaborator: cloneStudents[partnerKeys[key]].username,
                            createdAt: { $lt: new Date(timeStart) },
                        },
                        {
                            assignment_id: assignmentSet[_index].assignment_id,
                            creator: cloneStudents[partnerKeys[key]].username,
                            collaborator: cloneStudents[key].username,
                            createdAt: { $gt: new Date(timeStart) },
                        },
                        {
                            assignment_id: assignmentSet[_index].assignment_id,
                            creator: cloneStudents[partnerKeys[key]].username,
                            collaborator: cloneStudents[key].username,
                            createdAt: { $lt: new Date(timeStart) },
                        },
                    ],
                });
                if (findProject == null) {
                    count++;
                    assignment_of_each_pair[key].push(
                        assignmentSet[_index].assignment_id
                    );
                }
            } else if (proStyle === "Individual") {
                /*
                 * assignment is a individual pair-programming.
                 */
                findProject = await Project.findOne({
                    $or: [
                        {
                            assignment_id: assignmentSet[_index].assignment_id,
                            creator: cloneStudents[key].username,
                            createdAt: { $gt: new Date(timeStart) },
                        },
                        {
                            assignment_id: assignmentSet[_index].assignment_id,
                            creator: cloneStudents[key].username,
                            createdAt: { $lt: new Date(timeStart) },
                        },
                    ],
                });

                if (findProject == null) {
                    count++;
                    assignment_of_each_pair[key].push(
                        assignmentSet[_index].assignment_id
                    );
                }
            } else {
                res.send({ res_status: "Error!" });
                return;
            }
        }
    }

    let date_time = new Date();
    let str_date_time = date_time.toString();
    let split_date_time = str_date_time.split(" ");
    let slice_date_time = split_date_time.slice(1, 5);
    let month = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
    };
    let num_month = month[slice_date_time[0]];
    num_month === undefined ? (num_month = "13") : null;
    let start_time =
        slice_date_time[2] +
        "-" +
        num_month +
        "-" +
        slice_date_time[1] +
        "T" +
        slice_date_time[3] +
        "Z";

    // let time_left = moment(new Date(end_time)).diff(moment(new Date(start_time)))
    // console.log('time_left, ', time_left, ', start_time, ', start_time, ', end_time, ', end_time)
    // if(time_left < 0) {
    //   res.send({res_status: 'Please, set end time again!'})
    //   return
    // }

    // let timeoutHandles = []
    // Assign each assignment to the all of student
    for (let key in assignment_of_each_pair) {
        for (let _index in assignment_of_each_pair[key]) {
            assignment_id = assignment_of_each_pair[key][_index];

            project = new Project();
            project.title = cloneAssignmentSet[assignment_id].title;
            project.description = cloneAssignmentSet[assignment_id].description;
            project.programming_style =
                cloneAssignmentSet[assignment_id].programming_style;
            project.language = language;
            project.swaptime = swaptime;
            project.status = "";
            project.week = cloneAssignmentSet[assignment_id].week;
            // project.end_time = new Date(end_time)
            project.available_project = true;
            project.createdAt = start_time;

            creator = cloneStudents[key].username;
            if (
                proStyle === "Remote" ||
                proStyle === "Co-located" ||
                proStyle === "Interactive"
            ) {
                collaborator = cloneStudents[partnerKeys[key]].username;
            } else if (proStyle !== "Individual") {
                res.send({ res_status: "Error!" });
                return;
            }

            project.creator = creator;
            project.collaborator = collaborator;
            creator = await User.findOne({ username: creator });

            let isCreatePro = false;
            if (creator != null) {
                if (
                    proStyle === "Remote" ||
                    proStyle === "Co-located" ||
                    proStyle === "Interactive"
                ) {
                    collaborator = await User.findOne({ username: collaborator });

                    if (collaborator != null) {
                        project = await project.save();
                        await Project.updateOne(
                            {
                                _id: project._id,
                            },
                            {
                                $set: {
                                    creator_id: creator._id,
                                    collaborator_id: collaborator._id,
                                    assignment_id: assignment_id,
                                },
                            },
                            (err) => {
                                if (err) throw err;
                            }
                        );

                        // timeoutHandles.push(project._id)

                        // Insert score records
                        const uids = [creator._id, collaborator._id];
                        uids.forEach(function (uid) {
                            const scoreModel = {
                                pid: project.pid,
                                uid: uid,
                                score: 0,
                                time: 0,
                                lines_of_code: 0,
                                error_count: 0,
                                createdAt: Date.now(),
                            };
                            new Score(scoreModel).save();
                        });
                        isCreatePro = true;
                    } else {
                        console.log("error", "Can't find @" + collaborator);
                    }
                } else if (proStyle === "Individual") {
                    project = await project.save();
                    await Project.updateOne(
                        {
                            _id: project._id,
                        },
                        {
                            $set: {
                                creator_id: creator._id,
                                collaborator_id: collaborator,
                                assignment_id: assignment_id,
                            },
                        },
                        (err) => {
                            if (err) throw err;
                        }
                    );
                    console.log("Update Project Successfully!");

                    // timeoutHandles.push(project._id)

                    /**
                     * Insert score records
                     */
                    const scoreModel = {
                        pid: project.pid,
                        uid: creator._id,
                        score: 0,
                        time: 0,
                        lines_of_code: 0,
                        error_count: 0,
                        createdAt: Date.now(),
                    };
                    new Score(scoreModel).save();
                    isCreatePro = true;
                }
            } else {
                console.log("error", "Can't find @" + creator);
            }

            if (isCreatePro) {
                //create directory
                var dir1 = "./public/project_files";
                var dir2 = "./public/project_files/" + project.pid;
                if (!fs.existsSync(dir1)) {
                    fs.mkdirSync(dir1);
                }
                if (!fs.existsSync(dir2)) {
                    fs.mkdirSync(dir2);
                }
                fs.open(
                    "./public/project_files/" + project.pid + "/main.py",
                    "w",
                    function (err, file) {
                        if (err) throw err;
                        console.log("file " + project.pid + ".py is created");
                    }
                );
            }
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

    if (!count) {
        res.send({ res_status: "You already assigned these assignments!" });
    } else {
        res.send({ res_status: "Successfully assigned this assignment!" });
    }
};

exports.createPairingRecord = async (req, res) => {
    const partnerKeys = JSON.parse(req.body.partnerKeys);
    const pairingObjectives = JSON.parse(req.body.pairingObjectives);
    const sectionId = parseInt(cryptr.decrypt(req.body.sectionId));
    let status = "Confirm completed.";
    let count = 0;
    let pairingRecords = [];
    let queryEnrollment = null;

    /**
     * if there aren't student pairing, server will send message which 'Please, pair all student!'
     */
    for (key in partnerKeys) {
        if (partnerKeys[key] < 0) {
            status = "Please pair all students!";
            res.send({ status: status });
        }
        count++;
    }

    /**
     * if there aren't student in classroom, server will send message which 'There aren't student in classroom!'
     */
    if (!count) {
        status = "There is no student in the classroom!";
        res.send({ status: status });
    }

    /**
     * create date time at this moment
     */
    let dateTime = new Date();
    let strDateTime = dateTime.toString();
    let splitDateTime = strDateTime.split(" ");
    let sliceDateTime = splitDateTime.slice(1, 5);
    let month = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
    };
    let numMonth = month[sliceDateTime[0]];
    numMonth === undefined ? (numMonth = "13") : null;
    let date =
        sliceDateTime[2] +
        "-" +
        numMonth +
        "-" +
        sliceDateTime[1] +
        " " +
        sliceDateTime[3];

    const insertPairingSession =
        "INSERT INTO pairing_session (section_id, time_start, status) VALUES ?";
    const values = [[sectionId, date, 1]];
    const pairingSessionId = await conMysql.insertPairingSession(
        insertPairingSession,
        values
    );

    if (typeof pairingSessionId == "number") {
        count = 0;
        for (key in partnerKeys) {
            queryEnrollment =
                "UPDATE enrollment SET partner_id = " +
                partnerKeys[key] +
                " WHERE enrollment_id = " +
                key;
            status = await conMysql.updateEnrollment(queryEnrollment);

            if (status == "Update failed.") {
                res.send({ status: status });
                return;
            } else {
                pairingRecords[count] = [
                    parseInt(key),
                    parseInt(pairingSessionId),
                    partnerKeys[key],
                    pairingObjectives[key],
                    "host",
                ];
                count++;

                queryEnrollment =
                    "UPDATE enrollment SET partner_id = " +
                    key +
                    " WHERE enrollment_id = " +
                    partnerKeys[key];
                status = await conMysql.updateEnrollment(queryEnrollment);

                if (status == "Update failed.") {
                    res.send({ status: status });
                } else {
                    pairingRecords[count] = [
                        partnerKeys[key],
                        parseInt(pairingSessionId),
                        parseInt(key),
                        pairingObjectives[partnerKeys[key]],
                        "partner",
                    ];
                    count++;
                }
            }
        }

        const insertPairingRecord =
            "INSERT INTO pairing_record (enrollment_id, pairing_session_id, partner_id, pairing_objective, role) VALUES ?";
        status = await conMysql.insertPairingRecord(
            insertPairingRecord,
            pairingRecords
        );

        let queryPairingSession = null;
        if (status == "Create completed.") {
            queryPairingSession =
                "UPDATE pairing_session SET status = 1 WHERE pairing_session_id = " +
                pairingSessionId;
            status = await conMysql.updatePairingSession(queryPairingSession);
        }

        queryPairingSession =
            "SELECT * FROM pairing_session AS ps WHERE ps.section_id = " +
            sectionId +
            " ORDER BY ps.pairing_session_id DESC";
        let pairingSessions = await conMysql.selectPairingSession(
            queryPairingSession
        );

        let queryAssignment =
            "SELECT * FROM assignment WHERE section_id = " + sectionId;
        assignments = await conMysql.selectAssignment(queryAssignment);

        let weeks = [];
        if (!assignments.length) {
            assignments = [];
        } else if (assignments.length) {
            for (let index in assignments) {
                assignments[index].assignment_id = cryptr.encrypt(
                    assignments[index].assignment_id
                );
                assignments[index].section_id = cryptr.encrypt(
                    assignments[index].section_id
                );
                assignments[index].title = assignments[index].title;

                assignments[index].description = assignments[index].description;

                weeks.indexOf(assignments[index].week) == -1
                    ? weeks.push(assignments[index].week)
                    : null;
            }
        }

        weeks = sortNumber(weeks);

        let weeklyDatas = {
            assignments: JSON.stringify(assignments),
            username: req.user.info.username,
            img: req.user.img,
            weeks: weeks,
        };

        res.send({
            status: status,
            pairingSessions: JSON.stringify(pairingSessions),
            sectionId: cryptr.encrypt(sectionId),
            weeklyDatas: JSON.stringify(weeklyDatas),
        });
    } else {
        res.send({ status: "Update failed." });
    }
};