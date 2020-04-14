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
HSLayers.namespace("HSLayers.Control","HSLayers.Control.ArgParser");

/**
 * HSLayers.Control.ArgParser build on top of <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/ArgParser-js.html">OpenLayers.Control.ArgParser</a> and adds some more functionality.
 *
 * What it adds: 
 *
 * 1. Support for adding markers to map, while the map is initialized:
 *
 *   http://foo/bar/map?markers=[@title%3Dahoj@desc%3Dsvete@lon%3D15.2@lat%3D49.75%3B@title%3Dahoj2@desc%3Dsvete2@lon%3D15.5@lat%3D49.75]
 *
 *   
 *
 * @class HSLayers.Control.ArgParser
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/ArgParser-js.html">OpenLayers.Control.ArgParser</a>
 *
 * @example
 *   map.addControl(new HSLayers.Control.ArgParser({
 *          layer: this.vectorLayer,
 *          handlers: { 
 *              ows: function(url) {
 *                      // do something with the URL, which comes in the
 *                      // 'ows' parameter
 *                      }
 *              },
 *          scope: this,
 *          wmsUseTiles: true}));
 */

HSLayers.Control.ArgParser = OpenLayers.Class(OpenLayers.Control.ArgParser, {

    /**
     * layer for temporary drawings
     * @name HSLayers.Control.ArgParser.layer
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/Vector-js.html">OpenLayers.Layer.Vector</a>
     */
    layer: null,

    /**
     * What should happen, if something is found
     * @name HSLayers.Control.ArgParser.handlers
     * @type Object
     */
    handlers: {},

    /**
     * Scope for the handlers
     * @name HSLayers.Control.ArgParser.scope
     * @type Object
     */
    scope: null,

    /**
     * Set the map property for the control. 
     * @function
     * @name HSLayers.Control.ArgParser.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    setMap: function(map) {
        OpenLayers.Control.ArgParser.prototype.setMap.apply(this, arguments);

        // HSRS
        var markers = [];
        var args = OpenLayers.Util.getParameters();
        if (args.markers) {
            args.markers = args.markers.toString();
            var markersUnParsed = args.markers.replace(/^\[/,"").replace(/\]$/,"").split(";");
            for (var i = 0; i < markersUnParsed.length; i++) {
                var attrs = markersUnParsed[i].split("@");
                var lon = null;
                var lat = null;
                var title = null;
                var desc = null;
                for (var j = 0; j < attrs.length; j++) {
                    var val = attrs[j].split("=");
                    switch(val[0]) {
                        case "title": title = val[1]; break;
                        case "desc": desc = val[1]; break;
                        case "lon": lon = val[1]; break;
                        case "lat": lat = val[1]; break;
                        default: break;
                    }
                }
                markers.push({'title': title, 'desc': desc, 'lonlat': new OpenLayers.LonLat(lon,lat)});
            }
        }

        if (markers.length) {
            this.renderMarkers(markers);
        }

        if (args.vectors) {
            args.vectors = args.vectors.toString();
            this.renderVectors(args.vectors);
        }

        if (args.ows) {
            this.renderOWS(args.ows);
        }
        
        if (args.cgimapserver) {
            this.renderCgiMapServer(args.cgimapserver);
        }

    },

    /**
     * add HSLayers.Layer.MapServer.CgiMapServer layer passed by url param cgimapserver
     * @function
     * @name HSLayers.Control.ArgParser.renderCgiMapServer
     * @param {String} mapServerParams     
     */
    renderCgiMapServer: function(mapServerParams) {
        var json = new OpenLayers.Format.JSON();
        var params = json.read(mapServerParams);
        
        if (params.map && params.mapServer && params.getLayersUrl && params.name) {
            
            var options = {
                ratio: 1
            };
            
            if (params.projection) {
                options.projections = [params.projection]
            }
            var layer = new HSLayers.Layer.MapServer.CgiMapServer(
                params.name,
                params.mapServer,
                {
                    map: params.map,
                    map_imagetype: params.format,
                    transparent: "true"
                },
                options
            );              
            layer.getLayersUrl = params.getLayersUrl; 
            this.map.addLayer(layer);
        }
    },

    /**
     * render markers to the {@link mlayer}
     * @function
     * @name HSLayers.Control.ArgParser.renderMarkers
     * @type Objects[]
     */
    renderMarkers: function(markers){

        if (this.layer) {
            for (var i = 0; i < markers.length; i++) {

                var icon = OpenLayers.Util.getImagesLocation()+"icons/blue.png";
                var geometry = new OpenLayers.Geometry.Point(markers[i].lonlat.lon, markers[i].lonlat.lat)
                if (this.displayProjection) {
                    geometry = geometry.transform(this.displayProjection, this.map.projection);
                }

                var style = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style['default'],{
                            externalGraphic: icon,
                            fillOpacity:1,
                            pointRadius: 12
                            });
                var feature = new OpenLayers.Feature.Vector(geometry,
                                    { title: markers[i].title,
                                     description: markers[i].desc},
                                     style
                                     );

                feature.closeBox = true;
                feature.popupClass = HSLayers.Popup;
                feature.data.popupContentHTML = feature.data.description;

                this.layer.addFeatures([feature]);
            }
            this.layer.redraw();
        }
    },

    /**
     * Render given vectors to {@link HSLayers.Control.ArgParser.layer}
     * @function
     * @name HSLayers.Control.ArgParser.renderVectors
     * @param {string} wkt vector as well known text
     */
    renderVectors : function(wkt){
        var wktFormat = new OpenLayers.Format.WKT();
        if (this.layer)  {
            this.map.setLayerZIndex(this.layer,this.map.layers.length+1);
            this.layer.addFeatures(wktFormat.read(wkt));
        }
    },

    /**
     * Render OWS layer, if the handler is not set
     * @function
     * @name HSLayers.Control.ArgParser.renderOWS
     * @param {String} url
     */
    renderOWS: function(url) {
        

        url = unescape(url.replace("[","").replace("]",""));

        var params = OpenLayers.Util.getParameters(url)

        // display OWS Manager or not?
        if (params.layers) {
            this.addLayer(url,params);
        }
        else {

            if (this.handlers.ows) {
                this.handlers.ows.apply(this.scope,[url]);
            }
            else {
                var cls = (url.toLowerCase().search("service=wfs") > -1 ? HSLayers.OWS.WFS : HSLayers.OWS.WMS);

                var ows = new cls(this.map,
                    {
                    useTiles:this.wmsUseTiles,
                    onLayersAddedDone: function(){ },
                    asSingleLayers:false,
                    findTabPanel: true,
                    owsUrl:url
                });
            }
        }
    },

    /**
     * add new wms or wfs layer to map
     *
     * @name HSLayers.Control.ArgParser.addLayer
     * @function
     * @private
     *
     * @param {String} url
     * @param {Object} params parameters of the new layer
     */
    addLayer: function(url,params) {
        
        // wms
        var name = (params.name ? params.name : params.layers.toString().replace(/ /g,","));
        if (this.map.getLayersByName(name).length > 0) {
            this.map.getLayersByName(name)[0].setVibility(true);
        }
        else {
            if (params.service.toLowerCase() == "wms") {
                var layers = params.layers.toString().replace(/ /g,",");
                var layer = new OpenLayers.Layer.WMS(layers,url.split("?")[0],{layers:layers,transparent:true},{isBaseLayer: false, singleTile: params.singleTile,displayInLayerSwitcher:true});
                this.map.addLayer(layer);
            }
            else if (params.service.toLowerCase() == "wfs") {
                var features = params.features.toString().replace(/ /g,",");
                this.map.addLayer(new OpenLayers.Layer.WFS(name,url.split("?")[0],{features:features}));
            }
        }
    },
   
    /** 
     * As soon as all the layers are loaded, cycle through them and 
     *   hide or show them. 
     * @function
     * @private
     * @name HSLayers.Control.ArgParser.configureLayers2
     */
    configureLayers2: function() {
        if (this.layers.length == this.map.layers.length) { 
            var args = OpenLayers.Util.getParameters();
            for(var i = 0, len = this.map.layers.length; i < len; i++) {
                var layer = this.map.layers[i];
                if (layer.CLASS_NAME.search("HSLayers.Layer.MapServer") > -1) {
                    if(args["msLayer" + i]) {
                        var msLayers = args["msLayer" + i];
                        layer.setInitialVisibleLayers(msLayers);
                    }
                }            
            }            
            this.configureLayers();
        }
    },     

    /**
     * @name HSLayers.Control.ArgParser.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.ArgParser"
});
