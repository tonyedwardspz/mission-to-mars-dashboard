function setupDashCharts() {
    let ctx = document.getElementById('teamTotals').getContext('2d');
    let statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teams.map(team => team.name),
            datasets: [{
                label: "Current balance",
                data: teams.map(team => team.balance),
                backgroundColor: brandColors,
                borderColor: '#00E2B6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Balance'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Teams'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Team Balances'
                }
            }
        }
    });
}

function setupMissionChart(){
    let labels = getMissionDays();
    let groupedTransactions = groupTransactionsByHour(teams);
    let dataset = [];
    
    Object.keys(groupedTransactions).forEach(team => {
        let teamData = { "data": [] };
        Object.keys(groupedTransactions[team]).forEach(day => {
            Object.keys(groupedTransactions[team][day]).forEach(hour => {
                teamData.data.push( { "x": hour, "y": groupedTransactions[team][day][hour] } );  
            });
            teamData["label"] = team;
        });
        dataset.push(teamData);
    });
    console.log("processed data: ", dataset);

    let ctx = document.getElementById('teamRiseFall').getContext('2d');
    let missionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: dataset.map((data, index) => {
                return {
                    label: data.label,
                    data: data.data,
                    backgroundColor: brandColors[index],
                    borderColor: brandColors[index],
                    borderWidth: 1,
                    fill: false
                }        
            })
        },
        options: {
            spanGaps: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        min: new Date().setHours(10, 0, 0, 0),
                        max: new Date().setHours(17, 0, 0, 0),
                        stepSize: 2,
                        displayFormats: {
                            hour: 'hA'
                        }
                    },
                    parsing: false
                }
            }
        }
    });
}
