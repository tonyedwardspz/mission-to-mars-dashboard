QUnit.module('LocalStorage Tests', function(hooks) {
    hooks.beforeEach(function() {
        localStorage.clear();
    });

    QUnit.test("saveJsonToLocalStorage test", function(assert) {
        const testKey = "testKey";
        const testValue = JSON.stringify({test: "value"});
        
        saveJsonToLocalStorage(testValue, testKey);
        const result = localStorage.getItem(testKey);
        
        assert.equal(result, testValue, "Saved value should match the input");
    });

    QUnit.test("loadJsonFromLocalStorage test", function(assert) {
        const testKey = "testKey";
        const testValue = JSON.stringify({test: "value"});
        
        localStorage.setItem(testKey, testValue);
        const result = loadJsonFromLocalStorage(testKey);
        
        assert.equal(result, testValue, "Loaded value should match the input");
    });

    QUnit.test("loadJsonFromLocalStorage with non-existent key", function(assert) {
        const result = loadJsonFromLocalStorage("nonExistentKey");
        
        assert.equal(result, null, "Should return null for non-existent key.");
    });

    /*QUnit.test("loadMission test", function(assert) {
        const missionData = {
            name: "Test Mission",
            start: "2023-01-01",
            end: "2023-12-31",
            startingPrice: 1000
        };
        localStorage.setItem('mission', JSON.stringify(missionData));
        
        const mission = loadMission();
        
        console.log("Loaded mission:", mission); // Debugging statement
        
        assert.ok(mission, "Mission should be loaded");
        assert.equal(mission.name, missionData.name, "Mission name should match");
        assert.equal(mission.start, missionData.start, "Mission start date should match");
        assert.equal(mission.end, missionData.end, "Mission end date should match");
        assert.equal(mission.startingPrice, missionData.startingPrice, "Mission starting price should match");
    });

    QUnit.test("loadMission with no mission data", function(assert) {
        const mission = loadMission();
        
        assert.equal(mission, null, "Should return null if no mission data is found");
    });*/
});
