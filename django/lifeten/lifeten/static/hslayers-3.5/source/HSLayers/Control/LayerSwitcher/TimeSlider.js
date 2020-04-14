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
HSLayers.namespace("HSLayers.Control","HSLayers.Control.LayerSwitcher");

HSLayers.Control.LayerSwitcher.TimeSlider = function(config) {

    config = config || {};

    // get list of values from layer dimension
    var values = this.getValues(config.group.dimensions.time.values);

    this.tip = new Ext.slider.Tip({
        getText: function(thumb){
            var sdate = new Date(thumb.value);
            return String.format('{0}', sdate.toISOString());
        }
    });

    this.currentTime = new Ext.form.Field({
        fieldLabel: OpenLayers.i18n("Visible time"),
        value: config.group.dimensions.time["default"]
    });

    this.slider =  new Ext.slider.SingleSlider({
            value: values.min || values[0],
            group: config.group,
            //height: 20,
            minValue: values[0].min ||  values[0],
            maxValue: values[values.length-1].max || values[values.length-1],
            increment: values[0].step || values[1]-values[0], // <- must be set
            width: config.width-16,
            menu: this,
            listeners: {scope:this,
                        drag: this.onSliderDragend,
                        click: this.onSliderDragend},
            plugins: this.tip
    });

    this.fromTime = new Ext.form.TimeField({
        fieldLabel: OpenLayers.i18n("From Time"),
        format:  'H:i',
        minValue: new Date(values[0].min || values[0]),
        maxValue: new Date(values[values.length-1].max || values[values.length-1]),
        value: new Date(values[0].min || values[0]),
        increment: values[0].step || undefined,
        listeners: {blur: this.onFromChange,scope:this},
        width: 105
    });
    
    this.fromDate = new Ext.form.DateField({
        fieldLabel: OpenLayers.i18n("From Date"),
        minValue: new Date(values[0].min || values[0]),
        maxValue: new Date(values[values.length-1].max ||values[values.length-1]),
        value: new Date(values[0].min || values[0]),
        format: 'Y-m-d',
        listeners: {blur: this.onFromChange,scope:this},
        menu: new Ext.menu.DateMenu({
                hideOnClick: false,
                focusOnSelect: false,
                allowOtherMenus: true
            })
    });

    this.toTime = new Ext.form.TimeField({
        fieldLabel: OpenLayers.i18n("To Time"),
        format:  'H:i',
        minValue: new Date(values[0].min || values[0]),
        maxValue: new Date(values[values.length-1].max || values[values.length-1]),
        value: new Date(values[values.length-1].max || values[values.length -1]),
        increment: values[0].step || undefined,
        listeners: {blur: this.onToChange,scope:this},
        width: 105
    });
    
    this.toDate = new Ext.form.DateField({
        fieldLabel: OpenLayers.i18n("To Date"),
        minValue: new Date(values[0].min || values[0]),
        maxValue: new Date(values[values.length-1].max || values[values.length-1]),
        value:    new Date(values[values.length-1].max || values[values.length-1]),
        format: 'Y-m-d',
        listeners: {blur: this.onToChange,scope:this},
        menu: new Ext.menu.DateMenu({
                hideOnClick: false,
                focusOnSelect: false,
                allowOtherMenus: true
            })
    });

    this.play = new Ext.Button({
        text: "Play",
        cls: 'x-btn-icon',
        icon: OpenLayers.Util.getImagesLocation()+'/play.png',
        width: 20,
        handler: this.onPlayClicked,
        enableToggle: true,
        scope: this
    });

    // this.useGlobal = new Ext.form.Checkbox({
    //     fieldLabel: OpenLayers.i18n("Use global time")
    // });

    //config.bbar = [new Ext.form.Label({text: OpenLayers.i18n("Use global time: ")}),this.useGlobal,this.play];
    
    config.title = OpenLayers.i18n("Time");
    config.items = [
                    this.currentTime,
                    this.fromTime,
                    this.fromDate,
                    this.toTime,
                    this.toDate,
                    this.slider];

    config.buttons = [this.play];

    config.layout = "form";

    HSLayers.Control.LayerSwitcher.TimeSlider.superclass.constructor.call(this,config);
};

