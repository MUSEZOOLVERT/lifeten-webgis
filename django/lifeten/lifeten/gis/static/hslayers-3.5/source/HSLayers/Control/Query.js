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
HSLayers.namespace("HSLayers.Control");

/**
 * Query WMS and MapServer layer types
 * @class HSLayers.Control.Query
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control-js.html">OpenLayers.Control</a>
 * @example
 *  var infoButton = new HSLayers.Control.Query({horizontal:false,
 *                                                   container:app.infoPanel});
 *  infoButton.onInfo = function() { 
 *              app.tabs.items.items[1].items.items[1].activate(app.infoPanel);
 *  };
 *  app.panel.addControls([infoButton]);
 */

HSLayers.Control.Query = new OpenLayers.Class(OpenLayers.Control,{

    /**
     * Maximum number of features in response
     * @name HSLayers.Control.Query.featureCount
     * @type Integer
     * @default 10
     */
    featureCount: 10,

    /**
     * @name HSLayers.Control.Query.EVENT_TYPES 
     * @type String[]
     */
    EVENT_TYPES : ["beforeQuery","afterQuery"],

    /**
     * scope for this onInfo
     * @name HSLayers.Control.Query.scope
     * @type Object
     */
    scope: this,

    /**
     * @name HSLayers.Control.Query.displayClass
     * @type String
     */
    displayClass: "hsControlQuery",

    /**
     * configuration for <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Popup-js.html">OpenLayers.Popup</a>
     * @name HSLayers.Control.Query.popupOptions
     */
    popupOptions: undefined,

    /**
     * main panel, where the results will be displayed
     * @name HSLayers.Control.Query.mainPanel
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
     */
    mainPanel: undefined,

    /**
     * Should the result table have horizontal orientation?
     * @name HSLayers.Control.Query.horizontal
     * @type Boolean
     * @default false
     */
    horizontal: false,

    /**
     * Layers Stack
     * @name HSLayers.Control.Query.stack
     * @type array
     */
    stack: undefined,

    /**
     * options for the BoundingBox handler
     * @name HSLayers.Control.Query.defaultHandlerOptions
     * @type Object
     */
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },

    /**
     * Result to popup
     * @name HSLayers.Control.Query.toPopup
     * @type Boolean
     */
    toPopup: false,

    /**
     * @name HSLayers.Control.Query.popup
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Popup-js.html">OpenLayers.Popup</a>
     */
    popup: null,

    /**
     * should be used  iframe  for text response?
     * @name HSLayers.Control.Query.useIframe
     * @type Boolean
     * @efault false
     */
    useIframe: false,

    /**
     * Surrounding DOM element
     * If not set, default is new Ext.window
     * @name HSLayers.Control.Query.container
     * @type DOMElement
     */
    container: null,

    /**
     * @name HSLayers.Control.Query.qlayers
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer-js.html">OpenLayers.Layer</a>[]
     */
    qlayers: [],

    /**
     * mainPanel title
     * @name HSLayers.Control.Query.title
     */
    title: undefined,

    /**
     * mainPanel title
     * @name HSLayers.Control.Query.handlerClass
     */
    handlerClass: OpenLayers.Handler.Box,

    /**
     * @constructor
     * @param {Object} options 
     */
    initialize : function(options) {

        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions
        );

        this.EVENT_TYPES = HSLayers.Control.Query.prototype.EVENT_TYPES.concat(
                OpenLayers.Control.prototype.EVENT_TYPES);

        OpenLayers.Control.prototype.initialize.apply(
            this, [options]
        ); 

        if (!this.pointOnly) {
            this.handler = new this.handlerClass(
                this, {done: this.onBoxDrawed}, {keyMask: this.keyMask} );
        }

        if (!this.popupOptions) {
            this.popupOptions = {};
        }
        this.popupOptions = OpenLayers.Util.extend(this.popupOptions,HSLayers.Control.Query.PopupOptions);
        if (window.Ext) {
            this.createMainPanel();
        }

        this.stack = [];

    },

    /**
     * creates this.mainPanel from Ext
     * @name HSLayers.Control.Query.createExtMainPanel
     * @function
     */
    createMainPanel: function() {

        /* create main Ext.Panel */
        this.mainPanel = new Ext.Panel({
            title: this.title,
            autoHeight: true,
            autoWidth: true
        });

        if (this.container && this.container.add) {
            this.container.add(this.mainPanel);
        }


        this.mainPanel.on("destroy",this.destroyCoords,this);
        // init empty value
        this.stack = [];
    },

    destroyCoords: function() {
        if (this.coordsPanel) {
            this.coordsPanel.destroy();
            delete this.coordsPanel;
        }
    },

    /**
     * @name HSLayers.Control.Query.setMap
     * @function
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    setMap: function(map) {
        this.map = map;
        if (this.handler) {
            this.handler.setMap(map);
        }

    },

    /**
     * @name HSLayers.Control.Query.activate
     * @function
     */
    activate: function() {
        if (this.pointOnly) {
            this.map.events.register("click",this,this.onBoxDrawed);
        }
        OpenLayers.Control.prototype.activate.apply(this,arguments);
        if (this.handler && this.handler.layer) {
            this.handler.layer._noPrint = true;
        }
    },

    /**
     * @name HSLayers.Control.Query.deactivate
     * @function
     */
    deactivate: function() {
        this.map.events.unregister("click",this,this.onBoxDrawed)
        OpenLayers.Control.prototype.deactivate.apply(this,arguments);
    },

    /**
     * Called when the box is drawed. Box is cleared...
     * @name HSLayers.Control.Query.onBoxDrawed
     * @function
     * @param {Event} evt 
     */
    onBoxDrawed: function(evt) {
        this.events.triggerEvent("beforeQuery",this.scope);
        if (window.Ext && !this.toPopup) {
            this.onBoxDrawedExt(evt);
        }
        else  {
            if (this.mainPanel) {
                this.mainPanel.innerHTML = "";
            }
            if (this.popup) {
                this.popup.destroy();
                this.popup = null;
            }
            this.queryLayers(evt);
        }

        if (this.qlayers.length  === 0) {
            this.events.triggerEvent("afterQuery",this.scope);
        }
    },

    /**
     * Called when the box is drawed. Box is cleared... - Ext available
     * @name HSLayers.Control.Query.onBoxDrawedExt
     * @function
     * @param {Event} evt
     */
    onBoxDrawedExt: function(evt) {
        var html = this.makeCoordsHtml(evt);

        if (!this.coordsPanel) {
            this.coordsPanel = new Ext.Panel({
                header:false,
                hideHeaders:true,
                autoHeight:true,
                viewConfig:{forceFit:true},
                html: html
            });
            this.mainPanel.add(this.coordsPanel);
            this.mainPanel.doLayout();
        }
        else {
            this.coordsPanel.update(html);
        }


        for (var i = 1, len = this.mainPanel.items.length; i < len; i++) {
            var childPanel = this.mainPanel.items.get(i);
            if (childPanel.items && childPanel.items.length) {
                for (var j = 0, len2 = childPanel.items.length; j < len2; j++) {
                        childPanel.remove(
                            childPanel.items.get(childPanel.items.length-1)
                        );
                }
            }
        }


        // query layers
        this.queryLayers(evt);

    },

    /**
     * Query each visible layer within the map. Currently, only WMS and
     * MapServer are supported.
     * @name HSLayers.Control.Query.queryLayers
     * @function
     * @param {Event} evt if Box only MapServer is requested, if Point, all
     * supported layer types are requested
     */
    queryLayers: function(evt) {

        this.qlayers = [];
        var url;
        var store;
        for (var i = 0; i < this.map.layers.length; i++) {
            var layer = this.map.layers[i];

            /* only layers with query set */
            if (layer.getVisibility()) {

                /* WMS */
                if ((layer instanceof OpenLayers.Layer.WMS) &&
                        layer.params.INFO_FORMAT) {
                    
                    // push layer to layer stack
                    var cont = this.createLayerResponseContainer(layer);

                    if (evt.CLASS_NAME != "OpenLayers.Pixel" &&
                        evt.CLASS_NAME != "OpenLayers.Geometry.Point")  {
                        this.createTable(
                                new Ext.data.SimpleStore({
                                    fields: [{"name":"fieldname"},
                                             {"name":"fieldvalue"}],
                                    data: [
                                            [OpenLayers.i18n("Error"), OpenLayers.i18n("WMS Layer supports only Point query")]
                                          ]
                                }),layer);
                        continue;
                    }
                    this.qlayers.push(false);


                    var params = this.buildWMSQueryParams(layer,evt);
                    url = layer.getURL(this.map.getExtent());

                    var urlParams = OpenLayers.Util.getParameters(url);
                    params = OpenLayers.Util.extend(urlParams, params);

                    /* mapserv gml */
                    if (layer.params.INFO_FORMAT.search("gml") > -1 ||
                        layer.params.INFO_FORMAT.search("vnd.ogc.wms_xml") > -1 ||
                        layer.params.INFO_FORMAT.search("text/xml") > -1 
                        ) {

                        var onLoad = function(r) {

                            this.scope.events.triggerEvent("afterQuery",this.scope);
                            var gfi = new OpenLayers.Format.WMSGetFeatureInfo();
                            var f = gfi.read(r.responseXML);
                            var data = [];
                            if (f.length == 0) {
                                data = [
                                    ["", OpenLayers.i18n("Nothing found")]
                                ];
                            }
                            else {
                                for (var l = 0; l < f.length; l++) {
                                    for (k in f[l].attributes) {
                                        var value = f[l].attributes[k];
                                        data.push([k,value]);
                                    }
                                    this.loadData(data);

                                    var j = 0;
                                    while( j < this.data.length) {
                                        var r = this.getAt(j);
                                        if (r.data.fieldname === "") {
                                            this.remove(r);
                                            j = j-1;
                                        }
                                        j = j+1;
                                    }
                                    this.scope.createTable.apply(this.scope,[this,this.layer,l+1]);
                                    data = [];
                                }
                            }
                        };


                        store = new Ext.data.ArrayStore({
                            fields: [{name:'fieldname'},
                                     {name:'fieldvalue'}],
                            scope:this,
                            layer: layer
                        });
                        var r = OpenLayers.Request.GET({url:this.getWMSQueryURL(layer,evt), 
                                success: onLoad,scope: store});

                    }
                    /* html */
                    if (layer.params.INFO_FORMAT.search("html") > -1) {
                        if (this.useIframe) {
                            this.parseHTML(url,true,this);
                        }
                        else {
                            this.request(url,params,this.parseHTML,layer);
                        }
                    }
                    /* text */
                    if (layer.params.INFO_FORMAT.search("text/plain") > -1) {
                        this.request(url,params,this.parseText,layer);
                    }

                    /* arcims xml - something special.
                     * OpenLayers.Format.WMSGetFeatureInfo not usable here
                     */
                    if (layer.params.INFO_FORMAT.search("application/vnd.esri.wms_featureinfo_xml") > -1 || 
                        layer.params.INFO_FORMAT.search("application/vnd.esri.wms_raw_xml") > -1
                            ) {

                        // we have to use esri.wms_featureinfo_xml for IE,
                        // because of wms_raw_xml returns CDATA sections
                        // and IE can not parse it
                        if (OpenLayers.Util.getBrowserName() == "msie") {
                            layer.params.INFO_FORMAT = "application/vnd.esri.wms_featureinfo_xml";
                        }

                        store = new Ext.data.XmlStore({
                            url: this.getWMSQueryURL(layer,evt),
                            record: "Field",
                            fields: [{name:'fieldname',mapping:"FieldName"},
                                     {name:'fieldvalue',mapping:"FieldValue"}],
                            layer: layer,
                            scope: this,
                            listeners: {
                                load: function() {
                                    this.scope.createTable.apply(this.scope,[this,this.layer]);
                                },
                                exception: function() {
                                    this.scope.events.triggerEvent("afterQuery",this.scope);
                                }
                            }
                        });

                        store.load();

                    }
                }


                /* MapServer */
                else if (layer instanceof OpenLayers.Layer.MapServer && 
                         layer.queryable &&
                        (layer.params.layers || layer.params.LAYERS)) {
                    //
                    // push layer to layer stack
                    this.createLayerResponseContainer(layer);

                    url = this.buildMapServerQueryUrl(layer,evt);

                    if (layer.getVisibility()) {

                        if (this.useIframe) {
                            this.parseHTML(url,layer);
                        }
                        else {
                            this.request(url,{},this.parseHTML,layer);
                        }
                    }
                    this.qlayers.push(false);

                }
                
                /* Vector */
                else if (layer instanceof OpenLayers.Layer.Vector) {
                    this._getVectorData(evt, layer);
                }
            }
        }

        if (this.toPopup) {
            if (this.qlayers.length > 0) {
                this.destroyPopup();
                var lonlat;
                if (evt.left && evt.bottom) {
                    var x = evt.left+(evt.right-evt.left)/2;
                    var y = evt.bottom+(evt.top-evt.bottom)/2;
                    lonlat = this.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(x,y));
                }
                else if (evt.xy) {
                    lonlat = this.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(evt.xy.x,evt.xy.y));
                }
                else if (evt.x && evt.y) {
                    lonlat = this.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(evt.x,evt.y));
                }
                this.createPopup(lonlat);
            }
        }

    },

    /**
     * Call the particula getfeatureinfo service for the layer
     * @name HSLayers.Control.Query.request
     * @function
     * @param {String} url  url
     * @param {Function} parser  method, which will parse the resulting response
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer.WMS-js.html">OpenLayers.Layer.WMS</a>|<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/MapServer-js.html">OpenLayers.Layer.MapServer</a>}
     */
    request: function(url,params,parser,layer){
    
        var paramsFromUrl = OpenLayers.Util.getParameters(url);
        if (OpenLayers.String.contains(url, '?')) {
            var length = url.indexOf('?');
            url = url.substring(0, length + 1);
        }         
        
        var newParams = {};
        for (paramName in paramsFromUrl) {
            newParams[paramName] = paramsFromUrl[paramName];
        }
        for (paramName in params) {
            newParams[paramName.toUpperCase()] = params[paramName];
        }
        
        OpenLayers.Request.GET({
            url: url,
            params: newParams,
            success: parser,
            scope:{thisWMSQuery: this, layer: layer},
            failure: parser
        });
    },
                

    /**
     * Return WMS query url with request type "GetFeatureInfo" back
     * @name HSLayers.Control.Query.buildWMSQueryParams
     * @function
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer-js.html">OpenLayers.Layer</a>} layer
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Pixel-js.html">OpenLayers.Pixel</a>} xy point
     * @returns {Object} parameters
     *
     */
    buildWMSQueryParams: function(layer,xy) {
        var size; var extent; var params; var srs;
        size = this.map.getSize();
        extent = this.map.getExtent();
        srs = layer.projection.getCode();

        if (xy instanceof OpenLayers.Geometry.Point) {
            xy = this.map.getPixelFromLonLat(new OpenLayers.LonLat(xy.x,xy.y));
        }
        params = {REQUEST:"GetFeatureInfo",
                    RADIUS: 2,
                    BBOX: extent.left+","+extent.bottom+","+extent.right+","+extent.top,
                    WIDTH: size.w,
                    HEIGHT: size.h,
                    QUERY_LAYERS:layer.params.LAYERS,
                    INFO_FORMAT: layer.params.INFO_FORMAT,
                    VERSION: layer.params.VERSION,
                    SRS: srs,
                    LAYERS: layer.params.LAYERS,
                    FORMAT: layer.params.FORMAT,
                    STYLES: layer.params.STYLES,
                    FEATURE_COUNT: 10,
                    X: xy.x,
                    Y: xy.y};
        return params;
    },

    /**
     * Return MapServer query url with mode type "nquery" back
     * @name HSLayers.Control.Query.buildMapServerQueryUrl
     * @function
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer-js.html">OpenLayers.Layer</a>} layer 
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Bounds-js.html">OpenLayers.Bounds</a>|<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Pixel-js.html">OpenLayers.Pixel</a>} evt
     * @returns {String} url
     */
    buildMapServerQueryUrl: function(layer,evt) {

        var size = this.map.getSize();
        var extent = this.map.getExtent();
        var qparams = {mode:"nquery",
                      imgext: extent.left+" "+extent.bottom+" "+extent.right+" "+extent.top,
                      mapsize: size.w+" "+size.h,
                      savequery: 1,
      };
        var params = OpenLayers.Util.extend({}, layer.params);
        params = OpenLayers.Util.extend(params, qparams);
       
        if (evt.CLASS_NAME && evt.CLASS_NAME.search("Pixel")>-1) {
            params.imgxy = evt.x+" "+evt.y;
        }
        else if (evt.xy) {
            params.imgxy = evt.xy.x+" "+evt.xy.y;
        }
        else {
            params.imgbox = evt.left+" "+evt.bottom+" "+evt.right+" "+evt.top;
            params.imgxy = "";
        }

        // HSMapServer 
        if (layer.CLASS_NAME.search("HSLayers") > -1) {
            params.project = OpenLayers.Util.getParameters(layer.url).project;
        }
        if (layer.params.project) {
            params.project = layer.params.project;
        }

        var url = layer.getURL(this.map.getExtent());
        var layerUrlParams = OpenLayers.Util.getParameters(url);
        var newParams = OpenLayers.Util.extend(layerUrlParams, params);
        url = OpenLayers.Util.removeTail(layer.getURL(this.map.getExtent())) + "?"+OpenLayers.Util.getParameterString(params);
        url = url.replace(/ /g,"%20");
        return url;
    },

    /**
     * Text response parser. Append text to the div directly.
     * @name HSLayers.Control.Query.parseText
     * @function
     * @param {String} response 
     * @param {OpenLayers.Layer} layer 
     */
    parseText: function(response,layer) {
        this.thisWMSQuery.events.triggerEvent("afterQuery",this.scope);
        var panel = new Ext.Panel({
                title: this.layer.title || this.layer.name,
                //width:400,
                style:"font-family: monospace",
                html: "<pre style='overflow: scroll'>"+response.responseText+"</pre>"
                });
        this.thisWMSQuery.getLayerResponseContainer(this.layer).add(panel);
        this.thisWMSQuery.mainPanel.doLayout();

        if (this.thisWMSQuery.mainPanel && this.thisWMSQuery.mainPanel.indicator) {
            this.thisWMSQuery.mainPanel.indicator.style.display = "none";
        }

        this.thisWMSQuery.onResultRendered();
        this.events.triggerEvent("afterQuery",this.scope);
    },
               
    /**
     * HTML response parser. Append text to the div directly. If
     * useIframe  set to True, create iframe.
     * @name HSLayers.Control.Query.parseHTML
     * @function
     * @param {String} text
     * @param {OpenLayers.Layer} layer
     */
    parseHTML: function(text,layer) {

        var width = 0;
        var htmlText = null;
        var thisWMSQuery = null;
        var layerName = null;
        var thisLayer = null;
        layer = layer  || this.layer;

        /* if thisWMSQuery, respnose is already HTML code
         * URL othervise */
        if (! this.thisWMSQuery) {
            htmlText = '<iframe src="'+text+'&_salt='+Math.random()+'" width="100%" height="200" scrolling="yes"/>';
            layerName = layer.title || layer.name;
            thisLayer = layer;
        }
        else {
            htmlText = text.responseText;
            layerName = layer.title || layer.name;
            thisLayer = this.layer;
        }

        if (this.thisWMSQuery) {
            thisQuery = this.thisWMSQuery;
        }
        else {
            thisQuery =  this;
        }
        thisQuery.events.triggerEvent("afterQuery",this.scope);

        // If ExtJS is here, layout into window
        if (window.Ext && !thisQuery.toPopup) {
            try {
                width = thisQuery.mainPanel.getInnerWidth()-35;
            }
            catch(e) {
                width = thisQuery.container.getInnerWidth()-35;
            }

            var panel = new Ext.Panel({
                    //width:400,
                    title: layerName,
                    style:"font-family: monospace",
                    autoScroll: true,
                    html: htmlText
                });
            var target = thisQuery.getLayerResponseContainer(thisLayer);
            target.add(panel);
            thisQuery.mainPanel.doLayout();
            this.events.triggerEvent("afterQuery",this.scope);


        }
        // ExtJS not available
        else {
            // for each layer, which was queried
            // false - layer was not queried yet
            // true - it was queried, but empty text string was returned
            // "something" - the text string, which was returned
            for (var i = 0; i < thisQuery.qlayers.length; i++) {

                // contiune if the layer was handled already
                if (thisQuery.qlayers[i] != false) {
                    continue;
                }
                // put returned text to the list
                if (htmlText && htmlText != "\n") {
                    thisQuery.qlayers[i] = htmlText;
                    break;
                }
                // empty text returnd, 'true' goes in to the list
                else {
                    thisQuery.qlayers[i] = true;
                    break;
                }
            }

            // setting content of a conext
            var content = "";
            var nulls = true;
            for (var i = 0; i < thisQuery.qlayers.length;i++) {
                if (thisQuery.qlayers[i] != true &&
                    thisQuery.qlayers[i] != false) {
                    content += thisQuery.qlayers[i];
                }
                // only one item has to contain "text" or it was not considered
                // yet (false)
                if (thisQuery.qlayers[i] != true) {
                    nulls = false;
                }
            }

            // nothing found
            if (nulls) {
                content = OpenLayers.i18n("Nothing found");
            }

            // main panel
            if (!thisQuery.toPopup) {
                thisQuery.mainPanel.body.update(content);
            }
            // or put it into popup
            else {

                if (content == OpenLayers.i18n("Nothing found") && 
                        thisQuery.popupOptions.closeOnNothingFound){
                    thisQuery.map.removePopup(thisQuery.popup);
                    thisQuery.destroyPopup();
                    return;
                }

                var popup = thisQuery.popup;
                // put away indicator
                popup.indicator.style.display = "none";
                
                thisQuery.popup.setContentHTML(content);;

                // normally, popup does align itself according to it's content
                // if it should be resized, little bit of magick is needed
                if (thisQuery.popupOptions.resize) {

                    // set size and overflow
                    thisQuery.popup.setSize(thisQuery.popupOptions.size);
                    thisQuery.popup.contentDiv.style.overflow = thisQuery.popupOptions.overflow;

                    // if scroolbars are to be displayed, 
                    // content height must be made smaller about 20px and shift
                    // about 20px down and width must be about 15px wider, so
                    // that the "close" icon is on top of it, and not at the
                    // side
                    if ( thisQuery.popupOptions.overflow == "auto" ||
                            thisQuery.popupOptions.overflow == "scroll") {
                        thisQuery.popup.contentDiv.style.height = parseInt(thisQuery.popup.contentDiv.style.height)-20+"px";
                        thisQuery.popup.contentDiv.style.marginTop = "20px";
                        thisQuery.popup.contentDiv.style.width = parseInt(thisQuery.popup.contentDiv.style.width)+15+"px";
                    }
                }
            }
        }

        // redraw
        try {
            if (thisLayer instanceof HSLayers.Layer.TreeLayer)  {
                if (thisLayer.redrawOnQuery) {
                    thisLayer.redraw(true);
                }
            }
        } catch(e) {
            console.log(e);
        }
        thisQuery.onResultRendered();
    },

    /**
     * Create Ext.Table and append it as result of the query to main div.
     * @name HSLayers.Control.Query.createTable 
     *
     * @param {Ext.data.Store} store  with data
     * @param {OpenLayers.Layer} OpenLayers.Layer
     * @param {Integer} feature index
     */
    createTable: function(store,layer,idx) {

        this.events.triggerEvent("afterQuery",this);

        if (store.getCount() === 0) {
            return;
        }


        var columns = [
            {id:'name',header: "Name", width: 100, sortable: true, dataIndex: 'fieldname'},
            {header: "Value", width: "auto", sortable: false, dataIndex: 'fieldvalue',
                renderer: function(v) {
                    if (/http(s)*:\/\//.test(v)) {
                        v = '<a target="_blank" href="'+ v + '">'+v+'</a>';
                    }
                    return v;
                }}
        ];

        // create the Grid
        var grid = new Ext.grid.GridPanel({
            hideHeaders: true,
            title: (layer.title || layer.name) + (idx && idx > 0 ? " ("+OpenLayers.i18n("feature")+" "+String(idx)+")":""),
            viewConfig:{forceFit:true},
            store: store,
            columns: columns,
            autoWidth: true,
            autoHeight:true,
            stripeRows: true
        });

        this.getLayerResponseContainer(layer).add(grid);
        this.mainPanel.doLayout();
    },

    /**
     * Create Ext.Table and append it as result of the query to main div -
     * for vector features
     * @name HSLayers.Control.Query.createTableVector
     *
     * @param {Ext.data.Store} store  with data
     * @param {OpenLayers.Layer} layer
     * @param {OpenLayers.Feature.Vector} feature
     * @param [{Integer}] count/idx
     */
    createTableVector: function(store,layer,feature,count) {

        this.events.triggerEvent("afterQuery",this.scope);

        if (store.getCount() === 0) {
            return;
        }


        var columns = [
            {id:'name',header: "Name", width: 100, sortable: true, dataIndex: 'fieldname'},
            {header: "Value", width: "auto", sortable: false, dataIndex: 'fieldvalue'}
        ];

        // create the Grid
        var grid = new Ext.grid.GridPanel({
            hideHeaders:true,
            tools: [{
                id:"popup",
                layer: layer,
                feature: feature,
                scope: this,
                qtip: OpenLayers.i18n("Select feature"),
                handler: this._selectFeature
            }],
            title: layer.title || layer.name+" "+String(count[1]+1) +"/"+String(count),
            viewConfig:{forceFit:true},
            store: store,
            columns: columns,
            autoWidth: true,
            autoHeight:true,
            stripeRows: true
        });

        this.getLayerResponseContainer(layer).add(grid);
        this.mainPanel.doLayout();
    },

    /**
     * Information arrived, the application can use this method for custom
     * handler
     * @name HSLayers.Control.Query.onInfo
     * @function
     */
    onInfo: function() {
        return;
    },
 
    /**
     * Feature panel selected, select the feature
     * @name HSLayers.Control.Query.onInfo
     * @function
     * @private
     */
    _selectFeature: function(e, el, panel, tc) {
        var layer = tc.layer;
        var feature = tc.feature;
        layer.events.triggerEvent("featureselected", {feature: feature});
        return;
    },   

    /**
     * Information arrived, do the final things
     * @name HSLayers.Control.Query.onResultRendered
     * @function
     */
    onResultRendered: function() {

        if (this.container instanceof Ext.Panel) {
            this.mainPanel.doLayout();
            this.container.doLayout();
        }

        this.onInfo.apply(this.scope,[]);
        return;
    },

    /**
     * @name HSLayers.Control.Query.destroyPopup
     * @function
     */
    destroyPopup: function() {
        if (this.popu) {
            this.popup.destroy();
            this.popup = null;
        }
    },

    /**
     * @name HSLayers.Control.Query.createPopup
     * @function
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/LonLat-js.html">OpenLayers.LonLat</a>} lonlat
     */
    createPopup: function(lonlat) {
        this.popup = new this.popupOptions.popupClass(undefined,lonlat,this.popupOptions.size,"",
                                                    this.popupOptions.anchor,this.popupOptions.closeBox);
        this.popup.setContentHTML("<img src=\""+OpenLayers.Util.getImagesLocation()+"/indicator.gif"+"\" />");
        this.popup.indicator = this.popup.contentDiv.getElementsByTagName("img")[0];
        this.popup.contentDiv.appendChild(this.popup.indicator);
        this.map.addPopup(this.popup);
        this.popup.contentDiv.style.overflow = this.popupOptions.overflow;
        this.popup.show();
        this.popup.setSize(this.popupOptions.size);
    },

    /**
     * make html string with coordinates of clicked region
     * @name HSLayers.Control.Query.makeCoordsHtml
     * @function
     */
    makeCoordsHtml: function(evt) {

        var html = '<div class="body-wrap"><table>';
        var pixel;
        if (evt instanceof OpenLayers.Geometry.Point) {
            pixel = this.map.getPixelFromLonLat(new OpenLayers.LonLat(evt.x,evt.y));
        }
        else if (evt instanceof OpenLayers.Bounds) {
            pixel = evt.getCenterPixel();
            html += OpenLayers.i18n("Center of the Bounding Box")+"<br />";
        }
        else {
            pixel = evt;
        }
        

        var lonlat = this.map.baseLayer.getLonLatFromViewPortPx(pixel);

        html += "<tr><td>"+this.map.getProjectionObject().proj.title+" "+
                "["+OpenLayers.i18n(this.map.getProjectionObject().proj.units)+"]</td><td>"+
                "x = "+String(Math.round(lonlat.lon))+"</td><td>y = "+String(Math.round(lonlat.lat))+"</td></tr>";


        if (this.map.getProjectionObject().getCode().toLowerCase() != "epsg:4326") {
            var wgsProj = new OpenLayers.Projection("epsg:4326");
            lonlat.transform(this.map.getProjectionObject(),wgsProj);
            html +=  "<tr><td>GPS</td><td>" + OpenLayers.Util.getFormattedLonLat(lonlat.lat,"lat","dms")+
                "</td><td>"+OpenLayers.Util.getFormattedLonLat(lonlat.lon,"lon","dms")+"</td></tr>";
        }

        var update = this.appendHtml(evt);

        if (update) {
            html += '<tr><td colspan="3"'+update+"</td></tr>";
        }

        html += "</table></div>";

        return html;

    },

    /**
     * this function should be redefined by the application
     * it should return text, which will  be appended in the info panel
     *
     * @name HSLayers.Control.Query.appendHtml
     * @function
     * @param evt {Event} original event
     * @returns {String}
     */
    appendHtml: function(evt) {
        return "";
    },

    /**
     * returns Ext.Container with reserved place for given layer response
     * @funciton
     * @name HSLayers.Control.Query.getLayerResponseContainer
     * @param {OpenLayers.Layer} layer
     * @returns {Ext.Container} 
     */
    getLayerResponseContainer: function(layer) {
        for (var i = 0, len = this.mainPanel.items.items.length; i < len; i++) {
            if (this.mainPanel.items.items[i].id == "response_panel_"+layer.id) {
                return this.mainPanel.items.items[i];
            }
        }
    },

    /**
     * creates Ext.Container with reserved place for given layer response
     * @funciton
     * @name HSLayers.Control.Query.createLayerResponseContainer
     * @param {OpenLayers.Layer} layer
     * @returns {Ext.Container} 
     */
    createLayerResponseContainer: function(layer) {
        if (this.stack.indexOf(layer.id) == -1) {
            this.stack.push(layer.id);
            var container = new Ext.Container({id:"response_panel_"+layer.id});
            this.mainPanel.add(container);
            return container;
        }
    },

    /**
     * creates query url for WMS layers
     * @funciton
     * @name HSLayers.Control.Query.getWMSQueryURL
     * @param {OpenLayers.Layer} layer
     * @returns {Ext.Container} 
     */
    getWMSQueryURL: function(layer,evt) {

        var params = this.buildWMSQueryParams(layer,evt);
        url = layer.getURL(this.map.getExtent());

        var paramsFromUrl = OpenLayers.Util.getParameters(url);
        newParams = OpenLayers.Util.extend(paramsFromUrl, params);
        url = OpenLayers.Util.urlAppend(OpenLayers.Util.removeTail(url),OpenLayers.Util.getParameterString(newParams));

        url = (OpenLayers.ProxyHost ?  OpenLayers.ProxyHost + encodeURIComponent(url): url);
        return url;
    },

    /**
     * get data from vector features
     * @private
     * @function
     */
    _getVectorData: function(evt, layer) {
        var geom;
        var cont = this.createLayerResponseContainer(layer);

        // convert point to bbox
        if (evt instanceof OpenLayers.Pixel) {
            var lonlat = this.map.getLonLatFromPixel(evt); 
            geom = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
            evt = new OpenLayers.Bounds(evt.x-3,evt.y-3,evt.x+3,evt.y+3);
        }

        if (evt instanceof OpenLayers.Bounds) {
            var minXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(evt.left, evt.bottom)
            );
            var maxXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(evt.right, evt.top)
            );
            var bounds = new OpenLayers.Bounds(
                minXY.lon, minXY.lat, maxXY.lon, maxXY.lat
            );
            geom = bounds.toGeometry();
        }
        else if (evt instanceof OpenLayers.Geometry) {
            geom = evt;
        }

        var datas = [];
        for(var i=0, len = layer.features.length; i<len; ++i) {
            var feature = layer.features[i];
            // check if the feature is displayed
            if (!feature.getVisibility()) {
                continue;
            }

            if (feature.geometry && geom.intersects(feature.geometry)) {
                var data = [];    
                for (var k in feature.attributes) {
                    var attr = feature.attributes[k];
                    var val;
                    if (typeof(attr) == "string") {
                        val = attr;
                    }
                    else {
                        val = attr.value;
                        k = OpenLayers.i18n(attr.displayName) || k;
                    }
                    data.push([k,val]);
                }

                var area = feature.geometry.getArea();
                var length = feature.geometry.getLength();

                if (length) {
                    data.push([OpenLayers.i18n("Calculated length"), HSLayers.Util.renderLength(length)]);
                }

                if (area) {
                    data.push([OpenLayers.i18n("Calculated area"), HSLayers.Util.renderArea(area)]);
                }

                datas.push(data);
            }
        }
        
        // create tables
        for (var j = 0, lenj = datas.length; j<lenj; j++) {
            this.createTableVector(new Ext.data.SimpleStore({
                fields: [{name:"fieldname",type:"string"},{name:"fieldvalue",type:"string"}],
                data: datas[j]
            }), layer,feature,[lenj,j]);
        }
        
    },

    /**
     * @name HSLayers.Control.Query.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.Query"
});

OpenLayers.Control.HSQuery = HSLayers.Control.Query;

/**
 * default popup options
 * @name HSLayers.Control.Query.PopupOptions
 */
