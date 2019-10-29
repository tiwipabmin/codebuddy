function showNotebookAssingmentModal() {
 
  $("#confirmToCreateNotebookAssingmentBtn").attr({
    onclick: "createNotebookAssignment()"
  })

  $("#notebook-assignment-modal").modal("show");
}


function on_click_weeks_dropdown(
  id,
  assignment_set,
  username,
  img,
  pairing_session_id,
  opt
) {
  // console.log('pairing_session_id, ', pairing_session_id)
  assignment_set = assignment_set;
  let res_obj = get_items_of_week(assignment_set, 5, id);
  let assignment_of_week_ = res_obj.items_of_week;
  let pagination = res_obj.pagination;
  // console.log('assignment_of_week_, ', assignment_of_week_)

  set_item_pagination_in_first_container(
    pagination,
    assignment_of_week_,
    username,
    img,
    id,
    opt
  );

  $("#assign_button").attr(
    "onclick",
    "on_click_assign_button(" +
      JSON.stringify(JSON.stringify(assignment_of_week_)) +
      ", " +
      pairing_session_id +
      ")"
  );
  $("#delete_assignment_button").attr(
    "onclick",
    "onClickDeleteAssignment(" + JSON.stringify(assignment_of_week_) + ")"
  );
  $("div").remove("#assignment_pagination");
  if (pagination[pagination.length - 1] == 1) {
    pagination = [];
  } else if (pagination.length) {
    // $(
    //   "<div class='ui pagination menu' id='assignment_pagination'></div>"
    // ).insertAfter("#divider_in_first_container");
  }

  let item = null;

  // for (_index in pagination) {
  //   item = $(
  //     "<a class='item fc' id='page_" +
  //       pagination[_index] +
  //       "_first_container' onclick='on_click_page_number_in_first_container(" +
  //       pagination[_index] +
  //       ")'>" +
  //       pagination[_index] +
  //       "</a>"
  //   );
  //   $("#assignment_pagination").append(item);
  // }

  on_click_page_number_in_first_container(1);
}

function get_items_of_week(items, range, week) {
  week = week.split("week");
  week = parseInt(week[0]);
  let items_of_week = [];

  for (_index in items) {
    if (items[_index].week == week) {
      items_of_week.push(items[_index]);
    } else if (week < 0) {
      items_of_week.push(items[_index]);
    }
  }

  let pagination = [];
  let page = 1;
  let count = 0;
  for (_index in items_of_week) {
    items_of_week[_index].page = page;
    count++;
    if (count % range == 0 || _index == items_of_week.length - 1) {
      pagination.indexOf(page) == -1 ? pagination.push(page) : null;
      page++;
    }
  }

  return { items_of_week: items_of_week, pagination: pagination };
}

