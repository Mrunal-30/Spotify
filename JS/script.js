let currsong = new Audio();
let songs;
let currfolder = "";

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

async function getsongs(folder) {
  currfolder = folder;
  let a = await fetch(`http://127.0.0.1:5500/Spotify/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  let songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/Spotify/${folder}/`)[1]);
    }
  }
  return songs;
}

const playMusic = (track, pause = false) => {
  currsong.src = `/Spotify/${currfolder}/` + track;
  if (!pause) {
    currsong.play();
    document.getElementById("play").src = "Images/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  console.log("Fetching albums...");
  let a = await fetch(`http://127.0.0.1:5500/Spotify/Songs/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let anchors = div.getElementsByTagName("a");
  let cardcontainer = document.querySelector(".cardcontainer");
  let array = Array.from(anchors);

  for (let index = 0; index < array.length; index++) {
    const e = array[index];
    if (e.href.includes("/Songs/") && !e.href.endsWith("/Songs/")) {
      // Extract the folder name
      let folder = e.href.replace(/\/$/, "").split("/").pop();
      console.log(`Processing folder: ${folder}`);

      try {
        // Fetch the info.json for the album
        let albumData = await fetch(
          `http://127.0.0.1:5500/Spotify/Songs/${folder}/info.json`
        );
        let response = await albumData.json();

        // Add album card
        cardcontainer.innerHTML += `
          <div class="card" data-folder="${folder}">
            <div class="play">
              <svg width="40" height="40" viewBox="0 0 32 32" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#00C853" />
                <path d="M12 21V11L22 16L12 21Z" fill="#000000" stroke="#000000" stroke-width="1.5"
                  stroke-linejoin="round" />
              </svg>
            </div>
            <img src="Songs/${folder}/cover.jpg" alt="${response.title}">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
          </div>`;
      } catch (error) {
        console.error(`Error fetching album data for ${folder}:`, error);
      }
    }
  }

  bindAlbumCardClicks(); // Call function to handle album clicks
}

function bindAlbumCardClicks() {
  Array.from(document.getElementsByClassName("card")).forEach((card) => {
    card.addEventListener("click", async (e) => {
      const folder = e.currentTarget.dataset.folder;
      console.log(`Album folder clicked: ${folder}`);

      // Fetch songs from the clicked album/folder
      songs = await getsongs(`Songs/${folder}`);

      if (songs.length > 0) {
        // Play the first song in the list
        playMusic(songs[0]);

        // Update song list
        const songul = document
          .querySelector(".songlists")
          .getElementsByTagName("ul")[0];
        songul.innerHTML = ""; // Clear previous list

        // Populate with new songs
        for (const song of songs) {
          songul.innerHTML += `
              <li>
                <img class="invert" src="Images/music.svg" alt="Song icon">
                <div class="info">
                  <div> ${song.replaceAll("%20", " ")}</div>
                  <div>Unknown</div>
                </div>
                <div class="playnow">
                  <span>Play Now</span>
                  <img src="Images/play.svg" alt="Play icon">
                </div>
              </li>`;
        }

        // Rebind song click event
        bindSongItemClicks();
      } else {
        console.warn(`No songs found in folder: ${folder}`);
      }
    });
  });
}

function bindSongItemClicks() {
  Array.from(
    document.querySelector(".songlists").getElementsByTagName("li")
  ).forEach((li) => {
    li.addEventListener("click", () => {
      const track = li
        .querySelector(".info")
        .firstElementChild.innerHTML.trim();
      playMusic(track); // Play the selected song
    });
  });
}

