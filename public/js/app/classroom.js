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
    //         $('#isTherePairingYet').attr('value', 'There isn\'t pairing!')
    //       } else if(status == 'Update failed.') {
    //         alert(status)
    //       }
    //     }
    //   })
    // })
    $('#student-list-modal').modal({
      closable: false,
    });
    $('#select-partner-modal').modal({
      closable: false,
    });
    $('#confirm-pairing').click(function(){
      const session_status = $('.newPairingSession').attr('value')
      if(session_status <= 0){
        console.log('#confirm-pairing : ' + $('#pairing_date_time_id').attr('value') + ', session_status : ' + $('.newPairingSession').attr('value'))
        parameters = {pairing_date_time_id: $('#pairing_date_time_id').attr('value'), section_id: $('#section_id').attr('value'), partner_keys: $('#partner-keys').attr('value'), pairing_objective: $('#pairing-objective').attr('value'), student_objects: $('#student-objects').attr('value')}
        $.post('/classroom/createPairingHistory', parameters, function(data){
          const res_status = data.res_status
          var pairingTime = data.pairingTime
          if(session_status < 0) {
            pairingTime = 1
          } else pairingTime++
          if(res_status == 'There is no student in the classroom!'){
            alert(res_status)
          } else if(res_status == 'Please pair all students!'){
            alert(res_status)
            $('#student-list-modal').modal('show');
          } else if(res_status == 'Update completed.'){
            var item = $('<div id=\'pairing' + data.pairing_date_time_id + '\' class=\'item\' style=\'padding-top:10px; padding-bottom:10px; padding-left:15px; padding-right:15px;\'></div>')
            var content = $('<div class=\'content\'></div>')
            var grid = $('<div class=\'ui grid\'></div>')
            var extra = $('<div class=\'extra\'><div id=\'status\' class=\'ui label\' style=\'background-color:#16AB39; color:white;\'>ACTIVE</div></div>')
            var elevenColumn = $('<div class=\'eleven wide column\'><b style=\'font-size:1.5em\'><header class=\'header-pending-and-active\'>Session : ' + pairingTime + '</header></b><div class=\'description\'><p><b class=\'date-time\'>Start at : </b><font class=\'font-pending-and-active\'>' + data.date_time + '</font><br><b class=\'date-time\'>End at : </b><font id=\'endAt\' class=\'font-pending-and-active\'>' + data.time_end + '</font></p></div></div>')
            var fiveColumn = $('<div id=\'pairing-button-column\' class=\'five wide column\'><div class=\'ui top right floated pointing dropdown button blue\'><font color=\'white\'>Select</font><div class=\'menu\'><div class=\'item\' onclick=\'onClickViewPairingHistory('+data.pairing_date_time_id+')\'> View </div><div class=\'item\' id=\'inactivePairingMenu\' onclick=\'onClickInactivePairingMenu('+data.pairing_date_time_id+')\'>Inactive</div></div></div>')
            grid.append(elevenColumn)
            grid.append(fiveColumn)
            content.append(grid)
            content.append(extra)
            item.append(content)
            $('#pairingSession').prepend(item)
            $('.ui.pointing.dropdown').dropdown();
            $('#pairing_date_time_id').attr('value', data.pairing_date_time_id)
            // $('#status').attr('style', 'background-color:#16AB39; color:white;')
            // $('#status').text('ACTIVE')
            // $('#pairStudent').remove();
            //$('#pairing-button-column').append('<div class=\'ui top right floated pointing dropdown button blue\'><font color=\'white\'>Select</font><div class=\'menu\'><div class=\'item\' onclick=\'onClickViewPairingHistory('+$('#pairing_date_time_id').attr('value')+')\'> View </div><div class=\'item\' id=\'inactivePairingMenu\' onclick=\'onClickInactivePairingMenu('+data.pairing_date_time_id+')\'>Inactive</div></div>')
            //$('.ui.pointing.dropdown').dropdown();
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
      if($('#confirm-message').attr('value') == 'Are you sure you want to cancel pairing?'){
        $('#confirm-modal').modal('show');
      }
    })
    $('#confirm-button').click(function(){
      if($('#confirm-message').attr('value') == 'Are you sure you want to cancel pairing?'){
        $('#partner-keys').attr('value', '{}')
        $('#pairing-objective').attr('value', '{}')
      } else if($('#confirm-message').attr('value') == 'Are you sure you want to inactive pairing?'){
        var parameters = {pairing_date_time_id: $('#input_confirm_modal').attr('value'), section_id: $('#section_id').attr('value'), status: 0}
        $.ajax({
          url: '/classroom/updatePairingDateTimeStatus',
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
              $('#pairing-button-column').append("<div class='ui right floated alignedvertical animated viewPairingHistory button' onclick='onClickViewPairingHistory("+$('#input_confirm_modal').attr('value')+")'><div class='hidden content' style='color:#5D5D5D;'>View</div><div class='visible content'><i class='eye icon'></i></div></div>")
              $('.newPairingSession').attr('value', 0);
            } else {
              alert(status)
            }
            // $('#createPairingDateTime').attr('value', 0)
          }
        })
      } else if($('#confirm-message').attr('value') == 'Are you sure you want to assign this assignment to all student?'){
        parameters = JSON.parse($('#input_confirm_modal').attr('value'))
        console.log('parameters : ', parameters)
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
      }
      $('#confirm-message').attr('value', 'Something message.')
    })
    $('#cancel-button').click(function(){
      if($('#confirm-message').attr('value') == 'Are you sure you want to cancel pairing?'){
        $('#student-list-modal').modal('show');
      }
    })
    //onClickPairStudent()
    $('#back-to-student-list-modal').click(function () {
      $('#student-list-modal').modal('show');
    })
    $('.menu .item').tab();
    // $('#search-user-input').keyup(function () {
    //     var parameters = { search: $(this).val() };
    //     $.get( 'dashboard/searchUser',parameters, function(data) {
    //         $(".user-list").empty();
    //         if (data.length > 0) {
    //             data.forEach(function(user) {
    //                 $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-pairing-button' onclick='onClickAddUserButton(\"" +user.username+"\")'>Add</div></div><img class='ui avatar image' src='"+ user.img +"'><div class='content'><div class='header'>"+user.username+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(user.avgScore).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(user.totalTime/3600))+":"+pad(parseInt((user.totalTime-(parseInt(user.totalTime/3600)*3600))/60))+":"+pad(parseInt(user.totalTime%60))+"</div></div></div></div>");
    //             }, this);
    //         } else {
    //             $(".user-list").append("<li class='ui item'>No results</li>")
    //         }
    //     })
    // })
    $('.ui-purpose').click(function() {
        const index = $('.ui-purpose').index(this)
        $('.ui-purpose').removeClass('teal inverted')
        $('#ui-purpose-'+index).addClass('teal inverted')
        const purpose = $(this).data("purpose")
        const section_id = $('#section_id').attr('value')
        const avg_score = $('#avg_score-add-partner').attr('value')
        const username = $('#username-add-partner').attr('value')
        var parameters = { purpose: purpose, section_id: section_id, avg_score: avg_score, username: username};
        $.get( 'classroom/searchStudentByPurpose',parameters, function(data) {
            $(".user-purpose-list").empty();
            var students = data.students
            var purpose = data.purpose
            var pairing_objective = JSON.parse($('#pairing-objective').attr('value'))
            if (students.length > 0) {
                students.forEach(function(student) {
                  if(pairing_objective[student.enrollment_id] == -1) {
                    $(".user-purpose-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id-add-partner').attr('value')+","+student.enrollment_id+",\""+purpose+"\")'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui green label'> Available </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
                  } else {
                    $(".user-purpose-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id-add-partner').attr('value')+","+student.enrollment_id+",\""+purpose+"\")'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui red label'> Paired </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
                  }
                }, this);
            } else {
                $(".user-purpose-list").append("<li class='ui item'>No results</li>")
            }
        })

    })
})

function searchStudent(e, section_id){
  console.log('section_id: ' + section_id)
  var parameters = { search: e.value, section_id: section_id };
  $.get( 'classroom/searchStudent',parameters, function(data) {
    const students = data.students
    const purpose = data.purpose
    const pairing_objective = JSON.parse($('#pairing-objective').attr('value'))
    const username = $('#username-add-partner').attr('value')
    $(".user-list").empty();
    if (students.length > 0) {
      students.forEach(function(student) {
        if(pairing_objective[student.enrollment_id] == -1 && student.username != username) {
          $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id-add-partner').attr('value')+","+student.enrollment_id+",\""+purpose+"\")'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui green label'> Available </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
        } else if(student.username != username) {
          $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+$('#student_id-add-partner').attr('value')+","+student.enrollment_id+",\""+purpose+"\")'>Add</div></div><img class='ui avatar image' src='"+ student.img +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a class='ui red label'> Paired </a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student.total_time/3600))+":"+pad(parseInt((student.total_time-(parseInt(student.total_time/3600)*3600))/60))+":"+pad(parseInt(student.total_time%60))+"</div></div></div></div>");
        }
      }, this);
    } else {
      $(".user-list").append("<li class='ui item'>No results</li>")
    }
  })
}

