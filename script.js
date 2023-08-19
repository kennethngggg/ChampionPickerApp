let questions = [];
let champions = [];
let gifs = [];
let significanceFactors = []; // <-- add this
let currentQuestionIndex = 0;


async function loadInitialData() {
    try {
        await fetchChampionData();
        displayQuestion();
    } catch (err) {
        console.error("Error fetching data:", err);
        // Here, you can also add some code to display an error message on the webpage, if needed.
    }
}

async function fetchChampionData() {
    const response = await fetch('championData.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });

    // Assuming data is in the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Extract questions, significance factors, and champion data
    questions = jsonData[0].slice(1);
    gifs = jsonData[1].slice(1);  // New line to extract gifs

    significanceFactors = jsonData[2].slice(1).map(Number);

    champions = jsonData.slice(3).map(row => { 
        return {
            name: row[0],
            weights: row.slice(1).map(Number),
            score: 0  // Initialize score here
        };
    });
}

function displayQuestion() {
    const questionCard = document.querySelector('.question-text');
    questionCard.textContent = questions[currentQuestionIndex];
    
    const gifElement = document.querySelector('.question-gif');
    gifElement.src = `Assets/Question GIFs/${gifs[currentQuestionIndex]}`;
}


function endQuiz() {
    document.querySelector('.question-card').style.display = 'none';
    document.querySelector('.debugging-card').style.display = 'none'; // Hide debugging card
    document.querySelector('#endScreen').style.display = 'block';
    displayFinalChampionRecommendation();
}

function adjustChampionScores(option) {
    champions.forEach(champion => {
        let weight = champion.weights[currentQuestionIndex];
        const significance = significanceFactors[currentQuestionIndex];

        switch(option) {
            case "Yes":
                weight *= significance;  // Multiply by significance
                break;
            case "Maybe":
                weight *= (0.5 * significance);  // Reduce impact based on significance
                break;
            case "No":
                weight *= (-1 * significance);  // Negate and multiply by significance
                break;
        }
        champion.score += weight;
    });
}


const STRONG_PREFERENCE_THRESHOLD = 15; // Adjust this threshold as needed.

function hasStrongChampionPreference() {
    // Sort champions without modifying the original array.
    const sortedChampions = [...champions].sort((a, b) => b.score - a.score);

    // Check if the top champion has a score differential greater than the threshold.
    return (sortedChampions[0].score - sortedChampions[1].score) > STRONG_PREFERENCE_THRESHOLD;
}

function handleOptionClick(option) {
    adjustChampionScores(option);
    currentQuestionIndex++;

    if (hasStrongChampionPreference() || currentQuestionIndex >= questions.length) {
        endQuiz();
    } else {
        displayQuestion();
        displayDebugChampionRecommendation();
    }
}

const LOW_VARIANCE_THRESHOLD = 5; // Adjust this threshold as needed.

function calculateStandardDeviation() {
    const n = champions.length;
    const mean = champions.reduce((acc, champ) => acc + champ.score, 0) / n;
    const variance = champions.reduce((acc, champ) => acc + Math.pow(champ.score - mean, 2), 0) / n;
    return Math.sqrt(variance);
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

    const stdDev = calculateStandardDeviation();
    if (stdDev < LOW_VARIANCE_THRESHOLD) {
        // Show a message about the neutral preference.
        const neutralMessage = document.createElement('p');
        neutralMessage.textContent = "Your answers suggest a neutral preference. Here are some general champion recommendations:";
        finalList.appendChild(neutralMessage);
    }

    const topChampions = getTopChampions(5);
    topChampions.forEach(champion => {
        const listItem = document.createElement('li');
        listItem.textContent = `${champion.name} (Score: ${champion.score})`;
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