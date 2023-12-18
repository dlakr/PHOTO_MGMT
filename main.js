//const ffmpeg = require('fluent-ffmpeg');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os')
const wd = app.getPath('userData')
const desktopPath = app.getPath('desktop');
const logFilePath = path.join(desktopPath, 'app.log');

//let pythonInterpreter
//switch (process.platform) {
//    case 'win32':
//        // On Windows, you might specify a path to the Python executable in a virtual environment
//        pythonInterpreter = path.join(__dirname, 'w_venv', 'Scripts', 'python.exe');
//        break;
//    case 'darwin':
//        // On macOS, the Python path would be different, or you could rely on the environment's Python
//        if(app.isPackaged){
//            pythonInterpreter = "./pm_venv/bin/python";
//        }else{
//            pythonInterpreter = "./pm_venv/bin/python";
//        };
//
//        break;
//}


function logToFile(message) {
    fs.appendFile(logFilePath, message + '\n', (err) => {
        if (err) throw err;
    });
}

// Override console.log
const originalConsoleLog = console.log;
console.log = (...args) => {
    originalConsoleLog(...args); // Keep default behavior
    logToFile(args.join(' ')); // Log to file
};



app.commandLine.appendSwitch('user-data-dir', wd);
let pythonExecutable;


let win;
const tempPath = path.join(os.tmpdir(), 'temp');
//console.log(`${tempPath}`)
//if (!fs.existsSync(tempPath)) {
//    fs.mkdirSync(tempPath, { recursive: true });
//}



function deleteFolderRecursively(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursively(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
    }
}

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
    },
  });
//  win.webContents.openDevTools();
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

//app.on('before-quit', (event) => {
//    deleteFolderRecursively(tempPath);
//    console.log(`Folder deleted on app quit: ${tempPath}`);
//});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

const pythonExecutablePath = path.join(process.resourcesPath, 'python_script');
const pythonScriptPath = path.join(__dirname, 'python_script.py');
//const pythonExecutablePath = path.join(__dirname, 'resources/python_script');
const pythonInterpreter = path.join(__dirname, "pm_venv/bin/python");

console.log('Main process starting...');


ipcMain.on('load-paths', (event, selectedDirectory, fileCount) => {
//    const pythonScriptPath = path.join(__dirname, 'python_script.py');



    try {
        console.log("Python Executable Path:", pythonExecutablePath);
        const pythonProcess = spawn(pythonExecutablePath, [selectedDirectory, fileCount]);
//        const pythonProcess = spawn(pythonInterpreter, [pythonScriptPath, directoryPath, tempPath, fileCount], { env: process.env });
        console.log('python process spawned')
        pythonProcess.stdout.on('data', (data) => {
            console.log(data)
            try {
                const jsonData = JSON.parse(data);
                if (jsonData.progress !== undefined) {
                    console.log(`data:${jsonData.progress}`)
                    win.webContents.send("update-progress", jsonData.progress);
                } else if (jsonData.paths) {
                    win.webContents.send("paths-data", jsonData.paths);
                }
            } catch (parseError) {
                console.error(`Error parsing JSON data: ${parseError}`);
                console.log(`${data}`)
            }
        });

    } catch (error) {
        console.error(`Error spawning Python process: ${error}`);
    }
});


// Custom console.log
function customLog(...args) {
  // Send the log message to the renderer process
  if (win && win.webContents) {
    win.webContents.send('console-log', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
  }
}



//function convertMovToMp4(inputPath, outputPath) {
//    ffmpeg(inputPath)
//        .format('mp4')
//        .on('end', () => {
//            console.log('Conversion finished.');
//        })
//        .on('error', (err) => {
//            console.error('Error:', err);
//        })
//        .save(outputPath);
//}

//convertMovToMp4('path/to/input.mov', 'path/to/output.mp4');


ipcMain.on('copy-marked-files', (event, selectedFiles, destinationDirectory) => {
    console.log(`Received request to copy files: ${selectedFiles} to ${destinationDirectory}`);

    // Ensure that the destination directory is the one passed from the renderer process
    // and not hardcoded or overwritten.

    try {
        // Ensure the destination directory exists
        if (!fs.existsSync(destinationDirectory)) {
            fs.mkdirSync(destinationDirectory, { recursive: true });
        }

        // Copy each file to the destination directory
        selectedFiles.forEach(sourcePath => {
            const fileName = path.basename(sourcePath);
            const destinationPath = path.join(destinationDirectory, fileName);
            fs.copyFileSync(sourcePath, destinationPath);
            console.log(`copied ${fileName} to ${destinationPath}`);
        });

        // Notify the renderer process that the copy operation is done
        event.reply('files-copied-successfully');
    } catch (error) {
        console.error("Error copying files:", error);
        event.reply('files-copy-failed', error.message); // Send back the error message to the renderer
    }
});


//msiexec /i F:\Dropbox\_Programming\PHOTO_MGMT\release-builds\installer64\PhotoMgmt-1.0.0-setup.msi /L*V "F:\Dropbox\_Programming\PHOTO_MGMT\release-builds\installer64\install.log"
