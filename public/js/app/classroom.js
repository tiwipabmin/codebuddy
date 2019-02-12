$(document).ready(function() {
    $('.pair-or-view').click(function () {
      if($(this).attr('value') == 'Pair'){
        showStudentList()
      } else {
        alert('View')
      }
    })
    $('.back').click(function () {
      $('#student-list-modal').modal('show');
    })
    $('.menu .item').tab();
    $('#search-user-input').keyup(function () {
        var parameters = { search: $(this).val() };
        $.get( 'dashboard/searchUser',parameters, function(data) {
            $(".user-list").empty();
            if (data.length > 0) {
                data.forEach(function(user) {
                    $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-pairing-button' onclick='onClickAddUserButton(\"" +user.username+"\")'>Add</div></div><img class='ui avatar image' src='"+ user.img +"'><div class='content'><div class='header'>"+user.username+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(user.avgScore).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(user.totalTime/3600))+":"+pad(parseInt((user.totalTime-(parseInt(user.totalTime/3600)*3600))/60))+":"+pad(parseInt(user.totalTime%60))+"</div></div></div></div>");
                }, this);
            } else {
                $(".user-list").append("<li class='ui item'>No results</li>")
            }
        })
    })
    $('.ui-purpose').click(function() {
        const index = $('.ui-purpose').index(this)
        $('.ui-purpose').removeClass('teal inverted')
        $('#ui-purpose-'+index).addClass('teal inverted')
        const purpose = $(this).data("purpose")
        const section_id = $('#section_id').attr('value')
        const avg_score = $('#avg_score-add-partner').attr('value')
        var parameters = { purpose: purpose, section_id: section_id, avg_score: avg_score};
        $.get( 'classroom/searchUserByPurpose',parameters, function(data) {
            $(".user-purpose-list").empty();
            if (data.length > 0) {
                data.forEach(function(student) {
                  if(student.enrollment_id != $('#host_id-add-partner').val()) {
                    $(".user-purpose-list").append("<div class='item'><div class='right floated content'><div class='ui button add-partner-button' onclick='onClickAddPartnerButton("+student.enrollment_id+", "+student.partner_id+")'>Add</div></div><img class='ui avatar image' src='"+ student.image +"'><div class='content'><div class='header'>"+student.first_name+" "+student.last_name+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(student.avg_score).toFixed(2)+"</a><a id='"+student.enrollment_id+"-pairing-status' class='ui green label'> Available </a></div></div></div></div>");
                  }
                  if(student.partner_id != null){
                    $('#'+student.enrollment_id+'-pairing-status').text('Paired')
                    $('#'+student.enrollment_id+'-pairing-status').attr('class', 'ui red label')
                  }
                }, this);
            } else {
                $(".user-purpose-list").append("<li class='ui item'>No results</li>")
            }
        })

    })
})

function onClickPairingButton(enrollment_id, avg_score, h_status) {
  console.log('section_id : ' + $('#section_id').attr('value') + ', enrollment_id : ' + enrollment_id + ', avg_score : ' + avg_score)
  $('.student-score').text('Student score ' + parseFloat(avg_score).toFixed(2))
  $('#host_id-add-partner').attr('value', enrollment_id)
  $('#avg_score-add-partner').attr('value', avg_score)
  if(h_status == null){
    console.log('h_status : ' + h_status)
    h_status = 'null'
  }
  $('#h_status-add-partner').attr('value', h_status)
  $(".user-purpose-list").empty();
  $(".user-purpose-list").append("<li class='ui item'>Please select your purpose.</li>");
  $('#select-partner-modal').modal('show')
}

function onClickAddPartnerButton(enrollment_id, p_status) {
  if(p_status == null){
    p_status = 'null'
  }
  var parameters = {host_id: $('#host_id-add-partner').val(), h_status: $('#h_status-add-partner').val(), partner_id: enrollment_id, p_status: p_status}
  $.post('classroom/addPartnerToStudent', parameters, function(data){
    if(data.hostStatus == 'Add failed.') {
      alert('Add failed')
    } else {
      alert('Add completed.')
    }
    showStudentList()
  })
}

function showStudentList(){
  var parameter = { section_id: $('#section_id').val() };
  $.get('classroom/getStudentsFromSection',parameter, function(data) {
    $('.student-list').empty();
    $('.partner-list').empty();
    if (data.hosts.length > 0) {
      let hosts = data.hosts
      let partners = data.partners
      for(index in hosts) {
        if(partners[index].partner_id == null) {
          $('.student-list').append("<div class='item'><img class='ui avatar image' src='images/user_img_0.jpg'></img><div class='content'><div class='header'>"+hosts[index].first_name+" "+hosts[index].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(hosts[index].avg_score).toFixed(2)+"</a></div></div></div></div>");
          $('.partner-list').append("<div class='item'><div class='right floated content'><div class='ui button add-user-button' onclick='onClickPairingButton("+ hosts[index].enrollment_id + "," + hosts[index].avg_score + "," + hosts[index].partner_id + " )'>Add</div></div><img class='ui avatar image' src='images/user_img_0.jpg'></img><div class='content'><div class='header'> - </div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score 0.00</a></div></div></div></div>");
        } else {
          $('.student-list').append("<div class='item'><img class='ui avatar image' src='images/user_img_0.jpg'></img><div class='content'><div class='header'>"+hosts[index].first_name+" "+hosts[index].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(hosts[index].avg_score).toFixed(2)+"</a></div></div></div></div>");
          $('.partner-list').append("<div class='item'><div class='right floated content'><div class='ui button add-user-button' onclick='onClickPairingButton("+ hosts[index].enrollment_id + "," + hosts[index].avg_score + "," + hosts[index].partner_id + " )'>Add</div></div><img class='ui avatar image' src='images/user_img_0.jpg'></img><div class='content'><div class='header'>"+partners[index].first_name+" "+partners[index].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'> score "+parseFloat(partners[index].avg_score).toFixed(2)+"</a></div></div></div></div>");
        }
      }
    } else {
        $(".student-list").append("<li class='ui item'>No student.</li>")
        $(".partner-list").append("<li class='ui item'>No student.</li>")
    }
    $('#student-list-modal').modal('show');
  });
}

function onPairingStatusOptionClick(){
  var parameters;
  if($('.pairing-status').attr('value') == 'Active') {
    parameters = {pairing_date_time_id: $('.pairing-status').attr('id'), status: 2, section_id: $('#section_id').attr('value')}
  } else if($('.pairing-status').attr('value') == 'Inactive') {
    parameters = {pairing_date_time_id: $('.pairing-status').attr('id'), status: 0, section_id: $('#section_id').attr('value')}
  }
  console.log('id : ' + $('.pairing-status').attr('id') + ', status: ' + parameters.status)
  $.ajax({
    url: '/classroom/updatePairingDateTimeStatus',
    type: 'put',
    data: parameters,
    success: function(data){
      const status = data.status
      if(status == 'Please, pair all student!') {
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
              $('#pairing-button-column').append("<div class='ui right floated alignedvertical animated viewStudentPairing button' value='"+data.pairing_date_time_id+"'><div class='hidden content' style='color:#5D5D5D;'>View</div><div class='visible content'><i class='eye icon'></i></div></div>")
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


function pad ( val ) { return val > 9 ? val : "0" + val; }
