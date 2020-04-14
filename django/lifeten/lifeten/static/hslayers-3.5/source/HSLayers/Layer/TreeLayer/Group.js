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
 * @class HSLayers.Layer.TreeLayer.Group
 */
HSLayers.Layer.TreeLayer.Group = OpenLayers.Class({

    /**
     * parent group
     * @name HSLayers.Layer.TreeLayer.Group.parentGroup
     * @type HSLayers.TreeLayer.Group
     */
    parentGroup: undefined,

    /**
     * list of all groups
     * @name HSLayers.Layer.TreeLayer.Group.groups
     * @type [HSLayers.TreeLayer.Group]
     */
    groups: undefined,

    /**
     * name of the group, identificator
     * @name HSLayers.Layer.TreeLayer.Group.name
     * @type {String}
     */
    name: undefined,

    /**
     * childs list of layers and groups, as they come
     * @name HSLayers.Layer.TreeLayer.Group.childs
     * @type [Mixed] Groups or Layers
     */
    childs: undefined,

    /**
     * title of the group
     * @name HSLayers.Layer.TreeLayer.Group.title
     * @type String
     */
    title: undefined,

    /**
     * list of child layers
     * @name HSLayers.Layer.TreeLayer.Group.layers
     * @type [HSLayers.TreeLayer.Layer]
     */
    layers: undefined,

    /**
     * events
     * @name HSLayers.Layer.TreeLayer.Group.events
     * @type OpenLayers.Events
     */
    events: undefined,

    /**
     * id of the group
     * @type String
     * @name HSLayers.Layer.TreeLayer.Group.id
     */
    id: undefined,

    /**
     * visibility indicator
     * @type Boolean
     * @name HSLayers.Layer.TreeLayer.Group.visibility
     */
    visibility: undefined,

    /**
     * parent layer object HSLayers.Layer.TreeLayer
     * @type HSLayers.Layer.TreeLayer
     * @name HSLayers.Layer.TreeLayer.Group.layer
     */
    layer: undefined,

    /**
     * indicates change of the visibility 
     * @name HSLayers.Layer.TreeLayer.Group#visibilitychanged
     * @event
     */
    EVENT_TYPES: ["visibilitychanged"],

    /**
     * @constructor
     * @name HSLayers.Layer.TreeLayer.Group.initialize
     * @param {Object} options configuration options
     */
    initialize: function(options) {
        this.groups = [];
        this.layers = [];
        this.childs = [];

        OpenLayers.Util.extend(this, options);

        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);
        if(this.eventListeners instanceof Object) {
            this.events.on(this.eventListeners);
        }
        if (this.id == null) {
            this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
        }
    },

    /**
     * cascade objects down with given function
     *
     * @function
     * @name HSLayers.Layer.TreeLayer.Group.cascade
     * @param {Function} fnc function to be called
     * @param {Object} scope of the function optional, default is this group
     * @param [{Mixed}] args arguments handed over to the function, optional
     */
    cascade: function(fnc, scope, args) {
        args = args || [];
        fnc.apply(scope || this, args);
        if (this.groups && this.groups.length > 0) {
            for (var i = 0, len = this.groups.length; i < len; i++) {
                this.groups[i].cascade.apply(this.groups[i],arguments);
            }
        }
    },

    /**
     * bubble objects up function
     * @function
     * @name HSLayers.Layer.TreeLayer.Group.bubble
     * @param {Function} fnc function to be called
     * @param {Object} scope of the function optional, default is this group
     * @param [{Mixed}] args arguments handed over to the function, optional
     */
    bubble: function(fnc, scope, args) {
        args = args || [];
        if (this.parentGroup) {
            fnc.apply(scope || this.parentGroup, args);
            this.parentGroup.bubble(arguments);
        }
    },

    /**
     * toggle visibility, throw the event
     * @function
     * @name HSLayers.Layer.TreeLayer.Group.toggleVisibility
     * @param {Boolean} visibility optional
     */
    toggleVisibility: function(visibility,redraw) {
        if (visibility == undefined) {
            visibility = !this.visibility;
        }
        if (visibility != this.visibility) {
            this.visibility = visibility;

            // change visibility for each layer
            this.foreachLayer(function(visibility) {
                this.toggleVisibility(visibility,redraw);
            },undefined,[visibility]);
            
            // change visibility for each group
            this.cascade(function(visibility) {
                this.toggleVisibility(visibility,redraw);
            },undefined,[visibility]);

            // trigger event
            this.events.triggerEvent("visibilitychanged",{group:this, visibility:visibility,old_visibility: !visibility, redraw:redraw});
        }

        if (redraw !== false) {
            this.layer.redraw(true);
        }
    },

    /**
     * run given function for each layer
     * @function
     * @name HSLayers.Layer.TreeLayer.Group.foreachLayer
     * @param {Function} fnc
     * @param {Object} optional, default is this layer
     * @param [{Mixed}] args, optional
     */
    foreachLayer: function(fnc, scope, args) {
        args = args || [];
        if (this.layers && this.layers.length) {
            for (var i = 0, len = this.layers.length; i < len; i++) {
                fnc.apply(scope || this.layers[i], args);
            }
        }
    },

    /**
     * add new child group
     * @function
     * @name HSLayers.Layer.TreeLayer.Group.addGroup
     * @param {Object} child optional, default is this layer
     */
    appendChild: function(child) {

        if (child instanceof HSLayers.Layer.TreeLayer.Group) {
            this.groups.push(child);
        }
        else if (child instanceof HSLayers.Layer.TreeLayer.Layer) {
            this.layers.push(child);
        }

        this.childs.push(child);
    },

    /**
     * setLayer
     * @function
     * @name HSLayers.Layer.TreeLayer.Group.setLayer
     * @param {HSLayers.Layer.TreeLayer} layer
     */
    setLayer: function(layer) {
        this.layer = layer;
        this.foreachLayer(function(layer) {
            this.setLayer(layer);
        },
        undefined, [layer]);
    },


    CLASS_NAME: "HSLayers.Layer.TreeLayer.Group"
});
