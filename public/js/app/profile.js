window.onload = function() {
    var username = $('#username').val();
    var pid = $('#pid').val();
    var parameters = {username: username, pid: pid};

    $.get('/lobby/getProgress', parameters, function(data) {

        document.getElementById("userInfo").innerHTML = data.fullname+'<br>(@'+data.username+')'
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
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
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
