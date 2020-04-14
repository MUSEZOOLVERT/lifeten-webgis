Ext4.define("HSLayers.ContextBrowser.Server", {

    extend: "Ext4.grid.Panel",
    requires: ["HSLayers.ContextBrowser.Model"],

    url: undefined,
    map: undefined,
    isAdmin: false,
    project: undefined,

    constructor: function(config) {

        if (config.map) {
            this.setMap(config.map);
        }

        config.title = OpenLayers.i18n("Server");

        config.store = Ext4.create('Ext.data.Store', {
            model: 'HSLayers.ContextBrowser.Model',
            autoLoad: this.map ? true : false,
            proxy: {
                type: 'ajax',
                url: OpenLayers.Util.urlAppend(config.url,
                    OpenLayers.Util.getParameterString({
                            request:"list",
                            project: config.project
                    })
                ),
                reader: {
                    type: 'json',
                    root: 'results'
                }
            }
        });

        config.tbar = [
        {
            xtype: "button",
            icon: OpenLayers.Util.getImagesLocation()+"arrow_refresh.png",
            tooltip: OpenLayers.i18n("Reload"),
            scope: this,
            handler: function() {
                this.store.load();
            }
        }
        ];

        config.header =false;
        config.columns = [{
            xtype:"templatecolumn",
            text: OpenLayers.i18n("Composition"),
            flex: 1, 
            dataIndex: 'title',
            tpl: "<b>{title}</b><br /><p>{abstract}</p>"
        },
        {
            xtype:'actioncolumn',
            width: 30,
            style: { verticalAlign: "bottom"},
            items: [{
                tooltip: OpenLayers.i18n('Add to map'),
                icon: OpenLayers.Util.getImagesLocation()+"map_go.png",
                scope: this,
                handler: function(grid, rowIndex, colIndex) {
                    var rec = grid.getStore().getAt(rowIndex);
                    this.fireEvent("addtomapclicked",
                            OpenLayers.Util.urlAppend(this.url,
                                OpenLayers.Util.getParameterString({
                                    request:"load",
                                    project:this.project,
                                    id: rec.get("uuid")})));
                }
            }]
        }];

        // adding remove button
        if (config.isAdmin) {
            config.columns.push({
                xtype:'actioncolumn',
                width: 30,
                style: { verticalAlign: "bottom"},
                items:[{
                    tooltip: OpenLayers.i18n('Remove'),
                    icon: OpenLayers.Util.getImagesLocation()+"empty.gif",
                    scope: this,
                    handler: function(grid, rowIndex, colIndex) {
                        var remove = function(rec) {
                            OpenLayers.Request.GET({
                                url: this.url,
                                params: {
                                    request:'delete',
                                    id: rec.get("uuid"),
                                    project: this.project
                                },
                                scope: this,
                                success: function(r) {
                                    var f = new OpenLayers.Format.JSON();
                                    r = f.read(r.responseText);
                                    var w;
                                    if (r.success) {
                                        this.store.load();
                                        //w = Ext4.MessageBox.show({
                                        //    title: OpenLayers.i18n("Composition removed"),
                                        //    msg: OpenLayers.i18n("Composition was successfully removed"),
                                        //    buttons: Ext4.MessageBox.OK,
                                        //    icon: Ext4.MessageBox.INFO
                                        //});
                                        HSLayers.Util.msg(
                                            OpenLayers.i18n("Composition removed"),
                                            OpenLayers.i18n("Composition was successfully removed"),
                                            3);
                                    }
                                    else {
                                        w = Ext4.MessageBox.show({
                                            title: OpenLayers.i18n("Removing composition failed"),
                                            msg: OpenLayers.i18n("Could not remove composition"),
                                            buttons: Ext4.MessageBox.OK,
                                            icon: Ext4.MessageBox.WARNING
                                        });
                                    }
                                }
                                
                            });
                        };
                        Ext4.MessageBox.show({ 
                            title: OpenLayers.i18n("Confirmation"),
                            msg: OpenLayers.i18n("Really remove selected composition?"),
                            buttons: Ext4.MessageBox.YESNO,
                            icon: Ext4.MessageBox.QUESTION,
                            rec: grid.getStore().getAt(rowIndex),
                            fn: function(b,text, opt) {
                                if (b == "yes") {
                                    remove.apply(this,[opt.rec]);
                                }
                            },
                            scope: this
                        });
                    }
                }]
            });
        }


        this.callParent(arguments);
        this.addEvents("addtomapclicked");

    },

    setMap: function(map) {
        this.map = map;
    }
});
