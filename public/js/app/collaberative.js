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
              "<div class='content'><b style='font-size:1.5em; padding-left:15px; padding-right:15px;'><a class='header' href='/assignment?section_id=" +
                assignment.section_id +
                "&assignment_id=" +
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

function onClickDeleteNotebookAssignment() {
  console.log("onClickDeleteNotebookAssignment")
}