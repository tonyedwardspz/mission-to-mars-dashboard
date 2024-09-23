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

// Make functions globally available
window.saveJsonToLocalStorage = saveJsonToLocalStorage;
window.loadJsonFromLocalStorage = loadJsonFromLocalStorage;
window.loadStories = loadStories;
window.loadBonusStories = loadBonusStories;
