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
  collaborative_session_id,
  opt
) {
  console.log('collaborative_session_id, ', collaborative_session_id)
  assignment_set = assignment_set;
  let res_obj = get_items_of_week(assignment_set, 5, id);
  let assignment_of_week_ = res_obj.items_of_week;
  let pagination = res_obj.pagination;

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
      collaborative_session_id +
      ")"
  );
  // $("#delete_assignment_button").attr(
  //   "onclick",
  //   "onClickDeleteAssignment(" + JSON.stringify(assignment_of_week_) + ")"
  // );
  $("div").remove("#assignment_pagination");
  if (pagination[pagination.length - 1] == 1) {
    pagination = [];
  } else if (pagination.length) {
    $(
      "<div class='ui pagination menu' id='assignment_pagination'></div>"
    ).insertAfter("#divider_in_first_container");
  }

  let item = null;

  for (_index in pagination) {
    item = $(
      "<a class='item fc' id='page_" +
        pagination[_index] +
        "_first_container' onclick='on_click_page_number_in_first_container(" +
        pagination[_index] +
        ")'>" +
        pagination[_index] +
        "</a>"
    );
    $("#assignment_pagination").append(item);
  }

  on_click_page_number_in_first_container(1);
}
function on_click_page_number_in_first_container(page) {
  $(".active.item.fc").attr({
    class: "item fc"
  });
  $("#page_" + page + "_first_container").attr({
    class: "active item fc"
  });

  $(".active.first.container").attr({
    class: "ui divided items first container",
    style: "display: none"
  });
  $("#items_first_container" + page).attr({
    class: "ui divided items active first container",
    style: "display: block"
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
function on_click_page_number_in_third_container(page) {
  $(".active.item.tc").attr({
    class: "item tc"
  });
  $("#page_" + page + "_third_container").attr({
    class: "active item tc"
  });

  $(".active.third.container").attr({
    class: "ui divided items third container",
    style: "display: none"
  });
  $("#items_third_container" + page).attr({
    class: "ui divided items active third container",
    style: "display: block"
  });
}
function set_item_pagination_in_third_container(
  objects,
  section_id,
  occupation
) {

  console.log(" objects " , objects)
  let res_obj = get_items_of_week(objects, 5, "-1week");
  objects = res_obj.items_of_week;
  let pagination = res_obj.pagination;

  let item = null;
  let content = null;
  let description = null;
  let pairing_times = objects.length;

  for (_index_p in pagination) {
    $("div").remove("#items_third_container" + pagination[_index_p]);
    $("#segment_in_third_container").append(
      "<div class='ui divided items third container' id='items_third_container" +
        pagination[_index_p] +
        "'></div>"
    );

    if (pagination[_index_p] == 1) {
      $("#items_third_container" + pagination[_index_p]).attr(
        "class",
        "ui divided items active third containerr"
      );
    } else if (pagination[_index_p] > 1) {
      $("#items_third_container" + pagination[_index_p]).attr(
        "style",
        "display: none"
      );
    }

    for (_index_o in objects) {
      if (objects[_index_o].page == pagination[_index_p]) {
        switch (occupation) {
          case "teacher":
            let grid = null;
            let extra = null;
            let eleven_wide_column = null;
            let tag_b = null;
            let five_wide_column = null;
            let button = null;
            let pairing_session = objects[_index_o];
            item = $(
              "<div class='item' style='padding-top:10px; padding-bottom:10px; padding-left:15px; padding-right:15px;'></div>"
            );
            content = $("<div class='content'></div>");
            grid = $("<div class='ui grid'></div>");
            eleven_wide_column = $("<div class='eleven wide column'></div>");
            five_wide_column = $("<div class='five wide column'></div>");
            if (pairing_session.status == 0) {
              // console.log('pairing_session.status, ', pairing_session.status)
              tag_b = $(
                "<b style='font-size:1.5em;'><header style='color:#5D5D5D;'> Session : " +
                  (pairing_times - _index_o) +
                  " </header></b>"
              );
              description = $(
                "<p><b style='color:#5D5D5D'> Start at : </b><font style='color:#5D5D5D'>" +
                  pairing_session.time_start +
                  "</font><br><b style='color:#5D5D5D'> End at : </b><font style='color:#5D5D5D'>" +
                  pairing_session.time_end +
                  "</font></p>"
              );
              button = $(
                "<div class='ui right floated alignedvertical animated button' onclick='onClickViewPairingRecord(" +
                  pairing_session.pairing_session_id +
                  ', "' +
                  section_id +
                  "\")'><div class='hidden content' style='color:#5D5D5D;'> View </div><div class='visible content'><i class='eye icon'/></div></div>"
              );
              extra = $(
                "<div class='extra'><div class='ui label' id='status' style='background-color:#E8E8E8; color:#665D5D;'> COMPLETED </div></div>"
              );
            } else {
              tag_b = $(
                "<b style='font-size:1.5em;'><header> Session : " +
                  (pairing_times - _index_o) +
                  " </header></b>"
              );
              description = $(
                "<p><b> Start at : </b><font>" +
                  pairing_session.time_start +
                  "</font><br><b> End at : </b><font>" +
                  pairing_session.time_end +
                  "</font></p>"
              );
              button = $(
                "<div class='ui top right floated pointing dropdown button blue' ><font color='white'> Select </font><div class='menu'><div class='item' onclick='onClickViewPairingRecord(" +
                  pairing_session.pairing_session_id +
                  ', "' +
                  section_id +
                  "\")'> View </div><div class='item' onclick='onClickCompletedSessionMenu(" +
                  pairing_session.collaborative_session_id +
                  ', "' +
                  section_id +
                  "\")'> Completed </div></div></div>"
              );
              extra = $(
                "<div class='extra'><div class='ui label' id='status' style='background-color:#16AB39; color:white;'> ACTIVE </div></div>"
              );
            }
            item.append(content);
            content.append(grid);
            content.append(extra);
            grid.append(eleven_wide_column);
            grid.append(five_wide_column);
            eleven_wide_column.append(tag_b);
            eleven_wide_column.append(description);
            five_wide_column.append(button);
            $("#items_third_container" + pagination[_index_p]).append(item);

            break;
          default:
            let assignment = objects[_index_o];
            let tag_a = null;
            item = $("<div class='item'></div>");
            content = $("<div class='content'></div>");
            tag_a = $(
              "<a href='/assignment?section_id=" +
                section_id +
                "&notebook_assignment_id=" +
                assignment.notebook_assignment_id +
                "'><b style='font-size:1.5em; padding-left:15px; padding-right:15px;'>" +
                assignment.title +
                "</b></a>"
            );
            description = $(
              "<div class='description'><p style='padding-left:15px; padding-right:15px;'>" +
                assignment.description +
                "</p></div>"
            );
            item.append(content);
            content.append(tag_a);
            content.append(description);
            $("#items_third_container" + pagination[_index_p]).append(item);
        }
      }
    }
  }

  $("div").remove("#pagination_in_third_container");
  if (pagination[pagination.length - 1] == 1) {
    pagination = [];
  } else {
    $(
      "<div class='ui pagination menu' id='pagination_in_third_container'></div>"
    ).insertAfter("#ui_two_column_in_third_container");
  }

  item = null;
  for (_index in pagination) {
    item = $(
      "<a class='item tc' id='page_" +
        pagination[_index] +
        "_third_container' onclick='on_click_page_number_in_third_container(" +
        pagination[_index] +
        ")'>" +
        pagination[_index] +
        "</a>"
    );
    $("#pagination_in_third_container").append(item);
  }
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
                "</p><p style='padding-left:15px; padding-right:15px;'>Programming Style : "+
                assignment.programming_style +
                "</p></div>"
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
  $(".ui.form.createAssignment").form({
    fields: {
      title: {
        identifier: "title",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your title"
          }
        ]
      },
      week: {
        identifier: "week",
        rules: [
          {
            type: "integer[1...100]",
            prompt: "Please enter an integer value"
          }
        ]
      },
      description: {
        identifier: "description",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your description"
          }
        ]
      },
      input_specification: {
        identifier: "input_specification",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your input specification"
          }
        ]
      },
      output_specification: {
        identifier: "output_specification",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your output specification"
          }
        ]
      },
      sample_input: {
        identifier: "sample_input",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your sample input"
          }
        ]
      },
      sample_output: {
        identifier: "sample_output",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your sample output"
          }
        ]
      }
    },
    onSuccess: function() {
      $("#assignment-modal").modal("hide");
    }
  });

  pairingOrViewingisHided("pair");
  // $('#resetPair-button').click(function(){
  //   parameters = {partner_id: 'NULL', section_id: $('#section_id').attr('value')}
  //   $.ajax({
  //     url: 'classroom/resetPair',
  //     type: 'put',
  //     data: parameters,
  //     success: function (data) {
  //       const resStatus = data.resStatus
  //       if(resStatus == 'Update completed.') {
  //         alert('Reset pairing completed!')
  //       } else if(resStatus == 'Update failed.') {
  //         alert(resStatus)
  //       }
  //     }
  //   })
  // })


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

