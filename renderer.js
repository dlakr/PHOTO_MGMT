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

// ... existing code ...

function playVideoInPlayer(videoPath) {
    const contentViewer = document.getElementById('contentViewer');
    contentViewer.innerHTML = ''; // Clear previous content

    // Determine the file extension
    const fileExtension = videoPath.split('.').pop().toLowerCase();
    let validType;
    let sourceType;

    // Check for supported video formats
    switch (fileExtension) {
        case 'mp4':
            sourceType = 'video/mp4';
            validType = true;
            break;
        // ... other supported formats ...
        default:
            validType = false;
            break;
    }

    if (validType) {
        // Create and display the video element
        const video = document.createElement('video');
        video.className = 'viewerVideo';
        video.controls = true;
        video.src = `file://${videoPath}`;
        contentViewer.appendChild(video);
    } else {
        // Display an error message for unsupported formats
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Video format not supported.';
        errorMessage.style.backgroundColor = "white"
        errorMessage.style.padding = "10px"
        contentViewer.appendChild(errorMessage);

        // Add "Show in File Browser" button
        const showInFileBrowserButton = document.createElement('button');
        showInFileBrowserButton.textContent = 'Show in File Browser';
        showInFileBrowserButton.style.fontSize = '16px'
        showInFileBrowserButton.style.padding = '10px 20px'
        showInFileBrowserButton.addEventListener('click', () => {
            ipcRenderer.send('show-in-file-browser', videoPath);
            event.stopPropagation();

        });
        contentViewer.appendChild(showInFileBrowserButton);
    }

    document.getElementById('viewerContainer').style.display = 'block';
}







document.getElementById('viewerContainer').addEventListener('click', function(event) {
    const contentViewer = document.getElementById('contentViewer');
    const showInFileBrowserButton = document.getElementById('showInFileBrowserButton'); // This might be null
    const videoPlayer = contentViewer.querySelector('video');

    // Check if the click is outside of contentViewer and not on the 'Show in File Browser' button
    if ((!showInFileBrowserButton || (event.target !== showInFileBrowserButton && !showInFileBrowserButton.contains(event.target))) && !contentViewer.contains(event.target)) {
        // Hide the viewer container
        this.style.display = 'none';

        // Pause and reset the video if it's playing
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.currentTime = 0;
            videoPlayer.src = '';
        }
    }
});



//document.getElementById('viewerContainer').addEventListener('click', function(event) {
//    const contentViewer = document.getElementById('contentViewer');
//    const showInFileBrowserButton = document.getElementById('showInFileBrowserButton'); // Make sure to add this ID to your button
//    const videoPlayer = contentViewer.querySelector('video');
//    // Check if the click is outside of contentViewer and not on the 'Show in File Browser' button
//    if (!contentViewer.contains(event.target) && event.target !== showInFileBrowserButton && !showInFileBrowserButton.contains(event.target)) {
//        // Hide the viewer container
////    if (event.target !== showInFileBrowserButton && !showInFileBrowserButton.contains(event.target) && !contentViewer.contains(event.target)) {
////        // Pause and reset the video if it's playing
//        this.style.display = 'none';
//        console.log("Container clicked"); // Debugging
//        if (!contentViewer.contains(event.target)) {
//            console.log("Clicked outside contentViewer"); // Debugging
//
//            if (videoPlayer) {
//                console.log("Pausing video"); // Debugging
//                videoPlayer.pause();
//                videoPlayer.currentTime = 0;
//                videoPlayer.src = '';
//            }else{
//            console.log('not pausing video')
//            }
//
//        this.style.display = 'none';
//        }
//    }
//});
//document.getElementById('viewerContainer').addEventListener('click', function(event) {
//    const contentViewer = document.getElementById('contentViewer');
//    const showInFileBrowserButton = document.getElementById('showInFileBrowserButton');
//    const videoPlayer = contentViewer.querySelector('video');
//
//    // Check if the click is not on the 'Show in File Browser' button and is outside of contentViewer
//    if (event.target !== showInFileBrowserButton && !showInFileBrowserButton.contains(event.target) && !contentViewer.contains(event.target)) {
//        // Pause and reset the video if it's playing
//        if (videoPlayer) {
//            videoPlayer.pause();
//            videoPlayer.currentTime = 0;
//            videoPlayer.src = '';
//        }
//
//        // Hide the viewer container
//        this.style.display = 'none';
//    }
//});




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




function createButtons(thumbnailsData) {
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = ''; // Clear existing buttons

    thumbnailsData.forEach((thumbnailData, index) => {
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'buttonWrapper';

        // Create the thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.className = 'thumbnail';
        thumbnail.dataset.src = `file://${thumbnailData.path_rep}`;
        lazyLoadThumbnail(thumbnail); // Assuming this function sets up lazy loading

        // Extract the file name from the path
        const fileName = thumbnailData.path_file.split('.').pop(); // Adjust for your path structure

        // Determine if the file is a video or image
        const extension = path.extname(thumbnailData.path_file).toLowerCase().slice(1);
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

        // Create the file name label
        const fileNameLabel = document.createElement('div');
        fileNameLabel.className = 'fileNameLabel';
        fileNameLabel.textContent = fileName;

        // Append the thumbnail and file name label to the wrapper
        buttonWrapper.appendChild(thumbnail);
        buttonWrapper.appendChild(fileNameLabel);

        // Create and append the tick box
        const tickBox = document.createElement('input');
        tickBox.type = 'checkbox';
        tickBox.className = 'tickBox';
        tickBox.setAttribute('data-index', index);
        tickBox.checked = true;
        buttonWrapper.appendChild(tickBox);

        // Append the wrapper to the container
        buttonContainer.appendChild(buttonWrapper);
    });

    // Restore selection state (if applicable)
    // ...
}




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
