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

function typeInTextarea(newText, el = document.activeElement) {
  const [start, end] = [el.selectionStart, el.selectionEnd];
  el.setRangeText(newText, start, end, 'select');
}

$(document).ready(function () {

  // $("#assignmentDesc").on("mouseup keydown", function (e) {

  //   if (e.which === 65) typeInTextarea("&nbsp;");

  //   console.log("keydown, ", e.which, e.type)

  // })

  $("#assignment-modal").modal({
    closable: false,
    transition: "fade up",
    onApprove: function () {
      //$('.ui.form').submit();
      return false;
    }
  });
  // $("#assignmentForm").form({
  //   fields: {
  //     title: {
  //       identifier: "title",
  //       rules: [
  //         {
  //           type: "empty",
  //           prompt: "Please enter your title"
  //         }
  //       ]
  //     },
  //     week: {
  //       identifier: "week",
  //       rules: [
  //         {
  //           type: "integer[1...100]",
  //           prompt: "Please enter an integer value"
  //         }
  //       ]
  //     },
  //     description: {
  //       identifier: "description",
  //       rules: [
  //         {
  //           type: "empty",
  //           prompt: "Please enter your description"
  //         }
  //       ]
  //     },
  //     input_specification: {
  //       identifier: "input_specification",
  //       rules: [
  //         {
  //           type: "empty",
  //           prompt: "Please enter your input specification"
  //         }
  //       ]
  //     },
  //     output_specification: {
  //       identifier: "output_specification",
  //       rules: [
  //         {
  //           type: "empty",
  //           prompt: "Please enter your output specification"
  //         }
  //       ]
  //     },
  //     sample_input: {
  //       identifier: "sample_input",
  //       rules: [
  //         {
  //           type: "empty",
  //           prompt: "Please enter your sample input"
  //         }
  //       ]
  //     },
  //     sample_output: {
  //       identifier: "sample_output",
  //       rules: [
  //         {
  //           type: "empty",
  //           prompt: "Please enter your sample output"
  //         }
  //       ]
  //     }
  //   },
  //   onSuccess: function () {
  //     $("#assignment-modal").modal("hide");
  //   }
  // });
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

function setIoSpecificationBlock(inputSpecification, outputSpecification) {
  inputSpecification = JSON.parse(inputSpecification)
  outputSpecification = JSON.parse(outputSpecification)
  // console.log('inputSpecification, ', inputSpecification, ', outputSpecification, ', outputSpecification)
  const max = inputSpecification.length === outputSpecification.length ? inputSpecification.length : 1;
  for (let i = 0; i < max; i++) {
    let secSubCol = $(`<div id="ioSpecBlock-${i + 1}" class="column io-spec"></div>`)
    let thirdSubCol = $(`<div class="ui doubling two column grid"></div>`)
    let inputSpecColumn = $(`<div class="column"><h3 class="ui header"> ${i + 1}. Input Specification</h3><div class="ui segment assignment-detail"><pre>${inputSpecification[i]}</pre></div></div>`)
    let outputSpecColumn = $(`<div class="column"><h3 class="ui header">Output Specification</h3><div class="ui segment assignment-detail"><pre>${outputSpecification[i]}</pre></div></div>`)
    secSubCol.append(thirdSubCol)
    thirdSubCol.append(inputSpecColumn)
    thirdSubCol.append(outputSpecColumn)
    $(`#ioSpecificationGrid`).append(secSubCol)
  }
}

function setSampleIoBlock(sampleInput, sampleOutput) {
  sampleInput = JSON.parse(sampleInput)
  sampleOutput = JSON.parse(sampleOutput)
  // console.log('sampleInput, ', sampleInput, ', sampleOutput, ', sampleOutput)
  const max = sampleInput.length === sampleOutput.length ? sampleInput.length : 1;
  for (let i = 0; i < max; i++) {
    let secSubCol = $(`<div id="sampleIoBlock-${i + 1}" class="column sample-io"></div>`)
    let thirdSubCol = $(`<div class="ui doubling two column grid"></div>`)
    let sampleInputColumn = $(`<div class="column"><h3 class="ui header"> ${i + 1}. Sample Input</h3><div class="ui segment assignment-detail"><pre>${sampleInput[i]}</pre></div></div>`)
    let sampleOutputColumn = $(`<div class="column"><h3 class="ui header">Sample Output</h3><div class="ui segment assignment-detail"><pre>${sampleOutput[i]}</pre></div></div>`)
    secSubCol.append(thirdSubCol)
    thirdSubCol.append(sampleInputColumn)
    thirdSubCol.append(sampleOutputColumn)
    $(`#sampleIoGrid`).append(secSubCol)
  }
}

function onIoSpecBlockClick(e) {
  $(".io-spec.block-selected").attr({
    class: "column io-spec"
  })
  e.attr({
    class: "column io-spec block-selected"
  })
}

function onSampleIoBlockClick(e) {
  $(".sample-io.block-selected").attr({
    class: "column sample-io"
  })
  e.attr({
    class: "column sample-io block-selected"
  })
}

function previewAssignmentForm() {

  $("#leftBtn").attr({
    class: 'ui gray button',
    type: 'button',
    onclick: "backToEditAssignment()"
  })
  $("#leftBtn").text("Edit");
}

function backToEditAssignment() {

  $("#leftBtn").attr({
    class: 'ui blue button',
    type: "button",
    onclick: "previewAssignmentForm()"
  })
  $("#leftBtn").text("Preview");
}

function addIOSpecification() {
  let count = $("#ioSpecificationGrid")[0].childElementCount
  let secSubCol = $(`<div id="ioSpecBlock-${count}" class="column io-spec" onclick="onIoSpecBlockClick($(this))"></div>`)
  let thirdSubCol = $(`<div class="ui two column grid"></div>`)
  let inputSpecColumn = $(`<div class="column"><div class="field"><label>Input Specification :</label><textarea id="assInSpecify-${count}" type="text" name="input_specification${count}" placeholder="Input Specification..." /></div></div>`)
  let outputSpecColumn = $(`<div class="column"><div class="field"><label>Output Specification :</label><textarea id="assOutSpecify-${count}" type="text" name="output_specification${count}" placeholder="Output Specification..." /></div></div>`)
  secSubCol.append(thirdSubCol)
  thirdSubCol.append(inputSpecColumn)
  thirdSubCol.append(outputSpecColumn)
  $(secSubCol).insertBefore("#ioSpecificationBtnRow")
  console.log('Add input/output specification!')
}

function removeIOSpecification() {
  const max = $("#ioSpecificationGrid")[0].childElementCount - 1

  if (max !== 1) {
    const id = $(".io-spec.block-selected").attr("id")
    let number = parseInt(id[id.length - 1])

    let newId = 1
    for (let curId = 1; curId <= max; curId++) {
      if (curId !== number) {
        $(`#ioSpecBlock-${curId}`).attr({
          id: `ioSpecBlock-${newId}`
        })
        $(`#assInSpecify-${curId}`).attr({
          id: `assInSpecify-${newId}`,
          name: `input_specification${newId}`
        })
        $(`#assOutSpecify-${curId}`).attr({
          id: `assOutSpecify-${newId}`,
          name: `output_specification${newId}`
        })
        newId++;
      }
    }
    $(`#${id}`).remove()
  } else {
    alert(`You cannot remove the I/O specification block!`)
  }
}

function addSampleIO() {
  let count = $("#sampleIoGrid")[0].childElementCount
  console.log('Count: ', count)
  let secSubCol = $(`<div id="sampleIoBlock-${count}" class="column sample-io" onclick="onSampleIoBlockClick($(this))"></div>`)
  let thirdSubCol = $(`<div class="ui two column grid"></div>`)
  let sampleInputColumn = $(`<div class="column"><div class="field"><label>Sample Input :</label><textarea id="assSamInput-${count}" type="text" name="sample_input${count}" placeholder="Sample Input..." /></div></div>`)
  let sampleOutputColumn = $(`<div class="column"><div class="field"><label>Sample Output :</label><textarea id="assSamOutput-${count}" type="text" name="sample_output${count}" placeholder="Sample Output..." /></div></div>`)
  secSubCol.append(thirdSubCol)
  thirdSubCol.append(sampleInputColumn)
  thirdSubCol.append(sampleOutputColumn)
  $(secSubCol).insertBefore("#sampleIOBtnRow")
  console.log('Add sample input/output!')
}

function removeSampleIO() {
  const max = $("#sampleIoGrid")[0].childElementCount - 1

  if (max !== 1) {
    const id = $(".sample-io.block-selected").attr("id")
    let number = parseInt(id[id.length - 1])

    let newId = 1
    for (let curId = 1; curId <= max; curId++) {
      if (curId !== number) {
        $(`#sampleIoBlock-${curId}`).attr({
          id: `sampleIoBlock-${newId}`
        })
        $(`#assSamInput-${curId}`).attr({
          id: `assSamInput-${newId}`,
          name: `sample_input${newId}`
        })
        $(`#assSamOutput-${curId}`).attr({
          id: `assSamOutput-${newId}`,
          name: `sample_output${newId}`
        })
        newId++;
      }
    }
    $(`#${id}`).remove()
  } else {
    alert(`You cannot remove the sample I/O block!`)
  }
}

function showDeleteModal() {
  $("#delete-modal").modal("show");
}

function getAssignmentForm(assignment) {
  let title = assignment.title;
  let week = assignment.week;
  let description = assignment.description
  let inputSpecification = JSON.parse(JSON.parse(assignment.input_specification));
  let outputSpecification = JSON.parse(JSON.parse(assignment.output_specification));
  let sampleInput = JSON.parse(JSON.parse(assignment.sample_input));
  let sampleOutput = JSON.parse(JSON.parse(assignment.sample_output));

  $(`#assignment-container`).empty();
  let top = $(`<div class="ui grid segment assignment-detail"><div class="column"><h1 style="text-align:center;">Assignment Form</h1></div></div>`)
  let form = $(`<form id="assignmentForm" class="ui form assignment-form"></form>`)
  let firstPart = $("<div class=\"ui doubling two column grid\">" +
    "<div class=\"twelve wide column\">" +
    "<div class=\"inline fields\">" +
    "<label> Programming Style : </label>" +
    "<select class=\"ui dropdown\" name=\"programming_style\">" +
    "<option value=\"Remote\"> Remote Pair-programming</option>" +
    "<option value=\"Co-located\"> Conventional Pair-programming</option>" +
    "<option value=\"Individual\"> Individual Programming</option>" +
    "</select></div></div>" +
    "<div class=\"four wide column\"><div class=\"inline fields\">" +
    "<label> Week :</label>" +
    "<input id=\"assWeek\" type=\"text\" name=\"week\" placeholder=\"Week\" maxlength=\"3\" />" +
    "</div></div></div>")
  let secondPart = $("<div class=\"ui grid\"><div class=\"sixteen wide column\">" +
    "<div class=\"field\"><label> Description : </label>" +
    "<textarea id=\"assignmentDesc\" type=\"text\" name=\"description\" placeholder=\"Some content...\" />" +
    "</div></div></div>")
  let thirdPart = $("<div id=\"ioSpecificationGrid\" class=\"ui one column grid\"></div>")

  let maxIoSpecLength = inputSpecification.length === outputSpecification.length ? inputSpecification.length : 1;
  for (let i = 0; i < maxIoSpecLength; i++) {
    let secSubCol = $(`<div id="ioSpecBlock-${i + 1}" class="column io-spec" onclick="onIoSpecBlockClick($(this))"></div>`)
    let thirdSubCol = $(`<div class="ui two column grid"></div>`)
    let inputSpecColumn = $(`<div class="column"><div class="field"><label> Input Specification : </label><textarea id="assInSpecify-${i + 1}" row="1" type="text" name="input_specification${i + 1}" placeholder="Input Specification..." /></div></div>`)
    let outputSpecColumn = $(`<div class="column"><div class="field"><label> Output Specification : </label><textarea id="assOutSpecify-${i + 1}" row="1" type="text" name="output_specification${i + 1}" placeholder="Output Specification..." /></div></div>`)
    secSubCol.append(thirdSubCol)
    thirdSubCol.append(inputSpecColumn)
    thirdSubCol.append(outputSpecColumn)
    thirdPart.append(secSubCol)
  }

  let ioSpecBtn = $("<div id=\"ioSpecificationBtnRow\" class=\"column\">"+
  "<div class=\"ui two column grid\"><div class=\"column\">"+
  "<div class=\"ui blue button\" onclick=\"addIOSpecification()\" style=\"width:100%;\">Add</div></div>"+
  "<div class=\"column\"><div class=\"ui red button\" onclick=\"removeIOSpecification()\" style=\"width:100%;\">Remove</div></div></div></div>")

  thirdPart.append(ioSpecBtn)

  let fourthPart = $("<div id=\"sampleIoGrid\" class=\"ui one column grid\"></div>")

  let maxSampleIoLength = sampleInput.length === sampleOutput.length ? sampleInput.length : 1;
  for (let i = 0; i < maxSampleIoLength; i++) {
    let secSubCol = $(`<div id="sampleIoBlock-${i + 1}" class="column sample-io" onclick="onSampleIoBlockClick($(this))"></div>`)
    let thirdSubCol = $(`<div class="ui two column grid"></div>`)
    let sampleInputColumn = $(`<div class="column"><div class="field"><label> Sample Input : </label><textarea id="assSamInput-${i + 1}" row="1" type="text" name="sample_input${i + 1}" placeholder="Sample Input..." /></div></div>`)
    let sampleOutputColumn = $(`<div class="column"><div class="field"><label> Sample Output : </label><textarea id="assSamOutput-${i + 1}" row="1" type="text" name="sample_output${i + 1}" placeholder="Sample Output..." /></div></div>`)
    secSubCol.append(thirdSubCol)
    thirdSubCol.append(sampleInputColumn)
    thirdSubCol.append(sampleOutputColumn)
    fourthPart.append(secSubCol)
  }

  let sampleIoBtn = $("<div id=\"sampleIOBtnRow\" class=\"column\">"+
  "<div class=\"ui two column grid\"><div class=\"column\">"+
  "<div class=\"ui blue button\" onclick=\"addSampleIO()\" style=\"width:100%;\">Add</div></div>"+
  "<div class=\"column\"><div class=\"ui red button\" onclick=\"removeSampleIO()\" style=\"width:100%;\">Remove</div></div></div></div>")

  fourthPart.append(sampleIoBtn)

  let sectionIdInput = $(``)
  let allInfoInput = $(``)
  let fifthPart = $(``)

  form.append(firstPart)
  form.append(secondPart)
  form.append(thirdPart)
  form.append(fourthPart)
  $(`#assignment-container`).append(top)
  $(`#assignment-container`).append(form)
}

function showAssignmentModal(assignment) {
  $(`#ps${assignment.programming_style}`).attr('checked', 'true')
  $(`#assTitle`).val(assignment.title)
  $(`#assWeek`).val(assignment.week)
  $(`#assignmentDesc`).val(assignment.description.replace(/&nbsp;/g, " ").replace(/<br>/g, "\n"))
  $(`#assInSpecify-1`).val(assignment.input_specification.replace(/&nbsp;/g, " ").replace(/<br>/g, "\n"))
  $(`#assOutSpecify-1`).val(assignment.output_specification.replace(/&nbsp;/g, " ").replace(/<br>/g, "\n"))
  $(`#assSamInput`).val(assignment.sample_input.replace(/&nbsp;/g, " ").replace(/<br>/g, "\n"))
  $(`#assSamOutput`).val(assignment.sample_output.replace(/&nbsp;/g, " ").replace(/<br>/g, "\n"))
  $("#assignmentForm").append(`<input type='hidden' name='assignment_id', value=\'${assignment.assignment_id}\'/>`)

  $("#confirmToCreateAssBtn").attr({
    onclick: "updateAssignment()"
  })
  $("#assignment-modal").modal("show");
}

function validateValueInTextarea(textarea, separator) {
  let valueTextarea = []
  valueTextarea = $(`#${textarea}`)
    .val()
    .split(separator);

  if (textarea === 'assWeek') {
    if (!isNaN(parseInt($(`#${textarea}`).val()))) {
      return 1
    }
  } else if ((valueTextarea.length === 1 && valueTextarea[0] !== '') || valueTextarea.length > 1) {
    return 1
  } else
    return 0
}

function changeValueTextArea(value = [], searchValue, newValue) {
  for (let index in value) {
    value[index] = value[index].replace(searchValue, newValue);
  }
}

function transformValueTextarea(textarea, func, separator) {

  if (textarea === 'assTitle' || textarea === 'assWeek') {
    return $(`#${textarea}`).val()
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
  return valueTextarea
  // $(`#${textarea}`).val(JSON.stringify(valueTextarea));
}

function createAssignment() {
  $("#assignmentForm").attr({
    action: "/assignment",
    method: "POST"
  });

  let countIoSpec = $("#ioSpecificationGrid")[0].childElementCount - 1
  let countSamIo = $("#sampleIoGrid")[0].childElementCount - 1

  let textareaId = [
    "assTitle",
    "assWeek",
    "assignmentDesc"
  ];

  const max = countIoSpec > countSamIo ? countIoSpec : countSamIo;
  let assIoSpec = []
  let assSamIo = []
  let ioSpecFormValidation = {}
  let samIoFormValidation = {}

  for (let i = 1; i <= max; i++) {
    if (i <= countIoSpec) {
      assIoSpec.push(`assInSpecify-${i}`)
      assIoSpec.push(`assOutSpecify-${i}`)
      ioSpecFormValidation[`input_specification${i}`] = {
        identifier: `input_specification${i}`,
        rules: [
          {
            type: "empty",
            prompt: `Please enter your input specification ${i}.`
          }
        ]
      }
      ioSpecFormValidation[`output_specification${i}`] = {
        identifier: `output_specification${i}`,
        rules: [
          {
            type: "empty",
            prompt: `Please enter your output specification ${i}.`
          }
        ]
      }
    }

    if (i <= countSamIo) {
      assSamIo.push(`assSamInput-${i}`)
      assSamIo.push(`assSamOutput-${i}`)
      samIoFormValidation[`sample_input${i}`] = {
        identifier: `sample_input${i}`,
        rules: [
          {
            type: "empty",
            prompt: `Please enter your sample input ${i}.`
          }
        ]
      }
      samIoFormValidation[`sample_output${i}`] = {
        identifier: `sample_output${i}`,
        rules: [
          {
            type: "empty",
            prompt: `Please enter your sample output ${i}.`
          }
        ]
      }
    }
  }

  textareaId = [...textareaId, ...assIoSpec, ...assSamIo]
  // console.log('TextareaId, ', textareaId)

  let formValidation = {
    fields: {
      title: {
        identifier: "title",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your title."
          }
        ]
      },
      week: {
        identifier: "week",
        rules: [
          {
            type: "integer[1...100]",
            prompt: "Please enter an integer value in the week input."
          }
        ]
      },
      description: {
        identifier: "description",
        rules: [
          {
            type: "empty",
            prompt: "Please enter your description."
          }
        ]
      },
      ...ioSpecFormValidation,
      ...samIoFormValidation
    },
    onSuccess: function () {
      $("#assignment-modal").modal("hide");
    }
  }

  // console.log('Form, ', formValidation)

  $("#assignmentForm").form(formValidation);

  let validate = 0
  for (let index in textareaId) {
    validate = validateValueInTextarea(textareaId[index], '\n')
    if (!validate) {
      break;
    }
  }

  if (validate) {
    let allInfo = {}
    let valueTextarea = []
    let id = ""
    for (let index in textareaId) {
      id = textareaId[index]
      valueTextarea = transformValueTextarea(id, 'split', '\n');
      if (id.indexOf("Specify") > 0) {
        if (id.indexOf("In") > 0) {

          if (allInfo["input_specification"] === undefined) {
            allInfo["input_specification"] = []
          }

          allInfo["input_specification"].push(valueTextarea)

        } else if (id.indexOf("Out") > 0) {

          if (allInfo["output_specification"] === undefined) {
            allInfo["output_specification"] = []
          }

          allInfo["output_specification"].push(valueTextarea)

        }
      } else if (id.indexOf("Sam") > 0) {
        if (id.indexOf("Input") > 0) {

          if (allInfo["sample_input"] === undefined) {
            allInfo["sample_input"] = []
          }

          allInfo["sample_input"].push(valueTextarea)

        } else if (id.indexOf("Output") > 0) {

          if (allInfo["sample_output"] === undefined) {
            allInfo["sample_output"] = []
          }

          allInfo["sample_output"].push(valueTextarea)

        }
      } else {
        allInfo[$(`#${id}`).attr("name")] = valueTextarea
      }
    }
    // console.log('All Info 1, ', allInfo)
    $(`#allInfo`).val(
      JSON.stringify(allInfo)
    )
  }

  // console.log('All Info 2, ', $(`#allInfo`).val())

  $("#rightBtn").removeAttr("onclick");
  $("#rightBtn").attr({
    type: "submit"
  });
  $("#rightBtn").click();
  $("#rightBtn").attr({
    type: "button"
  });

  if (!validate) {
    $("#rightBtn").attr({
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
    "assInSpecify-1",
    "assOutSpecify-1",
    "assSamInput",
    "assSamOutput"
  ];

  let validate = 0
  for (let index in textareaId) {
    validate = validateValueInTextarea(textareaId[index], '\n')
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
