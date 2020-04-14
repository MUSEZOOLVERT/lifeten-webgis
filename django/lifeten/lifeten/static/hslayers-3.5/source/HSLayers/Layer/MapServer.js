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
 * Class: HSLayers.Layer.MapServer
 * MapServer layer, which is able to set LAYERS parameter
 *
 * Example:
 * (code)
 * var hslayer = new HSLayers.Layer.MapServer("HS-RS (HSRSMapServer)",
 *      "http://www.bnhelp.cz/mapserv/hsmap/hsmap.php"
 *      {project:"cr_hslayers",
 *       layers:"hrady_g zamky_g"},
 *      {visibility:false, isBaseLayer: false});
 *
 * (end)
 */
HSLayers.namespace("HSLayers.Layer");
HSLayers.Layer.MapServer = 
  OpenLayers.Class(OpenLayers.Layer.MapServer, {
    
    /**
     * Property: singleTile
     * {Boolean} Wheather the map should be single tiled or not
     */
    singleTile: true,

    /**
     * Property: initialized
     * {Boolean} Was the layer and groups initialized ?
     */
    initialized: false,

    /**
     * list of layers to be edited
     * @name HSLayers.Layer.MapServer.editLayers
     * @type [{Object}]
     */
    editLayers: [],

    // /**
    //  * hide icon in layerswitcher
    //  * @name HSLayers.Layer.MapServer.hideIcon
    //  * @type {Boolean}
    //  */
    // hideIcon: true,

    /**
     * list of all layers
     * @name HSLayers.Layer.MapServer.layers
     * @type [{Object}]
     */
    layers: [],

    /**
     * if the layer is loaded or not
     * @name HSLayers.Layer.MapServer.loaded
     * @type Boolean
     */
    loaded: false,

    /**
     * project name
     * @name HSLayers.Layer.MapServer.project
     * @type String
     */
    project: undefined,

    /**
     * Property: transitionEffect
     * {String} The transition effect to use when the map is panned or
     *     zoomed.  
     */
    transitionEffect: "resize",

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     *
     *  Added "layerloaded" event
     */
    EVENT_TYPES: ["loadstart", "loadend", "loadcancel", "visibilitychanged","layerloaded"],
     
    /**
     * Property: baseGroup
     * {Object} basic group for layers, which are not within other group
     */
    baseGroup: {},

    /**
     * Property: groups
     * {Array(Object)} List of groups of this layer
     */
    groups: [],

    /**
     * Constant: DEFAULT_PARAMS
     * {Object} Hashtable of default parameter key/value pairs 
     */
    DEFAULT_PARAMS: {
        mode: "map",
        map_imagetype: "gif"
    },
    
    /**
     * Property: initialVisibleLayers
     * {Array of String} - layer names which will be set as visible
     */
    initialVisibleLayers: null,

    /**
     * Method: setMap
     * Set the map property for the layer. This is done through an accessor
     *     so that subclasses can override this and take special action once 
     *     they have their map variable set. 
     * 
     *     Here we take care to bring over any of the necessary default 
        
     *     properties from the map. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
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
            var results = OpenLayers.loadURL(this.saltURL(this.getFullRequestString({mode:"lyrlist",layers:this.params.layers})), null, this, this.requestSuccess, this.requestFailure);
        }
    },
    
    /** 
     * Method: getFullRequestString
     * combine the layer's url with its params and these newParams. 
     *   
     * Parameter:
     * newParams - {Object} New parameters that should be added to the 
     *                      request string.
     * altUrl - {String} (optional) Replace the URL in the full request  
     *                              string with the provided URL.
     * 
     * Returns: 
     * {String} A string with the layer's url and parameters embedded in it.
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

        this.params.LAYERS = [];

        var layers;
        if (! newParams.layers) {
            layers = this.params.LAYERS = this.getCheckedLayers();
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
     * Method: getCheckedLayers
     * Returns list of visible layers
     * 
     * Returns: 
     * {Array(String)} List of layer names
     */
    getCheckedLayers: function() {
        var layers = [];


        if (!this.initialized) {
            return;
        }

        return this.baseGroup.getCheckedLayersName([]);

    },


    /**
     * Method: setLayerVisibility
     * Will redraw the map with new layer visibility
     *
     * Parameters:
     * name - {String} layer name
     * visibility - {Boolean} 
     */
    setLayerVisibility: function(name,visibility) {
        var layer = this.getLayer(name);
        layer.visible = visibility;

        this.redraw(true);

    },
    
    /**
     * Method: setGroupVisibility
     * Will redraw the map with new layers visibility
     *
     * Parameters:
     * name - {String} group name
     * visibility - {Boolean} 
     */
    setGroupVisibility: function(name,visibility) {
        var group = this.getGroup(name);
        group.setVisibility( visibility );

        this.redraw(true);

    },

    /**
     * Method: getGroup
     * Will return group
     *
     * Parameters:
     * name - {String} group name
     *
     * Returns:
     * {Object} group
     */
    getGroup: function(name) {
        for (var j = 0; j < this.groups.length; j++) {
            if (name == this.groups[j].name) {
                return this.groups[j];
            }
        }
        return null;
    },

    /**
     * Method: getLayer
     * Will return layer
     *
     * Parameters:
     * name - {String} layer name
     * group - {Object} base group object
     *
     * Returns:
     * {Object} layer
     */
    getLayer: function(name,group) {
        if (!group){
            group = this.baseGroup;
        }

        for (var id in group) {
            if (id.indexOf("__") == 0) {
                continue;
            }
            if (group[id].isLayer) {
                if (group[id].name == name) {
                    return group[id];
                }
            }
            if (group[id].isGroup) {

                var layer = this.getLayer(name,group[id]);
                // return only, when layer was found, continue otherwise
                if (layer) {
                    return layer;
                }
            }

        }

        return null;
    
    },
    
    /**
     * Method: requestSuccess
     * Process JSON after it has been loaded.
     * Called by setMap()
     *
     * Parameters:
     * request - {String} 
     */
    requestSuccess:function(request) {
        var doc = request.responseText;
        var obj = null;

        // reinit
        this.editLayers = [];
        this.layers = [];
            
        try {
           var format = new OpenLayers.Format.JSON();
           this.baseGroup =  format.read(doc);
           this.groups =  format.read(doc);
        } catch(e) {
            throw new Error ("Bad layers response: "+e);
        }

        this.setBouble(this.baseGroup);

        if (this.initialVisibleLayers != null) {
            this.initLayersVisibility(this.baseGroup);
        }

        for (var name in this.baseGroup) {
            try{
                this.initGroup(this.baseGroup);
            }catch(e){console.log(e);}
        }

        this.loaded = true;
        this.events.triggerEvent("layerloaded");
        this.initialized = true;
        

        // empty function
        this.onGroupsLoaded();

        this.redraw(true);
        this.events.triggerEvent("loadend");
    },
    

    /**
     * Method: setBouble
     * add boubeling function to all group objects
     */
    setBouble: function(group,base) {
        var boubleFunction = function(func, scope, args){
            if (!scope) {
                scope = this;
            }
            if (!args) {
                args = [];
            }
            func.apply(scope, args);
        };

        group.events = new OpenLayers.Events(group, undefined, ["visibilitychanged"],true,{});
        
        group.bouble = boubleFunction;
        group.__layer = this;
        group.__parentGroup = base;

        for (var name in group) {
            if (name.indexOf("__") == 0) {
                continue;
            }
            if (group[name].isGroup) {
                this.setBouble(group[name],group);
                group[name].name = name;
            }
            else if (group[name].isLayer) {
                group[name].name = name;
                group[name].__layer = this;
                group[name].__parentGroup = group;
            }
        }

    },

    /**
     * Method: initLayersVisibility
     * Initialize visibility of layers by property initialVisibleLayers
     *
     * Parameters:
     * obj - {Object} group or layer object
     */
    initLayersVisibility: function(obj) {
        for (var name in obj) {
            if (name.indexOf("__") === 0) {
                continue;
            }
            if (obj[name] != null) {
                if (obj[name].isGroup) {
                    this.initLayersVisibility(obj[name]);
                } else if (obj[name].isLayer) {
                    this.initLayerVisibility(obj[name]);
                }
            }
        }
    },

    /**
     * Method: initLayerVisibility
     * Initialize visibility of layer by property initialVisibleLayers
     *
     * Parameters:
     * layer - {Object} layer object
     */
    initLayerVisibility: function(layer) {
        if (this.initialVisibleLayers != null) {
            layer.visible = (this.initialVisibleLayers.indexOf(layer.name) != -1);
        }
    },
    
    /**
     * Method: initGroup
     * Initialize group of layers
     *
     * Parameters:
     * group - {Object} group object
     */
    initGroup : function(group) {

        // function for setting visibility of the whole group
        var setGroupVisibility = function(visibility,notRedraw) {
            for (var name in this) {

                if (name.indexOf("__") == 0) {
                    continue;
                }

                if (this[name].isGroup || this[name].isLayer) {

                    this[name].setVisibility(visibility,true);
                }
            }

            if (this.visibility != visibility) {

                this.visibility = visibility;
                this.events.triggerEvent("visibilitychanged");

                if (notRedraw != true) {
                    this.__layer.redraw(true);
                }
            }
        };

        // get the group visibility. if one layer is not visible, will
        // return false, if all layers are visible, will return true
        var getGroupVisibility = function() {
            var visibility = true;

            for (var name in this) {

                if (name.indexOf("__") == 0) {
                    continue;
                }

                if (this[name].isLayer) {
                    if (this[name].visible == false) {
                        return false;
                    }
                }
                if (this[name].isGroup) {
                    if (this[name].getVisibility() == false) {
                        return false;
                    }
                }
            }

            return visibility;
        };
        
        // get list of layer names, which are checked
        var getGroupCheckedLayersName = function(layers) {

            for (var name in this) {

                if (name.indexOf("__") == 0) {
                    continue;
                }

                if (this[name].isLayer) {
                    if (this[name].visible) {
                        layers.push(this[name].name);
                    }
                }
                else if (this[name].isGroup) {
                    layers.concat(this[name].getCheckedLayersName(layers));
                }
            }

            return layers;
        };

        // returns layer visibility
        var getLayerVisibility = function() {
            return this.visible;
        };

        // will return, wheather the layer fits to 
        // current scale or not
        var layerCalculateInRange = function() {
            var inScale = true;

            var curScale = this.__layer.map.getScale();
            if (this.minScale != -1) {
                if (Math.round(this.minScale) > Math.round(curScale)) {
                    inScale = false;
                }
            }

            if (this.maxScale != -1){
                if (Math.round(this.maxScale) < Math.round(curScale)) {
                    inScale = false;
                }
            }
            return inScale;
        };

        // will set the layer visibility
        var setLayerVisibility = function(visibility,notRedraw) {
            if (this.visible != visibility) {

                // switchers
                if (this.hsSwitch) { var baseLayer = this.__layer;
                    for (var i = 0; i < baseLayer.layers.length; i++) {
                        // switch all layers with same hsSwitch attribute
                        if (baseLayer.layers[i].hsSwitch ==
                            this.hsSwitch &&
                            baseLayer.layers[i] != this) {
                            baseLayer.layers[i].setVisibility(false,true);
                        }
                    }
                }

                this.visible = visibility;
                this.events.triggerEvent("visibilitychanged");
                if (notRedraw != true) {
                    this.__layer.redraw(true);
                }
            }
        };

        // set the methods to group object
        group.setVisibility = setGroupVisibility;
        group.getVisibility = getGroupVisibility;
        group.getCheckedLayersName = getGroupCheckedLayersName;

        // for each layer
        // set the methods to layer object
        for (var name in group) {

            if (name.indexOf("__") == 0) {
                continue;
            }

            obj = group[name];


            if (obj.isLayer) {

                var layer = obj;
                layer.getVisibility = getLayerVisibility;
                layer.setVisibility = setLayerVisibility;
                layer.calculateInRange = layerCalculateInRange;
                layer.visible = (layer.visible ? true : false );
                layer.queryable = (layer.queryable ? true : false);
                layer.events = new OpenLayers.Events(layer, undefined, ["visibilitychanged"],true,{});

                if (layer.edit && !layer.__addedEditLayer) {
                    layer.__addedEditLayer = true;
                    this.editLayers.push(layer);
                }
                this.layers.push(layer);
            }
            if (obj.isGroup) {
                this.initGroup(obj);
            }
        }
    },

    /**
     * Method: requestFailure
     * Process a failed loading of GML.
     * Called by initialise() and loadUrl() if there was a problem loading GML.
     *
     * Parameters:
     * request - {String} 
     */
    requestFailure: function(request) {
        alert(OpenLayers.i18n("errorLoadingHSRS", {'url':this.url}));
    },

    /**
     * Method: onGroupsLoaded
     *
     * To be rewritten 
     */
    onGroupsLoaded: function() {
    },

    /**
     * Method: saltURL
     * Add salt&paper parameter to given URL
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
     * Method: setInitialVisibleLayers
     * Initialize visibility of layers by property initialVisibleLayers
     *
     * Parameters:
     * visibleLayers - {String} layer name
     *               - {Array of String} layer names
     */
    setInitialVisibleLayers: function(visibleLayers) {
        if (! (visibleLayers instanceof Array)) {
            visibleLayers = [visibleLayers];
        }
        this.initialVisibleLayers = visibleLayers;
    },

    CLASS_NAME: "HSLayers.Layer.MapServer"
});

