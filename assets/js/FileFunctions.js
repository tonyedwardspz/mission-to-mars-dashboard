// Function to load stories from JSON file
function loadStories() {
    return new Promise((resolve, reject) => {
        $.getJSON("./_data/stories.json", function(data) {
            let stories = [];
            data.stories.forEach(story => {
                stories.push(new Story(story.id, story.description, story.acceptance, story.value));
            });
            resolve(stories); 
        }).fail(function(jqXHR, textStatus, errorThrown) {
            reject(errorThrown);
        });
    });
}

// Function to load bonus stories from JSON file
function loadBonusStories() {
    return new Promise((resolve, reject) => {
        $.getJSON("./_data/stories.json", function(data) {
            let stories = [];
            data.bonusStories.forEach(story => {
                stories.push(new Story(story.id, story.description, story.acceptance, story.value));
            });
            resolve(stories); 
        }).fail(function(jqXHR, textStatus, errorThrown) {
            reject(errorThrown);
        });
    });
}

// Function to save JSON to local storage
function saveJsonToLocalStorage(jsonString, key) {
    console.log("Saving JSON to local storage", jsonString);
    console.log("Type of jsonString:", typeof jsonString);
    
    if (typeof jsonString !== 'string') {
        throw new Error('The jsonString parameter must be a string.');
    }
    if (typeof key !== 'string') {
        throw new Error('The key parameter must be a string.');
    }

    try {
        localStorage.setItem(key, jsonString);
        console.log(`JSON string successfully saved to local storage under key: "${key}"`);
    } catch (e) {
        console.error('Error saving JSON string to local storage:', e);
    }
}

// Function to load JSON from local storage
function loadJsonFromLocalStorage(key) {
    if (typeof key !== 'string') {
        throw new Error('The key parameter must be a string.');
    }

    try {
        const jsonString = localStorage.getItem(key);
        if (jsonString === null) {
            console.log(`No data found in local storage for key: "${key}"`);
            return null;
        }
        return jsonString;
    } catch (e) {
        console.error('Error loading JSON string from local storage:', e);
        return null;
    }
}

function loadPrices(){
    let pricesJson = loadJsonFromLocalStorage('prices');
    if (pricesJson) {
        hireCosts = JSON.parse(pricesJson);
        console.log("Prices loaded: ", hireCosts);
    } else if (mission.length > 0) {
        showErrorModal("Failed to load prices from local storage");
    } else {
        console.log("No prices found in local storage, but no mission in progress");
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

function resetData() {
    localStorage.removeItem('teams');
    localStorage.removeItem('mission');
    localStorage.removeItem('prices');
    location.reload();
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

function loadMission() {
    const missionJson = loadJsonFromLocalStorage('mission');
    if (missionJson) {
        const missionData = JSON.parse(missionJson);
        return new Mission(
            missionData.name,
            missionData.start,
            missionData.end,
            missionData.startingPrice
        );
    } else {
        console.log("No mission data found");
        return null;
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
        console.log('No teams to remove from the remove team select');
    }
    
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