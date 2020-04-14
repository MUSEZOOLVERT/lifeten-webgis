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

Ext.namespace("HSLayers.Widget");

/**
 * Combo box for selecting font
 *
 * @class HSLayers.Widget.FontComboBoxField
 */
HSLayers.Widget.FontComboBoxField = Ext.extend(Ext.form.ComboBox,  {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Widget.FontComboBoxField.
     * @type
     */
    defaultFont: "Arial",

    /**
     * @private
     * @name HSLayers.Widget.FontComboBoxField.
     * @type
     */
    fonts: [
        "Arial",
        "Courier New",
        "Tahoma",
        "Times New Roman",
        "Verdana"
    ],

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Widget.FontComboBoxField.initComponent
     */
    initComponent: function() {

        var fonts = (this.fonts || HSLayers.Widget.FontComboBoxField.prototype.fonts);
        var defaultFont = this.defaultFont;
        if (fonts.indexOf(this.defaultFont) === -1) {
            defaultFont = fonts[0];
        }

        var defConfig = {
            allowBlank: false,
            displayField: "field1",
            editable: false,
            mode: "local",
            store: fonts,
            triggerAction: "all",
            value: defaultFont,
            valueField: "field1",
            tpl: new Ext.XTemplate(
                '<tpl for=".">' +
                    '<div class="x-combo-list-item">' +
                    '<span style="font-family: {field1};">{field1}</span>' +
                '</div></tpl>'
            )
        };
        Ext.applyIf(this, defConfig);

        HSLayers.Widget.FontComboBoxField.superclass.initComponent.call(this);
    }
});

Ext.reg("hslayers_fontcomboboxfield", HSLayers.Widget.FontComboBoxField);