function showAssingmentModal() {
  $("#confirmToCreateAssBtn").attr({
    onclick: "createAssignment()"
  })
  $("#assignment-modal").modal("show");
}

function showFirstContainer() {
  $("#first_container").show();
  $("#second_container").hide();
  $("#third_container").hide();
}
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

function setClassroomDetail(day, startTime, endTime) {
  $(".settings-menu").click(function() {
    let startTimeHh = startTime[0] + startTime[1];
    let startTimeMm = startTime[3] + startTime[4];
    let startTimeAp = startTime[5] + startTime[6];
    let endTimeHh = endTime[0] + endTime[1];
    let endTimeMm = endTime[3] + endTime[4];
    let endTimeAp = endTime[5] + endTime[6];
    $(".day option[value='" + day + "']").attr("selected", "selected");
    $(".timeStartHh option[value=" + startTimeHh + "]").attr(
      "selected",
      "selected"
    );
    $(".timeStartMm option[value=" + startTimeMm + "]").attr(
      "selected",
      "selected"
    );
    $(".timeStartAp option[value=" + startTimeAp + "]").attr(
      "selected",
      "selected"
    );
    $(".timeEndHh option[value=" + endTimeHh + "]").attr(
      "selected",
      "selected"
    );
    $(".timeEndMm option[value=" + endTimeMm + "]").attr(
      "selected",
      "selected"
    );
    $(".timeEndAp option[value=" + endTimeAp + "]").attr(
      "selected",
      "selected"
    );
    $(".ui.form").trigger("reset");
    $(".ui.form .field.error").removeClass("error");
    $(".ui.form.error").removeClass("error");
    $("#settings-modal").modal("show");
  });
}


