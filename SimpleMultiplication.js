//=======================================================
// Copyright (C) 2022, 2024, JANBAV.
// Author : Sudhir Varma
//=======================================================

// Global variables. 
var tblBkGround = "black";
var tblForeGround = "white";
var tblRowLabelBkGround = "green";
var tblRowLabelForeGround = "white";
var tblHiliteBkGround = "red";
var tblHiliteForeGround = "white";
var tblTempBkGround = "blue";
var myArray= [[], [], [], []]; 
const rowLabels = ["Carry", "Number 1", "Number 2", "Result"];

// Since there is a state machine, easier to use global variables than passing parameters around.
var Step = 0;
var currStep = 0;
var maxDigits = 0;
var numRows = 0;
var numCols = 0;
var num1 = "";
var num2 = "";

var currentCol=0;	// current column we are updating. Start with column 1	
var tempCurrentCol = 0
var currMultiplierDigit = 0;
var currMultiplicantDigit = 0;
var tempMultiplierDigit = 0;
var tempMultiplicantDigit = 0;
var currentRow = 3;	// First "intermediate steps" row is 3
var offset = 0; // How much (columns) to shift for each step
var doneSolving = false;
var hideSteps = false;
var exerciseMode = false;
var lsdigit = true;

var tbl = document.getElementById("Tbl");

function OnPageLoad()
{
}

// Allow only number keys. Prevent keys from A..Z etc., 
function LimitKeys(event)
{
	if (((event.keyCode >= 65) && (event.keyCode <= 90)))  {	// Prevent a-z.
		event.stopPropagation();
		event.preventDefault();
	}

	if ((event.shiftKey) && ((event.keyCode >= 48) && (event.keyCode <= 57)))  {	// Prevent !, @, #, ....
		event.stopPropagation();
		event.preventDefault();
	}
	
	// Prevent other characters like Space, Enter, ....
	if ((event.code == "Enter") || 		(event.code == "Space") || (event.code == "Minus") || (event.code == "Equal") ||
		(event.code == "Semicolon") || (event.code == "Quote") || (event.code == "Comma") || (event.code == "Period") ||
		(event.code == "Slash") ||  (event.code == "BracketLeft") || (event.code == "BracketRight") ||
		(event.code == "Backslash") || (event.code == "Backquote"))	{	 
		event.stopPropagation();
		event.preventDefault(); 
	}
}


// Handle keystrokes pertaining to table
function tblKeyDown(event)
{
	if (tbl.style.visibility == "visible") {
		if (!exerciseMode) { // if not in exercise mode
			if (event.ctrlKey && event.altKey && (event.keyCode == 84)) {	// Ctl-alt-T shortcut for "step-by-step"
				if (doneSolving) {
					alert("We are done solving. " + document.getElementById("Answer").innerHTML);	// Notify the user
					document.getElementById("Answer").focus();
				} else {
					nextStep();	// ctrl-alt-t takes you to "next step"
					}
				}
			} else {	// In Exercise mode
				LimitKeys(event);	// allow only number keys

				if (event.ctrlKey && event.altKey && (event.keyCode == 86)) {	// Ctl-alt-V shortcut for "Verify"
					verify();
				}	
			}
	}
}

// Maximum digits (max of number 1 and number 2)
function getMaxDigits() {
  maxDigits = num1.length + num2.length;
  numRows = 3 + num2.length + 1; // carry + num1 + num2 + intermediate rows + result
}

function showSteps() {
  document.getElementById("StepsHeading").style.backgroundColor = "#FFEA00";
  document.getElementById("StepsHeading").style.visibility = "visible";
  document.getElementById("Steps").style.visibility = "visible";
  updateSteps();
}

