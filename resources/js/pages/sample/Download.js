const currentURL = window.location.href;


const urlParams = new URLSearchParams(new URL(currentURL).search);

let value = urlParams.get('value');

let quality = urlParams.get('quality');



console.log(value);

console.log(quality);

let download_name;
let link;








// next programming
var originaljson;

let retryCount = 0;

function loadJsonFilesWithRetries() {
  if (retryCount < 3) {
    console.log('try num ' + retryCount);
    fetch("wallpapers.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error('wallpaper.json - Network response was not OK');
        }
        return response.json();
      })
      .then((data) => {
        originaljson = data;
        console.log(originaljson);
        assign_data();




      })
      .catch((error) => {
        // Handle errors for the first JSON file
        console.error("Error loading wallpaper.json:", error);
        retryCount++; // Increment retry count
        loadJsonFilesWithRetries(); // Retry loading the JSON files
      });
  } else {
    // Show an alert if all retries fail
    alert("Failed to load JSON files after 3 attempts");
  }
}

// Start loading JSON files with retries
loadJsonFilesWithRetries();





function assign_data() {

  download_name = originaljson[value]["name"];


  link = originaljson[value]["link"][quality][1];

  thumblink = originaljson[value]["thumbnail"];

  assign_image(thumblink)

  document.getElementById("download_name").innerText = originaljson[value]["name"];


  console.log(link)

}







let roundedProgress;

function jitteryProgress(seconds) {
  const progressBar = document.getElementById("progress");
  const totalSteps = seconds * 10; // Increase granularity by multiplying seconds



  let currentStep = 0;
  const decrypting_text = document.getElementById("decrypting_text");


  const updateProgress = () => {
    currentStep++;
    const progress = (currentStep / totalSteps) * 100;
    roundedProgress = Math.round(progress * 10) / 10; // Round to 1 decimal place

    progressBar.style.width = `${roundedProgress}%`;


    decrypting_text.innerText = "Decrypting your data please wait (" + roundedProgress + "%)."

    //console.log(roundedProgress);

    if (currentStep < totalSteps) {
      setTimeout(updateProgress, Math.random() * 200); // Random time for jitter effect
    }
  };

  updateProgress();
}






const timer_text = document.querySelector("#timer h2");

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const formattedSec = sec < 10 ? `0${sec}` : sec;
  return `${min}:${formattedSec}`;
}

function countToGuessedNumber(guessedNumber) {
  let timer = 0;
  const interval = setInterval(() => {
    let current_time = formatTime(timer);
    timer_text.innerText = current_time + "s";
    console.log("Timer:", current_time);

    timer++;

    if (timer > guessedNumber) {
      clearInterval(interval);
      timer_text.innerText = "took : " + current_time + "s";
      decrypting_text.innerText = "If the download didn't start "
      document.querySelector(".spinner").style.display = "none";
      downloadFile(link);

      console.log("Countdown complete!");
    }
  }, 1000);
}



// Get a random number between 5 and 10
// const guessedNumber = Math.floor(Math.random() * (10 - 5 + 1)) + 5;  //guess number from 5-10
const guessedNumber = Math.floor(Math.random() * 5);

console.log("Guessed number:", guessedNumber);
jitteryProgress(guessedNumber);
countToGuessedNumber(guessedNumber); // Start timer countdown






function downloadFile(fileLink) {
  // Creating an <a> element to trigger the download
  const link = document.createElement('a');
  link.href = fileLink;

  // Extracting the file name from the link
  const fileName = download_name = originaljson[value]["name"];

  link.download = fileName;

  document.querySelector("#download_a").innerHTML = `<a href="` + fileLink + `" download="` + fileName + `">Click here</a>
    `
  document.querySelector("#download_a a").style.display = "inline";


  // Simulating a click to trigger the download
  link.click();
}

// Example usage:



function flip_donation_card(pos) {


  let card_container = document.querySelector("#donation_back");
  let card_container_back = document.querySelector("#donation_center");

  if (pos == "back") {
    card_container_back.style.transform = "rotateY(0deg)";
    card_container.style.transform = "rotateY(180deg)";

  } else if(pos == "done"){
    card_container_back.style.transform = "rotateY(0deg)";
    card_container.style.transform = "rotateY(180deg)";
    navigator.vibrate(100);
    initConfetti();

  } else {
    console.log("lohu");
    card_container_back.style.transform = "rotateY(180deg)";
    card_container.style.transform = "rotateY(0deg)";
  }

}






function assign_image(img_link) {
  let image = document.getElementById("donation_image");
  image.src=img_link;
}