function on_click_confirm_pairing_button(parameters) {
  $("#confirm-button").attr(
    "onclick",
    "on_click_confirm_button(" + JSON.stringify(parameters) + ")"
  );
  $("#confirm-header").text("Create new pairing session");
  $("#confirm-message").text(
    "Are you sure you want to create new pairing session?"
  );
  $("#confirm-message").attr(
    "value",
    "Are you sure you want to create new pairing session?"
  );
  $("#confirm-modal").modal("show");
}

function on_click_cancel_pairing_button() {
  const message = $("#confirm-message").attr("value");
  if (message == "Are you sure you want to cancel pairing?") {
    $("#confirm-button").attr("onclick", "on_click_confirm_button({})");
    $("#confirm-modal").modal("show");
  } else {
    $("#alphabeticalFilter").attr("class", "ui button");
    $("#alphabeticalFilter").attr("value", "A-Z");
    $("#alphabeticalFilter").text("A-Z");

    $("#avgScoreFilter").attr("class", "ui button");
    $("#avgScoreFilter").attr("value", "1-100");
    $("#avgScoreFilter").text("1-100");

    $("#activeFilter").attr("value", "");
    $("#confirm-pairing").attr("value", "create");

    $("#autoPairing").hide();
  }
}

function on_click_cancel_button() {
  const message = $("#confirm-message").attr("value");
  if (message == "Are you sure you want to cancel pairing?") {
    $("#student_list_modal").modal("show");
  } else if (
    message == "Are you sure you want to create new pairing session?"
  ) {
    $("#student_list_modal").modal("show");
  }
}



// function searchStudent(
//   id,
//   student_id,
//   section_id,
//   pairing_session_id,
//   username,
//   partner_keys,
//   pairing_objective
// ) {
//   var parameters = {
//     search: $(id).val(),
//     student_id: student_id,
//     section_id: section_id,
//     pairing_session_id: pairing_session_id,
//     username: username,
//     partner_keys: JSON.stringify(partner_keys),
//     pairing_objective: JSON.stringify(pairing_objective)
//   };
//   $.get("/classroom/searchStudent", parameters, function(data) {
//     const studentId = data.studentId;
//     const students = data.students;
//     const purpose = data.purpose;
//     const sectionId = data.sectionId;
//     const pairingSessionId = data.pairingSessionId;
//     const partnerKeys = JSON.parse(data.partnerKeys);
//     const pairingObjectives = JSON.parse(data.pairingObjectives);
//     $(".user-list").empty();
//     if (students.length > 0) {
//       students.forEach(function(student) {
//         if (pairingObjectives[student.enrollment_id] == -1) {
//           $(".user-list").append(
//             "<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton(" +
//               studentId +
//               "," +
//               student.enrollment_id +
//               ',"' +
//               purpose +
//               '","' +
//               sectionId +
//               '",' +
//               pairingSessionId +
//               ", " +
//               JSON.stringify(partnerKeys) +
//               ", " +
//               JSON.stringify(pairingObjectives) +
//               ",2)'>Add</div></div><img class='ui avatar image' src='" +
//               student.img +
//               "'><div class='content'><div class='header'>" +
//               student.first_name +
//               " " +
//               student.last_name +
//               "</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score " +
//               parseFloat(student.avg_score).toFixed(2) +
//               "</a><a class='ui green label'> Available </a></div><div style='font-size: 12px;'>total active time: " +
//               pad(parseInt(student.total_time / 3600)) +
//               ":" +
//               pad(
//                 parseInt(
//                   (student.total_time -
//                     parseInt(student.total_time / 3600) * 3600) /
//                     60
//                 )
//               ) +
//               ":" +
//               pad(parseInt(student.total_time % 60)) +
//               "</div></div></div></div>"
//           );
//         } else {
//           $(".user-list").append(
//             "<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton(" +
//               studentId +
//               "," +
//               student.enrollment_id +
//               ',"' +
//               purpose +
//               '","' +
//               sectionId +
//               '",' +
//               pairingSessionId +
//               ", " +
//               JSON.stringify(partnerKeys) +
//               ", " +
//               JSON.stringify(pairingObjectives) +
//               ",2)'>Add</div></div><img class='ui avatar image' src='" +
//               student.img +
//               "'><div class='content'><div class='header'>" +
//               student.first_name +
//               " " +
//               student.last_name +
//               "</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score " +
//               parseFloat(student.avg_score).toFixed(2) +
//               "</a><a class='ui red label'> Paired </a></div><div style='font-size: 12px;'>total active time: " +
//               pad(parseInt(student.total_time / 3600)) +
//               ":" +
//               pad(
//                 parseInt(
//                   (student.total_time -
//                     parseInt(student.total_time / 3600) * 3600) /
//                     60
//                 )
//               ) +
//               ":" +
//               pad(parseInt(student.total_time % 60)) +
//               "</div></div></div></div>"
//           );
//         }
//       }, this);
//     } else {
//       $(".user-list").append("<li class='ui item'>No results</li>");
//     }
//   });
// }
function onClickAddPartnerButton(studentsGroup) {

  console.log("#group-student onClickAddPartnerButton" , studentsGroup["group"])


  $(".search").empty()
  for(let index in studentsGroup.students){
    console.log("student.status " , studentsGroup.students[index].status)

    if (studentsGroup.students[index].status == -1){

        $(".search").append(
          '<div class="ui grid">'+
            '<div class="six wide column">'+
                '<div class="ui two column very relaxed grid">'+
                    '<div class="row">'+
                        '<div class="ten wide column">'+
                          ' <p>'+ studentsGroup.students[index].first_name + " " +studentsGroup.students[index].last_name+'</p>'+
                        '</div>'+
                      '<div class="two wide column"><input type="checkbox" name="student" value='+JSON.stringify(studentsGroup.students[index]) +' id="student" float="left" /></div>'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>'
      )
    } 
  }
 

      $("#partner_selection_modal").modal("show");

      $("#group-student").attr(
        "onclick",
        "showGroup(" + JSON.stringify(studentsGroup)+ ")"
        ); 
  }
  function showGroup(studentsGroup){


    select_student = Array.from(document.querySelectorAll('input[name="student"]:checked')).map(student => student.value)
    console.log("#group-student group" , select_student.length)

    if( select_student.length > 0 ){
      let fullName = []
      let studentId = []
      let img = []
      for (let i = 0 ;  i < 3 ; i++){
        if(select_student[i] != null ){
          student = JSON.parse(select_student[i])
          fullName.push(student["fullName"].replace(":", " "))
          img.push(student["img"])
          studentId.push(student["student_id"])
        }
        else{
          fullName.push("Empty")
          img.push("/images/user_empty.jpg")
          }
        }
  
        for (let i = 0 ;  i < Object.keys(studentsGroup["students"]).length ; i++){
  
          if(studentId.includes(studentsGroup["students"][i]["student_id"])){
  
             studentsGroup["students"][i]["status"] = 0
          }
        }
  
        // groupStudent["group"].push(fullName)
        console.log("type group = " ,  typeof studentsGroup["group"])
        studentsGroup["group"].push(studentId)
  
      $("#student_list_modal").modal("show");
  
      $(".student-container").append(
          "<li id='" +
          "' class='ui segment'>"+
          "<table style='width : 100%;' ><tr><td colspan='2' rowspan='2' style='width: 50% ;' >"+
          "<img class='ui avatar image' src='" +img[0] +"'></img>" +"  " + 
          fullName[0]+ 
          "</td>"+
          "<td > "+   "<img class='ui avatar image' src='" +img[1] +"'></img>" +"<font color='grey'> "+fullName[1]+" </font>" +
          "</td>  </tr>"+
          "<tr><td>"+  "<img class='ui avatar image' src='" +img[2] +"'></img>" +" <font color='grey'> "+fullName[2]+" </font> <br></td></tr></table>"+
          "</li>"
          );
  
          console.log(" studentsGroup group-student " , studentsGroup)
          groupStudent(studentsGroup )
    } else{
      alert("Please select student !!!");
   
    }
    

  }

