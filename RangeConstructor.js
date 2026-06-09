const cardOrderX = [];
const cardOrderY = [];
const cardOrder = [];

const cards = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const CARDS_REV = [...cards].reverse();
const SUITS_REV = ['c', 'd', 'h', 's'];
const suits = ['s', 'h', 'd', 'c'];
const suitMap = {
    's': { symbol: '♠', color: 'black' },
    'h': { symbol: '♥', color: 'red' },
    'c': { symbol: '♣', color: 'rgb(0, 148, 7)' },
    'd': { symbol: '♦', color: 'rgb(0, 3, 204)' }
};

CARDS_REV.forEach((r1, i1) => {
    SUITS_REV.forEach((s1, j1) => {
        CARDS_REV.forEach((r2, i2) => {      
            SUITS_REV.forEach((s2, j2) => {
                if (i2 < i1 || (i1 === i2 && j2 < j1)) {
                    cardOrderX.push(12 - (j1 === j2 ? i1 : i2));
                    cardOrderY.push(12 - (j1 !== j2 ? i1 : i2));
                    cardOrder.push(`${r1}${s1}${r2}${s2}`);
                }
            });
        });
    });
});


const colors = ["#F03131", "#91C282"]; //"#91C282"

const MADE_HAND_CLASSES = ["Straightflush", "Quads", "Fullhouse", "Flush", "Straight", "Set", "Trips", "Two Pair", "Over Pair", "Top Pair", "Mid Pair", "Bottom Pair", "Under Pair", "Ace High", "King High", "No Made Hand"];
const DRAW_HAND_CLASSES = ["Combo Draw", "Nut Flush Draw", "Pair And Flush Draw", "Flush Draw", "OESD", "Gutshot", "BDFD 2 Cards", "BDFD 1 Card", "No Pair No Draw", "No Draw"];


const preflopRangeInputField = document.getElementById('preflopRange_input');
const boardInputField = document.getElementById('board_input');

const statusMessage = document.getElementById('statusMessage');
const handMatrix = document.getElementById('hand-matrix');
const madeHandClassesList = document.getElementById('madehand-classes');
const drawingHandClassesList = document.getElementById('drawinghand-classes');
const tooltipSpan = document.getElementById('tooltip-span');

let preflopRange = preflopRangeInputField.value.split(" ").map(num => parseFloat(num));



let blockedHandsBoolArray = new Array(1326).fill(false);
let betRange = new Array(1326).fill(0);
let checkRange = new Array(1326).fill(0);
let madeHandClassArray = new Array(1326).fill("");
let drawingHandClassArray = new Array(1326).fill("");



// Variable to keep track of the hovered item
let hoveredMadeHandClass = null;
let hoveredDrawingHandClass = null;
let hoveredhand_i = null;
let hoveredhand_j = null;
let selectedHandToolTip_i = null;
let selectedHandToolTip_j = null;
let hoveredHand_tooltip = null;


// Helper functions
function formatSingleCard(card) {
    const rank = card.charAt(0);
    const suit = card.charAt(1);
    const { symbol, color } = suitMap[suit] || { symbol: '', color: 'white' };
    return `<span style='color:${color}'>${rank}${symbol}</span>`;
}

const updateRangeAtIndex = (index, direction) => {
    const step = preflopRange[index] * 0.25;
    if (direction > 0) {
        betRange[index] = Math.min(betRange[index] + step, preflopRange[index]);
    } else {
        betRange[index] = Math.max(betRange[index] - step, 0);
    }
    checkRange[index] = preflopRange[index] - betRange[index];
};

/**
 * Handles the input logic shared by both Keyboard and Wheel events.
 */