function createTbl(numCols) {
  tbl.style.visibility = "visible";
	  
  // Create columns based on the number of digits	
    for (let i=0; i < 4; i++) {
	tbl.getElementsByTagName("tr")[i].cells[1].innerHTML = "";

	if (exerciseMode)
		tbl.getElementsByTagName("tr")[i].cells[1].setAttribute("contenteditable","true");
	else		
		tbl.getElementsByTagName("tr")[i].cells[1].setAttribute("contenteditable","false");
	
	for (let j=0; j < numCols-2; j++) {	// Already we have 2 columns created in html 
		let cell = tbl.getElementsByTagName("tr")[i].insertCell(1);
		cell.innerHTML = "";
		if (exerciseMode)
			cell.setAttribute("contenteditable","true");
		else		
			cell.setAttribute("contenteditable","false"); // true
	}
  }

	// Add new rows for the intermediate steps
  for (let i=3; i < (numRows-1); i++) { 
  	let row = tbl.insertRow(i);
	
	for (let j=0; j < numCols; j++) {
		let cell = tbl.getElementsByTagName("tr")[i].insertCell(0);
		cell.innerHTML = "";
		if (exerciseMode)
			cell.setAttribute("contenteditable","true");
		else		
			cell.setAttribute("contenteditable","false"); // true
	}
	tbl.getElementsByTagName("tr")[i].cells[0].setAttribute("contenteditable","false"); // first column not editble
  }

  // Highlight the first column. First column of each row has row label
  for (let i=0; i < numRows; i++){	
	row = tbl.getElementsByTagName("tr")[i];
	cell = row.cells[0];
	cell.style.backgroundColor = tblRowLabelBkGround;
	cell.style.color = tblRowLabelForeGround;
  }
}

function initArray()
{
	for (let i = 0; i < numRows; i++) {
		myArray.push([]);
		for (let j=0; j < numCols; j++) {
			myArray[i].push("");
		}
	}
	for (let i=0; i < num1.length; i++) {
		myArray[1][maxDigits-i]= num1[num1.length-1-i];
	}

	for (let i=0; i < num2.length; i++) {
		myArray[2][maxDigits-i]= num2[num2.length-1-i];
	}
}

function initRow(r, num)
{
  let row = tbl.getElementsByTagName("tr")[r];

  for (let i=0; i < num.length; i++) {
	let cell = row.cells[maxDigits-i];
  
	// Highlight the just modified cells
	cell.style.backgroundColor = tblHiliteBkGround;
	cell.style.color = tblHiliteForeGround;
	cell.innerHTML= num[num.length-1-i];
  }
}

function showAnswer()
{
	document.getElementById("AnswerHeading").style.visibility = "visible";
	document.getElementById("AnswerHeading").style.backgroundColor = "#FFEA00";
	solution = "Answer is : ";
	if (tbl.getElementsByTagName("tr")[numRows-1].cells[1].innerHTML != "")	// if MS digit not blank, display
		solution += tbl.getElementsByTagName("tr")[numRows-1].cells[1].innerHTML;
	
	for (let i=2; i <= maxDigits; i++)
		solution += tbl.getElementsByTagName("tr")[numRows-1].cells[i].innerHTML;
	
	let answer = document.getElementById("Answer");
	answer.style.visibility = "visible";
	answer. style.fontWeight = 'bold';
	answer.innerHTML = solution;
}

function removeHighlight() 
{
  let tbl = document.getElementById("Tbl");	

  for (let i=0; i < numRows; i++){	
	row = tbl.getElementsByTagName("tr")[i];
	
	for (let j=1; j < maxDigits+1; j++) {
  	  cell = row.cells[j];
	  cell.style.backgroundColor = tblBkGround;
	  cell.style.color = tblForeGround;
	}
  }
}

