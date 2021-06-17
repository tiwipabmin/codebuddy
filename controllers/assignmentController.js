const conMysql = require("../mySql");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");

exports.getAssignment = async (req, res) => {
  const section_id = req.params.section_id;
  const originalUrl = req.originalUrl;

  let perform;
  if (checkUrl(originalUrl, "view")) {
    perform = "view";
  }

  const select_assignment_by_assignment_id =
    "SELECT * FROM assignment WHERE assignment_id = " +
    cryptr.decrypt(req.params.assignment_id);
  let assignment = await conMysql.selectAssignment(
    select_assignment_by_assignment_id
  );
  let title = "Assignment";
  let dataSets = {};
  let section = {};
  section.section_id = section_id;

  if (assignment.length) {
    assignment = assignment[0];
    assignment.section_id = section_id;
    assignment.assignment_id = cryptr.encrypt(assignment.assignment_id);
    title = assignment.title;
    assignment.title = assignment.title;
    assignment.week = assignment.week;
    assignment.description = assignment.description;
    assignment.input_specification = assignment.input_specification;
    assignment.output_specification = assignment.output_specification;
    assignment.sample_input = assignment.sample_input;
    assignment.sample_output = assignment.sample_output;
  }
  dataSets = {
    origins: { perform: perform, assignment: assignment, section: section },
    reforms: { assignment: JSON.stringify(assignment) },
  };
  res.render("assignment", { dataSets, title: title });
};

exports.getAssignmentForm = async (req, res) => {
  const section_id = req.params.section_id;
  const originalUrl = req.originalUrl;

  let perform;
  if (checkUrl(originalUrl, "getform")) {
    perform = "getform";
  }

  let section = {};
  section.section_id = section_id;

  dataSets = {
    origins: { perform: perform, section: section },
  };

  console.log(dataSets);

  res.render("assignment", { dataSets, title: `Assignment Form` });
};

exports.createAssignment = async (req, res) => {
  let sectionId = parseInt(cryptr.decrypt(req.body.sectionId));
  let dataSets = {};
  let section = {};
  section.section_id = cryptr.encrypt(sectionId);
  let allInfo = JSON.parse(req.body.allInfo);
  let title = allInfo.title;
  let week = parseInt(allInfo.week);
  let description = allInfo.description;
  let input_specification = allInfo.input_specification;
  let output_specification = allInfo.output_specification;
  let sample_input = allInfo.sample_input;
  let sample_output = allInfo.sample_output;
  let programming_style = req.body.programming_style;

  dataSets = {
    description: description,
    input_specification: input_specification,
    output_specification: output_specification,
    sample_input: sample_input,
    sample_output: sample_output,
  };

  console.log("Data Sets 1, ", dataSets);

  for (let key in dataSets) {
    if (key === "description") {
      for (let index in dataSets[key]) {
        dataSets[key][index] = dataSets[key][index].replace(/ /g, "&nbsp;");
      }
    } else {
      for (let i in dataSets[key]) {
        let block = dataSets[key][i];
        for (let j in block) {
          dataSets[key][i][j] = block[j].replace(/ /g, "&nbsp;");
        }
      }
    }
  }

  // console.log('Data Sets 2, ', dataSets)

  for (let key in dataSets) {
    if (key === "description") {
      let joinData = dataSets[key].join("<br>");
      dataSets[key] = joinData;
    } else {
      for (let index in dataSets[key]) {
        let data = dataSets[key][index];
        let joinData = data.join("<br>");
        let block = joinData;
        dataSets[key][index] = block;
      }
    }
  }

  // console.log('Data Sets 3, ', dataSets)

  const insertAssignment =
    "INSERT INTO assignment (section_id, title, description, input_specification, output_specification, sample_input, sample_output, programming_style, week) VALUES ?";
  const values = [
    [
      sectionId,
      title,
      dataSets.description,
      JSON.stringify(dataSets.input_specification),
      JSON.stringify(dataSets.output_specification),
      JSON.stringify(dataSets.sample_input),
      JSON.stringify(dataSets.sample_output),
      programming_style,
      week,
    ],
  ];

  await conMysql.insertAssignment(insertAssignment, values).then((data) => {
    if (typeof data === "number") {
      const enAssignmentId = cryptr.encrypt(data);
      res.redirect(
        `/assignment/view/${enAssignmentId}/section/${section.section_id}`
      );
    } else {
      res.redirect(`/assignment/getform/section/${section.section_id}`);
    }
    // console.log('Data, ', data)
  });

  // const queryEnrollment = `select * from enrollment as en join student as st` +
  //   ` on st.student_id = en.student_id where en.section_id = ${sectionId}`
  // const resEnrollments = await conMysql.selectEnrollment(queryEnrollment)

  // const receivers = [{ username: req.user.username, status: `interacted` }]
  // for (let index in resEnrollments) {
  //   receivers.push({username: resEnrollments[index].username, status: `no interact`})
  // }

  /**
   * Create assignment notification
   */
  // let notifications = new Notification()
  // notifications.receiver = receivers
  // notifications.link = `/assignment/${enAssignmentId}/section/${section.section_id}`
  // notifications.head = `Assignment: ${title}`
  // notifications.content = `${dataSets.description}`
  // notifications.status = `pending`
  // notifications.type = `assignment`
  // notifications.createdBy = req.user.username
  // notifications.info = { assignmentId: enAssignmentId }
  // notifications = await notifications.save();

  // if (typeof assignment_id === "number") {
  //   res.redirect(`/assignment/view/${enAssignmentId}/section/${section.section_id}`);
  // } else {
  //   res.redirect(`/assignment/getform/section/${section.section_id}`);
  //   // res.redirect(`/classroom/section/${section.section_id}`);
  // }
};