function set_item_pagination_in_first_container(
  pagination,
  items_of_week,
  username,
  img,
  week,
  opt
) {
  let item = null;
  let content = null;
  let grid = null;
  let description = null;
  $("div").remove(".active.first.container");
  $("div").remove(".items.first.container");

  $("p").remove("#no_assignment");
  if (!pagination.length)
    $("#segment_in_first_container").append(
      "<p class='text-center' id='no_assignment'>No assignment.</p>"
    );

  for (_index_p in pagination) {
    $("div").remove("#items_first_container" + pagination[_index_p]);
    $("#segment_in_first_container").append(
      "<div class='ui divided items first container' id='items_first_container" +
        pagination[_index_p] +
        "'></div>"
    );

    if (pagination[_index_p] == 1) {
      $("#items_first_container" + pagination[_index_p]).attr(
        "class",
        "ui divided items active first container"
      );
    } else if (pagination[_index_p] > 1) {
      $("#items_first_container" + pagination[_index_p]).attr(
        "style",
        "display: none"
      );
    }

    for (_index_i in items_of_week) {
      if (items_of_week[_index_i].page == pagination[_index_p]) {
        switch (opt) {
          case 0:
            let fourteen_wide_column = null;
            let two_wide_column = null;
            let checkbox = null;
            let assignment = items_of_week[_index_i];
            item = $(
              "<div class='item' id='a" + assignment.notebook_assignment_id + "'></div>"
            );
            content = $(
              "<div class='content'><b style='font-size:1.5em; padding-left:15px; padding-right:15px;'><a class='header' href='/notebookAssignment?section_id=" +
                assignment.section_id +
                "&notebook_assignment_id=" +
                assignment.notebook_assignment_id +
                "'>" +
                assignment.title +
                "</b></div>"
            );
            description = $("<div class='description'>");
            grid = $("<div class='ui grid'></div>");
            fourteen_wide_column = $(
              "<div class='fourteen wide column assignment_is_selected' onclick='on_click_assignment(1, \"" +
                assignment.notebook_assignment_id +
                "_is_selected\")'><p style='padding-left:15px; padding-right:15px;'>" +
                assignment.description +
                "</p><p style='padding-left:15px; padding-right:15px;'>Programming Style : " 
                // assignment.programming_style +
                // "</p></div>"
            );
            two_wide_column = $("<div class='two wide column'></div>");
            checkbox = $(
              "<div class='ui checkbox'><input class='checkbox_is_clicked' type='checkbox' id='" +
                assignment.notebook_assignment_id +
                "_is_selected' onclick='on_click_assignment(0, \"" +
                assignment.notebook_assignment_id +
                "_is_selected\")'/><label></label></div>"
            );
            item.append(content);
            content.append(description);
            description.append(grid);
            grid.append(fourteen_wide_column);
            grid.append(two_wide_column);
            two_wide_column.append(checkbox);
            $("#items_first_container" + pagination[_index_p]).append(item);
            break;
          default:
            let project = items_of_week[_index_i];
            let section_id = project.section_id;
            let div_a = null;
            let img1 = null;
            let img2 = null;
            let img3 = null;
            let eleven_wide_column = null;
            if (project.creator == username) {
              item = $(
                "<div class='item' style='padding-top:10px; padding-bottom:10px;'></div>"
              );
              div_a = $(
                "<a href='/project?pid=" +
                  project.pid +
                  "&user_role=creator&section_id=" +
                  section_id +
                  "' class='ui tiny image' ></a>"
              );
              img1 = $(
                "<img src='/images/blue-folder.png', style='position: absolute;'/>"
              );
              img2 = $(
                "<img class='ui avatar image' src='" +
                  img +
                  "', style='width: 30px;height: 30px;left:25px;top: 20px;'/>"
              );
              content = $("<div class='content'></div>");
              grid = $("<div class='ui grid'></div>");
              eleven_wide_column = $(
                "<div class='eleven wide column'><b style='font-size:1.2em;'><a class='header' href='/project?pid=" +
                  project.pid +
                  "&user_role=creator&section_id=" +
                  section_id +
                  "'>" +
                  project.title +
                  "</a></b></div>"
              );
              description = $(
                "<div class='description'><p>" +
                  project.description +
                  "</p><div id='" +
                  project.pid +
                  "Project' class='ui grid'><div class='ten wide column'><font id='" +
                  project.pid +
                  "TextStatus'>Last updated " +
                  moment(project.enable_time).fromNow() +
                  "</font></div></div></div>"
              );
              div_a.append(img1);
              div_a.append(img2);
              content.append(grid);
              grid.append(eleven_wide_column);
              eleven_wide_column.append(description);
              item.append(div_a);
              item.append(content);
            } else {
              item = $("<div class='item' style='padding-top:10px;'></div>");
              div_a = $(
                "<a class='ui tiny image' href='/project?pid=" +
                  project.pid +
                  "&user_role=collaborator&section_id=" +
                  section_id +
                  "'></a>"
              );
              img1 = $(
                "<img src='/images/yellow-folder.png', style='position: absolute;'/>"
              );
              img2 = $(
                "<img class='img-owner ui avatar image' src='" +
                  img +
                  "', style='width: 30px;height: 30px; top: 20px;'/>"
              );
              img3 = $(
                "<img class='img-partner ui avatar image' src='/images/user_img_4.jpg', style='width:30px; height:30px; top:-10px;'/>"
              );
              content = $(
                "<div class='content'><b style='font-size:1.2em;'><a href='/project?pid=" +
                  project.pid +
                  "&user_role=collaborator&section_id=" +
                  section_id +
                  "'>" +
                  project.title +
                  "</a></b></div>"
              );
              description = $(
                "<div class='description'><p>" +
                  project.description +
                  "</p><div id='" +
                  project.pid +
                  "Project' class='ui grid'><div class='ten wide column'><font id='" +
                  project.pid +
                  "TextStatus'>Last updated " +
                  moment(project.enable_time).fromNow() +
                  "</font></div></div></div>"
              );
              div_a.append(img1);
              div_a.append(img2);
              div_a.append(img3);
              content.append(description);
              item.append(div_a);
              item.append(content);
            }
            $("#items_first_container" + pagination[_index_p]).append(item);
        }
      }
    }
  }
}


// Aew

$(document).ready(function() {
  $("#global_loader").attr("style", "display: none");
  $("#settings-modal").modal({
    closable: false,
    transition: "fade up",
    onApprove: function() {
      //$('.ui.form').submit();
      return false;
    }
  });
  $("#assignment-modal").modal({
    closable: false,
    transition: "fade up",
    onApprove: function() {
      //$('.ui.form').submit();
      return false;
    }
  });
  $("#alert-modal").modal({
    closable: false,
    transition: "fade up"
  });
  $(".newProject").click(function() {
    $("#newProject-modal").modal("show");
  });
  $(".first_container_menu").click(function() {
    showFirstContainer();
  });
  $(".second_container_menu").click(function() {
    showSecondContainer();
  });
  $(".third_container_menu").click(function() {
    showThirdContainer();
  });
  $(".ui.form.updateSection").form({
    fields: {
      course_name: {
        identifier: "course_name",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your course name"
          }
        ]
      },
      section: {
        identifier: "section",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your section"
          },
          {
            type: "regExp[[0-9]]",
            prompt: "This section is not valid!"
          }
        ]
      },
      room: {
        identifier: "room",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your room"
          }
        ]
      }
    },
    onSuccess: function() {
      $("#newClassroom-modal").modal("hide");
    }
  });

  pairingOrViewingisHided("pair");

  $("#student_list_modal").modal({
    closable: false
  });
  $("#partner_selection_modal").modal({
    closable: false
  });
  $("#pairingSettingsModal").modal({
    closable: false
  });
  $("#back-to-student-list-modal").click(function() {
    $("#student_list_modal").modal("show");
  });
  $("#cancelAutoPairingBtn").click(function() {
    $("#student_list_modal").modal("show");
  });
  $(".tabular.menu .item").tab();
});
function showSecondContainer() {
  $("#first_container").hide();
  $("#second_container").show();
  $("#third_container").hide();
}
function showThirdContainer() {
  $("#first_container").hide();
  $("#second_container").hide();
  $("#third_container").show();
}

