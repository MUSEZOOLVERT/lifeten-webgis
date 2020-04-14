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
 * Panel with SOS observations displayed in table and chart
 *
 * @class HSLayers.SOS.ObservationPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.TabPanel">Ext.TabPanel</a>
 */

HSLayers.SOS.ObservationPanel = function(config) {
    HSLayers.SOS.ObservationPanel.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.SOS.ObservationPanel, Ext.TabPanel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SOS.ObservationPanel._chartPanel
     * @type {HSLayers.SOS.ObservationChartPanel}
     */
    _chartPanel: null,

    /**
     * @private
     * @name HSLayers.SOS.ObservationPanel._getObservationResult
     * @type {Object}
     */
    _getObservationResult: null,

    /**
     * @private
     * @name HSLayers.SOS.ObservationPanel._tablePanel
     * @type {HSLayers.SOS.ObservationTablePanel}
     */
    _tablePanel: null,

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationPanel._getConfig
     * @returns {Object}
     */
    _getConfig: function() {
        var items = [
            this._tablePanel,
            this._chartPanel
        ];

        var config = {
            activeTab: 0,
            baseCls: "x-plain",
            items: items,
            listeners: {
                "tabchange": this._onTabPanelChange,
                scope: this
            }
        };
        return config;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationPanel._getFieldValue
     * @param {Mixed} value
     * @param {Object} field
     * @returns {Mixed}
     */
    _getFieldValue: function(value, field) {
        if (field.type) {
            switch (field.type) {
                case "Time":
                    var dateTime = Date.parseDate(value, "c");
                    type = "date";
                    break;
            }
        }
        return value;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationPanel._initChildComponents
     */
    _initChildComponents: function() {
        this._tablePanel = new HSLayers.SOS.ObservationTablePanel({
        });
        this._chartPanel = new HSLayers.SOS.ObservationChartPanel({
        });
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationPanel._initObservationStore
     */
    _initObservationStore: function() {
        var storeFields = [];
        var recordFields = []
        var data = [];

        var fields = this._getObservationResult.observations[0].result.elementType.fields;
        for (var i = 0; i < fields.length; i++) {
            storeFields.push({
                name: "field" + i,
                sosType: fields[i].type
            });
            recordFields.push({
                name: "field" + i,
                mapping: i
            });
        }

        var processedValues =  this._getObservationResult.observations[0].result.processedValues;
        for (var i = 0; i < processedValues.length; i++) {
            var record = [];
            for (var j = 0; j < fields.length; j++) {
                record.push(this._getFieldValue(processedValues[i][j], fields[j]));
            }
            data.push(record);
        }

        var record = Ext.data.Record.create(recordFields);
        var reader = new Ext.data.ArrayReader({}, record);
        var proxy  = new Ext.data.MemoryProxy(data);

        proxy.doRequest = function(action, rs, params, reader, callback, scope, arg) {
            params = params || {};
            var result;
            try {
                result = reader.readRecords(this.data);
            }catch(e){
                this.fireEvent('exception', this, 'response', action, arg, null, e);
                callback.call(scope, null, arg, false);
                return;
            }
            if (params.start!==undefined && params.limit!==undefined) {
                result.records = result.records.slice(params.start, params.start+params.limit);
            }
            callback.call(scope, result, arg, true);
        };

        this._chartPanel.initStore(storeFields, data);
        this._tablePanel.initStore(reader, proxy);
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationPanel._onTabPanelChange
     * @param {Ext.TabPanel} tabPanel
     * @param {Ext.Panel} tab
     */
    _onTabPanelChange: function(tabPanel, tab) {
        if (tab == this._tablePanel) {
            this._tablePanel.updateTable();
        }
        if (tab == this._chartPanel) {
            this._chartPanel.updateChart();
        }
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SOS.ObservationPanel.clear
     */
    clear: function() {
        this._tablePanel.clear();
        this._chartPanel.clear();
        this._getObservationResult = null;
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationPanel.hideMask
     */
    hideMask: function() {
        this._mask.hide();
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationPanel.initComponent
     */
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        HSLayers.SOS.ObservationPanel.superclass.initComponent.apply(this, arguments);
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationPanel.initObservation
     * @param {Object} data
     */
    initObservation: function(data) {
        this.clear();
        if (data.observations.length > 0) {
            var count = data.observations[0].result.count.value;
            var read = true;
            if (count > 100) {
                read = confirm(String.format("Response contains {0} values. Do you want to read all of this values ?", count));
            }
            if (read) {
                this._getObservationResult = data;
                this._chartPanel.setGetObservationResponse(this._getObservationResult);
                this._tablePanel.setGetObservationResponse(this._getObservationResult);
                this._initObservationStore();
                var activeTab = this.getActiveTab();
                if (activeTab == this._tablePanel) {
                    this._tablePanel.updateTable();
                }
                if (activeTab == this._chartPanel) {
                    this._chartPanel.updateChart();
                }
            }
        }
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationPanel.showMask
     */
    showMask: function() {
        if (! this._mask) {
            this._mask = new Ext.LoadMask(
                this.getEl(),
                {msg: OpenLayers.i18n("Getting observations from server...")}
            );
        }
        this._mask.show();
    },

    /**
     * @name HSLayers.SOS.ObservationPanel.CLASS_NAME
     * @type String
     */
   CLASS_NAME: "HSLayers.SOS.ObservationPanel"
});