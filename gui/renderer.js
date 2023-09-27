const { ipcRenderer } = require('electron');

let pathsData = [];
ipcRenderer.on('paths-data', (event, pathsData) => {
  console.log('Received paths-data event with data:', pathsData);
  createButtons(pathsData);
});

function createButtons(thumbnailsData) {
  console.log('createButtons called with data:', thumbnailsData);  // Log the input data

  const buttonContainer = document.getElementById('buttonContainer');
  if (!buttonContainer) {
    console.error('Could not find buttonContainer element');
    return;
  }

  buttonContainer.innerHTML = ''; // Clear existing buttons

  thumbnailsData.forEach((thumbnailData, index) => {
    console.log(`Processing thumbnailData at index ${index}:`, thumbnailData);  // Log the current thumbnailData being processed

    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'buttonWrapper';

    const thumbnail = document.createElement('img');
    thumbnail.className = 'thumbnail';
    thumbnail.src = `file://${thumbnailData.path_rep}`;
    if (!thumbnail.src) {
      console.error(`Invalid src for thumbnail at index ${index}`);
    }

    const tickBox = document.createElement('input');
    tickBox.type = 'checkbox';
    tickBox.className = 'tickBox';

    buttonWrapper.appendChild(thumbnail);
    buttonWrapper.appendChild(tickBox);
    buttonContainer.appendChild(buttonWrapper);

    thumbnail.addEventListener('click', () => {
      console.log(`Thumbnail at index ${index} clicked`);
      showImageInViewer(thumbnailData.path_rep);
    });

    tickBox.addEventListener('change', () => {
      if (tickBox.checked) {
        console.log('Tick box checked for:', thumbnailData.path_file);
        console.log(pathsData)
      } else {
        console.log('Tick box unchecked for:', thumbnailData.path_file);
      }
    });
  });
}

document.getElementById('selectDirectory').addEventListener('change', (event) => {


    const path = require('path');
    let filePath = document.getElementById('selectDirectory').files[0].path;
    console.log('Directory selected event triggered');
    let selectedDirectory = path.dirname(filePath);


//    const selectedDirectory = event.target.files[0].path;
    ipcRenderer.send('load-paths', selectedDirectory);
});


function showImageInViewer(imagePath) {
  const imageViewer = document.getElementById('imageViewer');
  imageViewer.innerHTML = ''; // Clear existing image

  const image = document.createElement('img');
  image.className = 'viewerImage';
  image.src = `file://${imagePath}`;

  imageViewer.appendChild(image);
}


function copySelectedFiles() {
    // Create an array to store the paths of the selected images
    const selectedPaths = [];
    console.log(selectedPaths)
    // Get all the tick boxes from the DOM
    const tickBoxes = document.querySelectorAll('.tickBox');

    tickBoxes.forEach((tickBox, index) => {
        if (tickBox.checked) {
            selectedPaths.push(pathsData[index].path_rep);
        }
    });

    if (selectedPaths.length === 0) {
        console.log('No images selected for copying.');
        return;
    }

    // Send the list of selected image paths to the main process for copying
    ipcRenderer.send('copy-selected-images', selectedPaths);
}

// Attach the function to the copySelectedButton
const copySelectedButton = document.getElementById('copySelectedButton');
copySelectedButton.addEventListener('click', copySelectedFiles);

