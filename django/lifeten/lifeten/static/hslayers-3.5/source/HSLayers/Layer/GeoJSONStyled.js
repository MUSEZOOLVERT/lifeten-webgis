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
 * @class HSLayers.Layer.GeoJSONStyled
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/GML-js.html">OpenLayers.Layer.GML</a>  
 */ 
HSLayers.namespace("HSLayers.Layer");
HSLayers.Layer.GeoJSONStyled = OpenLayers.Class(OpenLayers.Layer.GML, {
    
    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @function
     * @name HSLayers.Layer.GeoJSONStyled._createGeoJsonStyleMap
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
     * @name HSLayers.Layer.GeoJSONStyled.initialize
     *
     * @param {Object} layerDefinition
     * @param {Object} options hashtable of extra options to tag onto the layer.
     */
     initialize: function(layerDefinition, options) {
        
        options.format = OpenLayers.Format.GeoJSON;
        options.styleMap = this._createGeoJsonStyleMap(layerDefinition);
        
        var newArguments = [];
        newArguments.push(
            layerDefinition.title, layerDefinition.url, options
        );
        
        OpenLayers.Layer.GML.prototype.initialize.apply(this, newArguments);
    },         

    /**
     * @name HSLayers.Layer.GeoJSONStyled.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Layer.GeoJSONStyled"
});
