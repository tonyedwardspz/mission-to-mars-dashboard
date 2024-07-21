class Story {
    constructor(id, description, acceptance, value) {
        this.id = id;
        this.description = description;
        this.acceptance = acceptance;
        this.value = value;
    }
}

class Team {
    constructor(name, startingBalance) {
        this.name = name;
        this.balance = startingBalance;
        this.currentStory = 1;
        this.bonusStoriesCompleted = [];
    }
}

class Mission {
    constructor(name, start, end, price) {
        this.name = name;
        this.start = start;
        this.end = end;
        this.startingPrice = price;
    }
}
