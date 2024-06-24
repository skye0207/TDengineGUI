const { app, BrowserWindow } = require('electron')

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const Store = require('electron-store');
Store.initRenderer();

function createWindow () {
  const win = new BrowserWindow({
    autoHideMenuBar: true,
    width: 1200,
    height: 900,
    // show: false, //关闭窗口显示
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('./renderer/index.html')
  // win.maximize() //设置最大化
  // win.show() //手动显示窗口

  //打开调试窗口
  // win.webContents.openDevTools()
}

app.whenReady().then(createWindow)