function showStudentList(
  command,
  pairingSessionId,
  sectionId
) {
  
  // console.log(" sectionId " , sectionId)
  let parameter = {
    section_id: sectionId,
    pairingSessionId: pairingSessionId,
    command: command
  };

  console.log("parameter ",parameter)

      $.get("/dsbaClass/getStudentsFromSection", parameter , function(data) {

        let students = data.students
        let group = []

        let command = data.command
        let collaborativeSessionStatus = data.collaborativeSessionStatus
        
     
    
        if (command == "pair") {
          if (collaborativeSessionStatus == 1) {
            $("#changePair").show();
          } else {
            $("#changePair").hide();
            $("#autoPairing").show();
          }
        } 
        else if (command == "view") {
          if (collaborativeSessionStatus == 1) {
            $("#changePair").show();
          } else {
            $("#changePair").hide();
          }
        }
    
        $(".student-container").empty();
    
        // when click pair
        
          

    
        if (!students.length) {
          console.log("No student.")
    
          $("#alert-header").text("Create Session");
        $("#alert-message").text(
          'No student.'
        );
        $("#alert-modal").modal("show");
    
        } 
        var studentsGroup = {
          students:students,
          group: group ,
          section_id: sectionId
        }
    
      
        if (students.length > 0) {
          $("#student_list_modal").modal("show");
    
        }

        groupStudent(studentsGroup)

    
      });
    
 
}

