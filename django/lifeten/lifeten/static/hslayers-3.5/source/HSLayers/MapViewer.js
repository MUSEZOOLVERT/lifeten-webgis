/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
 *
 * This file is part of HSLayers.
 *
 * HSLayers is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * HSLayers is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 *  See http://www.gnu.org/licenses/gpl.html for the full text of the 
 *  license.
 */
Ext.namespace("HSLayers.MapViewer");

/**
 * MapViewer consists of {@link HSLayers.MapPanel}, {@link HSLayers.Printer}, {@link HSLayers.OWSPanel} and other tools.  It is derived from Ext.Panel with border layout. By default, the central panel will contain the map, east panel is going to be used for other tools, such as LayerSwitcher, InfoPanel, OWSPanel and other tools.
 *
 * @class HSLayers.MapViewer
 * @see http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Panel
 *
 * @constructor
 * @param {Object} config
 * @param {String} [config.layout = "border"]
 * @param {Object} [config.mapPanelCfg]  configuration of the :js:class:`HSLayers.MapPanel` object
 * @param {Object} [config.infoPanelCfg] configuration for :js:class:`HSLayers.InfoPanel` object
 * @param {Object} [config.layerSwitcherCfg] configuration for :js:class:`HSLayers.LayerSwitcher` object
 * @param {Object} [config.owsCfg] configuration for :js:class:`HSLayers.OWSPanel` object
 * @param {Object} [config.wmcManagerCfg] configuration for :js:class:`HSLayers.WMCManager` object
 *
 * @example 
 *  var mapViewer = new HSLayers.MapViewer({
 *          region:"center",
 *          switchPanels: false
 *      });
 *      var map = new OpenLayers.Map(mapViewer.mapPanel.body.dom.id);
 *      mapViewer.setMap(map);
 *
 */
HSLayers.MapViewer= function(config) {

    // set url parameters
    this.params = OpenLayers.Util.getParameters();

    // depandances
    if (!config) {
        config = {};
    }

    config.layout = "border";

    this.title = config.title || OpenLayers.i18n("");
    config.title = undefined;

    if (!config.items) {
        this.items = [];
    }
    else {
        this.items = config.items;
    }


    if (!config.panels) {
        config.panels = ["layerSwitcher", "infoPanel", "owsPanel"];
    }



    this.resetLayers = [];

    // call parent constructor
    HSLayers.MapViewer.superclass.constructor.call(this, config);

};