function onClickCreateSession(
  pairing_session_id,
  section_id,
  pairing_session_status
) {
  if ($("#newPairingSession").attr("value") <= 0) {
    pairingOrViewingisHided("pair");
    showStudentList("pair", {}, {}, pairing_session_id, section_id);
  } else {
    $("#alert-header").text("Pairing session");
    $("#alert-message").text(
      "Cannot create a new session! Please set current session to completed before create a new session."
    );
    $("#alert-modal").modal("show");
  }
}

function on_click_confirm_button(parameters) {
  const message = $("#confirm-message").attr("value");

  if (message == "Are you sure you want to create new pairing session?") {
    const session_status = $("#newPairingSession").attr("value");
    if (
      session_status <= 0 &&
      $("#confirm-pairing").attr("value") == "create"
    ) {
      $("#global_loader").attr({
        style: "display: block; position: fixed;"
      });
      $.post("/classroom/createPairingRecord", parameters, function(data) {
        const status = data.status;
        const pairingSessions = JSON.parse(data.pairingSessions);
        const sectionId = data.sectionId;
        const weeklyDatas = JSON.parse(data.weeklyDatas);
        if (status == "There is no student in the classroom!") {
          alert(status);
        } else if (status == "Please pair all students!") {
          alert(status);
          $("#student_list_modal").modal("show");
        } else if (status == "Update completed.") {
          $("#no_session").empty();
          $("#menu_week").empty();
          create_weeks_dropdown(
            "#menu_week",
            pairingSessions[0].pairing_session_id,
            weeklyDatas
          );
          $("#weeks").dropdown();
          on_click_weeks_dropdown(
            "-1week",
            JSON.parse(weeklyDatas.assignments),
            weeklyDatas.username,
            weeklyDatas.img,
            pairingSessions[0].pairing_session_id,
            0
          );
          set_item_pagination_in_third_container(
            pairingSessions,
            sectionId,
            "teacher"
          );
          on_click_page_number_in_third_container(1);
          $("#changePair").attr(
            "onclick",
            "onClickChangePairButton(" +
              pairingSessions[0].pairing_session_id +
              ', "' +
              sectionId +
              '")'
          );
          $(".ui.pointing.dropdown").dropdown();
          $("#newPairingSession").attr(
            "onclick",
            "onClickCreateSession(" +
              pairingSessions[0].pairing_session_id +
              ', "' +
              sectionId +
              '", ' +
              pairingSessions[0].status +
              ")"
          );
          $("#newPairingSession").attr("value", 1);
          $("#autoPairing").hide();
        } else {
          alert(status);
        }
        $("#global_loader").attr({
          style: "display: none; position: fixed;"
        });
      });
    } else if (
      session_status == 1 &&
      $("#confirm-pairing").attr("value") == "change"
    ) {
      $("#global_loader").attr({
        style: "display: block; position: fixed;"
      });
      $("#autoPairing").hide();
      parameters = {
        partnerKeys: JSON.parse(parameters.partner_keys),
        pairingObjectives: JSON.parse(parameters.pairing_objective),
        pairingSessionId: parameters.pairing_session_id,
        sectionId: parameters.section_id
      };
      $.ajax({
        url: "/classroom/updatePairing",
        type: "put",
        data: parameters,
        success: function(data) {
          var status = data.status;
          $("#loader").attr("style", "display: none");
          if (status == "Update pairing successfully") {
            pairingOrViewingisHided("view");
            $("#confirm-pairing").attr("value", "create");
            alert(status);
          } else if (status == "Please pair all students!") {
            alert(status);
            $("#confirm-header").text("Student pairing");
            $("#confirm-message").text(
              "Are you sure you want to cancel pairing?"
            );
            $("#confirm-message").attr(
              "value",
              "Are you sure you want to cancel pairing?"
            );
            $("#student_list_modal").modal("show");
          } else {
            $("#confirm-pairing").attr("value", "create");
            alert(status);
          }
          $("#global_loader").attr({
            style: "display: none; position: fixed;"
          });
        }
      });
    } else {
      $("#alert-header").text("Pairing session");
      $("#alert-message").text("You can't create session!");
      $("#alert-modal").modal("show");
    }
  } else if (message == "Are you sure you want to cancel pairing?") {
    $("#alphabeticalFilter").attr("class", "ui button");
    $("#alphabeticalFilter").attr("value", "A-Z");
    $("#alphabeticalFilter").text("A-Z");

    $("#avgScoreFilter").attr("class", "ui button");
    $("#avgScoreFilter").attr("value", "1-100");
    $("#avgScoreFilter").text("1-100");

    $("#activeFilter").attr("value", "");
    $("#confirm-pairing").attr("value", "create");

    $("#autoPairing").hide();
  } else if (
    message == "Are you sure you want to complete this pairing session?"
  ) {
    $("#global_loader").attr({
      style: "display: block; position: fixed;"
    });
    $.ajax({
      url: "/classroom/updatePairingSession",
      type: "put",
      data: parameters,
      success: function(data) {
        let resStatus = data.resStatus;
        let pairingSessions = JSON.parse(data.pairingSessions);
        let sectionId = data.sectionId;
        if (resStatus == "Update completed.") {
          set_item_pagination_in_third_container(
            pairingSessions,
            sectionId,
            "teacher"
          );
          on_click_page_number_in_third_container(1);
          $("#newPairingSession").attr("value", 0);
          $("#confirm-pairing").attr("value", "create");
        } else {
          alert(resStatus);
        }
        $("#global_loader").attr({
          style: "display: none; position: fixed;"
        });
      }
    });
  } else if (
    message ==
    "Are you sure you want to assign these assignments to all student pairs?"
  ) {
    $("#global_loader").attr({
      style: "display: block; position: fixed;"
    });
    $.post("/classroom/assignAssignment", parameters, function(data) {
      var res_status = data.res_status;
      if (
        res_status == "Please pair all students before assign the assignment!"
      ) {
        alert(res_status);
      } else if (res_status == "You already assigned these assignments!") {
        alert(res_status);
      } else if (res_status == "Successfully assigned this assignment!") {
        alert(res_status);
      } else if (res_status == "Completed test!") {
        alert(res_status);
      } else {
        alert(res_status);
      }
      $("#global_loader").attr({
        style: "display: none; position: fixed;"
      });
    });
  } else if (
    message ==
    "Are you sure you want to remove the student from this classroom?"
  ) {
    $("#global_loader").attr({
      style: "display: block; position: fixed;"
    });
    $.ajax({
      url: "/api/removeStudent",
      type: "delete",
      data: parameters,
      success: function(res) {
        if (
          res.resStatus == "Remove the student from the classroom completed."
        ) {
          $("#" + res.enrollment_id).remove();
          alert(res.resStatus);
        } else {
          alert(res.resStatus);
        }
        $("#global_loader").attr({
          style: "display: none; position: fixed;"
        });
      }
    });
  } else if (message == "Are you sure you want to delete these assignment?") {
    $("#global_loader").attr({
      style: "display: block; position: fixed;"
    });
    $.ajax({
      url: "/api/deleteAssignment",
      type: "delete",
      data: parameters,
      success: function(res) {
        let status = res.dataSets.origins.status;
        let assignments = JSON.parse(res.dataSets.reforms.assignments);
        let username = res.dataSets.origins.username;
        let img = res.dataSets.origins.img;
        let pairing_session_id = res.dataSets.origins.pairing_session_id;
        let opt = 0;
        let weeks = res.dataSets.origins.weeks;
        let data_for_weeks_dropdown_function = {
          assignments: JSON.stringify(assignments),
          username: username,
          img: img,
          weeks: weeks
        };
        if (status == "Delete all of these assignment successfully.") {
          $("#menu_week").empty();
          create_weeks_dropdown(
            "#menu_week",
            pairing_session_id,
            data_for_weeks_dropdown_function
          );
          $("#weeks").dropdown();
          on_click_weeks_dropdown(
            "-1week",
            assignments,
            username,
            img,
            pairing_session_id,
            opt
          );
          $("#clear_checkbox").attr(
            "onclick",
            "checkbox_event(" + JSON.stringify(assignments) + ", '-1week', 0)"
          );
          $("#check_all_of_box").attr(
            "onclick",
            "checkbox_event(" + JSON.stringify(assignments) + ", '-1week', 1)"
          );
          alert(status);
        } else {
          alert(status);
        }
        $("#global_loader").attr({
          style: "display: none; position: fixed;"
        });
      }
    });
  } else if (
    message == "Are you sure you want to disable assignments on this week?"
  ) {
    $("#global_loader").attr({
      style: "display: block; position: fixed;"
    });
    $.ajax({
      url: "/classroom/manageAssignment",
      type: "put",
      data: parameters,
      success: function(res) {
        let status = res.status;
        if (status == "Disable assignments successfully.") {
          alert(status);
        } else {
          alert(status);
        }
        $("#global_loader").attr({
          style: "display: none; position: fixed;"
        });
      }
    });
  } else if (
    message == "Are you sure you want to enable assignments on this week?"
  ) {
    $("#global_loader").attr({
      style: "display: block; position: fixed;"
    });
    $.ajax({
      url: "/classroom/manageAssignment",
      type: "put",
      data: parameters,
      success: function(res) {
        let status = res.status;
        if (status == "Enable assignments successfully.") {
          alert(status);
        } else {
          alert(status);
        }
        $("#global_loader").attr({
          style: "display: none; position: fixed;"
        });
      }
    });
  } else if (message == "Are you sure you want to start auto pairing?") {
    // console.log('parameters, ', parameters)
    if (parameters.scoreDiff !== undefined) {
      $.get("/classroom/startAutoPairingByScoreDiff", parameters, function(
        res
      ) {
        if (
          res.resStatus === "Start Auto Pairing By Score Diff Successfully!"
        ) {
          $("#confirm-header").text("Student pairing");
          $("#confirm-message").text(
            "Are you sure you want to cancel pairing?"
          );
          $("#confirm-message").attr(
            "value",
            "Are you sure you want to cancel pairing?"
          );
          $("#cancel-pairing").attr(
            "onclick",
            "on_click_cancel_pairing_button()"
          );
          showStudentList(
            "pair",
            JSON.parse(res.partnerKeys),
            JSON.parse(res.pairingObjectives),
            res.pairingSessionId,
            res.sectionId
          );
          $("#student_list_modal").modal("show");
        } else {
          alert(res.resStatus);
        }
      });
    } else {
      $.get("/classroom/startAutoPairingByPurpose", parameters, function(res) {
        // $('#confirm-header').text('Student pairing')
        // $('#confirm-message').text('Are you sure you want to cancel pairing?')
        // $('#confirm-message').attr('value', 'Are you sure you want to cancel pairing?')
        // $('#cancel-pairing').attr('onclick', 'on_click_cancel_pairing_button()')
        $("#student_list_modal").modal("show");
        alert(res.resStatus);
      });
    }
  }

  $("#confirm-message").attr("value", "Something message.");
}

