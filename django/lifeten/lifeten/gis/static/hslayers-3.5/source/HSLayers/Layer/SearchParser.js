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

/** 
 * @class Vector layer for displaying results of searching
 * @name  HSLayers.Layer.SearchParser
 *
 * @description
 * <strong>Example usage:</strong><br />
 * <code>
 * var search = new HSLayers.Layer.SearchParser("Name",options);
 * </code>
 */
HSLayers.namespace("HSLayers.Layer");

HSLayers.Layer.SearchParser = OpenLayers.Class(OpenLayers.Layer.Vector, {

        /**
         * show features description in the list
         * @name HSLayers.Layer.SearchParser.showDescription
         * @type Boolean
         */
        showDescription: true,

        /**
         * zoom to features
         * @name HSLayers.Layer.SearchParser.zoomToFeatures
         * @type Boolean
         */
        zoomToFeatures: true,

        /**
         * options used for OpenLayers.Format.KML
         * default: {extractStyles: true, extractAttributes: true}
         * @name HSLayers.Layer.SearchParser.formatOptions
         * @type Object
         */
        formatOptions: true,

        /**
         * Ext data store
         * used only with ExtJS
         * @private
         * @name HSLayers.Layer.SearchParser.store
         * @type <Ext.data.ArrayStore>
         */
        store: null,

        /**
         * search results text
         * @private
         * @name HSLayers.Layer.SearchParser.search_results_title
         * @type String
         */
        search_results_title: "Search Results",

        /**
         * Ext grid panel
         * used only with ExtJS
         * @private
         * @name HSLayers.Layer.SearchParser.grid
         * @type <Ext.grid.GridPanel>
         */
        grid: null,

        /**
         * popup size
         * default 150,300
         * @private
         * @name HSLayers.Layer.SearchParser.popupSize
         * @type OpenLayers.Size
         */
        popupSize: [150,300],

        /**
         * anchorize http:// strings
         * default: true
         * @name HSLayers.Layer.SearchParser.anchorize
         * @type String
         */
        anchorize: true,

        /**
         * icon class for Ext.grid.GridPanel
         * @name HSLayers.Layer.SearchParser.iconCls
         * @type String
         */
        iconCls: undefined,

        /**
         * EVENT_TYPES of this layer
         * * responded - this.parse was called as onreadystatechanged
         *               function
         * @name HSLayers.Layer.SearchParser.EVENT_TYPES
         * @type [{String}]
         */
        EVENT_TYPES: ["responded","parsed"],

        /**
         * Create new Object
         * @constructor
         * @param {String} name
         * @param {Object} options
         */
        initialize: function(name, options) {

            // nasty solution, but since there is bug in OL
            // http://trac.osgeo.org/openlayers/ticket/3416
            // we have to do it like this
            OpenLayers.Layer.Vector.prototype.EVENT_TYPES = HSLayers.Layer.SearchParser.prototype.EVENT_TYPES.concat(OpenLayers.Layer.Vector.prototype.EVENT_TYPES);
            this.maxZoom = options.maxZoom;
            this.showDescription = options.showDescription;
            this.projection = options.externalProjection ? options.externalProjection : new OpenLayers.Projection("epsg:4326");
            this.strategies  = [new OpenLayers.Strategy.Fixed()];
            var formatOptions = OpenLayers.Util.extend({}, { 
              extractStyles: true, extractAttributes: true,
              internalProjection: options.internalProjection
            });
            formatOptions = OpenLayers.Util.extend(formatOptions,options.formatOptions);
            this.protocol = new OpenLayers.Protocol.HTTP({
                                            format :  new OpenLayers.Format.KML(formatOptions)
                                            });

            // since the URL is empty, do nothing
            this.protocol.read = function(options) {
                if (!options.url) {
                    return;
                }
                OpenLayers.Protocol.HTTP.prototype.read.apply(this,arguments);
            };

            OpenLayers.Layer.Vector.prototype.initialize.apply(this, arguments);

            if (options.search_results_title !== "Search Results") {
                this.search_results_title = options.search_results_title;
            }
            else {
                this.search_results_title = OpenLayers.i18n("Search Results");
            }

            if (options.popupSize) {
                this.popupSize = options.popupSize;
            }
            else {
                this.popupSize = new OpenLayers.Size(this.popupSize[0], this.popupSize[1]);
            }

            this.events.register("beforefeatureadded",this, function(e){e.feature.attributes._fid = e.feature.fid.split("-")[1];});

        },

        /**
         * Set map method
         */
        setMap: function() {
            OpenLayers.Layer.Vector.prototype.setMap.apply(this,arguments);

            this.events.on({"featureselected":this.onFeatureSelect,scope:this});
            this.events.on({"featureunselected":this.onFeatureUnselect,scope:this});
        },

        /**
         * destroy
         */
        destroy: function() {

            this.events.un({"featureselected":this.onFeatureSelect,scope:this});
            this.events.un({"featureunselected":this.onFeatureUnselect,scope:this});

            OpenLayers.Layer.Vector.prototype.destroy.apply(this,arguments);
        },

        /**
         * perform search request and parse data
         * @name HSLayers.Layer.SearchParser.search
         * @function
         * @param {String} url
         * @param {Boolean} zoomToFeatures
         * @param {Boolean} showDescription
         */
        search: function(url,zoomToFeatures,showDescription) {
                this.protocol.url = url;

                this.zoomToFeatures =  zoomToFeatures || this.zoomToFeatures;
                this.showDescription = showDescription || this.showDescription;

                this.events.register("featuresadded",this,this.onFeaturesAdded);
                this.refresh({url:url});
                this.events.unregister("featuresadded",this,this.onFeaturesAdded);
        },

        /**
         * parse the search reesponse 
         * @name HSLayers.Layer.SearchParser.parse
         * @function
         * @param {HTTPRequest} request
         * @param {Boolean} zoomToFeatures
         * @param {Boolean} showDescription
         */
        parse: function(request,zoomToFeatures,showDescription) {
            this.events.triggerEvent("responded",{request:request,layer:this});

            this.zoomToFeatures =  zoomToFeatures || this.zoomToFeatures;
            this.showDescription = showDescription || this.showDescription;

            this.destroyFeatures();
            this.events.register("featuresadded",this,this.onFeaturesAdded);
            this.addFeatures(this.protocol.parseFeatures(request));
            this.events.unregister("featuresadded",this,this.onFeaturesAdded);

            this.events.triggerEvent("parsed",{layer:this});

            // display popup
            if (this.features.length == 1) {
                this.onFeatureSelect({feature:this.features[0]});
            }

        },

        /**
         * FeaturesAdded
         * @name HSLayers.Layer.SearchParser.onFeaturesAdded
         * @function
         * @param {Event} e
         * @private
         */
        onFeaturesAdded: function(e) {

            if (this.features.length) {
                // zoom to features
                var bbox = this.getDataExtent();    
                this.map.zoomToExtent(bbox);
                if(this.maxZoom && this.maxZoom < this.map.zoom){
                    this.map.zoomTo(this.maxZoom);
                }

                // render the list only in case, there is a place, where it can
                // be rendered to
                if (this.target) {
                    this.createList();
                }
            } 
            else {
                if (this.target) {
                    // render to
                    this.insertToTarget(new Ext.Panel({
                                            title: this.search_results_title+" "+this.name,
                                            html:"<h3>"+OpenLayers.i18n("Nothing found")+"</h3>" }));
                }
                else {
                    alert(OpenLayers.i18n("Nothing found"));
                }
            }
        },

        /**
         * create list of features
         * @name HSLayers.Layer.SearchParser.createList
         * @param {String or Ext.Object} target div id or Ext.Object
         */
        createList: function(target) {

            if (window.Ext) {
                this.createListExt(target);
            }
            else {
                this.createListHTML(target);
            }

        },

        /**
         * create list of features
         * @name HSLayers.Layer.SearchParser.createList
         * @param {Ext.Object} target Ext.Object
         * @private
         */
        createListExt: function(target) {

            // move fid to attributes
            for (var i = 0; i < this.features.length; i++) {
                var feature = this.features[i];
                feature.attributes.fid = feature.fid.split("-")[1];

                if (this.anchorize) {
                    for (var a in feature.attributes) {
                        feature.attributes[a] = HSLayers.Util.addAnchors(feature.attributes[a]);
                    }
                }
            }
            
            // create Store
            this.store = new Ext.data.ArrayStore({
                    // store configs
                    autoDestroy: true,
                    // reader configs
                    idIndex: 0,  
                    fields: [
                        {name: 'id', type:"string",
                                convert: function(v,record){return record.id;}},
                        {name: 'fid', type:"string",
                                convert: function(v,record){return record.fid.split("-")[1];}},
                        {name: 'name', type:"string",
                                convert: function(v,record){return record.attributes.name;}},
                        {name: 'description', type: 'string',
                                convert:function(v,record){return record.attributes.description;}}
                    ]
            });

            var renderRecord = function(value, p, record)  {
                var s = "<h3><a href=\"#\">"+record.data.name+"</a></h3>";
                s += record.data.description;
                return s;
            };

            Ext.override(Ext.PagingToolbar, {
                doRefresh: function(){
                    delete this.store.lastParams;
                    this.doLoad(this.cursor);    
                }
            });

            // create the pager
            this.grid = new Ext.grid.GridPanel({
                collapsible: true,
                iconCls: this.iconCls,
                store: this.store,
                forceLayout: true,
                trackMouseOver: true,
                loadMask: true,
                layout: "fit",
                hideHeaders: true,
                title: this.search_results_title+" "+this.name,

                // grid columns
                columns:[
                {
                    dataIndex: "fid",
                    width: 10
                },
                {
                    dataIndex: 'title',
                    renderer: renderRecord
                } ],

                // customize view config
                viewConfig: {
                    forceFit:true,
                    enableRowBody:true
                }
            });

            this.grid.on("cellclick",this.onCellClicked,this);
            this.grid.on("mouseover",this.onRowOver,this);
            this.grid.on("mouseout",this.onRowOut,this);

            // render to
            this.insertToTarget(this.grid);
            this.store.loadData(this.features);
        },

        /**
         * insert the resulting Ext.Panel to this.target
         * @function
         * @name HSLayers.Layer.SearchParser.insertToTarget
         * @param {Ext.Container} panel
         */
        insertToTarget: function(panel) {

            if (!this.target) {
                // create messagebox
                // FIXME
            }

            if (typeof(this.target) == "string") {
                target = Ext.get(this.target);
                if (target) {
                    target.clean();
                    panel.render(target.id);
                }
                target.repaint();
            }
            else {
                if (this.target instanceof HSLayers.InfoPanel) {
                    //target.clearWithEvent();
                }
                if (this.target.maskOff) {
                    this.target.maskOff();
                }
                this.target.add(panel);
                this.target.doLayout();
            }
        },

        /**
         * create list of features - html format
         * @private
         * @name HSLayers.Layer.SearchParser.createListHTML
         * @param {String} target div id 
         * @todo
         */
        createListHTML: function(target) {
                    //TODO
        },

        /**
         * cell clicked
         * @name HSLayers.Layer.SearchParser.onCellClicked
         * @function
         * @private
         */
        onCellClicked: function(grid, rowIndex, columnIndex, e) {
            var feature = grid.store.getAt(rowIndex).json;
            feature.geometry.calculateBounds();
            this.map.zoomToExtent(feature.geometry.bounds);
            if(this.maxZoom && this.maxZoom < this.map.zoom){
                this.map.zoomTo(this.maxZoom);
            }

            // try to select the feature
            var selectCtrls = this.map.getControlsBy("CLASS_NAME",/Control.SelectFeature/);
            if (selectCtrls.length > 0) {
                if (OpenLayers.Util.indexOf(feature.layer.selectedFeatures,feature) == -1) {
                    selectCtrls[0].unselectAll();
                    selectCtrls[0].select(feature);
                }
                else {
                    selectCtrls[0].unselectAll();
                }
            }
            else {
                this.events.triggerEvent("featureselected",{feature:feature});
            }

        },

        /**
         * row mouse over
         * @name HSLayers.Layer.SearchParser.onRowOver
         * @function
         * @private
         */
        onRowOver: function(evt,html) {
            var row = this.grid.view.findRowIndex(evt.target);
            if (row > -1) {
                if (this.grid.store.getAt(row)) {
                    var feature = this.grid.store.getAt(row).json;
                    if (feature.style) {
                        feature._defaultStyle = feature.style;
                    }
                    var style = this.styleMap.createSymbolizer(feature,"select");
                    this.renderer.drawFeature(feature, style);
                }
            }
        },

        /**
         * row mouse out
         * @name HSLayers.Layer.SearchParser.onRowOut
         * @function
         * @private
         */
        onRowOut: function(evt,html) {
            var row = this.grid.view.findRowIndex(evt.target);
            if (row > -1) {
                if (this.grid.store.getAt(row)) {
                    var feature = this.grid.store.getAt(row).json;
                    var style = feature._defaultStyle || this.styleMap.createSymbolizer(feature,"default");
                    this.renderer.drawFeature(feature, style);
                }
            }
        },

        /**
         * on feature select
         * @function
         * @private
         * @name HSLayers.Layer.SearchParser.onFeatureSelect
         * @param {Event} e
         */
        onFeatureSelect: function(e) {
            var feature = e.feature;

            var idx = this.store.find('id',feature.id);
            if (idx > -1) {
                var view = this.grid.getView();

                var center  = e.feature.geometry.getCentroid();
                var lonlat = new OpenLayers.LonLat(center.x, center.y);

                var popup = new HSLayers.Popup({
                    lonlat: lonlat,
                    size: this.popupSize, 
                    feature: feature,
                    title: feature.data.name,
                    contentHTML: feature.data.description,
                    anchor: null, 
                    closeBox: true,
                    closeBoxCallback: function(e) {
                        this.hide();
                        var layer = this.feature.layer;

                        var style = feature._defaultStyle || layer.styleMap.createSymbolizer(feature,"default");
                        layer.renderer.drawFeature(feature, style);

                        OpenLayers.Util.removeItem(layer.selectedFeatures, this.feature);
                        layer.events.triggerEvent("featureunselected", {feature: this.feature, event: e});
                        OpenLayers.Event.stop(e);
                    }
                });
            
                feature.popup = popup;
                this.map.addPopup(popup,true);

                // this condition is here only because of firefox
                // other browsers are working
                if (this.grid.getSelectionModel().grid) {
                    this.grid.getSelectionModel().selectRow(idx);
                    view.syncFocusEl(view.ensureVisible(idx, 0, false));
                }
            }
        },

        /**
         * on feature unselect
         * @function
         * @private
         * @name HSLayers.Layer.SearchParser.onFeatureUnselect
         * @param {Event} e
         */
        onFeatureUnselect: function(e) {
            var feature = e.feature;

            var idx = this.store.find('id',feature.id);
            if (idx > -1) {
                this.grid.getSelectionModel().selectRow(idx);
            }
        },

        CLASS_NAME: "HSLayers.Layer.SearchParser"
});

/**
 * default style for found objects
 */

HSLayers.Layer.SearchParser.defaultStyleMap = new OpenLayers.StyleMap({
    "default": { 
            pointRadius: "15", // sized according to type attribute
            externalGraphic: OpenLayers.Util.getImagesLocation()+"icons/red.png",
            label: "${_fid}",
            labelAlign: "cm",
            graphicYOffset: -32,
            graphicXOffset: -15,
            labelYOffset: 23,
            fontColor: "#000000",
            fontSize: "10px",
            fontFamily: "sans-serif",
            fontWeight: "bold",
            cursor: 'Pointer'
    },
    "select": {
        externalGraphic: OpenLayers.Util.getImagesLocation()+"icons/yellow.png",
        fillColor: "#ee9900",
        strokeColor: "#ee9900"
    }
});
