let stories = [];
let teams = [];
let password = 'secret';
let mission = {};
let robotHireCost = 14;
let hireCosts = {};

$( document ).ready(function() {
    console.log( "ready at " + window.location.pathname);

    loadStories().then((data) => {
        stories = data;
    });

    loadTeams();
    loadMission();
    loadPrices();

    fillTeamSelect();

    if (window.location.pathname === '/') {
        if (teams != null){
            fillStatusTable();
            setupDashCharts();
            setupMissionChart();
        }
    }

    if (window.location.pathname === '/prices') {
        fillHireCostsTable();
    }

    setFormEventListeners();
});

function loadPrices(){
    let pricesJson = loadJsonFromLocalStorage('prices');
    hireCosts = JSON.parse(pricesJson);
    console.log("Prices loaded: ", hireCosts);
}

function setupDashCharts(){
    let ctx = document.getElementById('teamTotals').getContext('2d');
    let statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teams.map(team => team.name),
            datasets: [{
                label: 'Balance',
                data: teams.map(team => team.balance),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Teams'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Balance'
                    }
                }
            }
        }
    });
}


function setupMissionChart(){
    let ctx = document.getElementById('teamRiseFall').getContext('2d');
    let missionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: getMissionDays(),
            datasets: teams.map(team => {
                return {
                    label: team.name,
                    data: [5000, team.balance],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            })
        },
    });
}

function getMissionDays() {
    let startDate = new Date(mission.start);
    let endDate = new Date(mission.end);
    let today = new Date();
    let days = [];
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date > today) {
            break;
        }
        days.push(date.toLocaleDateString());
    }
    return days;
}

function setFormEventListeners() {

    if (window.location.pathname === '/setup') {
        $('#cuurentPrice').val(getCurrentPrice());
        updateRemoveTeamsSelect();

        $('#addTeamForm').on('submit', function(e) {
            e.preventDefault();
            console.log('Add team form submitted!');
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data)
            addTeam(data);
            updateRemoveTeamsSelect();
        });

        $('#remove-team-form').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            removeTeam(data.removeTeamName);
        });

        // newMission
        $('#newMission').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            newMission(data);
        });
    }

    if (window.location.pathname === '/admin') {
        console.log('Admin page');
        $('#story-complete-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Story Complete form submitted!');

            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            if (data.taskSecret == password){
                completeStory(data.taskDescription, data.teamName);
            } else {
                console.log('Incorrect password');
            }
        });

        $('#cost-incurred-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Cost Incurred form submitted!');

            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            if (data.costSecret == password){
                deductCost(data.costTeam, data.costValue);
            } else {
                console.log('Incorrect password');
            }
        });

        $('#bonus-earned-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Bonus form submitted!');

            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            if (data.bonusSecret == password){
                bonusEarned(data.bonusTeam, data.bonusPayout);
            } else {
                console.log('Incorrect password');
            }
        });

        $('#taskDescription').on('change', function(e) {
            e.preventDefault();
            console.log('Bonus form submitted!');

            let id = e.target.value;
            let story = findStory(id);
            let teamName = $('#taskTeamName').val();
            let team = findTeam(teamName);

            $('#task-description option[value="' + story.id + '"]').prop('disabled', true);
            $('#task-description option[value="' + team.currentStory + '"]').prop('selected', true);

            let value = 0;
            if (story) {
                value = story.value;
            }

            $('#taskPayout').val(value);
        });
    }
}

function updateRemoveTeamsSelect() {
    try {
        let select = document.querySelector('#removeTeamName');
        select.innerHTML = '';
        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = '-- Select Team --';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        teams.forEach(team => {
            let option = document.createElement('option');
            option.value = team.name;
            option.text = team.name;
            select.appendChild(option);
        });
    } catch (e){
        console.error('Error updating remove team select:', e);
    }
    
}

function newMission(missionData){
    mission = new Mission(missionData.missionName, missionData.startDate, missionData.endDate, missionData.coreCoinPrice);
    
    localStorage.removeItem('mission');
    localStorage.removeItem('teams');
    localStorage.removeItem('prices');
    
    saveMission();
    teams = [];

    hireCosts = getPrices(parseInt(mission.startingPrice), "5", 4 );
    saveCosts();

    console.log("Mission created");
}

function saveCosts(){
    let costsJson = JSON.stringify(hireCosts);
    saveJsonToLocalStorage(costsJson, 'prices');

}

function bonusEarned(teamName, bonus){
    let team = findTeam(teamName);
    team.balance = parseInt(team.balance) + parseInt(bonus);
    saveTeams();
    console.log("Bonus added");
}

function deductCost(teamName, cost) {
    let team = findTeam(teamName);
    team.balance = parseInt(team.balance) - (parseInt(cost) * getCurrentPrice());
    saveTeams();
    console.log("Cost deducted");
}

function completeStory(storyId, teamName){
    let story = findStory(storyId);
    let team = findTeam(teamName);
    team.balance = parseInt(team.balance) + parseInt(story.value);
    team.currentStory++;

    $('#taskDescription option[value="' + storyId + '"]').prop('disabled', true);
    $('#taskDescription option[value="' + team.currentStory + '"]').prop('selected', true);

    if (story) {
        value = story.value;
    }

    $('#taskPayout').val(value);

    saveTeams();
    console.log("Story completed"); 
}

function addTeam(teamData){
    let team = new Team(teamData.teamName, teamData.teamBalance);
    teams.push(team);
    console.log(teams);
    saveTeams();
}

function removeTeam(teamName){
    let teamIndex = teams.findIndex(team => team.name.toLowerCase() === teamName.toLowerCase());
    if (teamIndex > -1) {
        teams.splice(teamIndex, 1);
    }
    console.log(teams);
    saveTeams();
}

