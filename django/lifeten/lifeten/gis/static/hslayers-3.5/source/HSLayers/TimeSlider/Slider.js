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
 * Actual time slider with two thumbs
 * 
 * @class HSLayers.TimeSlider.Slider
 */
Ext4.define("HSLayers.TimeSlider.Slider", {
    extend: "Ext4.slider.Single",

    _diff: 0,

    /**
     * list of discrete time values
     * @type {Object}
     */
    timeValues: undefined,
    
    /**
     * @constructor
     */
    constructor: function(config) {
        var myconfig = {
            hideLabel: true,
            minValue: undefined,
            maxValue: undefined,
            //width: 450,
            //constrainThumbs: true,
            increment: 60000,
            checkchangeBuffer: 100000, // 1s
            checkChangeEvens: ["change"],
            tipText: function(thumb){
                var value = new Date(parseInt(thumb.value,10));
                return Ext4.String.format("{0}.{1}.{2} {3}",
                            value.getDate(), value.getMonth()+1,value.getFullYear(),
                            value.toLocaleTimeString());
            },
            values: [undefined]
        };

        this.timeValues = {};

        config = Ext4.Object.merge(myconfig, config);
        this.callParent([config]);

        this.on("change",this._onChange,this);
        this.on("beforechange", function(s,n,o,e) {
                    this._diff = n-o;
                }, this);

        this.on("afterrender",function() {
            this.getEl().on("mousewheel",function(e){console.log(e,"###");},this);
        }, this);

        this.addEvents({
            "timewindowchange": true
        });
    },

    /**
     * on value change
     * @private
     * @function
     */
    _onChange: function(slider, newval, thumb, e) {

        // 0 - smaller
        // 1 - bigger

        // shift the first thumb
        //var value = this.getValue(1)+this._diff;
        //if (value > this.maxValue) {
        //    value = this.maxValue;
        //}
        //this.setValue(1,value,false);

        this.fireEvent("timewindowchange");
    },

    /**
     * add discrete values to slider
     * @function
     * param values [Integer]
     */
    addValues: function(values) {
        var i;
        for (i = 0, ilen = values.length; i < ilen; i++) {
            var val = values[i];
            this.timeValues[val] = (this.timeValues[val] ? this.timeValues[val]+1 : 1);
        }
    },

    /**
     * @private
     * Returns a snapped, constrained value when given a desired value
     * @param {Number} value Raw number value
     * @return {Number} The raw value rounded to the correct d.p. and constrained within the set max and min values
     */
    normalizeValue : function(v) {
        var me = this,
            Num = Ext4.Number,
            snapFn = Num[me.zeroBasedSnapping ? 'snap' : 'snapInRange']; // NOTE: it will be 'snap'

        var origv = v;
        v = snapFn.call(Num, v, me.increment, me.minValue, me.maxValue);
        v = Ext4.util.Format.round(v, me.decimalPrecision);
        v = Ext4.Number.constrain(v, me.minValue, me.maxValue);

        // snap to closest value
        var mindiff = -1;
        var count = 0;
        var newval ;
        for (var i in this.timeValues) {
            i = parseInt(i);
            var diff = Math.abs(v-i);
            if (mindiff < 0 || mindiff >= diff) {
                mindiff = diff;
                newval = i;
            }
        }

        return newval;
    }
});
