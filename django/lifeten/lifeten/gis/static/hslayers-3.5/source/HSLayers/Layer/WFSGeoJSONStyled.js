/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Martin Vlk
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
 * Vector layer with default visualization by attributes.
 * @class HSLayers.Layer.WFS.GeoJSONStyled
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/WFS-js.html">OpenLayers.Layer.WFS</a>  
 */ 
HSLayers.namespace("HSLayers.Layer.WFS");
HSLayers.Layer.WFS.GeoJSONStyled = OpenLayers.Class(OpenLayers.Layer.WFS, {
    
    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @function
     * @name HSLayers.Layer.WFS.GeoJSONStyled._createGeoJsonStyleMap
     *
     * @param {Object} layerDefinition
     */
    _createGeoJsonStyleMap: function(layerDefinition) {
        var geoJsonStyleMap = new HSLayers.Layer.GeoJSONStyleMap({});
        return geoJsonStyleMap.createGeoJsonStyleMap(layerDefinition);
    },
    
    // **********************************************************************
    // public members
    // **********************************************************************

    /** 
     * @function
     * @name HSLayers.Layer.WFS.GeoJSONStyled.getFullRequestString
     *
     * @param {Object} newParams
     * @param {String} altUrl use this as the url instead of the layer's url
     */
    getFullRequestString:function(newParams, altUrl) {
        this.params.zoom = this.map.getZoom();
        return OpenLayers.Layer.WFS.prototype.getFullRequestString.apply(
            this, arguments
        );
    },

    /**
     * @function
     * @name HSLayers.Layer.WFS.GeoJSONStyled.initialize
     *
     * @param {Object} layerDefinition
     * @param {Object} options hashtable of extra options to tag onto the layer.
     */
     initialize: function(layerDefinition, options) {
        
        options.vectorMode = true;
        options.format = OpenLayers.Format.GeoJSON;
        options.ratio = 1.5;
        options.styleMap = this._createGeoJsonStyleMap(layerDefinition);
        
        var newArguments = [];
        newArguments.push(
            layerDefinition.title, layerDefinition.url, {}, options
        );
        
        OpenLayers.Layer.WFS.prototype.initialize.apply(this, newArguments);
    },         

    /**
     * @name HSLayers.Layer.WFS.GeoJSONStyled.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Layer.WFS.GeoJSONStyled"
});
OpenLayers.Layer.WFS.GeoJSONStyled = HSLayers.Layer.WFS.GeoJSONStyled;
