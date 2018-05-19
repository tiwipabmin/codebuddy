$(document).ready(function() {
    $('#add-collaborator').click(function () {
        $('#select-partner-modal').modal('show');
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
function onClickAddUserButton(username) {
    $('#collaborator').val(username)
    $('#collaborator-hidden').val(username)
    $('#select-partner-modal').modal('hide');
    $('#newProject-modal').modal('show');
}

function onClickAcceptInvite(id) {
    var parameters = {id: id};
    $.ajax({
        url: '/dashboard/acceptInvite',
        type: 'PUT',
        data: {id: id},
        success: function(result) {
            location.reload();
        }
    });
}

function onClickDeclineInvite(id) {
    $.ajax({
        url: '/dashboard/declineInvite',
        type: 'DELETE',
        data: {id: id},
        success: function(result) {
            location.reload();
        }
    });
}

function onClickDeleteProject(id) {
    $.ajax({
        url: '/dashboard/deleteProject',
        type: 'DELETE',
        data: {id: id},
        success: function(result) {
            location.reload();
        }
    });
}

function pad ( val ) { return val > 9 ? val : "0" + val; }

