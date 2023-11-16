const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os')

const originalConsoleLog = console.log;
const desktopPath = path.join(__dirname, 'Desktop')
console.log = (...args) => {
    originalConsoleLog(...args);

    // Send log to renderer process
    let win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.webContents.send('log', ...args);
    }
};

let pythonExecutable;

switch (process.platform) {
    case 'win32':
        // On Windows, you might specify a path to the Python executable in a virtual environment
        pythonExecutable = path.join(__dirname, 'w_venv', 'Scripts', 'python.exe');
        break;
    case 'darwin':
        // On macOS, the Python path would be different, or you could rely on the environment's Python
        pythonExecutable = path.join(__dirname, 'm_venv', 'bin', 'python');


        break;
}
console.log("Python Executable Path:", pythonExecutable);


let win;
const tempPath = path.join(os.tmpdir(), 'temp');
if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
}



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
//      webSecurity: false,
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

app.on('before-quit', (event) => {
    deleteFolderRecursively(tempPath);
    console.log(`Folder deleted on app quit: ${tempPath}`);
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

ipcMain.on('load-paths', (event, directory) => {
    const pythonScriptPath = path.join(__dirname, 'python_script.py');

    try {
        const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, directory, tempPath], { env: process.env });
        let accumulatedData = '';
        let json_lines = '';
        pythonProcess.stdout.on('data', (data) => {
            accumulatedData += data.toString();
            let lines = accumulatedData.split('\n');
            accumulatedData = lines.pop(); // Handle last incomplete line

            lines.forEach((line) => {
                if (line.startsWith("PROGRESS")) {
                    const fileCount = line.split("=")[1].trim(); // Assuming space delimiter
                    console.log(`line: ${fileCount}`);
                    win.webContents.send("update-file-count", fileCount);
                } else {
                    console.log(`${line}`)
                    json_lines += line;
                }
            });
         try {
            const pathsDataFromPython = JSON.parse(json_lines);

            win.webContents.send("paths-data", pathsDataFromPython);
        } catch (parseError) {
            console.error(`Error parsing JSON data: ${parseError}`);
        }

        });
    } catch (error) {
        console.error(`Error spawning Python process: ${error}`);
    }

});
//    pythonProcess.stderr.on('data', (data) => {
//        console.error("stderr:", data.toString());
//    });
//    pythonProcess.on('error', (error) => {
//        console.error('Error spawning Python process:', error);
//    });
//    pythonProcess.on('close', (code) => {
//        if (code === 0) {
//            console.log('Python process exited successfully.');
//        } else {
//            console.error(`Python process exited with code ${code}`);
//        }
//    });
//    } catch (error) {
//        console.error('Failed to spawn Python process:', error);
//    }
//});

ipcMain.on('request-json-data',  (event) => {
    console.log('json requested')
    event.reply('send-json-data', jsonData);
    });


ipcMain.on('copy-marked-files', (event, selectedFiles, destinationDirectory) => {
    console.log(`Received request to copy files: ${selectedFiles} to ${destinationDirectory}`);
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