Ext.extend(HSLayers.MapViewer, Ext.Panel, {
    
   /**
    * Panel with the map
    * @field
    * @name HSLayers.MapViewer.mapPanel
    * @type HSLayers.MapPanel
    */
   mapPanel : null,

   /**
    * Panel title
    * @name HSLayers.MapViewer.title
    */
   title: null,

   /**
    * indicates, if the layerswitcher panel was already focused
    * @private
    */
   _lsfocussed: false,

    /**
     * wmcManager instance
     * @name HSLayers.MapPanel.wmcManager
     * @type {HSLayers.WMCManager}
     */
    wmcManager : null,

   /**
    * Panel for map tools, like LayerSwitcher, InfoBox, WMS clients and so on
    * @name HSLayers.MapViewer.toolsPanel
    * @see http://docs.sencha.com/ext-js/3-4/#!/api/Ext.TabPanel
    */
   toolsPanel : null,

   /**
    * Information panel
    * @name HSLayers.MapViewer.infoPanel
    * @type HSLayers.InfoPanel
    */
   infoPanel : null,

   /**
    * WMC file dialog 
    * @name HSLayers.MapViewer.wmcFileDialog
    * @type HSLayers.FileDialog
    */
   wmcFileDialog : null,

   /**
    * Panel for Open Web Services (OWS), like WMS, WFS and others
    * @name HSLayers.MapViewer.owsPanel
    * @type HSLayers.OWSPanel
    */
   owsPanel : null,

   /**
    * The map  object use the {setMap} method for setting this attribute
    * @name HSLayers.MapViewer.map
    * @see http://dev.openlayers.org/releases/OpenLayers-2.11/doc/apidocs/files/OpenLayers/Map-js.html
    */
   map: null,

   /**
    * List of items
    * @name HSLayers.MapViewer.items
    * @type array
    */
   items: null,

    /**
     * Can we switch to layerswitcher and other panels automatically?
     * @name HSLayers.MapViewer.switchPanels
     * @type Boolean
     * @default true
     */
    switchPanels: true,

    /**
     * New added layers
     * @name HSLayers.MapViewer.resetLayers
     * @type [{OpenLayers.Layer}]
     */
    resetLayers: null,

    /**
     * LayerSwitcher object
     * @name HSLayers.MapViewer.layerSwitcher
     * @type HSLayers.Control.LayerSwitcher
     */
    layerSwitcher: null,

    /**
     * context title text item in the toolbar
     * @name HSLayers.MapViewer.titleItem
     * @type HSLayers.Control.titleItem
     */
    titleItem: null,

    /**
     * Default action, when WMC arrives via URL
     * @name HSLayers.MapViewer.wmcaction
     * @type String
     * @default dialog
     */
    wmcaction : "dialog",

    /**
     * URL Parameters
     * @name HSLayers.MapViewer.params
     * @type {Object}
     */
    params : null,

    /**
     * overwrite local map context with new WMC
     * object with following keys
     *  - newLayers     -- add new layers to map
     *  - oldLayers     -- set attributes of existing layers (visibility, transparency, ...)
     *  - extent        -- zoom context extent
     *  - title         -- set map title
     *  - context       -- set this context as opend file
     *  - removeLayers  -- remove added layers
     *  - mapProjection -- set projection of the map
     *  - all           -- all above
     * @name HSLayers.MapViewer.overwriteLocalMapContext
     * @type {Object}
     */
    overwriteLocalMapContext: {},

    /**
     * handler of the new layer add event
     * @private
     * @param {Event} evt
     */
     onaddLayer: function(e) {
        var layer = e.layer;
        if (layer.displayInLayerSwitcher) {
            this.toolsPanel.layout.setActiveItem(0);
            this.resetLayers.push(e.layer);
        }
     },

    /**
     * handler of the new layer removed event
     * @private
     * @param {Event} evt
     */
     onRemoveLayer: function(e) {
        var layer = e.layer;

        if (this.resetLayers.indexOf(layer) > -1) {
            this.resetLayers.remove(layer);
        }

     },


    /**
     * open wmc
     * @name HSLayers.MapViewer.openWMCFromURL
     * @function
     * @param {String} url url where to get the WMC from
     * @param {String} action one of "dialog","owerwrite","add" default: :attr:`wmcaction`
     */
    openWMCFromURL: function(url,action) {
        
        // predefine the opening function
        var openWMC = function(result) {
            if (result === "cancel"){
                return;
            }

            this.overwriteLocalMapContext = (result == "yes" ? 
                    {
                        newLayers: true,
                        oldLayers: true,
                        extent:true,  
                        title:true, 
                        context:true,
                        removeLayers: true,
                        mapProjection: true
                    } :
                    {
                        newLayers: true,
                        oldLayers: false,
                        extent:false,  
                        title:false, 
                        context:false,
                        removeLayers: false,
                        mapProjection: false
                    });

            if (this.wmcManager)  {
                this.wmcManager.reset();
            }

            OpenLayers.Request.GET({
                url: url,
                params: {_rand: Math.random()},
                scope:this,
                success: function(r){this.parseWMC(r.responseText);},
                failure: function(xhr) {
                    Ext.Msg.alert(OpenLayers.i18n("WMC Failed"),
                                  OpenLayers.i18n("We are sorry, required map composition could not be loaded. <br/> Status: ${status} statusText: ${statusText}",xhr));
                }
            });
        };

        // get the desired action
        action = action || this.wmcaction;
        
        if (action == "dialog") {
            Ext.MessageBox.show({
                title: OpenLayers.i18n('Overwrite existing map?'),
                msg: OpenLayers.i18n("Overwrite current map content with new map composition?"),
                buttons: {"yes":OpenLayers.i18n("Overwrite map"),"no":OpenLayers.i18n("Add to map"),"cancel":true},
                fn: openWMC,
                scope:this,
                animEl: 'mb4',
                icon: Ext.MessageBox.QUESTION
            });
        }
        else if (action == "overwrite") {
            openWMC.apply(this,["yes"]);
        }
        else if (action == "append") {
            openWMC.apply(this,["no"]);
        }
    },


    /**
     * set this map object
     * @function
     * @name HSLayers.MapViewer.setMap
     * @param {OpenLayers.Map}
     */
   setMap: function(map) {
       this.map = map;

       if (this.mapPanel) {
           this.mapPanel.setMap(map);
       }
       if (this.owsPanel) {
           this.owsPanel.setMap(map);
       }


       if (this.wmcManager) {
           this.wmcManager.setMap(map);
       }

       if (this.layerSwitcher) {
           this.layerSwitcher.setMap(map);
       }

       if (this.map.metadata) {
           this.map.metadata.events.register("change",this,function() {
               this.setTitle(this.map.metadata.title);
           });
       }


       //map.events.register("preaddlayer",this,this.checkduplicates);
   },

    /**
     * Init WMC buttons in the toolbar
     * @private
     * @function
     * @name HSLayers.MapViewer._initWMCButtons
     */
    _initWMCButtons: function() {


        this.titleItem = new Ext.Toolbar.TextItem({
                style:"font-weight: bold",
                text: this.title
            });

        this.mapPanel.getTopToolbar().insert(0, this.titleItem);
    },

    /**
     * Restart map project, create new map context
     * @function
     * @name HSLayers.MapViewer.newContext
     */
    newContext: function() {

            // for each layer from resetLayers array
            while(this.resetLayers.length) {

                // if the layer has map attribute as this.map, remove it
                if (this.resetLayers[this.resetLayers.length-1].map == this.map) {
                    this.map.removeLayer(this.resetLayers[this.resetLayers.length-1]);
                }
                // remove the layer from resetLayers array -> not
                // necessary, this is done through event
                // this.resetLayers.remove(this.resetLayers[this.resetLayers.length-1]);
            }
            this.resetLayers = [];

            this.map.metadata.set({title: "",
                                    abstract: "",
                                    keywords: ""});
            this.map.setNewUuid();

            this.map.user.set({
                name: "",
                organization: "",
                position: "",
                address: "",
                city: "",
                state: "",
                postalcode: "",
                country: "",
                phone: "",
                email: "",
                url: ""
            });
    },

    
    /**
     * Call this method, after the map is fully initilalized
     * @function
     * @name HSLayers.MapViewer.mapInitialized
     */
    mapInitialized: function() {
        if (this.map) {
            this.map.events.unregister("addlayer",this,this.onaddLayer);
            this.map.events.register("addlayer",this,this.onaddLayer);
            this.map.events.register("removelayer",this,this.onRemoveLayer);
            
            for (var i = 0, len = this.map.layers.length; i < len; i++) {
                this.map.layers[i]._isBaseContextLayer = true;
            }
        }
    },

    /**
     * @private
     * @deprecated
     * @name HSLayers.MapViewer.afterInit
     */
    afterInit : function () {
        OpenLayers.Console.log("afterInit method is deprecated and should no longer be used. Use mapInitialized instead"); 
        this.mapInitialized(arguments);
    },

    /**
     * parse WMC context
     * @function
     * @name HSLayers.MapViewer.parseWMC
     */
     parseWMC:  function(r){
        
        // list of layers
        var layers;
        // wmc parser
        var wmcParser = new HSLayers.Format.WMC(); 
        // wmc content
        var wmc = wmcParser.read(r, {});
       
        // indicates, weather projection of the map AND context are the
        // same
        var sameProj = this.map.getProjectionObject().equals(new OpenLayers.Projection(wmc.projection));
        if (sameProj === false) {
            this.overwriteLocalMapContext.all = false;
            this.overwriteLocalMapContext.extent = false;
        }

        this.newContext();

         if (this.overwriteLocalMapContext.context || this.overwriteLocalMapContext.all){
            this.wmcManager.setContext(wmc);

            if (wmc.uuid && wmc.uuid.search("OpenLayers") < 0) {
                this.wmcManager.setUUID(wmc.uuid);
            }
         }
         if (this.overwriteLocalMapContext.title || this.overwriteLocalMapContext.all){
            this.setTitle(wmc.title || OpenLayers.i18n(""));
         }

 
        if (wmc.baseLayersIncluded &&
            (this.overwriteLocalMapContext.all || this.overwriteLocalMapContext.oldLayers)) {
            var baseLayers = this.map.getLayersBy("displayInLayerSwitcher",true);
            for (var i = 0; i < baseLayers.length; i++) {
                if (baseLayers[i]._isBaseContextLayer) {
                    baseLayers[i].setVisibility(false);
                }
            }
        }
 
         layers = wmcParser.getLayersFromContext(wmc.layersContext);
         for(var i=0;i<layers.length;i++){
             var layersByName = this.map.getLayersByName(layers[i].name);
             var layerInMap = false;
             for (var j = 0; j < layersByName.length; j++) {
                 if (layersByName[j].url == layers[i].url && 
                     (layersByName[j].params && layersByName[j].params.LAYERS == layers[i].params.LAYERS)) {
                     layerInMap = true;
                 }
 
                 if (layersByName[j].context && layersByName[j].context.url == layers[i].url) {
                     layerInMap = true;
                 }
 
                 if (layerInMap === true) {
                     layersByName[j].setVisibility(layers[i].visibility);
                     layersByName[j].setOpacity(layers[i].opacity);
                 }
             }
 
             // add new layer to the map
             if (layerInMap === false) {
                 // always work with HSL.Layer.OWS type of layer
                 var newLayer = layers[i];
                 if (sameProj === false) {
                    newLayer.options.maxExtent = undefined;
                    newLayer.options.numZoomLevels = undefined;
                    newLayer.maxExtent = undefined;
                    newLayer.numZoomLevels = undefined;
                 }

                 // convert all  OpenLayers.Layer.WMS to warp-enabled HSLayers.Layer.WMS
                 if (layers[i].CLASS_NAME == "OpenLayers.Layer.WMS") {

                    newLayer.options.ratio = 1
                    newLayer.options.singleTile = true;
                    if (!newLayer.params.FORMAT) {
                        newLayer.params.FORMAT = "image/png";
                    }
                    newLayer = new HSLayers.Layer.WMS(newLayer.name,
                            newLayer.url,
                            newLayer.params,
                            newLayer.options
                            );
                 }
                 newLayer.removable=true;

                 // fix missing projetion
                 if (!newLayer.projection){
                     newLayer.projection = new OpenLayers.Projection(wmc.projection);
                 }
                 this.map.addLayer(newLayer);
             }
         }
 
         if (this.overwriteLocalMapContext.extent || this.overwriteLocalMapContext.all) {
            this.map.zoomToExtent(wmc.bounds,true);
         }
         this.overwriteLocalMapContext = {};

         if (wmc.layerStructure) {
             this.layerSwitcher.logicalPanel.setStructure(wmc.layerStructure);
         }

         this.fireEvent("wmcparsed");
     },
     


    /**
     * Set title of this project
     * @function
     * @name HSLayers.MapViewer.setTitle
     * @param {String} title
     */
    setTitle: function(title) {
        if (title) {
            this.title = title;
            this.map.title = title;
            this.titleItem.setText(this.title);
        }
        else {
            this.title = title;
            this.titleItem.setText('');
            this.map.title = title;
        }
    },

    /**
     * initComponents
     * @private
     */
    initComponent: function() {

        var config = {};

        config.items = [];

        // layerSwitcher
        var layerSwitcherCfg = {};
        Ext.apply(layerSwitcherCfg, Ext.apply(this.initialConfig.layerSwitcherCfg || {}, 
                    {
                        title: OpenLayers.i18n("Layers"),
                        header:false,
                        listeners: {
                            getcapabilitiesclicked: this._onGetCapabilitiesClicked,
                            scope: this
                        }
                    }
            )); 
        this.layerSwitcher = new HSLayers.LayerSwitcher(layerSwitcherCfg);
        config.items.push(new Ext.Panel({
                                helpLink: this.layerSwitcher.helpLink,
                                title: this.layerSwitcher.title,
                                items:[this.layerSwitcher],
                                layout:"fit"
                            }));

        // info panel
        var infoPanelCfg = {};
        Ext.apply(infoPanelCfg, Ext.apply(this.initialConfig.infoPanelCfg)); 
        this.infoPanel = new HSLayers.InfoPanel(infoPanelCfg);
        config.items.push(this.infoPanel);

        // owsPanel
        var owsCfg = {};
        Ext.apply(owsCfg, Ext.apply(this.initialConfig.owsCfg || {})); 
        this.owsPanel = new HSLayers.OWSPanel(owsCfg);
        this.initialConfig.owsPanel = this.owsPanel;
        config.items.push(this.owsPanel);

        // mapPanel
        var mapPanelCfg = this.initialConfig.mapPanelCfg || {};
        mapPanelCfg.region = "center";
        mapPanelCfg.style = {"min-width":"600px"};
        this.mapPanel = new HSLayers.MapPanel(mapPanelCfg);

        // WMCManager
        var wmcManagerCfg = this.initialConfig.wmcManagerCfg || {
                height:400,
                width: 450, 
                scope: this,
                autoScroll: true,
                frame:true
        };
        wmcManagerCfg.scope = wmcManagerCfg.scope || this;
        if (HSLayers.WMCManager) {
            this.wmcManager = new HSLayers.WMCManager(wmcManagerCfg);
            this.wmcManager.on("saved",this._onWMCSaved, this);
            this.wmcManager.on("set",this._onWMCSaved, this);
            this.wmcManager.modifyContext = function(context) {
                context.extension.layerStructure = OpenLayers.Format.JSON.prototype.write(
                        this.layerSwitcher.logicalPanel.getStructure());
                return context;
            };
        }

        // display the WMC window and hide it again - as fast as possible (so
        // we can render the logo)
        // FIXME - better to store logoURL some other way
        // this.wmcManager._window.hide();
        // initialize WMC buttons
        this._initWMCButtons();

        // toolsPanel
        //this.toolsPanel = new Ext.Panel({region:"east",
        //        layout:"accordion",
        //        layoutConfig: {
        //            animate: false,
        //            autoWidth: false
        //        },
        //        width:"30%",
        //        split:true,
        //        collapseMode : undefined,
        //        collapsible:true,
        //        deferredRender: false,
        //        activeItem: 0,
        //        items: config.items,
        //        listeners: {
        //            "add":this._onAddItem,
        //            "scope":this
        //            }
        //});

        this.toolsPanel  = new HSLayers.MapViewer.ToolsPanel({
                region:"east",
                width:"30%",
                split:true,
                collapseMode : undefined,
                collapsible:true,
                deferredRender: false,
                collapsed: this.params.panel && this.params.panel== "false" ? true : false,
                activeItem: 0,
                items: config.items
        });


        // overwriting config.items
        config.items = [this.mapPanel,this.toolsPanel];

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 

        HSLayers.MapViewer.superclass.initComponent.apply(this, arguments);

        this.addEvents("wmcparsed");
    },

    /**
     * item added, make it undockable
     * @private
     */
    //_onAddItem: function(container,component,index) {

    //    // make component dockable
    //    if (container == this.toolsPanel || !this.toolsPanel) {
    //        component.makeDockable();

    //        // create array with ordered components
    //        if (container._origItemsOrder === undefined) {
    //            container._origItemsOrder = [];
    //        }

    //        // insert component into propper place in the array of
    //        // components
    //        if (component._itemNumber === undefined) {
    //            container._origItemsOrder.splice(
    //                container.items.findIndex("id",component.id),
    //                0, component);
    //        }
    //    }
    //    for (var i = 0; i < container.items.length; i++) {
    //        console.log(container.items.get(i).title);
    //    }

    //    component.on("activate",function(p) {
    //        if (!this._lastActivate) {
    //            this._lastActivate = [];
    //        }
    //        this._lastActivate = p;
    //    },container);
    //    //component.id:"unpin", handler: this.undock, scope:this, hidden:true, 
    //},

    /**
     * @private
     */
    _onWMCSaved: function(){
        this.setTitle(this.wmcManager.context.title);
        this.wmcManager._window.hide();
    },

    /**
     * @private
     */
    _onGetCapabilitiesClicked: function(evt){
        this.toolsPanel.layout.setActiveItem(this.owsPanel.id);
        this.owsPanel.urlTextField.setValue(evt.url);
        this.owsPanel.serviceField.setValue(evt.service);
        this.owsPanel.connect(evt.url, evt.service);
    },

   CLASS_NAME:"HSLayers.MapViewer"
});

