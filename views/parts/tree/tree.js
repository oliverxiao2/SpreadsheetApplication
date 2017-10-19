module.exports = function (containerId) {
    const output = {
        setting: {
            data: {
                simpleData: {
                    enable: true
                }
            }
        },
        zNodes: [],
        directory: '',
        init: function () {
            if ($.fn.zTree) {
                this.zNodes = this.readDirSync(this.directory);
                if (this.zNodes.length > 0) $.fn.zTree.init($('#'+containerId), this.setting, this.zNodes);
                else {

                }
            }
        },
        readDirSync: function (path) {
            const output = [];

            const fs = require('fs');
            let _id = 0;
            walk(path);

            return output;

            function walk (path, pId) {
                const _pa = fs.readdirSync(path);
                _pa.forEach(function (ele, i) {
                    const _s = fs.statSync(path + '\\' + ele);
                    if (_s.isDirectory()) {
                        const _n = {
                            id: (++_id),
                            pId: pId,
                            name: ele,
                            isParent: true,
                        };
                        output.push(_n);
                        walk(path + '\\' + ele, _id);
                    } else {
                        const _n = {
                            id: (++_id),
                            pId: pId,
                            name: ele,                           
                        };
                        output.push(_n);
                    }
                });
            }
        },
    };

    return output;
};