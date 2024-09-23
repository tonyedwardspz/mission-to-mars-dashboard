import { saveJsonToLocalStorage, loadJsonFromLocalStorage } from './FileFunctions.js';

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
        console.error("No mission data found");
        return null;
    }
}

function saveMission(missionData) {
    saveJsonToLocalStorage(JSON.stringify(missionData), 'mission');
    console.log("Mission saved:", missionData);
}