Ext.extend(HSLayers.Control.LayerSwitcher.TimeSlider, Ext.ButtonGroup, { 
    title: OpenLayers.i18n("Time"),
    slider: undefined,
    play: undefined,
    values: undefined,
    pause: 2000,
    layout: "form",
    tip: undefined,

    /**
     * get values from given time
     * @function
     * @param {String} or {Array} of times
     * @returns {Array} of {Date}s 
     */
    getValues: function(values) {
        this.values = [];
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            if (values[0].search("/") > -1) {
                this.values.push({
                    "min": new Date(values[0].split("/")[0]).valueOf(),
                    "max": new Date(values[0].split("/")[1]).valueOf(),
                    "step": this._parseInterval(values[0].split("/")[2])
                });
            }
            else {
                var val = new Date(values[i]);
                this.values.push(val.valueOf());
            }
        }

        return this.values;
    },

    /**
     * get date from interval
     * @private
     */
    _parseInterval: function(interval) {
        var dateComponent;
        var timeComponent;

        var year;
        var month;
        var day;
        var week;
        var hour;
        var minute;
        var second;

        year =  month = week = day = hour = minute = second = 0;
        
        var indexOfT = interval.search("T");

        if (indexOfT > -1) {
            dateComponent = interval.substring(1,indexOfT);
            timeComponent = interval.substring(indexOfT+1);
        }
        else {
            dateComponent = interval.substring(1);
        }

        // parse date
        if (dateComponent) {
            var indexOfY = (dateComponent.search("Y") > -1 ? dateComponent.search("Y") : undefined);
            var indexOfM = (dateComponent.search("M") > -1 ? dateComponent.search("M") : undefined);
            var indexOfW = (dateComponent.search("W") > -1 ? dateComponent.search("W") : undefined);
            var indexOfD = (dateComponent.search("D") > -1 ? dateComponent.search("D") : undefined);

            if (indexOfY !== undefined) {
                year = parseFloat(dateComponent.substring(0,indexOfY));
            }
            if (indexOfM !== undefined) {
                month = parseFloat(dateComponent.substring((indexOfY || -1) +1 ,indexOfM));
            }
            if (indexOfD !== undefined) {
                day = parseFloat(dateComponent.substring((indexOfM || indexOfY || -1)+1,indexOfD));
            }
        }

        // parse time
        if (timeComponent) {
            var indexOfH = (timeComponent.search("H") > -1 ? timeComponent.search("H") : undefined);
            var indexOfm = (timeComponent.search("M") > -1 ? timeComponent.search("M") : undefined);
            var indexOfS = (timeComponent.search("S") > -1 ? timeComponent.search("S") : undefined);

            if (indexOfH !== undefined) {
                hour = parseFloat(timeComponent.substring(0,indexOfH));
            }
            if (indexOfm !== undefined) {
                minute = parseFloat(timeComponent.substring((indexOfH || -1) +1 ,indexOfm));
            }
            if (indexOfS !== undefined) {
                second = parseFloat(timeComponent.substring((indexOfm || indexOfH || -1)+1,indexOfS));
            }
        }
        // year, month, day, hours, minutes, seconds, milliseconds)
        var zero = new Date(0,0,0,0,0,0,0);
        var step = new Date(year, month, day, hour, minute, second,0);
        return step-zero;
    },

    /**
     * handle play click event
     */
    onPlayClicked: function(e) {

        if (this.play.pressed) {
            this.group.events.register("loadend",this,this._bindOnloadend);
            this.play.setText("Pause");
            this.play.setIcon(OpenLayers.Util.getImagesLocation()+'/pause.png');
            var sdate = new Date(this.getClosestValue(this.slider.getValue()));
            this.currentTime.setValue(sdate.toISOString());
            this.group.mergeNewParams({TIME: sdate.toISOString()});
        }
        else {
            this.group.events.unregister("loadend",this,this._bindOnloadend);
            this.play.setText("Play");
            this.play.setIcon(OpenLayers.Util.getImagesLocation()+'/play.png');
        }
    },

    _bindOnloadend: function() {

        window.setTimeout(OpenLayers.Function.bind(this.onLayerGroupLoadEnd, this), this.pause);
    },

    /**
     * handle play click event
     */
    onLayerGroupLoadEnd: function(e) {
        var curdate = this.slider.getValue();
        var newtime = this.getClosestValue(curdate + this.slider.increment);
        var newdate = new Date(newtime);
        this.slider.setValue(newtime);
        this.currentTime.setValue(newdate.toISOString());
        this.group.mergeNewParams({TIME:newdate.toISOString()});
    },


    /**
     * called when from/to time/date is changed
     */
    onFromChange: function(e) {
        var xdate = this.fromDate.getValue();
        var xtime = new Date("1 Jan 1970 "+ this.fromTime.getValue()+":00");
        this.slider.setMinValue(xdate.valueOf()+xtime.valueOf()+3600*1000 ); // NOTE: +1 hour

        this.onFromToChange();
    },

    onToChange: function(e) {
        var xdate = this.toDate.getValue();
        var xtime = new Date("1 Jan 1970 "+ this.toTime.getValue()+":00");
        this.slider.setMaxValue(xdate.valueOf()+xtime.valueOf()+3600*1000 ); // NOTE: +1 hour

        this.onFromToChange();
    },

    onFromToChange: function() {
       // empty 
    },

    onSliderDragend: function() {
        this.onLayerGroupLoadEnd();
    },
    
    /**
     * returns closest available time value
     * @return {Integer} miliseconds
     */
    getClosestValue: function(valueIn) {
        var closest = Infinity;
        for (var i = 0; i < this.values.length; i++) {
            var value = this.values[i];
            if (value.min && value.max) {
                var j = value.min;
                while (j <= value.max) {
                    if (Math.abs(valueIn-closest) > Math.abs(valueIn - j)) {
                        closest = j;
                    }
                    j += value.step;
                }
            }
            else {
                if (Math.abs(valueIn-closest) > Math.abs(valueIn - value)) {
                    closest = value;
                }
            }
        }
        return closest;
    },

    CLASS_NAME: "HSLayers.Control.LayerSwitcher.TimeSlider"
});
