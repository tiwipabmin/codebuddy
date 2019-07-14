$(document).ready(function() {
    // import * as moment from 'moment'
    pairingOrViewingisHided('pair')
    // $('#resetPair-button').click(function(){
    //   parameters = {partner_id: 'NULL', section_id: $('#section_id').attr('value')}
    //   $.ajax({
    //     url: 'classroom/resetPair',
    //     type: 'put',
    //     data: parameters,
    //     success: function (data) {
    //       const status = data.status
    //       if(status == 'Update completed.') {
    //         alert('Reset pairing completed!')
    //       } else if(status == 'Update failed.') {
    //         alert(status)
    //       }
    //     }
    //   })
    // })
    $('#student_list_modal').modal({
      closable: false,
    });
    $('#partner_selection_modal').modal({
      closable: false,
    });
    $('#confirm-pairing').click(function(){
      const session_status = $('.newPairingSession').attr('value')
      if(session_status <= 0 && $('#confirm-pairing').attr('value') == 'create'){
        //console.log('#confirm-pairing : ' + $('#pairing_session_id').attr('value') + ', session_status : ' + $('.newPairingSession').attr('value'))
        parameters = {pairing_session_id: $('#pairing_session_id').attr('value'), section_id: $('#section_id').attr('value'), partner_keys: $('#partner_keys').attr('value'), pairing_objective: $('#pairing_objective').attr('value'), student_objects: $('#student_objects').attr('value')}
        $.post('/classroom/createPairingRecord', parameters, function(data){
          const res_status = data.res_status
          const pairing_sessions = JSON.parse(data.pairing_sessions)
          const section_id = data.section_id
          if(res_status == 'There is no student in the classroom!'){
            alert(res_status)
          } else if(res_status == 'Please pair all students!'){
            alert(res_status)
            $('#student_list_modal').modal('show');
          } else if(res_status == 'Update completed.'){
            set_item_pagination_in_third_container(pairing_sessions, section_id, 0)
            on_click_page_number_in_third_container(1)
            $('.newPairingSession').attr('value', 1)
          } else {
            alert(status)
          }
        })
      } else if (session_status == 1 && $('#confirm-pairing').attr('value') == 'change'){
        let parameters = {partner_keys: JSON.parse($('#partner_keys').attr('value')), cloning_partner_keys: JSON.parse($('#cloning_partner_keys').attr('value')), pairing_objective: JSON.parse($('#pairing_objective').attr('value')), pairing_session_id: $('#pairing_session_id').attr('value'), section_id: $('#section_id').attr('value')}
        console.log('parameters, ', parameters)
        $.ajax({
          url: '/classroom/updatePairing',
          type: 'put',
          data: parameters,
          success: function(data){
            var status = data.status
            if(status == 'Update pairing successfully') {
              $('#partner_keys').attr('value', {})
              $('#cloning_partner_keys').attr('value', {})
              $('#pairing_objective').attr('value', {})
              pairingOrViewingisHided('view')
              alert(status)
            } else if(status == 'Please pair all students!'){
              alert(status)
              $('#student_list_modal').modal('show');
            } else {
              alert(status)
            }
            $('#confirm-pairing').attr('value', 'create')
          }
        })
      } else {
        $('#alert-header').text('Pairing session')
        $('#alert-message').text('You can\'t create session!')
        $('#alert-modal').modal('show')
      }
    })
    $('#cancel-pairing').click(function(){

      const message = $('#confirm-message').attr('value');
      if(message == 'Are you sure you want to cancel pairing?'){
        $('#confirm-modal').modal('show');
      } else {
        $('#alphabetical_filter').attr('class', 'ui button')
        $('#alphabetical_filter').attr('value', 'A-Z')
        $('#alphabetical_filter').text('A-Z')

        $('#avg_score_filter').attr('class', 'ui button')
        $('#avg_score_filter').attr('value', '1-100')
        $('#avg_score_filter').text('1-100')

        $('#active_filter').attr('value', '')
        $('#confirm-pairing').attr('value', 'create')
      }

    })
    $('#confirm-button').click(function(){

      const message = $('#confirm-message').attr('value');

      if(message == 'Are you sure you want to cancel pairing?'){
        $('#partner_keys').attr('value', '{}')
        $('#pairing_objective').attr('value', '{}')

        $('#alphabetical_filter').attr('class', 'ui button')
        $('#alphabetical_filter').attr('value', 'A-Z')
        $('#alphabetical_filter').text('A-Z')

        $('#avg_score_filter').attr('class', 'ui button')
        $('#avg_score_filter').attr('value', '1-100')
        $('#avg_score_filter').text('1-100')

        $('#active_filter').attr('value', '')
        $('#confirm-pairing').attr('value', 'create')

      } else if(message == 'Are you sure you want to complete this pairing session?'){
        var parameters = {pairing_session_id: $('#inp_cm').attr('value'), section_id: $('#section_id').attr('value'), status: 0}
        $.ajax({
          url: '/classroom/updatePairingSession',
          type: 'put',
          data: parameters,
          success: function(data){
            let status = data.status
            let pairing_session = JSON.parse(data.pairing_sessions)
            let section_id = data.section_id
            if(status == 'Update completed.') {
              set_item_pagination_in_third_container(pairing_session, section_id, 0)
              on_click_page_number_in_third_container(1)
              $('.newPairingSession').attr('value', 0);
            } else {
              alert(status)
            }
            // $('#createPairingDateTime').attr('value', 0)
          }
        })
      } else if(message == 'Are you sure you want to assign these assignments to all student pairs?'){
        parameters = JSON.parse($('#inp_cm').attr('value'))
        $.post('/classroom/assignAssignment', parameters, function (data){
          var res_status = data.res_status
          if(res_status == 'Please pair all students before assign the assignment!'){
            alert(res_status)
          } else if(res_status == 'You already assigned these assignments!') {
            alert(res_status)
          } else if(res_status == 'Successfully assigned this assignment!') {
            alert(res_status)
          } else if(res_status == 'Completed test!') {
            alert(res_status)
          }
        })
      } else if (message == 'Are you sure you want to remove the student from this classroom?'){
        var enrollment_id = $('#inp_cm').attr('value')
        $.ajax({
          url: '/api/removeStudent',
          type: 'delete',
          data: {
            enrollment_id
          },
          success: function (res) {
            if(res.status == 'Remove the student from the classroom complete.') {
              $('#' + enrollment_id).remove()
            } else {
              alert(res.status)
            }
          }
        })
      } else if (message == 'Are you sure you want to delete this assignment?') {
        assignment_id = $('#inp_cm').attr('value')
        $.ajax({
          url: '/api/deleteAssignment',
          type: 'delete',
          data: {
            assignment_id
          },
          success: function (res) {
            if(res.status == 'delete this assignment complete.') {
              $('#a' + assignment_id).remove()
            } else {
              alert(res.status)
            }
          }
        })
      }

      $('#confirm-message').attr('value', 'Something message.')
    })
    $('#cancel-button').click(function(){

      const message = $('#confirm-message').attr('value');
      if(message == 'Are you sure you want to cancel pairing?'){
        $('#student_list_modal').modal('show');
      }

    })
    $('#back-to-student-list-modal').click(function () {
      $('#student_list_modal').modal('show');
    })
    $('.menu .item').tab();
    $('.ui-purpose').click(function() {
        const index = $('.ui-purpose').index(this)
        $('.ui-purpose').removeClass('teal inverted')
        $('#ui-purpose-'+index).addClass('teal inverted')
        const purpose = $(this).data("purpose")
        const section_id = $('#section_id').attr('value')
        const avg_score = $('#avg_score_inp_psm').attr('value')
        const username = $('#username_inp_psm').attr('value')
        var parameters = { purpose: purpose, section_id: section_id, avg_score: avg_score, username: username};
        $.get( 'classroom/searchStudentByPurpose',parameters, function(data) {
            $(".user-purpose-list").empty();
            var students = data.students
            var purpose = data.purpose
            var pairing_objective = JSON.parse($('#pairing_objective').attr('value'))
            if (students.length > 0) {
                students.forEach(function(student) {
                  if(pairing_objective[student.enrollment_id] == -1) {
                    $(".user-purpose-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id_inp_psm').attr('value')+","+student.enrollment_id+",\""+purpose+"\",2)'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui green label'> Available </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
                  } else {
                    $(".user-purpose-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id_inp_psm').attr('value')+","+student.enrollment_id+",\""+purpose+"\",2)'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui red label'> Paired </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
                  }
                }, this);
            } else {
                $(".user-purpose-list").append("<li class='ui item'>No results</li>")
            }
        })

    })
})

function searchStudent(e, section_id){
  //console.log('section_id: ' + section_id)
  var parameters = { search: e.value, section_id: section_id, username: $('#username_inp_psm').attr('value') };
  $.get( 'classroom/searchStudent',parameters, function(data) {
    const students = data.students
    const purpose = data.purpose
    const pairing_objective = JSON.parse($('#pairing_objective').attr('value'))
    $(".user-list").empty();
    if (students.length > 0) {
      students.forEach(function(student) {
        if(pairing_objective[student.enrollment_id] == -1) {
          $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id_inp_psm').attr('value')+","+student.enrollment_id+",\""+purpose+"\",2)'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui green label'> Available </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
        } else {
          $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id_inp_psm').attr('value')+","+student.enrollment_id+",\""+purpose+"\",2)'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui red label'> Paired </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
        }
      }, this);
    } else {
      $(".user-list").append("<li class='ui item'>No results</li>")
    }
  })
}

function onClickAddPartnerButton(first_param, second_param, third_param, opt) {
  // console.log('partner_keys, ', JSON.parse($('#partner_keys').attr('value')), ', pairing_objective, ', JSON.parse($('#pairing_objective').attr('value')))
  switch (opt) {
    case 1:
      var enrollment_id = first_param
      var avg_score = second_param
      var username = third_param
      //make user list is empty on search user panel
      $(".user-list").empty();
      $(".user-list").append("<div class='li ui item'>Search result</div>")

      //console.log('section_id : ' + $('#section_id').attr('value') + ', enrollment_id : ' + enrollment_id + ', avg_score : ' + avg_score + ', username : ' + username)
      $('.student-score').text('Student score ' + parseFloat(avg_score).toFixed(2))
      $('#student_id_inp_psm').attr('value', enrollment_id)
      $('#avg_score_inp_psm').attr('value', avg_score)
      $('#username_inp_psm').attr('value', username)
      $(".user-purpose-list").empty();
      $(".user-purpose-list").append("<li class='ui item'>Please select your purpose.</li>");
      $('#partner_selection_modal').modal('show')
      break;
    case 2:
      var student_id = first_param
      var partner_id = second_param
      var purpose = third_param

      var partner_keys = JSON.parse($('#partner_keys').attr('value'))
      var pairing_objective = JSON.parse($('#pairing_objective').attr('value'))
      var key;
      var addSamePartner = false

      // partner_id is value in partner_keys
      // ex. partner_keys = {0: 1, 2: 3} expected {0: -1, 2: 1, 3: -1}
      // pair student_id = 2 with partner_id = 1 will make undefined
      if (partner_keys[partner_id] === undefined) {
        key = Object.keys(partner_keys).find(key => partner_keys[key] === partner_id)
        if(key == student_id) {
          addSamePartner = true
        }
      } else {
        key = partner_keys[partner_id]
      }

      if(partner_keys[student_id] < 0 && pairing_objective[partner_id] != -1) {
        partner_keys[key] = -1
        pairing_objective[key] = -1
      } else if(partner_keys[student_id] > 0 && !addSamePartner) {
          if(pairing_objective[partner_id] == -1){
            partner_keys[partner_keys[student_id]] = -1
            pairing_objective[partner_keys[student_id]] = -1
          } else {
            partner_keys[key] = -1
            pairing_objective[key] = -1

            partner_keys[partner_keys[student_id]] = -1
            pairing_objective[partner_keys[student_id]] = -1
        }
      }
      //add new partner to student
      partner_keys[student_id] = partner_id
      delete partner_keys[partner_id]

      pairing_objective[student_id] = purpose
      pairing_objective[partner_id] = purpose
      $('#partner_keys').attr('value', JSON.stringify(partner_keys))
      $('#pairing_objective').attr('value', JSON.stringify(pairing_objective))
      $('#confirm-header').text('Student pairing')
      $('#confirm-message').text('Are you sure you want to cancel pairing?')
      $('#confirm-message').attr('value', 'Are you sure you want to cancel pairing?')
      //console.log('partner_keys: ', partner_keys ,', pairing_objective_'+student_id+' : ' + pairing_objective[student_id] +', pairing_objective_'+partner_id+' : ' + pairing_objective[partner_id])
      showStudentList('pair', $('#pairing_session_id').attr('value'))
      break;
  }
}

function showStudentList(command, pairing_session_id){
  var parameter = { partner_keys: $('#partner_keys').attr('value'), pairing_objective: $('#pairing_objective').attr('value'), section_id: $('#section_id').val(), pairing_session_id: pairing_session_id, command: command};
  $.get('classroom/getStudentsFromSection',parameter, function(data) {
    var count = 0
    const student_objects = data.student_objects
    const partner_keys = data.partner_keys
    const pairing_objective = data.pairing_objective
    const pairing_session_status = data.pairing_session_status
    const command = data.command
    var addPartnerButton = "";
    $('#student_objects').attr('value', JSON.stringify(student_objects))

    var completed_filter = false
    var hasElementMoving = false

    if(command == 'pair') {
      if(pairing_session_status == 1) {
        $('#change_pair').show()
      } else {
        $('#change_pair').hide()
      }

    } else if(command == 'view') {
      if(pairing_session_status == 1) {
        $('#change_pair').show()
      } else {
        $('#change_pair').hide()
      }
    }

    $('.student-container').empty();
    for (key in partner_keys) {
      if(partner_keys[key] < 0) {

        $('.student-container').append("<li id='"+key+"' class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='images/user_img_0.jpg' style='visibility:hidden;'></img><div class='content'><div class='right floated content'><div class='ui button add-user-button' style='margin-top: 22px;' onclick='onClickAddPartnerButton("+ student_objects[key].enrollment_id + "," + student_objects[key].avg_score + ",\"" + student_objects[key].username.toString() + "\",1)'>Add</div></div><div class='description'><div style='font-size: 12px; visibility:hidden;'>total active time: "+pad(parseInt(0/3600))+":"+pad(parseInt((0-(parseInt(0/3600)*3600))/60))+":"+pad(parseInt(0%60))+"</div><font color='#5D5D5D'> Empty </font><div class='ui circular labels' style='margin-top:2.5px; visibility:hidden;'><a class='ui teal label'> score "+parseFloat(0).toFixed(2)+"</a></div></div></div></div></div></div></div><div class='ui vertical divider'> - </div></li>")

      } else {

        if(command == 'pair') {
          addPartnerButton = "<div class='ui button add-user-button' style='margin-top: 22px;' onclick='onClickAddPartnerButton("+ student_objects[key].enrollment_id + "," + student_objects[key].avg_score + ",\"" + student_objects[key].username.toString() + "\",1)'>Add</div>"
        }
        var pairing_objective_str = pairing_objective[key];
        if(pairing_objective_str == 'quality') {
          pairing_objective_str = "<i class='line chart icon'></i>"
        } else if(pairing_objective_str == 'experience') {
          pairing_objective_str = "<i class='line idea icon'></i>"
        } else if(pairing_objective_str == 'train') {
          pairing_objective_str = "<i class='line student icon'></i>"
        } else {
          pairing_objective_str = "<i class='search icon'></i>"
        }

        $('.student-container').append("<li id='"+key+"' class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[partner_keys[key]].img+"'></img><div class='content'><div class='right floated content'>"+addPartnerButton+"</div><div class='header'>"+student_objects[partner_keys[key]].first_name+" "+student_objects[partner_keys[key]].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'> score "+parseFloat(student_objects[partner_keys[key]].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[partner_keys[key]].total_time/3600))+":"+pad(parseInt((student_objects[partner_keys[key]].total_time-(parseInt(student_objects[partner_keys[key]].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[partner_keys[key]].total_time%60))+"</div></div></div></div></div></div></div><div class='ui vertical divider'> "+pairing_objective_str+" </div></li>")
      }
      count++;
    }
    if(!count) {
      $('.student-container').append("<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><font>No student.</font></div><div class='column'><font>No student.</font></div></div><div class='ui vertical divider'> - </div></div>")
    } else {
      $('#partner_keys').attr('value', JSON.stringify(partner_keys))
      $('#pairing_objective').attr('value', JSON.stringify(pairing_objective))

      var active_filter = $('#active_filter').attr('value')
      if(active_filter == 'A-Z') {
        sort_A_to_Z(student_objects, completed_filter, hasElementMoving)
      } else if(active_filter == 'Z-A') {
        sort_Z_to_A(student_objects, completed_filter, hasElementMoving)
      } else if(active_filter == '1-100') {
        sort_avg_score_1_to_100(student_objects, completed_filter, hasElementMoving)
      } else if(active_filter == '100-1') {
        sort_avg_score_100_to_1(student_objects, completed_filter, hasElementMoving)
      }
      //console.log('pairing_objective : ', data.pairing_objective)
      //console.log('partner_keys : ', data.partner_keys)
    }
    $('#student_list_modal').modal('show');
  })
}

function onClickCreateSession(pairing_session_id, session_status){
  if($('.newPairingSession').attr('value') <= 0) {
    $('#partner_keys').attr('value', '{}')
    $('#pairing_objective').attr('value', '{}')
    pairingOrViewingisHided('pair')
    showStudentList('pair', $('#pairing_session_id').attr('value'))
  } else {
    $('#alert-header').text('Pairing session')
    $('#alert-message').text('Cannot create a new session! Please set current session to completed before create a new session.')
    $('#alert-modal').modal('show')
  }
}

function onClickCompletedSessionMenu(pairing_session_id){
  //console.log('pairing_session_id: ' + pairing_session_id)
  $('#inp_cm').attr('value', pairing_session_id)
  $('#confirm-header').text('Complete pairing session')
  $('#confirm-message').text('Are you sure you want to complete this pairing session?')
  $('#confirm-message').attr('value', 'Are you sure you want to complete this pairing session?')
  $('#confirm-modal').modal('show')
}

function pairingOrViewingisHided(command){
  if(command == 'pair') {
    $('#confirm-pairing').show()
    $('#cancel-pairing').show()
    $('#close_student_list').hide()
  } else if (command == 'view') {
    $('#confirm-pairing').hide()
    $('#cancel-pairing').hide()
    $('#close_student_list').show()
  }
}

function onClickViewPairingRecord(pairing_session_id) {
  $('#partner_keys').attr('value', '{}')
  $('#pairing_objective').attr('value', '{}')
  //console.log('pairing_session_id : ' + pairing_session_id)
  pairingOrViewingisHided('view')
  showStudentList('view', pairing_session_id)
}

function onClickAssign(section_id, pairing_session_id, assignment_id, title, description, programming_style) {
  var parameters = {section_id: section_id, pairing_session_id: pairing_session_id, assignment_id: assignment_id, title: title, description: description, programming_style: programming_style}
  $('#inp_cm').attr('value', JSON.stringify(parameters))
  $('#confirm-header').text('Assign assignment')
  $('#confirm-message').attr('value', 'Are you sure you want to assign this assignment to all student pairs?')
  $('#confirm-message').text('Are you sure you want to assign this assignment to all student pairs?')
  $('#confirm-modal').modal('show');
}

function on_click_assign_button(assignment_of_week, pairing_session_id) {
  assignment_of_week = JSON.parse(assignment_of_week)
  let assignment_is_selected = []
  let assignment_id = -1;
  assignment_of_week.forEach(function(e){
    $('#'+e.assignment_id+'_is_selected').is(':checked') == true ? assignment_is_selected.push(e) : null
  })
  // console.log('assignment_is_selected, ', assignment_is_selected)
  if(assignment_is_selected.length) {
    parameters = {assignment_set: assignment_is_selected, pairing_session_id: pairing_session_id}
    $('#inp_cm').attr('value', JSON.stringify(parameters))
    $('#confirm-header').text('Assign assignment')
    $('#confirm-message').attr('value', 'Are you sure you want to assign these assignments to all student pairs?')
    $('#confirm-message').text('Are you sure you want to assign these assignments to all student pairs?')
    $('#confirm-modal').modal('show');
  } else {
    $('#alert-header').text('Select assignment')
    $('#alert-message').text('Please!!!, select an assignment before click the \"assign\" button.')
    $('#alert-modal').modal('show')
  }
}

function onClickDeleteAssignment(assignment_id) {
  var assingment_id = assignment_id
  $('#inp_cm').attr('value', assignment_id)
  $('#confirm-header').text('Delete assignment')
  $('#confirm-message').attr('value', 'Are you sure you want to delete this assignment?')
  $('#confirm-message').text('Are you sure you want to delete this assignment?')
  $('#confirm-modal').modal('show');
}

function on_click_remove_student_button(enrollment_id, first_name, last_name) {
  $('#inp_cm').attr('value', enrollment_id)
  $('#confirm-header').text('Remove Student')
  $('#confirm-message').attr('value', 'Are you sure you want to remove the student from this classroom?')
  $('#confirm-message').text('Are you sure you want to remove \"' + first_name + ' ' + last_name + '\" from this classroom?')
  $('#confirm-modal').modal('show')
}

function get_items_of_week(items, range, week) {
  week = week.split('week')
  week = parseInt(week[0])
  let items_of_week = []

  for (_index in items){
    if(items[_index].week == week) {
      items_of_week.push(items[_index])
    } else if (week < 0) {
      items_of_week.push(items[_index])
    }
  }

  let pagination = []
  let page = 1;
  let count = 0;
  for (_index in items_of_week) {
    items_of_week[_index].page = page
    count++
    if(count % range == 0 || _index == (items_of_week.length) - 1) {
      pagination.indexOf(page) == -1 ? pagination.push(page) : null;
      page++
    }
  }

  return {items_of_week: items_of_week, pagination: pagination}
}

function checkbox_event(assignment_set, id, opt) {
  let assignment_of_week_ = get_items_of_week(assignment_set, 5, id).items_of_week
  switch (opt) {
    //on click the "Check All of Box" button
    case 1:
      assignment_of_week_.forEach(function(e){
        $('#'+e.assignment_id+'_is_selected').prop('checked', true)
      })

      break;
    //on click the "Clear Checkbox" button
    default:
      assignment_of_week_.forEach(function(e){
        $('#'+e.assignment_id+'_is_selected').prop('checked', false)
      })
  }
}

function on_click_weeks_dropdown(id, assignment_set, username, img, pairing_session_id, opt) {
  // $('#first_container_segment').append('<div class=\'ui active centered inline loader\'></div>')
  assignment_set = assignment_set
  let res_obj = get_items_of_week(assignment_set, 5, id)
  let assignment_of_week_ = res_obj.items_of_week
  let pagination = res_obj.pagination

  set_item_pagination_in_first_container(pagination, assignment_of_week_, username, img, id, opt)

  $('#assign_button').attr('onclick', 'on_click_assign_button('+JSON.stringify(JSON.stringify(assignment_of_week_))+', '+pairing_session_id+')')
  $('div').remove('#assignment_pagination')
  if(pagination[pagination.length - 1] == 1) {
    pagination = []
  } else {
    $('<div class=\'ui pagination menu\' id=\'assignment_pagination\'></div>').insertAfter('#button_head_in_first_container')
  }

  let item = null;
  for(_index in pagination) {
    item = $('<a class=\'item fc\' id=\'page_'+pagination[_index]+'_first_container\' onclick=\'on_click_page_number_in_first_container('+pagination[_index]+')\'>'+pagination[_index]+'</a>')
    $('#assignment_pagination').append(item)
  }
  on_click_page_number_in_first_container(1)
}

function on_click_page_number_in_first_container(page) {
  $('.active.item.fc').attr({
    class: 'item fc'
  })
  $('#page_'+page+'_first_container').attr({
    class: 'active item fc'
  })

  $('.active.first.container').attr({
    class: 'ui divided items first container',
    style: 'display: none'
  })
  $('#items_first_container'+page).attr({
    class: 'ui divided items active first container',
    style: 'display: block'
  })
}

function set_item_pagination_in_first_container(pagination, items_of_week, username, img, week, opt) {
  let item = null;
  let content = null;
  let grid = null;
  let description = null;
  $('div').remove('.active.first.container')
  $('div').remove('.items.first.container')
  for (_index_p in pagination) {

    $('div').remove('#items_first_container'+pagination[_index_p])
    $('#segment_in_first_container').append('<div class=\'ui divided items first container\' id=\'items_first_container'+pagination[_index_p]+'\'></div>')

    if(pagination[_index_p] == 1) {
      $('#items_first_container'+pagination[_index_p]).attr('class', 'ui divided items active first container')
    } else if(pagination[_index_p] > 1) {
      $('#items_first_container'+pagination[_index_p]).attr('style', 'display: none')
    }

    for (_index_i in items_of_week) {
      if(items_of_week[_index_i].page == pagination[_index_p]) {
        switch (opt) {
          case 0:
            let fourteen_wide_column = null;
            let two_wide_column = null;
            let checkbox = null;
            let assignment = items_of_week[_index_i];
            item = $('<div class=\'item\' id=\'a'+assignment.assignment_id+'\'></div>')
            content = $('<div class=\'content\'><b style=\'font-size:1.5em; padding-left:15px; padding-right:15px;\'><a class=\'header\' href=\'/assignment?section_id='+assignment.section_id+'&assignment_id='+assignment.assignment_id+'\'>'+assignment.title+'</b></div>')
            description = $('<div class=\'description\'>')
            grid = $('<div class=\'ui grid\'></div>')
            fourteen_wide_column = $('<div class=\'fourteen wide column assignment_is_selected\' onclick=\'on_click_assignment(1, \"'+assignment.assignment_id+'_is_selected\")\'><p style=\'padding-left:15px; padding-right:15px;\'>'+assignment.description+'</p><p style=\'padding-left:15px; padding-right:15px;\'>Programming Style : '+assignment.programming_style+'</p></div>')
            two_wide_column = $('<div class=\'two wide column\'></div>')
            checkbox = $('<div class=\'ui checkbox\'><input class=\'checkbox_is_clicked\' type=\'checkbox\' id=\''+assignment.assignment_id+'_is_selected\' onclick=\'on_click_assignment(0, \"'+assignment.assignment_id+'_is_selected\")\'/><label></label></div>')
            item.append(content)
            content.append(description)
            description.append(grid)
            grid.append(fourteen_wide_column)
            grid.append(two_wide_column)
            two_wide_column.append(checkbox)
            $('#items_first_container'+pagination[_index_p]).append(item)
            break;
          default:
            let section_id = $('#section_id').attr('value')
            let div_a = null
            let img1 = null
            let img2 = null
            let img3 = null
            let eleven_wide_column = null
            let project = items_of_week[_index_i]
            if(project.creator == username) {
              item = $('<div class=\'item\' style=\'padding-top:10px; padding-bottom:10px;\'></div>')
              div_a = $('<a href=\'/project?pid='+project.pid+'&user_role=creator&section_id='+section_id+'\' class=\'ui tiny image\' ></a>')
              img1 = $('<img src=\'/images/blue-folder.png\', style=\'position: absolute;\'/>')
              img2 = $('<img class=\'ui avatar image\' src=\''+img+'\', style=\'width: 30px;height: 30px;left:25px;top: 20px;\'/>')
              content = $('<div class=\'content\'></div>')
              grid = $('<div class=\'ui grid\'></div>')
              eleven_wide_column = $('<div class=\'eleven wide column\'><b style=\'font-size:1.2em;\'><a class=\'header\' href=\'/project?pid='+project.pid+'&user_role=creator&section_id='+section_id+'\'>'+project.title+'</a></b></div>')
              description = $('<div class=\'description\'>'+project.description+'<br> Last updated '+moment(project.createdAt).fromNow()+' <a href=\'/profile/'+project.collaborator+'\'> @'+project.collaborator+'</a></div>')
              div_a.append(img1)
              div_a.append(img2)
              content.append(grid)
              grid.append(eleven_wide_column)
              eleven_wide_column.append(description)
              item.append(div_a)
              item.append(content)
            } else {
              item = $('<div class=\'item\' style=\'padding-top:10px;\'></div>')
              div_a = $('<a class=\'ui tiny image\' href=\'/project?pid='+project.pid+'&user_role=creator&section_id='+section_id+'\'></a>')
              img1 = $('<img src=\'/images/yellow-folder.png\', style=\'position: absolute;\'/>')
              img2 = $('<img class=\'img-owner ui avatar image\' src=\''+img+'\', style=\'width: 30px;height: 30px; top: 20px;\'/>')
              img3 = $('<img class=\'img-partner ui avatar image\' src=\'/images/user_img_4.jpg\', style=\'width:30px; height:30px; top:-10px;\'/>')
              content = $('<div class=\'content\'><b style=\'font-size:1.2em;\'><a href=\'/project?pid='+project.pid+'&user_role=collaborator&section_id='+section_id+'\'>'+project.title+'</a></b></div>')
              description = $('<div class=\'description\' style=\'margin-top:0px;\'>'+project.description+'<br> Last updated '+moment(project.createdAt).fromNow()+' <a href=\'/profile/'+project.creator+'\'> @'+project.creator+'</a></div>')
              div_a.append(img1)
              div_a.append(img2)
              div_a.append(img3)
              content.append(description)
              item.append(div_a)
              item.append(content)
            }
            $('#items_first_container'+pagination[_index_p]).append(item)
        }
      }
    }
  }
}

function on_click_page_number_in_second_container(page) {
  $('.active.item.sc').attr({
    class: 'item sc'
  })
  $('#page_'+page+'_second_container').attr({
    class: 'active item sc'
  })

  $('.active.second.container').attr({
    class: 'ui middle aligned divided list second container',
    style: 'display: none'
  })
  $('#items_second_container'+page).attr({
    class: 'ui middle aligned divided list active second container',
    style: 'display: block'
  })
}

function set_item_pagination_in_second_container(students, section_id, occupation) {
  let res_obj = get_items_of_week(students, 10, '-1week')
  students = res_obj.items_of_week
  let pagination = res_obj.pagination

  let item = null
  let student = null
  let content = null
  let img = null

  for (_index_p in pagination) {

    $('div').remove('#items_second_container'+pagination[_index_p])
    $('#segment_in_second_container').append('<div class=\'ui middle aligned divided list second container\' id=\'items_second_container'+pagination[_index_p]+'\'></div>')

    if(pagination[_index_p] == 1) {
      $('#items_second_container'+pagination[_index_p]).attr('class', 'ui middle aligned divided list active second container')
    } else if(pagination[_index_p] > 1) {
      $('#items_second_container'+pagination[_index_p]).attr('style', 'display: none')
    }

    for (_index_s in students) {
      if(students[_index_s].page == pagination[_index_p]) {
        student = students[_index_s]
        item = $('<div class=\'item\' id=\''+student.enrollment_id+'\' style=\'padding-left:15px; padding-right:15px;\'></div>')
        img = $('<img class=\'ui avatar image\' src=\'images/user_img_0.jpg\'/>')
        switch (occupation) {
          case 0:
            let right_floated_content = null
            let tag_a = null
            right_floated_content = $('<div class=\'right floated content\'></div>')
            tag_a = $('<a class=\'ui right floated aligedvertical animated button red\' onclick=\'on_click_remove_student_button('+student.enrollment_id+',\"'+student.first_name+'\",\"'+student.last_name+'\")\'><div class=\'hidden content\' style=\'color:white\'> Remove </div><div class=\'visible content\'><i class=\'sign out icon\'/></div></a>')
            content = $('<div class=\'content\'><a href=\'/profile?section_id='+section_id+'&username='+student.username+'\'><p> '+student.first_name+' '+student.last_name+' </p></a></div>')
            right_floated_content.append(tag_a)
            item.append(right_floated_content)
            item.append(img)
            item.append(content)

            break;
          default:
            content = $('<div class=\'content\'><p> '+student.first_name+' '+student.last_name+' </p></div>')
            item.append(img)
            item.append(content)
        }
        $('#items_second_container'+pagination[_index_p]).append(item)
      }
    }
  }

  $('div').remove('#student_pagination')
  if(pagination[pagination.length - 1] == 1) {
    pagination = []
  } else {
    $('<div class=\'ui pagination menu\' id=\'student_pagination\'></div>').insertAfter('#ui_two_column_in_second_container')
  }

  item = null;
  for(_index in pagination) {
    item = $('<a class=\'item sc\' id=\'page_'+pagination[_index]+'_second_container\' onclick=\'on_click_page_number_in_second_container('+pagination[_index]+')\'>'+pagination[_index]+'</a>')
    $('#student_pagination').append(item)
  }

}

function on_click_page_number_in_third_container(page) {
  $('.active.item.tc').attr({
    class: 'item tc'
  })
  $('#page_'+page+'_third_container').attr({
    class: 'active item tc'
  })

  $('.active.third.container').attr({
    class: 'ui divided items third container',
    style: 'display: none'
  })
  $('#items_third_container'+page).attr({
    class: 'ui divided items active third container',
    style: 'display: block'
  })
}

function set_item_pagination_in_third_container(objects, section_id, occupation) {
  let res_obj = get_items_of_week(objects, 5, '-1week')
  objects = res_obj.items_of_week
  let pagination = res_obj.pagination

  let item = null
  let content = null
  let description = null
  let pairing_times = objects.length

  for (_index_p in pagination) {

    $('div').remove('#items_third_container'+pagination[_index_p])
    $('#segment_in_third_container').append('<div class=\'ui divided items third container\' id=\'items_third_container'+pagination[_index_p]+'\'></div>')

    if(pagination[_index_p] == 1) {
      $('#items_third_container'+pagination[_index_p]).attr('class', 'ui divided items active third containerr')
    } else if(pagination[_index_p] > 1) {
      $('#items_third_container'+pagination[_index_p]).attr('style', 'display: none')
    }

    for (_index_o in objects) {
      if(objects[_index_o].page == pagination[_index_p]) {
        switch (occupation) {
          case 0:
            let grid = null
            let extra = null
            let eleven_wide_column = null
            let tag_b = null
            let five_wide_column = null
            let button = null
            let pairing_session = objects[_index_o]
            item = $('<div class=\'item\' style=\'padding-top:10px; padding-bottom:10px; padding-left:15px; padding-right:15px;\'></div>')
            content = $('<div class=\'content\'></div>')
            grid = $('<div class=\'ui grid\'></div>')
            eleven_wide_column = $('<div class=\'eleven wide column\'></div>')
            five_wide_column = $('<div class=\'five wide column\'></div>')
            if(pairing_session.status == 0) {
              tag_b = $('<b style=\'font-size:1.5em;\'><header style=\'color:#5D5D5D;\'> Session : '+(pairing_times - _index_o)+' </header></b>')
              description = $('<p><b style=\'color:#5D5D5D\'> Start at : </b><font style=\'color:#5D5D5D\'>'+pairing_session.time_start+'</font><br><b style=\'color:#5D5D5D\'> End at : </b><font style=\'color:#5D5D5D\'>'+pairing_session.time_end+'</font></p>')
              button = $('<div class=\'ui right floated alignedvertical animated button\' onclick=\'onClickViewPairingRecord('+pairing_session.pairing_session_id+')\'><div class=\'hidden content\' style=\'color:#5D5D5D;\'> View </div><div class=\'visible content\'><i class=\'eye icon\'/></div></div>')
              extra = $('<div class=\'extra\'><div class=\'ui label\' id=\'status\' style=\'background-color:#E8E8E8; color:#665D5D;\'> COMPLETED </div></div>')
            } else {
              tag_b = $('<b style=\'font-size:1.5em;\'><header> Session : '+(pairing_times - _index_o)+' </header></b>')
              description = $('<p><b> Start at : </b><font>'+pairing_session.time_start+'</font><br><b> End at : </b><font>'+pairing_session.time_end+'</font></p>')
              button = $('<div class=\'ui top right floated pointing dropdown button blue\'><font color=\'white\'> Select </font><div class=\'menu\'><div class=\'item\' onclick=\'onClickViewPairingRecord('+pairing_session.pairing_session_id+')\'> View </div><div class=\'item\' onclick=\'onClickCompletedSessionMenu('+pairing_session.pairing_session_id+')\'> Completed </div></div></div>')
              extra = $('<div class=\'extra\'><div class=\'ui label\' id=\'status\' style=\'background-color:#16AB39; color:white;\'> ACTIVE </div></div>')
            }
            item.append(content)
            content.append(grid)
            content.append(extra)
            grid.append(eleven_wide_column)
            grid.append(five_wide_column)
            eleven_wide_column.append(tag_b)
            eleven_wide_column.append(description)
            five_wide_column.append(button)
            $('#items_third_container'+pagination[_index_p]).append(item)


            break;
          default:
            let assignment = objects[_index_o]
            let tag_a = null
            item = $('<div class=\'item\'></div>')
            content = $('<div class=\'content\'></div>')
            tag_a = $('<a href=\'/assignment?section_id='+section_id+'&assignment_id='+assignment.assignment_id+'\'><b style=\'font-size:1.5em; padding-left:15px; padding-right:15px;\'>'+assignment.title+'</b></a>')
            description = $('<div class=\'description\'><p style=\'padding-left:15px; padding-right:15px;\'>'+assignment.description+'</p></div>')
            item.append(content)
            content.append(tag_a)
            content.append(description)
            $('#items_third_container'+pagination[_index_p]).append(item)
        }
      }
    }

  }

  $('div').remove('#pagination_in_third_container')
  if(pagination[pagination.length - 1] == 1) {
    pagination = []
  } else {
    $('<div class=\'ui pagination menu\' id=\'pagination_in_third_container\'></div>').insertAfter('#ui_two_column_in_third_container')
  }

  item = null;
  for(_index in pagination) {
    item = $('<a class=\'item tc\' id=\'page_'+pagination[_index]+'_third_container\' onclick=\'on_click_page_number_in_third_container('+pagination[_index]+')\'>'+pagination[_index]+'</a>')
    $('#pagination_in_third_container').append(item)
  }

}

function sort_A_to_Z(student_objects, completed_filter, hasElementMoving){
  while(!completed_filter) {
    $('li.ui.segment').filter(function(indx){
      var key = $(this).attr('id')
      var name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
      var index = indx

      $('li.ui.segment').filter(function(indx){
        key = $(this).attr('id')
        var _name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
        var _index = indx
        var max_length = name.length > _name.length ? _name.length : name.length
        if(name != _name) {
          if(index < _index) {
            for (i = 0; i <= max_length; i++){
              if(name.charCodeAt(i) > _name.charCodeAt(i)) {
                $(this).parent().find("li").eq(index).insertAfter($(this));
                index = _index
                hasElementMoving = true;
                break;
              } else if (name.charCodeAt(i) < _name.charCodeAt(i)) {
                break;
              }
            }
          } else if(index > _index) {
            for (i = 0; i <= max_length; i++){
              if(name.charCodeAt(i) < _name.charCodeAt(i)) {
                $(this).insertAfter($(this).parent().find("li").eq(index));
                index = _index
                hasElementMoving = true;
                break;
              } else if (name.charCodeAt(i) > _name.charCodeAt(i)) {
                break;
              }
            }
          }
        }
      })
    })

    if(hasElementMoving) {
      completed_filter = false
    } else {
      completed_filter = true
    }

    hasElementMoving = false
  }
}

function sort_Z_to_A(student_objects, completed_filter, hasElementMoving){

  while(!completed_filter) {
    $('li.ui.segment').filter(function(indx){
      var key = $(this).attr('id')
      var name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
      var index = indx

      $('li.ui.segment').filter(function(indx){
        key = $(this).attr('id')
        var _name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
        var _index = indx
        var max_length = name.length > _name.length ? _name.length : name.length
        if(name != _name) {
          if(index < _index) {
            for (i = 0; i <= max_length; i++){
              if(name.charCodeAt(i) < _name.charCodeAt(i)) {
                $(this).parent().find("li").eq(index).insertAfter($(this));
                index = _index
                hasElementMoving = true;
                break;
              } else if (name.charCodeAt(i) > _name.charCodeAt(i)) {
                break;
              }
            }
          } else if(index > _index) {
            for (i = 0; i <= max_length; i++){
              if(name.charCodeAt(i) > _name.charCodeAt(i)) {
                $(this).insertAfter($(this).parent().find("li").eq(index));
                index = _index
                hasElementMoving = true;
                break;
              } else if (name.charCodeAt(i) < _name.charCodeAt(i)) {
                break;
              }
            }
          }
        }
      })
    })

    if(hasElementMoving) {
      completed_filter = false
    } else {
      completed_filter = true
    }

    hasElementMoving = false
  }

}

function sort_avg_score_1_to_100(student_objects, completed_filter, hasElementMoving){

  while(!completed_filter) {
    $('li.ui.segment').filter(function(indx){
      var key = $(this).attr('id')
      var avg_score = student_objects[key].avg_score
      var name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
      var index = indx

      $('li.ui.segment').filter(function(indx){
        key = $(this).attr('id')
        var _avg_score = student_objects[key].avg_score
        var _name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
        var _index = indx
        var max_length = name.length > _name.length ? _name.length : name.length
        if(avg_score != _avg_score) {
          if(index < _index) {
            if(avg_score > _avg_score) {
              $(this).parent().find("li").eq(index).insertAfter($(this));
              index = _index
              hasElementMoving = true;
            }
          } else if(index > _index) {
            if(avg_score < _avg_score) {
              $(this).insertAfter($(this).parent().find("li").eq(index));
              index = _index
              hasElementMoving = true;
            }
          }
        } else if(avg_score == _avg_score) {
          if(name != _name) {
            if(index < _index) {
              for (i = 0; i <= max_length; i++){
                if(name.charCodeAt(i) > _name.charCodeAt(i)) {
                  $(this).parent().find("li").eq(index).insertAfter($(this));
                  index = _index
                  hasElementMoving = true;
                  break;
                } else if (name.charCodeAt(i) < _name.charCodeAt(i)) {
                  break;
                }
              }
            } else if(index > _index) {
              for (i = 0; i <= max_length; i++){
                if(name.charCodeAt(i) < _name.charCodeAt(i)) {
                  $(this).insertAfter($(this).parent().find("li").eq(index));
                  index = _index
                  hasElementMoving = true;
                  break;
                } else if (name.charCodeAt(i) > _name.charCodeAt(i)) {
                  break;
                }
              }
            }
          }
        }
      })
    })

    if(hasElementMoving) {
      completed_filter = false
    } else {
      completed_filter = true
    }

    hasElementMoving = false
  }

}

function sort_avg_score_100_to_1(student_objects, completed_filter, hasElementMoving){

  while(!completed_filter) {
    $('li.ui.segment').filter(function(indx){
      var key = $(this).attr('id')
      var avg_score = student_objects[key].avg_score
      var name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
      var index = indx

      $('li.ui.segment').filter(function(indx){
        key = $(this).attr('id')
        var _avg_score = student_objects[key].avg_score
        var _name = (student_objects[key].first_name + ' ' + student_objects[key].last_name).toLowerCase()
        var _index = indx
        var max_length = name.length > _name.length ? _name.length : name.length
        if(avg_score != _avg_score) {
          if(index < _index) {
            if(avg_score < _avg_score) {
              $(this).parent().find("li").eq(index).insertAfter($(this));
              index = _index
              hasElementMoving = true;
            }
          } else if(index > _index) {
            if(avg_score > _avg_score) {
              $(this).insertAfter($(this).parent().find("li").eq(index));
              index = _index
              hasElementMoving = true;
            }
          }
        } else if(avg_score == _avg_score) {
          if(name != _name) {
            if(index < _index) {
              for (i = 0; i <= max_length; i++){
                if(name.charCodeAt(i) > _name.charCodeAt(i)) {
                  $(this).parent().find("li").eq(index).insertAfter($(this));
                  index = _index
                  hasElementMoving = true;
                  break;
                } else if (name.charCodeAt(i) < _name.charCodeAt(i)) {
                  break;
                }
              }
            } else if(index > _index) {
              for (i = 0; i <= max_length; i++){
                if(name.charCodeAt(i) < _name.charCodeAt(i)) {
                  $(this).insertAfter($(this).parent().find("li").eq(index));
                  index = _index
                  hasElementMoving = true;
                  break;
                } else if (name.charCodeAt(i) > _name.charCodeAt(i)) {
                  break;
                }
              }
            }
          }
        }
      })
    })

    if(hasElementMoving) {
      completed_filter = false
    } else {
      completed_filter = true
    }

    hasElementMoving = false
  }

}

function on_click_assignment(opt, id) {
  switch (opt) {
    case 1:
      $('#'+id).is(':checked') == true ? $('#'+id).prop('checked', false) : $('#'+id).prop('checked', true)

      break;
    default:
  }
}

function pad ( val ) { return val > 9 ? val : "0" + val; }
