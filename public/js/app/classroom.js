$(document).ready(function() {
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
      if(session_status <= 0){
        //console.log('#confirm-pairing : ' + $('#pairing_session_id').attr('value') + ', session_status : ' + $('.newPairingSession').attr('value'))
        parameters = {pairing_session_id: $('#pairing_session_id').attr('value'), section_id: $('#section_id').attr('value'), partner_keys: $('#partner_keys').attr('value'), pairing_objective: $('#pairing_objective').attr('value'), student_objects: $('#student_objects').attr('value')}
        $.post('/classroom/createPairingRecord', parameters, function(data){
          const res_status = data.res_status
          var pairing_time = data.pairing_time
          if(session_status < 0) {
            pairing_time = 1
          } else pairing_time++
          if(res_status == 'There is no student in the classroom!'){
            alert(res_status)
          } else if(res_status == 'Please pair all students!'){
            alert(res_status)
            $('#student_list_modal').modal('show');
          } else if(res_status == 'Update completed.'){
            $('#no_session').empty();
            var item = $('<div id=\'pairing' + data.pairing_session_id + '\' class=\'item\' style=\'padding-top:10px; padding-bottom:10px; padding-left:15px; padding-right:15px;\'></div>')
            var content = $('<div class=\'content\'></div>')
            var grid = $('<div class=\'ui grid\'></div>')
            var extra = $('<div class=\'extra\'><div id=\'status\' class=\'ui label\' style=\'background-color:#16AB39; color:white;\'>ACTIVE</div></div>')
            var elevenColumn = $('<div class=\'eleven wide column\'><b style=\'font-size:1.5em\'><header class=\'header-pending-and-active\'>Session : ' + pairing_time + '</header></b><div class=\'description\'><p><b class=\'date-time\'>Start at : </b><font class=\'font-pending-and-active\'>' + data.date_time + '</font><br><b class=\'date-time\'>End at : </b><font id=\'endAt\' class=\'font-pending-and-active\'>' + data.time_end + '</font></p></div></div>')
            var fiveColumn = $('<div id=\'pairing-button-column\' class=\'five wide column\'><div class=\'ui top right floated pointing dropdown button blue\'><font color=\'white\'>Select</font><div class=\'menu\'><div class=\'item\' onclick=\'onClickViewPairingRecord('+data.pairing_session_id+')\'> View </div><div class=\'item\' id=\'inactivePairingMenu\' onclick=\'onClickInactivePairingMenu('+data.pairing_session_id+')\'>Inactive</div></div></div>')
            grid.append(elevenColumn)
            grid.append(fiveColumn)
            content.append(grid)
            content.append(extra)
            item.append(content)
            $('#pairingSession').prepend(item)
            $('.ui.pointing.dropdown').dropdown();
            $('#pairing_session_id').attr('value', data.pairing_session_id)
            $('.newPairingSession').attr('value', 1)
          } else {
            alert(status)
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
      }

    })
    $('#confirm-button').click(function(){

      const message = $('#confirm-message').attr('value');

      if(message == 'Are you sure you want to cancel pairing?'){
        $('#partner_keys').attr('value', '{}')
        $('#pairing_objective').attr('value', '{}')
      } else if(message == 'Are you sure you want to complete this pairing session?'){
        var parameters = {pairing_session_id: $('#inp_cm').attr('value'), section_id: $('#section_id').attr('value'), status: 0}
        $.ajax({
          url: '/classroom/updatePairingSession',
          type: 'put',
          data: parameters,
          success: function(data){
            var status = data.status
            if(status == 'Update completed.') {
              $('#status').attr('style', 'background-color:#E8E8E8; color:#665D5D;')
              $('#status').text('COMPLETED')
              $('.date-time').attr('style', 'color:#5D5D5D;')
              $('#endAt').text(' ' + data.time_end)
              $('.header-pending-and-active').attr('style', 'color:#5D5D5D;')
              $('.font-pending-and-active').attr('style', 'color:#5D5D5D;')
              $('#pairing-button-column').empty()
              $('#pairing-button-column').append("<div class='ui right floated alignedvertical animated viewPairingHistory button' onclick='onClickViewPairingRecord("+$('#inp_cm').attr('value')+")'><div class='hidden content' style='color:#5D5D5D;'>View</div><div class='visible content'><i class='eye icon'></i></div></div>")
              $('.newPairingSession').attr('value', 0);
              console.log('.newPairingSession : ' + $('.newPairingSession').attr('value'))
            } else {
              alert(status)
            }
            // $('#createPairingDateTime').attr('value', 0)
          }
        })
      } else if(message == 'Are you sure you want to assign this assignment to all student pairs?'){
        parameters = JSON.parse($('#inp_cm').attr('value'))
        //console.log('parameters : ', parameters)
        $.post('/classroom/assignAssignment', parameters, function (data){
          var res_status = data.res_status
          if(res_status == 'Please pair all students before assign the assignment!'){
            alert(res_status)
          } else if(res_status == 'You already assigned this assignment!') {
            alert(res_status)
          } else if(res_status == 'Successfully assigned this assignment!') {
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
    var addPartnerButton = "";
    $('#student_objects').attr('value', JSON.stringify(student_objects))
    $('.student-container').empty();
    for (key in partner_keys) {
      if(partner_keys[key] < 0) {

        $('.student-container').append("<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='images/user_img_0.jpg' style='visibility:hidden;'></img><div class='content'><div class='right floated content'><div class='ui button add-user-button' style='margin-top: 22px;' onclick='onClickAddPartnerButton("+ student_objects[key].enrollment_id + "," + student_objects[key].avg_score + ",\"" + student_objects[key].username.toString() + "\",1)'>Add</div></div><div class='description'><div style='font-size: 12px; visibility:hidden;'>total active time: "+pad(parseInt(0/3600))+":"+pad(parseInt((0-(parseInt(0/3600)*3600))/60))+":"+pad(parseInt(0%60))+"</div><font color='#5D5D5D'> Empty </font><div class='ui circular labels' style='margin-top:2.5px; visibility:hidden;'><a class='ui teal label'> score "+parseFloat(0).toFixed(2)+"</a></div></div></div></div></div></div></div><div class='ui vertical divider'> - </div></div>")

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

        $('.student-container').append("<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[partner_keys[key]].img+"'></img><div class='content'><div class='right floated content'>"+addPartnerButton+"</div><div class='header'>"+student_objects[partner_keys[key]].first_name+" "+student_objects[partner_keys[key]].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'> score "+parseFloat(student_objects[partner_keys[key]].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[partner_keys[key]].total_time/3600))+":"+pad(parseInt((student_objects[partner_keys[key]].total_time-(parseInt(student_objects[partner_keys[key]].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[partner_keys[key]].total_time%60))+"</div></div></div></div></div></div></div><div class='ui vertical divider'> "+pairing_objective_str+" </div></div>")
      }
      count++;
    }
    if(!count) {
      $('.student-container').append("<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><font>No student.</font></div><div class='column'><font>No student.</font></div></div><div class='ui vertical divider'> - </div></div>")

    } else {
      $('#partner_keys').attr('value', JSON.stringify(partner_keys))
      $('#pairing_objective').attr('value', JSON.stringify(data.pairing_objective))
      //console.log('pairing_objective : ', data.pairing_objective)
      //console.log('partner_keys : ', data.partner_keys)
    }
    $('#student_list_modal').modal('show');
  })
}

function onClickCreateSession(pairing_date_time_id, session_status){
  //console.log('pairing_date : ' + pairing_date_time_id + ', session_status : ' + session_status)
  //console.log('newPairingSession: ' + $('.newPairingSession').attr('value'))
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

function onClickInactivePairingMenu(pairing_session_id){
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

function onClickAssign(section_id, pairing_date_time_id, assignment_id, title, description) {
  var parameters = {section_id: section_id, pairing_session_id: pairing_date_time_id, assignment_id: assignment_id, title: title, description: description}
  $('#inp_cm').attr('value', JSON.stringify(parameters))
  $('#confirm-header').text('Assign assignment')
  $('#confirm-message').attr('value', 'Are you sure you want to assign this assignment to all student pairs?')
  $('#confirm-message').text('Are you sure you want to assign this assignment to all student pairs?')
  $('#confirm-modal').modal('show');
}

function on_click_remove_student_button(enrollment_id, first_name, last_name){
  $('#inp_cm').attr('value', enrollment_id)
  $('#confirm-header').text('Remove Student')
  $('#confirm-message').attr('value', 'Are you sure you want to remove the student from this classroom?')
  $('#confirm-message').text('Are you sure you want to remove \"' + first_name + ' ' + last_name + '\" from this classroom?')
  $('#confirm-modal').modal('show')
}


function pad ( val ) { return val > 9 ? val : "0" + val; }
