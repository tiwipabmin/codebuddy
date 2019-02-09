$(document).ready(function(students) {
    $('.pairStudent').click(function () {
        $('.student-list').empty();
        var students = JSON.parse($('#students-object').attr('value'));
        for(student in students) {
          $('.student-list').append("<div class='item' id='student-" + students[student].student_id + "'><img class='ui avatar image' src='images/user_img_0.jpg'></img><div class='content'><div class='header'>"+students[student].first_name+" "+students[student].last_name+"</div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score "+parseFloat(students[student].avgScore).toFixed(2)+"</a></div></div></div></div>");
        }
        $('.partner-list').empty();
        for(student in students) {
          console.log("item : " + student)
          $('.partner-list').append("<div class='item' id='partner-" + students[student].student_id + "><div class='right floated content'><div class='ui button add-user-button' onclick=''>Add</div></div><img class='ui avatar image' src='images/user_img_0.jpg'></img><div class='content'><div class='header'> - </div><div class='description'><div class='ui circular labels' style='margin-top:2.5px;'><a class='ui teal label'>score 0.00</a></div></div></div></div>");
        }
        $('#student-list-modal').modal('show');
    })
    $('.menu .item').tab();
    $('#search-user-input').keyup(function () {
        var parameters = { search: $(this).val() };
        $.get( 'dashboard/searchUser',parameters, function(data) {
            $(".user-list").empty();
            if (data.length > 0) {
                data.forEach(function(user) {
                    $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-user-button' onclick='onClickAddUserButton(\"" +user.username+"\")'>Add</div></div><img class='ui avatar image' src='"+ user.img +"'><div class='content'><div class='header'>"+user.username+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(user.avgScore).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(user.totalTime/3600))+":"+pad(parseInt((user.totalTime-(parseInt(user.totalTime/3600)*3600))/60))+":"+pad(parseInt(user.totalTime%60))+"</div></div></div></div>");
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
        const uid = $(this).data("uid")
        const score = $(this).data("score")
        var parameters = { purpose: purpose, uid: uid, score: score};
        $.get( 'dashboard/searchUserByPurpose',parameters, function(data) {
            $(".user-purpose-list").empty();
            if (data.length > 0) {
                data.forEach(function(user) {
                    $(".user-purpose-list").append("<div class='item'><div class='right floated content'><div class='ui button add-user-button' onclick='onClickAddUserButton(\"" +user.username+"\")'>Add</div></div><img class='ui avatar image' src='"+ user.img +"'><div class='content'><div class='header'>"+user.username+"</div><div class='description'><div class='ui circular labels'><a class='ui teal label'>score "+parseFloat(user.avgScore).toFixed(2)+"</a></div><div style='font-size: 12px;'>total active time: "+pad(parseInt(user.totalTime/3600))+":"+pad(parseInt((user.totalTime-(parseInt(user.totalTime/3600)*3600))/60))+":"+pad(parseInt(user.totalTime%60))+"</div></div></div></div>");
                }, this);
            } else {
                $(".user-purpose-list").append("<li class='ui item'>No results</li>")
            }
        })
    })
})
