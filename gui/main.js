const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const fs = require('fs');

let pythonExecutable;

//app.on('ready', () => {
//    let platforms= process.platform;
switch(process.platform) {
    case 'win32':
        console.log('running on windows')
        pythonExecutable = "F:\\Dropbox\\_Programming\\PHOTO_MGMT\\w_venv\\Scripts\\python.exe";
        break;

    case 'darwin':
        pythonExecutable = './venv/bin/python';
        break;
}
//});

//store the virtual environment in a variable (mac)
//const pythonExecutable = './myenv/bin/python'; // For macOS and Linux
//for windows

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  win.webContents.openDevTools();
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

ipcMain.on('load-paths', (event, directory) => {
  console.log(directory);

  const pythonProcess = spawn(pythonExecutable, ['python_script.py', directory]);

  pythonProcess.stdout.on('data', (data) => {
    const pathsDataFromPython = JSON.parse(data.toString());
    console.log(data);
    console.log(`Received data from Python:`, pathsDataFromPython);
    try {


      win.webContents.send('paths-data', pathsDataFromPython);
    } catch (error) {
      console.error(`Error parsing data from Python: ${error}`);
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python script error: ${data}`);
  });
});

ipcMain.on('request-json-data',  (event) => {
    console.log('json requested')
    event.reply('send-json-data', jsonData);
    });

ipcMain.on('copy-marked-files', (event, selectedPaths) => {
    const destinationDirectory = 'C:\\Users\\dlaqu\\OneDrive\\Desktop\\copied';

    try {
        // Ensure the destination directory exists
        if (!fs.existsSync(destinationDirectory)) {
            fs.mkdirSync(destinationDirectory, { recursive: true });
        }

        // Copy each image to the destination directory
        selectedPaths.forEach(sourcePath => {
            const fileName = path.basename(sourcePath);
            const destinationPath = path.join(destinationDirectory, fileName);
            fs.copyFileSync(sourcePath, destinationPath);
        });

        // Notify the renderer process that the copy operation is done
        event.reply('images-copied-successfully');
    } catch (error) {
        console.error("Error copying files:", error);
        event.reply('images-copy-failed', error.message); // Send back the error message to the renderer
    }
});

