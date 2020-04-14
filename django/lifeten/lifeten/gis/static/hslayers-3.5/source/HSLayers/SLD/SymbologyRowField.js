/* Copyright (c) 2007-2010 Help Service - Remote Sensing s.r.o.
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

Ext.namespace("HSLayers.SLD");

/**
 * Field for one symbology row
 *
 * @class HSLayers.SLD.SymbologyRowField
 */
HSLayers.SLD.SymbologyRowField = Ext.extend(Ext.form.CompositeField, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SLD.SymbologyRowField.attributes
     * @type Ext.data.Store
     */
    attributes: null,

    /**
     * @private
     * @name HSLayers.SLD.SymbologyRowField._checkBox
     * @type Ext.form.Checkbox
     */
    _checkBox : null,

    /**
     * @private
     * @name HSLayers.SLD.SymbologyRowField.rule
     * @type OpenLayers.Rule
     */
    rule: null,

    /**
     * @private
     * @name HSLayers.SLD.SymbologyRowField.symbolType
     * @type {String}
     */
    symbolType: null,

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SLD.SymbologyRowField.editSymbology
     */
    editSymbology: function() {
        var win = new HSLayers.SLD.SymbologyWindow({
            attributes: this.attributes,
            rule: this.rule,
            symbolType: this.symbolType,
            listeners: {
                onAccept: function(w) {
                    this.items.get(1).setSymbolizers(
                        HSLayers.SLD.Util.getSymbolizersForPreviewFromRule(this.rule, this.symbolType),
                        {draw: true}
                    );
                },
                scope: this
            }
        });
        win.show();
    },

    /**
     * @function
     * @name HSLayers.SLD.SymbologyRowField.initComponent
     */
    initComponent: function() {

        this._checkBox = new Ext.form.Checkbox({});

        this.items = [
            this._checkBox
        , {
            xtype: "hslayers_boxfeaturerenderer",
            symbolType: this.symbolType,
            symbolizers: HSLayers.SLD.Util.getSymbolizersForPreviewFromRule(this.rule, this.symbolType),
            isFormField: true,
            height: 20,
            width: 30,
            style: {
                cursor: "pointer"
            },
            listeners: {
                click: function() {
                    this.editSymbology();
                },
                scope: this
            }
        }, {
            xtype: "textfield",
            value: this.rule.filter.value,
            width: 50,
            anchor: "100%",
            allowBlank: false,
            listeners: {
                change: function(el, value) {
                    this.rule.filter.value = value;
                    this.fireEvent("change", this.rule);
                },
                scope: this
            }
        }, {
            xtype: "textfield",
            value: this.rule.name,
            width: 100,
            anchor: "100%",
            allowBlank: false,
            listeners: {
                change: function(el, value) {
                    this.rule.name = value;
                    this.fireEvent("change", this.rule);
                },
                scope: this
            }
        }];

        this.addEvents(
            "change"
        );

        HSLayers.SLD.SymbologyRowField.superclass.initComponent.call(this);
    },

    /**
     * @function
     * @name HSLayers.SLD.SymbologyRowField.isChecked
     * @returns {Boolean}
     */
    isChecked: function() {
        return this._checkBox.getValue();
    },

    /**
     * @function
     * @name HSLayers.SLD.SymbologyRowField.redrawSymbol
     */
    redrawSymbol: function() {
        this.items.get(1).drawFeature();
    }
});

Ext.reg('hslayers_sld_symbologyrowfield', HSLayers.SLD.SymbologyRowField);