function searchStudent(
  id,
  student_id,
  section_id,
  pairing_session_id,
  username,
  partner_keys,
  pairing_objective
) {
  var parameters = {
    search: $(id).val(),
    student_id: student_id,
    section_id: section_id,
    pairing_session_id: pairing_session_id,
    username: username,
    partner_keys: JSON.stringify(partner_keys),
    pairing_objective: JSON.stringify(pairing_objective)
  };
  $.get("/classroom/searchStudent", parameters, function(data) {
    const studentId = data.studentId;
    const students = data.students;
    const purpose = data.purpose;
    const sectionId = data.sectionId;
    const pairingSessionId = data.pairingSessionId;
    const partnerKeys = JSON.parse(data.partnerKeys);
    const pairingObjectives = JSON.parse(data.pairingObjectives);
    $(".user-list").empty();
    if (students.length > 0) {
      students.forEach(function(student) {
        if (pairingObjectives[student.enrollment_id] == -1) {
          $(".user-list").append(
            "<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton(" +
              studentId +
              "," +
              student.enrollment_id +
              ',"' +
              purpose +
              '","' +
              sectionId +
              '",' +
              pairingSessionId +
              ", " +
              JSON.stringify(partnerKeys) +
              ", " +
              JSON.stringify(pairingObjectives) +
              ",2)'>Add</div></div><img class='ui avatar image' src='" +
              student.img +
              "'><div class='content'><div class='header'>" +
              student.first_name +
              " " +
              student.last_name +
              "</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score " +
              parseFloat(student.avg_score).toFixed(2) +
              "</a><a class='ui green label'> Available </a></div><div style='font-size: 12px;'>total active time: " +
              pad(parseInt(student.total_time / 3600)) +
              ":" +
              pad(
                parseInt(
                  (student.total_time -
                    parseInt(student.total_time / 3600) * 3600) /
                    60
                )
              ) +
              ":" +
              pad(parseInt(student.total_time % 60)) +
              "</div></div></div></div>"
          );
        } else {
          $(".user-list").append(
            "<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton(" +
              studentId +
              "," +
              student.enrollment_id +
              ',"' +
              purpose +
              '","' +
              sectionId +
              '",' +
              pairingSessionId +
              ", " +
              JSON.stringify(partnerKeys) +
              ", " +
              JSON.stringify(pairingObjectives) +
              ",2)'>Add</div></div><img class='ui avatar image' src='" +
              student.img +
              "'><div class='content'><div class='header'>" +
              student.first_name +
              " " +
              student.last_name +
              "</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score " +
              parseFloat(student.avg_score).toFixed(2) +
              "</a><a class='ui red label'> Paired </a></div><div style='font-size: 12px;'>total active time: " +
              pad(parseInt(student.total_time / 3600)) +
              ":" +
              pad(
                parseInt(
                  (student.total_time -
                    parseInt(student.total_time / 3600) * 3600) /
                    60
                )
              ) +
              ":" +
              pad(parseInt(student.total_time % 60)) +
              "</div></div></div></div>"
          );
        }
      }, this);
    } else {
      $(".user-list").append("<li class='ui item'>No results</li>");
    }
  });
}

