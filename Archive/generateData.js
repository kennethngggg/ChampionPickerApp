const numberOfChampions = 142;
const numberOfQuestions = 6;

let csv = ',Question 1,Question 2,Question 3,Question 4,Question 5,Question 6\n';

for (let i = 1; i <= numberOfChampions; i++) {
    csv += `Champion${i}`;
    for (let j = 0; j < numberOfQuestions; j++) {
        const randomValue = Math.floor(Math.random() * 3) + 1;  // random number between 1 and 3
        csv += `,${randomValue}`;
    }
    csv += '\n';
}

console.log(csv);
