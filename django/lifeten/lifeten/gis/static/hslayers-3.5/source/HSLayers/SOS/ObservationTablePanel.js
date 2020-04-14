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
 * Panel with SOS observations table
 *
 * @class HSLayers.SOS.ObservationTablePanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
 */

HSLayers.SOS.ObservationTablePanel = function(config) {
    HSLayers.SOS.ObservationTablePanel.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.SOS.ObservationTablePanel, Ext.Panel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationTablePanel._getConfig
     * @returns {Object}
     */
    _getConfig: function() {
        var config = {
            title: OpenLayers.i18n("Table"),
            layout: "fit"
        };
        return config;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationTablePanel._initChildComponents
     */
    _initChildComponents: function() {
        // nop;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ObservationTablePanel._initChildComponents
     */
    _initTable: function() {
        if (this._getObservationResult) {
            var columns = [];

            var fields = this._getObservationResult.observations[0].result.elementType.fields;
            for (var i = 0; i < fields.length; i++) {
                columns.push({
                    header: fields[i].name,
                    dataIndex: "field" + i
                });
            }

            var grid = new Ext.grid.GridPanel({
                columns: columns,
                enableHdMenu: false,
                store: this._store,
                bbar: new Ext.PagingToolbar({
                    pageSize: 25,
                    store: this._store,
                    displayInfo: true,
                    displayMsg: OpenLayers.i18n("Displaying values {0} - {1} of {2}"),
                    emptyMsg: OpenLayers.i18n("No values to display"),
                    items:[]
                })
            });

            this.add(grid);
            this.doLayout();
        }
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SOS.ObservationTablePanel._initChildComponents
     */
    clear: function() {
        this._getObservationResult = null;
        this.removeAll();
        this.doLayout();
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationTablePanel.initComponent
     */
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        HSLayers.SOS.ObservationTablePanel.superclass.initComponent.apply(this, arguments);
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationTablePanel.initStore
     * @param {Ext.data.DataReader} reader
     * @param {Ext.data.DataProxt} proxy
     */
    initStore: function(reader, proxy) {
        this._store = new Ext.data.Store({
            reader: reader,
            proxy: proxy
        });
        this._store.load({params:{start:0, limit:25}});
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationTablePanel.setGetObservationResponse
     * @param {Object} response
     */
    setGetObservationResponse: function(response) {
        this._getObservationResult = response;
    },

    /**
     * @function
     * @name HSLayers.SOS.ObservationTablePanel.updateTable
     */
    updateTable: function() {
        if (this.items.getCount() == 0) {
            this._initTable();
        }
    },

    /**
     * @name HSLayers.SOS.ObservationTablePanel.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.SOS.ObservationTablePanel"
});