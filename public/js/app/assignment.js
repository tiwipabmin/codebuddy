$(document).ready(function() {
  $("#assignment-modal").modal({
    closable: false,
    transition: "fade up",
    onApprove: function() {
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
});

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

function transformValueTextarea(textarea, func, separator) {
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
    "assignmentDesc",
    "assInSpecify",
    "assOutSpecify",
    "assSamInput",
    "assSamOutput"
  ];

  for (let index in textareaId) {
    transformValueTextarea(textareaId[index], 'split', '\n');
  }

  $("#confirmToCreateAssBtn").removeAttr("onclick");
  $("#confirmToCreateAssBtn").attr({
    type: "submit"
  });
  $("#confirmToCreateAssBtn").click();
}

function updateAssignment() {
  $("#assignmentForm").attr({
    action: "/assignment/updateAssignment",
    method: "POST"
  });

  let textareaId = [
    "assignmentDesc",
    "assInSpecify",
    "assOutSpecify",
    "assSamInput",
    "assSamOutput"
  ];

  for (let index in textareaId) {
    transformValueTextarea(textareaId[index], 'split', '\n');
  }

  $("#confirmToCreateAssBtn").removeAttr("onclick");
  $("#confirmToCreateAssBtn").attr({
    type: "submit"
  });
  $("#confirmToCreateAssBtn").click();
}
