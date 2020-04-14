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
 * Panel with SOS client
 *
 * @class HSLayers.SOS.ClientPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
 *
 * @constructor
 * @param {Object} config
 *    possible values (key / value pair):
 *      map - {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>}
 *      sensorIcon - URL to icon for display sensor in map
 * @example 
 *      var panel = new HSLayers.SOS.ClientPanel({
 *          map: map,
 *          sensorIcon: "url_to_icon"
 *      });
 */
HSLayers.SOS.ClientPanel = function(config) {
    config = config || {};

    HSLayers.SOS.ClientPanel.superclass.constructor.call(this, config);

    if (config.url) {
        this.getCapabilities(config.url);
    }
    if (config.map) {
        this.setMap(config.map);
    }
};

Ext.extend(HSLayers.SOS.ClientPanel, Ext.Panel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SOS.ClientPanel._getObservationResult
     * @type {Object}
     */
    _getObservationResult: null,

    /**
     * @private
     * @name HSLayers.SOS.ClientPanel._mask
     * @type Ext.LoadMask
     */
    _mask: null,

    /**
     * @private
     * @name HSLayers.SOS.ClientPanel._sosForm
     * @type HSLayers.SOS.Form
     */
    _sosForm: null,

    /**
     * @private
     * @name HSLayers.SOS.ClientPanel._sos
     * @type HSLayers.SOS
     */
    _sos: null,

    /**
     * @private
     * @name HSLayers.SOS.ClientPanel._mask
     * @type HSLayers.SOS.ObservationPanel
     */
    _sosObservation: null,

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._getConfig
     * @returns {Object}
     */
    _getConfig: function() {
        var items = [
            this._sosForm,
            this._sosObservation
        ];

        var config = {
            baseCls: "x-plain",
            items: items,
            layout: "border",
            tbar:[{
                    text: OpenLayers.i18n("URL: ")
                },
                this._urlField,
                this._connectButton
            ]
        };
        return config;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._hasObservationFoi
     * @param {Object} data
     * @returns {Boolean}
     */
    _hasObservationFoi: function(data) {
        var has = false;
        if (data) {
            if (data.observations[0].fois.length > 0) {
                has = (data.observations[0].fois[0].features.length > 0);
            }
        }
        return has;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._hideMask
     */
    _hideMask: function() {
        if (this._mask) {
            this._mask.hide();
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._initChildComponents
     */
    _initChildComponents: function() {
        this._urlField = new Ext.form.TextField({
            name: "url",
            width: 300,
            fieldLabel: "URL",
            emptyText: "http://",
            value: this.initialConfig.url || undefined,
            listeners: {
                scope: this,
                specialkey: function(f,e){
                    if(e.getKey() == e.ENTER){
                        this._onGetCapabilitiesClicked();
                    }
                }
            }
        });

        this._connectButton = new Ext.Button({
            text: OpenLayers.i18n("Connect"),
            handler: this._onGetCapabilitiesClicked,
            scope:this
        });

        this._sosForm = new HSLayers.SOS.Form({
            region: "north",
            listeners: {
                getObservations: this._onGetObservationRequest,
                cancelRequest: this._onCancelRequest,
                addSensorToMap: this._onAddSensorToMap,
                scope: this
            }
        });

        this._sosObservation = new HSLayers.SOS.ObservationPanel({
            region: "center"
        });
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._onAddSensorToMap
     */
    _onAddSensorToMap: function() {
        if (this._getObservationResult) {
            this._sos.addSensorToMap(this._getObservationResult);
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._onGetCapabilitiesClicked
     */
    _onGetCapabilitiesClicked: function() {
        var url = this._urlField.getValue();
        this._sosForm.clear();
        this._sosObservation.clear();
        this.getCapabilities(url);
    },

    /**
     * Call GetCapabilities parsed
     * @function
     * @private
     * @name HSLayers.SOS.ClientPanel._onGetCapabilitiesResponse
     */
    _onGetCapabilitiesResponse: function() {
        if (this._sos.capabilities) {
            this._sosForm.initSOS(this._sos);
        }
        this._hideMask();
        if (! this._sos.capabilities) {
            Ext.MessageBox.alert(
                OpenLayers.i18n("Error"),
                OpenLayers.i18n("Error in loading GetCapabilities")
            );
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._onGetObservationRequest
     * @param {String} offering
     * @param {String} procedure
     * @param {String} observedProperty
     * @param {DateTime} beginPosition
     * @param {DateTime} endPosition
     */
    _onGetObservationRequest: function(offering, procedure, observedProperty, beginPosition, endPosition) {
        this._getObservationResult = null;

        this._sosForm._getObservationsButton.disable();
        this._sosForm.setAddToMapButtonEnable(false);
        this._sosObservation.showMask();

        var getObservationRequest = {
            offering: offering,
            procedures: [procedure],
            observedProperties: [observedProperty],
            responseFormat: "text/xml;subtype=\"om/1.0.0\"",
            resultModel: "om:Observation",
            responseModel: "inline"
        };

        if (beginPosition && endPosition) {
            getObservationRequest.eventTime = {
                beginPosition: beginPosition.format("c"),
                endPosition: endPosition.format("c")
            };
        }

        this._sos.getObservation(getObservationRequest);
    },

    /**
     * @private
     * @function
     */
    _onCancelRequest: function() {
        if (this._sos.request) {
            this._sos.request.abort();
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._onGetObservationResponse
     * @param {Ext.EventObject} event
     */
    _onGetObservationResponse: function(event) {
        this._sosForm._getObservationsButton.enable();
        if (event.data) {
            this._getObservationResult = event.data;
            this._sosObservation.initObservation(event.data);
            this._sosForm.setAddToMapButtonEnable(this._hasObservationFoi(event.data));
        }
        this._sosObservation.hideMask();
        if (! event.data) {
            Ext.MessageBox.alert(
                OpenLayers.i18n("Error"),
                OpenLayers.i18n("Error in loading GetObservation")
            );
        }
    },

    /**
     * @private
     * @function
     */
    _onRequestCanceled: function(event) {
        this._sosForm._getObservationsButton.enable();
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.ClientPanel._showMask
     */
    _showMask: function() {
        if ((! this._mask) && this.isVisible()) {
            this._mask = new Ext.LoadMask(
                this.getEl(),
                {msg: OpenLayers.i18n("Getting cababilities from server...")}
            );
        }
        if (this._mask) {
            this._mask.show();
        }
   },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SOS.ClientPanel.initComponent
     */
    initComponent: function() {
        this._initChildComponents();
        var config = this._getConfig();

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        HSLayers.SOS.ClientPanel.superclass.initComponent.apply(this, arguments);
    },

    /**
     * Call GetCapabilities request
     * @function
     * @name HSLayers.SOS.ClientPanel.getCapabilities
     * @param {String} url
     */
    getCapabilities: function(url) {
        this._showMask();
        this._sos = new HSLayers.SOS({
            map: this.map,
            sensorIcon: this.sensorIcon
        });
        this._sos.getCapabilities(url);
        this._sos.events.register("getcapabilities",this,this._onGetCapabilitiesResponse);
        this._sos.events.register("getobservation", this, this._onGetObservationResponse);
        this._sos.events.register("requestcanceled", this, this._onRequestCanceled);
    },

    /**
     * setMap
     * @function
     * @param OpenLayers.Map map
     * @name HSLayers.SOS.ClientPanel.setMap
     */
    setMap: function(map) {
        this.map = map;
    },

    /**
     * @name HSLayers.SOS.ClientPanel.CLASS_NAME
     * @type String
     */
     CLASS_NAME: "HSLayers.SOS.ClientPanel"
});
