class Ribbon {
    constructor (id) {
        this.data = {
            selected:0,
            tabs:[{
                title:'开始',
                groups:[
                    {
                        title: '项目文件',
                        tools:[
        
                            {
                                name: 'create',
                                text: '新建项目',
                                iconCls: 'icon-add-blank-project',
                                size: 'large',
                                iconAlign: 'top',
                                onClick: undefined,
                            },
        
                            {
                                text: '查看项目',
                                iconCls: 'icon-add-blank-project',
                                size: 'large',
                                iconAlign: 'top',
                                onClick: undefined,
                            },
        
                            {
                                type: 'splitbutton',
                                name: 'open', 
                                text: '导入',
                                iconCls: 'icon-open-xlsx',
                                size: 'large',
                                iconAlign: 'top',
                                onClick: function () {$('#btn-input-file').click();},								
                                menuItems: [{
                                    name: 'open-A2L-HEX',
                                    type: 'menubutton',
                                    text: 'A2L+HEX',
                                    handler: function() {$('#btn-input-file-a2l').click();$('#btn-input-file-hex').click();},
                                },{
                                    name: 'open-DCM',
                                    text: 'DCM',
                                    handler: function() {alert('3')},
                                },{
                                    name: 'open-XML',
                                    text: 'XML',
                                    handler: undefined,
                                }],
                            },
        
                            {
                                name: 'export-as-XLSX',
                                type: 'splitbutton', 
                                text: '导出',
                                iconCls: 'icon-save-as-XLSX',
                                size: 'large',
                                iconAlign: 'top',
                                onClick: undefined,
                                menuItems: [{
                                    name: 'DCM',
                                    text: 'DCM',
                                    handler: function () {},
                                },{
                                    name: 'HEX',
                                    text: 'HEX',
                                    handler: function () {},
                                }],
                            },
        
                            {
                                type:'toolbar',
                                dir:'v',
                                tools:[{
                                    name:'saveAs',
                                    text:'另存为',
                                    iconCls:'icon-saveAs',
                                },{
                                    name:'copy',
                                    text:'关闭',
                                    iconCls:'icon-close'
                                }]
                            }
                        ],
                    },
        
                    {
                        title:'编辑',
                        tools:[
                            {
                                type: 'splitbutton',
                                name:'sort-filter',
                                text:'排序和筛选',
                                iconCls:'icon-sort-filter',
                                size: 'large',
                                iconAlign: 'top',
                                onClick: undefined,
                                menuItems: [{
                                    name: 'remove-filter',
                                    text: '移除筛选器',
                                }],
                            },
        
                            {
                                name: 'DSM',
                                type: 'splitbutton',
                                text: 'DSM',
                                iconCls: 'icon-DSM',
                                size: 'large',
                                iconAlign: 'top',
                                onClick: function (){},
                                menuItems: [{
                                    name: 'DFC',
                                    text: 'DFC',
                                },{
                                    text: 'DINH',
                                },{
                                    text: 'DSQ',
                                    handler: function () {alert('DSQ')},
                                }],
                            },
        
                            {
                                type: 'toolbar',
                                dir: 'v',
                                tools: [{
                                    name: '',
                                    text: '插入',
                                    iconCls: 'icon-insert',                                  
                                },
        
                                {
                                    name: '',
                                    text: '插入',
                                    iconCls: 'icon-insert',                                   
                                }],
                            },
        
                        ]
        
                    },
        
                    {
                        title: '工具',
                        tools: [{
                            text: 'DTCO计算器',
                            iconCls: 'icon-DTCO-calculator',
                            size: 'large',
                            iconAlign: 'top',
                            onClick: undefined,
                        }],
                    }
                ],
            }],
        };
        this.id = id;
    }

    init () {
        if ($.fn.ribbon) $('#'+ this.id).ribbon({
            data: this.data
        });
    }
}
module.exports = Ribbon;