function updateSteps()
{
	let text = "";
    let steps = document.getElementById("Steps");
	let tempStr;
	let temp1Str;
	
	switch (Step) {
	  case 0:
	    text = "- The table has 4 lines.\n"; 
		text = text + "- Line 1 is for storing the carry over (if any)."; 
		text = text + " Line 2 is for storing the first number(multiplicant).";
	    text = text + " Line 3 is for storing the second number (multiplier). ";
		text = text + "The last line is for storing the result. The lines between lines 3 & last are used to store  intermediate results as we solve the problem. <br>";
		text += "- Copy number 1 (" + num1 + ") over to line 2. Copy number 2 (" + num2 + ") over to line 3. Lowest digit should be in the right most column.<br>";
		steps.innerHTML = "<b>" + text + "</b>";
		break;
		
	  case 1:
	  case 2:	
	  case 3:	
		if (currStep < 4) {
			if (lsdigit) {
			text = "- Start multiplying the digits of Number 1 (multiplicant) and Number 2 (multiplier), beginning with right most and store the result in line 4. ";				text += "If result is greater than 10, then upper digit is carry over. Store the lower digit in line 4 and upper digit (carry) to previous column of line 1. Start with the lowest digit of multiplier. Multiply with each digit of multipliant and store the result in line 4. Now do the same for each digit of the multiplier and store result in subsequent lines. After doing this for all the digits of multiplier, add the the lines from 4 to last but one. Store the outcome in 'Result'.<br>"	
		}

		text += "- Multiply " + Number(tbl.getElementsByTagName("tr")[2].cells[maxDigits - tempMultiplierDigit].innerHTML) + " and " + Number(tbl.getElementsByTagName("tr")[1].cells[maxDigits - tempMultiplicantDigit].innerHTML) + ". Store " +  Number(tbl.getElementsByTagName("tr")[3+tempMultiplierDigit].cells[maxDigits - tempMultiplicantDigit - tempMultiplierDigit].innerHTML)+ " in line " + (4+tempMultiplierDigit) + ".";
		
		if (Number(tbl.getElementsByTagName("tr")[0].cells[maxDigits-tempMultiplicantDigit-tempMultiplierDigit-1].innerHTML) != "")
			text += " Store " + tbl.getElementsByTagName("tr")[0].cells[maxDigits-tempMultiplicantDigit-tempMultiplierDigit-1].innerHTML + " (carry) in line 0."; 
		
		text += "<br>";
		}
		else {
			if (tempCurrentCol == maxDigits) 
				text += "- Now add all lines starting from line 4 to line " + (numRows-1) + " and store result in line " + numRows + " (Result). Store carry if any in line 1. <br>";
			text += " - Add column " + tempCurrentCol + " of lines 4 to " + (numRows-1) + " and store the Result and Carry (if present).<br>";   
			
		}
		steps.innerHTML += "<b>" + text + "</b>";
		lsdigit = false;
		break;
		
	}
}

function updateArray()
{
  switch (Step) {
	  case 0:
		break;
		
	  case 1:
		currentCol = maxDigits;	// Current column being updated
		currentRow = 3; 	// Current "result" row
		currMultiplierDigit = 0;
		currMultiplicantDigit = 0;	// 
		offset = 0;	// start with right most column while doing the first multipler	  
		initArray();
		break;
		
	  case 2:
	  case 3:
		let value = 0;
		
		if (currMultiplicantDigit == 0) {	// Clear "carry" 
			// Clear carry
			for (let i=1; i <= maxDigits; i++) {
				myArray[0][i] = ""; 
			}
		}
		if (myArray[2][maxDigits - currMultiplierDigit] != "") {    // multiplier
			value = Number(myArray[2][maxDigits - currMultiplierDigit]);
			if (myArray[1][maxDigits - currMultiplicantDigit] != "") {	// multiplicant
				value *= Number(myArray[1][maxDigits - currMultiplicantDigit]);
				
				myArray[2][maxDigits - currMultiplierDigit] = myArray[2][maxDigits - currMultiplierDigit];  				
				myArray[1][maxDigits - currMultiplicantDigit] = myArray[1][maxDigits - currMultiplicantDigit]; 
			}
		}
		
		if (myArray[0][maxDigits - currMultiplicantDigit-currMultiplierDigit] != "") {	// carry
				value += Number(myArray[0][maxDigits - currMultiplicantDigit-currMultiplierDigit]);
		}
		
		if (value >= 10) {	// Check if we have "carry"
			carry = Math.floor(value/10);
			value = value%10;
			if (carry > 0) {
				myArray[0][maxDigits-currMultiplicantDigit-currMultiplierDigit-1] = carry.toString(); // update "carry" cell 
			}
		}
			
		myArray[3+currMultiplierDigit][maxDigits - currMultiplicantDigit - currMultiplierDigit] = value.toString(); 
				
		if (currMultiplicantDigit < num1.length-1) {
			currMultiplicantDigit = currMultiplicantDigit + 1;
			Step = 2;	// Prepare to handle next digit 
		} else {
			if (myArray[0][maxDigits - currMultiplicantDigit- currMultiplierDigit-1]!= "") {	// Carry present?
				myArray[3+currMultiplierDigit][maxDigits-currMultiplicantDigit- currMultiplierDigit-1] = myArray[0][maxDigits - currMultiplicantDigit-currMultiplierDigit-1]; // Bring over carry
				}

			currMultiplicantDigit = 0; 	// ready to handle next multiplier digit
			
			if (currMultiplierDigit < num2.length-1) {
				currMultiplierDigit = currMultiplierDigit + 1; 	// ready to handle next digit
				Step = 2;
			} else
				Step = 3;	// we are done processing all digits
		}
        break;	

		case 4:
			let val=0;
			let val1=0;
			
			if (currentCol == maxDigits) {
				for (let i=1; i <= maxDigits; i++) {	// Clear carry
				myArray[0][i] = ""; 
				}
			}
			
			for (let i=3; i < numRows-1; i++) { 	// Add all columns
				if (myArray[i][currentCol] != "") { 
					val += Number(myArray[i][currentCol]);
				}
			}
			if (myArray[0][currentCol] != "") { 	// add carry
					val += Number(myArray[0][currentCol]);
			}	
			val1 = val;
			if (val >= 10) {	// Check if we have "carry"
				carry = Math.floor(val/10);
				val1 = val%10;
			if (carry > 0) {
				myArray[0][currentCol-1] = carry.toString(); // update "carry" cell 
			}
			}
			
			if (val >= 0) {
				myArray[numRows-1][currentCol] = val1.toString(); 
			}
				
			currentCol -= 1;
			
			if (currentCol > 0){
				Step = 3;
			} else {/// We are done calculating ?
					
			doneSolving = true;
			}
		
        break;	  
	}
}

