/* Copyright (c) 2007-2011 Help Service - Remote Sensing s.r.o.
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

HSLayers.namespace("HSLayers.Embed");

/**
 * Base abstract class for dynamic embedding map into the HTML page.
 * It must be overridden and not used directly.
 *
 * @class HSLayers.Embed
 */
HSLayers.Embed = OpenLayers.Class({

    /**
     * @function
     * @name HSLayers.Embed.initialize
     */
    initialize : function(options) {
        // nop;
    },

    /**
     * @function
     * @name HSLayers.Embed.createControlsForMap
     */
    createControlsForMap: function() {
        // nop;
    },

    /**
     * @function
     * @name HSLayers.Embed.createMap
     * @param {Object} context
     * @param {Array of OpenLayers.Layer} layers
     */
    createMap: function(context, layers) {
        this.map = new OpenLayers.Map(this.getElementIdForMap(), {
            maxExtent: new OpenLayers.Bounds(
                context.maxExtent.left, context.maxExtent.bottom,
                context.maxExtent.right, context.maxExtent.top
            ),
            resolutions: this._initResolutions(context),
            minResolution: context.minResolution,
            maxResolution: context.maxResolution,
            sphericalMercator: context.sphericalMercator,
            scales: context.scales,
            units: context.units,
            controls: [
                new OpenLayers.Control.Navigation({zoomBoxKeyMask: OpenLayers.Handler.MOD_CTRL}),
                new OpenLayers.Control.PanZoomBar({})
            ],
            projection: new OpenLayers.Projection(context.projection)
        });

        layers = this._processLayers(layers);

        this.map.addLayers(layers);
        this.map.setCenter(
            new OpenLayers.LonLat(context.center[0], context.center[1])
        );
        this.map.zoomToScale(context.scale);
    },
    /**
     * @function
     * @private
     * @name HSLayers.Embed._processLayers
     * @param {Array of OpenLayers.Layer} layers
     * @returns {Array of OpenLayers.Layer}
     */
    _processLayers: function(layers) {
        var newLayers = [];

        for (var i = 0; i < layers.length; i++) {
            var add = true;
            if (layers[i].isBaseLayer) {
                layers[i].options.resolutions = this.map.resolutions;
                layers[i].options.scales = this.map.scales;
                layers[i].options.minResolution = this.map.minResolution;
                layers[i].options.maxResolution = this.map.maxResolution;
                layers[i].options.minScale = this.map.minScale;
                layers[i].options.maxScale = this.map.maxScale;
            }

            // check, if projecition match
            if (layers[i].projections && (layers[i].projections.length > 0)) {
                add = layers[i].projections.map(function(p) {
                        var mapprj = this.map.getProjectionObject() || this.map.projection;
                        return mapprj.equals(p); },this).indexOf(true) > -1;
            }

            if (add) {
                newLayers.push(layers[i]);
            }
        }

        return newLayers;
    },    

    /**
     * @function
     * @name HSLayers.Embed.getElementIdForMap
     * @return {String}
     */
    getElementIdForMap: function() {
        return "";
    },

    /**
     * @function
     * @name HSLayers.Embed.initControlsForMap
     */
    initControlsForMap: function() {
        // nop;
    },

    /**
     * @function
     * @name HSLayers.Embed.initMap
     * @param {<OpenLayers.Request.XMLHttpRequest>} xmlhttp
     */
    initMap: function(xmlhttp) {
        var format = new HSLayers.Format.State();
        var context = format.string2json(xmlhttp.responseText);
        var layers = format.json2layers(context.layers);

        this.createControlsForMap();
        this.createMap(context, layers);
        this.initControlsForMap();
    },

    /**
     * @function
     * @name HSLayers.Embed.initParams
     * @param {Object} parameters
     */
    initParams: function(parameters) {
        this._parameters = parameters;
        OpenLayers.ProxyHost = this._parameters.proxy;
    },

    /**
     * @function
     * @private
     * @name HSLayers.Embed._initResolutions
     * @param {Object} context
     * @param {Array of OpenLayers.Layer} layers
     * @returns {Array of Double}
     */
    _initResolutions: function(context) {
        var resolutions = context.resolutions;
        if (! resolutions) {
            if (context.scales) {
                resolutions = [];
                for (var i = 0; i < context.scales.length; i++) {
                    resolutions.push(
                        OpenLayers.Util.getResolutionFromScale(
                            context.scales[i], context.units
                    ));
                }
            }
        }
        return resolutions;
    },

    /**
     * @function
     * @name HSLayers.Embed.readMap
     */
    readMap: function() {
        var proxy = OpenLayers.ProxyHost;
        OpenLayers.ProxyHost = null;
        OpenLayers.Request.GET({
            url: HSLayers.statusManagerUrl,
            params: {
                request:"load",
                _salt: Math.random(),
                permalink: this._parameters.p
            },
            success: this.initMap,
            failure: function(){},
            scope:this
        });
        OpenLayers.ProxyHost = proxy;
    },

    /**
     * @name HSLayers.Embed.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Embed"
});

/**
 * Create concrete instance of HSLayers.Embed by type
 * @static
 * @function
 * @name HSLayers.Embed.createByType
 * @param {String} type
 * @returns {HSLayers.Embed}
 */
HSLayers.Embed.createByType = function(type) {
    var embed = null;
    switch (type) {
        case "html":
            embed = new HSLayers.Embed.EmbedHtml({});
            break;
        case "simple":
            embed = new HSLayers.Embed.EmbedSimpleExtJs({});
            break;
        case "advanced":
            embed = new HSLayers.Embed.EmbedAdvancedExtJs({});
            break;
    }
    return embed;
};
