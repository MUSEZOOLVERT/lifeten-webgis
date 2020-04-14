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

HSLayers.namespace("HSLayers.SOS");

/**
 * Panel with SOS observations chart
 *
 * @class HSLayers.SOS.ObservationChartPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
 */

HSLayers.SOS.ObservationChartPanel = function(config) {
    HSLayers.SOS.ObservationChartPanel.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.SOS.ObservationChartPanel, Ext.Panel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationChartPanel._getConfig
     * @returns {Object}
     */
    _getConfig: function() {
        var config = {
            title: OpenLayers.i18n("Chart"),
            layout: "fit",
            listeners: {
                resize: this._onChartPanelResize,
                scope: this
            }
        };
        return config;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationChartPanel._getConfig
     * @returns {String}
     */
    _getFieldWithDate: function() {
        var field = this._store.fields.items[0].name;
        for (var i = 0; i < this._store.fields.length; i++) {
            if (this._store.fields.items[i].sosType == "Time") {
                field = this._store.fields.items[i].name;
            }
        }
        return field;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationChartPanel._getConfig
     * @returns {String}
     */
    _getFieldWithValue: function() {
        var field = this._store.fields.items[this._store.fields.length - 1].name;
        for (var i = 0; i < this._store.fields.length; i++) {
            if (this._store.fields.items[i].sosType == "Quantity") {
                field = this._store.fields.items[i].name;
            }
        }
        return field;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationChartPanel._initChildComponents
     */
    _initChildComponents: function() {
        // nop;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationChartPanel._getConfig
     */
    _initChart: function() {
        if (this._getObservationResult) {
            var timeline = new HSLayers.SOS.ChartPanel({
                id: "timeline",
                visualizationCfg: {
                    allowHtml: true,
                    displayAnnotations: true,
                    displayExactValues: true,
                    wmode: "transparent"
                },
                height: 400,
                store: this._store,
                columns: [{
                        dataIndex: this._getFieldWithDate(),
                        label: "Date",
                        type: "datetime"
                    }, {
                        dataIndex: this._getFieldWithValue(),
                        label: "Value",
                        type: "number"
                    }
                ]
            });

            this.add(timeline);
            this.doLayout();
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationChartPanel._getConfig
     * @param {Ext.Panel} panel
     * @param {Integer} aw
     * @param {Integer} ah
     * @param {Integer} rw
     * @param {Integer} rh
     */
    _onChartPanelResize: function(panel, aw, ah, rw, rh) {
        if (this.isVisible()) {
            this.removeAll();
            this._initChart();
        }
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SOS.ObservationChartPanel._getConfig
     */
    clear: function() {
        this._getObservationResult = null;
        this.removeAll();
        this.doLayout();
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationChartPanel.initComponent
     */
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        HSLayers.SOS.ObservationChartPanel.superclass.initComponent.apply(this, arguments);
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationChartPanel.initStore
     * @param {Array} fields
     * @param {Array} data
     */
    initStore: function(fields, data) {
        this._store = new Ext.data.ArrayStore({
            fields: fields,
            data: data
        });
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationChartPanel.setGetObservationResponse
     * @param {Object} response
     */
    setGetObservationResponse: function(response) {
        this._getObservationResult = response;
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationChartPanel.updateChart
     */
    updateChart: function() {
        if (this.items.getCount() == 0) {
            this._initChart();
        }
    },

    /**
     * @name HSLayers.SOS.ObservationChartPanel.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.SOS.ObservationChartPanel"
});