function groupStudent(studentsGroup){

  // if (studentsGroup["group"].length < 1) {
    
  //   $(".student-container").append(
  //     "<h1 style='color:grey'><center>No Group .</center></h1>"
  //   );
  // }
    $("#create-group").attr(
      "onclick",
      "onClickAddPartnerButton(" + JSON.stringify(studentsGroup)+ ")"
    ); 

    $("#confirm-group").attr(
      "onclick",
      "onClickComfirmGroup(" + JSON.stringify(studentsGroup)+ ")"
      ); 
  }

  function onClickComfirmGroup(studentsGroup){
      console.log(" onClickComfirmGroup")

      $("#confirm-button").attr(
        "onclick",
        "on_click_confirm_button(" + JSON.stringify(studentsGroup) + ")"
      );
      $("#confirm-header").text("Create new group session");
      $("#confirm-message").text(
        "Are you sure you want to create new group session?"
      );
      $("#confirm-message").attr(
        "value",
        "Are you sure you want to create new group session?"
      );
      $("#confirm-modal").modal("show");
  }

  function on_click_confirm_button(parameters) {
    console.log("parameters 4", parameters)
    const message = $("#confirm-message").attr("value");
  
    if (message == "Are you sure you want to create new group session?") {
     
        // $("#global_loader").attr({
        //   style: "display: block; position: fixed;"
        // });

        $.post("/dsbaClass/createGroupRecord", parameters , function(data) {
          console.log("data ", data)
          let status = data.status;
          let collaborativeSession = JSON.parse(data.collaborativeSession)
          let sectionId = data.sectionId;
          let weeklyDatas = JSON.parse(data.weeklyDatas);
          

          if (status == "Please pair all students!") {
            alert(status);
            $("#student_list_modal").modal("show");
          }else if(status == "Confirm completed."){
            $("#no_session").empty();
            $("#menu_week").empty();
            create_weeks_dropdown(
              "#menu_week",
              collaborativeSession[0].collaborative_session_id,
              weeklyDatas
            );
            $("#weeks").dropdown();
            on_click_weeks_dropdown(
              "-1week",
              JSON.parse(weeklyDatas.assignments),
              weeklyDatas.username,
              weeklyDatas.img,
              collaborativeSession[0].collaborative_session_id,
              0
            );

            set_item_pagination_in_third_container(
              collaborativeSession,
              sectionId,
              "teacher"
            );
            on_click_page_number_in_third_container(1);

            $(".ui.pointing.dropdown").dropdown();

            $("#newPairingSession").attr(
              "onclick",
              "onClickCreateSession(" +
              collaborativeSession[0].collaborative_session_id +
                ', "' +
                sectionId +
                '", ' +
                collaborativeSession[0].status +
                ")"
            );
            $("#newPairingSession").attr("value", 1);

          }
          
          // $("#global_loader").attr({
          //   style: "display: none; position: fixed;"
          // });
        });
      } 
      else if (
        message == "Are you sure you want to complete this group session?"
      ) {
        console.log("parameters 2 " ,parameters )
        $("#global_loader").attr({
          style: "display: block; position: fixed;"
        });
        $.ajax({
          url: "/dsbaClass/completeGroupSession",
          type: "put",
          data: parameters,
          success: function(data) {
            let resStatus = data.resStatus;
            let collaborativeSession = JSON.parse(data.collaborativeSession);
            let sectionId = data.sectionId;
            if (resStatus == "Update completed.") {
              set_item_pagination_in_third_container(
                collaborativeSession,
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
        
        
      } 
      else if (
      message ==
      "Are you sure you want to assign these assignments to all student groups?"
    ) {
      console.log("/dsbaClass/assignAssignment 1" , parameters)

      $.post("/dsbaClass/assignAssignment", parameters, function(data) {

        console.log("/dsbaClass/assignAssignment 2")

        // var res_status = data.res_status;
        // if (
        //   res_status == "Please pair all students before assign the assignment!"
        // ) {
        //   alert(res_status);
        // } else if (res_status == "You already assigned these assignments!") {
        //   alert(res_status);
        // } else if (res_status == "Successfully assigned this assignment!") {
        //   alert(res_status);
        // } else if (res_status == "Completed test!") {
        //   alert(res_status);
        // } else {
        //   alert(res_status);
        // }
        $("#global_loader").attr({
          style: "display: none; position: fixed;"
        });
      });
    } 
      // else if (
      //   session_status == 1 &&
      //   $("#confirm-pairing").attr("value") == "change"
      // ) {
      //   $("#global_loader").attr({
      //     style: "display: block; position: fixed;"
      //   });
      //   $("#autoPairing").hide();
      //   parameters = {
      //     partnerKeys: JSON.parse(parameters.partner_keys),
      //     pairingObjectives: JSON.parse(parameters.pairing_objective),
      //     pairingSessionId: parameters.pairing_session_id,
      //     sectionId: parameters.section_id
      //   };
      //   $.ajax({
      //     url: "/classroom/updatePairing",
      //     type: "put",
      //     data: parameters,
      //     success: function(data) {
      //       var status = data.status;
      //       $("#loader").attr("style", "display: none");
      //       if (status == "Update pairing successfully") {
      //         pairingOrViewingisHided("view");
      //         $("#confirm-pairing").attr("value", "create");
      //         alert(status);
      //       } else if (status == "Please pair all students!") {
      //         alert(status);
      //         $("#confirm-header").text("Student pairing");
      //         $("#confirm-message").text(
      //           "Are you sure you want to cancel pairing?"
      //         );
      //         $("#confirm-message").attr(
      //           "value",
      //           "Are you sure you want to cancel pairing?"
      //         );
      //         $("#student_list_modal").modal("show");
      //       } else {
      //         $("#confirm-pairing").attr("value", "create");
      //         alert(status);
      //       }
      //       $("#global_loader").attr({
      //         style: "display: none; position: fixed;"
      //       });
      //     }
      //   });
      // } 
      // else {
      //   $("#alert-header").text("Pairing session");
      //   $("#alert-message").text("You can't create session!");
      //   $("#alert-modal").modal("show");
      // }
    // } 
    // else if (message == "Are you sure you want to cancel pairing?") {
    //   $("#alphabeticalFilter").attr("class", "ui button");
    //   $("#alphabeticalFilter").attr("value", "A-Z");
    //   $("#alphabeticalFilter").text("A-Z");
  
    //   $("#avgScoreFilter").attr("class", "ui button");
    //   $("#avgScoreFilter").attr("value", "1-100");
    //   $("#avgScoreFilter").text("1-100");
  
    //   $("#activeFilter").attr("value", "");
    //   $("#confirm-pairing").attr("value", "create");
  
    //   $("#autoPairing").hide();
    // } 

    
    // else if (
    //   message ==
    //   "Are you sure you want to remove the student from this classroom?"
    // ) {
    //   $("#global_loader").attr({
    //     style: "display: block; position: fixed;"
    //   });
    //   $.ajax({
    //     url: "/api/removeStudent",
    //     type: "delete",
    //     data: parameters,
    //     success: function(res) {
    //       if (
    //         res.resStatus == "Remove the student from the classroom completed."
    //       ) {
    //         $("#" + res.enrollment_id).remove();
    //         alert(res.resStatus);
    //       } else {
    //         alert(res.resStatus);
    //       }
    //       $("#global_loader").attr({
    //         style: "display: none; position: fixed;"
    //       });
    //     }
    //   });
    // }
    //  else if (message == "Are you sure you want to delete these assignment?") {
    //   $("#global_loader").attr({
    //     style: "display: block; position: fixed;"
    //   });
    //   $.ajax({
    //     url: "/notebookAssignment/deleteAssignment",
    //     type: "delete",
    //     data: parameters,
    //     success: function(res) {
    //       let status = res.dataSets.origins.status;
    //       let assignments = JSON.parse(res.dataSets.reforms.assignments);
    //       let username = res.dataSets.origins.username;
    //       let img = res.dataSets.origins.img;
    //       let pairing_session_id = res.dataSets.origins.pairing_session_id;
    //       let opt = 0;
    //       let weeks = res.dataSets.origins.weeks;
    //       let data_for_weeks_dropdown_function = {
    //         assignments: JSON.stringify(assignments),
    //         username: username,
    //         img: img,
    //         weeks: weeks
    //       };
    //       if (status == "Delete all of these assignment successfully.") {
    //         $("#menu_week").empty();
    //         create_weeks_dropdown(
    //           "#menu_week",
    //           pairing_session_id,
    //           data_for_weeks_dropdown_function
    //         );
    //         $("#weeks").dropdown();
    //         on_click_weeks_dropdown(
    //           "-1week",
    //           assignments,
    //           username,
    //           img,
    //           pairing_session_id,
    //           opt
    //         );
    //         $("#clear_checkbox").attr(
    //           "onclick",
    //           "checkbox_event(" + JSON.stringify(assignments) + ", '-1week', 0)"
    //         );
    //         $("#check_all_of_box").attr(
    //           "onclick",
    //           "checkbox_event(" + JSON.stringify(assignments) + ", '-1week', 1)"
    //         );
    //         alert(status);
    //       } else {
    //         alert(status);
    //       }
    //       $("#global_loader").attr({
    //         style: "display: none; position: fixed;"
    //       });
    //     }
    //   });
    // } 
    // else if (
    //   message == "Are you sure you want to disable assignments on this week?"
    // ) {
    //   $("#global_loader").attr({
    //     style: "display: block; position: fixed;"
    //   });
    //   $.ajax({
    //     url: "/classroom/manageAssignment",
    //     type: "put",
    //     data: parameters,
    //     success: function(res) {
    //       let status = res.status;
    //       if (status == "Disable assignments successfully.") {
    //         alert(status);
    //       } else {
    //         alert(status);
    //       }
    //       $("#global_loader").attr({
    //         style: "display: none; position: fixed;"
    //       });
    //     }
    //   });
    // } 
    // else if (
    //   message == "Are you sure you want to enable assignments on this week?"
    // ) {
    //   $("#global_loader").attr({
    //     style: "display: block; position: fixed;"
    //   });
    //   $.ajax({
    //     url: "/classroom/manageAssignment",
    //     type: "put",
    //     data: parameters,
    //     success: function(res) {
    //       let status = res.status;
    //       if (status == "Enable assignments successfully.") {
    //         alert(status);
    //       } else {
    //         alert(status);
    //       }
    //       $("#global_loader").attr({
    //         style: "display: none; position: fixed;"
    //       });
    //     }
    //   });
    // } 

  
    $("#confirm-message").attr("value", "Something message.");
  }
function onClickCreateSession(
  collaborative_session_id,
  section_id
  // ,  group_session_status

) {
  if ($("#newPairingSession").attr("value") <= 0) {
    pairingOrViewingisHided("pair"); //stduent or teacher view
    showStudentList("pair", collaborative_session_id, section_id);
  } else {
    $("#alert-header").text("Group session");
    $("#alert-message").text(
      "Cannot create a new session! Please set current session to completed before create a new session."
    );
    $("#alert-modal").modal("show");
  }
}

function onClickCompletedSessionMenu(collaborative_session_id, section_id) {
  //console.log('pairing_session_id: ' + pairing_session_id)
  parameters = JSON.stringify({
    collaborative_session_id: collaborative_session_id,
    section_id: section_id,
    status: 0
  });
 
  $("#confirm-button").attr(
    "onclick",
    "on_click_confirm_button(" + parameters + ")"
  );
  $("#confirm-header").text("Complete pairing session");
  $("#confirm-message").text(
    "Are you sure you want to complete this group session?"
  );
  $("#confirm-message").attr(
    "value",
    "Are you sure you want to complete this group session?"
  );
  $("#confirm-modal").modal("show");
}

function pairingOrViewingisHided(command) {
  if (command == "pair") {
    $("#confirm-pairing").show();
    $("#cancel-pairing").show();
    $("#close_student_list").hide();
  } else if (command == "view") {
    $("#confirm-pairing").hide();
    $("#cancel-pairing").hide();
    $("#close_student_list").show();
  }
}

function onClickViewPairingRecord(pairing_session_id, section_id) {
  pairingOrViewingisHided("view");
  showStudentList("view", {}, {}, pairing_session_id, section_id);
}

function onClickAssign(
  section_id,
  pairing_session_id,
  notebook_assignment_id,
  title,
  description,
  programming_style
) {
  var parameters = {
    section_id: section_id,
    pairing_session_id: pairing_session_id,
    notebook_assignment_id: notebook_assignment_id,
    title: title,
    description: description,
    programming_style: "Interactive"
  };
  $("#inp_cm").attr("value", JSON.stringify(parameters));
  $("#confirm-header").text("Assign assignment");
  $("#confirm-message").attr(
    "value",
    "Are you sure you want to assign this assignment to all student pairs?"
  );
  $("#confirm-message").text(
    "Are you sure you want to assign this assignment to all student pairs?"
  );
  $("#confirm-modal").modal("show");
}

function on_click_assign_button(assignment_of_week, collaborative_session_id) {
  
  console.log(" on_click_assign_button " ,assignment_of_week )
  console.log(" pairing_session_id " ,collaborative_session_id )

  assignment_of_week = JSON.parse(assignment_of_week);
  let assignment_is_selected = [];
  assignment_of_week.forEach(function(e) {
    $("#" + e.notebook_assignment_id + "_is_selected").is(":checked") == true
      ? assignment_is_selected.push(e)
      : null;

  });
  // console.log('!assignment_is_selected.length, ', !assignment_is_selected.length, ', assignment_is_selected, ', assignment_is_selected)
  console.log("assignment_is_selected.length " , assignment_is_selected.length)

  if (assignment_is_selected.length) {
    let parameters = JSON.stringify({
      assignment_set: assignment_is_selected,
      collaborative_session_id: collaborative_session_id
    });
    
    $("#confirm-button").attr(
      "onclick",
      "on_click_confirm_button(" + parameters + ")"
    );
    $("#confirm-header").text("Assign assignment");
    $("#confirm-message").attr(
      "value",
      "Are you sure you want to assign these assignments to all student groups?"
    );
    $("#confirm-message").text(
      "Are you sure you want to assign these assignments to all student groups?"
    );
    $("#confirm-modal").modal("show");
    
  } else {
    $("#alert-header").text("Select assignment");
    $("#alert-message").text(
      'Please!!!, select an assignment before click the "Assign" button.'
    );
    $("#alert-modal").modal("show");
  }
}

// function on_click_assign_now_button(assignment_set, pairing_session_id) {
//   let end_time = $('#year_a').val() + '-' + $('#month_a').val() + '-' + $('#day_a').val() + 'T' + $('#endTimeHh_a').val() + ':' + $('#endTimeMm_a').val() + ':' + $('#endTimeSs_a').val() + 'Z'
//   let parameters = JSON.stringify({assignment_set: assignment_set, pairing_session_id: pairing_session_id, end_time: end_time})
//   $('#confirm-button').attr('onclick', 'on_click_confirm_button('+parameters+')')
//   $('#confirm-header').text('Assign assignment')
//   $('#confirm-message').attr('value', 'Are you sure you want to assign these assignments to all student groups?')
//   $('#confirm-message').text('Are you sure you want to assign these assignments to all student groups?')
//   $('#confirm-modal').modal('show');
// }

function onClickDeleteAssignment(assignment_of_week) {
  console.log(" onClickDeleteAssignment coll")

  let assignment_is_selected = [];
  assignment_of_week.forEach(function(e) {
    $("#" + e.notebook_assignment_id + "_is_selected").is(":checked") == true
      ? assignment_is_selected.push(e)
      : null;
  });
  // console.log('!assignment_is_selected.length, ', !assignment_is_selected.length, ', assignment_is_selected, ', assignment_is_selected)
  if (!assignment_is_selected.length) {
    $("#alert-header").text("Select assignment");
    $("#alert-message").text(
      'Please!!!, select an assignment before click the "Delete" button.'
    );
    $("#alert-modal").modal("show");
  } else {
    let parameters = JSON.stringify({
      assignment_is_selected: assignment_is_selected
    });
    $("#confirm-button").attr(
      "onclick",
      "on_click_confirm_button(" + parameters + ")"
    );
    $("#confirm-header").text("Delete assignments");
    $("#confirm-message").attr(
      "value",
      "Are you sure you want to delete these assignment?"
    );
    $("#confirm-message").text(
      "Are you sure you want to delete these assignment?"
    );
    $("#confirm-modal").modal("show");
  }
}

function on_click_enable_assignment_button() {
  $("#dropdown_amd").empty();
  $("#dropdown_amd").append(
    "<input id='week_input_amd' type='hidden'></input>"
  );
  $("#dropdown_amd").append("<i class='dropdown icon'></i>");
  $("#dropdown_amd").append("<div class='default text'>Week</div>");
  $("#dropdown_amd").append("<div id='week_amd' class='menu'></div>");
  $.get("/classroom/getWeeklyAssignments", { action: "enable" }, function(res) {
    let weeks = JSON.parse(res.weeks);
    if (!weeks.length) {
      $("#week_amd").append(
        "<div class='item' id='-1_week_in_dam' data-value='-1'>No disable assignment.</div>"
      );
    } else if (weeks.length) {
      $("#week_amd").append(
        "<div class='item' id='0_week_in_dam' data-value='0'>All</div>"
      );
    }
    weeks.forEach(function(e) {
      $("#week_amd").append(
        "<div class='item' id='" +
          e +
          "_week_in_dam' data-value='" +
          e +
          "'>" +
          e +
          "</div>"
      );
    });
    $("#confirm_assignment_management").attr(
      "onclick",
      "on_click_confirm_assignment_management_button('enable')"
    );
    $("#header_amd").text("Enable Assignment");
    $("#assignment_management_modal").modal("show");
    $("#dropdown_amd").dropdown();
  });
}

function on_click_disable_assignment_button() {
  $("#dropdown_amd").empty();
  $("#dropdown_amd").append(
    "<input id='week_input_amd' type='hidden'></input>"
  );
  $("#dropdown_amd").append("<i class='dropdown icon'></i>");
  $("#dropdown_amd").append("<div class='default text'>Week</div>");
  $("#dropdown_amd").append("<div id='week_amd' class='menu'></div>");
  $.get("/classroom/getWeeklyAssignments", { action: "disable" }, function(
    res
  ) {
    let weeks = JSON.parse(res.weeks);
    if (!weeks.length) {
      $("#week_amd").append(
        "<div class='item' id='-1_week_in_dam' data-value='-1'>Not yet assigned assignment.</div>"
      );
    } else if (weeks.length) {
      $("#week_amd").append(
        "<div class='item' id='0_week_in_dam' data-value='0'>All</div>"
      );
    }
    weeks.forEach(function(e) {
      $("#week_amd").append(
        "<div class='item' id='" +
          e +
          "_week_in_dam' data-value='" +
          e +
          "'>" +
          e +
          "</div>"
      );
    });
    $("#header_amd").text("Disable Assignment");
    $("#confirm_assignment_management").attr(
      "onclick",
      "on_click_confirm_assignment_management_button('disable')"
    );
    $("#assignment_management_modal").modal("show");
    $("#dropdown_amd").dropdown();
  });
}

function on_click_confirm_assignment_management_button(action) {
  if (action == "enable") {
    parameters = JSON.stringify({
      week: $("#week_input_amd").val(),
      action: "enable"
    });
    $("#confirm-button").attr(
      "onclick",
      "on_click_confirm_button(" + parameters + ")"
    );
    $("#confirm-header").text("Disable Assignment");
    $("#confirm-message").attr(
      "value",
      "Are you sure you want to disable assignments on this week?"
    );
    $("#confirm-message").text(
      "Are you sure you want to disable assignments on this week?"
    );
    $("#confirm-modal").modal("show");
  } else if (action == "disable") {
    parameters = JSON.stringify({
      week: $("#week_input_amd").val(),
      action: "disable"
    });
    $("#confirm-button").attr(
      "onclick",
      "on_click_confirm_button(" + parameters + ")"
    );
    $("#confirm-header").text("Enable Assignment");
    $("#confirm-message").attr(
      "value",
      "Are you sure you want to enable assignments on this week?"
    );
    $("#confirm-message").text(
      "Are you sure you want to enable assignments on this week?"
    );
    $("#confirm-modal").modal("show");
  }
}

function on_click_remove_student_button(enrollment_id, first_name, last_name) {
  parameters = JSON.stringify({ enrollment_id: enrollment_id });
  // console.log('enrollment_id, ', enrollment_id)
  $("#confirm-button").attr(
    "onclick",
    "on_click_confirm_button(" + parameters + ")"
  );
  $("#confirm-header").text("Remove Student");
  $("#confirm-message").attr(
    "value",
    "Are you sure you want to remove the student from this classroom?"
  );
  $("#confirm-message").text(
    'Are you sure you want to remove "' +
      first_name +
      " " +
      last_name +
      '" from this classroom?'
  );
  $("#confirm-modal").modal("show");
}


function checkbox_event(assignment_set, id, opt) {
  let assignment_of_week_ = get_items_of_week(assignment_set, 5, id)
    .items_of_week;
  switch (opt) {
    //on click the "Check All of Box" button
    case 1:
      assignment_of_week_.forEach(function(e) {
        $("#" + e.notebook_assignment_id + "_is_selected").prop("checked", true);
      });

      break;
    //on click the "Clear Checkbox" button
    default:
      assignment_of_week_.forEach(function(e) {
        $("#" + e.notebook_assignment_id + "_is_selected").prop("checked", false);
      });
  }
}

function onClickPartnerSelectionMethod(id) {
  $(".psm").removeClass("active");
  $("#" + id).addClass("active");
  $("div")
    .find("." + id)
    .addClass("active");
}


function on_click_button_in_uspm(id) {
  // console.log('element_id_in_uspm, ', id)
  $(".item.active.uspm").attr({
    class: "item uspm"
  });
  $("#" + id).attr({
    class: "item active uspm"
  });

  $(".segment.active.uspm").attr({
    class: "ui segment uspm",
    style: "display: none"
  });
  $("#" + id + "_segment").attr({
    class: "ui segment active uspm",
    style: "display: block"
  });
}

function create_weeks_dropdown(id, collaborative_session_id, dataSets) {
 console.log("dataSets ", dataSets)
 console.log("id ", id)
 console.log("collaborative_session_id ", collaborative_session_id)
  $("" + id).append(
    "<div class='item' id='-1week' data-value='-1' onclick='on_click_weeks_dropdown(\"-1week\", " +
      dataSets.assignments +
      ', "' +
      dataSets.username +
      '", "' +
      dataSets.img +
      '", ' +
      collaborative_session_id +
      ", 0)'>All</div>"
  );
  dataSets.weeks.forEach(function(e) {
    $("" + id).append(
      "<div class='item' id='" +
        e +
        "week' data-value='" +
        e +
        "' onclick='on_click_weeks_dropdown(\"" +
        e +
        'week", ' +
        dataSets.assignments +
        ', "' +
        dataSets.username +
        '", "' +
        dataSets.img +
        '", ' +
        collaborative_session_id +
        ", 0)'>" +
        e +
        "</div>"
    );
  });
}

function on_click_assignment(opt, id) {
  switch (opt) {
    case 1:
      $("#" + id).is(":checked") == true
        ? $("#" + id).prop("checked", false)
        : $("#" + id).prop("checked", true);

      break;
    default:
  }
}

function pad(val) {
  return val > 9 ? val : "0" + val;
}
  