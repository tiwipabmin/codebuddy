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

exports.getLobby = async (req, res) => {
    let occupation = req.user.info.occupation;
    let querySection = "SELECT * FROM section WHERE class_code = 'xxxxxxxxx'";
    let sections = [];
    if (occupation == "teacher") {
        occupation = 0;
        querySection =
            "SELECT * FROM section AS s JOIN course AS c ON s.course_id = " +
            "\
      c.course_id JOIN teacher AS t ON c.teacher_id = t.teacher_id AND t.email = '" +
            req.user.email +
            "'";
        sections = await conMysql.selectSection(querySection);
    } else {
        occupation = 1;
        querySection =
            "SELECT * FROM course AS c JOIN section AS s ON c.course_id = " +
            "\
      s.course_id JOIN enrollment AS e ON s.section_id = e.section_id JOIN student AS st ON e.student_id = st.student_id AND st.email = '" +
            req.user.email +
            "'";
        sections = await conMysql.selectSection(querySection);
    }
    const secObjects = {}; // section_id store
    for (let index in sections) {
        sections[index].section_id = cryptr.encrypt(sections[index].section_id);
        Object.assign(secObjects, {
            [sections[index].course_name + sections[index].section]: sections[index]
                .section_id,
        });
    }
    if (!sections.length) sections = [];
    let dataSets = {
        origins: {
            occupation: occupation,
            sections: sections,
            dataService: "dataService",
        },
        reforms: {
            secObjects: JSON.stringify(secObjects),
        },
    };
    res.render("lobby", { dataSets, title: "Lobby" });
};

exports.getProgress = async (req, res) => {
    const username = req.query.username;
    const pid = JSON.parse(req.query.pid);
    let data = {};
    let projectTitles = [];
    let projectTimes = [];
    let projectScores = [];
    let linesOfCodes = [];
    let productivitys = [];
    let errors = [];
    let enters = [];
    let pairings = [];

    const user = await User.findOne({
        username: username,
    });
    const scores = await Score.find({
        uid: user._id,
        pid: { $in: pid },
    });

    for (var i = 0; i < scores.length; i++) {
        // project title (label)
        project = await Project.findOne({
            pid: scores[i].pid,
        });
        projectTitles.push(project.title);

        // project time data
        projectTimes.push(scores[i].time);

        // project score data
        projectScores.push(scores[i].score);

        // lines of code data
        linesOfCodes.push(scores[i].lines_of_code);

        // productivity
        productivitys.push(
            (scores[i].lines_of_code / (scores[i].time / 3600)).toFixed(2)
        );

        // error data
        errors.push(scores[i].error_count);

        // enter data
        enters.push(scores[i].participation.enter);

        // pairing data
        pairings.push(scores[i].participation.pairing);
    }

    data["fullname"] = user.info.firstname + " " + user.info.lastname;
    data["subjectId"] = user.subjectId;
    data["username"] = user.username;
    data["user-score"] = user.avgScore;
    data["user-time"] = parseFloat(user.totalTime / 60);
    data["projectTitles"] = projectTitles;
    data["projectTimes"] = projectTimes;
    data["projectScores"] = projectScores;
    data["linesOfCodes"] = linesOfCodes;
    data["productivitys"] = productivitys;
    data["errors"] = errors;
    data["enters"] = enters;
    data["pairings"] = pairings;
    res.send(data);
};

exports.deleteSection = async (req, res) => {
    let sectionId = parseInt(cryptr.decrypt(req.body.sectionId));
    const deleteSection = "DELETE FROM section WHERE section_id = " + sectionId;
    const resStatus = await conMysql.deleteSection(deleteSection);
    dataSets = { resStatus: resStatus, sectionId: sectionId };
    res.json(dataSets).status(200);
};