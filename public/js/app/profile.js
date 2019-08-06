window.onload = function() {
    var username = $('#username').val();
    var pid = $('#pid').val();
    var parameters = {username: username, pid: pid};

    $.get('/lobby/getProgress', parameters, function(data) {

        document.getElementById("userInfo").innerHTML = 'Subject ID: '+data.subjectId+'<br>'+data.fullname+'<br>(@'+data.username+')'
        document.getElementById("projectsNum").innerHTML = data.projectTitles.length
        document.getElementById("totalActiveTimeNum").innerHTML = parseInt(data['user-time'])+' mins'
        document.getElementById("avgScoreNum").innerHTML = data['user-score'].toFixed(2)

        new Chart(document.getElementById("projectTimeChart"), {
            type: 'doughnut',
            data: {
                labels: data.projectTitles,
                datasets: [{
                    data: data.projectTimes,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: 'Project Time'
                },
                plugins: {
                    colorschemes: {
                        scheme: 'office.BlueGreen6'
                    }
                },
                tooltips: {
                    callbacks: {
                        title: function (tooltipItem, data) {
                            return data['labels'][tooltipItem[0]['index']];
                        },
                        label: function (tooltipItem, data) {
                            var sec_num = data['datasets'][0]['data'][tooltipItem['index']];
                            var hours = Math.floor(sec_num / 3600);
                            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                            var seconds = sec_num - (hours * 3600) - (minutes * 60);

                            hours > 0 ? hours += 'h ' : hours = ''
                            minutes > 0 ? minutes += 'm ' : minutes = ''
                            seconds > 0 ? seconds += 's ' : seconds = ''
                            return hours + minutes + seconds;
                        },
                        afterLabel: function (tooltipItem) {
                            var enter = data.enters[tooltipItem['index']]
                            var pairing = data.pairings[tooltipItem['index']]
                            return 'Enters: ' + enter + ' times' + '\nPairings: ' + pairing + ' times';
                        }
                    }
                }
            }
        });

        new Chart(document.getElementById("projectScoreChart"), {
            type: 'line',
            data: {
                labels: data.projectTitles,
                datasets: [{
                    data: data.projectScores,
                    fill: false,
                    lineTension: 0.1
                }],
            },
            options: {
                title: {
                    display: true,
                    text: 'Project Score'
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        offset: true,
                        gridLines: {
                            display: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Project'
                        },
                        ticks: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: 100
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Score'
                        }
                    }]
                },
                plugins: {
                    colorschemes: {
                        scheme: 'office.BlueGreen6'
                    }
                }
            }
        });

        new Chart(document.getElementById("locChart"), {
            type: 'bar',
            data: {
                labels: data.projectTitles,
                datasets: [{
                    data: data.linesOfCodes,
                    backgroundColor: Chart.colorschemes.office['BlueGreen6'],
                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'Lines of Code'
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        offset: true,
                        gridLines: {
                            display: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Project'
                        },
                        ticks: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Lines'
                        }
                    }]
                },
                plugins: {
                    colorschemes: {
                        scheme: 'office.BlueGreen6'
                    }
                }
            }
        });

        new Chart(document.getElementById("productivityChart"), {
            type: 'line',
            data: {
                labels: data.projectTitles,
                datasets: [{
                    data: data.productivitys,
                    fill: false,
                    lineTension: 0.2,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: 'Productivity'
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        offset: true,
                        gridLines: {
                            display: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Project'
                        },
                        ticks: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'LoC per hours'
                        }
                    }]
                },
                plugins: {
                    colorschemes: {
                        scheme: 'office.BlueGreen6'
                    }
                }
            }
        });

        new Chart(document.getElementById("errorChart"), {
            type: 'line',
            data: {
                labels: data.projectTitles,
                datasets: [{
                    data: data.errors,
                    fill: false,
                    lineTension: 0.1
                }],
            },
            options: {
                title: {
                    display: true,
                    text: 'Error Occurs'
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        offset: true,
                        gridLines: {
                            display: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Project'
                        },
                        ticks: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            userCallback: function(label, index, labels) {
                                // when the floored value is the same as the value we have a whole number
                                if (Math.floor(label) === label) {
                                    return label;
                                }

                            },
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Errors (times)'
                        }
                    }]
                },
                plugins: {
                    colorschemes: {
                        scheme: 'office.BlueGreen6'
                    }
                }
            }
        });
    })
}
