/**
 * get query parameter from URL
 * @param {String} scriptName parameter scriptName's the name of script
 * @param {String} name parameter name that you want to get variable from
 * https://stackoverflow.com/questions/2190801/passing-parameters-to-javascript-files/2190927?noredirect=1#comment47136074_2190927
 */
function getVarFromScript(scriptName, name) {
  const data = $(`script[src*=${scriptName}]`)
  const variable = data.attr(name)
  if (typeof variable === undefined) {
    console.log('Error: ', variable)
  }
  return variable
}

$(document).ready(function () {
  $("#assignment-modal").modal({
    closable: false,
    transition: "fade up",
    onApprove: function () {
      //$('.ui.form').submit();
      return false;
    }
  });
  $("#assignmentForm").form({
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
    onSuccess: function () {
      $("#assignment-modal").modal("hide");
    }
  });
});

/**
 * Notifications
 * @param {*} assignments 
 */
function createAssignmentNotification(assignments = null) {
  console.log('Assignments, ', assignments)
  const sectionId = getVarFromScript('assignment', 'data-sectionId')
  assignments = JSON.parse(assignments)
  if (assignments) {
    parameters = { assignments: assignments, sectionId: sectionId }
    $.post('/notifications/createAssignmentNotification', parameters, function (res) {
      console.log('Successed!, ', notifications)
      if (res.notifications !== undefined) {
        const notifications = res.notifications
        const aTag = $(`<a href='${notifications.link}'></a>`)
        const item = $(`<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;">` +
          `</div>`)
        const content = $(`<div class="content">` +
          `<div class="header">${notifications.head}</div>` +
          `<div class="description"><p>${notifications.content}</p></div>` +
          `<div class="extra">` +
          `<i class="edit icon"></i>${moment(notifications.createdAt).fromNow()}</div>` +
          `</div>`)
        item.append(content)
        aTag.append(item)
        $('#notiItems').prepend(item)
      }
    })
  }
}

function showDeleteModal() {
  $("#delete-modal").modal("show");
}

function showAssignmentModal(assignment) {
  $(`#ps${assignment.programming_style}`).attr('checked', 'true')
  $(`#assTitle`).val(assignment.title)
  $(`#assWeek`).val(assignment.week)
  $(`#assignmentDesc`).val(assignment.description.replace(/<br>/g, "\n"))
  $(`#assInSpecify`).val(assignment.input_specification.replace(/<br>/g, "\n"))
  $(`#assOutSpecify`).val(assignment.output_specification.replace(/<br>/g, "\n"))
  $(`#assSamInput`).val(assignment.sample_input.replace(/<br>/g, "\n"))
  $(`#assSamOutput`).val(assignment.sample_output.replace(/<br>/g, "\n"))
  $("#assignmentForm").append(`<input type='hidden' name='assignment_id', value=\'${assignment.assignment_id}\'/>`)

  $("#confirmToCreateAssBtn").attr({
    onclick: "updateAssignment()"
  })
  $("#assignment-modal").modal("show");
}

function validateValueTextarea(textarea, separator) {
  let valueTextarea = []
  valueTextarea = $(`#${textarea}`)
    .val()
    .split(separator);
    
  if (textarea === 'assWeek') {
    if ( !isNaN(parseInt($(`#${textarea}`).val()))) {
      return 1
    }
  } else if ( ( valueTextarea.length === 1 && valueTextarea[0] !== '' ) || valueTextarea.length > 1) {
    return 1
  } else 
  return 0
}

function transformValueTextarea(textarea, func, separator) {

  if (textarea === 'assTitle' || textarea === 'assWeek') {
    return 0
  }

  let valueTextarea = []
  if (func === 'join') {
    valueTextarea = $(`#${textarea}`)
      .val()
      .join(separator);
  } else if (func === 'split') {
    valueTextarea = $(`#${textarea}`)
      .val()
      .split(separator);
  }
  $(`#${textarea}`).val(JSON.stringify(valueTextarea));
}

function createAssignment() {
  $("#assignmentForm").attr({
    action: "/assignment",
    method: "POST"
  });

  let textareaId = [
    "assTitle",
    "assWeek",
    "assignmentDesc",
    "assInSpecify",
    "assOutSpecify",
    "assSamInput",
    "assSamOutput"
  ];

  let validate = 0
  for (let index in textareaId) {
    validate = validateValueTextarea(textareaId[index], '\n')
    if (!validate) {
      break;
    }
  }

  if (validate) {
    for (let index in textareaId) {
      transformValueTextarea(textareaId[index], 'split', '\n');
    }
  }

  $("#confirmToCreateAssBtn").removeAttr("onclick");
  $("#confirmToCreateAssBtn").attr({
    type: "submit"
  });
  $("#confirmToCreateAssBtn").click();
  $("#confirmToCreateAssBtn").attr({
    type: "button"
  });

  if (!validate) {
    $("#confirmToCreateAssBtn").attr({
      type: "button",
      onclick: "createAssignment()"
    });
  }
}

function updateAssignment() {
  $("#assignmentForm").attr({
    action: "/assignment/updateAssignment",
    method: "POST"
  });

  let textareaId = [
    "assTitle",
    "assWeek",
    "assignmentDesc",
    "assInSpecify",
    "assOutSpecify",
    "assSamInput",
    "assSamOutput"
  ];

  let validate = 0
  for (let index in textareaId) {
    validate = validateValueTextarea(textareaId[index], '\n')
    if (!validate) {
      break;
    }
  }

  if (validate) {
    for (let index in textareaId) {
      transformValueTextarea(textareaId[index], 'split', '\n');
    }
  }

  $("#confirmToCreateAssBtn").removeAttr("onclick");
  $("#confirmToCreateAssBtn").attr({
    type: "submit"
  });
  $("#confirmToCreateAssBtn").click();
  $("#confirmToCreateAssBtn").attr({
    type: "button"
  });

  if (!validate) {
    $("#confirmToCreateAssBtn").attr({
      type: "button",
      onclick: "updateAssignment()"
    });
  }
}
