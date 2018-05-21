window.onload = function() {
    var userId = $('#userId').val();
    var parameters = {uid: userId};
    $.get('/dashboard/getProgress',parameters, function(data) {
        
        var progressOptions = {
            animationEnabled: true,  
            title:{
                text: "Your Progress"
            },
            axisX: {
                title: "Project",
                titleFontSize: 18,
                interval: 1,
                labelFontSize: 16,
            },
            axisY: {
                title: "Accumulated Average Score(100 points)",
                titleFontSize: 18,
                valueFormatString: "",
                minimum: 0,
                maximum: 100,
                stripLines: [{
                    value: parseFloat(data['user-score']).toFixed(2),
                    label: "Average Score"
                }]
            },
            data: [{
                type: "spline",
                markerSize: 5,
                yValueFormatString: "#.## points",
                dataPoints: data.progressGraph
            }]
        };
        $("#progressChartContainer").CanvasJSChart(progressOptions); 

        $('#score-label').html("Your average score is "+ parseFloat(data['user-score']).toFixed(2) + " point(s)");
        var scoreOptions = {
            animationEnabled: true,  
            title:{
                text: "Your Scores"
            },
            axisX: {
                title: "Project name",
                titleFontSize: 18,
                labelAngle: -30,
                interval: 1,
                labelFontSize: 16,
            },
            axisY: {
                title: "Score(100 points)",
                titleFontSize: 18,
                valueFormatString: "",
                minimum: 0,
                maximum: 100,
                stripLines: [{
                    value: parseFloat(data['user-score']).toFixed(2),
                    label: "Average Score"
                }]
            },
            data: [{
                type: "column",
                markerSize: 5,
                yValueFormatString: "#.## points",
                dataPoints: data.scoreGraph
            }]
        };
        $("#scoreChartContainer").CanvasJSChart(scoreOptions); 
        
        $('#time-label').html("Your total active time is "+ parseFloat(data['user-time']).toFixed(2) + " minute(s)");
        var timeOptions = {
            animationEnabled: true,  
            title:{
                text: "Your Active Times"
            },
            axisX: {
                title: "Project name",
                titleFontSize: 18,
                labelAngle: -30,
                interval: 1,
                labelFontSize: 16,
            },
            axisY: {
                title: "Time(minites)",
                titleFontSize: 18,
                valueFormatString: "",
            },
            data: [{
                type: "column",
                markerSize: 5,
                yValueFormatString: "#.## minutes",
                dataPoints: data.timeGraph
            }]
        };
        $("#timeChartContainer").CanvasJSChart(timeOptions); 
    })
}