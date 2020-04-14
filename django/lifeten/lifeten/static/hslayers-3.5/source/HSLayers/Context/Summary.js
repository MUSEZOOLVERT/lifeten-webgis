Ext4.define("HSLayers.Context.Summary", {
    extend: "Ext4.panel.Panel",

    geoportal: undefined,
    map: undefined,
    ed: undefined,
    bodyCls: "context-summary",
    url: undefined,
    project: undefined,
    context: undefined,


    constructor: function(config) {

        config.items = [ 
             {
                xtype: "container",
                itemId: "html",
                maxHeight: 320,
                autoScroll: true,
                html: ""
             }
        ];

        config.frame = true;

        config.buttons = [
            {
                text: OpenLayers.i18n("Download"),
                scope: this,
                handler: this._onDownloadClicked
            },
            {
                text: OpenLayers.i18n("Save as"),
                scope: this,
                handler: this._onStoreToServerAsClicked
            },
            {
                text: OpenLayers.i18n("Save"),
                scope: this,
                handler: this._onStoreToServerClicked
            }
        ];

        this.callParent(arguments);
        this.addEvents({"saveclicked":true,"saveasclicked":true,"downloadclicked":true});

    },

    setContext: function(context) {

        var tpl = [
            "<dl>",
                "<dt>"+OpenLayers.i18n("Title")+":</dt><dd>{title}</dd>",
                "<dt>"+OpenLayers.i18n("Abstract")+":</dt><dd>{abstract}</dd>",
                "<dt>"+OpenLayers.i18n("Keywords")+":</dt><dd>{keywords}</dd>",
                "<dt>"+OpenLayers.i18n("Author")+":</dt><dd>{user.name}</dd>",
                '<dt>'+OpenLayers.i18n("Groups")+':</dt><dd>',
                '<ul>'
        ];
        for (var g in context.groups) {
            tpl.push("<li>"+g+": "+context.groups[g]+"</li>");
        }

        tpl = tpl.concat(['</ul>',
                '<dt>'+OpenLayers.i18n("Layers")+':</dt><dd>',
                    '<ul><tpl for="layers">',
                    '<li>{title}</li>',
                    '</tpl></ul>',
                '</dd>',
            "</dl>"
        ]);

        var html = new Ext4.XTemplate(tpl);
        this.getComponent("html").update(html.apply(context));
    },

    _onStoreToServerClicked: function() {

        this.fireEvent("saveclicked");
    },

    _onStoreToServerAsClicked: function() {

        this.fireEvent("saveasclicked");
    },

    _onDownloadClicked: function() {

        this.fireEvent("downloadclicked");
    },

    setMap: function(map ){
        this.map = map;
    }
});
