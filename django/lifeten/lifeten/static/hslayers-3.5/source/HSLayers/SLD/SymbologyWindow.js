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
 * Window for edit symbology
 *
 * @class HSLayers.SLD.SymbologyWindow
 */
HSLayers.SLD.SymbologyWindow = Ext.extend(Ext.Window, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SLD.SymbologyWindow.attributes
     * @type Ext.data.Store
     */
    attributes: null,

    /**
     * @private
     * @name HSLayers.SLD.SymbologyWindow.rule
     * @type OpenLayers.Rule
     */
    rule: null,

    /**
     * @private
     * @name HSLayers.SLD.SymbologyWindow.symbolType
     * @type {String}
     */
    symbolType: null,

    /**
     * @private
     * @name HSLayers.SLD.SymbologyWindow._tempRule
     * @type OpenLayers.Rule
     */
    _tempRule: null,

    /**
     * @private
     * @function
     * @name HSLayers.SLD.SymbologyWindow._getSymbolizersForPreview
     * @returns {Array of Object}
     */
    _getSymbolizersForPreview: function() {
        var symbolizer = HSLayers.SLD.Util.cloneSymbolizer(
            this._tempRule.symbolizer[this.symbolType]
        );
        this.get(0).get(0).processSymbolizerAfterEdit(symbolizer);

        var symbolizers = HSLayers.SLD.Util.getSymbolizersForPreviewFromSymbolizers(
            symbolizer, this.getTextSymbolizer()
        );
        return symbolizers;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SLD.SymbologyWindow._initAttributes
     */
    _initAttributes: function() {
        this.attributes = HSLayers.SLD.Util.initAttributeStore(this.attributes);
    },

    /**
     * @private
     * @function
     * @name HSLayers.SLD.SymbologyWindow._initRule
     */
    _initRule: function() {
        this.rule = HSLayers.SLD.Util.initRule(this.rule, this.symbolType);
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SLD.SymbologyWindow.initComponent
     */
    initComponent: function() {

        this._initRule();
        this._initAttributes();

        var wnd = this;

        this._tempRule = this.rule.clone();
        this.modal = true;
        this.title = "Symbol Panel",
        this.width = 400,
        this.height = 480;
        this.layout = "border",
        this.items = [{
            xtype: "tabpanel",
            autoScroll: true,
            activeTab: 0,
            region: "center",
            border: false,
            items: [{
                xtype: "hslayers_sld_" + this.symbolType.toLowerCase() + "symbolizerpanel",
                attributes: this.attributes,
                autoScroll: true,
                title: this.symbolType,
                rule: this._tempRule,
                nestedFilters: false,
                symbolType: this.symbolType,
                symbolizer: this._tempRule.symbolizer[this.symbolType],
                listeners: {
                    change: function(symbolizer) {
                        this.updateSymbolPreview();
                    },
                    scope: this
                }
            }, {
                title: "Text",
                bodyStyle: {"padding": "10px"},
                items: [{
                    xtype: "fieldset",
                    title: "Use label",
                    checkboxToggle: true,
                    collapsed: !this._tempRule.symbolizer.Text,
                    items: [{
                        xtype: "hslayers_sld_textsymbolizerpanel",
                        attributes: this.attributes,
                        autoScroll: true,
                        rule: this._tempRule,
                        nestedFilters: false,
                        symbolType: "Text",
                        symbolizer: this._tempRule.symbolizer.Text,
                        listeners: {
                            change: function(symbolizer) {
                                this.updateSymbolPreview();
                            },
                            scope: this
                        }
                    }],
                    listeners: {
                        collapse: function() {
                            this.updateSymbolPreview();
                        },
                        expand: function() {
                            this.updateSymbolPreview();
                        },
                        scope: this
                    }
                }]
            }],
            listeners: {
                render: function(p) {
                    if (wnd.attributes.empty) {
                        p.hideTabStripItem(1);
                    }
                }
            }
        }, {
            xtype: "form",
            bodyStyle: {"padding-left": "10px"},
            border: false,
            height: 30,
            region: "south",
            items: [{
                xtype: "hslayers_boxfeaturerenderer",
                symbolType: this.symbolType,
                symbolizers: HSLayers.SLD.Util.getSymbolizersForPreviewFromRule(this._tempRule, this.symbolType),
                isFormField: true,
                fieldLabel: "Symbol preview",
                height: 20,
                width: 30
            }]
        }],
        this.bbar = ["->", {
            text: "Ok",
            handler: function() {
                wnd.get(0).get(0).processSymbolizerAfterEdit();
                wnd.get(0).get(1).get(0).get(0).processSymbolizerAfterEdit();
                wnd.rule.symbolizer[wnd.symbolType] =
                    HSLayers.SLD.Util.cloneSymbolizer(wnd._tempRule.symbolizer[wnd.symbolType]);
                if (! wnd.get(0).get(1).get(0).collapsed) {
                    wnd.rule.symbolizer.Text = HSLayers.SLD.Util.cloneSymbolizer(wnd.get(0).get(1).get(0).get(0).symbolizer);
                } else {
                    delete wnd.rule.symbolizer.Text;
                }
                wnd.fireEvent("onAccept", wnd);
                wnd.close();
            }
        }, {
            text: "Cancel",
            handler: function() {
                wnd.fireEvent("onCancel", wnd);
                wnd.close();
            }
        }];

        this.addEvents(
            "onAccept", "onCancel"
        );

        HSLayers.SLD.SymbologyWindow.superclass.initComponent.call(this);
    },

    /**
     * @function
     * @name HSLayers.SLD.SymbologyWindow.getTextSymbolizer
     * @returns {Object}
     */
    getTextSymbolizer: function() {
        var symbolizer = null;
        if (! this.get(0).get(1).get(0).collapsed) {
            symbolizer = HSLayers.SLD.Util.cloneSymbolizer(this.get(0).get(1).get(0).get(0).symbolizer);
        }
        return symbolizer;
    },

    /**
     * @function
     * @name HSLayers.SLD.SymbologyWindow.updateSymbolPreview
     */
    updateSymbolPreview: function() {
        var e1 = this.get(1);
        if (e1) {
            var e2 = e1.get(0);
            if (e2) {
                if (e2.rendered) {
                    e2.setSymbolizers(this._getSymbolizersForPreview(), {draw: true});
                }
            }
        }
    }
});

Ext.reg('hslayers_sld_symbologywindow', HSLayers.SLD.SymbologyWindow);