function onClickAddPartnerButton(
  first_param,
  second_param,
  third_param,
  section_id,
  pairing_session_id,
  partner_keys,
  pairing_objective,
  opt
) {
  switch (opt) {
    case 1:
      let enrollment_id = first_param;
      let username = third_param;
      let avg_score = second_param;

      $("#ui-purpose-0").attr(
        "onclick",
        "on_click_ui_purpose_tab(" +
          $(".ui-purpose").index($("#ui-purpose-0")) +
          ', "' +
          $("#ui-purpose-0").data("purpose") +
          '", ' +
          enrollment_id +
          ", " +
          pairing_session_id +
          ', "' +
          username +
          '", ' +
          avg_score +
          ', "' +
          section_id +
          '", ' +
          JSON.stringify(partner_keys) +
          ", " +
          JSON.stringify(pairing_objective) +
          ")"
      );
      $("#ui-purpose-1").attr(
        "onclick",
        "on_click_ui_purpose_tab(" +
          $(".ui-purpose").index($("#ui-purpose-1")) +
          ', "' +
          $("#ui-purpose-1").data("purpose") +
          '", ' +
          enrollment_id +
          ", " +
          pairing_session_id +
          ', "' +
          username +
          '", ' +
          avg_score +
          ', "' +
          section_id +
          '", ' +
          JSON.stringify(partner_keys) +
          ", " +
          JSON.stringify(pairing_objective) +
          ")"
      );
      $("#ui-purpose-2").attr(
        "onclick",
        "on_click_ui_purpose_tab(" +
          $(".ui-purpose").index($("#ui-purpose-2")) +
          ', "' +
          $("#ui-purpose-2").data("purpose") +
          '", ' +
          enrollment_id +
          ", " +
          pairing_session_id +
          ', "' +
          username +
          '", ' +
          avg_score +
          ', "' +
          section_id +
          '", ' +
          JSON.stringify(partner_keys) +
          ", " +
          JSON.stringify(pairing_objective) +
          ")"
      );
      $("#search-user-by-input").attr(
        "onkeyup",
        'searchStudent("#search-user-by-input", ' +
          enrollment_id +
          ', "' +
          section_id +
          '", ' +
          pairing_session_id +
          ', "' +
          username +
          '", ' +
          JSON.stringify(partner_keys) +
          ", " +
          JSON.stringify(pairing_objective) +
          ")"
      );
      //make user list is empty on search user panel
      $(".user-list").empty();
      $(".user-list").append("<div class='li ui item'>Search result</div>");

      $(".student-score").text(
        "Student score " + parseFloat(avg_score).toFixed(2)
      );
      $(".user-purpose-list").empty();
      $(".user-purpose-list").append(
        "<li class='ui item'>Please select your purpose.</li>"
      );
      $("#partner_selection_modal").modal("show");
      break;
    case 2:
      let student_id = first_param;
      let partner_id = second_param;
      let purpose = third_param;

      let key;
      let addSamePartner = false;

      // partner_id is value in partner_keys
      // ex. partner_keys = {0: 1, 2: 3} expected {0: -1, 2: 1, 3: -1}
      // pair student_id = 2 with partner_id = 1 will make undefined
      if (partner_keys[partner_id] === undefined) {
        key = Object.keys(partner_keys).find(
          key => partner_keys[key] === partner_id
        );
        if (key == student_id) {
          addSamePartner = true;
        }
      } else {
        key = partner_keys[partner_id];
      }

      if (partner_keys[student_id] < 0 && pairing_objective[partner_id] != -1) {
        partner_keys[key] = -1;
        pairing_objective[key] = -1;
      } else if (partner_keys[student_id] > 0 && !addSamePartner) {
        if (pairing_objective[partner_id] == -1) {
          partner_keys[partner_keys[student_id]] = -1;
          pairing_objective[partner_keys[student_id]] = -1;
        } else {
          partner_keys[key] = -1;
          pairing_objective[key] = -1;

          partner_keys[partner_keys[student_id]] = -1;
          pairing_objective[partner_keys[student_id]] = -1;
        }
      }
      //add new partner to student
      partner_keys[student_id] = partner_id;
      delete partner_keys[partner_id];

      pairing_objective[student_id] = purpose;
      pairing_objective[partner_id] = purpose;
      $("#confirm-header").text("Student pairing");
      $("#confirm-message").text("Are you sure you want to cancel pairing?");
      $("#confirm-message").attr(
        "value",
        "Are you sure you want to cancel pairing?"
      );
      $("#cancel-pairing").attr("onclick", "on_click_cancel_pairing_button()");
      showStudentList(
        "pair",
        partner_keys,
        pairing_objective,
        pairing_session_id,
        section_id
      );
      break;
  }
}

