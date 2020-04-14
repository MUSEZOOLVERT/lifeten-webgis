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

HSLayers.namespace("HSLayers.Layer","HSLayers.Layer.Tree");
/**
 * Tree layer Group class
 *
 * @class HSLayers.Layer.TreeLayer.Layer
 */
HSLayers.Layer.TreeLayer.Layer = OpenLayers.Class({

    /**
     * parent group
     * @name HSLayers.Layer.TreeLayer.Layer.parentGroup
     * @type HSLayers.Layer.TreeLayer.Group
     */
    parentGroup: undefined,

    /**
     * events
     * @name HSLayers.Layer.TreeLayer.Layer.events
     * @type OpenLayers.Events
     */
    events: undefined,

    /**
     * max scale
     * @name HSLayers.Layer.TreeLayer.Layer.maxScale
     * @type {Float}
     */
    maxScale: -1,

    /**
     * min scale
     * @name HSLayers.Layer.TreeLayer.Layer.minScale
     * @type {Float}
     */
    minScale: -1,

    /**
     * queryable
     * @name HSLayers.Layer.TreeLayer.Layer.queryable
     * @type {Boolean}
     */
    queryable: false,

    /**
     * title
     * @name HSLayers.Layer.TreeLayer.Layer.title
     * @type {String}
     */
    title: undefined,

    /**
     * editable
     * @name HSLayers.Layer.TreeLayer.Layer.editable
     * @type {Boolean}
     */
    editable: false,

    /**
     * edit configuration
     * @type {Object}
     */
    edit: undefined,

    /**
     * name
     * @name HSLayers.Layer.TreeLayer.Layer.name
     * @type {String}
     */
    name: undefined,

    /**
     * id
     * @name HSLayers.Layer.TreeLayer.Layer.id
     * @type String
     */
    id: undefined,

    /**
     * visibility indicator
     * @name HSLayers.Layer.TreeLayer.Layer.visibility
     * @type Boolean
     */
    visibility: false,

    /**
     * parent layer object 
     * @name HSLayers.Layer.TreeLayer.Layer.layer
     * @type HSLayers.Layer.TreeLayer
     */
    layer: undefined,

    /**
     * minResolution
     * @name HSLayers.Layer.TreeLayer.Layer.minResolution
     * @type Float
     */
    minResolution: undefined,

    /**
     * minResolution
     * @name HSLayers.Layer.TreeLayer.Layer.minResolution
     * @type Float
     */
    maxResolution: undefined,

    /**
     * legendUrl
     * @name HSLayers.Layer.TreeLayer.Layer.legendUrl
     * @type string
     */
    legendUrl: undefined,

    /**
     * inidicates change of visibility
     * @name HSLayers.Layer.TreeLayer.Layer#visibilitychanged
     * @event
     */
    EVENT_TYPES: ["visibilitychanged"],

    /**
     * @constructor
     * @name HSLayers.Layer.TreeLayer.Layer.initialize
     * @param {Object} options configuration options
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);

        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);
        if(this.eventListeners instanceof Object) {
            this.events.on(this.eventListeners);
        }
        if (this.id === null) {
            this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
        }

    },

    /**
     * toggle visibility, throw the event
     * @function
     * @name HSLayers.Layer.TreeLayer.Layer.toggleVisibility
     * @param {Boolean} visibility optional
     * @param {Boolean} force redraw 
     */
    toggleVisibility: function(visibility,redraw) {
        if (visibility === undefined) {
            visibility = !this.visibility;
        }
        if (visibility != this.visibility) {
            this.visibility = visibility;

            // trigger event
            this.events.triggerEvent("visibilitychanged",{layer:this,visibility:visibility,old_visibility: !visibility, redraw: redraw});
        }

        if (redraw !== false) {
            this.layer.redraw(true);
        }
    },

    /**
     * set parent layer
     * @name HSLayers.Layer.TreeLayer.Layer.setLayer
     * @function
     * @param {OpenLayers.Layer} layer
     */
    setLayer: function(layer) {
        this.layer = layer;

        this.minResolution = (this.minScale != -1 ? OpenLayers.Util.getResolutionFromScale(this.minScale, this.layer.units) : this.layer.minResolution);
        this.maxResolution = (this.maxScale != -1 ? OpenLayers.Util.getResolutionFromScale(this.maxScale, this.layer.units) : this.layer.maxResolution);

        if (this.editable) {
            this.layer.editLayers.push(this);
        }

    },
    
    /**
     * calculate in scale range
     * @name HSLayers.Layer.TreeLayer.Layer.calculateInRange
     * @function
     * @returns Boolean
     */
    calculateInRange: function() {
        var inRange = false;
        if (this.layer && this.layer.map) {

            var resolution = this.layer.map.getResolution();
            var scale = this.layer.map.getScale();

            inRange = ( (resolution >= this.minResolution) &&
                        (resolution <= this.maxResolution) );

            var minScale = this.minScale == -1 ? this.layer.maxScale : this.minScale;
            var maxScale = this.maxScale == -1 ? this.layer.minScale : this.maxScale;

            if (minScale <= scale && scale <= maxScale ) {
                inRange = true;
            }
        }
        return inRange;
    },

    /**
     * get visibility
     * @function
     * @name HSLayers.Layer.TreeLayer.Layer.getVisibility
     * @return {Boolean}
     */
    getVisibility: function() {
        return this.visibility;
    },
    

    CLASS_NAME: "HSLayers.Layer.TreeLayer.Layer"
});
