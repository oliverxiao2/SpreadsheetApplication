const path = require('path');
const { app, shell, BrowserWindow } = require('electron');
const Common = require('../common/common');
const UpdateHandler = require('../common/autoUpdate');

class MainWindow {
    constructor () {
        this.isShown = false;
        this.createWindow();
    }

    createWindow () {
        this.mainWindow = new BrowserWindow({
            title: Common.ELECTRONIC_WECHAT,
            resizable: true,
            center: true,
            show: false,
            frame: true,
            transparent: false,
            autoHideMenuBar: true,
            icon: path.join(__dirname, '../../../assets/icon.png'),
            titleBarStyle: 'hidden-inset',
            webPreferences: {
              javascript: true,
              plugins: true,
              nodeIntegration: true,
              webSecurity: false,
              //preload: path.join(__dirname, '../../inject/preload.js'),
            },
        });

        this.mainWindow.loadURL(`file://${path.join(__dirname, '/../../views/mainWindow.html')}`);
    }

    show() {
        this.mainWindow.show();
        this.isShown = true;
    }
    
    hide() {
        this.mainWindow.hide();
        this.isShown = false;
    }
}

module.exports = MainWindow;

