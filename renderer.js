const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const rawData = fs.readFileSync(path.join(__dirname, 'format.json'), 'utf-8');

let formats = {};
let pathsData = [];


//----------------------------------------------------------------------------------
// This function will render an image with a checkbox, maintaining its lazy load attribute and state.
function createImageElement(filePath, isChecked) {
  observer.observe(image);
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('buttonWrapper');

  const image = new Image();
  image.src = filePath; // This should be a placeholder or low-res image initially
  image.dataset.src = filePath; // The actual image to be loaded when in view
  image.loading = 'lazy';
  image.classList.add('thumbnail');

  const tickBox = document.createElement('input');
  tickBox.type = 'checkbox';
  tickBox.classList.add('tickBox');
  tickBox.checked = isChecked; // The state should be determined by the application logic
  tickBox.onchange = (e) => handleTickBoxChange(e, filePath); // A function to handle tickbox state changes

  imageContainer.appendChild(image);
  imageContainer.appendChild(tickBox);
  const savedState = localStorage.getItem(filePath);
  if (savedState !== null) {
    tickBox.checked = savedState === 'true';
  }

  return imageContainer;
}

// A function to handle the tickbox state changes.
function handleTickBoxChange(event, filePath) {
  localStorage.setItem(filePath, event.target.checked);
  // Logic to handle the tickbox state.
  // This could involve saving the state to a local storage or a global object.
  console.log(`The tickbox for ${filePath} is now ${event.target.checked ? 'checked' : 'unchecked'}`);
}

// Logic to render the images would go here
// For example, when files are loaded, you would call `createImageElement` for each one and append it to `buttonContainer`

//-----------------------------------------------------------------------------
// Create an observer instance
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const image = entry.target;
      image.src = image.dataset.src;
      observer.unobserve(image); // Stop observing the image once it has been loaded
    }
  });
}, { rootMargin: "50px 0px", threshold: 0.01 });


//-----------------------------------------------------------------------------
//// Save the state when a tickbox is changed
//function handleTickBoxChange(event, filePath) {
//  localStorage.setItem(filePath, event.target.checked);
//  // Rest of your change handling
//}
//
//// When creating the tickbox, set its initial state from localStorage


//-----------------------------------------------------------------------------
// This could be part of your renderer.js

// Observer for lazy loading
//const observer = new IntersectionObserver((entries, observer) => {
//  entries.forEach(entry => {
//    if (entry.isIntersecting) {
//      const media = entry.target;
//      if (media.tagName === 'VIDEO') {
//        // For videos, you might want to generate a thumbnail or use a static one
//        media.poster = media.dataset.poster; // Your method to define the video poster path
//      } else if (media.tagName === 'IMG') {
//        media.src = media.dataset.src; // For images, load the actual image
//      }
//      observer.unobserve(media); // Stop observing once loaded
//    }
//  });
//}, { rootMargin: "50px 0px", threshold: 0.01 });

// Function to create media elements (images or videos with thumbnails)
function createMediaElement(filePath, isChecked, isVideo = false) {
  const mediaContainer = document.createElement('div');
  mediaContainer.classList.add('buttonWrapper');

  let media;
  if (isVideo) {
    media = document.createElement('video');
    media.dataset.poster = filePath; // Path to your video thumbnail
    media.controls = true;
  } else {
    media = new Image();
    media.dataset.src = filePath; // Actual image path
  }
  media.classList.add('thumbnail');
  media.loading = 'lazy'; // Only for images; ignored for video elements

  const tickBox = document.createElement('input');
  tickBox.type = 'checkbox';
  tickBox.classList.add('tickBox');
  tickBox.checked = isChecked;
  tickBox.onchange = (e) => handleTickBoxChange(e, filePath);

  mediaContainer.appendChild(media);
  mediaContainer.appendChild(tickBox);

  observer.observe(media); // Start observing the media element

  return mediaContainer;
}

