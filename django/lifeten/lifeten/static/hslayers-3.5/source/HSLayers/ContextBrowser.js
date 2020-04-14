Ext4.define("HSLayers.ContextBrowser", {

    extend: "Ext4.tab.Panel",
    requires: ["HSLayers.ContextBrowser.Server",
               "HSLayers.ContextBrowser.Local"
    ],

    url: undefined,
    map: undefined,
    isAdmin: false,
    project: undefined,

    constructor: function(config) {

        this.server = Ext4.create("HSLayers.ContextBrowser.Server",{
            isAdmin: config.isAdmin,
            project: config.project,
            url: config.url
        });
        this.server.store.on("load",this._fixloaded,this);
        this.local = Ext4.create("HSLayers.ContextBrowser.Local",{project:config.project});

        this.items = [this.server, this.local];

        if (config.map) {
            this.setMap(config.map);
        }


        this.callParent(arguments);
        this.addEvents("addtomapclicked");
        this.addEvents("uploaded");

        this.server.on("addtomapclicked",function(url){
            this.fireEvent("addtomapclicked",url);
        }, this);
        this.local.on("uploaded",function(context){
            this.fireEvent("uploaded",context);
        }, this);

    },

    _fixloaded: function() {
        if (this.server.store.data.length === 0) {
            this.getLayout().setActiveItem(1);
        }
    },

    setMap: function(map) {
        this.map = map;
        this.server.setMap(map);
        this.local.setMap(map);
    }

});
