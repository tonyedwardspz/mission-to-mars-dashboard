let stories = [];
let bonusStories = [];
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

    loadBonusStories().then((data) => {
        bonusStories = data;
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

        if (mission == {} || (new Date(mission.end) < new Date())){
            $('#noMissionModal').modal('show');
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

function createExportJson() {

    console.log("Setting up export");
    let exportData = {
        teams: teams,
        mission: mission,
        hireCosts: hireCosts
    };

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 4));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href", dataStr );
    dlAnchorElem.setAttribute("download", "M2M Export" + Date() + ".json");
}

function createTransaction(team, story, value){
    let transaction = {
        date: new Date().getTime(),
        story: story,
        value: value
    }

    if (story.toLowerCase().includes("starting")){
        transaction.date = new Date(mission.start).setHours(10, 0, 0, 0);
    }

    team.transactions.push(transaction);
    return team;
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

function setFeedback(message, type, container) {

    let alert = document.createElement('div');
    alert.classList.add('alert');
    alert.classList.add(`alert-${type}`);
    alert.textContent = message;

    let feedback = document.querySelector(container);
    feedback.innerHTML = '';
    feedback.appendChild(alert);

    // remove the alert after 5 seconds
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 3000);
}

function setFormEventListeners() {

    if (window.location.pathname === '/setup') {
        updateRemoveTeamsSelect();
        createExportJson();

        $('#addTeamForm').on('submit', function(e) {
            e.preventDefault();
            console.log('Add team form submitted!');
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data)
            addTeam(data);
            updateRemoveTeamsSelect();
            setFeedback('Team added to current mission', 'success', '#teamAddedFeedbackContainer');
        });

        $('#remove-team-form').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            removeTeam(data.removeTeamName);
            setFeedback('Team removed from the current mission', 'danger', '#teamRemovedFeedbackContainer');
        });

        // newMission
        $('#newMission').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            newMission(data);
            setFeedback('Mission created', 'success', '#missionFeedbackContainer');
        });
    }

    if (window.location.pathname === '/admin') {
        $('#currentPrice').val(getCurrentPrice());

        console.log('Admin page');
        $('#story-complete-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Story Complete form submitted!');

            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            if (data.taskSecret == password){
                completeStory(data.taskDescription, data.teamName);
                setFeedback('Story completed', 'success', '#storyFeedbackContainer');
            } else {
                console.log('Incorrect password');
                setFeedback('Password Incomplete', 'danger', '#storyFeedbackContainer');
            }
        });

        $('#cost-incurred-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Cost Incurred form submitted!');

            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            if (data.costSecret == password){
                deductCost(data.costTeam, data.costValue);
                setFeedback('Hire cost deducted', 'success', '#hireFeedbackContainer');
            } else {
                console.log('Incorrect password');
                setFeedback('Password Incomplete', 'danger', '#hireFeedbackContainer');
            }
        });

        $('#bonus-earned-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Bonus form submitted!');

            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            if (data.bonusSecret == password){
                bonusEarned(data.bonusTeam, data.bonusPayout);
                setFeedback('Bonus earned', 'success', '#bonusAmountFeedbackContainer');
            } else {
                console.log('Incorrect password');
                setFeedback('Password Incomplete', 'danger', '#bonusAmountFeedbackContainer');
            }
        });

        $('#bonus-story-complete-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Bonus Story Complete form submitted!');

            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            if (data.bonusStorySecret == password){
                let story = findBonus(data.bonusStoryDescription);
                let team = findTeam(data.teamName);

                $('#bonusStoryDescription option[value="' + story.id + '"]').prop('disabled', true);
                for (let i = 1; i < 5; i++) {
                    if (team.bonusStoriesCompleted.indexOf(i) === -1) {
                        $('#bonusStoryDescription option[value="' + (i + 1) + '"]').prop('selected', true);
                        break;
                    }
                }
                completeBonus(data.bonusStoryDescription, data.teamName);
                setFeedback('Bonus story completed', 'success', '#bonusStoryFeedbackContainer');
            } else {
                console.log('Incorrect password');
                setFeedback('Password Incorrect', 'danger', '#bonusStoryFeedbackContainer');
            }
        });

        $('#taskDescription').on('change', function(e) {
            e.preventDefault();
            console.log('Task selection changes!');

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

        $('#bonusStoryTeamName').on('change', function(e) {
            console.log("Bonus story team selected ");
            let teamName = $('#bonusStoryTeamName').val();
            let team = findTeam(teamName);

            let select = $('#bonusStoryDescription');
            if (select) { 
                // get all options from the select
                let options = select.find('option');

                // loop the options. If the option value is in the team's completed bonus stories, disable the option
                options.each(function() {
                    let option = $(this);
                    if (team.bonusStoriesCompleted.indexOf(option.val()) > -1) {
                        option.prop('disabled', true);
                    } else {
                        option.prop('disabled', false);
                    }
                });

                options.each(function() {
                    // if the option isn't disabled, select it and break the loop
                    if (!$(this).prop('disabled')) {
                        $(this).prop('selected', true);
                        return false;
                    }
                });
            } else {
                console.error(`Element with ID ${id} not found.`);
            }
            select.trigger('change');
        });

        $('#bonusStoryDescription').on('change', function(e) {
            e.preventDefault();
            console.log('Bonus Story selection changes!');

            let id = e.target.value;
            let story = findBonus(id);

            let value = 0;
            if (story) {
                value = story.value;
            }

            $('#bonusStoryPayout').val(value);
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
    createTransaction(team, "Bounus Amount", bonus);
    saveTeams();
    console.log("Bonus added");
}

function deductCost(teamName, cost) {
    let team = findTeam(teamName);
    let spend = parseInt(cost) * getCurrentPrice();
    team.balance = parseInt(team.balance) - parseInt(spend);
    createTransaction(team, "Robot Hired for " + cost + " minutes", spend);
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

    createTransaction(team, "Story " + storyId + " completed", story.value);

    saveTeams();
    console.log("Story completed"); 
}

function completeBonus(storyId, teamName){
    let story = findBonus(storyId);
    let team = findTeam(teamName);
    team.balance = parseInt(team.balance) + parseInt(story.value);
    team.bonusStoriesCompleted.push(storyId);

    $('#bonusStoryDescription option[value="' + storyId + '"]').prop('disabled', true);
    
    let nextBonus;
    // find the next bonus story
    for (let i = 0; i < bonusStories.length; i++) {
        if (team.bonusStoriesCompleted.indexOf(bonusStories[i].id) === -1) {
            nextBonus = bonusStories[i];
            break;
        }
    }
    
    $('#bonusStoryDescription option[value="' + nextBonus + '"]').prop('selected', true);

    if (story) {
        value = story.value;
    }
    $('#bonusStoryPayout').val(value);

    createTransaction(team, "Bonus Story " + storyId + " completed", story.value);
    saveTeams();
    console.log("Story completed"); 
}

function addTeam(teamData){
    let team = new Team(teamData.teamName, teamData.teamBalance);
    team = createTransaction(team, "Starting Balance", teamData.teamBalance);

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

function findBonus(storyId){
    let storyIndex = bonusStories.findIndex(story => parseInt(story.id) === parseInt(storyId));
    if (storyIndex > -1) {
        return bonusStories[storyIndex];
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
        selects = ["#taskTeamName", "#teamCost", "#teamBonus", '#bonusStoryTeamName'];
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
                    } else {
                        $(this).prop('disabled', false);
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
