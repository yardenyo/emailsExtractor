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
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, "utf-8");
      if (data) {
        blackListData = JSON.parse(data);
      } else {
        fs.writeFileSync(jsonPath, "[]");
      }
    } else {
      fs.writeFileSync(jsonPath, "[]");
    }
  } catch (error) {
    console.error("An error occurred while reading the blacklist file:", error);
  }
}

function getEnvFileContent() {
  const envFilePath = path.join(__dirname, ".env");
  try {
    if (fs.existsSync(envFilePath)) {
      const envFileData = fs.readFileSync(envFilePath, "utf-8");
      if (envFileData) {
        return envFileData;
      } else {
        return "";
      }
    } else {
      return "";
    }
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

  ipcMain.handle("getEmailFileContent", (event) => {
    const emailContentPath = path.join(__dirname, "emailContent.json");
    if (fs.existsSync(emailContentPath)) {
      const emailContentData = fs.readFileSync(emailContentPath, "utf-8");
      return emailContentData;
    } else {
      return [];
    }
  });

  ipcMain.handle("getBlacklistData", (event) => {
    return blackListData;
  });

  ipcMain.handle("start", async (event, formData) => {
    try {
      const emailsToSend = await runLinkedInEmailSender(formData);

      await mainWindow.webContents.send("emailsToSend", emailsToSend);

      await mainWindow.webContents.send("stopProcess");

      // stopExecution();
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

  ipcMain.handle("writeToEmailContentFile", async (event, content) => {
    try {
      await fs.promises.writeFile(
        "./emailContent.json",
        JSON.stringify(content)
      );
      return true;
    } catch (error) {
      console.error(
        "An error occurred while writing to the email content file:",
        error
      );
      return false;
    }
  });

  ipcMain.handle("uploadCV", async (event, cvData) => {
    const cvName = cvData.name;
    const cvPath = cvData.path;
    const attachmentsFolderPath = path.join(__dirname, "attachments");
    const destinationPath = path.join(attachmentsFolderPath, cvName);

    try {
      await fs.promises.copyFile(cvPath, destinationPath);

      return {
        returnedCVName: cvName,
        returnedCVPath: `./attachments/${cvName}`,
      };
    } catch (error) {
      return { returnedCVName: "", returnedCVPath: "" };
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
