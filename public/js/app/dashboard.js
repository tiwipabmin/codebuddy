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
                    $(".user-list").append("<div class='item'><div class='right floated content'><div class='ui button add-user-button' onclick='onClickAddUserButton(\"" +user.username+"\", \"" +user.username+"\", \"" +user.username+"\")'>Add</div></div><img class='ui avatar image' src='/images/christian.jpg'><div class='content'><div class='header'>"+user.username+"</div></div></div>");
                }, this);  
            } else {
                $(".user-list").append("<li class='ui item'>No results</li>")
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