function UpdateCell(Row, Cell, Str, BkColor, FgColor) {
		tbl.getElementsByTagName("tr")[Row].cells[Cell].style.backgroundColor = BkColor;
		tbl.getElementsByTagName("tr")[Row].cells[Cell].style.color = FgColor;
		tbl.getElementsByTagName("tr")[Row].cells[Cell].innerHTML = Str;
}


function updateTbl() {
  switch (Step) {
	  case 0:
		currentCol = maxDigits;	// Current column being updated
		currentRow = 3; 	// Current "result" row
		currMultiplierDigit = 0;
		currMultiplicantDigit = 0;	// 
		offset = 0;	// start with right most column while doing the first multipler
		initRow(1, num1);
		initRow(2, num2);
		setTblCursor(1, 2);	// set cursor
		tbl.focus(); 
		break;
		
	  case 1:
	  case 2:
	  case 3:
		removeHighlight();
		let value = 0;
		
		if (currMultiplicantDigit == 0) {	// Clear "carry" 
			// Clear carry
			for (let i=1; i <= maxDigits; i++) {
				UpdateCell(0, i, "", tblBkGround, tblBkGround); 
			}
		}
		if (tbl.getElementsByTagName("tr")[2].cells[maxDigits - currMultiplierDigit].innerHTML != "") {    // multiplier
			value = Number(tbl.getElementsByTagName("tr")[2].cells[maxDigits - currMultiplierDigit].innerHTML);
			if (tbl.getElementsByTagName("tr")[1].cells[maxDigits - currMultiplicantDigit].innerHTML != "") {	// multiplicant
				value *= Number(tbl.getElementsByTagName("tr")[1].cells[maxDigits - currMultiplicantDigit].innerHTML);
				UpdateCell(2,maxDigits - currMultiplierDigit, tbl.getElementsByTagName("tr")[2].cells[maxDigits - currMultiplierDigit].innerHTML, tblTempBkGround, tblHiliteForeGround);  // change bkground color of multiplier				
				UpdateCell(1,maxDigits - currMultiplicantDigit, tbl.getElementsByTagName("tr")[1].cells[maxDigits - currMultiplicantDigit].innerHTML, tblTempBkGround, tblHiliteForeGround);  // change bk color of multiplicant
			}
		}
		
		if (tbl.getElementsByTagName("tr")[0].cells[maxDigits - currMultiplicantDigit-currMultiplierDigit].innerHTML != "") {	// carry
				value += Number(tbl.getElementsByTagName("tr")[0].cells[maxDigits - currMultiplicantDigit-currMultiplierDigit].innerHTML);
				UpdateCell(0,maxDigits - currMultiplicantDigit-currMultiplierDigit, tbl.getElementsByTagName("tr")[0].cells[maxDigits - currMultiplicantDigit-currMultiplierDigit].innerHTML, tblTempBkGround, tblHiliteForeGround);  				
		}
		
		if (value >= 10) {	// Check if we have "carry"
			carry = Math.floor(value/10);
			value = value%10;
			if (carry > 0) {
				UpdateCell(0, maxDigits-currMultiplicantDigit-currMultiplierDigit-1, carry.toString(), tblHiliteBkGround, tblHiliteForeGround); // update "carry" cell 
			}
		}
			
		UpdateCell(3+currMultiplierDigit, maxDigits - currMultiplicantDigit - currMultiplierDigit, value.toString(), tblHiliteBkGround, tblHiliteForeGround); 
				
		tempMultiplicantDigit = currMultiplicantDigit;	// Save the values as they will be used elsewhere
		tempMultiplierDigit = currMultiplierDigit;

		if (currMultiplicantDigit < num1.length-1) {
			currMultiplicantDigit = currMultiplicantDigit + 1;
			Step = 2;	// Prepare to handle next digit 
		} else {
			if (tbl.getElementsByTagName("tr")[0].cells[maxDigits - currMultiplicantDigit- currMultiplierDigit-1].innerHTML != "") {	// Carry present?
				UpdateCell(3+currMultiplierDigit, maxDigits-currMultiplicantDigit- currMultiplierDigit-1, tbl.getElementsByTagName("tr")[0].cells[maxDigits - currMultiplicantDigit-currMultiplierDigit-1].innerHTML, tblHiliteBkGround, tblHiliteForeGround); // Bring over carry
				}

			currMultiplicantDigit = 0; 	// ready to handle next multiplier digit
			
			if (currMultiplierDigit < num2.length-1) {
				currMultiplierDigit = currMultiplierDigit + 1; 	// ready to handle next digit
				Step = 2;
			} else
				Step = 3;	// we are done processing all digits
		}
		
        break;	

		case 4:
			let val=0;
			let val1=0;
			currStep = 4;
			tempCurrentCol = currentCol;	// store it for later use
			removeHighlight();
			
			if (currentCol == maxDigits) {
				for (let i=1; i <= maxDigits; i++) {	// Clear carry
					UpdateCell(0, i, "", tblBkGround, tblBkGround); 
				}
			}
			
			for (let i=3; i < numRows-1; i++) { 	// Add all columns
				if (tbl.getElementsByTagName("tr")[i].cells[currentCol].innerHTML != "") { 
					UpdateCell(i,currentCol, tbl.getElementsByTagName("tr")[i].cells[currentCol].innerHTML, tblTempBkGround, tblHiliteForeGround);				
					val += Number(tbl.getElementsByTagName("tr")[i].cells[currentCol].innerHTML);
				}
			}
			
			if (tbl.getElementsByTagName("tr")[0].cells[currentCol].innerHTML != "") { 	// add carry
					UpdateCell(0,currentCol, tbl.getElementsByTagName("tr")[0].cells[currentCol].innerHTML, tblTempBkGround, tblHiliteForeGround);	
					val += Number(tbl.getElementsByTagName("tr")[0].cells[currentCol].innerHTML);
			}	
			val1 = val;
			
			if (val >= 10) {	// Check if we have "carry"
				carry = Math.floor(val/10);
				val1 = val%10;
			
				if (carry > 0) {
					UpdateCell(0, currentCol-1, carry.toString(), tblHiliteBkGround, tblHiliteForeGround); // update "carry" cell 
				}
			}
			
			if (val >= 0) {
				UpdateCell(numRows-1, currentCol, val1.toString(), tblHiliteBkGround, tblHiliteForeGround); 
			}
				
			currentCol -= 1;	// Now to previous column
			
			if (currentCol > 0){
				Step = 3;
			} else {/// We are done calculating ?
				if (tbl.getElementsByTagName("tr")[numRows-1].cells[1].innerHTML == "0") {	// if first digit if result is 0, show a blank instead
					tbl.getElementsByTagName("tr")[numRows-1].cells[1].innerHTML = "";	
					UpdateCell(numRows-1, 1, "", tblBkGround, tblForeGround); 
				}					

				document.getElementById("btnNextStep").disabled = true;
				doneSolving = true;
				showAnswer();
				let text = "\n<b>We have now processed all columns and the problem is solved. ";
				text += document.getElementById("Answer").innerHTML + "</b";
				document.getElementById("Steps").innerHTML += text;
				alert("We are done solving. " + document.getElementById("Answer").innerHTML);	// Notify the user
				tbl.focus();
			}

			break;
	}
}
	
