/* Copyright (c) 2007-2011 Help Service - Remote Sensing s.r.o.
 * Author(s): Michal Sredl <sredl ccss cz>
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

HSLayers.namespace("HSLayers.Format.State");

/**
 * A tool to convert a map and its layers between Map/Layer object, JSON object and JSON string.
 *
 * For conversion between JSON object and JSON string OpenLayers.Format.JSON is used.
 * The key functions here are map2json(), layer2json() & json2layer(). The rest is more or less a syntactic suger. 
 * json2map() is not present as we assume that this should be done by the application.
 */
HSLayers.Format.State = OpenLayers.Class( { // OpenLayers.Format.JSON?

    /**
     * Instance of OpenLayers.Format.JSON for use in conversions
     */    
    JSON: null, 

    /**
     * Initialise this.JSON
     */
    initialize: function(options) {
        this.JSON = new OpenLayers.Format.JSON();
        
        // add new options to this
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Converts the map from Map object to text in JSON notation.
     *
     * Syntactic sugar for map2json() & OpenLayers.Format.JSON.write()
     *
     * @param {Object} map The map that should be converted
     * @param {Boolean} pretty Whether to use pretty notation
     * @param {Boolean} saveAll Whether all the layer attributes should be saved 
     * @returns {String} Text in JSON notation representing the map
     */
    map2string: function(map, pretty, saveAll) { 
        var json = this.map2json(map, saveAll);
        var text = this.JSON.write(json, pretty);
        return text;
    },

    /**
     * Converts the map from Map object to JSON.
     * Uses layers2json().
     *
     * Properties covered:
     *
     * - Map properties: scale, projection, center, title.
     *
     * - Layers properties: Those covered by layer2json().  
     *
     * The layer index is not covered, as we assume 
     * that it is corresponding to the layers order.
     *     
     * @param {Object} map The map that should be converted
     * @param {Boolean} saveAll Whether all the layer attributes should be saved 
     * @returns {Object} JSON object representing the map
     */
    write: function() {
        return this.map2json.apply(this,arguments);
    },
    map2json: function(map, saveAll) { 
        var json = {};

        if (map.metadata) {
            json = map.metadata.get();
        }

        if (map.user) {
            json.user = map.user.get();
        }

        // Map properties
        json.scale = map.getScale();
        json.projection = map.projection.getCode().toLowerCase();
        var center = map.getCenter();
        if (center) {
            json.center = [center.lon, center.lat];
        }
        json.units = map.units; 

        if (map.maxExtent) {
            json.maxExtent = {};
            json.maxExtent.left   = map.maxExtent.left;
            json.maxExtent.bottom = map.maxExtent.bottom;
            json.maxExtent.right  = map.maxExtent.right;
            json.maxExtent.top    = map.maxExtent.top;
        }
        
        json.minResolution = map.minResolution;
        json.maxResolution = map.maxResolution;
        json.numZoomLevels = map.numZoomLevels;

        json.resolutions = map.resolutions;
        json.scales = map.scales;
        json.sphericalMercator = map.sphericalMercator;


        // Layers properties
        json.layers = this.layers2json(map.layers, saveAll);

        return json; 
    },

    /**
     * Converts map layers from array of Layer objects to text in JSON notation.
     *
     * Syntactic sugar for layers2json() & OpenLayers.Format.JSON.write()
     *
     * @param {Array} layers Array of layers to be converted
     * @param {Boolean} Whether to use pretty notation
     * @param {Boolean} saveAll Whether all the layer attributes should be saved 
     * @returns {String} Text in JSON notation representing the layers
     */
    layers2string: function(layers, pretty, saveAll) {
        var json = this.layers2json(layers);
        var text = this.JSON.write(json, pretty);
        return text;
    },

    /**
     * Converts map layers into a JSON object.
     * Uses layer2json().
     * 
     * @param {Array} layers Map layers that should be converted
     * @param {Boolean} saveAll Whether all the layer attributes should be saved 
     * @returns {Array} JSON object representing the layers 
     */
    layers2json: function(layers, saveAll) { 

        var i,ilen;
        var json = [];

        for (i=0, ilen = layers.length; i < ilen; ++i) {
            var l = this.layer2json( layers[i], saveAll );
            if (l) {
                json.push(l);
            }
        }

        return json;
    },

    /**
     * Converts map layer from Layer object to text in JSON notation.
     *
     * Syntactic sugar for layer2json() & OpenLayers.Format.JSON.write()
     *
     * @param {Object} layer Layer to be converted
     * @param {Boolean} Whether to use pretty notation
     * @param {Boolean} saveAll Whether all the layer attributes should be saved 
     * @returns {String} Text in JSON notation representing the layer
     */
    layer2string: function(layer, pretty, saveAll) {
        var json = this.layer2json(layer, saveAll);
        var text = this.JSON.write(json, pretty);
        return text;
    },

    /**
     * Converts map layer into a JSON object.
     *    
     * Layer properties covered:  CLASS_NAME, name, url, params,
     *                            group, displayInLayerSwitcher, visibility, 
     *                            attribution, transitionEffect, 
     *                             isBaseLayer, minResolution,
     *                            maxResolution, minScale, maxScale, metadata, 
     *                            abstract, opacity, singleTile, removable, 
     *                            queryable, legend, projections,
     *                            wmsMinScale, wmsMaxScale
     *
     * The layer index is not covered, as we assume 
     * that it is corresponding to the layers order.
     *     
     * @param {Object} layer Map layer that should be converted
     * @param {Boolean} saveAll Whether all the layer attributes should be saved. Sometimes we want to save network traffic and save completely only the foreign layers, in such a case set saveAll to false.
     * @returns {Object} JSON object representing the layer 
     */ 
    layer2json: function(layer, saveAll) {
        var json = {};

        if (! layer instanceof OpenLayers.Layer) {
            return ;
        }

        if (layer.name.search("OpenLayers.Handler") === 0) {
            return ;
        }

        if (layer.name.search("HSLayers.Control") === 0 || layer.name.search("OpenLayers.Control") === 0) {
            return ;
        }
        
        // Check if the layer is foreigner 
        if (layer.saveState) {
            saveAll = true; // If so, make sure we save all the attributes
        }

        // Common stuff 

        // type
        json.className          = layer.CLASS_NAME;
        json.origClassName      = layer.CLASS_NAME; // the original type

        // name
        json.name               = layer.name;

        // options
        json.visibility         = layer.visibility;
        json.opacity            = layer.opacity;
        json.title              = layer.title;
        json.index              = layer.map.getLayerIndex(layer);
        json.path               = layer.path;

        if (saveAll) {
            json.group             = layer.group;
            json.displayInLayerSwitcher = layer.displayInLayerSwitcher;
            json.attribution       = layer.attribution;
            json.alwaysInRange     = layer.alwaysInRange;
            json.transitionEffect  = layer.transitionEffect;
            json.isBaseLayer       = layer.isBaseLayer;
            json.alwaywInRange     = layer.alwaysInRange;
            json.minResolution     = layer.minResolution;
            json.maxResolution     = layer.maxResolution;
            json.minScale          = layer.minScale;
            json.maxScale          = layer.maxScale;
            json.metadataURL       = layer.metadataURL; 
            json.capabilitiesURL   = layer.capabilitiesURL; 
            json.metadata          = layer.metadata; 
            json.abstract          = layer.abstract; 
            json.removable         = layer.removable; 
            json.dimensions        = layer.dimensions; 
            json.projection        = layer.projection.getCode(); 
            json.projections = [];
            if (layer.projections) {
                json
                for(var j=0; j < layer.projections.length; ++j) {
                    json.projections[j] = layer.projections[j].getCode().toLowerCase();
                }
            }
            if (layer.maxExtent) {
                json.maxExtent = {};
                json.maxExtent.left   = layer.maxExtent.left;
                json.maxExtent.bottom = layer.maxExtent.bottom;
                json.maxExtent.right  = layer.maxExtent.right;
                json.maxExtent.top    = layer.maxExtent.top;
            }

            // HTTPRequest
            if (layer instanceof OpenLayers.Layer.HTTPRequest) {

                json.className = "OpenLayers.Layer.HTTPRequest";        
                json.url    = layer.url; 
                json.params = layer.params; 

                // Grid
                if (layer instanceof OpenLayers.Layer.Grid) {

                    json.className = "OpenLayers.Layer.Grid";        
                    json.singleTile = layer.singleTile; 
                    json.ratio      = layer.ratio;
                    json.buffer     = layer.buffer;
                    if (layer.tileSize) {
                        json.tileSize = [layer.tileSize.w, layer.tileSize.h];
                    }

                    // XYZ, OSM
                    if (layer instanceof(OpenLayers.Layer.XYZ)) {
                        json.className = "OpenLayers.Layer.XYZ";
                        json.wrapDateLine = layer.wrapDateLine;
                        json.sphericalMercator = layer.sphericalMercator;
                    }

                    // WMS 
                    if (layer instanceof OpenLayers.Layer.WMS) {

                        json.className = "OpenLayers.Layer.WMS";        
                        json.legend      = layer.legend; 
                        json.wmsMinScale = layer.wmsMinScale;
                        json.wmsMaxScale = layer.wmsMaxScale;

                        if (layer instanceof HSLayers.Layer.WMS) {
                            json.className = "HSLayers.Layer.WMS";        
                        }

                        if (layer instanceof HSLayers.Layer.WFS) {
                            json.className = "HSLayers.Layer.WFS";        
                        }

                        if (layer instanceof HSLayers.Layer.WCS) {
                            json.className = "HSLayers.Layer.WCS";        
                        }
                    }

                    // MapServer 
                    if (layer instanceof OpenLayers.Layer.MapServer) {
                        json.className = "OpenLayers.Layer.MapServer";        
                        json.queryable = layer.queryable; 


                        if (layer instanceof HSLayers.Layer.TreeLayer) {
                            json.className = "HSLayers.Layer.TreeLayer";        
                            json.params = layer.params; 
                            json.params.LAYERS = layer._getVisibleLayerNames();
                        }
                    }
                }
            }

            // Vector 
            if (layer instanceof OpenLayers.Layer.Vector) {

                this._saveVectorLayer(json, layer);
            }

            // image
            if (layer instanceof OpenLayers.Layer.Image) {

                this._saveImageLayer(json, layer);
            }
        }
        else {
            if (json.className == "OpenLayers.Layer.Vector" &&
                !json.protocol && layer.features) {

                var format = new OpenLayers.Format.GeoJSON();
                var features = format.write(layer.features);
                json.features = (new OpenLayers.Format.JSON()).read(features);
            }
        }

        return json;
    },

    /**
     * @function
     * @private
     */
    _saveImageLayer: function(json, layer) {
        json.extent = layer.extent;
        json.url = layer.url;
        json.size = layer.size;
        return json;
    },

    /**
     * @function
     * @private
     */
    _saveVectorLayer: function(json, layer) {

            //json.className = layer.CLASS_NAME;        
            json.className = "OpenLayers.Layer.Vector";
            var o;

            // use protocol/format approach
            if (layer.CLASS_NAME != "HSLayers.Layer.SearchParser"  && layer.protocol) {

                // strategies
                //
                json.strategies = layer.strategies.map(
                                    function(s){
                                        var ret = {};
                                        if (s.options) {
                                            for (var i in s.options) {
                                                ret[i] = s.options[i];
                                            }
                                        }
                                        ret.className = s.CLASS_NAME;
                                        return ret;
                                    }
                );
                
                // protocol && format
                json.protocol = {
                    className: layer.protocol.CLASS_NAME,
                    options: {
                        format: {},
                        url: layer.protocol.url
                    }
                };

                for (o in layer.protocol.options) {
                    switch (o) {
                        case "format":
                            json.protocol.format = {};
                            break;
                        default:
                            json.protocol.options[o] = layer.protocol.options[o];
                           break;
                    }
                }

                if (json.protocol.format) {
                    json.protocol.format.className = layer.protocol.format.CLASS_NAME;
                    json.protocol.format.options = {};

                    for (o in layer.protocol.format.options) {
                        switch (o) {
                            case "internalProjection":
                            case "externalProjection":
                                var prj = (layer.protocol.options.format.options[o].getCode ?
                                           layer.protocol.options.format.options[o].getCode() :
                                           layer.protocol.options.format.options[o]);

                                json.protocol.format.options[o] = prj;
                                break;
                            default:
                                json.protocol.format.options[o] = layer.protocol.options.format.options[o];
                                break;
                        }
                    }
                }
            }

            // store features directly
            else {

                if (layer.features) {            
                    var format = new OpenLayers.Format.GeoJSON();
                    var features = format.write(layer.features);
                    json.features = (new OpenLayers.Format.JSON()).read(features);
                }

                if (layer.selectedFeatures) {    
                    json.selectedFeatures = [];
                    for (var i=0; i<layer.selectedFeatures.length; ++i) {
                        var index = layer.features.indexOf( layer.selectedFeatures[i] );
                        if (index >= 0) {
                            json.selectedFeatures.push(index);
                        }
                    }
                }
            }
    },

    /**
     * Syntactic sugar for OpenLayers.Format.JSON.write()
     *
     * @param {Object} json JSON object to be written
     * @param {Boolean} pretty Whether to use pretty notation
     * @returns {String} Text repesentation of the JSON object
     */ 
    json2string: function(json, pretty) {
        var text = this.JSON.write(json, pretty);
        return text;    
    },

    /**
     * Syntactic sugar for OpenLayers.Format.JSON.read()
     *
     * @param {String} text Text representing a JSON object
     * @returns {Object} JSON object corresponding to the text
     */ 
    string2json: function(text) { 
        var json = this.JSON.read(text, null); // do we need to provide the filter function here?
        return json;
    },

    /**
     * Converts map layer from text in JSON notation to Layer object
     *
     * Syntactic sugar for OpenLayers.JSON.read() & json2layer()
     * 
     * @param {String} text Text in JSON notation representing the layer
     * @returns {Object} Layer object corresponding to the given text
     */
    string2layer: function(text) {
        var json = this.JSON.read(text, null);
        var layers = this.json2layers(json);
        return layers;
    },

    /**
     * Converts map layer from JSON object to Layer object
     *
     * Only OpenLayers.Layer.WMS layer type is supported in the moment.
     * The layers of other types are silently discarded. 
     * 
     * The following layer properties are covered: CLASS_NAME, name, url, params, 
     *                            group, displayInLayerSwitcher, visibility, 
     *                            attribution, transitionEffect, 
     *                            isBaseLayer, minResolution,
     *                            maxResolution, minScale, maxScale, metadata, 
     *                            abstract, opacity, singleTile, removable, 
     *                            queryable, legend, projections,
     *                            wmsMinScale, wmsMaxScale
     *
     * @param {Object} json JSON object representing map layer
     * @returns {Object} Layer object corresponding to the JSON object if the layer type is supported. null is returned otherwise.
     */
    json2layer: function(json) { 
        var layer = null;        

        if (!json.className) {
            return layer;
        }
 
        // Common stuff

        // Projections
        var projections = [];
        if (json.projections) {
            for (var j=0; j < json.projections.length; ++j) {
                var proj = new OpenLayers.Projection(json.projections[j]);
                projections.push(proj);
            }
        }

        // Options
        var options = { group:                  json.group,
                        displayInLayerSwitcher: json.displayInLayerSwitcher,
                        visibility:             json.visibility,
                        alwaysInRange:          json.alwaysInRange,
                        attribution:            json.attribution,
                        transitionEffect:       json.transitionEffect,
                        isBaseLayer:            json.isBaseLayer,
                        minResolution:          json.minResolution,
                        maxResolution:          json.maxResolution,
                        minScale:               json.minScale,
                        maxScale:               json.maxScale,
                        metadataURL:            json.metadataURL,
                        capabilitiesURL:        json.capabilitiesURL,
                        metadata:               json.metadata,
                        abstract:               json.abstract,
                        opacity:                json.opacity,
                        dimensions:             json.dimensions,
                        removable:              json.removable,
                        title:                  json.title,
                        path:                   json.path,
                        projection:             json.projection,
                        projections:            projections
        };

        // maxExtent
        if (json.maxExtent) {
            var me = json.maxExtent;
            var maxExtent = new OpenLayers.Bounds(me.left, me.bottom, me.right, me.top);
            options.maxExtent = maxExtent;
        }

        // Set the type-specific options and construct the layer
        switch (json.className) {

            // The className is not necessarily the original CLASS_NAME
            // but rather the "deepest one" that is supported by layer2json()

            case "OpenLayers.Layer":
                layer = new OpenLayers.Layer(json.name,
                    options);
                break;

            case "OpenLayers.Layer.HTTPRequest":
                layer = new OpenLayers.Layer.HTTPRequest(json.name,
                    json.url,
                    json.params,
                    options);
                break;

            case "OpenLayers.Layer.XYZ":
                this.setXYZOptions(json, options);
                layer = new OpenLayers.Layer.XYZ(json.name,
                    json.url,
                    options);
                break;

            case "OpenLayers.Layer.Grid":
                this.setGridOptions(json, options);
                layer = new OpenLayers.Layer.Grid(json.name,
                    json.url,
                    json.params,
                    options);
                break;

            case "OpenLayers.Layer.WMS":   
                this.setGridOptions(json, options);
                this.setWmsOptions(json, options);
                layer = new OpenLayers.Layer.WMS(json.name, 
                    json.url,
                    json.params,
                    options
                );         
                break;

            case "HSLayers.Layer.WMS":
                this.setGridOptions(json, options);
                this.setWmsOptions(json, options);                
                options.sourceProjection = json.sourceProjection; // warped wms
                layer = new HSLayers.Layer.WMS(json.name,
                    json.url,
                    json.params, 
                    options);
                break;

            case "HSLayers.Layer.WFS":
                this.setGridOptions(json, options);
                this.setWmsOptions(json, options);                
                options.sourceProjection = json.sourceProjection; // warped wms
                layer = new HSLayers.Layer.WFS(json.name,
                    json.url,
                    json.params, 
                    options);
                break;

            case "HSLayers.Layer.WCS":
                this.setGridOptions(json, options);
                this.setWmsOptions(json, options);                
                options.sourceProjection = json.sourceProjection; // warped wms
                layer = new HSLayers.Layer.WCS(json.name,
                    json.url,
                    json.params, 
                    options);
                break;

            case "OpenLayers.Layer.MapServer":
                this.setGridOptions(json, options);
                this.setMapServerOptions(json, options);
                layer = new OpenLayers.Layer.MapServer(json.name,
                    json.url,
                    json.params,
                    options);
                break;

            case "HSLayers.Layer.MapServer":
                // deprecated
                this.setGridOptions(json, options);
                this.setMapServerOptions(json, options);
                layer = new HSLayers.Layer.MapServer(json.name,
                    json.url,
                    json.params,
                    options);
                break;

            case "HSLayers.Layer.TreeLayer":
                this.setGridOptions(json, options);
                this.setMapServerOptions(json, options);
                layer = new HSLayers.Layer.TreeLayer(json.name,
                    json.url,
                    json.params,
                    options);
                break;

            case "OpenLayers.Layer.Vector":
                options = this.setVectorOptions(json, options);
                layer = new OpenLayers.Layer.Vector(json.name,
                    options);

                if (options.features) {
                    layer.addFeatures(options.features);
                }
                break;

            case "OpenLayers.Layer.Image":
                layer = new OpenLayers.Layer.Image(json.name,
                    json.url,
                    new OpenLayers.Bounds(json.extent.left,
                                          json.extent.bottom,
                                          json.extent.right,
                                          json.extent.top),
                    new OpenLayers.Size(json.size.w,
                                        json.size.h),
                    options);
                break;

            default: 
                break;
        }
        
        return layer;
    },

    setXYZOptions: function(json, options) {
        options.sphericalMercator = json.sphericalMercator;
        options.wrapDateLine = json.wrapDateLine;
    },

    setGridOptions: function(json, options) {
        options.singleTile = json.singleTile; // grid
        options.ratio      = json.ratio;      // grid
        options.buffer     = json.buffer;     // grid
        if (json.tileSize) {
            options.tileSize = new OpenLayers.Size(json.tileSize[0], json.tileSize[1]); // grid
        }
    },

    setWmsOptions: function(json, options) {
        options.legend      =  json.legend;      // wms
        options.wmsMinScale =  json.wmsMinScale; // wms
        options.wmsMaxScale =  json.wmsMaxScale; // wms
    },

    setMapServerOptions: function(json, options) {
        options.queryable = json.queryable; // map server
    },

    setVectorOptions: function(json, options) {

        // features
        if (json.features) {
            var format = new OpenLayers.Format.GeoJSON();
            options.features = format.read(json.features);           

            // selected features
            if (json.selectedFeatures) {
                selectedFeatures = [];
                for (var i=0; i<json.selectedFeatures.length; ++i) {
                    var index = json.selectedFeatures[i];
                    var feature = options.features[index];
                    selectedFeatures.push(feature);
                }            
                options.selectedFeatures = selectedFeatures;
            }
        }
        // protocol
        else if (json.protocol) {
            var o;
            var format;
            if (json.protocol && json.protocol.format) {

                // Options of OpenLayers.Format
                var formatOptions = {};
                for (o in json.protocol.format.options) {
                    switch(o) {
                        case "internalProjection":
                        case "externalProjection":
                            formatOptions[o] = new OpenLayers.Projection(json.protocol.format.options[o]);
                        default:
                            formatOptions[o] = json.protocol.format.options[o];
                            break;
                    }
                }
                var cls  = eval(json.protocol.format.className);
                format = new cls(formatOptions);
            }

            // Options for OpenLayers.Protocol
            if (json.protocol) {
                var protoOptions = {};

                for (o in json.protocol.options) {
                    switch(o) {
                        case format:
                            break;
                        default:
                            protoOptions[o] = json.protocol.options[o];
                            break;
                    }
                }

                if (format) {
                    protoOptions.format = format;
                }

                // create protocol
                var cls = eval(json.protocol.className);
                options.protocol = new cls(protoOptions);

            }

            if (json.strategies) {
                options.strategies = json.strategies.map(
                        function(s){
                            var options = {};
                            for (var i in s) {
                                if (i != "className") {
                                    options[i] = s[i];
                                }
                            }
                            if (!options.url) {
                                //options.autoActivate = false;
                            }
                            return new (eval(s.className))(options)
                        });
            }
        }

        return options;
    },

    /**
     * Converts map layers from text in JSON notation to array of Layer objects
     *
     * Syntactic sugar for OpenLayers.JSON.read() & json2layers()
     * 
     * @param {String} text Text in JSON notation representing the layers
     * @returns {Array} Array of layers corresponding to the given text
     */
    string2layers: function(text) {
        var json = this.JSON.read(text, null);
        var layers = this.json2layers(json);
        return layers;
    },

    /**
     * Converts map layers from JSON object to array of Layer objects.
     * Uses json2layer().
     *
     * @param {Object} contextLayers JSON object representing map layers
     * @returns {Array} Array of Layer objects corresponding to the JSON object 
     */
    json2layers: function(json) { 
    
        var layers = [];

        for (var i=0; i < json.length; ++i) {
            var layer = this.json2layer(json[i]);
            if (layer !== null) {
                layers.push(layer);
            }
        }
        
        return layers;
    },


    /* We don't provide string2map() & json2map() functions as we assume that this should be done in the application. */

    CLASS_NAME: "HSLayers.Format.State"
});
