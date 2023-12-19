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
ipcRenderer.on('paths-data', (event, pathData) => {

  console.log('Received paths-data event with data:', pathData);
//  createButtons(pathData);
    addThumbnail(pathData);
    updateSelectionStateForThumbnail(pathData);
});

ipcRenderer.on("update-progress", (event, progress) => {
    document.getElementById('fileCount').textContent = `Files processed: ${progress}`;
});

try {
    formats = JSON.parse(rawData);

} catch (err) {
    console.error('Error reading formats.json:', err);
}
const videoPlayer = contentViewer.querySelector('video');

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
    const contentViewer = document.getElementById('contentViewer');
    contentViewer.innerHTML = ''; // Clear previous content

    const image = document.createElement('img');
    image.className = 'viewerImage';
    image.src = `file://${imagePath}`;
    contentViewer.appendChild(image);

    document.getElementById('viewerContainer').style.display = 'block';
}

function playVideoInPlayer(videoPath) {
    const contentViewer = document.getElementById('contentViewer');
    contentViewer.innerHTML = ''; // Clear previous content
    // When showing the video

    const video = document.createElement('video');
    video.className = 'viewerVideo';
    video.controls = true;
    video.style.display = 'block';
    video.setAttribute('data-playing', 'true'); // Set custom attribute
    video.src = `file://${videoPath}`;
    contentViewer.appendChild(video);

    document.getElementById('viewerContainer').style.display = 'block';
}




document.getElementById('viewerContainer').addEventListener('click', function(event) {
    const contentViewer = document.getElementById('contentViewer');
//    const videoPlayer = document.getElementById('video');
    const videoPlayer = contentViewer.querySelector('video');

    console.log("Container clicked"); // Debugging

    if (!contentViewer.contains(event.target)) {
        console.log("Clicked outside contentViewer"); // Debugging

        if (videoPlayer) {
            console.log("Pausing video"); // Debugging
            videoPlayer.pause();
            videoPlayer.currentTime = 0;
            videoPlayer.src = '';
        }else{
        console.log('not pausing video')}

        this.style.display = 'none';
    }
});




function openViewer(src, isVideo) {
    var viewerContainer = document.getElementById('viewerContainer');
    var viewerImage = document.getElementById('viewerImage');
    var viewerVideo = document.getElementById('viewerVideo');

    if (isVideo) {
        viewerVideo.style.display = 'block';
        viewerImage.style.display = 'none';
        viewerVideo.src = src;
    } else {
        viewerImage.style.display = 'block';
        viewerVideo.style.display = 'none';
        viewerImage.src = src;
    }

    viewerContainer.style.display = 'block';
}

// Add click event listeners to your thumbnails to open the viewer
// Example: openViewer('path/to/image.jpg', false);


//function createButtons(thumbnailsData) {
//    const buttonContainer = document.getElementById('buttonContainer');
//    buttonContainer.innerHTML = ''; // Clear existing buttons
//
//    thumbnailsData.forEach((thumbnailData, index) => {
//        console.log(`${thumbnailData.path_file}`);
//        const buttonWrapper = document.createElement('div');
//        buttonWrapper.className = 'buttonWrapper';
//
//        const thumbnail = document.createElement('img');
//        thumbnail.className = 'thumbnail';
//        thumbnail.dataset.src = `file://${thumbnailData.path_rep}`;
////        thumbnail.dataset.src =
//        lazyLoadThumbnail(thumbnail)
//        // Determine if the file is a video or image
//        const extension = path.extname(thumbnailData.path_file).toLowerCase().slice(1);
//        const tickBox = document.createElement('input');
//        tickBox.type = 'checkbox';
//        tickBox.className = 'tickBox';
//        tickBox.setAttribute('data-index', index);
//        tickBox.checked = true;
//        const isVideo = formats.videos.includes(extension);
//
//    thumbnail.addEventListener('click', () => {
//      const imageViewer = document.getElementById('viewerImage');
//      const videoPlayer = document.getElementById('viewerVideo');
//
//      if (isVideo) {
////          imageViewer.innerHTML = ''; // Clear the image viewer
//          playVideoInPlayer(thumbnailData.path_file);
//      } else {
////          videoPlayer.innerHTML = ''; // Clear the video player
//          showImageInViewer(thumbnailData.path_rep);
//      }
//    });
//
//
//        buttonWrapper.appendChild(thumbnail);
//        buttonWrapper.appendChild(tickBox);
//        buttonContainer.appendChild(buttonWrapper);
////        tickBox.checked = selectionState[index] || true;
//
////
//
//    });
//    // After creating all checkboxes
//    thumbnailsData.forEach((thumbnailData, index) => {
//        const tickBox = document.querySelector(`.tickBox[data-index="${index}"]`);
//        if (selectionState[index] !== undefined) {
//            tickBox.checked = selectionState[index];
//        }
//    });
//
////    restoreSelectionState();
//}


