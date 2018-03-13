$(document).ready(function(){
	$('.chat').hide();
	$('#live-chat header').on('click', function() {
		$('.chat').slideToggle(300, 'swing');
		$(".chat-history").animate({ scrollTop: $('.message-list').height() }, "fast");
		$("#angle-up").toggleClass("rotate");
	});

});