/*
 * Class: HSLayers.Layer.MapServer.CgiMapServer
 * Advanced HSMapServer layer. This class is useful if you can use different
 * URL for getting MAP structure and for generating map images (e.g. for using
 * MapServer CGI).
 *
 * Use:
 *
 * Url for generating map images (by MapServer CGI)
 * - http://server/cgi-bin/mapserv.exe
 *
 * Url for getting MAP structure
 * - http://server/tools/getlayers.php
 *
 * (code)
 *  var layer = new HSLayers.Layer.MapServer.CgiMapServer("Layer name",
 *          "http://server/cgi-bin/mapserv.exe",
 *          {map: "map_file_location"},
 *          {visibility:false, isBaseLayer: false});
 *  layer.getLayersUrl = "http://server/tools/getlayers.php";
 *  map.addLayer(layer)
 *
 *  var ls = new HSLayers.Layer.LayerSwitcher.HSLayer({container: layersTab });
 *  map.addControl(ls);
 * (end)
 *
 */
HSLayers.Layer.MapServer.CgiMapServer =
  OpenLayers.Class(HSLayers.Layer.MapServer, {
  
    /**
     * Property: getLayersUrl
     * Url for getting MAP file structure. If this property is empty,
     * property url will be used.
     */
    getLayersUrl: "",

    /**
     * Method: setMap
     * Set the map property for the layer. This is done through an accessor
     *     so that subclasses can override this and take special action once
     *     they have their map variable set.
     *
     *     Here we take care to bring over any of the necessary default
     *     properties from the map.
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
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
            var url = this.getLayersUrl;
            if (url == "") {
                url = this.url;
            }
            var results = OpenLayers.loadURL(this.saltURL(url), null, this, this.requestSuccess, this.requestFailure);
        }
    },


    CLASS_NAME: "HSLayers.Layer.MapServer.CgiMapServer"
});
