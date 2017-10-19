$(document).ready(() => {
	const Tree = require('./parts/tree/tree');
	const resTree = new Tree('tree-container');
	resTree.directory = 'E:\\Project'; // just for test
	resTree.init();

});