function nextStep() {
	if (Step == 0) {
      if (!validateInput()) {
		  return false;
	  }

	  if (maxDigits > 0) {	// this is probably unnecessary since we already verified that the numbers are not "blanks"
	  
	    numCols = maxDigits + 1; // We will have one additonal colum to store the final carry over (if it exists).
 
		if (!hideSteps) {	// if we are not in "Exercise" mode
			showSteps();
			createTbl(numCols);
			tbl.focus();	// set focus to our table
			setTblCursor(0,1);	// set cursor
			updateTbl();
		}
	  }
      
	  document.getElementById("btnSolve").disabled = true;
	  document.getElementById("btnExercise").disabled = true;
	  document.getElementById("btnVerify").disabled = true;
    }  else {
	   	if (!hideSteps) {
			updateTbl();
			updateSteps();
		} else {
			updateArray();
		}
	}
	
	Step = Step + 1;
	return true;
}

function setTblCursor(x, y) 
{
  let s = window.getSelection();
  let r = document.createRange();
  r.selectNodeContents(tbl.getElementsByTagName("tr")[x].cells[y]);
  s.removeAllRanges();
  s.addRange(r); 
 }

function getCursor() 
{
  // Now get the current cursor postion (row, column) and save it for future use when we get back focus
}

function exercise()
{
  if (!validateInput()) {
	return;
  }

  exerciseMode = true;	// We are in Exercise mode
  document.getElementById("btnExercise").disabled = true;
  document.getElementById("btnVerify").disabled = false;
  document.getElementById("btnSolve").disabled = true;
  document.getElementById("btnNextStep").disabled = true;
  
  numCols = maxDigits + 1; // We will have one additonal colum to store the final carry over (if it exists). And one more column
										// to label the rows

  createTbl(numCols);
  tbl.focus();	// set focus to our table
  setTblCursor(0, 1);	// set cursor 	
}

