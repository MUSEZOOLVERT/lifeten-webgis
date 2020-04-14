/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky
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

HSLayers.namespace("HSLayers.Layer");

/**
 * Layer, which will act as container for several other layers
 * @class
 * @name HSLayers.Layer.MultiLayer
 */
HSLayers.Layer.MultiLayer = new OpenLayers.Class(OpenLayers.Layer,{

    /**
     * list of layers
     * @name HSLayers.Layer.MultiLayer.layers
     * @type [{OpenLayers.Layer}]
     */
    layers: undefined,

    /**
     * Constructor of HSLayers.Layer.MultiLayer
     * @constructor
     * @param {Object} options
     * @name HSLayers.Layer.MultiLayer.initialize
     */
    initialize: function(name, options) {
        this.layers = [];
        OpenLayers.Layer.prototype.initialize.apply(this,arguments);
    },

    /**
     * @function
     * @name HSLayers.Layer.MultiLayer.setVisibility
     */
    setVisibility: function(visibility) {
        OpenLayers.Layer.prototype.setVisibility.apply(this,arguments);

        this.layers.map(function(layer) {
            layer.setVisibility(visibility);
        });
    },

    /**
     * after add
     * @private
     */
    afterAdd: function() {
        for (var i = 0, len = this.layers.length; i < len; i++ ) {
            var layer = this.layers[i];

            layer.isBaseLayer = false;
            layer.displayInLayerSwitcher = false;

            layer.div.className = "olLayerDiv";
            layer.div.style.overflow = "";

            this.div.appendChild(layer.div);

            layer.setMap(this.map);

            layer.visibility = false;
            layer.setVisibility(this.getVisibility());

            layer.events.triggerEvent("added", {map: this.map, layer: layer});
            layer.afterAdd();
        }
    },

    /**
     * redraw
     * @private
     */
    /*
    redraw: function() {
        OpenLayers.Layer.prototype.redraw.apply(this,arguments);
        this.layers.map(function(layer) {layer.redraw.apply(layer,arguments);});

    },
    */

    addLayer: function(layer) {
        this.layers.push(layer);
        this.afterAdd();
    },

    /**
     * moveTo
     * @private
     */
    moveTo: function() {
        OpenLayers.Layer.prototype.moveTo.apply(this,arguments);
        for (var i = 0, len = this.layers.length; i < len; i++) {
            if (this.layers[i].map) {
                    this.layers[i].moveTo.apply(this.layers[i],arguments);
            }
        }

    },

    CLASS_NAME: "HSLayers.Layer.MultiLayer"
});
