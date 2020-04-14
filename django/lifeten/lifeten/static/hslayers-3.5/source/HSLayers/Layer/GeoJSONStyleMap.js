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
 * Default visualization by attributes.
 * @class HSLayers.Layer.GeoJSONStyleMap
 */ 
HSLayers.namespace("HSLayers.Layer");
HSLayers.Layer.GeoJSONStyleMap = OpenLayers.Class({
    
    // **********************************************************************
    // private members
    // **********************************************************************
    
    /**
     * @private
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap._addRulesForStyle
     *
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Style-js.html">OpenLayers.Style</a>} style
     * @param {Object} rulesDefinition
     *     
     * @returns {Object}
     */
    _addRulesForStyle: function(style, rulesDefinition) {
        if (rulesDefinition) {
            for (var i = 0; i < rulesDefinition.length; i++) {
                var rule = new OpenLayers.Rule();
                rule.filter = this._createFilter(rulesDefinition[i].filter);
                rule.symbolizer = rulesDefinition[i].style;                    
                style.addRules([rule]);
            }
        }
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap._createFilter
     *
     * @param {Object} filterOptions
     *
     * @returns {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Filter-js.html">OpenLayers.Filter</a>}
     */
    _createFilter: function(filterOptions) {
        var filter = null;
        if (filterOptions) {
            if (filterOptions.cls) {
                switch (filterOptions.cls) {
                    case "OpenLayers.Filter.Comparison":
                        filter = new OpenLayers.Filter.Comparison(filterOptions);
                        break;
                    case "OpenLayers.Filter.Logical":
                        filter = new OpenLayers.Filter.Logical(filterOptions);
                        break;
                    case "OpenLayers.Filter.Spatial":
                        filter = new OpenLayers.Filter.Spatial(filterOptions);
                        break;
                }
            }
        }
        return filter;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap._createBaseContext
     *
     * @param {Object} layerDefinition
     *
     * @returns {Object}
     */
    _createBaseContext: function(layerDefinition) {

        var context = {
            getFeatureValue: function(feature, attrName, styleName, defaultValue) {
                var value = defaultValue;
                
                var attrValue = null;
                var realAttrName = attrName;
                for (name in feature.attributes) {
                    if (name.toUpperCase() == attrName.toUpperCase()) {
                        realAttrName = name;
                        attrValue = feature.attributes[realAttrName];
                        break;
                    }
                }                
                
                if ((attrValue == null) || (attrValue == "")) {
                    value = context.getStyleValue(styleName, defaultValue);
                } else {
                    value = feature.attributes[realAttrName];
                }                
                return value;
            },

            getStyleValue: function(name, defaultValue) {
                var value = defaultValue;
                if (layerDefinition.style != null) {
                    if(layerDefinition.style[name] != null) {
                        value = layerDefinition.style[name];
                    }
                }
                return value;
            }
        };
        return context;
    },

    /**
     * @private
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap._createIconContext
     *
     * @param {Object} layerDefinition
     *
     * @returns {Object}
     */
    _createIconContext: function(layerDefinition) {

        var context = this._createBaseContext(layerDefinition);
        
        context.getHeight = function(feature) {
            return context.getFeatureValue(feature, "iconHeight", "iconHeight", 32);
        };
            
        context.getWidth = function(feature) {
            return context.getFeatureValue(feature, "iconWidth", "iconWidth", 32);
        };
        
        context.getIconUrl = function(feature) {    
            var icon = context.getFeatureValue(feature, "icon", "defaultIcon", "grn-pushpin.png");
            var url = context.getStyleValue(
                "iconUrl", OpenLayers.ImgPath + "icons/"
            );
            url = url + icon;
            return url;
        };
        
        return context;
    },

    // **********************************************************************
    // public members
    // **********************************************************************
    
    /**
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap.createIconStyleMap
     *
     * @param {Object} layerDefinition
     *
     * @returns {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/StyleMap-js.html">OpenLayers.StyleMap</a>}
     */
    createIconStyleMap: function(layerDefinition) {
        var templateDefault = {};
        var templateSelect = {};

        templateDefault = {
            externalGraphic: "${getIconUrl}",
            graphicWidth: "${getWidth}",
            graphicHeight: "${getHeight}",
            fillOpacity: 1,
            cursor: "pointer"
        }
        templateSelect = templateDefault;
        
        var context = this._createIconContext(layerDefinition);
        
        var styleDefault = new OpenLayers.Style(templateDefault, {context: context});
        var styleSelect = new OpenLayers.Style(templateSelect, {context: context});
        var styleMap = new OpenLayers.StyleMap({"default": styleDefault, "select": styleSelect});
        return styleMap;
    },

    /**
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap.createGeneralStyleMap
     *
     * @param {Object} layerDefinition
     *
     * @returns {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/StyleMap-js.html">OpenLayers.StyleMap</a>}
     */
    createGeneralStyleMap: function(layerDefinition) {
        var templateDefault = {};
        var templateSelect = {};

        templateDefault = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        templateSelect = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['select']);
        if (layerDefinition.style != null) {
            if (layerDefinition.style.defaultStyle != null) {
                for (var name in layerDefinition.style.defaultStyle) {
                    if (name != "rules") {
                        templateDefault[name] = layerDefinition.style.defaultStyle[name];
                    }
                }
            }
            if (layerDefinition.style.selectStyle != null) {
                for (var name in layerDefinition.style.selectStyle) {
                    if (name != "rules") {
                        templateSelect[name] = layerDefinition.style.selectStyle[name];
                    }
                }
            }
        }
        
        var styleDefault = new OpenLayers.Style(templateDefault, {});
        if (layerDefinition.style && layerDefinition.style.defaultStyle) {
            this._addRulesForStyle(styleDefault, layerDefinition.style.defaultStyle.rules);
        }
        var styleSelect = new OpenLayers.Style(templateSelect, {});
        if (layerDefinition.style && layerDefinition.style.selectStyle) {
            this._addRulesForStyle(styleSelect, layerDefinition.style.selectStyle.rules);
        }
        var styleMap = new OpenLayers.StyleMap({"default": styleDefault, "select": styleSelect});
        return styleMap;
    },

    /**
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap.createGeoJsonStyleMap
     *
     * @param {Object} layerDefinition
     *
     * @returns {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/StyleMap-js.html">OpenLayers.StyleMap</a>}
     */
    createGeoJsonStyleMap: function(layerDefinition) {
        var styleMap = null;
        var useIcon = false;
        if (layerDefinition.style) {
            useIcon = (layerDefinition.style.useIcon === true);
        }
        if (useIcon) {
            styleMap = this.createIconStyleMap(layerDefinition);
        } else {
            styleMap = this.createGeneralStyleMap(layerDefinition);
        }
        return styleMap;
    },
    
    /**
     * @function
     * @name HSLayers.Layer.GeoJSONStyleMap.initialize
     */
    initialize: function() {
        // nop;
    },            
    
    /**
     * @name HSLayers.Layer.GeoJSONStyleMap.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Layer.GeoJSONStyleMap"
});
