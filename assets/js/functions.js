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

function saveJsonToLocalStorage(jsonString, key) {
    if (typeof jsonString !== 'string') {
        throw new Error('The jsonString parameter must be a string.');
    }
    if (typeof key !== 'string') {
        throw new Error('The key parameter must be a string.');
    }

    try {
        // Save the JSON string to local storage
        localStorage.setItem(key, jsonString);
        console.log(`JSON string successfully saved to local storage under key: "${key}"`);
    } catch (e) {
        console.error('Error saving JSON string to local storage:', e);
    }
}

// load json string from local storage and return
function loadJsonFromLocalStorage(key) {
    if (typeof key !== 'string') {
        throw new Error('The key parameter must be a string.');
    }

    try {
        // Load the JSON string from local storage
        const jsonString = localStorage.getItem(key);
        console.log(`JSON string successfully loaded from local storage under key: "${key}"`);
        return jsonString;
    } catch (e) {
        console.error('Error loading JSON string from local storage:', e);
    }
}