// Logic to render the images or videos would go here
// For example, when files are loaded, you would call `createMediaElement` for each one and append it to `buttonContainer`

//-----------------------------------------------------------------------------
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
        thumbnail.src = `file://${thumbnailData.path_rep}`;

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
        tickBox.checked = true

        buttonWrapper.appendChild(thumbnail);
        buttonWrapper.appendChild(tickBox);
        buttonContainer.appendChild(buttonWrapper);
    });
}

function getDesktopCopiedFolderPath() {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const copiedFolderPath = path.join(desktopPath, 'copied');

    // Ensure the directory exists and set permissions
    if (!fs.existsSync(copiedFolderPath)) {
        fs.mkdirSync(copiedFolderPath, { recursive: true });
        // Set the folder permissions to 'read and write' for the owner
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
    // Filter out the ones that are checked and map to their associated path_file
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

    // Get the destination folder path on the desktop


    // Send the selected path_files and the destination folder path to the main process for copying
    console.log(`${selectedFiles} to ${destinationDirectory}`)
    ipcRenderer.send('copy-marked-files', selectedFiles, destinationDirectory);
}



document.addEventListener('DOMContentLoaded', (event) => {

    ipcRenderer.on('console-log', (event, message) => {
      // Assuming you have an HTML element with the id 'customConsole' where you want to display the logs
      const customConsole = document.getElementById('customConsole');
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.className = 'log-message'; // Use this class to style your log messages
      customConsole.appendChild(messageElement);
    });

    ipcRenderer.on('console-error', (event, message) => {
      const customConsole = document.getElementById('customConsole');
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.className = 'error-message'; // Use this class to style your error messages
      customConsole.appendChild(messageElement);
    });
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const media = entry.target;
          if (media.tagName === 'VIDEO') {
            // For videos, you might want to generate a thumbnail or use a static one
            media.poster = media.dataset.poster; // Your method to define the video poster path
          } else if (media.tagName === 'IMG') {
            media.src = media.dataset.src; // For images, load the actual image
          }
          observer.unobserve(media); // Stop observing once loaded
        }
      });
    }, { rootMargin: "50px 0px", threshold: 0.01 });

  ipcRenderer.on('paths-data', (event, pathsDataFromPython) => {

    pathsData = pathsDataFromPython
    //  console.log('Received paths-data event with data:', pathsData);
      createButtons(pathsData);
    //  console.log(pathsData)
    });

    try {


        formats = JSON.parse(rawData);

    } catch (err) {
        console.error('Error reading formats.json:', err);
}
  // ... your existing logic to handle the DOM content loaded
  document.getElementById('selectDirectory').addEventListener('change', (event) => {


    const path = require('path');
    let filePath = document.getElementById('selectDirectory').files[0].path;

    let selectedDirectory = path.dirname(filePath);


//    const selectedDirectory = event.target.files[0].path;
    ipcRenderer.send('load-paths', selectedDirectory);
    });

    // Attach the function to the copySelectedButton
    const copySelectedButton = document.getElementById('copySelectedButton');
    copySelectedButton.addEventListener('click', copySelectedFiles);


    // Custom console log functions
    const originalLog = console.log;
    //const originalWarn = console.warn;
    const originalError = console.error;

    const customConsole = document.getElementById('customConsole');

    console.log = function (...args) {
        originalLog.apply(console, args);
        customConsole.innerHTML += '<div style="color: black;">' + args.join(' ') + '</div>';
        customConsole.scrollTop = customConsole.scrollHeight;
    }

    //console.warn = function (...args) {
    //    originalWarn.apply(console, args);
    //    customConsole.innerHTML += '<div style="color: orange;">' + args.join(' ') + '</div>';
    //    customConsole.scrollTop = customConsole.scrollHeight;
    //}

    console.error = function (...args) {
        originalError.apply(console, args);
        customConsole.innerHTML += '<div style="color: red;">' + args.join(' ') + '</div>';
        customConsole.scrollTop = customConsole.scrollHeight;
    }
});



