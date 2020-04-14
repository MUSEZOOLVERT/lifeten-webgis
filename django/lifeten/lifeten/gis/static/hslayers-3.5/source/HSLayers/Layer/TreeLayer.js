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

HSLayers.namespace("HSLayers.Layer","HSLayers.Layer.Tree");
/**
 * It is special type of `OpenLayers.Layer.MapServer` which mirrors content of
 * of the mapfile in the layerswitcher. Advantage: one physical layer in the
 * map, but many tree nodes within the layerswitcher.
 * 
 * The layer will (when added to map) download list of available layers and
 * groups from the server. The request will be automatically send to the
 * server with `mode` set to ``lyrlist``
 *
 *    ``http://server/script?...&mode=lyrlist&...``
 *
 * @class HSLayers.Layer.TreeLayer
 * @see `OpenLayers.Layer.MapServer <http://dev.openlayers.org/apidocs/files/OpenLayers/Layer/MapServer-js.html>`_
 * @example
 *     var l = new HSLayers.Layer.TreeLayer("name",
            "/mapserv/index.php",
            {
                transparent: true, 
                layers: "layer1 layer2" // default turned-on
            }, 
            {
                visibility: true,
	        ratio: 1,
                isBaseLayer: false,
                queryable: true
        });
 */
HSLayers.Layer.TreeLayer = OpenLayers.Class(OpenLayers.Layer.MapServer, {

    /**
     * base group
     * @name HSLayers.Layer.TreeLayer.baseGroup
     * @type [HSLayers.TreeLayer.Group]
     */
    baseGroup: undefined,

    /**
     * singletTile is false by defult
     * @name HSLayers.Layer.TreeLayer.singletTile
     * @type Boolean
     */
    singleTile: true,

    /**
     * Indicates, if the tree of layers is being loaded right now or not
     * @name HSLayers.Layer.TreeLayer.loadingTree
     * @type Boolean
     */
    loadingTree: false,

    /**
     * redraw layer, when queried the layer
     * @name HSLayers.Layer.TreeLayer.redrawOnQuery
     * @type Boolean
     */
    redrawOnQuery: true,

    /**
     * indicates, that the layer tree is loaded 
     * @name HSLayers.Layer.TreeLayer#layerloaded
     * @event
     */

    /**
     * indicates, that the layer tree is loaded 
     * @name HSLayers.Layer.TreeLayer#layerloadend
     * @event
     */

    /**
     *something went wrong
     * @name HSLayers.Layer.TreeLayer#loadfail
     * @event
     */

    /**
     * we are starting to load the layer
     * @name HSLayers.Layer.TreeLayer#loadstart
     * @event
     */

    /**
     * indicates, that the layer tree is loaded
     * @name HSLayers.Layer.TreeLayer#loadend
     * @event
     */

    /**
     * loading finished
     * @name HSLayers.Layer.TreeLayer#loadcancel
     * @event
     */

    /**
     * inidicates change of visibility
     * @name HSLayers.Layer.TreeLayer#visibilitychanged
     * @event
     */
    EVENT_TYPES: ["layerloaded","loadfail","loadstart", "loadend", "loadcancel", "visibilitychanged"],

    /**
     * Set the map property for the layer. This is done through an accessor
     * so that subclasses can override this and take special action once 
     * they have their map variable set. 
     * Here we take care to bring over any of the necessary default 
     * properties from the map. 
     * @function
     * @name HSLayers.Layer.TreeLayer.setMap
     * @param `OpenLayers.Map <http://dev.openlayers.org/apidocs/files/OpenLayers/Map-js.html>`_ map
     */
    setMap: function(map) {

        if (this.map == null) {
        
            this.map = map;
            
            // grab some essential layer data from the map if it hasn't already
            //  been set
            this.maxExtent = this.maxExtent || this.map.maxExtent;
            this.projection = this.projection || this.map.projection;
            
            if (this.projection && typeof this.projection == "string") {
                this.projection = new OpenLayers.Projection(this.projection);
            }
            
            // Check the projection to see if we can get units -- if not, refer
            // to properties.
            this.units = this.projection.getUnits() ||
                         this.units || this.map.units;
            
            this.initResolutions();
            
            if (!this.isBaseLayer) {
                this.inRange = this.calculateInRange();
                var show = ((this.visibility) && (this.inRange));
                this.div.style.display = show ? "" : "none";
            }
            
            // deal with gutters
            this.setTileSize();

            // load the list of layers
            this.events.triggerEvent("loadstart");

            this.loadingTree = true;

            this.params.LAYERS = this.params.LAYERS || this.params.layers;
            delete this.params.layers;

            if (this.options.json) {
                this._onListOfLayersArrived({responseText: this.options.json});
            }
            else {
                var results = OpenLayers.Request.GET({
                    url: this.saltURL(
                            this.getFullRequestString(
                                {
                                    mode:"lyrlist",
                                    layers:this.params.LAYERS 
                                }
                            )
                        ), 
                    scope: this, 
                    success: this._onListOfLayersArrived, 
                    failure: this.requestFailure
                });
            }
        }
    },

    /**
     * Process JSON after it has been loaded.
     * Called by js:func:`Layer.TreeLayer.setMap`
     * @name HSLayers.Layer.TreeLayer._onListOfLayersArrived
     * @private
     * @function
     * @param {HTTPRequest} request 
     */
    _onListOfLayersArrived:function(request) {
        this.loadingTree = false;
        var doc = request.responseText;
        this.baseGroup = new HSLayers.Layer.TreeLayer.Group();

        this.editLayers = [];
            
        var format = new HSLayers.Format.MapServer();
        try {
            this.baseGroup =  format.read(doc);
        } 
        catch(e) {
            this.events.triggerEvent("loadfail");
            throw new Error ("Bad layers response: "+e);
        }

        //this.baseGroup.setLayer(this);
        this.baseGroup.cascade(function(layer) {
            this.setLayer(layer);
        }, undefined, [this]);

        this.events.triggerEvent("layerloaded");
        this.events.triggerEvent("loadend");
    },

    /**
     * bubble objects up function
     * @function
     * @name HSLayers.Layer.TreeLayer.bubble
     * @param {Function} fnc
     * @param {Object} scope optional, default is this group
     * @param [{Mixed}]  args optional
     */
    bubble: function(fnc, scope, args) {
        args = args || [];
        if (this.baseGroup) {
            fnc.apply(scope || this.parentGroup, args);
            this.baseGroup.bubble(arguments);
        }
    },

    /**
     * Add salt&paper parameter to given URL
     * @name HSLayers.Layer.TreeLayer.saltURL
     * @function
     * @param {String} url
     */
    saltURL: function(url) {
        var l =  url.length-1;

        if (url.search(/\?/) == -1) {
            url += "?";
        }
        else if (url[l] != "&") {
            url += "&";
        }
        url+= "salt="+Math.random();
        return url;
    },

    /** 
     * combine the layer's url with its params and these newParams. 
     * @name HSLayers.Layer.TreeLayer.getFullRequestString
     * @function
     * @param  {Object} newParams New parameters that should be added to the request string.
     * @param {String} altUrl (optional) Replace the URL in the full request  string with the provided URL.
     * @returns {String} A string with the layer's url and parameters embedded in it.
     */
    getFullRequestString:function(newParams, altUrl) {
        // use layer's url unless altUrl passed in
        var url = (altUrl == null) ? this.url : altUrl;

        // get the session ID, if existing
        if (!newParams.mode == "lyrlist") {
            var sessionId = HSLayers.Util.getCookie("PHPSESSID");
            if (sessionId != "") {
                this.params.PHPSESSID = sessionId;
            }
            else {
                this.params.PHPSESSID = undefined;
            }
        }

        // create a new params hashtable with all the layer params and the 
        // new params together. then convert to string
        var allParams = OpenLayers.Util.extend({}, this.params);
        allParams = OpenLayers.Util.extend(allParams, newParams);
        
        // get list of visible layers

        //this.params.LAYERS = [];

        var layers;
        if (! newParams.layers) {
            layers = this.params.LAYERS = this._getVisibleLayerNames();
        }
        else {
            layers = newParams.layers;
        }
        allParams.layers = layers;
        allParams.LAYERS = layers;

        var paramsString = OpenLayers.Util.getParameterString(allParams);
        
        
        // if url is not a string, it should be an array of strings, 
        // in which case we will deterministically select one of them in 
        // order to evenly distribute requests to different urls.
        if (url instanceof Array) {
            url = this.selectUrl(paramsString, url);
        }   
        
        // ignore parameters that are already in the url search string
        var urlParams = OpenLayers.Util.getParameters(url);
        allParams = OpenLayers.Util.extend(urlParams,allParams);
        paramsString = OpenLayers.Util.getParameterString(allParams);

        
        // requestString always starts with url
        var requestString = url.split("?")[0];

        // MapServer needs '+' seperating things like bounds/height/width.
        //   Since typically this is URL encoded, we use a slight hack: we
        //  depend on the list-like functionality of getParameterString to
        //  leave ',' only in the case of list items (since otherwise it is
        //  encoded) then do a regular expression replace on the , characters
        //  to '+'
        //
        paramsString = paramsString.replace(/,/g, "+");
        
        if (paramsString != "") {
            var lastServerChar = requestString.charAt(url.length - 1);
            if ((lastServerChar == "&") || (lastServerChar == "?")) {
                requestString += paramsString;
            } else {
                if (requestString.indexOf('?') == -1) {
                    //serverPath has no ? -- add one
                    requestString += '?' + paramsString;
                } else {
                    //serverPath contains ?, so must already have paramsString at the end
                    requestString += '&' + paramsString;
                }
            }
        }
        
        return requestString;
    },

    /**
     * Get Layer object by given name
     * @name HSLayers.Layer.TreeLayer.getLayer
     * @function
     * @param {String} name
     * @return :js:class:`HSLayers.Layer.TreeLayer.Layer`
     */
    getLayer: function(name) {
        var obj = {layer: undefined, name: name};

        var searchLayer = function(obj) {
            if (this.name == obj.name) {
                obj.layer = this;
            }
        };

        this.baseGroup.cascade(function(obj) {
            this.foreachLayer(searchLayer, undefined, [obj])
        }, undefined, [obj]);

        return obj.layer;
    },

    /**
     * _getVisibleLayerNames
     * @function
     * @private
     * @return [{String}]
     */
    _getVisibleLayerNames: function() {

        if (!this.baseGroup) {
            return this.params.LAYERS;
        }

        var layers = this.getVisibleLayers();
        if (layers && layers.length) {
            return layers.map(function(l){return l.name;});
        }
        else {
            return [];
        }
    },

    /**
     * returns list of visible sublayers
     * @name HSLayers.Layer.TreeLayer.getVisibleLayers
     * @function
     * @returns [HSLayers.Layer.TreeLayer.Layer]
     */
    getVisibleLayers: function() {

        var layers = [];
        var obj = {layers: layers};

        this.baseGroup.foreachLayer(function(obj) {
                if (this.visibility && this.calculateInRange()) {
                    obj.layers.push(this);
                }
            }, undefined,  [obj]);

        this.baseGroup.cascade(function(obj) {
            this.foreachLayer(function(obj) {
                if (this.visibility && this.calculateInRange()) {
                    obj.layers.push(this);
                }
            }, undefined, [obj]);
        }, undefined, [obj]);

        return obj.layers;
    },

    /**
     * set sub layer visibility
     * @name HSLayers.Layer.TreeLayer.setLayerVisibility
     * @function
     * @param {String} name
     * @param {Boolean} visibility
     * @param {Boolean} redraw
     */
    setLayerVisibility: function(name, visibility,redraw) {
        var layer = this.getLayer(name);
        redraw = typeof(redraw) === "undefined" || redraw === true ? true : false;
        if (layer) {
            layer.toggleVisibility(visibility,redraw);
        }
    },

    CLASS_NAME: "HSLayers.Layer.TreeLayer"
});
