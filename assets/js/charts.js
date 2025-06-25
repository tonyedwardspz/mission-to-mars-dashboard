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



function groupTransactionsByHour(teams) {
    const result = {};

    teams.forEach(team => {
        const teamName = team.name;
        const transactions = team.transactions;
        const dailyTotals = {};

        let missionDays = [];
        let count = 0;
        for (let date = new Date(mission.start); date <= new Date(); date.setDate(date.getDate() + 1)) {
            missionDays.push(date.getDay());

            if (!dailyTotals[count]) {
                dailyTotals[count.toString()] = {
                    "10": 0,
                    "11": 0,
                    "12": 0,
                    "13": 0,
                    "14": 0,
                    "15": 0,
                    "16": 0,
                    "17": 0 
                };
            }
            count++;
        }

        transactions.forEach(transaction => {

            const date = new Date(transaction.date);
            const day = date.getDay();
            const hour = date.getHours();
            const amount = transaction.value;
            const dayIndex = missionDays.indexOf(day);

            if (hour >= 10 && hour < 17) {
                if (transaction.story.toLowerCase().includes("hired") || transaction.story.toLowerCase().includes("deducted")) {
                    dailyTotals[dayIndex][hour] -= amount;
                } else {
                    dailyTotals[dayIndex][hour] += parseInt(amount);
                }
            } else if (hour >= 17) {
                if (transaction.story.toLowerCase().includes("hired") || transaction.story.toLowerCase().includes("deducted")) {
                    dailyTotals[dayIndex][17] -= amount;
                } else {
                    dailyTotals[dayIndex][17] += parseInt(amount);
                }
            } else if (hour < 10) {
                if (transaction.story.toLowerCase().includes("hired") || transaction.story.toLowerCase().includes("deducted")) {
                    dailyTotals[dayIndex][10] -= amount;
                } else {
                    dailyTotals[dayIndex][10] += parseInt(amount);
                }
            }
        });

        let lastTotal = 0;
        Object.keys(dailyTotals).forEach(day => {
            Object.keys(dailyTotals[day]).forEach(hour => {
                let total = dailyTotals[day][hour];
                if (total !== lastTotal) {
                    lastTotal += parseInt(total);
                }
                dailyTotals[day][hour] = lastTotal;
            });
        });

        console.log("Daily totals: ", dailyTotals);
        result[teamName] = dailyTotals;
    });
    return result;
}