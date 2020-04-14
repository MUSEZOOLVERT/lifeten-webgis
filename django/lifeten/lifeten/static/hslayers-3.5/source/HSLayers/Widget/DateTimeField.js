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

Ext.namespace("HSLayers.Widget");

/**
 * Field for date time
 *
 * @class HSLayers.Widget.DateTime
 */
HSLayers.Widget.DateTime = Ext.extend(Ext.form.CompositeField, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Widget.DateTime._fieldDate
     * @type Ext.form.DateField
     */
    _fieldDate : null,

    /**
     * @private
     * @name HSLayers.Widget.DateTime._fieldTime
     * @type Ext.form.TimeField
     */
    _fieldTime : null,
    
    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Widget.DateTime.initComponent
     */
    initComponent: function() {
        this._fieldDate = new Ext.form.DateField({
        });
        this._fieldTime = new Ext.form.TimeField({
            format: "H:i"
        });       
        this.items = [
            this._fieldDate,
            this._fieldTime
        ];
        HSLayers.Widget.DateTime.superclass.initComponent.call(this);
    },
    
    /**
     * @function
     * @name HSLayers.Widget.DateTime.getValue
     * @return {Date}
     */
    getValue: function() {
        return this._fieldDate.getValue();
    },
    
    /**
     * @function
     * @name HSLayers.Widget.DateTime.setMaxValue
     * @param {Date} value
     */
    setMaxValue: function(value) {
        this._fieldDate.setMaxValue(value);
    },
    
    /**
     * @function
     * @name HSLayers.Widget.DateTime.setMinValue
     * @param {Date} value
     */
    setMinValue: function(value) {
        this._fieldDate.setMinValue(value);
    },

    /**
     * @function
     * @name HSLayers.Widget.DateTime.setValue
     * @param {Date} value
     */
    setValue: function(value) {
        this._fieldDate.setValue(value);
        this._fieldTime.setValue(value);
    }
});