/* Copyright (c) 2007-2010 Help Service - Remote Sensing s.r.o. * Author(s): Martin Vlk * * This file is part of HSLayers. * * HSLayers is free software: you can redistribute it and/or modify * it under the terms of the GNU General Public License as published by * the Free Software Foundation, either version 3 of the License, or * any later version. * * HSLayers is distributed in the hope that it will be useful, * but WITHOUT ANY WARRANTY; without even the implied warranty of * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the * GNU General Public License for more details. * *  See http://www.gnu.org/licenses/gpl.html for the full text of the *  license. */Ext.namespace("HSLayers.SLD");/** * Panel for edit fill symbolizer properties * * @class HSLayers.SLD.FillSymbolizerPanel */HSLayers.SLD.FillSymbolizerPanel = Ext.extend(Ext.FormPanel, {    // **********************************************************************    // private members    // **********************************************************************    /**     * @private     * @name HSLayers.SLD.FillSymbolizerPanel.colorManager     * @type {Object}     */    colorManager: null,    /**     * @private     * @name HSLayers.SLD.FillSymbolizerPanel.symbolizer     * @type {Object}     */    symbolizer: null,    // **********************************************************************    // public members    // **********************************************************************    /**     * @function     * @name HSLayers.SLD.FillSymbolizerPanel.initComponent     */    initComponent: function() {        if(!this.symbolizer) {            this.symbolizer = {};        }        if (this.colorManager) {            this.colorFieldPlugins = [new this.colorManager];        }        this.border = false;        this.items = [{            xtype: "fieldset",            title: "Fill",            autoHeight: true,            checkboxToggle: (true && (! this.required)),            collapsed: (this.symbolizer.fill === false ) || (!                (this.required || this.symbolizer.fillColor || this.symbolizer.fillOpacity)            ),            defaults: {                width: 100            },            items: [{                xtype: "hslayers_colorfield",                fieldLabel: "Color",                name: "color",                value: this.symbolizer.fillColor,                plugins: this.colorFieldPlugins,                listeners: {                    valid: function(field) {                        this.symbolizer.fillColor = field.getValue();                        this.fireEvent("change", this.symbolizer);                    },                    scope: this                }            }, {                xtype: "slider",                fieldLabel: "Opacity",                name: "opacity",                values: [(this.symbolizer.fillOpacity == null) ? 100 : this.symbolizer.fillOpacity * 100],                isFormField: true,                listeners: {                    changecomplete: function(slider, value) {                        this.symbolizer.fillOpacity = value / 100;                        this.fireEvent("change", this.symbolizer);                    },                    scope: this                }            }],            listeners: {                collapse: function() {                    this.fireEvent("change", this.symbolizer);                },                expand: function() {                    this.fireEvent("change", this.symbolizer);                },                scope: this            }        }];        HSLayers.SLD.FillSymbolizerPanel.superclass.initComponent.call(this);    },    /**     * @function     * @name HSLayers.SLD.FillSymbolizerPanel.processSymbolizerAfterEdit     * @param {Object} symbolizer     */    processSymbolizerAfterEdit: function(symbolizer) {        if (! symbolizer) {            symbolizer = this.symbolizer;        }        if (this.get(0).collapsed) {            symbolizer.fill = false;            delete symbolizer.fillColor;            delete symbolizer.fillOpacity;        } else {            symbolizer.fill = true;        }    }});Ext.reg('hslayers_sld_fillsymbolizerpanel', HSLayers.SLD.FillSymbolizerPanel);