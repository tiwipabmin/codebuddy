$(document).ready(function() {

})

function on_click_change_pair() {
  console.log('Clicked!!!!!!!!')
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
