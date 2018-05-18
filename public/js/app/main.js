
// timer
var sec=Date.now()
var counts=0;
const startTimer = function (duration, display, changeRoleBtn) {
  const start = Date.now()
  let { diff, minutes, seconds } = 0

  function timer() {
    // get the number of seconds that have elapsed since 
    // startTimer() was called
    diff = duration - (((Date.now() - start) / 1000) | 0)
    // does the same job as parseInt truncates the float
    minutes = (diff / 60) | 0
    seconds = (diff % 60) | 0
    minutes = minutes < 10 ? "0" + minutes : minutes
    seconds = seconds < 10 ? "0" + seconds : seconds
    display.textContent = `${minutes} : ${seconds}`
    if (diff <= 0) {
      // add one second so that the count down starts at the full duration
      // example 05:00 not 04:59
      //start = Date.now() + 1000;
      display.textContent = 'Time out'
      //alert("Role Changed !");
      changeRoleBtn.disabled = false
    }
  }
  timer()
  setInterval(timer, 1000)
}

window.onload = function () {
  let fiveMinutes = 60 * 15
  let display = document.querySelector('#time')
  let changeRoleBtn = document.querySelector('#changeRoleBtn')
  startTimer(fiveMinutes, display, changeRoleBtn)
}

window.onload = function() {
  var video = document.getElementById('localVideo');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  var tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(1);
  tracker.setStepSize(1);
  tracker.setEdgesDensity(0.1);
  tracking.track('#localVideo', tracker, { camera: true });

  // setInterval( function(){
  //   var flag = 0;
  //   // tracker.run()
  //   console.log("time" + pad(((Date.now()-sec)/1000)%60))
  //   tracker.on('track', function(event) {
  //     // context.translate(canvas.width, 0);
  //     context.clearRect(0, 0, canvas.width, canvas.height);
  //     event.data.forEach(function(rect) {
        
  //       // context.strokeStyle = '#a64ceb'; canvas.width-rect.x-rect.width
  //       context.strokeStyle = '#ffffff';
  //       context.strokeRect(rect.x+120, rect.y, rect.width, rect.height);
  //       context.font = '11px Helvetica';
  //       context.fillStyle = "#fff";
  //       // context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
  //       // context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
        
  //       if(flag == 0){
  //         flag = 1;
  //         counts++;
  //         console.log(counts + " ===== " + pad(((Date.now()-sec)/1000)%60))
  //         document.getElementById("secs").innerHTML=pad(((Date.now()-sec)/1000)%60);
  //         document.getElementById("mins").innerHTML=pad(parseInt(((Date.now()-sec)/1000)/60,10));
  //         document.getElementById("counts").innerHTML=counts;
  //         $(this).stop()
  //       }
  
  //       // document.getElementById('my_timer').innerHTML = count
  //     });
  //   }, 1000);
 
  // });

  var trackingTimer = setInterval(trackerTimer, 1000);

  function trackerTimer(){
    var flag = 0;
    tracker.on('track', function(event) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        event.data.forEach(function(rect) {
          context.strokeStyle = '#ffffff';
          context.strokeRect(rect.x+120, rect.y, rect.width, rect.height);
          context.font = '11px Helvetica';
          context.fillStyle = "#fff";
          if(flag == 0){
            counts = counts + 1;
            document.getElementById("counts_min_sec").innerHTML="active time: " + pad(parseInt(counts/60)) + ":" + pad(counts%60) + " mins";
            $("#counts_min_sec").attr("data-count", counts);
            $("#counts_min_sec").attr("data-min", pad(parseInt(counts/60)));
            $("#counts_min_sec").attr("data-sec", pad(counts%60));
            $(this).stop()
          }
        });
        flag = 1;
    });  
  }  

  var gui = new dat.GUI();
  gui.add(tracker, 'edgesDensity', 0.1, 0.5).step(0.01);
  gui.add(tracker, 'initialScale', 1.0, 10.0).step(0.1);
  gui.add(tracker, 'stepSize', 1, 5).step(0.1);
};

function pad ( val ) { return val > 9 ? val : "0" + val; }
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