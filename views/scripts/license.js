//Please provide valid license key.
//GC.Spread.Sheets.LicenseKey = "Your key";
function license () {
    const fs = require('fs');
    const licensePath = __dirname + '/../../license.txt'; // <-- included in ~/views/mainWindow.html
    
    if (fs.existsSync(licensePath)) {
        const text = fs.readFileSync(licensePath, 'utf-8');
        return (text);
    }
};

module.exports = license ();