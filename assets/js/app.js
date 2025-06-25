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

function showErrorModal(message) {
    console.error(message);
    $('#errorModal').modal('show');
    $('#errorModalBody').text(message);
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
                setFeedback('Password incorrect', 'danger', '#storyFeedbackContainer');
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
                setFeedback('Password incorrect', 'danger', '#hireFeedbackContainer');
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
                setFeedback('Password incorrect', 'danger', '#bonusAmountFeedbackContainer');
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
                        /*team.bonusStoriesCompleted.push(i);
                        team.balance += story.payout;
                        createTransaction(team, story.description, story.payout);
                        saveTeams();*/
                        $('#bonusStoryDescription option[value="' + (i + 1) + '"]').prop('selected', true);
                        break;
                    }
                }
                completeBonus(data.bonusStoryDescription, data.teamName);
                setFeedback('Bonus story completed', 'success', '#bonusStoryFeedbackContainer');
            } else {
                console.log('Incorrect password');
                setFeedback('Password incorrect', 'danger', '#bonusStoryFeedbackContainer');
            }
        });
    }
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