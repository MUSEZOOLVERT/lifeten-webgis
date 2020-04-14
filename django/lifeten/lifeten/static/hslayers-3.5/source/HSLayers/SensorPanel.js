/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
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

/**
 * Panel for visualisation data from sensor.
 *
 * @class HSLayers.HSSensorPanel
 */ 
HSLayers.HSSensorPanel = OpenLayers.Class({

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.HSSensorPanel._actualGid
     * @type Integer
     */
    _actualGid: 0,
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._allChart
     * @type Boolean
     */
    _allCharts: false,
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._chartHeight
     * @type String
     */
    _chartHeight: 300,
        
    /**
     * @private
     * @name HSLayers.HSSensorPanel._chartServiceUrlBase
     * @type String
     */
    _chartServiceUrlBase: "",
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._chartWidth
     * @type String
     */
    _chartWidth: 500,

    /**
     * @private
     * @name HSLayers.HSSensorPanel._observationValueGrid
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.grid.GridPanel">Ext.grid.GridPanel</a>
     */
    _observationValueGrid: null,
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._observationValueStore
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.data.SimpleStore">Ext.data.SimpleStore</a>
     */
    _observationValueStore: null,
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._phenomenonStore
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.data.SimpleStore">Ext.data.SimpleStore</a>
     */
    _phenomenonStore: null,
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._sensorDetailPanel
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
     */
    _sensorDetailPanel: null,
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._sensorChartContainerPanel
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
     */
    _sensorChartContainerPanel: null,
    
    /**
     * @private
     * @name HSLayers.HSSensorPanel._sensorChartPanel
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
     */
    _sensorChartPanel: null,

    /**
     * @private
     * @name HSLayers.HSSensorPanel._sensorChartParamsPanel
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
     */
    _sensorChartParamsPanel: null,
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._createChartForm
     */
    _createChartForm: function() {
        var toDate = new Date();
        var fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 1); 
    
        this._createPhenomenonStore();
        
        var items = [];
        if (! this._allCharts) {
            items.push({
                allowBlank: false,
                displayField: "name",
                emptyText: OpenLayers.i18n("selectPhenomenon"),
                fieldLabel: OpenLayers.i18n("phenomenon"),
                forceSelection: true,
                id: "phenomenonId",
                mode: "local",
                selectOnFocus: true,
                store: this._phenomenonStore,
                triggerAction: "all",
                typeAhead: true,
                valueField: "id",
                xtype: "combo"
            });
        }
        items.push({
            fieldLabel: OpenLayers.i18n("dateFrom"),
            id: "chartDateFrom",
            format: "Y-m-d",
            xtype: "datefield",
            value: fromDate
        });
        items.push({
            fieldLabel: OpenLayers.i18n("timeFrom"),
            id: "chartTimeFrom",
            xtype: "timefield",
            format: "H:i",
            value: "00:00"
        });
        items.push({
            fieldLabel: OpenLayers.i18n("dateTo"),
            id: "chartDateTo",
            format: "Y-m-d",
            xtype: "datefield",
            value: toDate
        });
        items.push({
            fieldLabel: OpenLayers.i18n("timeTo"),
            id: "chartTimeTo",
            format: "H:i",
            xtype: "timefield",
            value: "23:59"
        });                

        this._sensorChartParamsPanel = new Ext.FormPanel({
            frame:true,
            defaults: {
                width: 150
            },
            defaultType: "textfield",
            labelWidth: 100, 
            items: items,
            buttons: [ 
                 new Ext.Button({
                    text: OpenLayers.i18n("generateChart"),
                    handler: OpenLayers.Function.bind(
                        this._generateChart, this
                    )
                })
            ]
        });
        
        this._sensorChartParamContainer = new Ext.Panel({
            height: this._getParamsHeight(),
            items: [this._sensorChartParamsPanel],
            layout: "fit",
            region: "north",
            split: true
        });
        
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._createObservationsGrid
     */
    _createObservationsGrid: function() {
        this._createObservationValueStore();
        
        this._observationValueGrid = new Ext.grid.GridPanel({
            store: this._observationValueStore,
            columns: [
                {id: "phenomenon", header: OpenLayers.i18n("phenomenon"), width: 128, sortable: true, dataIndex: "phenomenon"},
                {header: OpenLayers.i18n("value"), width: 75, sortable: true, dataIndex: "value"},
                {header: OpenLayers.i18n("unit"), width: 75, sortable: true, dataIndex: "unit"},
                {header: OpenLayers.i18n("time"), width: 128, sortable: true, dataIndex: "timeStamp"}
            ],
            stripeRows: false,
            autoExpandColumn: "phenomenon"
        });
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._createObservationValueStore
     */
    _createObservationValueStore: function() {
        this._observationValueStore = new Ext.data.SimpleStore({
            fields: ["phenomenon", "value", "unit", "timeStamp"],
            data: []
        });
    },

    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._createPhenomenonStore
     */
    _createPhenomenonStore: function() {
        this._phenomenonStore = new Ext.data.SimpleStore({
            fields: ["name", "id"],
            data: []
        });
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._createUI
     *
     * @param {Object} options
     */
    _createUI: function(options) {
        this._createObservationsGrid();
        this._createChartForm();
            
        this._sensorDetailPanel = new Ext.Panel({
            autoScroll: true,
            collapsible: true,
            collapsed: this._allCharts, 
            frame:true,
            height: 200,
            id: "sensorDetail",
            items: [this._observationValueGrid],
            layout: "fit",
            region: "north",
            split: true,
            title: OpenLayers.i18n("actualValues")
        });
        
        this._sensorChartContainerPanel =  new Ext.Panel({
            autoScroll: true,
            id: "sensorChartContainer",
            layout: "border",
            region: "center",
            split: true,
            title: OpenLayers.i18n("chart")
        });

        this._sensorChartPanel = new Ext.Panel({
            autoScroll: true,
            border: false,
            id: "sensorChart",
            region: "center"
        });

        this._sensorChartContainerPanel.add(this._sensorChartParamContainer);
        this._sensorChartContainerPanel.add(this._sensorChartPanel);
        
        this._mainPanel = new Ext.Panel({
            id: "sensorMainPanel",
            layout: "border"
        });

        this._mainPanel.add(this._sensorDetailPanel);
        this._mainPanel.add(this._sensorChartContainerPanel);
    },

    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._checkChartParams
     *
     * @returns {Boolean}
     */
    _checkChartParams: function() {
        var valid = true;
        for (var i = 0; i < this._sensorChartParamsPanel.items.getCount(); i++) {
            valid = valid && this._sensorChartParamsPanel.items.item(i).isValid();
        }
        return valid;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._generateChart
     */
    _generateChart: function() {
        if (this._allCharts) {
            this._generateAllChart();
        } else {
            this._generateOneChart();
        }
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._generateAllChart
     */
    _generateAllChart: function() {
        var fromDate = this._sensorChartParamsPanel.findById("chartDateFrom").getValue();
        var toDate = this._sensorChartParamsPanel.findById("chartDateTo").getValue();

        var html = "";
        for (var i = 0; i < this._phenomenonStore.getCount(); i++) {
            var record = this._phenomenonStore.getAt(i);
            var phenomenonId = record.get("id");
            var chartUrl = this._getChartUrl(phenomenonId, fromDate, toDate);        
            html += this._getChartHtml(chartUrl) + "<br/>";
        }
        this._sensorChartPanel.body.update(html)
    },

    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._generateOneChart
     */
    _generateOneChart: function() {
        var phenomenonId = this._sensorChartParamsPanel.findById("phenomenonId").getValue();
        var fromDate = this._sensorChartParamsPanel.findById("chartDateFrom").getValue();
        var toDate = this._sensorChartParamsPanel.findById("chartDateTo").getValue();
    
        if (this._checkChartParams()) {
            var chartUrl = this._getChartUrl(phenomenonId, fromDate, toDate);        
            var html = this._getChartHtml(chartUrl);
            this._sensorChartPanel.body.update(html)
        } else {
            Ext.Msg.alert(
                OpenLayers.i18n("warning"), 
                OpenLayers.i18n("allItemsAreRequired")
            );
        }
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._getDateAsStr
     *
     * @param {Date} date
     *
     * @returns {String}
     */
    _getDateAsStr: function(date) {
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._getChartHtml
     *
     * @param {String} chartUrl
     */
    _getChartHtml: function(chartUrl) {
        return "<img src=\"" + chartUrl + "\" />";
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._getChartUrl
     *
     * @param {String} phenomenonId
     * @param {Date} fromDate
     * @param {Date} toDate
     */
    _getChartUrl: function(phenomenonId, fromDate, toDate) {
        var chartUrl = 
            this._chartServiceUrlBase + "?operation=GetPNG&" + 
            "gid=" + this._actualGid +
            "&phenomenon=" + phenomenonId + 
            "&fromtime=" + this._getDateAsStr(fromDate) + "-00-00-00" + 
            "&totime=" + this._getDateAsStr(toDate) + "-23-59-59" + 
            "&width=" + this._chartWidth + "&height=" + this._chartHeight;
        return chartUrl;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._getParamsHeight
     */
    _getParamsHeight: function() {
        return this._allCharts ? 155 : 200;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.HSSensorPanel._updateObservation
     *
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature-js.html">OpenLayers.Feature</a>} feature
     */
    _updateObservation: function(feature) {
        var dataPhenomenon = [];
        var dataObservationValue = [];
        if (feature.observations != null) {
            for (var i = 0; i < feature.observations.length; i++ ) {
                var observation = feature.observations[i];
                
                this._actualGid = observation.gid;
                
                dataPhenomenon.push([
                    observation.phenomenonName, observation.phenomenonId
                ]);
                dataObservationValue.push([
                    observation.phenomenonName, observation.value, 
                    observation.unit, observation.timeStamp
                ]);
            }
        }
        this._phenomenonStore.loadData(dataPhenomenon);
        this._observationValueStore.loadData(dataObservationValue);
      
        if (! this._allCharts) {
            this._sensorChartParamsPanel.findById("phenomenonId").clearValue();
        } else {
            this._generateAllChart();
        }        
    },

    // **********************************************************************
    // public members
    // **********************************************************************
    
    /**
     * @function
     * @name HSLayers.HSSensorPanel.gteExtContent
     *
     * @returns {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Component">Ext.Component</a>}
     */
    getExtContent: function() {
        return this._mainPanel;
    },
  
    /**
     * @function
     * @name HSLayers.HSSensorPanel.initialize
     *
     * @param {Object} options
     */
    initialize: function(options) {
        if (options != null) {
            this._allCharts = options.allCharts;
            this._chartHeight = options.chartHeight || this._chartHeight;
            this._chartWidth = options.chartWidth || this._chartWidth;
            this._chartServiceUrlBase = options.chartServiceUrlBase;
        }
        this._createUI(options);
    },
    
    /**
     * @function
     * @name HSLayers.HSSensorPanel.updateFromFeature
     *
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature-js.html">OpenLayers.Feature</a>} feature
     */
    updateFromFeature: function(feature) {
        this.updateLayout();
    
        this._sensorChartPanel.body.update("");
        this._updateObservation(feature);
    },
    
    /**
     * @function
     * @name HSLayers.HSSensorPanel.updateLayout
     *
     */
    updateLayout: function() {
        if (this._sensorDetailPanel.getSize().height == 0) {
            this._sensorDetailPanel.setHeight(200);
        }
        if (this._sensorChartParamContainer.getSize().height == 0) {
            this._sensorChartParamContainer.setHeight(this._getParamsHeight());
        }
    },

    /**
     * @name HSLayers.HSSensorPanel.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.HSSensorPanel"  
});
