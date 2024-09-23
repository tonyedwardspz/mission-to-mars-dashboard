
var bonusStories = [];
var teams = [];
var mission = {};
var hireCosts = {};
let password = 'secret';
let robotHireCost = 14;
const brandColors = ["#00E2B6", "#FB48FE", "#010033", "#49008A", "#01CCE5", "#00126B", "#00E2B6", "#FB48FE", "#010033", "#49008A", "#01CCE5", "#00126B"];

$( document ).ready(function() {
    console.log( "ready at " + window.location.pathname);

    loadStories().then((data) => {
        stories = data;
    }).catch(error => {
        showErrorModal("Failed to load stories: " + error);
    });

    loadBonusStories().then((data) => {
        bonusStories = data;
    }).catch(error => {
        showErrorModal("Failed to load bonus stories: " + error);
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

        if (mission == null){
            $('#noMissionModal').modal('show');
        }
    }

    if (window.location.pathname === '/prices') {
        fillHireCostsTable();
    }

    if (window.location.pathname === '/setup') {
        bsCustomFileInput.init();
    }

    setFormEventListeners();
});

function loadPrices(){
    let pricesJson = loadJsonFromLocalStorage('prices');
    if (pricesJson) {
        hireCosts = JSON.parse(pricesJson);
        console.log("Prices loaded: ", hireCosts);
    } else {
        showErrorModal("Failed to load prices from local storage");
    }
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

function importJson(event) {
    console.log("Importing JSON");
    var fileInput = document.getElementById('jsonImportSelect');
    
    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        var data = JSON.parse(contents);
        console.log(data);
        teams = data.teams;
        mission = data.mission;
        hireCosts = data.hireCosts;
        saveTeams();
        saveMission();
        saveCosts();
        console.log("Data imported");
        // window.location.reload();
    };
    reader.readAsText(file);
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

// function setupDashCharts(){
//     let ctx = document.getElementById('teamTotals').getContext('2d');
//     let statusChart = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: teams.map(team => team.name),
//             datasets: [{
//                 label: "Current balance",
//                 data: teams.map(team => team.balance),
//                 backgroundColor: brandColors,
//                 borderColor: '#00E2B6',
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             scales: {
//                 xAxes: [{
                    
//                 }],
//                 yAxes: [{
//                     ticks: {
//                         beginAtZero: true,
//                         },
//                 }]
//             }
//         }
//     });
// }

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

function getMissionDays() {
    let startDate = new Date(mission.start);
    let endDate = new Date(mission.end);
    let today = new Date();
    let labels = [];

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        for (let hour = 10; hour <= 17; hour++) {
            let time = new Date(date);
            time.setHours(hour, 0, 0, 0);
            if (time > today) {
                break;
            }
            labels.push(time.toLocaleString('en-UK', { weekday: 'short', hour: 'numeric', hour12: true }));
        }
    }

    return labels;
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

// a function that resets all data in the app.
function resetData() {
    localStorage.removeItem('teams');
    localStorage.removeItem('mission');
    localStorage.removeItem('prices');
    location.reload();
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

        $('#newMission').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            newMission(data);
            setFeedback('Mission created', 'success', '#missionFeedbackContainer');
        });

        $('#edit-team-form').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            let team = findTeam(data.editTeamName);
            team.name = data.updatedTeamName;
            teams[teams.findIndex(t => t.name === data.editTeamName)] = team;
            saveTeams();
            fillTeamSelect();
            setFeedback('Team Edit Saved', 'success', '#teamEditedFeedbackContainer');
        });

        $('#edit-team-form').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            let team = findTeam(data.editTeamName);
            team.name = data.updatedTeamName;
            teams[teams.findIndex(t => t.name === data.editTeamName)] = team;
            saveTeams();
            fillTeamSelect();
            setFeedback('Team Edit Saved', 'success', '#teamEditedFeedbackContainer');
        });

        $('#editTeamName').on('change', function(e) {
            e.preventDefault();
            let teamName = $('#editTeamName').val();
            $('#updatedTeamName').val(teamName);
        });

        $('#jsonUploadForm').on('submit', function(e) {
            e.preventDefault();
            console.log('Importing JSON now');
            importJson(e);
        });

        $('#resetDashboard').on('click', function(e) {
            e.preventDefault();
            console.log('Are you sure you want to reset all data?');
            $('#deleteDatanModal').modal('show');
            
        });

        $('#resetDataConfirmed').on('click', function(e) {
            console.log('Resetting data');
            resetData();
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
                        team.bonusStoriesCompleted.push(i);
                        team.balance += story.payout;
                        createTransaction(team, story.description, story.payout);
                        saveTeams();
                        break;
                    }
                }
                setFeedback('Bonus story completed', 'success', '#bonusStoryFeedbackContainer');
            } else {
                console.log('Incorrect password');
                setFeedback('Password Incomplete', 'danger', '#bonusStoryFeedbackContainer');
            }
        });
    }
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

        $('#newMission').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            newMission(data);
            setFeedback('Mission created', 'success', '#missionFeedbackContainer');
        });

        $('#edit-team-form').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            let team = findTeam(data.editTeamName);
            team.name = data.updatedTeamName;
            teams[teams.findIndex(t => t.name === data.editTeamName)] = team;
            saveTeams();
            fillTeamSelect();
            setFeedback('Team Edit Saved', 'success', '#teamEditedFeedbackContainer');
        });

        $('#edit-team-form').on('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            console.log(data);
            let team = findTeam(data.editTeamName);
            team.name = data.updatedTeamName;
            teams[teams.findIndex(t => t.name === data.editTeamName)] = team;
            saveTeams();
            fillTeamSelect();
            setFeedback('Team Edit Saved', 'success', '#teamEditedFeedbackContainer');
        });

        $('#editTeamName').on('change', function(e) {
            e.preventDefault();
            let teamName = $('#editTeamName').val();
            $('#updatedTeamName').val(teamName);
        });

        $('#jsonUploadForm').on('submit', function(e) {
            e.preventDefault();
            console.log('Importing JSON now');
            importJson(e);
        });

        $('#resetDashboard').on('click', function(e) {
            e.preventDefault();
            console.log('Are you sure you want to reset all data?');
            $('#deleteDatanModal').modal('show');
            
        });

        $('#resetDataConfirmed').on('click', function(e) {
            console.log('Resetting data');
            resetData();
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
                        team.bonusStoriesCompleted.push(i);
                        team.balance += story.payout;
                        createTransaction(team, story.description, story.payout);
                        saveTeams();
                        break;
                    }
                }
                setFeedback('Bonus story completed', 'success', '#bonusStoryFeedbackContainer');
            } else {
                console.log('Incorrect password');
                setFeedback('Password Incomplete', 'danger', '#bonusStoryFeedbackContainer');
            }
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
    team.color = brandColors[teams.length];
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

function loadMission() {
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
        selects = ["#removeTeamName", "#editTeamName"];
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