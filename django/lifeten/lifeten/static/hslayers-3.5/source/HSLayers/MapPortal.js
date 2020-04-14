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
Ext.namespace("HSLayers.MapPortal");

/**
 * MapPortal is complete Portal application, based on Ext.ViewPort and
 * MapViewer
 * 
 * @class HSLayers.MapPoprtal
 * @augments HSLayers.MapViewer
 *
 * @constructor
 * @param {object} config configuration
 * @param {object} config.mapPanelConfig configuration of the {@link HSLayers.MapPanel}
 * @param {object} config.mapOptions configuration options for <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>
 * @param {String[]} projections list of supported projections
 *
 * @example 
 *  var mapPortal = new HSLayers.MapPortal(
 *       mapOptions: { // configuration of the OpenLayers.Map object
 *                 units:"m",
 *                 maxExtent: new OpenLayers.Bounds(-3480301.25,4028802,5009377,12515546),
 *                 projection:"epsg:900913",
 *                 scales:[50000000,20000000,10000000,5000000,2000000,1000000,500000,200000,100000,50000,20000,10000]
 *             },
 *             projections: ["epsg:900913","epsg:4326"]
 *         });
 *  mapPortal.map.addLayers(new OpenLayers.Layer.WMS("Name","url",...));
 *  mapPortal.map.zoomToMaxExtent();
 *          
 */
HSLayers.MapPortal = function(config) {

    // depandances
    if (!config) {
        config = {};
    }
    if (!config.mapPanelConfig) {
        config.mapPanelConfig = {};
    }
    if (!config.mapPanelConfig.onSearch) {
        config.mapPanelConfig.onSearch = this.searchGeoNames;
        config.mapPanelConfig.scope = this;
    }

    config.controls = config.controls || ["PanZoomBar", "ScaleSwitcher",
                                          "ScaleLine", "MousePosition",
                                          "Attribution", "Permalink"];

    config.controls.splice(0,0,"panel");

    this.initBus = new HSLayers.InitBus();

    // call parent constructor
    HSLayers.MapPortal.superclass.constructor.call(this, config);

    Ext.QuickTips.init();
};

