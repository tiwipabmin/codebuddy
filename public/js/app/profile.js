window.onload = function() {
    var userId = $('#userId').val();
    var parameters = {uid: userId};
    $.get('/dashboard/getProgress',parameters, function(data) {

        $('#score-label').html("Your average score is "+ parseFloat(data['user-score']).toFixed(2) + " point(s)");
        var scoreOptions = {
            animationEnabled: true,  
            title:{
                text: "Your Progress"
            },
            axisX: {
                title: "Project name",
                labelAngle: -30,
                interval: 1
            },
            axisY: {
                title: "Score(100 points)",
                valueFormatString: "",
            },
            data: [{
                type: "spline",
                markerSize: 5,
                yValueFormatString: "# points",
                dataPoints: data.scoreGraph
            }]
        };
        $("#scoreChartContainer").CanvasJSChart(scoreOptions); 
        
        $('#time-label').html("Your total active time is "+ parseFloat(data['user-time']).toFixed(2) + " minute(s)");
        var timeOptions = {
            animationEnabled: true,  
            title:{
                text: "Your Active Time"
            },
            axisX: {
                title: "Project name",
                labelAngle: -30,
                interval: 1
            },
            axisY: {
                title: "Time(minites)",
                valueFormatString: "",
            },
            data: [{
                type: "column",
                markerSize: 5,
                yValueFormatString: "# minutes",
                dataPoints: data.timeGraph
            }]
        };
        $("#timeChartContainer").CanvasJSChart(timeOptions); 
    })
}