function showStudentList(
  command,
  partnerKeys,
  pairingObjectives,
  pairingSessionId,
  sectionId
) {
  let parameter = {
    partnerKeys: JSON.stringify(partnerKeys),
    pairingObjectives: JSON.stringify(pairingObjectives),
    sectionId: sectionId,
    pairingSessionId: pairingSessionId,
    command: command
  };
  $.get("/classroom/getStudentsFromSection", parameter, function(data) {
    let count = 0;
    const students = data.students;
    const partnerKeys = data.partnerKeys;
    const pairingObjectives = data.pairingObjectives;
    const pairingSessionStatus = data.pairingSessionStatus;
    const command = data.command;
    let addPartnerButton = "";

    let filtered = false;
    let elementMoved = false;

    if (command == "pair") {
      if (pairingSessionStatus == 1) {
        $("#changePair").show();
      } else {
        $("#changePair").hide();
        $("#autoPairing").show();
      }
    } else if (command == "view") {
      if (pairingSessionStatus == 1) {
        $("#changePair").show();
      } else {
        $("#changePair").hide();
      }
    }

    $(".student-container").empty();
    for (key in partnerKeys) {
      if (partnerKeys[key] < 0) {
        $(".student-container").append(
          "<li id='" +
            key +
            "' class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='" +
            students[key].img +
            "'></img><div class='content'><div class='header'>" +
            students[key].username +
            " " +
            students[key].last_name +
            "</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score " +
            parseFloat(students[key].avg_score).toFixed(2) +
            "</a></div><div style='font-size: 12px;'>total active time: " +
            pad(parseInt(students[key].total_time / 3600)) +
            ":" +
            pad(
              parseInt(
                (students[key].total_time -
                  parseInt(students[key].total_time / 3600) * 3600) /
                  60
              )
            ) +
            ":" +
            pad(parseInt(students[key].total_time % 60)) +
            "</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='images/user_img_0.jpg' style='visibility:hidden;'></img><div class='content'><div class='right floated content'><div class='ui button add-user-button' style='margin-top: 22px;' onclick='onClickAddPartnerButton(" +
            students[key].enrollment_id +
            "," +
            students[key].avg_score +
            ',"' +
            students[key].username.toString() +
            '","' +
            sectionId +
            '",' +
            pairingSessionId +
            ", " +
            JSON.stringify(partnerKeys) +
            ", " +
            JSON.stringify(pairingObjectives) +
            ", 1)'>Add</div></div><div class='description'><div style='font-size: 12px; visibility:hidden;'>total active time: " +
            pad(parseInt(0 / 3600)) +
            ":" +
            pad(parseInt((0 - parseInt(0 / 3600) * 3600) / 60)) +
            ":" +
            pad(parseInt(0 % 60)) +
            "</div><font color='#5D5D5D'> Empty </font><div class='ui circular labels' style='margin-top:2.5px; visibility:hidden;'><a class='ui teal label'> score " +
            parseFloat(0).toFixed(2) +
            "</a></div></div></div></div></div></div></div><div class='ui vertical divider'> - </div></li>"
        );
      } else {
        if (command == "pair") {
          addPartnerButton =
            "<div class='ui button add-user-button' style='margin-top: 22px;' onclick='onClickAddPartnerButton(" +
            students[key].enrollment_id +
            "," +
            students[key].avg_score +
            ',"' +
            students[key].username.toString() +
            '","' +
            sectionId +
            '",' +
            pairingSessionId +
            ", " +
            JSON.stringify(partnerKeys) +
            ", " +
            JSON.stringify(pairingObjectives) +
            ",1)'>Add</div>";
        }
        let pairing_objective_str = pairingObjectives[key];
        if (
          pairing_objective_str == "quality" ||
          pairing_objective_str == "expertWithExpert"
        ) {
          pairing_objective_str = "<i class='line chart icon'></i>";
        } else if (
          pairing_objective_str == "experience" ||
          pairing_objective_str == "noviceWithNovice"
        ) {
          pairing_objective_str = "<i class='line idea icon'></i>";
        } else if (
          pairing_objective_str == "train" ||
          pairing_objective_str == "expertWithNovice"
        ) {
          pairing_objective_str = "<i class='line student icon'></i>";
        } else if (pairing_objective_str == "scoreDiff") {
          pairing_objective_str = "<i class='superscript icon'></i>";
        } else {
          pairing_objective_str = "<i class='search icon'></i>";
        }

        $(".student-container").append(
          "<li id='" +
            key +
            "' class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='" +
            students[key].img +
            "'></img><div class='content'><div class='header'>" +
            students[key].username +
            " " +
            students[key].last_name +
            "</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score " +
            parseFloat(students[key].avg_score).toFixed(2) +
            "</a></div><div style='font-size: 12px;'>total active time: " +
            pad(parseInt(students[key].total_time / 3600)) +
            ":" +
            pad(
              parseInt(
                (students[key].total_time -
                  parseInt(students[key].total_time / 3600) * 3600) /
                  60
              )
            ) +
            ":" +
            pad(parseInt(students[key].total_time % 60)) +
            "</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='" +
            students[partnerKeys[key]].img +
            "'></img><div class='content'><div class='right floated content'>" +
            addPartnerButton +
            "</div><div class='header'>" +
            students[partnerKeys[key]].first_name +
            " " +
            students[partnerKeys[key]].last_name +
            "</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'> score " +
            parseFloat(students[partnerKeys[key]].avg_score).toFixed(2) +
            "</a></div><div style='font-size: 12px;'>total active time: " +
            pad(parseInt(students[partnerKeys[key]].total_time / 3600)) +
            ":" +
            pad(
              parseInt(
                (students[partnerKeys[key]].total_time -
                  parseInt(students[partnerKeys[key]].total_time / 3600) *
                    3600) /
                  60
              )
            ) +
            ":" +
            pad(parseInt(students[partnerKeys[key]].total_time % 60)) +
            "</div></div></div></div></div></div></div><div class='ui vertical divider'> " +
            pairing_objective_str +
            " </div></li>"
        );
      }
      count++;
    }
    if (!count) {
      $(".student-container").append(
        "<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><font>No student.</font></div><div class='column'><font>No student.</font></div></div><div class='ui vertical divider'> - </div></div>"
      );
    } else {
      parameters = {
        pairingSessionId: pairingSessionId,
        sectionId: sectionId,
        partnerKeys: JSON.stringify(partnerKeys),
        pairingObjectives: JSON.stringify(pairingObjectives)
      };
      $("#confirm-pairing").attr(
        "onclick",
        "on_click_confirm_pairing_button(" + JSON.stringify(parameters) + ")"
      );
      $("#alphabeticalFilter").attr(
        "onclick",
        "onClickAlphabeticalFilterButton(" + JSON.stringify(students) + ")"
      );
      $("#avgScoreFilter").attr(
        "onclick",
        "onClickAvgScoreFilterButton(" + JSON.stringify(students) + ")"
      );

      let activeFilter = $("#activeFilter").attr("value");
      if (activeFilter == "A-Z") {
        sortAtoZ(students, filtered, elementMoved);
      } else if (activeFilter == "Z-A") {
        sortZtoA(students, filtered, elementMoved);
      } else if (activeFilter == "1-100") {
        sort1to100(students, filtered, elementMoved);
      } else if (activeFilter == "100-1") {
        sort100to1(students, filtered, elementMoved);
      }
    }
    $("#student_list_modal").modal("show");
  });
}