exports.updateAssignment = async (req, res) => {
  const assignmentId = cryptr.decrypt(req.body.assignmentId);
  const sectionId = parseInt(cryptr.decrypt(req.body.sectionId));
  const allInfo = JSON.parse(req.body.allInfo);

  let field = ``;
  let count = 0;
  for (let key in allInfo) {
    if (count !== 0) {
      field += `, `;
    }

    if (key === "week") {
      field += key + " = " + parseInt(allInfo[key]);
    } else {
      if (
        key === "input_specification" ||
        key === "output_specification" ||
        key === "sample_input" ||
        key === "sample_output"
      ) {
        field += key + " = " + JSON.stringify(JSON.stringify(allInfo[key]));
      } else {
        field += key + " = '" + allInfo[key] + "'";
      }
    }

    count++;
  }

  const updateAssignment =
    "UPDATE assignment SET " + field + " WHERE assignment_id = " + assignmentId;
  await conMysql.updateAssignment(updateAssignment).then((data) => {
    console.log(`Update Assignment Status: ${data}`);
  });

  res.redirect(
    "/assignment/view/" +
    cryptr.encrypt(assignmentId) +
    "/section/" +
    cryptr.encrypt(sectionId)
  );
};

exports.deleteAssignment = async (req, res) => {
  let assignment_is_selected = req.body.assignment_is_selected;
  let max_length = assignment_is_selected.length;
  let count = 0;
  for (_index in assignment_is_selected) {
    let deleteAssignment =
      "DELETE FROM assignment WHERE assignment_id = " +
      cryptr.decrypt(assignment_is_selected[_index].assignment_id);
    let res_status = await conMysql.deleteAssignment(deleteAssignment);

    if (res_status === "delete this assignment complete.") {
      count++;
    }
  }

  if (count === max_length) {
    let section_id = cryptr.decrypt(assignment_is_selected[0].section_id);
    let select_pairing_session_by_section_id =
      "SELECT * FROM pairing_session AS ps WHERE ps.section_id = " +
      section_id +
      " ORDER BY ps.pairing_session_id DESC";
    let pairingSessions = await conMysql.selectPairingSession(
      select_pairing_session_by_section_id
    );

    let select_assignment_by_section_id =
      "SELECT * FROM assignment WHERE section_id = " + section_id;
    let assignments = await conMysql.selectAssignment(
      select_assignment_by_section_id
    );

    let weeks = [];
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

    !pairingSessions.length
      ? (pairingSessions = [{ pairing_session_id: -1, status: -1 }])
      : (pairingSessions = pairingSessions[0]);

    dataSets = {
      origins: {
        status: "Delete all of these assignment successfully.",
        username: req.user.username,
        img: req.user.img,
        weeks: weeks,
        pairing_session_id: pairingSessions.pairing_session_id,
      },
      reforms: { assignments: JSON.stringify(assignments) },
    };
    res.send({ dataSets: dataSets });
    return;
  }
  res.send({
    dataSets: { origins: { status: "Found error while is be processing!" } },
  });
};

function checkUrl(url, search) {
  if (url.indexOf(search)) {
    return 1;
  }
  return 0;
}