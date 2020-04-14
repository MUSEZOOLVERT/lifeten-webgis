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

/**
 * Class: HSLayers.Control.Pin
 * Taken from 'click.html' example
 * Handles mouse clicks
 */
HSLayers.namespace("HSLayers.Control");
HSLayers.Control.Soupatko = OpenLayers.Class(OpenLayers.Control, {                

    /**
     * Property: slider
     * {Ext.Slider}
     */
    slider: null,
    /**
     * Property: units
     * {String}
     */
    units: '',

    /**
     * Property: sliderTipText
     * {String}
     * Some text in the tip
     */
    sliderTipText: '',

    /**
     * Property: width
     * {Integer} 
     * Slider width in pixels
     */
    width: 250,
    
    /**
     * Property: step
     * {Integer}
     * step
     */
    step: 10,

    /**
     * Property: minValue
     * {Double}
     * minimal value
     */
    minValue: 0,

    /**
     * Property: maxValue
     * {Double}
     * maximal value
     */
    maxValue: 100,

    /**
     * Property: layers
     * {Object}
     * layer1: 'attribute_column', layer2: 'attribute_column2', ...
     */
    layers: {},

    /**
     * Contructor:
     * Create Slider in the map and bind some layers and their attributes
     * to it
     */
    initialize: function(layers, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        if (typeof(layers) != typeof([])) {
            layers = [layers];
        }
        this.layers = layers;

        // type
        if (typeof(this.minValue) == typeof(new Date())) {
            this.minValue = this.minValue.valueOf();
            this.maxValue = this.maxValue.valueOf();
        }
    },

    /**
     * Method: draw
     * calls the default draw, and then activates mouse defaults.
     *
     * Returns:
     * {DOMElement}
     */
    draw: function() {
        var div = OpenLayers.Control.prototype.draw.apply(this, arguments);

        var tip = new Ext.ux.SliderTip({
            getText: function(slider){return slider.formatTip(); }
        });
        
        this.slider = new Ext.Slider({
            renderTo: this.div,
            width: this.width,
            increment: this.step,
            minValue: this.minValue,
            maxValue: 100,
            listeners: {'drag':this.onDrag},
            hsSoupatko: this,
            formatTip: this.formatTip,
            plugins: tip
        });

        // for each layer, redraw features
        for (var i = 0; i < this.layers.length; i++) {
        }

        return div;
    },

    /**
     * Property: formatTip
     * How the tooltip should be formated
     * 'this' is this.slider
     *
     * Return:
     * {String} to be displayed as Slider's tooltip
     */

    formatTip: function() {
        return String.format('<b>{0}{1}{2}</b>', this.getValue(), this.hsSoupatko.units, this.hsSoupatko.sliderTipText);
    },

    /**
     * Method: onDrag
     * Slider moved
     *
     */
    onDrag: function(e) {
        var val = this.getValue(); 

        for (var j = 0; j < this.hsSoupatko.layers.length; j++) {
            var layerObj = this.hsSoupatko.layers[j];
            var layer  = layerObj.layer;

            for (var i = 0; i < layer.features.length; i++) {
                // turn visibility on
                var feature = layer.features[i];

                var isIn = true;

                // all values between [-1,1] interval
                if (val-this.hsSoupatko.step < feature.attributes[layerObj.column] &&
                    feature.attributes[layerObj.column] < val+this.hsSoupatko.step) {
                    isIn = true;
                }
                else {
                    isIn = false;
                }

                if (!feature.style) {
                    feature.style = OpenLayers.Feature.Vector.style.default;
                }

                feature.style.display = (isIn ? 'block' : 'none');
                layer.drawFeature(feature);
            }
        }

    },

    /**
     * Method: updateLimits
     * Update min, max, step
     *
     * Parameters:
     * min - {Double}
     * max - {Double}
     * step - {Double}
     */
    updateLimits: function(min,max,step) {
        if (min) {
            if (typeof(min) == typeof(new Date())) {
                min = min.valueOf();
            }
            this.slider.minValue = min;
        }
        if (max) {
            if (typeof(max) == typeof(new Date())) {
                max = max.valueOf();
            }
            this.slider.maxValue = max;
        }
        if (step) {
            this.slider.step = step;
        }
    },
    
    CLASS_NAME: "HSLayers.Control.Soupatko"
});

/**
 * @class Ext.ux.SliderTip
 * @extends Ext.Tip
 * Simple plugin for using an Ext.Tip with a slider to show the slider value
 */
Ext.ux.SliderTip = Ext.extend(Ext.Tip, {
    minWidth: 10,
    offsets : [0, -10],
    init : function(slider){
        slider.on('dragstart', this.onSlide, this);
        slider.on('drag', this.onSlide, this);
        slider.on('dragend', this.hide, this);
        slider.on('destroy', this.destroy, this);
    },

    onSlide : function(slider){
        this.show();
        this.body.update(this.getText(slider));
        this.doAutoWidth();
        this.el.alignTo(slider.thumb, 'b-t?', this.offsets);
    },

    getText : function(slider){
        return slider.getValue();
    }
});
