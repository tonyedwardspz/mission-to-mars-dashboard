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
});
