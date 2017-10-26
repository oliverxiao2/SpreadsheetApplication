const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const SplashWindow = require('../controllers/splash/splash');
const MainWindow = require('../controllers/home/mainWindow');
const ExcelWindow = require('../controllers/excel/excelWindow');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

class DSMer {
  constructor() {
    this.splashWindow = null;
    this.mainWindow = null;
  }

  init () {
    this.initApp();
    this.initIPC();
  }

  initApp () {
    app.on('ready', () => {
      this.createSplashWindow();
      this.createMainWindow();
    });
  }

  initIPC() {
    ipcMain.on('mainWindow-load-complete', (event, param) => {
      this.splashWindow.hide();
      this.mainWindow.show();
    });

    ipcMain.on('open-a2l', (event, param) => {
      dialog.showOpenDialog({
        properties: ['openFiles'],
        filters: [{name: 'A2L', extensions: ['a2l']}], 
        }, function (files){
          if (files) event.sender.send('selected-a2l', files)
        });
    });

    ipcMain.on('select-save-dir', (event, param) => {
      dialog.showSaveDialog({
        filters: param.filters,
      }, function (files) {
        if (files) event.sender.send('selected-dir-to-save', files);
      });
    })

    ipcMain.on('open-hex', (event, param) => {
      dialog.showOpenDialog({
        properties: ['openFiles'],
        filters: [{name: 'HEX', extensions: ['hex']}], 
        }, (files) => {
          if (files) event.sender.send('selected-hex', files);
          else event.sender.send('cancel');
        });
    });

    ipcMain.on('open-files', (event, param) => {
      dialog.showOpenDialog({
        properties: ['openFiles', param.multiSelections?'multiSelections':''],
        filters: param.filters,
      }, (files) => {
        if (files) event.sender.send('open-files-selected', files);
      })
    })

    ipcMain.on('open-new-excel-window', (event, param) => {
      this.createExcelWindow(param);
      console.log(param);
      console.log(param.name);
      event.sender.send('create-new-excel-window-success', param);
    });
  }

  createSplashWindow () {
    this.splashWindow = new SplashWindow();
  }

  createMainWindow () {
    this.mainWindow = new MainWindow();
  }

  createExcelWindow (file) {
    new ExcelWindow(file);
  }
}

(new DSMer).init();
