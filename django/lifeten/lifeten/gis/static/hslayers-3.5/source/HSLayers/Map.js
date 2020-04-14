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
HSLayers.namespace("HSLayers.Map");

/**
 * OpenLayers.Map redefinition
 *
 * @class
 * @name HSLayers.Map
 * @augments OpenLayers.Map
 *
 */
HSLayers.Map = OpenLayers.Class(OpenLayers.Map, {

    /**
     * @type HSLayers.Map.User
     */
    user: undefined,

    /**
     * @type HSLayers.Map.Metadata
     */
    metadata: undefined,

    /**
     * @type HSLayers.Map.uuid
     */
    uuid: undefined,

    /**
     * @constructor
     */
    initialize: function() {

        OpenLayers.Map.prototype.initialize.apply(this, arguments);

        if (!this.user) {
            this.user = new HSLayers.User();
        }

        if (!this.metadata) {
            this.metadata = new HSLayers.Metadata();
        }

        // set id
        this.setNewUuid();

    },

    /**
     * load compostion data
     * @function
     * @param {Object} state
     * @param {Object} cfg overwrite configuration
     */
    loadComposition: function(state, cfg) {
        cfg = cfg || {all:true};
        state = (typeof(state) == "string" ? 
                OpenLayers.Format.JSON.prototype.read(state) : state);
        var indexed_layers = [];
        var data;
        if (state.data) {
            data = state.data;
        }
        else {
            data = state;
        }


        // everything except the layer
        if (cfg.all) {
            // id
            if (state.id) {
                this.setUuid(state.id);
            }
            // metadata
            this.metadata.set(data);
            // user
            this.user.set(data.user);
            // extent
            if (data.extent) {
                data.extent = data.extent.map(function(c){ return parseFloat(c);});
                var bounds = new OpenLayers.Bounds(data.extent[0], data.extent[1],
                                                   data.extent[2], data.extent[3]);
                bounds.transform(new OpenLayers.Projection("epsg:4326"),
                                this.getProjectionObject());
            }

            /* Center & Scale */
            // Center
            if (data.center && this.getMaxExtent()) {
                var centerLonLat = new OpenLayers.LonLat(data.center[0], data.center[1]);
                this.setCenter(centerLonLat);
            }

            // Scale 
            if (data.scale && this.getCenter()) { 
                this.zoomToScale(data.scale,true);
            }


            /* Control stuff */
            // Snapping settings
            if (data.snapping) {
                var snapFound = false;
                var snapObj = {
                    distance: parseInt(data.snapping.tol,10),
                    units: data.snapping.units,
                    active: data.snapping.active
                };

                var snapping = this.getControlsBy("CLASS_NAME","HSLayers.Control.Snapping");
                if (snapping.length) {
                    snapping[0].updateParams(snapObj);
                }
                else {
                    this._editingParams = {snap: snapObj};
                }
            }
        }

        // parse layers layers
        if (cfg.all || cfg.newlayers) {
            // Format tool
            var format = new HSLayers.Format.State();

            // Layers

            // construct function to check if the 
            // layer is already in the map
            var findLayer = function(existing,json) {
                if (existing.name == json.name &&
                    (existing.CLASS_NAME == json.className ||
                     existing.CLASS_NAME == json.origClassName)) {
                     return true;
                }
                else {
                    return false;
                }
            };

            for (i = 0; i < data.layers.length; i++) {          
                var jsonLayer = data.layers[i];

                var layers = this.getLayersByFunction(findLayer, [jsonLayer]);
                var layer;

                // The layer is not yet in the map
                if (!layers.length) {

                    // Create new layer and add it to the map
                    layer = format.json2layer(jsonLayer);
                    if (layer !== null) {
                        this.addLayer(layer);
                    }
                } 
                // The layer is already in the map
                else { 
                    layer = layers[0];
                    indexed_layers.push(layer);

                    // Set visibility & opacity
                    layer.setVisibility(jsonLayer.visibility);
                    layer.setOpacity(jsonLayer.opacity);
                    if (layer._isBaseContextLayer !== true && jsonLayer.title != layer.title) {
                        layer.title = jsonLayer.title;
                        layer.map.events.triggerEvent("changelayer", {
                            layer: layer, property: "title" });
                    }
                    if (layer._isBaseContextLayer !== true && jsonLayer.path != layer.path) {
                        layer.path = jsonLayer.path;
                        layer.map.events.triggerEvent("changelayer", {
                            layer: layer, property: "path" });
                    }

                    // vector features
                    if (jsonLayer.features && layer instanceof OpenLayers.Layer.Vector) {
                        var f = new OpenLayers.Format.GeoJSON();
                        var features = f.read(jsonLayer.features);
                        for (var j = 0, jlen = features.length; j < jlen; j++) {
                            var feature = features[j];
                            if (this._getFeatureByCoordsAndAttrs(layer,feature) === false) {
                                layer.addFeatures([features[j]]);
                            }
                        }
                    }
                    
                    // Set visible layers for HSLayers.Layer.MapServer 
                    if (layer instanceof HSLayers.Layer.TreeLayer) {
                        this._setHSLLayerMapServerVisibility(layer, jsonLayer);
                    }
                }

                // add original map layer to state position
                if (layer !== null) {
                    data.layers[i] = layer;
                }
            }
        }


        if (cfg.all) {
            // set layers index
            for (var i = 0, len = data.layers.length; i < len; i++) {
                var jsonLayer = data.layers[i];
                var layer = this.layers[i];
           
                // layer index
                if ((indexed_layers.indexOf(jsonLayer) > -1) && jsonLayer != layer && (
                        jsonLayer.isBaseLayer === false && layer.isBaseLayer === false) ) {
                    
                    this.setLayerIndex(jsonLayer, i);
                }
            }
        }
    },

    /**
     * returns layer by defined function
     * @function
     * @param {Function} fnc
     * @param {[Object]} params
     * @param {Object} scope
     * @returns [{OpenLayers.Layer}]
     */
    getLayersByFunction: function(fnc,params,scope) {
        scope = scope  || this;
        params = params ? params : [];
        var layers = [];
        for (var i = 0, ilen = this.layers.length; i < ilen; i++) {
            var pars = [this.layers[i]].concat(params);
            if (fnc.apply(scope,pars)) {
                layers.push(this.layers[i]);
            }
        }

        return layers;
    },

    /**
     * Set visibility of HSLayers.Layer.MapServer layers
     * @param {HSLayers.Layer.MapServer layer
     * @param {Object} jsonLayer
     */
    _setHSLLayerMapServerVisibility: function(layer,jsonLayer) {

        layer.events.register("layerloaded",{layer:layer,state:jsonLayer},

                // after HSLayers.Layer.MapServer is loaded
                // go through all layers, set proper visibility
                // and trigger visibilitychanged event
                function() {
                    var layers = [];
                    if (this.state && this.state.params && this.state.params.LAYERS) {
                        layers = this.state.params.LAYERS;
                    }

                    this.layer.baseGroup.cascade(function(layers) {

                        this.foreachLayer(function(layers) {
                            if (layers.indexOf(this.name) > -1) {
                                this.toggleVisibility(true, false);
                            }
                            else {
                                this.toggleVisibility(false, false);
                            }
                        },undefined, [layers]);

                    }, undefined, [layers]);


                    // redraw whole layer at the end
                    layer.redraw(true);
                }
        );
    },

    /**
     * set new uuid of this map
     * @returns {String}
     */
    setNewUuid: function() {
        this.uuid = this.generateUuid();
        return this.uuid;
    },

    generateUuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
    },

    /**
     * set uuid of this map
     * @returns {String}
     */
    setUuid: function(uuid) {
        if (uuid) {
            this.uuid = uuid;
        }
        return this.uuid;
    },


    CLASS_NAME: "HSLayers.Map"
});