const handleRangeAdjustment = (direction) => {
    let changed = false;

    if (hoveredMadeHandClass) {
        madeHandClassArray.forEach((val, i) => {
            if (val === hoveredMadeHandClass) updateRangeAtIndex(i, direction);
        });
        changed = true;
    } 
    else if (hoveredDrawingHandClass) {
        drawingHandClassArray.forEach((val, i) => {
            if (val === hoveredDrawingHandClass) updateRangeAtIndex(i, direction);
        });
        changed = true;
    } 
    else if (hoveredhand_i != null && hoveredhand_j != null) {
        cardOrderX.forEach((val, i) => {
            if (val === hoveredhand_i && cardOrderY[i] === hoveredhand_j) updateRangeAtIndex(i, direction);
        });
        changed = true;
    } 
    else if (hoveredHand_tooltip != null) {
        updateRangeAtIndex(hoveredHand_tooltip, direction);
        changed = true;
    }

    if (changed) refreshMatrix();
};

// --- Event Listeners ---

window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') handleRangeAdjustment(1);
    if (event.key === 'ArrowDown') handleRangeAdjustment(-1);
});

window.addEventListener('wheel', (event) => {
    const direction = event.deltaY < 0 ? 1 : -1;
    handleRangeAdjustment(direction);
});


//Copy bet range button
document.getElementById('copyBetRangeButton').addEventListener('click', () => {
    // Copy text to clipboard
    navigator.clipboard.writeText(copyRange(betRange))
        .then(() => {
            // Success message
            statusMessage.textContent = 'Text copied to clipboard!';
        })
        .catch(err => {
            // Error message
            console.error('Failed to copy text: ', err);
            statusMessage.textContent = 'Failed to copy text.';
        });
});
//Copy check range button
document.getElementById('copyCheckRangeButton').addEventListener('click', () => {
    // Copy text to clipboard
    navigator.clipboard.writeText(copyRange(checkRange))
        .then(() => {
            // Success message
            statusMessage.textContent = 'Text copied to clipboard!';
        })
        .catch(err => {
            // Error message
            console.error('Failed to copy text: ', err);
            statusMessage.textContent = 'Failed to copy text.';
        });
});
//Import bet range button
document.getElementById('importBetRangeButton').addEventListener('click', () => {
    // Copy text to clipboard
    importFromClipboard();
});

async function importFromClipboard() {
    try {
        // Use the Clipboard API to read text
        const text = await navigator.clipboard.readText();
        updateBetAndCheckRanges(text);
    } catch (error) {
        console.error("Failed to read clipboard content:", error);
    }

}



function copyRange(tempArray) {
    let tempBetRange = "";
    for (let index = 0; index < cardOrder.length; index++) {
        if (blockedHandsBoolArray[index] || tempArray[index] == 0) {
            continue;
        } else {
            tempBetRange += cardOrder[index] + ": " + tempArray[index] / preflopRange[index] + ",";
        }
    }
    if (tempBetRange === "") {
        return "Ah7d: 0";
    }
    return tempBetRange.substring(0, tempBetRange.length - 1);
}

function colorHand(hand) {
    return formatSingleCard(hand.substring(0, 2)) + formatSingleCard(hand.substring(2, 4));
}

function createCardDiv(card) {
    const cardSpan = document.createElement("span");
    cardSpan.className = "matrixboard-card";

    const rank = card.slice(0, -1);
    const suitChar = card.slice(-1);

    // Look up the suit data, fallback to empty defaults if not found
    const { symbol = '', color = 'inherit' } = suitMap[suitChar] || {};

    cardSpan.style.color = color;
    cardSpan.setAttribute('data-rank', rank + symbol);
    cardSpan.setAttribute('data-suit', symbol);
    
    return cardSpan;
}

function compareCards(card1, card2) { // return positive if card1 is higher than card2
    return cards.indexOf(card2.slice(0, 1)) - cards.indexOf(card1.slice(0, 1));
}