function on_click_page_number_in_second_container(page) {
  $(".active.item.sc").attr({
    class: "item sc"
  });
  $("#page_" + page + "_second_container").attr({
    class: "active item sc"
  });

  $(".active.second.container").attr({
    class: "ui middle aligned divided list second container",
    style: "display: none"
  });
  $("#items_second_container" + page).attr({
    class: "ui middle aligned divided list active second container",
    style: "display: block"
  });
}

function set_item_pagination_in_second_container(
  students,
  section_id,
  occupation
) {
  let res_obj = get_items_of_week(students, 10, "-1week");
  students = res_obj.items_of_week;
  let pagination = res_obj.pagination;

  let item = null;
  let student = null;
  let content = null;
  let img = null;

  for (_index_p in pagination) {
    $("div").remove("#items_second_container" + pagination[_index_p]);
    $("#segment_in_second_container").append(
      "<div class='ui middle aligned divided list second container' id='items_second_container" +
        pagination[_index_p] +
        "'></div>"
    );

    if (pagination[_index_p] == 1) {
      $("#items_second_container" + pagination[_index_p]).attr(
        "class",
        "ui middle aligned divided list active second container"
      );
    } else if (pagination[_index_p] > 1) {
      $("#items_second_container" + pagination[_index_p]).attr(
        "style",
        "display: none"
      );
    }

    for (_index_s in students) {
      if (students[_index_s].page == pagination[_index_p]) {
        student = students[_index_s];
        item = $(
          "<div class='item' id='" +
            student.enrollment_id +
            "' style='padding-left:15px; padding-right:15px;'></div>"
        );
        img = $("<img class='ui avatar image' src='images/user_img_0.jpg'/>");
        switch (occupation) {
          case "teacher":
            let right_floated_content = null;
            let tag_a = null;
            right_floated_content = $(
              "<div class='right floated content'></div>"
            );
            tag_a = $(
              "<a class='ui right floated aligedvertical animated button red' onclick='on_click_remove_student_button(" +
                student.enrollment_id +
                ',"' +
                student.first_name +
                '","' +
                student.last_name +
                "\")'><div class='hidden content' style='color:white'> Remove </div><div class='visible content'><i class='sign out icon'/></div></a>"
            );
            content = $(
              "<div class='content'><a href='/profile?section_id=" +
                section_id +
                "&username=" +
                student.username +
                "'><p> " +
                student.first_name +
                " " +
                student.last_name +
                " </p></a></div>"
            );
            right_floated_content.append(tag_a);
            item.append(right_floated_content);
            item.append(img);
            item.append(content);

            break;
          default:
            content = $(
              "<div class='content'><p> " +
                student.first_name +
                " " +
                student.last_name +
                " </p></div>"
            );
            item.append(img);
            item.append(content);
        }
        $("#items_second_container" + pagination[_index_p]).append(item);
      }
    }
  }

  $("div").remove("#student_pagination");
  if (pagination[pagination.length - 1] == 1) {
    pagination = [];
  } else {
    $(
      "<div class='ui pagination menu' id='student_pagination'></div>"
    ).insertAfter("#ui_two_column_in_second_container");
  }

  item = null;
  for (_index in pagination) {
    item = $(
      "<a class='item sc' id='page_" +
        pagination[_index] +
        "_second_container' onclick='on_click_page_number_in_second_container(" +
        pagination[_index] +
        ")'>" +
        pagination[_index] +
        "</a>"
    );
    $("#student_pagination").append(item);
  }
}
