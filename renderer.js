const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const rawData = fs.readFileSync(path.join(__dirname, 'format.json'), 'utf-8');

let formats = {};
let pathsData = [];

// IntersectionObserver for lazy loading thumbnails
let observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            const thumbnail = entry.target;
            thumbnail.src = thumbnail.dataset.src; // Load the actual image
            observer.unobserve(thumbnail); // Stop observing the loaded thumbnail
        }
    });
}, { rootMargin: "0px 0px 50px 0px" });

function lazyLoadThumbnail(thumbnail) {
    observer.observe(thumbnail); // Start observing for lazy loading
}

let selectionState = {}; // Object to store selection state

function saveSelectionState() {
    const tickBoxes = document.querySelectorAll('.tickBox');
    tickBoxes.forEach(tickBox => {
        const index = tickBox.getAttribute('data-index');
        selectionState[index] = tickBox.checked;
    });
}

function restoreSelectionState() {
    const tickBoxes = document.querySelectorAll('.tickBox');
    tickBoxes.forEach(tickBox => {
        const index = tickBox.getAttribute('data-index');
        tickBox.checked = selectionState[index] || false; // Restore state or default to false
    });
}


ipcRenderer.on('log', (event, ...args) => {
    console.log(...args); // This will log in the renderer's console
});
ipcRenderer.on('paths-data', (event, pathsDataFromPython) => {

  pathsData = pathsDataFromPython
  console.log('Received paths-data event with data:', pathsData);
  createButtons(pathsData);
});

ipcRenderer.on('update-file-count', (event, fileCount) => {
    document.getElementById('fileCount').textContent = `Files to process: ${fileCount}`;
});

try {
    formats = JSON.parse(rawData);

} catch (err) {
    console.error('Error reading formats.json:', err);
}




function thumbnailClicked(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    if (formats.images.includes(extension)) {
        // Display in the image viewer
        showImageInViewer(filePath);
    } else if (formats.videos.includes(extension)) {
        // Play in the video player
        playVideoInPlayer(filePath);
    }
}

function showImageInViewer(imagePath) {
    const imageViewer = document.getElementById('imageViewer');
    imageViewer.innerHTML = '';

    const image = document.createElement('img');
    image.className = 'viewerImage';
    image.src = `file://${imagePath}`;
    imageViewer.appendChild(image);
}

function playVideoInPlayer(videoPath) {
  const videoPlayer = document.getElementById('videoPlayer');
  videoPlayer.innerHTML = ''; // Clear existing content

  const video = document.createElement('video');
  video.controls = true; // Add video controls (play, pause, etc.)
  video.autoplay = true; // Set the video to autoplay
  video.muted = true; // Mute the video initially
  video.className = 'playerVideo';

  const source = document.createElement('source');
  source.src = `file://${videoPath}`;
  video.appendChild(source);

  videoPlayer.appendChild(video);

}


function createButtons(thumbnailsData) {
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = ''; // Clear existing buttons

    thumbnailsData.forEach((thumbnailData, index) => {
        console.log(`${thumbnailData.path_file}`);
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'buttonWrapper';

        const thumbnail = document.createElement('img');
        thumbnail.className = 'thumbnail';
        thumbnail.dataset.src = `file://${thumbnailData.path_rep}`;
//        thumbnail.dataset.src =
        lazyLoadThumbnail(thumbnail)
        // Determine if the file is a video or image
        const extension = path.extname(thumbnailData.path_file).toLowerCase().slice(1);

        const isVideo = formats.videos.includes(extension);

    thumbnail.addEventListener('click', () => {
      const imageViewer = document.getElementById('imageViewer');
      const videoPlayer = document.getElementById('videoPlayer');

      if (isVideo) {
          imageViewer.innerHTML = ''; // Clear the image viewer
          playVideoInPlayer(thumbnailData.path_file);
      } else {
          videoPlayer.innerHTML = ''; // Clear the video player
          showImageInViewer(thumbnailData.path_rep);
      }
    });
        const tickBox = document.createElement('input');
        tickBox.type = 'checkbox';
        tickBox.className = 'tickBox';
        tickBox.setAttribute('data-index', index);
//        tickBox.checked = true
        buttonWrapper.appendChild(thumbnail);
        buttonWrapper.appendChild(tickBox);
        buttonContainer.appendChild(buttonWrapper);
        tickBox.checked = selectionState[index] || true;

    });
    restoreSelectionState();
}

document.addEventListener('change', event => {
    if(event.target.classList.contains('tickBox')) {
        saveSelectionState();
    }
});
document.getElementById('selectDirectory').addEventListener('change', (event) => {
    const path = require('path');
    let filePath = document.getElementById('selectDirectory').files[0].path;
    let selectedDirectory = path.dirname(filePath);
    ipcRenderer.send('load-paths', selectedDirectory);
});


function getDesktopCopiedFolderPath() {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const copiedFolderPath = path.join(desktopPath, 'copied');


    if (!fs.existsSync(copiedFolderPath)) {
        fs.mkdirSync(copiedFolderPath, { recursive: true });

        fs.chmodSync(copiedFolderPath, 0o700); // This sets it to rwx------ (Owner can Read, Write, & Execute)
    }

    return copiedFolderPath;
}


function copySelectedFiles() {
    // Get all tickboxes
    console.log('copying')
    const tickBoxes = document.querySelectorAll('.tickBox');
    const destinationDirectory = getDesktopCopiedFolderPath();
    fs.chmodSync(destinationDirectory, 0o766);

    const selectedFiles = Array.from(tickBoxes).filter(tickBox => tickBox.checked).map(tickBox => {
        const index = parseInt(tickBox.getAttribute('data-index'), 10); // Retrieve the index from the tickBox attribute

        if (!pathsData[index]) {
            console.error(`No pathsData entry found for index ${index}.`);
            return null;
        }

        return pathsData[index].path_file; // Return the path_file for this index
    }).filter(Boolean); // This filter removes any null values from the array.

    if (selectedFiles.length === 0) {
        console.log('No files selected for copying.');
        return;
    }

    console.log(`${selectedFiles} to ${destinationDirectory}`)
    ipcRenderer.send('copy-marked-files', selectedFiles, destinationDirectory);
}

const copySelectedButton = document.getElementById('copySelectedButton');
copySelectedButton.addEventListener('click', copySelectedFiles);

const originalLog = console.log;

const originalError = console.error;

const customConsole = document.getElementById('customConsole');

console.log = function (...args) {
    originalLog.apply(console, args);
    customConsole.innerHTML += '<div style="color: black;">' + args.join(' ') + '</div>';
    customConsole.scrollTop = customConsole.scrollHeight;
}


console.error = function (...args) {
    originalError.apply(console, args);
    customConsole.innerHTML += '<div style="color: red;">' + args.join(' ') + '</div>';
    customConsole.scrollTop = customConsole.scrollHeight;
}




