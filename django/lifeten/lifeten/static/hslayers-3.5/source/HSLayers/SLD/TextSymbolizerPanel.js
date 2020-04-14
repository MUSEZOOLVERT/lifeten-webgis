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
 * Panel for edit text symbolizer properties
 *
 * @class HSLayers.SLD.TextSymbolizerPanel
 */
HSLayers.SLD.TextSymbolizerPanel = Ext.extend(Ext.Panel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SLD.TextSymbolizerPanel.attributes
     * @type Ext.data.Store
     */
    attributes: null,

    /**
     * @private
     * @name HSLayers.SLD.TextSymbolizerPanel.attributes
     * @type Object
     */
    attributesComboConfig: null,

    /**
     * @private
     * @name HSLayers.SLD.TextSymbolizerPanel.colorManager
     * @type {Object}
     */
    colorManager: null,

    /**
     * @private
     * @name HSLayers.SLD.TextSymbolizerPanel.symbolizer
     * @type {Object}
     */
    symbolizer: null,

    /**
     * @private
     * @function
     * @name HSLayers.SLD.TextSymbolizerPanel._getAttributeComboBoxConfig
     * @returns {Object}
     */
    _getAttributeComboBoxConfig: function() {
        var attributesComboConfig = {
            xtype: "combo",
            fieldLabel: "Attribute",
            store: this.attributes,
            editable: false,
            mode: "local",
            triggerAction: "all",
            displayField: "name",
            valueField: "name",
            value: this.symbolizer.label && this.symbolizer.label.replace(/^\${(.*)}$/, "$1"),
            listeners: {
                select: function(combo, record) {
                    this.symbolizer.label = "${" + record.get("name") + "}";
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100
        };
        return attributesComboConfig;
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SLD.TextSymbolizerPanel.initComponent
     */
    initComponent: function() {

        if(!this.symbolizer) {
            this.symbolizer = {};
        }

        this.labelWidth = 50;
        this.border = false;
        this.layout = "form";

        this.items = [
            this._getAttributeComboBoxConfig(),
            {
                cls: "x-html-editor-tb",
                style: "background: transparent; border: none; padding: 0 0em 0.5em;",
                xtype: "toolbar",
                fieldLabel: "Font",
                items: [{
                    xtype: "hslayers_fontcomboboxfield",
                    fonts: this.fonts || undefined,
                    width: 100,
                    value: this.symbolizer.fontFamily,
                    listeners: {
                        select: function(combo, record) {
                            this.symbolizer.fontFamily = record.get("field1");
                            this.fireEvent("change", this.symbolizer);
                        },
                        scope: this
                    }
                }, {
                    enableToggle: true,
                    cls: "x-btn-icon",
                    iconCls: "x-edit-bold",
                    pressed: this.symbolizer.fontWeight === "bold",
                    listeners: {
                        toggle: function(button, pressed) {
                            this.symbolizer.fontWeight = pressed ? "bold" : "normal";
                            this.fireEvent("change", this.symbolizer);
                        },
                        scope: this
                    }
                }, {
                    enableToggle: true,
                    cls: "x-btn-icon",
                    iconCls: "x-edit-italic",
                    pressed: this.symbolizer.fontStyle === "italic",
                    listeners: {
                        toggle: function(button, pressed) {
                            this.symbolizer.fontStyle = pressed ? "italic" : "normal";
                            this.fireEvent("change", this.symbolizer);
                        },
                        scope: this
                    }
                }]
            }, {
                xtype: "textfield",
                fieldLabel: "Size",
                value: this.symbolizer.fontSize,
                width: 100,
                listeners: {
                    valid: function(field) {
                        this.symbolizer.fontSize = Number(field.getValue());
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "hslayers_colorfield",
                fieldLabel: "Color",
                name: "color",
                value: this.symbolizer.fillColor,
                width: 100,
                plugins: this.colorFieldPlugins,
                listeners: {
                    valid: function(field) {
                        this.symbolizer.fillColor = field.getValue();
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }];

        this.addEvents(
            "change"
        );

        HSLayers.SLD.TextSymbolizerPanel.superclass.initComponent.call(this);
    },

    /**
     * @function
     * @name HSLayers.SLD.TextSymbolizerPanel.processSymbolizerAfterEdit
     * @param {Object} symbolizer
     */
    processSymbolizerAfterEdit: function(symbolizer) {
        // ToDo :
    }
});

Ext.reg('hslayers_sld_textsymbolizerpanel', HSLayers.SLD.TextSymbolizerPanel);
