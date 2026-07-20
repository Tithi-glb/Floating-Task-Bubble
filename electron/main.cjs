const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    transparent: true,
    frame: false,
    alwaysOnTop: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      backgroundThrottling: false,
    },
  });

  mainWindow.loadURL("http://localhost:5173/dashboard?desktop=true");
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  app.setAppUserModelId("Floating Task Bubble");
  createWindow();

  globalShortcut.register("Control+Shift+B", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
});