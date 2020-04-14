Ext4.define("HSLayers.Context", {

    extend: "Ext4.panel.Panel",

    requires: [
        "HSLayers.Context.Main",
        "HSLayers.Context.User",
        "HSLayers.Context.Summary"
    ],


    bodyCls: "context",
    main: undefined,
    user: undefined,
    summary: undefined,
    geoportal: undefined,
    map: undefined,
    project: undefined,
    _activeItemIndex: 0,
    url: undefined,

    context: undefined,

    constructor: function(config) {

        config.context = {
            data: undefined,
            request: "save",
            project: config.project || window.location.pathname,
            permanent: true
        };

        config.url = config.url || HSLayers.statusManagerUrl;

        config.layout =  "card";

        this.main = Ext4.create("HSLayers.Context.Main",{
            title: OpenLayers.i18n("Context"),
            header: false,
            map: config.map,
            frame: true
        });


        this.user = Ext4.create("HSLayers.Context.User",{
            title: OpenLayers.i18n("Author"),
            header: false,
            map: config.map,
            frame: true
        });

        this.summary = Ext4.create("HSLayers.Context.Summary", {
            title: OpenLayers.i18n("Summary"),
            map: config.map,
            project: config.project,
            header: false,
            listeners: {
                saveclicked: function() {
                    this._save_handler();
                },
                saveasclicked: function() {
                    this._save_handler(true);
                },
                downloadclicked: function() {
                    this._download_handler();
                },
                scope:this
            }
        });

        config.items = [
            this.main,
            this.user,
            this.summary
        ];
        config.activeItem = 0;

        config.bbar = [{
                id: 'move-prev',
                text: '&laquo; '+OpenLayers.i18n('Back'),
                scope: this,
                handler: function(btn) {
                    this.navigate(btn.up("panel"), "prev");
                },
                disabled: true
            },
            '->', // greedy spacer so that the buttons are aligned to each side
            {
                id: 'move-next',
                text: OpenLayers.i18n('Next')+' &raquo;',
                scope: this,
                handler: function(btn) {
                    this.navigate(btn.up("panel"), "next");
            }
        }];
            

        this.callParent(arguments);

        if (config.map) {
            this.setMap(config.map);
        }

        this.getLayout().setActiveItem(0);

        this.setTitle("Step "+String(1)+"/"+this.items.length+": "+this.getLayout().getActiveItem().title);

        this.addEvents("saved");
        this.addEvents("downloaded");
    },

    navigate: function(panel, direction){
        // This routine could contain business logic required to manage the navigation steps.
        // It would call setActiveItem as needed, manage navigation button state, handle any
        // branching logic that might be required, handle alternate actions like cancellation
        // or finalization, etc.  A complete wizard implementation could get pretty
        // sophisticated depending on the complexity required, and should probably be
        // done as a subclass of CardLayout in a real-world implementation.
        var layout = panel.getLayout();
        layout[direction]();

        this._activeItemIndex += (direction == "next" ? 1 : -1);

        this.setTitle(OpenLayers.i18n("Step")+" "+String(this._activeItemIndex+1)+"/"+this.items.length+": "+layout.getActiveItem().title);

        Ext4.getCmp('move-prev').setDisabled(!layout.getPrev());
        Ext4.getCmp('move-next').setDisabled(!layout.getNext());

        if (!layout.getNext()) {
            this.summary.setContext(this.getContext().data);
        }
    },

    setContext: function(context) {
        this.main.setContext(context);
        this.user.setContext(context.user);
        this.context.data = this.getContext();
    },

    /**
     * get map context
     * @function
     * @param {Boolean} save_as
     * @returns {Object}
     */
    getContext: function(save_as) {
        var context = {};
        var layers = this.main.getCheckedLayers();
        var groups = this.main.getGroups();
        var vals = this.main.getForm().getValues();
        var format = new HSLayers.Format.State();

        context.title = vals.title;
        context.abstract = vals.abstract;
        context.keywords = vals.keywords;
        context.extent = [vals["bbox-w"],vals["bbox-s"],vals["bbox-e"],vals["bbox-n"]];
        context.user = this.user.getForm().getValues();
        context.layers = format.layers2json(layers);
        context.scale = this.map.getScale();
        var center = this.map.getCenter();
        context.center = [center.lon, center.lat];
        context.groups = groups;

        if (save_as) {
            this.map.setNewUuid();
        }
        this.context.id = this.map.uuid;

        this.context.data = context;
        return this.context;
    },

    setMap: function(map) {
        this.map = map;

        this.main.setMap(map);
        this.user.setMap(map);
        this.summary.setMap(map);

        this.setContext(map);
    },

    /**
     * save composition to the server
     * @function
     * @param {Boolean} save_as
     */
    _save_handler: function(save_as) {
        var format = new OpenLayers.Format.JSON();
        var context = this.getContext(save_as);

        this.setMapMetadata(context);

        // sent to server
        OpenLayers.Request.POST({
            url: this.url,
            data: format.write(context,true),
            scope:this,
            success: function(x) {
                var resp = format.read(x.responseText);
                if (resp.saved !== false) {
                    HSLayers.Util.msg(
                        OpenLayers.i18n("Composition saved"),
                        OpenLayers.i18n('Composition successfully saved to server.'),
                        3);
                        
                    //Ext4.Msg.show({
                    //    title:OpenLayers.i18n("Composition saved"),
                    //    msg:OpenLayers.i18n('Composition successfully saved to server.'),
                    //    icon: Ext4.Msg.INFO,
                    //    buttons: Ext4.Msg.OK
                    //});
                }
                else {
                    Ext4.Msg.alert({
                        title:OpenLayers.i18n("Composition failed"),
                        msg:OpenLayers.i18n('Composition was not saved to server')+": "+resp.error,
                        icon: Ext4.Msg.INFO,
                        buttons: Ext4.Msg.OK
                    });
                }
                this.fireEvent("saved",this.context);
            },
            failure: function(x) {
                Ext4.Msg.alert(OpenLayers.i18n("ERROR: Not saved"),x.responseText);
            }
        });
    },

    _download_handler: function() {

        var format = new OpenLayers.Format.JSON();
        var context = this.getContext();
        context.permanent = undefined;

        this.setMapMetadata(context);
        
        
        OpenLayers.Request.POST({
            url: HSLayers.statusManagerUrl,
            data: format.write(context,true),
            scope:this,
            success: function(x) {
                window.location = HSLayers.statusManagerUrl+"?filename="+(this.context.data.title || "context")+".hsl&request=load&project="+this.project;
            },
            failure: function(x) {
                Ext4.Msg.alert(OpenLayers.i18n("ERROR: Can not download"),x.responseText);
            }
        });

    },

    setMapMetadata: function(context) {

        context = (context.data ? context.data : context);

        // set metadata
        this.map.metadata.set(context);

        // set user
        this.map.user.set(context.user);
    }
});