function compareAnswers()
{
	let tbl = document.getElementById("Tbl");	
	
    for (let i=1; i <= maxDigits; i++) {
		if ((i==1) &&  (myArray[numRows-1][1] == "0"))	// ignore (dont' comapre) MS digit if it is 0
			continue;
		if (myArray[numRows-1][i] != tbl.getElementsByTagName("tr")[numRows-1].cells[i].innerHTML)
			return false;
	}
	
	return true;
}

function verify()
{
  hideSteps=true;

  solve();

// ask them to retry. Ask them to press F5 and restart. Later add a separate button to retry so they need not enter the numbers again.
  
	
	document.getElementById("AnswerHeading").style.visibility = "visible";
	document.getElementById("AnswerHeading").style.backgroundColor = "#FFEA00";
	let answer = document.getElementById("Answer");
	answer.style.visibility = "visible";
  answer.style.color = tblHiliteForeGround;
  
  if (compareAnswers()) {
    answer.style.backgroundColor = "green";
	answer.innerHTML = "Answer is correct. Congratulations";
  }
  else {
    answer.style.backgroundColor = tblHiliteBkGround;
	answer.innerHTML = "Sorry, answer is incorrect.";  
  }
  alert(answer.innerHTML);	// Notify the user
  answer.focus();
  document.getElementById("btnVerify").disabled = false;

}

function validateInput() {
  num1 = document.getElementById("number1").value;
  num2 = document.getElementById("number2").value;

  if (num1 == ""){
    alert("Number 1 cannot be blank");
	return false;
  }
  
   if (isNaN(num1)) {
    alert("Invalid input. Number 1 must contain only digits");
	return false;
  }
	   
  
  if (num2 == ""){
	alert("Number 2 cannot be blank");
	return false;
  }

   if (isNaN(num2)) {
    alert("Invalid input. Number 2 must contain only digits");
	return false;
  }

  getMaxDigits();
  currentCol = maxDigits+1; // We are going to start with the last column for computing the sum
  
  return true;
}


function solve() {
	if (!nextStep()) {
		return;
	}

	while (!doneSolving) {
		nextStep();
    }
		
    setTblCursor(0, 1);	// set cursor 	
}

function stepByStep() {
//    document.getElementById("btnNextStep").innerHTML = "NextStep"; // Hold off on this for now until I get more feedback
	nextStep();
}