function addThumbnail(thumbnailData) {
    const buttonContainer = document.getElementById('buttonContainer');

    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'buttonWrapper';

    const thumbnail = document.createElement('img');
    thumbnail.className = 'thumbnail';
    thumbnail.dataset.src = `file://${thumbnailData.path_rep}`;
    lazyLoadThumbnail(thumbnail);

    // Determine if the file is a video or image
    const extension = path.extname(thumbnailData.path_file).toLowerCase().slice(1);
    const tickBox = document.createElement('input');
    tickBox.type = 'checkbox';
    tickBox.className = 'tickBox';
    // Use the path as a unique identifier instead of an index
    tickBox.setAttribute('data-path', thumbnailData.path_file);
    tickBox.checked = true;
    const isVideo = formats.videos.includes(extension);

    thumbnail.addEventListener('click', () => {
        const imageViewer = document.getElementById('viewerImage');
        const videoPlayer = document.getElementById('viewerVideo');

        if (isVideo) {
            playVideoInPlayer(thumbnailData.path_file);
        } else {
            showImageInViewer(thumbnailData.path_rep);
        }
    });

    buttonWrapper.appendChild(thumbnail);
    buttonWrapper.appendChild(tickBox);
    buttonContainer.appendChild(buttonWrapper);
}

// Update selection state for a new thumbnail
function updateSelectionStateForThumbnail(thumbnailData) {
    const tickBox = document.querySelector(`.tickBox[data-path="${thumbnailData.path_file}"]`);
    if (selectionState[thumbnailData.path_file] !== undefined) {
        tickBox.checked = selectionState[thumbnailData.path_file];
    }
}



document.addEventListener('change', event => {
    if(event.target.classList.contains('tickBox')) {
        saveSelectionState();
    }
});
document.getElementById('selectDirectory').addEventListener('change', (event) => {
    const files = event.target.files;
    const fileCount = files.length;
    let filePath = document.getElementById('selectDirectory').files[0].path;
    let selectedDirectory = path.dirname(filePath);
    ipcRenderer.send('load-paths', selectedDirectory, fileCount);
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

function resetAppState() {
    // Clear any displayed data
    document.getElementById('buttonContainer').innerHTML = ''; // Example element

    // Reset any internal state variables
    selectionState = {}; // Example state variable

    // Hide or reset other UI elements as needed
    const viewerContainer = document.getElementById('viewerContainer');
    if (viewerContainer) {
        viewerContainer.style.display = 'none';
    }

    // Additional reset actions...
}


const copySelectedButton = document.getElementById('copySelectedButton');
copySelectedButton.addEventListener('click', copySelectedFiles);

const originalLog = console.log;

const originalError = console.error;

document.getElementById('selectDirectory').addEventListener('click', function() {
    resetAppState();
});
//const customConsole = document.getElementById('customConsole');
//
//console.log = function (...args) {
//    originalLog.apply(console, args);
//    customConsole.innerHTML += '<div style="color: black;">' + args.join(' ') + '</div>';
//    customConsole.scrollTop = customConsole.scrollHeight;
//}
//
//
//console.error = function (...args) {
//    originalError.apply(console, args);
//    customConsole.innerHTML += '<div style="color: red;">' + args.join(' ') + '</div>';
//    customConsole.scrollTop = customConsole.scrollHeight;
//}