HSLayers.Control.Query.PopupOptions = {
    popupClass: OpenLayers.Popup.FramedCloud,
    size: new OpenLayers.Size(250,250),
    id: undefined,
    closeOnNothingFound: true,
    anchor: undefined,
    closeBox: true,
    resize: true,
    overflow: "auto"
};

HSLayers.Control.Query.XmlReader = function(config) {
    HSLayers.Control.Query.XmlReader.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.Control.Query.XmlReader, Ext.data.XmlReader, {

    extractData : function(root, returnRecords) {

        var rawName = "node";

        var rs = [];

        // Had to add Check for XmlReader, #isData returns true if root is an Xml-object.  Want to check in order to re-factor
        // #extractData into DataReader base, since the implementations are almost identical for JsonReader, XmlReader
        if (this.isData(root) && !(this instanceof Ext.data.XmlReader)) {
            root = [root];
        }
        var f       = this.recordType.prototype.fields,
            fi      = f.items,
            fl      = f.length,
            rs      = [];
        if (returnRecords === true) {
            var Record = this.recordType;
            for (var i = 0; i < root[0].attributes.length; i++) {
                var a = root[0].attributes[i];
                var record = new Record({"fieldname":a.name,"fieldvalue":a.value}, this.getId(a));
                record[rawName] = a;    // <-- There's implementation of ugly bit, setting the raw record-data.
                rs.push(record);
            }
        }
        else {
            for (var i = 0; i < root.length; i++) {
                var data = this.extractValues(root[i], fi, fl);
                data[this.meta.idProperty] = this.getId(root[i]);
                rs.push(data);
            }
        }
        return rs;
    },

    CLASS_NAME: "HSLayers.Control.Query.XmlReader"
});

HSLayers.Control.Query.extract_TextXml_data = function(root, returnRecords) {
    var rawName = "node";
    if (this.isData(root) && !(this instanceof Ext.data.XmlReader)) {
        root = [root];
    }
    var f       = this.recordType.prototype.fields, fi      = f.items, fl      = f.length, rs      = [];
    if (returnRecords === true) {
        var Record = this.recordType;
        for (var j = 0; j < root[0].attributes.length; j++) {
            var a = root[0].attributes[j];
            var record = new Record({"fieldname":a.name,"fieldvalue":a.value}, this.getId(a));
            record[rawName] = a;    // <-- There's implementation of ugly bit, setting the raw record-data.
            rs.push(record);
        }
    }
    else {
        for (var k = 0; k < root.length; k++) {
            var data = this.extractValues(root[k], fi, fl);
            data[this.meta.idProperty] = this.getId(root[k]);
            rs.push(data);
        }
    }
    return rs;

};
