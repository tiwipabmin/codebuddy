$(document).ready(function(){
	$('.chat').hide();
	$('#live-chat header').on('click', function() {
		$('.chat').slideToggle(300, 'swing');
		$(".chat-history").animate({ scrollTop: $('.message-list').height() }, "fast");
		$("#angle-up").toggleClass("rotate");
	});

	//export modal
	$('.ui.master.checkbox').checkbox({
		// check all children
		onChecked: function() {
		  var $childCheckbox  = $(this).closest('.checkbox').siblings('.list').find('.checkbox')
		  $childCheckbox.checkbox('check');
		},
		// uncheck all children
		onUnchecked: function() {
		  var $childCheckbox  = $(this).closest('.checkbox').siblings('.list').find('.checkbox');
		  $childCheckbox.checkbox('uncheck');
		}
	  })  
	$('.list .child.checkbox').checkbox({
		// Fire on load to set parent value
		fireOnInit : true,
		// Change parent state on each child checkbox change
		onChange   : function() {
		  var
			$listGroup      = $(this).closest('.list'),
			$parentCheckbox = $listGroup.closest('.item').children('.checkbox'),
			$checkbox       = $listGroup.find('.checkbox'),
			allChecked      = true,
			allUnchecked    = true
		  ;
		  // check to see if all other siblings are checked or unchecked
		  $checkbox.each(function() {
			if( $(this).checkbox('is checked') ) {
			  allUnchecked = false;
			}
			else {
			  allChecked = false;
			}
		  });
		  // set parent checkbox state, but dont trigger its onChange callback
		  if(allChecked) {
			$parentCheckbox.checkbox('set checked');
		  }
		  else if(allUnchecked) {
			$parentCheckbox.checkbox('set unchecked');
		  }
		  else {
			$parentCheckbox.checkbox('set indeterminate');
		  }
		}
	  })

});