function setupEventListeners() {
  document.getElementById("play").addEventListener("click", async () => {
    if (!songs || songs.length === 0) {
      console.warn("No songs available in the current folder.");
      return;
    }

    if (currsong.paused) {
      if (!currfolder) {
        console.warn("No folder selected. Please select an album.");
        return;
      }

      playMusic(songs[0]);
    } else {
      currsong.pause();
      document.getElementById("play").src = "Images/play1.svg";
    }
  });

  // Navigation through songs

  previous.addEventListener("click", () => {
    currsong.pause();
    let index = songs.indexOf(currsong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });
  next.addEventListener("click", () => {
    currsong.pause();
    let index = songs.indexOf(currsong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });
}

async function main() {
  // Initial songs list for CS folder
  songs = await getsongs("Songs/CS");
  if (songs.lenght > 0) {
    playMusic(songs[0], true); // Play the first song by default
  }

  await displayAlbums();
  setupEventListeners();

  let songul = document
    .querySelector(".songlists")
    .getElementsByTagName("ul")[0];
  for (const song of songs) {
    songul.innerHTML += `
      <li> 
        <img class="invert" src="Images/music.svg" alt="">
        <div class="info">
          <div> ${song.replaceAll("%20", " ")}</div>
          <div>Unknown</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img src="Images/play.svg" alt="Play icon">
        </div>
      </li>`;
  }

  bindSongItemClicks(); // Bind the song click events

  // Seekbar functionality (dragging and clicking)

  let isDragging = false;

  document.querySelector(".circle").addEventListener("mousedown", (e) => {
    isDragging = true;
    document.body.style.cursor = "pointer";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const seekbar = document.querySelector(".seekbar");
      const progress = document.querySelector(".progress");
      const circle = document.querySelector(".circle");

      const seekbarRect = seekbar.getBoundingClientRect();
      let newLeft = e.clientX - seekbarRect.left;
      newLeft = Math.max(0, Math.min(newLeft, seekbar.offsetWidth));

      const newPercent = (newLeft / seekbar.offsetWidth) * 100;

      progress.style.width = newPercent + "%";
      circle.style.left = newPercent + "%";

      currsong.currentTime = (currsong.duration * newPercent) / 100;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = "default";
    }
  });

  // Handle clicking directly on the seekbar to update music time
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    const seekbar = e.currentTarget;
    const seekbarRect = seekbar.getBoundingClientRect();
    const clickPosition = e.clientX - seekbarRect.left; // Position clicked relative to the seekbar
    const newPercent = (clickPosition / seekbar.offsetWidth) * 100; // Convert to percentage

    const progress = document.querySelector(".progress");
    const circle = document.querySelector(".circle");

    progress.style.width = newPercent + "%";
    circle.style.left = newPercent + "%";

    // Set the currentTime of the song based on the click position
    currsong.currentTime = (currsong.duration * newPercent) / 100;
  });

  // Update the progress bar and circle during playback
  currsong.addEventListener("timeupdate", () => {
    const progress = document.querySelector(".progress");
    const circle = document.querySelector(".circle");

    if (currsong.duration) {
      const currentPercent = (currsong.currentTime / currsong.duration) * 100;
      progress.style.width = currentPercent + "%";
      circle.style.left = currentPercent + "%";
    }

    document.querySelector(".songtime").innerHTML = `${formatTime(
      currsong.currentTime
    )} / ${formatTime(currsong.duration)}`;
  });

  currsong.addEventListener("timeupdate", () => {
    const progress = document.querySelector(".progress");
    const circle = document.querySelector(".circle");

    if (currsong.duration) {
      const currentPercent = (currsong.currentTime / currsong.duration) * 100;
      progress.style.width = currentPercent + "%";
      circle.style.left = currentPercent + "%";
    }

    document.querySelector(".songtime").innerHTML = `${formatTime(
      currsong.currentTime
    )} / ${formatTime(currsong.duration)}`;
  });

  // Handle volume change
  document
  .querySelector(".range")
  .getElementsByTagName("input")[0]
  .addEventListener("change", (e) => {
    currsong.volume = parseInt(e.target.value) / 100;
    
    // Check if the volume is set to 0 to switch the icon
    if (currsong.volume === 0) {
      document.querySelector(".volume>img").src = document
        .querySelector(".volume>img")
        .src.replace("volume.svg", "mute.svg");
    } else {
      // Set the volume icon back to normal
      document.querySelector(".volume>img").src = document
        .querySelector(".volume>img")
        .src.replace("mute.svg", "volume.svg");
    }
  });



  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = 0;
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  //Add event listner to mute the song
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currsong.volume = 0;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currsong.volume = 0.1;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 10;
    }
  });
}

main();
