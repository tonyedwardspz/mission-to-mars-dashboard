function setupNewMission(missionData) {
    const mission = new Mission(
        missionData.name,
        missionData.start,
        missionData.end,
        missionData.startingPrice
    );
    
    saveJsonToLocalStorage(JSON.stringify(mission), 'mission');
    console.log("New mission set up:", mission);
    
    // Reset other mission-related data
    localStorage.removeItem('teams');
    localStorage.removeItem('prices');
    
    // You might want to generate new prices here
    generatePrices(mission.startingPrice);
}



function saveMission(missionData) {
    saveJsonToLocalStorage(JSON.stringify(missionData), 'mission');
    console.log("Mission saved:", missionData);
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