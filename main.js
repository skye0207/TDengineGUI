const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 880,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('./renderer/index.html')
}

app.whenReady().then(createWindow)



