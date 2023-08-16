const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { runLinkedInEmailSender, stopExecution } = require("./index.js");

const isMac = process.platform === "darwin";
const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "LinkedIn Email Sender",
    width: 900,
    height: 700,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

let blackListData = [];
let emails = [];

function readBlackListData() {
  const jsonPath = path.join(__dirname, "blacklist.json");
  try {
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    blackListData = JSON.parse(jsonData);
  } catch (error) {
    console.error("An error occurred while reading blacklist data:", error);
  }
}

function getEnvFileContent() {
  const envPath = path.join(__dirname, ".env");
  try {
    const envData = fs.readFileSync(envPath, "utf-8");
    return envData;
  } catch (error) {
    console.error("An error occurred while reading the env file:", error);
  }
}

app.whenReady().then(() => {
  readBlackListData();
  createMainWindow();

  ipcMain.handle("getEnvFileContent", (event) => {
    return getEnvFileContent();
  });

  ipcMain.handle("getBlacklistData", (event) => {
    return blackListData;
  });

  ipcMain.handle("start", async (event, formData) => {
    try {
      const emailsToSend = await runLinkedInEmailSender(formData);

      mainWindow.webContents.send("emailsToSend", emailsToSend);

      stopExecution();
    } catch (error) {
      console.error("Error during email sending:", error);
    }
  });

  ipcMain.handle("writeToEnvFile", async (event, content) => {
    try {
      await fs.promises.writeFile("./.env", content);
      return true;
    } catch (error) {
      console.error("An error occurred while writing to the env file:", error);
      return false;
    }
  });

  ipcMain.handle("stop", async (event) => {
    stopExecution();
  });

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

const menu = [
  {
    label: "File",
    submenu: [
      {
        label: "Quit",
        accelerator: "CmdOrCtrl+W",
        click: () => app.quit(),
      },
    ],
  },
];

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