Ext.extend(HSLayers.MapPortal, HSLayers.MapViewer, {
    
   /**
    * toolbar in the map, for various OpenLayers.Controls 
    * @name HSLayers.MapPortal.mapToolBar
    * @type `OpenLayers.Control.Panel <http://dev.openlayers.org/apidocs/files/OpenLayers/Control/Panel-js.html>`_
    */
   mapToolBar : null,
    
   /**
    * initBus
    * @name HSLayers.MapPortal.initBus
    * @type HSLayers.InitBus
    */
   initBus : null,

   /**
    * select vector feature
    * @name HSLayers.MapPortal.selectFeatureControl
    * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/SelectFeature-js.html">OpenLayers.Control.SelectFeature</a>
    */
   selectFeatureControl : null,

   /**
    * readState control
    * @name HSLayers.MapPortal.readStateControl
    * @type HSLayers.Control.ReadState
    */
   readStateControl : null,

   /**
    * saveState control
    * @name HSLayers.MapPortal.saveStateControl
    * @type HSLayers.Control.SaveState
    */
   saveStateControl : null,

   /**
    * project name used for status storing/restoring
    * @name HSLayers.MapPortal.project
    * @type string
    */
   project : undefined,

   /**
    * vector layer - for temporary drawings, like measuring and so on
    * @name HSLayers.MapPortal.vectorLayer
    * @type `OpenLayers.Layer.Vector <http://dev.openlayers.org/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
    */
   vectorLayer : null,

   /**
    * vector layer - for temporary drawings, like measuring and so on and UserGraphics control
    * @name HSLayers.MapPortal.userGraphicsLayer
    * @type `OpenLayers.Layer.Vector <http://dev.openlayers.org/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
    */
   userGraphicsLayer : null,


   /**
    * marker layer - for temporary drawings, like measuring and so on
    * @name HSLayers.MapPortal.markerLayer
    * @type `OpenLayers.Layer.Vector <http://dev.openlayers.org/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
    */
   markerLayer : null,

   /**
    * original projection of the map
    * @name HSLayers.MapPortal.origProjection
    * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Projection-js.html">OpenLayers.Projection</a>
    */
   origProjection : null,

   /**
    * use the {setMap} method for setting this attribute
    * @name HSLayers.MapPortal.map
    * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>
    */
   map: null,

   /**
    * Cities grid with search results
    * @name HSLayers.MapPortal.citiesGrid
    * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.grid.GridPanel">Ext.grid.GridPanel</a>
    */
   citiesGrid: null,

   /**
    * indicates, if state already arrived to map
    * @name HSLayers.MapPortal._stateArrived
    * @type Boolean
    * @private
    */
   _stateArrived: true,

   /**
    * @name HSLayers.MapPortal.queryHandlerClass
    * @type {OpenLayers.Handler}
    */
   queryHandlerClass: OpenLayers.Handler.Box,

   /**
    * reference to various OpenLayers.Control.* instances in the map, which are available in every mapportal
    * @name HSLayers.MapPortal.mapControls
    * @type {Object}
    */
   mapControls: undefined,

   /**
    * list of controls, to be added to the map (see mapControls)
    * @name HSLayers.MapPortal.controls
    * @type [{String}]
    * @default ["Panel","PanZoomBar", "ScaleSwitcher", "ScaleLine", "MousePosition", "Attribution", "Permalink", "Print"]
    */
   controls: undefined,

   /**
    * @name HSLayers.MapPortal._printDialog
    * @type HSLayers.MapPortal.Print.PrintDialog
    */
   _printDialog: undefined,

   /**
    * layer added, this.markerLayer and this.vectorLayer have alwyas to be
    * on the top
    * @private
    * @function
    * @name HSLayers.MapPortal._onLayerAdded
    */
   _onLayerAdded: function(e) {
        var layer = e.layer;

        // add layer to OpenLayers.Control.SelectFeature
        if (layer instanceof OpenLayers.Layer.Vector && 
            layer.name.search('OpenLayers.Handler') === -1 &&
            (layer != this.selectFeatureControl.layer) &&
            (layer._selectFeature !== false)) {
            var layers = [];
            for (var i = 0, len = this.selectFeatureControl.layers.length; i < len; i++) {
                layers.push(this.selectFeatureControl.layers[i]);
            }
            layers.push(layer);
            this.selectFeatureControl.setLayer(layers);
        }
        return;
   },

   /**
    * layer removed
    * @private
    * @function
    * @name HSLayers.MapPortal._onLayerAdded
    */
    _onLayerRemoved: function(e) {
            var layer = e.layer;

            if (layer != this.selectFeatureControl.layer) {
                var layers = this.selectFeatureControl.layers;

                var idx = layers.indexOf(layer);

                if (idx > -1) {
                    layers.splice(idx, 1);
                }

                this.selectFeatureControl.setLayer(layers);
            }
            
    },

    /**
        * clear data in working layers
        * @function
        * @private
        * @name HSLayers.MapPortal.clearMap
        */
        clearMap: function() {

            for (var i =0; i < this.map.popups.length; i++) {
                this.map.removePopup(this.map.popups[i]);
            }
            this.vectorLayer.destroyFeatures(this.vectorLayer.features);
            this.markerLayer.destroyFeatures(this.markerLayer.features);
            // clear every HSLayers.Layer.MapServer
            for (var j = 0; j < this.map.layers.length; j++) {
                var layer = this.map.layers[j];
                if (layer instanceof HSLayers.Layer.TreeLayer) {
                    layer.params.savequery = 2;
                    layer.redraw(true);
                    layer.params.savequery = undefined;
                }
            }
        },

        /**
        * Search in GeoNames
        * @function
        * @name HSLayers.MapPortal.searchGeoNames
        * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Field">Ext.form.Field</a>} field
        */
        searchGeoNames: function(field) {
            OpenLayers.Request.GET({
                url: "http://ws.geonames.org/search",
                params: {name: (field.getValue ? field.getValue() : field.value)},
                success: this.geoNamesSearched,
                scope: this,
                failure: this.geoNamesSearched
            });
        },

        /**
        * Parse the geonames
        * @function
        * @name HSLayers.MapPortal.geoNamesSearched
        * @param {HTTPRequest} req
        */
        geoNamesSearched: function(req) { try {
            
            this.toolsPanel.layout.setActiveItem(this.infoPanel.id);
            this.infoPanel.clear();

            // create the data object and add markers to the map
            var data = [];

            var features = HSLayers.Util.geoNamesParser(req.responseXML,
                    this.map.projection);


            this.markerLayer.destroyFeatures();

            var featureId = 1;
            var extn = this.map.initialExtent ? this.map.initialExtent : 
                    (this.map.restrictedExtent ? this.map.restrictedExtent : 
                        this.map.maxExtent);
            for (var i = 0; i < features.length; i++) {
                var lonlat = new OpenLayers.LonLat(features[i].geometry.x, features[i].geometry.y);
                if (extn.containsLonLat(lonlat)) {
                    features[i].data._HSID = features[i].attributes._HSID = featureId;
                    data.push([features[i].data.name, features[i].lonlat,featureId]);
                    this.markerLayer.addFeatures([features[i]]);
                    featureId = featureId +1;
                }
            }
            this.map.zoomToExtent(this.markerLayer.getDataExtent());

            // the store object
            var store = new Ext.data.SimpleStore({fields: ["name","lonlat","_HSID"],
                    data: data});

            // the grid object
            this.citiesGrid = new Ext.grid.GridPanel({
                    store: store,
                    columns: [
                            {id:'_HSID', header: "#", width: 20, sortable: false, dataIndex: '_HSID'},
                            {id:'name', header: "Name", width: 200, sortable: true, dataIndex: 'name'}
                        ],
                    sm: new Ext.grid.RowSelectionModel({singleSelect:true,listeners:{"rowselect": this.onRecordSelected}}),
                    title:"Search results from GeoNames" });

            // doLayout
            this.infoPanel.add(this.citiesGrid);
            this.infoPanel.doLayout();

        }catch(e){console.log(e)}},

        /**
        * Parse the html response
        * @function
        * @name HSLayers.MapPortal.microFormatsSearched
        * @param {HTTPRequest} req
        */
        microFormatsSearched: function(req) { try {
            
            this.toolsPanel.layout.setActiveItem(this.infoPanel.id);
            this.infoPanel.clear();

            this.infoPanel.body.update(req.responseText);
            var features = HSLayers.Util.geoMicroformatParser(this.infoPanel.body.dom,this.origProjection,this.map.getProjection()); 
            this.addFeaturesToMap(features);
        }catch(e){console.log(e)}},

        /**
        * Select the record in the table, which coresponds to mouseovered
        * marker
        *
        * @function
        * @name HSLayers.MapPortal.onMarkerGridMouseOver
        * @param {Event} e
        * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Marker-js.html">OpenLayers.Marker</a>} e.object
        */
        onMarkerGridMouseOver : function(e) {
            marker = e.object;
            var idx = this.citiesGrid.store.find("lonlat",marker.lonlat);
            var record = this.citiesGrid.store.getAt(idx);
            this.citiesGrid.getSelectionModel().selectRecords([record],false);
        },

        /**
        * Select the record in the table, which coresponds to mouseovered
        * marker
        *
        * @function
        * @name HSLayers.MapPortal.onMarkerMicroFormatMouseOver
        * @param {Event} e
        * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Marker-js.html">OpenLayers.Marker</a>} e.object
        */
        onMarkerMicroFormatMouseOver : function(e) {
            var feature = this.feature
            //Ext.get(feature.data.elem.parentNode).highlight();
        },

        /**
        * Zoom to particular selected record in the map a nd high light
        * @name HSLayers.MapPortal.onRecordSelected
        * @function
        * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.grid.RowSelectionModel">Ext.grid.RowSelectionModel</a>} sm 
        * @param {Integer} idx
        * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.data.Record">Ext.data.Record</a>} record
        */
        onRecordSelected: function(sm,idx,record) {
            for (var i = 0; i < geoportal.markerLayer.features.length; i++) {
                var feature = geoportal.markerLayer.features[i];

                if (feature.data._HSID == record.data._HSID) {
                    this.map.setCenter(new OpenLayers.LonLat(feature.geometry.x, feature.geometry.y));
                    //Ext.get(feature.div).highlight();
                }
            }
        },

        /**
        * add list of features to map and zoom to them
        * @name HSLayers.MapPortal.addFeaturesToMap
        * @function
        * @param [{OpenLayers.Feature}] features
        */
        addFeaturesToMap: function(features) {
            if (features && features.length) {
                // define the smallest bounding box for founded records
                var extent = new OpenLayers.Bounds(null,null,null,null);

                this.markerLayer.addFeatures(features);

                this.map.zoomToExtent(this.markerLayer.getDataExtent());
            }
        },


        /**
        * Feature selected
        *
        */
        onFeatureSelect: function(event) {

            var feature = event.feature;

            if (!feature.popup) {
                var center = feature.geometry.getCentroid();
                
                var popup = new HSLayers.Popup({
                        lonlat: new OpenLayers.LonLat(center.x, center.y),
                        size: new OpenLayers.Size(250,250),
                        feature: feature,
                        title: feature.data.title,
                        moreInfo: feature.attributes.moreInfo,
                        contentHTML: feature.attributes.description,
                        anchor: null, 
                        closeBox: true, 
                        menu: [
                        { 
                            title: OpenLayers.i18n("Remove"),
                            callback: function(e) {this.feature.layer.removeFeatures([this.feature]); this.map.removePopup(this)}
                        }
                        ],
                        closeBoxCallback: function() {geoportal.selectFeatureControl.unselect(this.feature);}
                    });

                feature.popup = popup;
                this.map.addPopup(popup,true);
            }
        },

        /**
        * Feature unselect
        *
        */
        onFeatureUnselect: function(event) {
            event.feature.popup.hide();
            this.selectFeatureControl.unselectAll();
        },

        /**
        * Set {@link HSLayers.MapPortal.map} object
        *
        * @function
        * @name HSLayers.MapPortal.setMap
        * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
        * @returns None
        */
    setMap: function(map) {
            HSLayers.MapPortal.superclass.setMap.apply(this,arguments);

            this._initLayers();
            this._initControls(this.initialConfig.controls);
            this._initEvents();
            this._initToolTips();

            this.switchPanels = true;
            this.origProjection = (typeof(this.map.getProjection()) == "string" ?
                        new OpenLayers.Projection(this.map.getProjection()) :
                        this.map.getProjection());
        },

    /**
        * handler of the new layer add event - rewritten from MapViewer
        *
        * @param {Event} evt
        */
    onaddLayer: function(e) {
        var layer = e.layer;
        if (layer.displayInLayerSwitcher) {
            if (this._stateArrived) { // + MapPortal
                                    // - MapViewer
                this.toolsPanel.layout.setActiveItem(0);
            }
            this.resetLayers.push(e.layer);
            if (layer.saveState === undefined) {
                layer.saveState = true;
            }
        }
    },


            /**
            * handler of the printer clinced event
            * @private
            * @param {Event} evt
            */
            onPrintClicked: function(e) {
                    if (this._printDialog) {
                        this._printDialog.destroy();
                    }
                    var cfg =  {};
                    OpenLayers.Util.applyDefaults(cfg, this.initialConfig.printCfg || {});
                    OpenLayers.Util.applyDefaults(cfg, {
                        map: this.map,
                        closable: true,
                        width: 400,
                        height: 500,
                        tools: [
                            {
                                id: "help",
                                handler: this._onHelp,
                                scope: this
                            }
                        ],
                        printTemplates: [
                                ["landscapeA4.html", "html", "A4 "+OpenLayers.i18n("landscape")+" (HTML)",[1058,566]],
                                ["landscapeA4.html", "pdf", "A4 "+OpenLayers.i18n("landscape")+" (PDF)",[1058,566]],

                                ["landscapeA3.html", "html", "A3 "+OpenLayers.i18n("landscape")+" (HTML)",[1400,850]],
                                ["landscapeA3.html", "pdf", "A3 "+OpenLayers.i18n("landscape")+" (PDF)",[1400,850]],

                                ["portraitA4.html", "html", "A4 "+OpenLayers.i18n("portrait")+" (HTML)",[700,850]],
                                ["portraitA4.html", "pdf", "A4 "+OpenLayers.i18n("portrait")+" (PDF)",[700,850]],

                                ["portraitA3.html", "html", "A3 "+OpenLayers.i18n("portrait")+" (HTML)",[1058,1325]],
                                ["portraitA3.html", "pdf", "A3 "+OpenLayers.i18n("portrait")+" (PDF)",[1058,1325]]
                        ],
                        printUrl: HSLayers.Print.printerUrl 
                    });
                
                    this._printDialog = new HSLayers.Print.PrintDialog(cfg);

                    this._printDialog.setMap(this.map);
                    //this.toolsPanel.add(this._printDialog);
                    this._printDialog.makeDockable();
                    this._printDialog._ownerCt = this.toolsPanel;
                    this._printDialog.undock();
                    //this.toolsPanel.doLayout();
                    //this.toolsPanel.layout.setActiveItem(this._printDialog.id);
                    //this._printDialog.undock();
            },

            /**
            * initComponent
            * @private
            */
            initComponent: function() {
                var config = {};

                if (!this.initialConfig.mapOptions) {
                    this.initialConfig.mapOptions = {};
                    this.initialConfig.mapOptions.controls = [];
                }
                if (!this.initialConfig.mapOptions.controls){
                    this.initialConfig.mapOptions.controls = [];
                }

                //this.initialConfig.mapOptions.allOverlays = true;

                Ext.apply(this, Ext.apply(this.initialConfig, config)); 
                HSLayers.MapPortal.superclass.initComponent.apply(this, arguments);


                /*
                 * initialize top toolbar buttons
                 */
                // new composition
                var new_button = new Ext.Button({
                    cls : 'x-btn-icon',
                    icon : OpenLayers.Util.getImagesLocation()+'document-new.png',
                    scope: this,
                    handler: function() {

                        var start_new = function(btn) {
                            if (btn != 'yes') {
                                return;
                            }
                            this.newContext();
                            this.map.initialExtent ?
                                this.map.zoomToExtent(this.map.initialExtent) : 
                                    this.map.zoomToMaxExtent();

                            //OpenLayers.Request.GET({
                            //    url: HSLayers.statusManagerUrl,
                            //    params: {
                            //        _salt: Math.random(),
                            //        project: this.project,
                            //        request: "reset",
                            //    },
                            //    success: this.readStateControl.readState,
                            //    scope: this.readStateControl
                            //});
                        };

                        Ext4.Msg.show({
                            title: OpenLayers.i18n("Start new composition?"),
                            msg: "Current map content will be lost. Continue?",
                            buttons: Ext4.Msg.YESNOCANCEL,
                            icon: Ext4.Msg.QUESTION,
                            scope: this,
                            fn: start_new
                        });

                    },
                    tooltip : OpenLayers.i18n("Start new")
                });
                this.mapPanel.getTopToolbar().insert(0,new_button); 

                // add also save and open buttons
                if (HSLayers.statusManagerUrl) {

                    // save
                    var save_button = {
                        cls : 'x-btn-icon',
                        xtype: "splitbutton",
                        icon : OpenLayers.Util.getImagesLocation()+'save.gif',
                        scope:this,
                        handler: this._showSaveContext,
                        tooltip: OpenLayers.i18n("Save map composition"),
                        menu: [
                            {
                                text: OpenLayers.i18n("Save")
                            },
                            {
                                text: OpenLayers.i18n("Save as")
                            }
                        ]
                    };
                    this.mapPanel.getTopToolbar().insert(1,save_button); 
                    
                    // open
                    var open_button = {
                        cls : 'x-btn-icon',
                        icon : OpenLayers.Util.getImagesLocation()+'folder-open.gif',
                        scope:this,
                        handler: this._showOpenContext,
                        tooltip: OpenLayers.i18n("Open map composition")
                    };
                    this.mapPanel.getTopToolbar().insert(2,open_button); 

                }


                
            },



            /**
            * register initBus functions
            * they will be caled one-after-another, when requested
            * @private
            */
            _registerInitBus: function() {

                // 1 - get state
                this.initBus.register(this.readStateControl.getState, 
                                    {
                                        object: geoportal.readStateControl,
                                        "event": "read",
                                        scope: geoportal.readStateControl,
                                        title: OpenLayers.i18n("Restoring map state")
                                    });

                // 2 - permalink
                if (this.mapControls.permalink) {
                    this.initBus.register(this.mapControls.permalink.read,
                                        {
                                            object: this.mapControls.permalink,
                                            "event": "read",
                                            scope: this.mapControls.permalink,
                                            title: OpenLayers.i18n("Getting permalink")
                                        });
                }
                // 3 - wmc
                this.initBus.register(this._parseCompositionFromURL,
                            {
                                object:this,
                                "event":"compositionparsed",
                                scope:this, 
                                title: OpenLayers.i18n("Parsing OGC OWS services")
                            });
                // 4 - ows
                this.initBus.register(this._parseOWS,{scope:this, title: OpenLayers.i18n("Parsing OGC OWS services")});

                // 5 - visible layers
                this.initBus.register(this._parseVisibleLayers,
                            {scope:this, title: OpenLayers.i18n("Parsing visible layers")});
            },

    /**
     * @private
     * @function
     */
    _parseOWS: function() {
        if ("wms" in this.params || "ows" in this.params) {
            this.toolsPanel.layout.setActiveItem(this.owsPanel.id);
            this.owsPanel.connect(this.params.wms,"WMS");

            // there is wmslayers=string in parameter URL
            // add layer to map automatically
            if ("wmslayers" in this.params) {
                // define to_map function
                var to_map = function() {

                    // find node with layer name
                    var layers = (typeof(this.params.wmslayers) == "string"? 
                                    [this.params.wmslayers] :
                                        this.params.wmslayers); 
                    for (var i = 0, ilen = layers.length; i < ilen; i++) { 
                        var node = this.owsPanel.ows.servicesRoot.findChildBy(
                                function(n){
                                    return (n.attributes.serviceAttributes && 
                                        layers[i] == n.attributes.serviceAttributes.name ? 
                                        true : false);
                                },undefined,true);

                        // if node exists, mark it checked and "click" on the To map
                        // button
                        if (node) {
                            node.getUI().checkbox.checked = true;
                        }
                    }
                    if (layers.length) {
                        this.owsPanel.ows.onToMapClicked();
                    }
                    // unregister this function
                    this.owsPanel.ows.un("capabilitiesparsed",to_map , this);
                }
                this.owsPanel.ows.on("capabilitiesparsed",to_map , this);
            }
        }
        else if ("wfs" in this.params) {
            this.toolsPanel.layout.setActiveItem(this.owsPanel.id);
            this.owsPanel.connect(this.params.wfs,"WFS");
        }
        else if ("wcs" in this.params) {
            this.toolsPanel.layout.setActiveItem(this.owsPanel.id);
            this.owsPanel.connect(this.params.wcs,"WCS");
        }
        else if ("kml" in this.params) {
            this.toolsPanel.layout.setActiveItem(this.owsPanel.id);
            this.owsPanel.connect(this.params.kml,"KML");
        }
    },

    /**
     * Parse visible layers, given in the hslayers= parameter in
     * the url
     * @private
     * @function
     */
    _parseVisibleLayers: function() {
        if ("hslayers" in this.params) {
            var i,len;
            var mapLayers = this.map.getLayersBy("displayInLayerSwitcher",true);

            var layerNames = this.params.hslayers;
            if (this.params.hslayers && typeof(this.params.hslayers) == "string") {
                layerNames = [layerNames]; 
            }

            // switch everything visible off
            for (i = 0, len = mapLayers.length; i < len; i++) {
                mapLayers[i].setVisibility(false);
            }

            // set desired layer visibility
            i = 0; len = layerNames.length;
            for (i = 0, len = layerNames.length; i < len; i++) {
                var name = layerNames[i];
                var sublayers = [];
                
                // treelayer
                if (name.search("/") > -1) {

                    // fix layer name
                    var idx = name.search("/");
                    name = name.substr(0,idx);

                    // parse  sublayers
                    var sublayers = layerNames[i].substr(idx+1,layerNames[i].length);
                    sublayers = sublayers.split("|");
                }

                // change layer visibility
                var layers = this.map.getLayersByName(name);
                for (var k = 0, klen = layers.length; k < klen; k++) {
                    layers[k].setVisibility(true);

                    // treelayer sublayers
                    if (sublayers.length > 0 && layers[k] instanceof HSLayers.Layer.TreeLayer) {
                        // handle TreeLayer - but wait, till sublayers are loaded
                        var handleTree = function() {
                                        this.layer.baseGroup.toggleVisibility(false,false);
                                        for (var j = 0, llen = this.sublayers.length; j < llen; j++) {
                                            this.layer.setLayerVisibility(this.sublayers[j],true,false);
                                        }
                                        this.layer.events.unregister("loadend",
                                                this, handleTree);
                                        this.layer.redraw(true);
                                };
                        layers[k].events.register("loadend", {sublayers: sublayers,layer:layers[k]},handleTree );
                    }
                }
            }
        }
    },


    /**
     * @private
     * @function
     */
    _parseCompositionFromURL: function() {

        if ("wmc" in this.params ) {
            this.openWMCFromURL(this.params["wmc"],this.params.wmcaction);
        }
        else {
            this.fireEvent("wmcparsed");
        }

        if ("composition" in this.params ) {
            this.loadCompositionFromURL(this.params["composition"],this.params.action);
        }
        else {
            this.fireEvent("compositionparsed");
        }
    },

    /**
    * initialize map controls
    * @private
    * @param [{String}] controls list of controls
    */
    _initControls: function(controls,config) {
            this.mapControls = {};

            // Initialize user-defined controls
            for (var i = 0; i < controls.length; i++) {
                if (controls[i] instanceof OpenLayers.Control) {
                    this.map.addControl(this.mapControls[i]);
                    continue;
                }
                else {
                    switch(controls[i].toLowerCase()) {
                        case "panel":
                            this.mapToolBar = this.mapControls.panel = new OpenLayers.Control.Panel({displayClass:"hsControlPanel"});
                            this.map.addControl(this.mapControls.panel);
                            break;
                        case "panzoombar":
                            var pzbcfg = this.initialConfig.panZoomBar || {};
                            this.mapControls.panzoombar = new HSLayers.Control.PanZoomBar(pzbcfg);
                            this.map.addControl(this.mapControls.panzoombar);
                            break;
                        case "scaleswitcher":
                            this.mapControls.scaleSwitcher = new HSLayers.Control.ScaleSwitcher({div: this.mapPanel.scaleSwitcherContainer.container.dom});
                            this.map.addControl(this.mapControls.scaleSwitcher);
                            new Ext.ToolTip({target: this.mapControls.scaleSwitcher.div, html: OpenLayers.i18n('Select custom pre-defined scale')});
                            break;
                        case "permalink":
                            this.mapControls.permalink = new HSLayers.Permalink({project: this.project, map:this.map});
                            this.mapControls.permalink.setMap(this.map);
                            this.mapPanel.getTopToolbar().insert(20,this.mapControls.permalink); 
                            break;
                        case "scaleline":
                            this.mapControls.scaleline = new OpenLayers.Control.ScaleLine({
                                div: this.mapPanel.scaleLineContainer.container.dom,
                                bottomOutUnits:"",bottomInUnits:""});
                            this.map.addControl(this.mapControls.scaleline);
                            break;
                        case "mouseposition":
                            this.mapControls.mouseposition = (this.initialConfig.mapOptions.units && this.initialConfig.mapOptions.units != "dd" ?
                                        new OpenLayers.Control.MousePosition({numDigits:1,div: this.mapPanel.positionContainer.el.dom}) : 
                                        new OpenLayers.Control.MousePosition({div: this.mapPanel.positionContainer.el.dom})
                                        );
                            this.map.addControl(this.mapControls.mouseposition);
                            this.mapControls.mouseposition.activate();
                            break;
                        case "attribution":
                            this.mapControls.attribution = new HSLayers.Control.Attribution({
                                div: this.mapPanel.attributionContainer.container.dom,
                                copyrightImage: OpenLayers.Util.getImagesLocation()+"/copyright.gif",
                                logoHeight:50});
                            this.map.addControl(this.mapControls.attribution); 
                            break;

                        case "print":
                            this.mapControls.print = new Ext.Button({
                                    cls : 'x-btn-icon',
                                    //text : OpenLayers.i18n("Open"),
                                    icon : OpenLayers.Util.getImagesLocation()+'printer.png',
                                    scope: this,
                                    handler: function() {this.onPrintClicked()},
                                    tooltip : OpenLayers.i18n("Print")
                                });
                            this.mapPanel.getTopToolbar().insert(3,this.mapControls.print);

                    }
                }
            }
            
            // initialize select feature control
            this.selectFeatureControl = new HSLayers.Control.SelectFeature([this.vectorLayer,this.markerLayer]);
            this.selectFeatureControl.stopClick = false;
            this.selectFeatureControl.stopDown = false;
            this.map.addControl(this.selectFeatureControl);
            this.selectFeatureControl.activate();

            // initialize navigation
            this.mapControls.navigation = new OpenLayers.Control.Navigation({zoomBoxKeyMask: OpenLayers.Handler.MOD_CTRL});
            this.mapControls.navigation.events.register("activate",this,
                                        function(){
                                            this.selectFeatureControl.activate();
                                        }
                                    );
            this.mapControls.navigation.events.register("deactivate",this,
                                        function(){
                                            this.selectFeatureControl.deactivate();
                                        }
                                    );

            // init zoom history control
            this.mapControls.zoomHistory = new OpenLayers.Control.NavigationHistory();
            this.map.addControl(this.mapControls.zoomHistory);

            // add buttons to mapToolBar
            this.mapToolBar.addControls([this.mapControls.navigation,
                                        this.mapControls.zoomHistory.previous,
                                        this.mapControls.zoomHistory.next]);

            // user graphics
            var userGraphicsCfg = OpenLayers.Util.applyDefaults(this.initialConfig.userGraphicsCfg || {}, {
                    layer: this.userGraphicsLayer,
                    editAttributes: false,
                    //layer: this.vectorLayer,
                    featuresGridCfg: {
                        layout: "fit"
                    },
                    editingCfg: {
                        buttons: ["navigation","edit","move","line","polygon"]
                    }
                });

            this.mapControls.userGraphics = new HSLayers.Control.UserGraphics(userGraphicsCfg);

            this.mapControls.userGraphics.events.register("activate",this,function(e) {
                var grid = this.mapControls.userGraphics.getGrid();
                grid.makeDockable();
                this.toolsPanel.add(grid);
                this.toolsPanel.doLayout();
                this.toolsPanel.layout.setActiveItem(grid.id);
            });

            this.mapControls.userGraphics.events.register("deactivate",this,function(e) {
                var grid = this.mapControls.userGraphics.getGrid();
                this.mapPanel.infoContainer.update("");
                this.toolsPanel.remove(grid);
                this.toolsPanel.doLayout();
                this.toolsPanel.layout.setActiveItem(0);
            });

            this.mapToolBar.addControls([ this.mapControls.userGraphics]);

            // init query control
            this.mapControls.query = new HSLayers.Control.Query({
                        horizontal:false,
                        displayClass: "hsControlQuery",
                        handlerClass: this.queryHandlerClass,
                        scope:this,
                        onInfo: function() {
                            this.toolsPanel.layout.setActiveItem(this.infoPanel.id);
                            var features = HSLayers.Util.geoMicroformatParser(
                                        this.infoPanel.body.dom,
                                        this.origProjection,
                                        this.map.getProjection()
                                    ); 
                            this.addFeaturesToMap(features);
                        }
            });
            this.mapToolBar.addControls([this.mapControls.query]);

            // add pin button
            //this.mapControls.pin = new HSLayers.Control.Pin({
            //    layer: this.markerLayer,
            //    displayClass:"hsControlAddPin" 
            //});
            //this.mapToolBar.addControls([this.mapControls.pin]);

            // init read and write state controls
            this.readStateControl = new HSLayers.Control.ReadState(HSLayers.statusManagerUrl,{project: this.project});
            this.saveStateControl = new HSLayers.Control.SaveState(HSLayers.statusManagerUrl,{project: this.project});
            this.map.addControl(this.readStateControl);
            this.map.addControl(this.saveStateControl);

            // projections
            if (this.initialConfig.projections && this.initialConfig.projections.length > 0) {
                this._initProjections();
            }

            // activate navigation control
            this.mapControls.navigation.activate();
        },

        /**
        * add default layers to the map
        * @function
        * @name HSLayers.MapPortal._initLayers
        * @private
        */
        _initLayers: function() {

            //this.baseLayer = HSLayers.Util.getBaseLayer(
            //        this.initialConfig.mapOptions.sphericalMercator,
            //        this.map.maxExtent,
            //        this.map.resolutions,
            //        this.map.scales
            //    );

            this.userGraphicsLayer = new OpenLayers.Layer.Vector("User graphics",
                    {
                        isBaseLayer: false,
                        title: OpenLayers.i18n("User graphics"),
                        displayInLayerSwitcher: false,
                        saveState: true,
                        visibility: true
                    });
            this.vectorLayer = new OpenLayers.Layer.Vector("Vector layer",
                    {
                        isBaseLayer:false,
                        displayInLayerSwitcher:false,
                        visibility:true,
                        saveState:true
                    });

            this.markerLayer = new OpenLayers.Layer.Vector("Marker layer",
                    {
                        isBaseLayer:false,
                        displayInLayerSwitcher:false,
                        visibility:true,
                        saveState:true,
                        styleMap: new OpenLayers.StyleMap({
                            //label: "${_HSID}",
                            pointRadius: "16", // sized according to type attribute
                            externalGraphic: OpenLayers.Util.getImagesLocation()+"icons/blue.png",

                            labelAlign: "c",
                            labelYOffset: 5,
                            labelXOffset: -2,
                            fontColor: "#000000",
                            fontSize: "10px",
                            fontFamily: "sans-serif",
                            fontWeight: "bold"
                        })
                    });

            this.map.addLayers([
                    //this.baseLayer,
                    this.vectorLayer,
                    this.markerLayer,
                    this.userGraphicsLayer
            ]); 

            this.vectorLayer.events.on({  
                scope: this,
                "featureselected": this.onFeatureSelect,
                "featureunselected": this.onFeatureUnselect
            });

            this.markerLayer.events.on({
                scope: this,
                "featureselected": this.onFeatureSelect,
                "featureunselected": this.onFeatureUnselect
            });

            //this.baseLayer.setVisibility(false);

        },

    /**
    * init map  and other events
    * @private
    */
    _initEvents: function() {

        this.addEvents("wmcparsed");
        this.addEvents("compositionparsed");

        this.map.events.register("addlayer",this,this._onLayerAdded);
        this.map.events.register("removelayer",this,this._onLayerRemoved);

        this.infoPanel.on("clearPanel", function() { this.clearMap(arguments); }, this);

        this.mapControls.query.events.register("beforeQuery",this,function(){
            if (this.mapControls.query.mainPanel.ownerCt === undefined) {
                this.infoPanel.clearWithEvent();
                this.mapControls.query.mainPanel.destroy();
                this.mapControls.query.createMainPanel();
                this.infoPanel.add(this.mapControls.query.mainPanel); 
            }
            this.toolsPanel.layout.setActiveItem(this.infoPanel.id); 
            this.infoPanel.maskOn();
            this.infoPanel.doLayout();
        });

        this.mapControls.query.events.register("afterQuery",this,function(){this.infoPanel.maskOff();});
        this.mapControls.query.events.register("activate",this,function(){
                            this.toolsPanel.layout.setActiveItem(this.infoPanel.id);
        });
        this.mapControls.query.events.register("deactivate",this,function(){
        });

        // indicate, that getState was called and all layeres are added
        // to the map
        this.readStateControl.events.register("read",this,function(){
                this._stateArrived = true;
                var context = this.readStateControl.state.data ? 
                                this.readStateControl.state.data : 
                                    this.readStateControl.state;

                if (context.layerStructure) {
                    this.layerSwitcher.logicalPanel.setStructure( 
                        context.layerStructure || {}
                    );
                }

                if (this.wmcManager) {
                    this.wmcManager.setContext(context);
                    if (this.readStateControl.state) {
                        this.map.metadata.set(context);
                    }
                }

            });

        // indicate, that no layers were added from previous session to the
        // map yet
        this.readStateControl.events.register("beforeread",this,function(){
                this._stateArrived = false;
            });

        // add wmcManager.context to the state structure
        this.saveStateControl.events.register("beforesave",this,function(){
            if (this.mapControls.userGraphics) {
                this.mapControls.userGraphics.deactivate();
            }
            this.saveStateControl.saveStructure.data.layerStructure = this.layerSwitcher.logicalPanel.getStructure();
            this.saveStateControl.saveStructure.data.user = this.map.user.get();
        });
    },

     /**
      * init tools tips
      * @private
      */
     _initToolTips: function() {
        new Ext.ToolTip({ target: this.mapControls.navigation.panel_div, html: OpenLayers.i18n('Pan and zoom in the map using mouse')});
        new Ext.ToolTip({ target: this.mapControls.zoomHistory.previous.panel_div, html: OpenLayers.i18n('Previous zoom')});
        new Ext.ToolTip({ target: this.mapControls.zoomHistory.next.panel_div, html: OpenLayers.i18n('Next zoom')});
        new Ext.ToolTip({ target: this.mapControls.userGraphics.panel_div, html: OpenLayers.i18n('Draw and measure user graphics')});
        new Ext.ToolTip({ target: this.mapControls.query.panel_div, html: OpenLayers.i18n('Query layers by clicking inthe map')});
        //new Ext.ToolTip({ target: this.mapControls.pin.panel_div, html: OpenLayers.i18n('Add custom point with description to the map')});

        if (this.mapControls.projectionSwitcher) {
            new Ext.ToolTip({ target: this.mapControls.projectionSwitcher.div, html: OpenLayers.i18n('Select other CRS, supported by the map')});
        }
    },

     /**
      * init projections
      * @private
      */
    _initProjections: function() {
                          
        this.mapControls.projectionSwitcher = new HSLayers.Control.ProjectionSwitcher({
                                                    div: this.mapPanel.projectionSwitcherContainer.container.dom,
                                                    projDefs: projections
                                                });

        this.map.addControl(this.mapControls.projectionSwitcher);

        this.map.projections = [];
        for (var j = 0; j < this.mapControls.projectionSwitcher.projDefs.length; j++) {
            this.map.projections.push(this.mapControls.projectionSwitcher.projDefs[j].projection);
        }
    },

    /**
     * call afterInit method
     * @function
     * @name HSLayers.MapPortal.mapInitialized
     */
    mapInitialized: function() {
        HSLayers.MapPortal.superclass.mapInitialized.apply(this, arguments);
        this._registerInitBus();
    },

    afterInit: function (){
        OpenLayers.Console.log("afterInit method is deprecated and should no longer be used. Use mapInitialized instead"); 
        this.mapInitialized(arguments);
    },

    /**
     * Open composition from URL
     * @function
     * @param {Object} data
     */
    loadComposition: function(data) {
        Ext.MessageBox.show({
            title: OpenLayers.i18n('Overwrite existing map?'),
            msg: OpenLayers.i18n("Overwrite current map content with new map composition?"),
            buttons: {
                "yes": OpenLayers.i18n("Overwrite map"),
                "no": OpenLayers.i18n("Add to map"),
                "cancel":true
            },
            fn: function(result) {
                var cfg = {newlayers: true};

                // switch various buttons
                switch(result) {
                    case "cancel":
                        return;
                        break;
                    case "yes":
                        this.newContext();
                        var cfg = { "all":true };
                    case "no":
                        this.map.loadComposition(data,cfg);
                        break;
                }
            },
            scope:this,
            icon: Ext.MessageBox.QUESTION
        });
    },


    /**
     * Open composition from URL
     * @function
     * @param {String} url
     */
    loadCompositionFromURL: function(url,action) {

        action = action || "dialog";

        // define opening function
        var openComposition = function(result) {

            var cfg = {newlayers: true};

            // switch various buttons
            switch(result) {
                case "cancel":
                    this.fireEvent("compositionparsed");
                    return;
                    break;
                case "yes":
                    this.newContext();
                    cfg = { "all":true };
                case "no":
                    OpenLayers.Request.GET({
                        url: url,
                        scope: this,
                        success: function(r) {
                            this.map.loadComposition(r.responseText, cfg);
                            this.fireEvent("compositionparsed");
                        },
                        failure: function(r) {
                            this.fireEvent("compositionparsed");
                            Ext.Msg.Alert(OpenLaeyrs.i18n("Composition failed"),
                                OpenLayers.i18n("We are sorry, required map composition "+
                                "could not be loaded. <br/> "+
                                "Status: ${status} statusText: ${statusText}",r)
                            );
                        }
                    });
                    break;
            }
        };

        switch(action) {
            case "dialog":
                Ext.MessageBox.show({
                    title: OpenLayers.i18n('Overwrite existing map?'),
                    msg: OpenLayers.i18n("Overwrite current map content with new map composition?"),
                    buttons: {
                        "yes": OpenLayers.i18n("Overwrite map"),
                        "no": OpenLayers.i18n("Add to map"),
                        "cancel":true
                    },
                    fn: openComposition,
                    scope:this,
                    icon: Ext.MessageBox.QUESTION
                });
                break;
            case "overwrite":
                openComposition.apply(this, ["yes"]);
                break;
            case "append":
                openComposition.apply(this, ["no"]);
                break;
        }
    },

    /**
     * show new window with save context dialog
     * @private
     * @function
     */
    _showOpenContext: function() {
        var config = {
            width :400,
            height: 400,
            header: false,
            url: HSLayers.statusManagerUrl,
            project: this.project,
            map: this.map
        };

        Ext.apply(this, Ext.apply(config,this.initialConfig.contextBrowserCfg || {})); 
        contextbrowser = Ext4.create("HSLayers.ContextBrowser",config);

        contextbrowser._win = Ext4.create("Ext4.window.Window", {
                    title: OpenLayers.i18n("Open composition"),
                    items: [
                        contextbrowser
                    ],
            closeAction: "hide"
        });

        contextbrowser.on("addtomapclicked", function(url) {
            this.loadCompositionFromURL(url);
            contextbrowser._win.close();
        }, this);

        contextbrowser.on("uploaded", function(context) {
            this.loadComposition(context);
            contextbrowser._win.close();
        }, this);

        // show
        contextbrowser._win.show();
        contextbrowser.server.store.load();

    },

    /**
     * show new window with save context dialog
     * @private
     * @function
     */
    _showSaveContext: function() {
        var contextform  = Ext4.create("HSLayers.Context", {
            width :400,
            height: 400,
            frame: true,
            header: false,
            map: this.map,
            project: this.project
        });


        contextform._win = Ext4.create("Ext4.window.Window", {
                    items: [ contextform ]  });

        var fixtitle = function(){this._win.setTitle(this.title);};
        contextform.on("titlechange",fixtitle,contextform);
        fixtitle.apply(contextform,[]);

        contextform.setContext( this.map.metadata );
        contextform.setContext( this.map); 

        // adjust map
        var adjust_map = function(context) {
            this.map.metadata.set(context.data);
            this.map.user.set(context.data.user);
        };

        // show
        contextform._win.show();
        contextform.on("saved",function(context){
            adjust_map.apply(this,[context]);
            contextform._win.close();
        },this);
        contextform.on("downloaded",function(){contextform._win.close();},this);

    },


    /**
     * class name
     * @type String
     * @name HSLayers.MapPortal.CLASS_NAME
     */
    CLASS_NAME: "HSLayers.MapPortal"

});