function updateblockedHandsBoolArray() {
    madeHandClassArray = new Array(1326).fill("");
    drawingHandClassArray = new Array(1326).fill("");

    let boardCard1 = boardInputField.value.substring(0, 2);
    let boardCard2 = boardInputField.value.substring(2, 4);
    let boardCard3 = boardInputField.value.substring(4, 6);
    //Sort boardcards
    
    if (compareCards(boardCard3, boardCard1) > 0) {
        let tempCard = boardCard3;
        boardCard3 = boardCard1;
        boardCard1 = tempCard;
    }
    if (compareCards(boardCard2, boardCard1) > 0) {
        let tempCard = boardCard2;
        boardCard2 = boardCard1;
        boardCard1 = tempCard;
    }
    if (compareCards(boardCard3, boardCard2) > 0) {
        let tempCard = boardCard3;
        boardCard3 = boardCard2;
        boardCard2 = tempCard;
    }
    for (let index = 0; index < blockedHandsBoolArray.length; index++) {
        const tempCard1 = cardOrder[index].substring(0, 2);
        const tempCard2 = cardOrder[index].substring(2, 4);
        blockedHandsBoolArray[index] = (tempCard1 == boardCard1 || tempCard1 == boardCard2 || tempCard1 == boardCard3 || tempCard2 == boardCard1 || tempCard2 == boardCard2 || tempCard2 == boardCard3);
        if (!blockedHandsBoolArray[index]) {
            //Initiate variables
            let cardCounts = new Array(14).fill(0);
            let suitCounts = new Array(4).fill(0);
            //Count card ranks           
            cardCounts[cards.indexOf(boardCard1.slice(0, 1))] += 1;
            cardCounts[cards.indexOf(boardCard2.slice(0, 1))] += 1;
            cardCounts[cards.indexOf(boardCard3.slice(0, 1))] += 1;
            cardCounts[cards.indexOf(tempCard1.slice(0, 1))] += 1;
            cardCounts[cards.indexOf(tempCard2.slice(0, 1))] += 1;
            cardCounts[13] = cardCounts[0];
            //Count suits
            suitCounts[suits.indexOf(boardCard1.slice(-1))] += 1;
            suitCounts[suits.indexOf(boardCard2.slice(-1))] += 1;
            suitCounts[suits.indexOf(boardCard3.slice(-1))] += 1;
            suitCounts[suits.indexOf(tempCard1.slice(-1))] += 1;
            suitCounts[suits.indexOf(tempCard2.slice(-1))] += 1;


            //Initiate straight boolean
            let straightBoolean = false;
            for (let i = 0; i < 10; i++) {
                if (cardCounts[i] > 0 && cardCounts[i + 1] > 0 && cardCounts[i + 2] > 0 && cardCounts[i + 3] > 0 && cardCounts[i + 4] > 0) {
                    straightBoolean = true;
                }
            }


            if (Object.values(suitCounts).includes(5) && straightBoolean) {
                madeHandClassArray[index] = "Straightflush";
            } else if (Object.values(cardCounts).includes(4)) {
                madeHandClassArray[index] = "Quads";
            } else if (Object.values(cardCounts).includes(3) && Object.values(cardCounts).includes(2)) {
                madeHandClassArray[index] = "Fullhouse";
            } else if (Object.values(cardCounts).includes(5)) {
                madeHandClassArray[index] = "Flush";
            } else if (straightBoolean) {
                madeHandClassArray[index] = "Straight";
            } else if (Object.values(cardCounts).includes(3) && tempCard1.slice(0, 1) == tempCard2.slice(0, 1)) {
                madeHandClassArray[index] = "Set";
            } else if (Object.values(cardCounts).includes(3)) {
                madeHandClassArray[index] = "Trips";
            } else if (cardCounts[cards.indexOf(tempCard1.slice(0, 1))] == 2 && cardCounts[cards.indexOf(tempCard2.slice(0, 1))] == 2 && tempCard1.slice(0, 1) != tempCard2.slice(0, 1)) {
                madeHandClassArray[index] = "Two Pair";
            } else if (compareCards(tempCard1, boardCard1) > 0 && tempCard1.slice(0, 1) == tempCard2.slice(0, 1)) {
                madeHandClassArray[index] = "Over Pair";
            } else if ((compareCards(tempCard1, boardCard1) == 0 || compareCards(tempCard2, boardCard1) == 0) && tempCard1.slice(0, 1) != tempCard2.slice(0, 1)) {
                madeHandClassArray[index] = "Top Pair";
            } else if ((compareCards(tempCard1, boardCard2) == 0 || compareCards(tempCard2, boardCard2) == 0) && tempCard1.slice(0, 1) != tempCard2.slice(0, 1)) {
                madeHandClassArray[index] = "Mid Pair";
            } else if ((compareCards(tempCard1, boardCard3) == 0 || compareCards(tempCard2, boardCard3) == 0) && tempCard1.slice(0, 1) != tempCard2.slice(0, 1)) {
                madeHandClassArray[index] = "Bottom Pair";
            } else if (compareCards(tempCard2, boardCard1) < 0 && tempCard1.slice(0, 1) == tempCard2.slice(0, 1)) {
                madeHandClassArray[index] = "Under Pair";
            } else if (tempCard1.slice(0, 1) == 'A' || tempCard2.slice(0, 1) == 'A') {
                madeHandClassArray[index] = "Ace High";
            } else if (tempCard1.slice(0, 1) == 'K' || tempCard2.slice(0, 1) == 'K') {
                madeHandClassArray[index] = "King High";
            } else {
                madeHandClassArray[index] = "No Made Hand";
            }
            // ###  Drawing hands ###'
            //Initialize variables
            let flushDrawSuitIndex = Object.values(suitCounts).indexOf(4);
            let backDoorFlushDrawIndex = Object.values(suitCounts).indexOf(3);
            let openEndedStraightDrawBoolean = false;
            let gutShotStraightDrawBoolean = false;
            for (let i = 1; i < 10; i++) {
                if (cardCounts[i] > 0 && cardCounts[i + 1] > 0 && cardCounts[i + 2] > 0 && cardCounts[i + 3] > 0) {
                    openEndedStraightDrawBoolean = true;
                }

            }
            for (let i = 0; i < 10; i++) {
                let tempCount = Math.min(1, cardCounts[i]) + Math.min(1, cardCounts[i + 1]) + Math.min(1, cardCounts[i + 2]) + Math.min(1, cardCounts[i + 3]) + Math.min(1, cardCounts[i + 4]);
                if (tempCount == 4) {
                    gutShotStraightDrawBoolean = true;
                }
            }

            //["Combo Draw", "Nut Flush Draw", "Flush Draw", "OESD", "Gutshot", "BDFD 2 Cards", "BDFD 1 Card", "No Pair No Draw", "No Draw"];
            if (flushDrawSuitIndex >= 0 && (openEndedStraightDrawBoolean || gutShotStraightDrawBoolean)) {
                drawingHandClassArray[index] = "Combo Draw";
            } else if (flushDrawSuitIndex >= 0 && (tempCard1 == ('A' + suits[flushDrawSuitIndex]) || tempCard2 == ('A' + suits[flushDrawSuitIndex]))) {
                drawingHandClassArray[index] = "Nut Flush Draw";
            } else if (flushDrawSuitIndex >= 0 && (boardCard1 == ('A' + suits[flushDrawSuitIndex]) || boardCard2 == ('A' + suits[flushDrawSuitIndex]) || boardCard3 == ('A' + suits[flushDrawSuitIndex])) && (tempCard1 == ('K' + suits[flushDrawSuitIndex]) || tempCard2 == ('K' + suits[flushDrawSuitIndex]))) {
                drawingHandClassArray[index] = "Nut Flush Draw";
            } else if (flushDrawSuitIndex >= 0 && (madeHandClassArray[index] == "Top Pair" || madeHandClassArray[index] == "Mid Pair" || madeHandClassArray[index] == "Bottom Pair")) {
                drawingHandClassArray[index] = "Pair And Flush Draw";
            } else if (flushDrawSuitIndex >= 0) {
                drawingHandClassArray[index] = "Flush Draw";
            } else if (openEndedStraightDrawBoolean) {
                drawingHandClassArray[index] = "OESD";
            } else if (gutShotStraightDrawBoolean) {
                drawingHandClassArray[index] = "Gutshot";
            } else if (backDoorFlushDrawIndex > 0 && tempCard1.slice(-1) == suits[backDoorFlushDrawIndex] && tempCard2.slice(-1) == suits[backDoorFlushDrawIndex]) {
                drawingHandClassArray[index] = "BDFD 2 Cards";
            } else if (backDoorFlushDrawIndex > 0 && tempCard1.slice(-1) != tempCard2.slice(-1) && (tempCard1.slice(-1) == suits[backDoorFlushDrawIndex] || tempCard2.slice(-1) == suits[backDoorFlushDrawIndex])) {
                drawingHandClassArray[index] = "BDFD 1 Card";
            } else if (madeHandClassArray[index] == "No Made Hand" || madeHandClassArray[index] == "King High") {
                drawingHandClassArray[index] = "No Pair No Draw";
            } else {
                drawingHandClassArray[index] = "No Draw";
            }


        }
    }
}
function updateBetAndCheckRanges(betRangeImport) {
    updateblockedHandsBoolArray();
    preflopRange = preflopRangeInputField.value.split(" ").map(num => parseFloat(num));
    // Set range to 100% check
    for (let index = 0; index < cardOrder.length; index++) {
        if (blockedHandsBoolArray[index] || preflopRange[index] == 0) {
            betRange[index] = 0;
            checkRange[index] = 0;
        } else {
            betRange[index] = 0;
            checkRange[index] = preflopRange[index];
        }
    }
    if (betRangeImport != null) {
        betRangeImportSplit = betRangeImport.split(",");
        for (let index = 0; index < betRangeImportSplit.length; index++) {
            const tempSplit = betRangeImportSplit[index].split(":");
            const tempIndex = cardOrder.indexOf(tempSplit[0].trim());
            if (tempIndex >= 0) {
                betRange[tempIndex] = parseFloat(tempSplit[1].trim());
                checkRange[tempIndex] = preflopRange[tempIndex] - betRange[tempIndex];

            }
        }
    }
    refreshMatrix();
}
function updateHandClassButtons() {
    let madeHandClassCountMap = new Map();
    let madeHandClassBetCountMap = new Map();
    let madeHandClassCheckCountMap = new Map();
    let drawingHandClassCountMap = new Map();
    let drawingHandClassBetCountMap = new Map();
    let drawingHandClassCheckCountMap = new Map();

    madeHandClassesList.innerHTML = "";
    drawingHandClassesList.innerHTML = "";


    for (let index = 0; index < madeHandClassArray.length; index++) {
        madeHandClassCountMap.set(madeHandClassArray[index], (madeHandClassCountMap.get(madeHandClassArray[index]) || 0) + preflopRange[index]);
        madeHandClassBetCountMap.set(madeHandClassArray[index], (madeHandClassBetCountMap.get(madeHandClassArray[index]) || 0) + betRange[index]);
        madeHandClassCheckCountMap.set(madeHandClassArray[index], (madeHandClassCheckCountMap.get(madeHandClassArray[index]) || 0) + checkRange[index]);
    }
    for (let index = 0; index < drawingHandClassArray.length; index++) {
        drawingHandClassCountMap.set(drawingHandClassArray[index], (drawingHandClassCountMap.get(drawingHandClassArray[index]) || 0) + preflopRange[index]);
        drawingHandClassBetCountMap.set(drawingHandClassArray[index], (drawingHandClassBetCountMap.get(drawingHandClassArray[index]) || 0) + betRange[index]);
        drawingHandClassCheckCountMap.set(drawingHandClassArray[index], (drawingHandClassCheckCountMap.get(drawingHandClassArray[index]) || 0) + checkRange[index]);
    }

    for (let index = 0; index < MADE_HAND_CLASSES.length; index++) {
        if (madeHandClassCountMap.has(MADE_HAND_CLASSES[index])) {
            const tempValue = madeHandClassCountMap.get(MADE_HAND_CLASSES[index]);
            const tempUl = document.createElement('ul');
            tempUl.style.backgroundImage = "linear-gradient(to right, " + colors[0] + " 0% " + madeHandClassBetCountMap.get(MADE_HAND_CLASSES[index]) / madeHandClassCountMap.get(MADE_HAND_CLASSES[index]) * 100 + "%, " + colors[1] + " " + madeHandClassBetCountMap.get(MADE_HAND_CLASSES[index]) / madeHandClassCountMap.get(MADE_HAND_CLASSES[index]) * 100 + "% 100%)";
            tempUl.textContent = MADE_HAND_CLASSES[index] + " " + tempValue.toFixed(1) + " Bet: " + madeHandClassBetCountMap.get(MADE_HAND_CLASSES[index]).toFixed(1) + " Check: " + madeHandClassCheckCountMap.get(MADE_HAND_CLASSES[index]).toFixed(1);
            tempUl.style.border = '2px solid black';
            tempUl.style.color = 'black';
            madeHandClassesList.appendChild(tempUl);
            tempUl.addEventListener('mouseenter', () => {
                hoveredMadeHandClass = MADE_HAND_CLASSES[index]; // Track the hovered class
                tempUl.style.border = '2px solid #6a11cb';
            });
            tempUl.addEventListener('mouseleave', () => {
                hoveredMadeHandClass = null; // Reset when mouse leaves
                tempUl.style.border = '2px solid black';
            });

        }
    }
    for (let index = 0; index < DRAW_HAND_CLASSES.length; index++) {
        if (drawingHandClassCountMap.has(DRAW_HAND_CLASSES[index])) {
            const tempValue = drawingHandClassCountMap.get(DRAW_HAND_CLASSES[index]);
            const tempUl = document.createElement('ul');
            tempUl.style.backgroundImage = "linear-gradient(to right, " + colors[0] + " 0% " + drawingHandClassBetCountMap.get(DRAW_HAND_CLASSES[index]) / drawingHandClassCountMap.get(DRAW_HAND_CLASSES[index]) * 100 + "%, " + colors[1] + " " + drawingHandClassBetCountMap.get(DRAW_HAND_CLASSES[index]) / drawingHandClassCountMap.get(DRAW_HAND_CLASSES[index]) * 100 + "% 100%)";
            tempUl.textContent = DRAW_HAND_CLASSES[index] + " " + tempValue.toFixed(1) + " Bet: " + drawingHandClassBetCountMap.get(DRAW_HAND_CLASSES[index]).toFixed(1) + " Check: " + drawingHandClassCheckCountMap.get(DRAW_HAND_CLASSES[index]).toFixed(1);
            tempUl.style.border = '2px solid black';
            tempUl.style.color = 'black';
            drawingHandClassesList.appendChild(tempUl);
            tempUl.addEventListener('mouseenter', () => {
                hoveredDrawingHandClass = DRAW_HAND_CLASSES[index]; // Track the hovered class
                tempUl.style.border = '2px solid #6a11cb';
            });
            tempUl.addEventListener('mouseleave', () => {
                hoveredDrawingHandClass = null; // Reset when mouse leaves
                tempUl.style.border = '2px solid black';
            });

        }
    }
}