function onClickPairingButton(enrollment_id, avg_score, username) {
  //make user list is empty on search user panel
  $(".user-list").empty();
  $(".user-list").append("<div class='li ui item'>Search result</div>")

  console.log('section_id : ' + $('#section_id').attr('value') + ', enrollment_id : ' + enrollment_id + ', avg_score : ' + avg_score + ', username : ' + username)
  $('.student-score').text('Student score ' + parseFloat(avg_score).toFixed(2))
  $('#student_id-add-partner').attr('value', enrollment_id)
  $('#avg_score-add-partner').attr('value', avg_score)
  $('#username-add-partner').attr('value', username)
  $(".user-purpose-list").empty();
  $(".user-purpose-list").append("<li class='ui item'>Please select your purpose.</li>");
  $('#select-partner-modal').modal('show')
}

function onClickAddPartnerButton(student_id, partner_id, purpose) {
  var partner_keys = JSON.parse($('#partner-keys').attr('value'))
  var pairing_objective = JSON.parse($('#pairing-objective').attr('value'))
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
  $('#partner-keys').attr('value', JSON.stringify(partner_keys))
  $('#pairing-objective').attr('value', JSON.stringify(pairing_objective))
  $('#confirm-header').text('Student pairing')
  $('#confirm-message').text('Are you sure you want to cancel pairing?')
  $('#confirm-message').attr('value', 'Are you sure you want to cancel pairing?')
  console.log('partner_keys: ', partner_keys ,', pairing_objective_'+student_id+' : ' + pairing_objective[student_id] +', pairing_objective_'+partner_id+' : ' + pairing_objective[partner_id])
  showStudentList('pair', $('#pairing_date_time_id').attr('value'))
}

