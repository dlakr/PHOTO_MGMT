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


app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});


const pythonScriptPath = path.join(process.resourcesPath, 'python_script.py');
const pythonInterpreter = path.join(process.resourcesPath, 'pm_venv/bin/python')

//const pythonScriptPath = path.join(__dirname, 'python_script.py');
////const pythonExecutablePath = path.join(__dirname, 'resources/python_script/python_script');
//const pythonInterpreter = path.join("/Users/davidlaquerre/m_venv/bin/python");



console.log('Main process starting...');


ipcMain.on('load-paths', (event, selectedDirectory, fileCount) => {
//    const pythonScriptPath = path.join(__dirname, 'python_script.py');
// Assuming pythonExecutablePath, pythonInterpreter, pythonScriptPath, selectedDirectory, fileCount, and win are defined appropriately
    win.reload();
    try {
//        console.log("Python Executable Path:", pythonInterpreter);
//        console.log("Python script:", pythonInterpreter);
        const pythonProcess = spawn(pythonInterpreter, [pythonScriptPath, selectedDirectory, fileCount], { env: process.env });
//        const pythonProcess = spawn(pythonExecutablePath, [selectedDirectory, fileCount])
        console.log('Python process spawned');

        let buffer = '';
        pythonProcess.stdout.on('data', (data) => {
            buffer += data.toString();  // Accumulate data in the buffer

            // Try to find a complete JSON object
            let boundary = buffer.indexOf('\n'); // Assuming each JSON object ends with a newline
            while (boundary !== -1) {
                const jsonStr = buffer.substring(0, boundary).trim();
                buffer = buffer.substring(boundary + 1); // Remove processed part from the buffer

                try {
                    if (jsonStr) {
                        const jsonData = JSON.parse(jsonStr);  // Parse the JSON string
                        if (jsonData.progress !== undefined) {
                            console.log(`data:${jsonData.progress}`);
                            win.webContents.send("update-progress", jsonData.progress);
                        } else if (jsonData.paths) {
                            win.webContents.send("paths-data", jsonData.paths);
                        } else if (jsonData.finished) {
                            dialog.showMessageBox(win, {
                                type: 'info',
                                title: 'Scan Complete',
                                message: 'All paths have been scanned.',
                                buttons: ['OK']
                            });
                        }

                    }
                } catch (parseError) {
                    console.error(`Error parsing JSON data: ${parseError} - ${jsonStr}`);
                }
                boundary = buffer.indexOf('\n'); // Check for the next JSON object
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

