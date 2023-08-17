let questions = [];
let champions = [];
let currentQuestionIndex = 0;

async function loadInitialData() {
    await fetchQuestions();
    await fetchChampionData();
    displayQuestion();
}

async function fetchQuestions() {
    const response = await fetch('questions.csv');
    const data = await response.text();
    questions = data.split('\n').filter(line => line.trim().length > 0);
}


async function fetchChampionData() {
    const response = await fetch('championData.csv');
    const data = await response.text();
    const rows = data.split('\n').slice(1);
    champions = rows.map(row => {
        const columns = row.split(',');
        return {
            name: columns[0],
            weights: columns.slice(1).map(Number)
        };
    });
}

function displayQuestion() {
    const questionCard = document.querySelector('.question-text');
    questionCard.textContent = questions[currentQuestionIndex];
}

function endQuiz() {
    document.querySelector('.question-card').style.display = 'none';
    document.querySelector('.debugging-card').style.display = 'none'; // Hide debugging card
    document.querySelector('#endScreen').style.display = 'block';
    displayFinalChampionRecommendation();
}

function handleOptionClick(option) {
    adjustChampionScores(option);
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
        displayDebugChampionRecommendation();
    } else {
        endQuiz();
    }
}

function adjustChampionScores(option) {
    champions.forEach(champion => {
        let weight = champion.weights[currentQuestionIndex];
        
        if (option === "Yes") weight *= 3;
        else if (option === "Maybe") weight *= 2;
        else if (option === "No") weight *= -1;
        
        if (!champion.score) champion.score = 0;
        champion.score += weight;
    });
}

function displayDebugChampionRecommendation() {
    const debugList = document.getElementById('debugChampionList');
    debugList.innerHTML = ''; 
    const topChampions = getTopChampions(5);
    topChampions.forEach(champion => {
        const listItem = document.createElement('li');
        listItem.textContent = `${champion.name} - ${champion.score}`;
        debugList.appendChild(listItem);
    });
}

function displayFinalChampionRecommendation() {
    const finalList = document.getElementById('finalChampionList');
    finalList.innerHTML = '';
    const topChampions = getTopChampions(5);
    topChampions.forEach(champion => {
        const listItem = document.createElement('li');
        listItem.textContent = champion.name;
        finalList.appendChild(listItem);
    });
}

function getTopChampions(topN) {
    champions.sort((a, b) => b.score - a.score);
    return champions.slice(0, topN);
}

function resetApp() {
    currentQuestionIndex = 0;
    champions.forEach(champion => champion.score = 0);
    document.querySelector('.question-card').style.display = 'block';
    document.querySelector('.debugging-card').style.display = 'block'; // Show debugging card
    document.querySelector('#endScreen').style.display = 'none';
    displayQuestion();
}

loadInitialData();
