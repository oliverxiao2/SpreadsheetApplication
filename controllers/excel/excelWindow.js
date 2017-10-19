const path = require('path');
const {BrowserWindow} = require('electron');
const Common = require('../common/common');

class ExcelWindow {
    constructor () {
        this.excelWindow = new BrowserWindow ({
            center: true,
            show: true,
            frame: true,
            autoHideMenuBar: true,
            titleBarStyle: 'hidden',
            title: 'Excel Window',
            icon: '',
        });

        this.excelWindow.loadURL(`file://${path.join(__dirname, '/../../views/excelWindow.html')}`);
        this.isShown = false;
    }

    show() {
        this.excelWindow.show();
        this.isShown = true;
    }
    
    hide() {
        this.excelWindow.hide();
        this.isShown = false;
    }

    close() {
        this.excelWindow.close();
    }
}

module.exports = ExcelWindow;