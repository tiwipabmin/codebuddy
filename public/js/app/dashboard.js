$(document).ready(function() {
    function onClickAddPartner() {
        console.log("add partner")
    }
    $('#add-collaborator').click(function () {
        $('#select-partner-modal').modal('show');
    })
    $('.menu .item').tab();
}) 