/*
    Attention!
    SC_DFC_CTLDISBLLAYOUT_SY effects on the label of ctlmsk and disblmsk
*/
const DFCNamingRules = {
    DFES_Cls: [{
        prefix: 'DFES_Cls.DFC_',
        suffix: '_C'
    }],
    DisblMsk: [{
        prefix: 'DFC_DisblMsk.DFC_',
        suffix: '_C'
    }],
    CtlMsk: [{
        prefix: 'DFC_CtlMsk.DFC_',
        suffix: '_C',
    },{
        prefix: 'DFC_CtlMsk2.DFC_',
        suffix: '_C',
    }],
    DTCO: [{
        prefix: 'DFES_DTCO.DFC_',
        suffix: '_C'
    }],
    FaultTyp: [{
        prefix: 'DFES_FaultTyp.DFC_',
        suffix: '_C'
    }],

};

function getDFCTable (a2l) {
    const c = a2l.CHARACTERISTIC;
    const p = a2l.getPlatform();
}

function getDFCTable (_a2lDataset) {
    const a = _a2lDataset,
          c = a.CHARACTERISTIC,
          output = {};
    let record, recordname;
    for (const rule of DFCNamingRules['DFES_Cls']) {
        const DFESClsList = a.getCHAR(new RegExp(rule.prefix));
        if (DFESClsList.length === 0) continue;

        for (const DFESCls of DFESClsList) {
            record = {
                name: '', // true name
                DFESCls: 0,
                DisblMsk: 0,
                CtlMsk: 0,
                DTCO: 'P0000',
                FaultTyp: '00',
                labelnames: {},
            };

            recordname      = DFESCls.name.match(new RegExp(rule.prefix + '([\\w]+)' + rule.suffix))[1]
            record.name     = recordname; 
            
            const _disblMsk = getLabelOfDFCRelated(a, recordname, 'DisblMsk'),
                  _ctlMsk   = getLabelOfDFCRelated(a, recordname, 'CtlMsk'),
                  _DTCO     = getLabelOfDFCRelated(a, recordname, 'DTCO'),
                  _faultTyp = getLabelOfDFCRelated(a, recordname, 'FaultTyp');

            record.DFESCls  = parseInt(DFESCls.phyDec);
            record.DisblMsk = parseInt(_disblMsk.v);
            record.CtlMsk   = parseInt(_ctlMsk.v);
            record.DTCO     = calcDTCO(parseInt(_DTCO.v));
            record.FaultTyp = calcFaultTyp(parseInt(_faultTyp.v));
            record.labelnames = {
                DFESCls: DFESCls.name,
                DisblMsk: _disblMsk.k,
                CtlMsk: _ctlMsk.k,
                DTCO: _DTCO.k,
                FaultTyp: _faultTyp.k,
            }

            recordname      = recordname.toUpperCase();
            output[recordname]= record;
        }
    } 
    return output;
};

function getLabelOfDFCRelated (a2l, _DFCname, _labelname) {
    try {
        const _allChars = a2l.CHARACTERISTIC;
        const _CDLayout = a2l.getSC('DFC_CTLDISBLLAYOUT_SY');
    	if (_labelname === 'DisblMsk' && _CDLayout === 1) {
            const theChar = _allChars['DFC_DisblMsk2_C'];
            if (theChar) return {
                k: 'DFC_DisblMsk2_C',
                v: theChar.phyDec,
            }
        }
        
        for (const rule of DFCNamingRules[_labelname]) {
            const k = rule.prefix + _DFCname + rule.suffix;
            const theChar = _allChars[k];
            if (theChar) return {
                k: k,
                v: theChar.phyDec,
            }
        }
        
        return;
    } catch (e) {
        console.log(e)
    }
};

function calcDTCO (int) {
    if (typeof int === 'number'){
        // 1234 => PXXXX
        if (int >= 0 && int < 0x10000) {
            const hexStr = (int + 0x10000).toString(16);
            const i = parseInt(hexStr[1], 16);
        
            if (i <= 0x3) {
                return 'P' + (int - 0x0000 + 0x10000).toString(16).substr(1).toUpperCase();
            } else if (i <= 0x7) {
                return 'C' + (int - 0x4000 + 0x10000).toString(16).substr(1).toUpperCase();
            } else if (i <= 0xB) {
                return 'B' + (int - 0x8000 + 0x10000).toString(16).substr(1).toUpperCase();
            } else {
                return 'U' + (int - 0xC000 + 0x10000).toString(16).substr(1).toUpperCase();
            }
        }
        
        return '-';
    } else if (typeof int === 'string') {
        const I = int[0].toUpperCase();
        let k;
        if (I === 'P') k = 0;
        else if (I === 'C') k = 0x4000;
        else if (I === 'B') k = 0x8000;
        else if (I === 'U') k = 0xC000;

        return (k + parseInt('0x' + int.substr(1)));
    }   
};


function calcFaultTyp (int) {
    if (int < 0x100 && int >= 0) {
        return (int+0x100).toString(16).substr(1).toUpperCase();
    } else return '--';
    
};

module.exports = {
    getDFCTable,
    calcDTCO,
    calcFaultTyp,
}