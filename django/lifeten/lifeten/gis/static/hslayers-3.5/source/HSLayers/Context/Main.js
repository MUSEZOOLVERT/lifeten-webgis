Ext4.define("HSLayers.Context.Main", {
    extend: "Ext4.form.Panel",

    map: undefined,
    groups: undefined,
    bodyCls: "context-main",

    constructor: function(config) {

        if (config.groups) {
            this.groups = config.groups;
        }
        else {
            this.groups = this._getGroups();
        }

        config.layou = "anchor";
        config.overflowY = "scroll";
        config.items = [
            {
                name: "title",
                fieldLabel: OpenLayers.i18n("Title"),
                width: 355,
                xtype: "textfield",
                allowBlank: false
            },
            {
                name: "abstract",
                width: 355,
                height: 35,
                fieldLabel: OpenLayers.i18n("Abstract"),
                xtype: "textarea",
                allowBlank: true
            },
            {
                name: "keywords",
                fieldLabel: OpenLayers.i18n("Keywords"),
                width: 355,
                xtype: "textfield",
                allowBlank: true
            },
            {
                xtype: "fieldset",
                width: 355,
                name: "groups",
                itemId: "groups",
                title: OpenLayers.i18n("Access rights"),
                collapsible: true,
                collapsed: true,
                items: this.groups
            },
            {
                xtype: "fieldset",
                itemId: "extent",
                title: OpenLayers.i18n("Extent"),
                width: 355,
                items: [
                    {
                    xtype: 'fieldcontainer',
                    fieldLabel: 'BBOX',
                    hideLabel: true,
                    layout: 'hbox',
                    items: [{
                        xtype: 'textfield',
                        name: "bbox-w",
                        flex: 1
                    }, { xtype: 'splitter' }, 
                    {
                        xtype: 'textfield',
                        name: "bbox-s",
                        flex: 1
                    }, { xtype: 'splitter' }, 
                    {
                        xtype: 'textfield',
                        name: "bbox-e",
                        flex: 1
                    }, { xtype: 'splitter' }, 
                    {
                        xtype: 'textfield',
                        name: "bbox-n",
                        flex: 1
                    }]
                }]
            },
            {
                xtype: 'fieldset',
                title: OpenLayers.i18n("Layers"),
                name: "layers",
                itemId: "layers",
                width: 355,
                collapsible: true,
                fieldLabel: OpenLayers.i18n('Layers'),
                columns: 1,
                vertical: true,
                items: []
            }
        ];

        if (config.map) {
            config.items[4].items.push({
                    xtype: 'button',
                    enableToggle: true,
                    text: OpenLayers.i18n("Draw"),
                    itemId: "bbox_button",
                    scope: this,            
                    handler: this._onDrawBox
                });
            config.items[4].items.push( {
                    xtype: 'button',
                    enableToggle: true,
                    text: OpenLayers.i18n("Use current"),
                    scope: this,            
                    handler: this._onCurrentBox
                });
        }


        //config.buttons = [
        //    {
        //        text:"Clear",
        //        scope: this,
        //        handler: this._onResetClicked
        //    },
        //    {
        //        text:"Create",
        //        scope: this,
        //        handler: this._onCreateClicked
        //    }
        //];


        this.callParent(arguments);

        this.on("afterrender",this._updateLayers, this);

        this.addEvents("contextsaved");

    },

    _onResetClicked: function() {
        this.getForm().reset();
    },

    _onCurrentBox: function() {
        if (this.map ){
            this._onBoxDrawed(this.map.getExtent());
        }
    },

    _onDrawBox: function()  {

        var onBoxDrawed = function(position) {
            if (position instanceof OpenLayers.Bounds) {
                var bounds;
                var minXY = this.map.getLonLatFromPixel(
                            new OpenLayers.Pixel(position.left, position.bottom));
                var maxXY = this.map.getLonLatFromPixel(
                            new OpenLayers.Pixel(position.right, position.top));
                bounds = new OpenLayers.Bounds(minXY.lon, minXY.lat,
                                               maxXY.lon, maxXY.lat);
                this.scope._onBoxDrawed.apply(this.scope,[bounds]);
            }
        };

        if (this.map) {

            this._boxctrl = new OpenLayers.Control.ZoomBox({scope: this,keyMask: undefined, zoomBox: onBoxDrawed});
            this.map.addControl(this._boxctrl);
            this._boxctrl.activate();
        }
    },

    _onBoxDrawed: function(bounds) {
        bounds.transform(this.map.baseLayer.projection,
                        new OpenLayers.Projection("epsg:4326"));

        var form = this.getForm();
        form.setValues({
                "bbox-w": bounds.left,
                "bbox-s": bounds.bottom,
                "bbox-e": bounds.right,
                "bbox-n": bounds.top
        });

        this.map.removeControl(this._boxctrl);
        this._boxctrl.destroy();
        this.items.get("extent").items.get("bbox_button").toggle(false);
    },

    /**
     * returns structure of groups names
     * @function
     */
    getGroups: function() {
        
        var i,ilen;
        var groups = {};

        var rws = this.getForm().getValues().groups;
        if (rws !== undefined) {
            if (!Array.isArray(rws)) {
                rws = [rws];
            }
            if (rws && rws.length) {
                for (i = 0, ilen = rws.length; i < ilen; i++) {
                    var group = rws[i].split("-");
                    groups[group[0]] = group[1];
                }
            }
        }
        return groups;
    },

    getCheckedLayers: function() {

        var layers = [];

        if (this.map) {

            var ids = this.getForm().getValues().layers;
            if (ids) {
                if (typeof(ids) != "string") {
                    var i,ilen;
                    for (i = 0, ilen = ids.length; i < ilen; i++) {
                        layers.push(this.map.getLayer(ids[i]));
                    }
                }
                else {
                    layers.push(this.map.getLayer(ids));
                }
            }
        }

        return layers;
    },

    _updateLayers: function() {
        var layers = [];
        var i, ilen;

        if (this.map) {
            for (i  = 0, ilen = this.map.layers.length; i<ilen; i++) {
                var layer = this.map.layers[i];
                if (layer.displayInLayerSwitcher) {
                    layers.push({
                        xtype: "checkbox",
                        boxLabel: layer.title||layer.name, 
                        name: "layers", 
                        inputValue: layer.id, 
                        cls: "red",
                        checked: (layer.saveState ? true : false)
                    });
                }
            }

            var laygroup = this.items.get("layers");

            if (laygroup && laygroup.items) {
                while(laygroup.items.length > 0) {
                    laygroup.remove(laygroup.items.get(0));
                }
                laygroup.add(layers);
            }

            this.doLayout();
        }

    },

    setMap: function(map) {
        this.map = map;

        this.map.events.register("addlayer",this, this._updateLayers);
        this.map.events.register("removelayer",this, this._updateLayers);
        this.map.events.register("changelayer",this, this._updateLayers);

        var bbox = map.getExtent();
        bbox.transform(map.baseLayer.projection,
                        new OpenLayers.Projection("epsg:4326"));

        this.getForm().setValues({
                "bbox-w": bbox.left,
                "bbox-s": bbox.bottom,
                "bbox-e": bbox.right,
                "bbox-n": bbox.top
        });

        if (this.rendered) {
            this._updateLayers();
        }

    },

    /**
     * read groups, where the user is registered, from given URL (status
     * manager)
     * @function
     * @private
     */
    _getGroups: function() {
        var request = OpenLayers.Request.GET({
            url: HSLayers.statusManagerUrl,
            //url: "groups.json",
            params: {request: "getGroups"},
            async: false
        });
        var f = new OpenLayers.Format.JSON();
        var result = f.read(request.responseText);

        var groups = [{
                xtype: "fieldcontainer",
                fieldLabel: "&nbsp;",
                labelWidth: 175,
                labelSeparator:"",
                layout: {
                    type: "hbox",
                    align: "stretch"
                },
                items: [
                        { xtype: "label",flex:1,text: OpenLayers.i18n('Read')},
                        { xtype:"label",flex:1,text:OpenLayers.i18n("Write")}
                ]
            },
            {
                xtype: 'fieldcontainer',
                layout: {
                    type: 'hbox',
                    align: "stretch"
                },
                labelWidth: 175,
                name: "groups",
                fieldLabel: OpenLayers.i18n("Public"),
                items: [
                    {
                        xtype:"checkbox",
                        flex:1,
                        name:"groups",
                        inputValue: "guest-r"
                    },
                    {
                        xtype:"checkbox",
                        disabled: true,
                        flex:1,
                        name:"groups",
                        inputValue: "guest-w"
                    }
                ]
            }
        ];
        if (result.success) {
            var i,ilen;
            for (i = 0, ilen = result.result.length; i < ilen; i++) {
                var g = result.result[i];
                if (g.roleName == "guest") {
                    continue;
                }
                var group = {
                    xtype: 'fieldcontainer',
                    layout: {
                        type: 'hbox',
                        align: "stretch"
                    },
                    labelWidth: 175,
                    name: "groups",
                    fieldLabel: OpenLayers.i18n(g.roleTitle),
                    items: [
                        {
                            xtype:"checkbox",
                            flex:1,
                            name:"groups",
                            inputValue: g.roleName+"-r"
                        },
                        {
                            xtype:"checkbox",
                            flex:1,
                            name:"groups",
                            inputValue: g.roleName+"-w"
                        }
                    ]
                };
                groups.push(group);
            }
        }

        return groups;
    },

    setContext: function(context) {
        this.getForm().setValues(context);
    }
});
