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
HSLayers.namespace("HSLayers.Control","HSLayers.Control.SelectFeature");

/**
 *
 * @class HSLayers.Control.SelectFeature
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control-js.html">OpenLayers.Control</a>
 *
 */
HSLayers.Control.SelectFeature = OpenLayers.Class(OpenLayers.Control.SelectFeature, {

    initialize: function (layers, options) {
        // concatenate events specific to this control with those from the base
        //this.EVENT_TYPES = OpenLayers.Control.SelectFeature.prototype.EVENT_TYPES.concat(
        //    OpenLayers.Control.prototype.EVENT_TYPES
        //);
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        if(this.scope === null) {
            this.scope = this;
        }
        if(layers instanceof Array) {
            this.layers = layers;
            this.layer = new OpenLayers.Layer.Vector.RootContainer(
                this.id + "_container", {
                    layers: layers
                }
            );
        } else {
            this.layer = layers;
        }
        var callbacks = {
            click: this.clickFeature,
            clickout: this.clickoutFeature
        };
        if (this.hover) {
            callbacks.over = this.overFeature;
            callbacks.out = this.outFeature;
            callbacks.click = this.hoverClickFeature;
        }
             
        this.callbacks = OpenLayers.Util.extend(callbacks, this.callbacks);
        this.handlers = {
            feature: new OpenLayers.Handler.Feature(
                this, this.layer, this.callbacks,
                {geometryTypes: this.geometryTypes}
            )
        };

        if (this.box) {
            this.handlers.box = new OpenLayers.Handler.Box(
                this, {done: this.selectBox},
                {boxDivClassName: "olHandlerBoxSelectFeature"}
            ); 
        }
    },

    onBeforeUnselect: function(feature,event) {
        return true;
    },

    /**
     * Method: select
     * Add feature to the layer's selectedFeature array, render the feature as
     * selected, and call the onSelect function.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    select: function(feature,event) {
        var cont = this.onBeforeSelect.call(this.scope, feature,this.handlers.feature.evt);
        var layer = feature.layer;
        if(cont !== false) {
            cont = layer.events.triggerEvent("beforefeatureselected", {
                feature: feature,
                event:this.handlers.feature.evt
            });
            if(cont !== false) {
                layer.selectedFeatures.push(feature);
                this.highlight(feature);
                // if the feature handler isn't involved in the feature
                // selection (because the box handler is used or the
                // feature is selected programatically) we fake the
                // feature handler to allow unselecting on click
                if(!this.handlers.feature.lastFeature) {
                    this.handlers.feature.lastFeature = layer.selectedFeatures[0];
                }
                layer.events.triggerEvent("featureselected", {feature: feature,event: (event ? event : this.handlers.feature.evt)});
                this.onSelect.call(this.scope, feature);
            }
        }
    },

    /**
     * Method: clickFeature
     * Called on click in a feature
     * Only responds if this.hover is false.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    clickFeature: function(feature) {

        if(!this.hover) {
            var selected = (OpenLayers.Util.indexOf(
                feature.layer.selectedFeatures, feature) > -1);
            if(selected) {
                if(this.toggleSelect()) {
                    this.unselect(feature);
                } else if(!this.multipleSelect()) {
                    this.unselectAll({except: feature});
                }
            } else {
                if(!this.multipleSelect()) {
                    this.unselectAll({except: feature});
                }
                this.select(feature);
            }
        }
    },

    /**
     * Method: unselect
     * Remove feature from the layer's selectedFeature array, render the feature as
     * normal, and call the onUnselect function.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    unselect: function(feature) {
        var cont = this.onBeforeUnselect.call(this.scope, feature,this.handlers.feature.evt);

        if(cont !== false) {
            var layer = feature.layer;
            // Store feature style for restoration later
            this.unhighlight(feature);
            OpenLayers.Util.removeItem(layer.selectedFeatures, feature);
            layer.events.triggerEvent("featureunselected", {feature: feature, event:this.handlers.feature.evt});
            this.onUnselect.call(this.scope, feature);
        }
    },

    /**
     * Method: unselectAll
     * Unselect all selected features.  To unselect all except for a single
     *     feature, set the options.except property to the feature.
     *
     * Parameters:
     * options - {Object} Optional configuration object.
     */
    unselectAll: function(options) {
        // we'll want an option to supress notification here
        var layers = this.layers || [this.layer];
        var layer, feature;
        for(var l=0; l<layers.length; ++l) {
            layer = layers[l];
            for(var i=layer.selectedFeatures.length-1; i>=0; --i) {
                feature = layer.selectedFeatures[i];
                if(!options || options.except != feature) {
                    this.unselect(feature);
                }
            }
        }
    },

    /**
     * mouse move handler
     * @function
     * @private
     * @name HSLayers.Control.SelectFeature.mouseMove
     * @param evt {Event}
     */
    mouseMove: function(evt) {
        if (evt == null) {
            this.lastMousePosition = new OpenLayers.Pixel(0, 0);
        } else {
            this.lastMousePosition = evt.xy;
        }
    },

    /**
     * hover and click feature handler
     * @function
     * @private
     * @name HSLayers.Control.SelectFeature.hoverClickFeature
     * @param feature {OpenLayers.Feature.Vector}
     */
    hoverClickFeature: function(feature) {
        if(this.hover) {
            this.onHoverClick(feature);
        }
    },

    /* ------------------------ patched functions ---------*/

    destroy: function() {
        if (this.map) {
            this.map.events.unregister('mousemove', this, this.mouseMove);
        }

        OpenLayers.Control.SelectFeature.prototype.destroy.apply(this, arguments);
    },

    setMap: function(map) {
        OpenLayers.Control.SelectFeature.prototype.setMap.apply(this,arguments);

    this.map.events.register('mousemove', this, this.mouseMove);    

    },

    /**
     * @name HSLayers.Control.SelectFeature.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.SelectFeature"
});

