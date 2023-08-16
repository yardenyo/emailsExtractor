const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel, data) => {
      return ipcRenderer.invoke(channel, data);
    },
    send: (channel, data) => {
      return ipcRenderer.send(channel, data);
    },
    on: (channel, callback) => {
      return ipcRenderer.on(channel, callback);
    },
  },
});
