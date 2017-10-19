/**********************************************************************************
* 使用正则表达式
* CHARACTERISTIC 16000+个结果，16ms
* MEASUREMENT 14000+个结果，12ms
*
*
***********************************************************************************/



class A2L {
	constructor (a2lFilePath) {
	  this.path = a2lFilePath;    
  };

  load (path) {
    path = path || this.path || '';
    if (!path) return;
    const text = require('fs').readFileSync(path, 'utf-8');
    
    if (!text) return;
    const a2l = this;
    const tags = [{
      name: 'CHARACTERISTIC',
      handler: generalHandler,
      definition: {
          '1': 'name',
          '2': 'description',
          '3': 'charType',
          '4': 'address',
          '5': 'recordLayout',
          '6': 'maxDiff',
          '7': 'conversion',
          '8': 'lowerLimit',
          '9': 'upperLimit'
      },
      childDef: [{
          name: 'AXIS_DESCR',
          handler: generalHandler,
          definition: {
              '1': 'axisType',
              '2': 'inputQuantity',
              '3': 'conversion',
              '4': 'maxAxisPoints',
              '5': 'lowerLimit',
              '6': 'upperLimit'
          }
        }]
      },{
        name: 'MEASUREMENT',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'dataType',
            '4': 'conversion',
            '5': 'resolution',
            '6': 'accuracy',
            '7': 'lowerLimit',
            '8': 'upperLimit'
        }
      },{
        name: 'RECORD_LAYOUT',
        handler: generalHandler,
        definition: {
          '1': 'name'
        }
      },{
        name: 'COMPU_METHOD',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'conversion',
            '4': 'format',
            '5': 'unit'
        }
      },{
        name: 'COMPU_VTAB',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'conversion',
            '4': 'count'
        }
      },{
        name: 'COMPU_TAB',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'conversion',
            '4': 'count'
        }
      },{
        name: 'FUNCTION',
        handler: generalHandler,
        definition: {
          '1': 'name',
          '2': 'description'
        },
        childDef: [{
          name: 'DEF_CHARACTERISTIC',
          handler: labelsHandler
        },{
          name: 'IN_MEASUREMENT',
          handler: labelsHandler
        },{
          name: 'OUT_MEASUREMENT',
          handler: labelsHandler
        },{
          name: 'LOC_MEASUREMENT',
          handler: labelsHandler
        }] 
      },{
        name: 'AXIS_PTS',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'address',
            '4': 'inputQuantity',
            '5': 'recordLayout',
            '6': 'maxDiff',
            '7': 'conversion',
            '8': 'maxAxisPoints',
            '9': 'lowerLimit',
            '10': 'upperLimit'
        }
      },{
        name: 'MOD_COMMON',
        handler: generalHandler,
        definition: {
          '1': 'name',
        }
      },{
        name: 'MOD_PAR',
        handler: generalHandler,
        definition: {
          '1': 'name',
        },
        removes: ['SYSTEM_CONSTANT'],
        childDef: [{
            name: 'MEMORY_SEGMENT',
            handler: doNothing
        }, {
            name: 'CALIBRATION_METHOD',
            handler: doNothing
        }]
      }
    ];

    
    for (const [i, tag] of tags.entries()) {
      a2l[tag.name] = {};
  
      setTimeout(() => {               
        const result = text.match(getRegExpByTag(tag.name));
        if (result) {
          let item = '';
          const n = result.length;
          for (let i = 0; i < n; i++) {
              item = result[i]; 
              if (tag.removes)  tag.removes.map((str) => { item = item.replace(new RegExp(str, 'g'), '')}) 
              tag.handler(a2l[tag.name], tag.name, item, tag.definition, tag.childDef);
          }
        }   
      });
    }


    function getRegExpByTag (tag) {
      return new RegExp('/begin\\s+' + tag + '([\\s\\S]*?)' + '/end\\s+' + tag, 'g');
    };

    function removeBeginAndEnd (text, tag) {
      const reg1 = new RegExp('/begin\\s+' + tag, 'i');
      const reg2 = new RegExp('/end\\s+' + tag, 'i');

      return text.replace(reg1, '').replace(reg2, '');
    }
   
    function generalHandler (obj, tag, text, rowDef, childDef) {
      text = removeBeginAndEnd(text, tag);
      let row, k = 0, record, recordname, spaceIndex, extraFieldname, extraFieldValue, temp = {};  
      
      // 先拣选出已定义的childDef
      if (childDef) {
        for (const def of childDef) {

          temp[def.name] = [];
          text = text.replace(getRegExpByTag(def.name), function (child) {
            child = removeBeginAndEnd(child, def.name).trim();
            temp[def.name][temp[def.name].length] = {};
            def.handler(temp[def.name][temp[def.name].length - 1], def.name, child, def.definition);
            return '';
          });

          if (temp[def.name].length === 0) delete temp[def.name];
          
        }
      }

      // 移除可能存在的未定义的children nodes
      text = text.replace(/\/begin[\s\S]*?\/end\s[\w]+\b/g, '');

      // 根据row definition来拣选
      if (rowDef) {
        record = rowsToObj(text, rowDef); 
        if (rowDef['1'] === 'name') recordname = record.name;
      }
  
      if (recordname === undefined) Object.assign(obj, record);
      else obj[recordname] = Object.assign(record, temp);

      function rowsToObj (text, rowDef) {
        // pure text means without subnodes in it
        const record = {};
        const rows = text.trim().split('\n');
        let k = 0, spaceIndex;
        
        for (let i = 0; i < rows.length; i++) {
            row = rows[i].trim();
            if (row.length === 0) continue;
            else k++;
      
            if (rowDef[k] != undefined) record[rowDef[k]] = row;         
            else {
              spaceIndex = row.search(/\s/); // <-- first blank space
              if (spaceIndex === -1) record[row] = row;
              else {
                  extraFieldname  = row.substr(0, spaceIndex);
                  extraFieldValue = row.substr(spaceIndex).trim();
                  record[extraFieldname] = extraFieldValue; 
              }
            }
        }
      
        return record;
      };
    };

    function functionHandler () {

    };
  
    function labelsHandler (obj, tag, text) {
      text = removeBeginAndEnd(text, tag);

      obj['children'] = text.split(/\s+/);
      
    };

    function doNothing () {};
  };

  getNode (label, rootNode = this) {
    if (!label) return;
    let self = rootNode, RV = null, found = false, i = 0;
    
    (function recursion(obj){
      for (const key in obj){
        if (found) return null;
        else {
          i++ ;

          if (i < Infinity){
            if (key == label) {
              found = true;
              return RV = obj[key];
            } else if (key != 'parent' && typeof(obj[key]) == 'object') {
              recursion(obj[key]);
            }
          } else {
            // too many times of recursion! Stop!
            console.log('Warning: Times of recursion too big! Stopped!')
            return null;
          }
        }

      }
    }).call(null, self);

    return RV;
  };

  getByteOrder () {
    return this.BYTE_ORDER = this.getNode('BYTE_ORDER', this['MOD_COMMON']);
  };

  readCHAR (theCHAR) {
    let returnValue = null;

    const $hex           = this.hexData;
    const $byte_order    = this.BYTE_ORDER || this.getByteOrder();
    const $COMPU_METHOD  = this.COMPU_METHOD;
    const $RECORD_LAYOUT = this.RECORD_LAYOUT;
    const $VTabs         = this.COMPU_VTAB;
    const $Tabs          = this.COMPU_TAB;

    if ($hex && $byte_order){
      if (theCHAR == undefined){ // read all
        let CHARs = this.CHARACTERISTIC;

        if (CHARs){
          for (const name in CHARs){
            if (CHARs[name].phyDec === undefined) read(CHARs[name], this);
          }
          returnValue =  CHARs;
        }
      }
      else{ // read the specific CHARACTERISTIC
        if (theCHAR.constructor.name === 'String') theCHAR = this.getCHAR(theCHAR);
        read(theCHAR, this);
        returnValue =  theCHAR;
      }

      return returnValue;
    }
    return null;

    // sub functions begin
    function splitAddress(address = ''){
      if (address && typeof address === 'string'){
        let len = address.length;
        if (len >= 7 && len <= 10){
          let blockAddr = address.substr(2, len - 6),
              dataAddr  = parseInt('0x' + address.substr(len - 4));

          while (blockAddr.length < 4) {
            blockAddr  = '0' + blockAddr;
          }

          return [blockAddr, dataAddr];
        } else return ['', NaN];
      }
    };

    function getBytes(str){
      if (!str) return;
      else if (str.match('UBYTE')) return [1, false];
      else if (str.match('SBYTE')) return [1, true];
      else if (str.match('UWORD')) return [2, false];
      else if (str.match('SWORD')) return [2, true];
      else if (str.match('ULONG')) return [4, false];
      else if (str.match('SLONG')) return [4, true];
      else if (str.match('A_UINT64')) return [8, false];
      else if (str.match('A_INT64')) return [8, true];
      else if (str.match('FLOAT32_IEEE')) return [4, true];
      else if (str.match('FLOAT64_IEEE')) return [8, true];
    };

    function convertRaw2Phy(rawHex, convObj, format){
      let rawDec   = parseInt(rawHex),
          convType = convObj.conversion,
          coeffs   = '',
          tabRef   = '',
          n;  // 格式化数字时的小数位数
      if (format) {
        const tokens = format.split('.');
        if (tokens.length > 1) n = parseInt(tokens[1]);
      }
      switch (convType) {
        case 'RAT_FUNC':
          coeffs = convObj.COEFFS.split(/\s/);
          if ((coeffs[0] - coeffs[3] * rawDec) === 0){
            return ( (coeffs[5]*rawDec - coeffs[2]) / (coeffs[1] - coeffs[4]*rawDec) ).toFixed(n);
          }
          break;
        case "TAB_VERB":
          tabRef = convObj['COMPU_TAB_REF'];
          if (tabRef){
            return $VTabs[tabRef]['' + rawDec];
          }
          break;
        default: //"TAB_INTP", "TAB_NOINTP"
          tabRef = convObj['COMPU_TAB_REF'];
          if (tabRef){
            return $Tabs[tabRef]['' + rawDec];
          }
          break;
      }

      return NaN;
    };

    // rawHex = "07A3", not "0x07A3"
    function adjustByteOrder(rawHex, byte_order, signed){
      if (rawHex){
        if (rawHex.length % 2 === 0){
          let bytes = rawHex.length / 2,
              newRawHex = '',
              newRawDec = 0;

          if (byte_order === 'MSB_LAST'){
            for (let i=0; i<bytes; i++){
              newRawHex = rawHex.substr(i*2, 2) + newRawHex;
            }
          }

          if (byte_order === 'MSB_FIRST') newRawHex = rawHex;

          newRawDec = parseInt('0x' + newRawHex);

          if (signed && newRawDec.toString(2).length == newRawHex.length*4){
            return newRawDec - (0x01 << (newRawHex.length*4));
          }

          return newRawDec;
        }
      }
    };

    function read(theCHAR, A2L){
      try {
        const address    = theCHAR.address;
        const charType   = theCHAR.charType;
        const format     = theCHAR.FORMAT; // 格式化数字
        const conversion = $COMPU_METHOD[theCHAR.conversion];
        //if (!conversion) {console.log(theCHAR); return null;}
        const unit       = conversion.unit;
        const layout     = $RECORD_LAYOUT[theCHAR.recordLayout];
  
  
        let [blockAddr, dataAddr] = splitAddress(address);
  
        if (blockAddr && dataAddr){
          let theDataBlock = $hex.dataBlock[blockAddr],
              offset       = 0,
              rawHex       = '',
              rawHex2      = '',
              rawHex3      = '',

              AXIS_DESCR   = null,

              bytesOfValue = 0,
              ptsOfValue   = 0,
              valueSigned  = false,
  
              bytesOfXPts  = 0,
              XPtsSigned   = false,
              bytesOfXAxis = 0,
              ptsOfXAxis   = 0,
              XAxisSigned  = false,
  
              bytesOfYPts  = 0,
              YPtsSigned   = false,
              bytesOfYAxis = 0,
              ptsOfYAxis   = 0,
              YAxisSigned  = false,
  
              adjustedRawDec  = NaN,
              adjustedRawDec2 = NaN,
              adjustedRawDec3 = NaN;
  
          switch (charType) {
            case 'VALUE':
              offset = dataAddr * 2;
              [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
              rawHex = theDataBlock.substr(offset, bytesOfValue * 2);
              adjustedRawDec = adjustByteOrder(rawHex, $byte_order, valueSigned);
              theCHAR.rawHex = '0x' + rawHex;
              theCHAR.cvtDec = adjustedRawDec;
              theCHAR.phyDec = convertRaw2Phy(adjustedRawDec, conversion, format);
              theCHAR.byteOffset = dataAddr; // 为写入HEX方便地址查找
              break;
            case "VAL_BLK":
              ptsOfValue = theCHAR.NUMBER;
              offset = dataAddr * 2;
              [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
              if (ptsOfValue > 0){
                theCHAR.rawHex = [];
                theCHAR.cvtDec = [];
                theCHAR.phyDec = [];
                theCHAR.byteOffset = [];
  
                for (let i = 0; i<ptsOfValue; i++){
                  rawHex = theDataBlock.substr(offset + i * bytesOfValue * 2, bytesOfValue * 2);
                  adjustedRawDec = adjustByteOrder(rawHex, $byte_order, valueSigned);
                  theCHAR.rawHex.push('0x' + rawHex);
                  theCHAR.cvtDec.push(adjustedRawDec);
                  theCHAR.phyDec.push(convertRaw2Phy(adjustedRawDec, conversion, format));
                  theCHAR.byteOffset.push(dataAddr + i * bytesOfValue);
                }
              }
              break;
            case "CURVE":
              AXIS_DESCR = theCHAR.AXIS_DESCR;
              const axisObj = AXIS_DESCR?AXIS_DESCR[0]:null;
              if (axisObj){
                theCHAR.rawHex = {x:[], value:[]};
                theCHAR.cvtDec = {x:[], value:[]};
                theCHAR.phyDec = {x:[], value:[]};
                theCHAR.byteOffset = {x:[], value:[]};
  
                const formatAxis = axisObj.FORMAT;
                const conversionAxis = $COMPU_METHOD[axisObj.conversion];
  
                offset = dataAddr * 2;
  
                ptsOfValue = parseInt(axisObj.maxAxisPoints);
                [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
                [bytesOfXPts,  XPtsSigned ] = layout.NO_AXIS_PTS_X?getBytes(layout.NO_AXIS_PTS_X):[bytesOfValue, valueSigned];
                [bytesOfXAxis, XAxisSigned] = layout.AXIS_PTS_X?getBytes(layout.AXIS_PTS_X):[bytesOfValue, valueSigned];
  
                for (var i = 0; i < ptsOfValue; i++) {
                  // rawHex : X Axis
                  // rawHex2: Value
                  rawHex = theDataBlock.substr(offset + (i * bytesOfXAxis + bytesOfXPts) * 2, bytesOfXAxis * 2);
                  adjustedRawDec = adjustByteOrder(rawHex, $byte_order, XAxisSigned);
  
                  rawHex2= theDataBlock.substr(offset + (i * bytesOfValue + bytesOfXPts + ptsOfValue * bytesOfXAxis) * 2, bytesOfValue * 2);
                  adjustedRawDec2 = adjustByteOrder(rawHex2, $byte_order, valueSigned);
  
                  theCHAR.rawHex.x.push('0x' + rawHex);
                  theCHAR.rawHex.value.push('0x' + rawHex2);
  
                  theCHAR.cvtDec.x.push(adjustedRawDec);
                  theCHAR.cvtDec.value.push(adjustedRawDec2);
  
                  theCHAR.phyDec.x.push(convertRaw2Phy(adjustedRawDec, conversionAxis, formatAxis));
                  theCHAR.phyDec.value.push(convertRaw2Phy(adjustedRawDec2, conversion, format));
  
                  theCHAR.byteOffset.x.push(dataAddr + bytesOfXPts + i * bytesOfXAxis);
                  theCHAR.byteOffset.value.push(dataAddr + bytesOfXPts + ptsOfValue * bytesOfXAxis + i * bytesOfValue);
                }
              }
              break;
            case "MAP":
              AXIS_DESCR = theCHAR.AXIS_DESCR;
              if (!(AXIS_DESCR && AXIS_DESCR.length === 2)) return;
              const axisObj1 = AXIS_DESCR[0],
                    axisObj2 = AXIS_DESCR[1];
              
              theCHAR.rawHex = {x:[], y:[], value:[]};
              theCHAR.cvtDec = {x:[], y:[], value:[]};
              theCHAR.phyDec = {x:[], y:[], value:[]};
              theCHAR.byteOffset = {x:[], y:[], value:[]};

              const formatAxisX = axisObj1.FORMAT,
                    formatAxisY = axisObj2.FORMAT;
              
              const conversionAxisX = $COMPU_METHOD[axisObj1.conversion],
                    conversionAxisY = $COMPU_METHOD[axisObj2.conversion];

              offset = dataAddr * 2;

              ptsOfXAxis = parseInt(axisObj1.maxAxisPoints);
              ptsOfYAxis = parseInt(axisObj2.maxAxisPoints);
              
              [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
              [bytesOfXPts,  XPtsSigned ] = getBytes(layout.NO_AXIS_PTS_X)||[bytesOfValue, valueSigned];
              [bytesOfXAxis, XAxisSigned] = getBytes(layout.AXIS_PTS_X)   ||[bytesOfValue, valueSigned];
              [bytesOfYPts,  YPtsSigned ] = getBytes(layout.NO_AXIS_PTS_Y)||[bytesOfXPts,  XPtsSigned ];
              [bytesOfYAxis, YAxisSigned] = getBytes(layout.AXIS_PTS_Y)   ||[bytesOfXPts,  XPtsSigned ];

              // rawHex : X Axis
              // rawHex2: Y Axis
              // rawHex3: Value
              const ptsOfXAxisFromHex = theDataBlock.substr(offset, bytesOfXPts * 2),
                    ptsOfYAxisFromHex = theDataBlock.substr(offset, bytesOfYPts * 2);

              offset += 2* (bytesOfXPts + bytesOfYPts);

              for (let i = 0; i < ptsOfXAxis; i++) {                
                rawHex = theDataBlock.substr(offset, 2 * bytesOfXAxis);
                adjustedRawDec = adjustByteOrder(rawHex, $byte_order, XAxisSigned);

                theCHAR.rawHex.x.push(rawHex);
                theCHAR.cvtDec.x.push(adjustedRawDec);
                theCHAR.phyDec.x.push(convertRaw2Phy(adjustedRawDec, conversionAxisX, formatAxisX));

                offset += 2 * bytesOfXAxis;
              }

              for (let i = 0; i < ptsOfYAxis; i++) {
                rawHex2 = theDataBlock.substr(offset, 2 * bytesOfYAxis);
                adjustedRawDec2 = adjustByteOrder(rawHex2, $byte_order, YAxisSigned);

                theCHAR.rawHex.y.push(rawHex2);
                theCHAR.cvtDec.y.push(adjustedRawDec2);
                theCHAR.phyDec.y.push(convertRaw2Phy(adjustedRawDec2, conversionAxisY, formatAxisY));

                offset += 2 * bytesOfYAxis;
              }

              for (let i = 0; i < ptsOfXAxis; i++) {
                const _temp1 = [], _temp2 = [], _temp3 = [];
                for (let j = 0; j < ptsOfYAxis; j++) {
                  rawHex3 = theDataBlock.substr(offset, 2 * bytesOfValue);
                  adjustedRawDec3 = adjustByteOrder(rawHex3, $byte_order, valueSigned);

                  _temp1.push(rawHex3);
                  _temp2.push(adjustedRawDec3);
                  _temp3.push(convertRaw2Phy(adjustedRawDec3, conversion, format));

                  offset += 2 * bytesOfValue;
                }
                theCHAR.rawHex.value.push(_temp1);
                theCHAR.cvtDec.value.push(_temp2);
                theCHAR.phyDec.value.push(_temp3);
              }
              break;
            default:
          }
  
          theCHAR.unit = unit;
  
          if (conversion.conversion === 'TAB_VERB' ) {
            theCHAR.optionsTable = $VTabs[conversion['COMPU_TAB_REF']];
          } else if (conversion.conversion === 'TAB_INTP' || conversion.conversion === 'TAB_NOINTP') {
            theCHAR.optionsTable = $Tabs[conversion['COMPU_TAB_REF']];
          }
        }
      } catch (e) {
        console.log(theCHAR, e);
      }
      
    }
  };

  getCHAR (exp) {
    let $char = this.CHARACTERISTIC;
    let $mode = '';

    if (typeof(exp) === 'object' && exp.exec) $mode = 'all';
    else if (typeof(exp) === 'string') $mode = 'single';
    else $mode = '';

    if (exp && $char){ // Ready? Go!
      let $char_names = Object.keys($char).sort();

      // str == RegExp object, fetch all matched CHARACTERISTIC
      if ($mode == 'all'){
        let output = [];
        for (const char_name of $char_names){
          if (char_name.match(exp)) output.push($char[char_name]);
        }
        return output;
      }

      // str == some string, fetch the first matched element
      else if ($mode == 'single'){
        for (const char_name of $char_names){
          if (char_name.match(exp)){
            return $char[char_name];
          }
        }
      }
    }
  }

  getSC (name) {
    let out;
    const MOD_PAR = this.MOD_PAR;
    const systemName = Object.keys(MOD_PAR)[0];
    let value = MOD_PAR[systemName]['"' + name + '"'];

    if (typeof value === 'string') {
      if (value[0] === '"' && value[value.length-1] === '"') {
        out = parseInt(value.substr(1, value.length-2));
        return out;
      }
    }

    return NaN;
  }
}

class HEX {
  constructor (hexFilePath) {
    const text = require('fs').readFileSync(hexFilePath, 'utf-8');
    return init(text);

    function init (text) {
      const out = {dataBlock:{}};
      let lines = text.split(/\n/);
      let len = 0, line, dataLine, currentBlock, dataByteCount, blockAddr, type, state = 'idle';
      for (const [i, _line_] of lines.entries()){
        line = _line_.trim();
        len = line.length;
        dataByteCount = parseInt(line.substr(1, 2), 16);
        blockAddr = line.substr(3, 4);
        type = line.substr(7, 2);
        dataLine = line.substr(9, len - 11);
  
        if (len == 15) {
          if (type == '04') {
            if (out['dataBlock'][dataLine] == undefined) out['dataBlock'][dataLine] = '';
            currentBlock = dataLine;
            state = 'push';
          } else state = 'idle';         
        } else if (state == 'push'){
          out.dataBlock[currentBlock] += dataLine;
        }
      }

      return out;
    }
  }
}

/*
    'COMPU_METHOD',
    'RECORD_LAYOUT',
    'AXIS_PTS',
    'COMPU_VTAB',
    'COMPU_TAB',
    'FUNCTION',
    'MOD_PAR', <-- system constant
    'MOD_COMMON' <--Byte order
*/

// 测试
/*
const p = 'E:/@ Code (基本已移至Github目录下)/集成工作台/测试用数据/A2L HEX/UD8/PST_41_MG1US008_02A3_UD8/MG1US008_02A3_20161219.a2l';
const b = new A2L(p);
b.load();


const p2= 'E:/@ Code (基本已移至Github目录下)/集成工作台/测试用数据/A2L HEX/UD8/PST_41_MG1US008_02A3_UD8/MG1US008_02A3_20161219_03.hex';
const hex = new HEX(p2);

b.hexData = hex;*/


module.exports = {A2L, HEX};