function showStudentList(command, pairing_date_time_id){
  var parameter = { partner_keys: $('#partner-keys').attr('value'), pairing_objective: $('#pairing-objective').attr('value'), section_id: $('#section_id').val(), pairing_date_time_id: pairing_date_time_id, command: command};
  $.get('classroom/getStudentsFromSection',parameter, function(data) {
    var count = 0
    const student_objects = data.student_objects
    const partner_keys = data.partner_keys
    const pairing_objective = data.pairing_objective
    var addPartnerButton = "";
    $('#student-objects').attr('value', JSON.stringify(student_objects))
    // $('.student-list').empty();
    // $('.partner-list').empty();
    $('.student-container').empty();
    for (key in partner_keys) {
      if(partner_keys[key] < 0) {

        $('.student-container').append("<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='images/user_img_0.jpg' style='visibility:hidden;'></img><div class='content'><div class='right floated content'><div class='ui button add-user-button' style='margin-top: 22px;' onclick='onClickPairingButton("+ student_objects[key].enrollment_id + "," + student_objects[key].avg_score + ",\"" + student_objects[key].username.toString() + "\")'>Add</div></div><div class='description'><div style='font-size: 12px; visibility:hidden;'>total active time: "+pad(parseInt(0/3600))+":"+pad(parseInt((0-(parseInt(0/3600)*3600))/60))+":"+pad(parseInt(0%60))+"</div><font color='#5D5D5D'> Empty </font><div class='ui circular labels' style='margin-top:2.5px; visibility:hidden;'><a class='ui teal label'> score "+parseFloat(0).toFixed(2)+"</a></div></div></div></div></div></div></div><div class='ui vertical divider'> - </div></div>")

        // $('.student-list').append("<div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div>");
        // $('.partner-list').append("<div class='item'><div class='right floated middle aligned content'><div class='ui button add-user-button' onclick='onClickPairingButton("+ student_objects[key].enrollment_id + "," + student_objects[key].avg_score + ",\"" + student_objects[key].username.toString() + "\")'>Add</div></div><img class='ui avatar image' src='images/user_img_0.jpg' style='visibility:hidden;'></img><div class='content'><div class='description'><div style='font-size: 12px; visibility:hidden;'>total active time: "+pad(parseInt(0/3600))+":"+pad(parseInt((0-(parseInt(0/3600)*3600))/60))+":"+pad(parseInt(0%60))+"</div><font color='#5D5D5D'> Empty </font><div class='ui circular labels' style='margin-top:2.5px; visibility:hidden;'><a class='ui teal label'> score "+parseFloat(0).toFixed(2)+"</a></div></div></div></div>");
        $()
      } else {

        // $('.student-list').append("<div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div>");
        //
        if(command == 'pair') {
          addPartnerButton = "<div class='ui button add-user-button' style='margin-top: 22px;' onclick='onClickPairingButton("+ student_objects[key].enrollment_id + "," + student_objects[key].avg_score + ",\"" + student_objects[key].username.toString() + "\")'>Add</div>"
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
        console.log('i : ' + pairing_objective_str)

        $('.student-container').append("<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[key].img+"'></img><div class='content'><div class='header'>"+student_objects[key].first_name+" "+student_objects[key].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(student_objects[key].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[key].total_time/3600))+":"+pad(parseInt((student_objects[key].total_time-(parseInt(student_objects[key].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[key].total_time%60))+"</div></div></div></div></div></div><div class='column'><div class='ui items'><div class='item'><img class='ui avatar image' src='"+student_objects[partner_keys[key]].img+"'></img><div class='content'><div class='right floated content'>"+addPartnerButton+"</div><div class='header'>"+student_objects[partner_keys[key]].first_name+" "+student_objects[partner_keys[key]].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'> score "+parseFloat(student_objects[partner_keys[key]].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[partner_keys[key]].total_time/3600))+":"+pad(parseInt((student_objects[partner_keys[key]].total_time-(parseInt(student_objects[partner_keys[key]].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[partner_keys[key]].total_time%60))+"</div></div></div></div></div></div></div><div class='ui vertical divider'> "+pairing_objective_str+" </div></div>")
        //
        // $('.partner-list').append("<div class='item'><div class='right floated content'>"+addPartnerButton+"</div><img class='ui avatar image' src='"+student_objects[partner_keys[key]].img+"'></img><div class='content'><div class='header'>"+student_objects[partner_keys[key]].first_name+" "+student_objects[partner_keys[key]].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'> score "+parseFloat(student_objects[partner_keys[key]].avg_score).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(student_objects[partner_keys[key]].total_time/3600))+":"+pad(parseInt((student_objects[partner_keys[key]].total_time-(parseInt(student_objects[partner_keys[key]].total_time/3600)*3600))/60))+":"+pad(parseInt(student_objects[partner_keys[key]].total_time%60))+"</div></div></div></div>");
      }
      count++;
    }
    if(!count) {
      console.log('countqqqq : ' + count)
        // $(".student-list").append("<li class='ui item'>No student.</li>")
        // $(".partner-list").append("<li class='ui item'>No student.</li>")
      $('.student-container').append("<div class='ui segment'><div class='ui two column very relaxed grid'><div class='column'><font>No student.</font></div><div class='column'><font>No student.</font></div></div><div class='ui vertical divider'> - </div></div>")

    } else {
      $('#partner-keys').attr('value', JSON.stringify(partner_keys))
      $('#pairing-objective').attr('value', JSON.stringify(data.pairing_objective))
      console.log('pairing_objective : ', data.pairing_objective)
      console.log('partner_keys : ', data.partner_keys)
    }
    $('#student-list-modal').modal('show');
  })
}

function onClickInactivePairingMenu(pairing_date_time_id){
  console.log('pairing_date_time_id: ' + pairing_date_time_id)
  $('#input_confirm_modal').attr('value', pairing_date_time_id)
  $('#confirm-header').text('Complete pairing session')
  $('#confirm-message').text('Are you sure you want to complete this pairing session?')
  $('#confirm-message').attr('value', 'Are you sure you want to inactive pairing?')
  $('#confirm-modal').modal('show')
}

function onPairingStatusOptionClick(){
  var parameters;
  if($('.pairing-status').attr('value') == 'Active') {
    parameters = {pairing_date_time_id: $('.pairing-status').attr('id'), status: 2, partner_keys: $('#partner-keys').attr('value')}
  } else if($('.pairing-status').attr('value') == 'Inactive') {
    parameters = {pairing_date_time_id: $('.pairing-status').attr('id'), status: 0, partner_keys: $('#partner-keys').attr('value')}
  }
  $.ajax({
    url: '/classroom/updatePairingDateTimeStatus',
    type: 'put',
    data: parameters,
    success: function(data){
      const status = data.status
      if(status == 'There aren\'t student in classroom!') {
        alert(status)
      } else if(status == 'Please, pair all student!') {
        alert(status)
      } else if(status == 'Update completed.' && $('.pairing-status').attr('value') == 'Active') {
        $('#status').attr('style', 'background-color:#16AB39; color:white;')
        $('#status').text('ACTIVE')
        $('.pairing-status').attr('id', data.pairing_date_time_id)
        $('.pairing-status').attr('value', 'Inactive')
        $('.pairing-status').text('Inactive')
      } else if(status == 'Update completed.' && $('.pairing-status').attr('value') == 'Inactive'){
        parameters = {partner_id: 'NULL', section_id: $('#section_id').attr('value')}
        $.ajax({
          url: 'classroom/resetPair',
          type: 'put',
          data: parameters,
          success: function (data) {
            const status = data.status
            if(status == 'Update completed.') {
              alert(status)
              $('#status').attr('style', 'background-color:#E8E8E8; color:#665D5D;')
              $('#status').text('INACTIVE')
              $('.header-pending-and-active').attr('style', 'color:#5D5D5D;')
              $('.font-pending-and-active').attr('style', 'color:#5D5D5D;')
              $('#pairing-button-column').empty()
              $('#pairing-button-column').append("<div class='ui right floated alignedvertical animated viewPairingHistory button' value='"+data.pairing_date_time_id+"'><div class='hidden content' style='color:#5D5D5D;'>View</div><div class='visible content'><i class='eye icon'></i></div></div>")
              $('#createPairingDateTime').attr('value', 0);
            } else if(status == 'Update failed.') {
              alert(status)
            }
          }
        })
      } else {
        alert(status)
      }
    }
  })
}

function setStudent(studentName, studentAvgScore, studentTotalTime, studentImg){
  $('.student-list').append("<div class='item'><img class='ui avatar image' src='"+studentImg+"'></img><div class='content'><div class='header'>"+studentName+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(studentAvgScore).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(studentTotalTime/3600))+":"+pad(parseInt((studentTotalTime-(parseInt(studentTotalTime/3600)*3600))/60))+":"+pad(parseInt(studentTotalTime%60))+"</div></div></div></div>");
}

function setPartner(enrollmentId, avgScore, partnerId, studentUsername, partnerName, partnerAvgScore, partnerTotalTime, partnerImg){
  $('.partner-list').append("<div class='item'><div class='right floated content'><div class='ui button add-user-button' onclick='onClickPairingButton("+ enrollmentId + "," + avgScore + "," + partnerId + ",\"" + studentUsername + "\")'>Add</div></div><img class='ui avatar image' src='"+partnerImg+"'></img><div class='content'><div class='header'> "+partnerName+" </div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+partnerAvgScore+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(partnerTotalTime/3600))+":"+pad(parseInt((partnerTotalTime-(partnerTotalTime*3600))/60))+":"+pad(parseInt(partnerTotalTime%60))+"</div></div></div></div>");
}

function pairingOrViewingisHided(command){
  if(command == 'pair') {
    $('#confirm-pairing').show()
    $('#cancel-pairing').show()
    $('#close-student-list').hide()
  } else if (command == 'view') {
    $('#confirm-pairing').hide()
    $('#cancel-pairing').hide()
    $('#close-student-list').show()
  }
}

function onClickPairStudent(pairing_date_time_id, session_status){
  console.log('pairing_date : ' + pairing_date_time_id + ', session_status : ' + session_status)
  console.log('newPairingSession: ' + $('.newPairingSession').attr('value'))
  if($('.newPairingSession').attr('value') <= 0) {
    //$('#pairStudent').click(function (){
    $('#partner-keys').attr('value', '{}')
    $('#pairing-objective').attr('value', '{}')
    pairingOrViewingisHided('pair')
    showStudentList('pair', $('#pairing_date_time_id').attr('value'))
    //})
  } else {
    $('#alert-header').text('Pairing session')
    $('#alert-message').text('Cannot create a new session! Please set current session to completed before create a new session.')
    $('#alert-modal').modal('show')
  }
}

function onClickViewPairingHistory(pairing_date_time_id) {
  $('#partner-keys').attr('value', '{}')
  $('#pairing-objective').attr('value', '{}')
  console.log('pairing_date_time_id : ' + pairing_date_time_id)
  pairingOrViewingisHided('view')
  showStudentList('view', pairing_date_time_id)
}

function onClickAssign(section_id, pairing_date_time_id, assignment_id, title, description) {
  var parameters = {section_id: section_id, pairing_date_time_id: pairing_date_time_id, assignment_id: assignment_id, title: title, description: description}
  $('#input_confirm_modal').attr('value', JSON.stringify(parameters))
  $('#confirm-header').text('Assign assignment')
  $('#confirm-message').attr('value', 'Are you sure you want to assign this assignment to all student?')
  $('#confirm-message').text('Are you sure you want to assign this assignment to all student pairs?')
  $('#confirm-modal').modal('show');
  // $.post('/classroom/assignAssignment', parameters, function (data){
  //
  // })
}


function pad ( val ) { return val > 9 ? val : "0" + val; }
