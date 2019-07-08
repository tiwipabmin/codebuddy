$(document).ready(function() {

})

function on_click_change_pair() {
  let pairing_session_id = $('#pairing_session_id').attr('value')
  let section_id = $('#section_id').attr('value')
  // console.log('pairing_session_id, ', pairing_session_id, ', section_id, ', section_id)
  let parameters = {pairing_session_id: pairing_session_id, section_id: section_id}
  $.get('/classroom/getPairing', parameters, function(data) {
    if(data.status == 'Pull information successfully'){
      $('#partner_keys').attr('value', data.partner_keys)
      $('#cloning_partner_keys').attr('value', data.partner_keys)
      $('#pairing_objective').attr('value', data.pairing_objective)
      $('#confirm-pairing').attr('value', 'change')
      $('#confirm-header').text('Alert!')
      $('#confirm-message').text('Something message.')
      $('#confirm-message').attr('value', 'Something message.')
      showStudentList('pair', pairing_session_id)
      pairingOrViewingisHided('pair')
      alert(data.status)
    } else {
      alert(data.status)
    }
  })
}

function onClickAlphabeticalFilterButton(){

  var completed_filter = false
  var hasElementMoving = false
  var student_objects = JSON.parse($('#student_objects').attr('value'))

  var active_filter = $('#active_filter').attr('value')
  if(active_filter == '1-100' || active_filter == '100-1' || active_filter == '') {
    $('#avg_score_filter').attr('class', 'ui button')
    $('#alphabetical_filter').attr('class', 'ui grey button')

    $('#avg_score_filter').attr('value', '1-100')
    $('#avg_score_filter').text('1-100')
  }

  if($('#alphabetical_filter').attr('value') == 'A-Z') {
    $('#alphabetical_filter').attr('value', 'Z-A')
    $('#alphabetical_filter').text('Z-A')


    $('#active_filter').attr('value', 'A-Z')

    sort_A_to_Z(student_objects, completed_filter, hasElementMoving)

  } else if($('#alphabetical_filter').attr('value') == 'Z-A') {
    $('#alphabetical_filter').attr('value', 'A-Z')
    $('#alphabetical_filter').text('A-Z')

    $('#active_filter').attr('value', 'Z-A')

    sort_Z_to_A(student_objects, completed_filter, hasElementMoving)
  }
}

function onClickAvgScoreFilterButton() {

  var completed_filter = false
  var hasElementMoving = false
  var student_objects = JSON.parse($('#student_objects').attr('value'))

  var active_filter = $('#active_filter').attr('value')
  if(active_filter == 'A-Z' || active_filter == 'Z-A' || active_filter == '') {
    $('#avg_score_filter').attr('class', 'ui grey button')
    $('#alphabetical_filter').attr('class', 'ui button')

    $('#alphabetical_filter').attr('value', 'A-Z')
    $('#alphabetical_filter').text('A-Z')
  }

  if($('#avg_score_filter').attr('value') == '1-100') {
    $('#avg_score_filter').attr('value', '100-1')
    $('#avg_score_filter').text('100-1')

    $('#active_filter').attr('value', '1-100')

    sort_avg_score_1_to_100(student_objects, completed_filter, hasElementMoving)

  } else if($('#avg_score_filter').attr('value') == '100-1') {
    $('#avg_score_filter').attr('value', '1-100')
    $('#avg_score_filter').text('1-100')

    $('#active_filter').attr('value', '100-1')

    sort_avg_score_100_to_1(student_objects, completed_filter, hasElementMoving)

  }
}
