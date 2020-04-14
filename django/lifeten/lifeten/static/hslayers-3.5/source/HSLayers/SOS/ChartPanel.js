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
 * Panel with chart
 *
 * @class HSLayers.SOS.ChartPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
 */
 
HSLayers.SOS.ChartPanel = function(config) { 
    HSLayers.SOS.ChartPanel.superclass.constructor.call(this, config); 
}
  
Ext.extend(HSLayers.SOS.ChartPanel, Ext.Panel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SOS.SOSObservationPanel._visualizationAPI
     * @type {String}
     */
    _visualizationAPI: "visualization",

    /**
     * @private
     * @name HSLayers.SOS.SOSObservationPanel._visualizationAPIVer
     * @type {String}
     */
    _visualizationAPIVer: "1",
    
    /**
     * @private
     * @name HSLayers.SOS.SOSObservationPanel.store
     * @type {Ext.data.Store}
     */
    store: null,
    
    /**
     * @private
     * @function
     * @name HSLayers.SOS.ChartPanel._getDataTable
     * @param {Object} config
     * @returns {google.visualization.DataTable}
     */     
    _getDataTable: function(config) {
        var store = Ext.StoreMgr.lookup(config.store || config.ds);
        var tbl = new google.visualization.DataTable();
        var cols = config.columns;
        for (var i = 0; i < cols.length; i++) {
            var c = cols[i];
            var id = c.dataIndex || c;
            var f = store.fields.get(id);
            tbl.addColumn(c.type, c.label || c, id);
        }
        var rs = store.getRange();
        tbl.addRows(rs.length);
        for (var i = 0; i < rs.length; i++) {
            for (var j = 0; j < cols.length; j++) {
                var value = rs[i].get(cols[j].dataIndex);
                if (cols[j].type == "datetime") {
                    value = Date.parseDate(value, "c");                        
                }
                if (cols[j].type == "number") {
                    value = Number(value);
                }
                tbl.setValue(i, j, value);
            }
        }
        return tbl;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.SOS.ChartPanel._onLoadCallback
     */     
    _onLoadCallback: function() {
        var tableCfg = {
            store: this.store,
            columns: this.columns
        };
        this.datatable = this._getDataTable(tableCfg);
        
        this.body.update("");
        this._visualization = new google.visualization["AnnotatedTimeLine"](this.body.dom);
        
        var relaySelect = function() {
            this.fireEvent("select", this, this._visualization);
        };
        google.visualization.events.addListener(
            this._visualization, "select", relaySelect.createDelegate(this)
        );
        this._visualization.draw(this.datatable, Ext.apply({}, this.visualizationCfg));
    },
    
    // **********************************************************************
    // public members
    // **********************************************************************
    
    /**
     * @function
     * @name HSLayers.SOS.ChartPanel.initComponent
     */     
    initComponent: function() {
        google.load(
            this._visualizationAPI,
            this._visualizationAPIVer,
            {
                packages: ["annotatedtimeline"],
                callback: this._onLoadCallback.createDelegate(this)
            }
        );        
        this.store = Ext.StoreMgr.lookup(this.store);
        HSLayers.SOS.ChartPanel.superclass.initComponent.call(this);
    }    
});
    