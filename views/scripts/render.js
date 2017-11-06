$(document).ready(() => {
	/*
	const Tree = require('./parts/tree/tree');
	const resTree = new Tree('tree-container');
	resTree.directory = 'E:\\Project'; // just for test
	resTree.init();
	*/
	// global variable
	const ipcRenderer = require('electron').ipcRenderer;

	$('#ribbon-btn-import-xml').click(() => {
		ipcRenderer.send('open-files', {
			filters: [{
				name: 'XML',
				extensions: ['xml'],
			}],
		})
	})

	$('#ribbon-btn-show-dsm-xml').click(() => {
		const xml = AppNS.sourceDataset;
		if (!xml.data || xml.type != 'XML') return;
		const xmlSheetDef = {
			"LONG-NAME": {
				"alias": "Description",
				"columnWidth": 180
			},
			"LONG-NAME-GERMAN": {
				"alias": "Description in German",
				"columnWidth": 0
			},
			"SHORT-NAME": {
				"alias": "Name",
				"columnWidth": 180
			}
		}

		const DFC_FID = {};
		const FID_DFC = {};

		const DFCS = xml.data.DSMNodeToObj(xml.data.xml.querySelector('DSM-DFCS'))['DSM-DFCS'];
		const FIDS = xml.data.DSMNodeToObj(xml.data.xml.querySelector('DSM-FIDS'))['DSM-FIDS'];

		for (const [i, item] of DFCS.entries()) {
			const theDFC = item['DSM-DFC'];
			DFC_FID[theDFC['SHORT-NAME']] = {
				desc: theDFC['LONG-NAME'],
				DINHs: [],
			};

			if (theDFC['DSM-DFC-INHS'] && theDFC['DSM-DFC-INHS'].entries) {
				for (const [j, DINH] of theDFC['DSM-DFC-INHS'].entries()) {
					DFC_FID[theDFC['SHORT-NAME']]['DINHs'].push({
						FID: DINH['DSM-DFC-INH'],
						LIM: theDFC['DSM-DFC-INHLIMS'][j]['DSM-DFC-INHLIM'],
						CAT: theDFC['DSM-DFC-INHCATS'][j]['DSM-DFC-INHCAT'],
					});
				}	
			} else if (theDFC['DSM-DFC-INHS']['DSM-DFC-INH']) { 
				DFC_FID[theDFC['SHORT-NAME']]['DINHs'].push({
					FID: theDFC['DSM-DFC-INHS']['DSM-DFC-INH'],
					LIM: theDFC['DSM-DFC-INHLIMS']['DSM-DFC-INHLIM'],
					CAT: theDFC['DSM-DFC-INHCATS']['DSM-DFC-INHCAT'],
				});
			}				
		}

		for (const [i, item] of FIDS.entries()) {
			const theFID = item['DSM-FID'];
			FID_DFC[theFID['SHORT-NAME']] = {
				desc: theFID['LONG-NAME'],
				DINHSources: [],
			};

			if (theFID['DSM-FID-INHSOURCES'] && theFID['DSM-FID-INHSOURCES'].entries) {
				for (const [j, DFC] of theFID['DSM-FID-INHSOURCES'].entries()) {
					const source = DFC['DSM-FID-INHSOURCE'];
					const _s = source.indexOf('(');
					const _DFC = source.substring(0, _s);
					const _LIM = source.substring(_s+1, source.length - 1);
					FID_DFC[theFID['SHORT-NAME']]['DINHSources'].push({
						DFC: _DFC,
						CAT: theFID['DSM-FID-INHSOURCECATS'][j]['DSM-FID-INHSOURCECAT'],
						LIM: _LIM,
					});
				}
			} else if (theFID['DSM-FID-INHSOURCES']['DSM-FID-INHSOURCE']) {
				const source = theFID['DSM-FID-INHSOURCES']['DSM-FID-INHSOURCE'];
				if (!source) continue;
				const _s = source.indexOf('(');
				const _DFC = source.substring(0, _s);
				const _LIM = source.substring(_s+1, source.length - 1);
				FID_DFC[theFID['SHORT-NAME']]['DINHSources'].push({
					DFC: _DFC,
					CAT: theFID['DSM-FID-INHSOURCECATS']['DSM-FID-INHSOURCECAT'],
					LIM: _LIM,
				});
			}				
		}

		// 如果顺利得到DFC_FID的数据对象的话，则生成相应Sheet
		if (DFC_FID) {
			const sheetname = '<xml>DFC->FID';
			if (spread.getSheetFromName(sheetname)) spread.removeSheet(spread.getSheetIndex(sheetname));

			const sheet = new GC.Spread.Sheets.Worksheet(sheetname);
			sheet.setRowCount(10000);
			const sheetCount = spread.getSheetCount();
			spread.addSheet(sheetCount, sheet);
			spread.suspendPaint();

			let DFCIndex = 0,
				startRow = 0,
				startColumn = 0;
			// 调整列宽					
			sheet.setColumnWidth(startColumn + 0, 80);
			sheet.setColumnWidth(startColumn + 1, 150);
			sheet.setColumnWidth(startColumn + 2, 120);
			sheet.setColumnWidth(startColumn + 3, 120);
			sheet.setColumnWidth(startColumn + 4, 500);
			sheet.setRowHeight(startRow, 24);

			sheet.setValue(startRow, startColumn + 0, 'No.');
			sheet.setValue(startRow, startColumn + 1, 'FID Name');
			sheet.setValue(startRow, startColumn + 2, 'Limit');
			sheet.setValue(startRow, startColumn + 3, 'Category');
			sheet.setValue(startRow, startColumn + 4, 'Description');

			const titleRange = sheet.getRange(startRow, startColumn, 1, 5);
			titleRange.font('bold 16px Arial');
			titleRange.borderBottom(new GC.Spread.Sheets.LineBorder("Black", GC.Spread.Sheets.LineStyle.double));

			startRow ++;

			const DFCS = Object.keys(DFC_FID).sort();
			
			for (const DFC of DFCS) {

				DFCIndex ++;
				const theDFC = DFC_FID[DFC];

				const _cell_1 = sheet.getCell(startRow, startColumn);
				_cell_1.font('14px Consolas');
				_cell_1.foreColor('blue');
				_cell_1.text('DFC Name');
				
				
				const _cell_2 = sheet.getCell(startRow, startColumn + 1);
				_cell_2.font('italic 14px Consolas');
				_cell_2.foreColor('blue');
				_cell_2.text(DFC);
				
				const _cell_3 = sheet.getCell(startRow , startColumn + 4);
				_cell_3.font('italic 14px Consolas');
				_cell_3.foreColor('blue');
				_cell_3.text(theDFC.desc);

				sheet.getRange(startRow + 1, startColumn,theDFC.DINHs.length, 5).font('12px Segoe UI');
				sheet.getRange(startRow + 1, startColumn,theDFC.DINHs.length, 1).hAlign(GC.Spread.Sheets.HorizontalAlign.center);

				for (const [i, FID] of theDFC.DINHs.entries()) {
					sheet.setValue(startRow + i + 1, startColumn + 0, i+1);
					sheet.setValue(startRow + i + 1, startColumn + 1, FID.FID);
					sheet.setValue(startRow + i + 1, startColumn + 2, FID.LIM);
					sheet.setValue(startRow + i + 1, startColumn + 3, FID.CAT);
					sheet.setValue(startRow + i + 1, startColumn + 4, FID_DFC[FID.FID]?FID_DFC[FID.FID].desc:'');
				}

				startRow += theDFC.DINHs.length + 1;
			}
			
			sheet.setRowCount(startRow);
			spread.resumePaint();
		}
		
		// 如果顺利得到FID_DFC的数据对象的话，则生成相应Sheet
		if (FID_DFC) {
			const sheetname = '<xml>FID->DFC';
			if (spread.getSheetFromName(sheetname)) spread.removeSheet(spread.getSheetIndex(sheetname));

			const sheet = new GC.Spread.Sheets.Worksheet(sheetname);
			sheet.setRowCount(10000);
			const sheetCount = spread.getSheetCount();
			spread.addSheet(sheetCount, sheet);
			spread.suspendPaint();

			let FIDIndex = 0,
				startRow = 0,
				startColumn = 0;

			sheet.setColumnWidth(startColumn + 0, 80);
			sheet.setColumnWidth(startColumn + 1, 150);
			sheet.setColumnWidth(startColumn + 2, 120);
			sheet.setColumnWidth(startColumn + 3, 120);
			sheet.setColumnWidth(startColumn + 4, 500);
			sheet.setRowHeight(startRow, 24);

			sheet.setValue(startRow, startColumn + 0, 'No.');
			sheet.setValue(startRow, startColumn + 1, 'DFC Name');
			sheet.setValue(startRow, startColumn + 2, 'Limit');
			sheet.setValue(startRow, startColumn + 3, 'Category');
			sheet.setValue(startRow, startColumn + 4, 'Description');

			const titleRange = sheet.getRange(startRow, startColumn, 1, 5);
			titleRange.font('bold 16px Arial');
			titleRange.borderBottom(new GC.Spread.Sheets.LineBorder("Black", GC.Spread.Sheets.LineStyle.double));
			
			startRow ++;

			for (const FID in FID_DFC) {
				FIDIndex ++;
				const theFID = FID_DFC[FID];

				const _cell_1 = sheet.getCell(startRow, startColumn);
				_cell_1.font('14px Consolas');
				_cell_1.foreColor('blue');
				_cell_1.text('FID Name');
				
				
				const _cell_2 = sheet.getCell(startRow, startColumn + 1);
				_cell_2.font('italic 14px Consolas');
				_cell_2.foreColor('blue');
				_cell_2.text(FID);
				
				const _cell_3 = sheet.getCell(startRow, startColumn + 4);
				_cell_3.font('italic 14px Consolas');
				_cell_3.foreColor('blue');
				_cell_3.text(theFID.desc);

				sheet.getRange(startRow + 1, startColumn,theFID.DINHSources.length, 5).font('12px Segoe UI');
				sheet.getRange(startRow + 1, startColumn,theFID.DINHSources.length, 1).hAlign(GC.Spread.Sheets.HorizontalAlign.center);

				for (const [i, DFC] of theFID.DINHSources.entries()) {
					sheet.setValue(startRow + i + 1, startColumn + 0, i+1);
					sheet.setValue(startRow + i + 1, startColumn + 1, DFC.DFC);
					sheet.setValue(startRow + i + 1, startColumn + 2, DFC.LIM);
					sheet.setValue(startRow + i + 1, startColumn + 3, DFC.CAT);
					sheet.setValue(startRow + i + 1, startColumn + 4, DFC_FID[DFC.DFC]?DFC_FID[DFC.DFC].desc:'');
				}

				startRow += theFID.DINHSources.length + 1;
			}
			sheet.setRowCount(startRow);
			spread.resumePaint();
		}
		
		const rootTagName = 'CFGEXP_DSM';
		const rootNode = xml.data.xml.querySelector(rootTagName);

		for (const sheetNode of rootNode.children) {
			

			if (sheetNode.children.length > 0) {
				const sheetName = sheetNode.nodeName;
				const sheet = addSheet(sheetName);

				const startRow = 0,
						startColumn = 1,
						fields = {};

				let currentRow = startRow;

				spread.suspendPaint();

				if (sheetNode.children[0].nodeName === sheetNode.children[sheetNode.children.length-1].nodeName) {
					// 为数组类型节点，例如DSM-DFCS
					for (let i = 0; i < sheetNode.children.length; i++) {
						const rowNode = sheetNode.children[i];
						let value = '';
						
						if (i === 0) {
							for (let k = 0; k < rowNode.children.length; k++) {
								const fieldNode = rowNode.children[k];
								const fieldName = fieldNode.nodeName;
								fields[fieldName] = {
									columnOffset: k,
									columnWidth: (xmlSheetDef[fieldName])?xmlSheetDef[fieldName].columnWidth:120,
								}

								if (fieldName === 'SHORT-NAME') {}

								sheet.setValue(startRow, startColumn + k, fieldNode.nodeName);
								sheet.setColumnWidth(startColumn + k, fields[fieldName]['columnWidth']);									
							}
							const titleRange = sheet.getRange(startRow, -1, 1, -1);
							titleRange.font('bold 13px Arial');
							titleRange.borderBottom(new GC.Spread.Sheets.LineBorder("Black", GC.Spread.Sheets.LineStyle.double));
							sheet.setRowHeight(startRow, 18);
							currentRow ++;
						}
						

						for (const fieldNode of rowNode.children) {
							if (fieldNode.children.length === 0) {
								value = fieldNode.textContent;
							} else {
								for (let j = 0; j < fieldNode.children.length; j++) {
									const subNode = fieldNode.children[j];
									if (j === 0) value = subNode.textContent;
									else value += '\n' + subNode.textContent;
								}
							}

							if (fields[fieldNode.nodeName]) {
								const columnOffset = fields[fieldNode.nodeName]['columnOffset'];
								sheet.setValue(currentRow, startColumn + columnOffset, value);
								
							}
						}
						currentRow ++;
					}
				} else {
					// 为对象类型节点，例如DSM-ENV-INFO、DSM-INFO
					for (const _f of sheetNode.children) {
						const backColor = (currentRow%2)?'white':'#AAA';

						const kCell = sheet.getCell(currentRow, startColumn);
						kCell.text(_f.nodeName);
						kCell.font('bold 13px Arial');

						const vCell = sheet.getCell(currentRow, startColumn + 1);
						vCell.text(_f.textContent);

						sheet.getRange(currentRow, startColumn, 1, 2).backColor(backColor);
						currentRow++;
					}
				}					

				spread.resumePaint();
			}				
		}
		
		function addSheet (sheetname, rowCount=10000, columnCount=100) {
			if (spread.getSheetFromName(sheetname)) sheetname += '_副本';
	
			const sheet = new GC.Spread.Sheets.Worksheet(sheetname);
			sheet.setRowCount(rowCount);
			sheet.setColumnCount(columnCount);
			const sheetCount = spread.getSheetCount();
			spread.addSheet(sheetCount, sheet);
			return sheet;
		}
	})
});