updateBetAndCheckRanges(null);
function refreshMatrix() {
    updateblockedHandsBoolArray();
    updateHandClassButtons()
    handMatrix.innerHTML = "";

    let board = boardInputField.value;



    let topDiv = document.createElement("div");
    topDiv.className = "topDiv";
    handMatrix.appendChild(topDiv);



    let colorsf_multi = [[[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], [], [], [], [], [], []]];
    let colorsf_multi_tooltip = [["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""]];
    let colorsf_multi_tooltip_temp = [["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""]];

    let heightsMax = [[6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    [12, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    [12, 12, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    [12, 12, 12, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    [12, 12, 12, 12, 6, 4, 4, 4, 4, 4, 4, 4, 4],
    [12, 12, 12, 12, 12, 6, 4, 4, 4, 4, 4, 4, 4],
    [12, 12, 12, 12, 12, 12, 6, 4, 4, 4, 4, 4, 4],
    [12, 12, 12, 12, 12, 12, 12, 6, 4, 4, 4, 4, 4],
    [12, 12, 12, 12, 12, 12, 12, 12, 6, 4, 4, 4, 4],
    [12, 12, 12, 12, 12, 12, 12, 12, 12, 6, 4, 4, 4],
    [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 6, 4, 4],
    [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 6, 4],
    [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 6]];

    let preflopMax = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

    let preflopCombos = 0;
    for (let i = 0; i < 1326; i++) {
        preflopMax[cardOrderX[i]][cardOrderY[i]] = preflopRange[i];
        preflopCombos += preflopRange[i];
    }

    const cardString = "AKQJT98765432";
    let ind = 0;
    for (let x = 0; x < 13; x++) {
        for (let y = 0; y < 13; y++) {
            for (let i = 0; i < colors.length; i++) {
                colorsf_multi[y][x].push(0);
            }
        }
    }

    for (let index = 0; index < 1326; index++) {
        if (blockedHandsBoolArray[index] || (betRange[index] + checkRange[index]) == 0) {
            continue;
        }
        let line = [0, betRange[index] * 100, checkRange[index] * 100];
        let hand = cardOrder[index];
        let x = cardString.indexOf(hand.charAt(2));
        let y = cardString.indexOf(hand.charAt(0));
        if (hand.charAt(1) == hand.charAt(3)) {
            x = cardString.indexOf(hand.charAt(0));
            y = cardString.indexOf(hand.charAt(2));
        }



        let grandientX = 0;
        let radientStr = "";
        let betsizeStr = "";
        for (let j = 1; j < colors.length + 1; j++) {
            colorsf_multi[x][y][j - 1] += parseFloat(line[j]);

            radientStr += colors[j - 1] + " " + grandientX + "% " + (grandientX + parseFloat(line[j])) + "%,";
            grandientX += parseFloat(line[j]);

            betsizeStr += "<div class=tooltipbetsize>" + parseFloat(line[j]).toFixed(1) + "%</div>"

        }
        colorsf_multi_tooltip_temp[x][y] += "<div data-index='" + index + "' class=tooltipHandDiv style='color:red; background-image:linear-gradient(to right, " + radientStr + " gray " + grandientX + "% 100%);'>" + "<div class=tooltipdivider><div class=tooltipHandBackground>" + colorHand(hand) + "</div> </div><div>" + betsizeStr + "</div> </div>";

    }


    for (let n = 0; n < colors.length; n++) {
        for (let x = 0; x < 13; x++) {
            for (let y = 0; y < 13; y++) {
                colorsf_multi_tooltip[x][y] += "<div class='tooltipTable' style='color:" + colors[n] + "; font-weight: bold;'>" + colorsf_multi_tooltip_temp[x][y] + "</div>";
                colorsf_multi_tooltip_temp[x][y] = "";
            }
        }
    }


    let bottomDiv = document.createElement("div");


    bottomDiv.className = "bottomDiv";

    handMatrix.appendChild(bottomDiv);

    let totalCombos = 0;
    let sizeCombos = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 13; j++) {
            let tempDiv = document.createElement("div");
            tempDiv.className = "matrixSingleHandDiv";
            if (j > i) {
                tempDiv.innerHTML = cards[i] + cards[j] + 's';
            } else if (i == j) {
                tempDiv.innerHTML = cards[j] + cards[i];
            } else {
                tempDiv.innerHTML = cards[j] + cards[i] + 'o';
            }
            let x = 0;
            let str = "";
            for (let n = 0; n < colors.length; n++) {
                totalCombos += colorsf_multi[i][j][n] * preflopMax[i][j] / 100;
                sizeCombos[n] += colorsf_multi[i][j][n] * preflopMax[i][j];
                str += colors[n] + " " + x + "% " + (x + colorsf_multi[i][j][n] * preflopMax[i][j] / heightsMax[i][j]) + "%,";
                x += colorsf_multi[i][j][n] * preflopMax[i][j] / heightsMax[i][j];
            }
            tempDiv.style.backgroundImage = "linear-gradient(to right, " + str + " gray " + x + "% 100%)";
            tempDiv.setAttribute("tooltipText", colorsf_multi_tooltip[i][j]);

            bottomDiv.appendChild(tempDiv);
            tempDiv.setAttribute("isOnDiv", "false");
            tempDiv.addEventListener("mouseenter", function () {
                hoveredhand_i = i;
                hoveredhand_j = j;
                event.target.classList.add("tipOn");
            });
            tempDiv.addEventListener("mouseleave", function () {
                event.target.classList.remove("tipOn");
                hoveredhand_i = null;
                hoveredhand_j = null;
            });
            tempDiv.addEventListener("click", function () {
                selectedHandToolTip_i = i;
                selectedHandToolTip_j = j;
                tooltipSpan.innerHTML = tempDiv.getAttribute("tooltipText");
                document.querySelectorAll('.tooltipHandDiv').forEach((element) => {
                    element.addEventListener('mouseenter', (event) => {
                        if (event.target) {
                            hoveredHand_tooltip = event.currentTarget.getAttribute("data-index");
                        }
                    });
                    element.addEventListener('mouseleave', (event) => {
                        if (event.target) {
                            hoveredHand_tooltip = null;
                        }
                    });
                });
            });
            if (selectedHandToolTip_i == i && selectedHandToolTip_j == j) {
                tooltipSpan.innerHTML = tempDiv.getAttribute("tooltipText");
            }
        }
    }
    document.querySelectorAll('.tooltipHandDiv').forEach((element) => {
        element.addEventListener('mouseenter', (event) => {
            if (event.target) {
                hoveredHand_tooltip = event.currentTarget.getAttribute("data-index");
            }
        });
        element.addEventListener('mouseleave', (event) => {
            if (event.target) {
                hoveredHand_tooltip = null;
            }
        });
    });

    for (let i = 0; i < colors.length; i++) {
        let tempDiv = document.createElement("div");
        tempDiv.innerHTML = (sizeCombos[i] / totalCombos).toFixed(1) + "% " + (sizeCombos[i] / 100).toFixed(1) + "c";
        tempDiv.className = "betsize-total";
        tempDiv.style.backgroundColor = colors[i];
        tempDiv.style.gridColumnStart = 2 * i + 1;
        tempDiv.style.gridColumnEnd = 2 * i + 3;
        bottomDiv.appendChild(tempDiv);
    }
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = preflopCombos.toFixed(1) + "c";
    tempDiv.className = "preflop-total";
    bottomDiv.appendChild(tempDiv);
    bottomDiv.style.display = 'grid';
    //Board text
    let firstCard = createCardDiv(board.substring(0, 2));
    let secondCard = createCardDiv(board.substring(2, 4));
    let thirdCard = createCardDiv(board.substring(4, 6));
    topDiv.appendChild(firstCard);
    topDiv.appendChild(secondCard);
    topDiv.appendChild(thirdCard);
    firstCard.style.gridColumnStart = 6;
    secondCard.style.gridColumnStart = 7;
    thirdCard.style.gridColumnStart = 8;
}