function findTeam(teamName){
    let teamIndex = teams.findIndex(team => team.name.toLowerCase() === teamName.toLowerCase());
    if (teamIndex > -1) {
        return teams[teamIndex];
    }
}

function findStory(storyId){
    let storyIndex = stories.findIndex(story => parseInt(story.id) === parseInt(storyId));
    if (storyIndex > -1) {
        return stories[storyIndex];
    }
}

function saveTeams(){
    let teamsJson = JSON.stringify(teams);
    saveJsonToLocalStorage(teamsJson, 'teams');
}

function loadTeams(){
    let teamsJson = loadJsonFromLocalStorage('teams');
    teams = JSON.parse(teamsJson);
    console.log("Teams loaded: ", teams);
}

function saveMission(){
    let missionJson = JSON.stringify(mission);
    saveJsonToLocalStorage(missionJson, 'mission');
}

function loadMission(){
    let missionJson = loadJsonFromLocalStorage('mission');
    mission = JSON.parse(missionJson);
    console.log("Mission loaded: ", mission);
}

function fillTeamSelect(){
    if (teams == null)
        return;
    if(teams != null){
        if (Object.keys(teams).length === 0) 
            return;
    }

    let selects = [];
    if (window.location.pathname === '/setup') {
        selects = ["#removeTeamName"];
    } else if (window.location.pathname === '/admin') {
        selects = ["#taskTeamName", "#teamCost", "#teamBonus"];
    } 

    selects.forEach(id => {
        let select = document.querySelector(id);
        if (select) { 
            select.innerHTML = '';
            
            let defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.text = '-- Select Team --';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);
            
            teams.forEach(team => {
            let option = document.createElement('option');
            option.value = team.name;
            option.text = team.name;
            select.appendChild(option);
            });
        } else {
            console.error(`Element with ID ${id} not found.`);
        }
    });

    if (window.location.href.endsWith('admin')) {
        let teamSelect = document.querySelector('#taskTeamName');
        if (teamSelect) {
            teamSelect.addEventListener('change', (e) => {
                console.log('Team selected');

                let teamName = $('#taskTeamName').val();
                let team = teams.find(team => team.name === teamName);
                let currentStory = team.currentStory;

                $('#taskDescription option[value="' + currentStory + '"]').prop('selected', true);

                $('#taskDescription option').each(function() {
                    if (parseInt($(this).val()) < currentStory) {
                        $(this).prop('disabled', true);
                    }
                });

                let value = 0;
                let story = findStory(currentStory);
                if (story) {
                    value = story.value;
                }

                $('#taskPayout').val(value);
            });
        }
    }
}

function getCurrentPrice(){
    let price = mission.startingPrice;
    let startDate = new Date(mission.start);
    let endDate = new Date(mission.end);
    let today = new Date();

    let i = 0;
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        i++;
        for (let hour = 10; hour < 16; hour++) {
            let j = 0;
            for (let minute = 0; minute < 60; minute += 15) {
                j++;

                if (date > today) {
                    return price;
                }
                price = hireCosts[i][j-1];
            }
        }
    }
    return price;
}

function fillStatusTable(){
    if (teams == null)
        return;
    if(teams != null){
        if (Object.keys(teams).length === 0) 
            return;
    }

    let table = document.querySelector('#teamStatusLabel');
    table.innerHTML = '';
    teams.forEach(team => {
        let row = document.createElement('tr');
        let name = document.createElement('td');
        name.textContent = team.name;
        let balance = document.createElement('td');
        balance.textContent = team.balance;
        let currentStory = document.createElement('td');
        currentStory.textContent = team.currentStory;
        row.appendChild(name);
        row.appendChild(balance);
        row.appendChild(currentStory);
        table.appendChild(row);
    });
}

function fillHireCostsTable(){

    let startdate = new Date(mission.start);
    let enddate = new Date(mission.end);
    let now = Date.now();

    let costsTable = [];

    let i = 0;
    let lastCost = 0;
    // loop every date from the start date to now
    dayloop: for (let date = startdate; date <= enddate; date.setDate(date.getDate() + 1)) {
        // loop over each hour between 10am and 4pm, in 15 minute intervals
        i++;
        let j = 0;
        for (let hour = 10; hour < 17; hour++) {
            
            for (let minute = 0; minute < 60; minute += 15) {
                j++;
                let time = new Date(date);
                time.setHours(hour, minute);

                if (time > now) {
                    break dayloop;
                }
                
                let cost = hireCosts[i][j-1];
                
                let diff;
                if (i === 1 && j === 1) {
                    diff = 0;
                } else {
                    diff = cost - lastCost;
                }

                let formattedTime = time.toLocaleString('en-UK', { hour: 'numeric', minute: 'numeric', hour12: true });
                costsTable.push({ date: date.toDateString(), time: formattedTime, cost: cost, diff: diff });
                lastCost = cost;
            }
        }
        costsTable.push({date: "Date", time: "Time" , cost: "Price", diff: "Difference"});
    }

    let table = document.querySelector('#hireCostsTable');
    table.innerHTML = '';
    Object.keys(costsTable).forEach(key => {
        let row = document.createElement('tr');

        let date = document.createElement('td');
        date.textContent = costsTable[key].date;
        let time = document.createElement('td');
        time.textContent = costsTable[key].time;
        let cost = document.createElement('td');
        cost.textContent = "£ " + costsTable[key].cost;
        let diff = document.createElement('td');
        diff.textContent = costsTable[key].diff;

        row.appendChild(date);
        row.appendChild(time);
        row.appendChild(cost);
        row.appendChild(diff);

        if (costsTable[key].date === "Date") {
            // add the class table-active to the row
            row.classList.add('table-active');
            table.appendChild(row);
        } else {
            table.appendChild(row);
        }
    });
}
