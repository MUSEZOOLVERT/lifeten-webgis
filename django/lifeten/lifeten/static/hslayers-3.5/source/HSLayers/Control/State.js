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
 * Read last state of the application from the server
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control-js.html">OpenLayers.Control</a>
 * 
 */
HSLayers.namespace("HSLayers.Control");
HSLayers.Control.State = OpenLayers.Class(OpenLayers.Control, {

        /**
         * @name HSLayers.Control.State.url
         * @type String
         */
        url: null,

        /**
         * @name HSLayers.Control.State.saveState
         * @type {HSLayers.Control.SaveState}
         */
        saveState: undefined,

        /**
         * @name HSLayers.Control.State.readState
         * @type {HSLayers.Control.ReadState}
         */
        readState: undefined,

        /**
        * @constructor
        * @name HSLayers.Control.ReadState
        * @param {String} url for the server part
        * @param {Object} saveoptions 
        * @param {Object} readoptions 
        */
        initialize: function(url,saveoptions,readoptions) {
            this.url = url;
            OpenLayers.Control.prototype.initialize.apply(this, [{}]);
            
            this.saveState = new HSLayers.Control.SaveState(this.url, saveoptions);
            this.readState = new HSLayers.Control.ReadState(this.url, readoptions);

        },

        /**
         * activate
         */
        activate: function() {
            this.saveState.activate(arguments);
            this.readState.activate(arguments);
            return OpenLayers.Control.prototype.activate.apply(this,arguments);
        },

        /**
         * setMap
         */
        setMap: function() {
            this.saveState.setMap(arguments[0]);
            this.readState.setMap(arguments[0]);
            return OpenLayers.Control.prototype.setMap.apply(this,arguments);
        },

        /**
         * destroy
         */
        destroy: function() {
            this.saveState.destroy(arguments);
            this.readState.destroy(arguments);
            delete this.saveState;
            delete this.saveState;
            return OpenLayers.Control.prototype.destroy.apply(this,arguments);
        },

        /**
         * destroy
         */
        getState: function() {
            this.readState.getState(arguments);
        },

        CLASS_NAME: "HSLayers.Control.State"
});

