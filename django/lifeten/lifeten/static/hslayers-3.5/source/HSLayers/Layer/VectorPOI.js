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
 * Vector layer for POIs.
 * @class HSLayers.Layer.VectorPOI
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/Vector-js.html">OpenLayers.Layer.Vector</a>  
 */ 
HSLayers.Layer.VectorPOI = OpenLayers.Class(OpenLayers.Layer.Vector, {
    
    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Layer.VectorPOI._params
     * @type Object
     */
    _params: null,
    
    /**
     * @private
     * @function
     * @name HSLayers.Layer.VectorPOI._createChartStyleMap
     */
    _createStyleMap : function() {

        var styleContext = {        
            existsIcon: function(feature) {
                var icon = this.getIconName(feature);
                return ! ((icon == null) || (icon == ""));
            },
            
            getIconName: function(feature) {
                var icon = null;
                for (attrName in feature.attributes) {
                    if (attrName.toUpperCase() == "ICON") {
                        icon = feature.attributes[attrName];
                    }
                }
                return icon;
            },

            getIconUrl: function(feature, styleNameDefault, defaultIcon) {
                var url = "";
                var icon = "";
                if (styleContext.existsIcon(feature)) {
                    icon = this.getIconName(feature);
                    url = styleContext.getParamsValue(
                        "iconUrl", OpenLayers.ImgPath + "icons/"
                    );
                } else {
                    icon = styleContext.getParamsValue(styleNameDefault, defaultIcon);
                    url = styleContext.getParamsValue(
                        "defaultIconUrl", OpenLayers.ImgPath + "icons/"
                    );
                }
                return url + icon;
            },

            getIconUrlDefault: function(feature) {
                return styleContext.getIconUrl(feature, "defaultIcon", "blue-pushpin.png");
            },
            
            getIconUrlSelect: function(feature) {
                return styleContext.getIconUrl(feature, "defaultIconSelect", "red-pushpin.png");
            },

            getGraphicHeight: function(feature) {
                return styleContext.getIconParamsValue(
                    feature, "iconHeight", "defaultIconHeight", 32
                );
            },

            getGraphicWidth: function(feature) {
                return styleContext.getIconParamsValue(
                    feature, "iconWidth", "defaultIconWidth", 32
                );
            },

            getGraphicXOffset: function(feature) {
                return styleContext.getIconParamsValue(
                    feature, "iconXOffset", "defaultIconXOffset", -10
                );
            },

            getGraphicYOffset: function(feature) {
                return styleContext.getIconParamsValue(
                    feature, "iconYOffset", "defaultIconYOffset", -32
                );
            },

            getParamsValue: function(name, defaultValue) {
                var value = defaultValue;
                if (styleContext.params != null) {
                    if(styleContext.params[name] != null) {
                        value = styleContext.params[name];
                    }
                }
                return value;
            },

            getIconParamsValue: function(feature, existsName, defaultName, defaultValue) {
                var value = defaultValue;
                if (styleContext.existsIcon(feature)) {
                    value = styleContext.getParamsValue(existsName, defaultValue);
                } else {
                    value = styleContext.getParamsValue(defaultName, defaultValue);
                }
                return value;
            }
        };

        styleContext.params = this._params;

        var template1 = {
            fillOpacity: 1.0,
            externalGraphic: "${getIconUrlDefault}",
            graphicWidth: "${getGraphicWidth}",
            graphicHeight: "${getGraphicHeight}",
            graphicXOffset: "${getGraphicXOffset}",
            graphicYOffset: "${getGraphicYOffset}",
            strokeWidth: 0,
            cursor: "pointer"
        };

        var template2 = {
            fillOpacity: 1.0,
            externalGraphic: "${getIconUrlSelect}",
            graphicWidth: "${getGraphicWidth}",
            graphicHeight: "${getGraphicHeight}",
            graphicXOffset: "${getGraphicXOffset}",
            graphicYOffset: "${getGraphicYOffset}",
            strokeWidth: 0,
            cursor: "pointer"
        };

        var style1 = new OpenLayers.Style(template1, {context: styleContext});
        var style2 = new OpenLayers.Style(template2, {context: styleContext});
        var styleMap = new OpenLayers.StyleMap({"default": style1, "select": style2});
        return styleMap;
    },
    
    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Layer.VectorPOI.initialize
     *
     * @param {Object} params parameters for displaing POIs
     * @param {Object} options layer's options.
     */
     initialize: function(params, options) {

        this._params = params;
        options.styleMap = this._createStyleMap();
        
        var newArguments = [];
        newArguments.push(OpenLayers.i18n("searchedObjects"), options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
    },         

    /**
     * @name HSLayers.Layer.ChartLayer.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Layer.VectorPOI"
});

OpenLayers.Layer.VectorPOI = HSLayers.Layer.VectorPOI;
