let questions = [];
let champions = [];
let videoFilenames = [];
let significanceFactors = [];
let currentQuestionIndex = 0;
let dataDragonChampions = {};
let latestDDragonVersion = "13.16.1"; // Global to store the latest DDragon version

async function fetchDDragonChampionData(version) {
    try {
        const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
        const data = await response.json();
        dataDragonChampions = data.data;
    } catch (err) {
        console.error("Failed to fetch DataDragon data:", err);
        alert("There was an error fetching champion data. Please try again later.");
    }
}

async function loadInitialData() {
    try {
        await Promise.all([
            fetchChampionData(),
            fetchDDragonChampionData(latestDDragonVersion)  // Here's the change
        ]);
        displayQuestion();
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

$(document).ready(function() {
  // Check if user visited before
  if(!localStorage.getItem('visitedBefore')) {
    $('#introPopup').show();
    localStorage.setItem('visitedBefore', 'true');
  }

  $('#startButton').click(function() {
    $('#introPopup').hide();
  });
});

async function fetchChampionData() {
    const response = await fetch('championData.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    questions = jsonData[0].slice(3); // Starting from column C (index 2)
    videoFilenames = jsonData[1].slice(3); // Starting from column C (index 2)
    significanceFactors = jsonData[2].slice(3).map(Number); // Starting from column C and convert to numbers

    champions = jsonData.slice(3).map(row => {
        return {
            urlName: row[0],
            dataDragonName: row[1],
            name: row[2],
            weights: row.slice(3).map(Number), // Starting from column D
            score: 0
        };
    });
}

function displayQuestion() {
    const questionCard = document.querySelector('.question-text');
    questionCard.textContent = questions[currentQuestionIndex];

    const videoElement = document.querySelector('.question-video');
    const videoSource = videoElement.querySelector('source');

    videoSource.src = `Assets/Question videos/${videoFilenames[currentQuestionIndex]}`;
    videoElement.load();
}

function adjustChampionScores(option) {
    champions.forEach(champion => {
        let weight = champion.weights[currentQuestionIndex];
        const significance = significanceFactors[currentQuestionIndex];

        switch (option) {
            case "Yes":
                weight *= significance;
                break;
            case "Maybe":
                weight *= (0.5 * significance);
                break;
            case "No":
                weight *= (-1 * significance);
                break;
        }
        champion.score += weight;
    });
}

function handleOptionClick(option) {
    adjustChampionScores(option);
    currentQuestionIndex++;

    if (currentQuestionIndex >= questions.length) {
        endQuiz();
    } else {
        displayQuestion();
    }
}

function createChampionElement(champion) {
    const champElement = document.createElement('div');
    champElement.className = "champion-entry";

    const champLink = document.createElement('a');
    champLink.href = `https://www.leagueoflegends.com/en-sg/champions/${champion.urlName}`;
    champLink.target = "_blank";
    champLink.rel = "noopener noreferrer";

    const rankSpan = document.createElement('span');
    rankSpan.className = "champion-ranking";
    
    const champImg = document.createElement('img');
    champImg.src = `https://ddragon.leagueoflegends.com/cdn/${latestDDragonVersion}/img/champion/${champion.dataDragonName}.png`;
    champImg.alt = `${champion.name} Logo`;
    champImg.className = "champion-logo";

    const champName = document.createElement('p');
    champName.className = "champion-name";
    champName.textContent = champion.name;

    champLink.appendChild(champImg);
    champLink.appendChild(champName);
    champElement.appendChild(rankSpan);
    champElement.appendChild(champLink);

    return champElement;
}




function displayFinalChampionRecommendation() {
    const topChampions = getTopChampions(5);
    const nextTopTenChampions = getTopChampions(15).slice(5);

    // Top 5 Champions
    const topChampionsContainer = document.getElementById('topChampions');
    while (topChampionsContainer.firstChild) {
        topChampionsContainer.removeChild(topChampionsContainer.firstChild);  // clear old data
    }

    topChampions.forEach((champ, index) => {
        const championWrapper = document.createElement('div');
        championWrapper.className = 'champion';
        const rank = document.createElement('span');
        rank.className = 'ranking';
        rank.textContent = (index + 1).toString();
        championWrapper.appendChild(rank);
        championWrapper.appendChild(createChampionElement(champ));
        topChampionsContainer.appendChild(championWrapper);
    });

    // Next 10 Champions
    const nextChampionsContainer = document.getElementById('nextChampions');
    while (nextChampionsContainer.firstChild) {
        nextChampionsContainer.removeChild(nextChampionsContainer.firstChild);  // clear old data
    }

    nextTopTenChampions.forEach(champ => {
        nextChampionsContainer.appendChild(createChampionElement(champ));
    });
}


function getTopChampions(topN) {
    champions.sort((a, b) => b.score - a.score);
    return champions.slice(0, topN);
}

function endQuiz() {
    document.querySelector('.question-card').style.display = 'none';
    document.querySelector('#endScreen').style.display = 'block';
    displayFinalChampionRecommendation();
}

function resetApp() {
    currentQuestionIndex = 0;
    champions.forEach(champion => champion.score = 0);
    document.querySelector('.question-card').style.display = 'block';
    document.querySelector('#endScreen').style.display = 'none';
    displayQuestion();
}

window.onload = loadInitialData;