HSLayers.Control.ReadState = OpenLayers.Class(OpenLayers.Control, {

    /**
     * @name HSLayers.Control.ReadState.url
     * @type String
     */
    url: null,

    /**
     * @name HSLayers.Control.ReadState.project
     * @type string
     */
    project: undefined,

    /**
     * read state
     * @name HSLayers.Control.ReadState.state
     * @type Object
     */
    state: null,

    /**
     * @name HSLayers.Control.ReadState.EVENT_TYPES
     * @type [String]
     */
    EVENT_TYPES: ["beforeread","read"],

    /**
     * Parameters for editation, which can be added later
     * @name HSLayers.Control.ReadState.editingParams
     * @type Object
     */
    editingParams: {},

    /**
     * @constructor
     * @name HSLayers.Control.ReadState
     * @param {String} url for the server part
     * @param {Object} options 
     */
    initialize: function(url,options) {
        this.url = url;
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * This method will be called on xmlhttprequest success
     * @name HSLayers.Control.ReadState.readState
     * @function
     * @param {XMLHTTPRequest} xmlhttp
     */
    readState: function(xmlhttp) {
        this.state = new OpenLayers.Format.JSON().read(xmlhttp.responseText);

        if (this.state && this.state.success) {
            this.map.loadComposition(this.state);
        }
        this.events.triggerEvent("read");
    },

    /** 
     * Call this method, when you want to read the project state
     * @name HSLayers.Control.ReadState.getState
     * @function
     */
    getState: function() {
        if (this.url) {
            this.state = null;
            this.events.triggerEvent("beforeread");
            // we do not like proxys yet
            var proxy = OpenLayers.ProxyHost;
            OpenLayers.ProxyHost = null;
            OpenLayers.Request.GET({
            url: this.url,
            params: {
                request:"load",
                _salt: Math.random(),
                project: this.project || window.location.pathname
                },
            success: this.readState,
            failure: function(){this.events.triggerEvent("read");},
            scope:this
            });
            OpenLayers.ProxyHost = proxy;
        }
    },
    
    /**
     * Check for the given layer in JSON if it is already present in the map.
     * Match criteria: name & layer type.
     * @param {Object} Layer in JSON
     * @return {Integer} Index of layer if present, null otherwise. If more than one layer matches, the lowest corresponding index is returned.
     */
    findLayer: function(jsonLayer) {
        var result = null;         

        for (var i=0; i<this.map.layers.length; ++i) {            

            var name = this.map.layers[i].name;
            var className = this.map.layers[i].CLASS_NAME;   

            if ( name == jsonLayer.name &&
                (className == jsonLayer.className || className == jsonLayer.origClassName) ) { 
                result = i;
                break;
            }
        }
        return result;
    },


    /**
     * find feature with same coordinates and same attributes
     * getFeatureByAttributes
     * @private
     * @function
     */
    _getFeatureByCoordsAndAttrs: function(layer,feature) {
        var json = new OpenLayers.Format.JSON();
        for (var i = 0;  i < layer.features.length; i++) {
            var layerFeature = layer.features[i];

            // compare geometries
            if (layerFeature.geometry.equals(feature.geometry)) {
                // compare attributes
                var layerFeatureAttributes = json.write(layerFeature.attributes);
                var featureAttributes = json.write(feature.attributes);

                if (layerFeatureAttributes == featureAttributes) {

                    // feature found
                    return feature;
                }
            }
        }

        // no such feature found
        return false;
    },


    /**
     * @name HSLayers.Control.ReadState.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.ReadState"
});

OpenLayers.Control.HSReadState = HSLayers.Control.HSReadState;

/**
 * save current state of the application to the server
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control-js.html">OpenLayers.Control</a>
 */

HSLayers.Control.SaveState = OpenLayers.Class(OpenLayers.Control, {                

    /**
     * @name HSLayers.Control.SaveState.url
     * @type String
     */
    url: null,

    /**
     * @name HSLayers.Control.ReadState.project
     * @type string
     */
    project: undefined,

    /**
     * Structure to be saved
     * @name HSLayers.Control.SaveState.saveStructure
     * @type String
     */
    saveStructure: null,

    /**
     * Indicator, weather the state should be saved or not
     * @name HSLayers.Control.SaveState.dontSave
     * @type Boolean
     */
    dontSave: false,

    /**
     * @name HSLayers.Control.SaveState.EVENT_TYPES
     * @type [String]
     */
    EVENT_TYPES: ["beforesave","saved"],

    /**
     * @constructor
     * @name HSLayers.Control.SaveState
     * @param {String} url for the server part
     * @param {Object} options 
     */
    initialize: function(url,options) {
        this.url = url;
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },

    /**
     * @name HSLayers.Control.SaveState.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    setMap: function(map) {
        this.map = map;
        window.saveStateMap = this.map;
        window.saveStateControl = this;

        // Old way vvv
        //window.onunload = this.saveState;
        //window.onbeforeunload = this.saveState;
        
        // normal browsers
        if (window.addEventListener) {
            window.addEventListener("beforeunload", this.saveState, false);
        }
        // IE
        else if (window.attachEvent) {
            window.attachEvent("onbeforeunload", this.saveState);
        }
       
    },

    /**
     * @HSLayers.Control.SaveState.createContext
     * @returns {Object} context of layers
     */
    createContext: function() {

        // Structure to save 
        // Contains json of map & local control stuff        
        var saveStructure = {};

        // deactivate Editation
        if (HSLayers.Control.Editing) {
            var editings =  this.map.getControlsBy("CLASS_NAME","HSLayers.Control.Editing");
            for (var i = 0, len = editings.length; i < len; i++) {
                editings[i].deactivate();
            }
        }

        // Convert map to json
        var format = new HSLayers.Format.State();
        saveStructure.data = format.map2json(this.map,false);

        // Local control stuff
        saveStructure.request="save"; 
        saveStructure.project= this.project || window.location.pathname; 
        saveStructure.projectHref = window.location.pathname; 

        // Snapping settings
        for (var i = 0; i < this.map.controls.length; i++) { 
            if (HSLayers.Control.Snapping && this.map.controls[i] instanceof HSLayers.Control.Snapping) {
                var snap = this.map.controls[i];
                saveStructure.snapping = {
                    "tol":snap.snapParams.tol,
                    "active":snap.snapParams.active,
                    "units":snap.units
                };
            }
        }

        return saveStructure;
    },

    /**
     * @name HSLayers.Control.SaveState.saveState
     * @param {Event} e window.onload event
     */
    saveState: function(e) {

        saveStateControl.saveStructure = saveStateControl.createContext.apply(saveStateControl);
        saveStateControl.events.triggerEvent("beforesave");

        if (saveStateControl.dontSave) {
            saveStateControl.saveStructure.data.DONT_RESTORE=true;
        }
        else {
            saveStateControl.saveStructure.data.DONT_RESTORE=undefined;
        }
        var format  = new OpenLayers.Format.JSON();
        var str = format.write(saveStateControl.saveStructure,true);

        // save
        if (saveStateControl.url) {
            var reqUrl = saveStateControl.url;

            var proxy = OpenLayers.ProxyHost;
            OpenLayers.ProxyHost = null;
            var request =  OpenLayers.Request.POST({
                url: reqUrl, 
                data: str,
                async: false,
                success: function(xhr){
                    return;
                    //this.events.triggerEvent("saved");
                },
                failure: function(xhr){
                    return;
                         },
                scope:  saveStateControl
            });
            OpenLayers.ProxyHost = proxy;
        }
    },

    /**
     * addData costumise this empty method to your needs
     * it shall return the structure, you want to store
     * @function
     * @param {Object} saveStructure
     * @name HSLayers.Control.SaveState.addData
     * @returns {Object} saveStructure
     */
    addData: function(saveStructure) {
        return saveStructure;
    },

    /**
     * @name HSLayers.Control.SaveState.CLASS_NAME
     * @type String}
     */
    CLASS_NAME: "HSLayers.Control.SaveState"
});
OpenLayers.Control.HSSaveState = HSLayers.Control.SaveState;
