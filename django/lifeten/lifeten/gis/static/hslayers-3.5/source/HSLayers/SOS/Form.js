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
 * Form panel for input SOS parameters
 *
 * @class HSLayers.SOS.Form
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel">Ext.form.FormPanel</a>
 *
 * @constructor
 * @param {Object} config
 *    possible values (key / value pair):
 * @example
 *      var form = new HSLayers.SOS.Form({
 *      });
 */

HSLayers.SOS.Form = function(config) {
    HSLayers.SOS.Form.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.SOS.Form, Ext.form.FormPanel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SOS.Form._fieldTitle
     * @type {Ext.form.TextField}
     */
    _fieldTitle: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._fieldAbstract
     * @type {Ext.form.TextField}
     */
    _fieldAbstract: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._fieldOffering
     * @type {Ext.form.Combobox}
     */
    _fieldOffering: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._fieldProcedure
     * @type {Ext.form.Combobox}
     */
    _fieldProcedure: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._fieldObservedProperty
     * @type {Ext.form.Combobox}
     */
    _fieldObservedProperty: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._fieldFromDateTime
     * @type {HSLayers.Widget.DateTime}
     */
    _fieldFromDateTime: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._fieldToDateTime
     * @type {HSLayers.Widget.DateTime}
     */
    _fieldToDateTime: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._getObservationsButton
     * @type {Ext.Button}
     */
    _getObservationsButton: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._cancelRequestButton
     * @type {Ext.Button}
     */
    _cancelRequestButton: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._storeOffering
     * @type {Ext.data.Store}
     */
    _storeOffering: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._storeProcedure
     * @type {Ext.data.Store}
     */
    _storeProcedure: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._storeObservedProperty
     * @type {Ext.data.Store}
     */
    _storeObservedProperty: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._sos
     * @type {HSLayers.SOS}
     */
    _sos: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._toMapButton
     * @type {Ext.Button}
     */
    _toMapButton: null,

    /**
     * @private
     * @name HSLayers.SOS.Form._map
     * @type {OpenLayers.Map}
     */
    map: null,

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._addSensorToMap
     */
    _addSensorToMap: function() {
        this.fireEvent("addSensorToMap");
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._getConfig
     * @returns {Object}
     */
    _getConfig: function() {
        var items = [
            this._fieldTitle,
            this._fieldAbstract,
            this._fieldOffering,
            this._fieldProcedure,
            this._fieldObservedProperty,
            this._fieldFromDateTime,
            this._fieldToDateTime
        ];

        var config = {
            baseCls: "x-plain",
            bodyStyle: "padding:5px;",
            buttonAlign: "center",
            buttons: [
                this._getObservationsButton,
                this._toMapButton,
                this._cancelRequestButton
            ],
            height: 230,
            items: items
        };
        return config;
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._getObservations
     */
    _getObservations: function() {
        this.fireEvent(
            "getObservations",
            this._fieldOffering.getValue(),
            this._fieldProcedure.getValue(),
            this._fieldObservedProperty.getValue(),
            this._fieldFromDateTime.getValue(),
            this._fieldToDateTime.getValue()
        );
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._initChildComponents
     */
    _initChildComponents: function() {
        this._fieldTitle = new Ext.form.TextField({
            anchor: "100%",
            fieldLabel: OpenLayers.i18n("Name")
        });

        this._fieldAbstract = new Ext.form.TextField({
            anchor: "100%",
            fieldLabel: OpenLayers.i18n("Abstract")
        });

        this._storeOffering = new Ext.data.ArrayStore({
            fields: ["id", "name"],
            data: []
        });

        this._storeProcedure = new Ext.data.ArrayStore({
            fields: ["id"],
            data: []
        });

        this._storeObservedProperty = new Ext.data.ArrayStore({
            fields: ["id"],
            data: []
        });

        this._fieldOffering = new Ext.form.ComboBox({
            anchor: "100%",
            disabled: true,
            editable: false,
            emptyText: OpenLayers.i18n("Select offering..."),
            fieldLabel: OpenLayers.i18n("Offering"),
            forceSelection: true,
            lazyInit: false,
            mode: "local",
            typeAhead: true,
            triggerAction: "all",
            store: this._storeOffering,
            valueField: "id",
            displayField: "name",
            value: null,
            listeners: {
                select: this._onOfferingChange,
                change: this._onOfferingChange,
                scope: this
            }
        });

        this._fieldProcedure = new Ext.form.ComboBox({
            anchor: "100%",
            disabled: true,
            editable: false,
            emptyText: OpenLayers.i18n("Select procedure..."),
            fieldLabel: OpenLayers.i18n("Procedure"),
            forceSelection: true,
            lazyInit: false,
            mode: "local",
            typeAhead: true,
            triggerAction: "all",
            store: this._storeProcedure,
            valueField: "id",
            displayField: "id",
            value: null,
            listeners: {
                select: this._onProcedureChange,
                change: this._onProcedureChange,
                scope: this
            }
        });

        this._fieldObservedProperty = new Ext.form.ComboBox({
            anchor: "100%",
            disabled: true,
            editable: false,
            emptyText: OpenLayers.i18n("Select observed property..."),
            fieldLabel: OpenLayers.i18n("ObservedProperty"),
            forceSelection: true,
            lazyInit: false,
            mode: "local",
            typeAhead: true,
            triggerAction: "all",
            store: this._storeObservedProperty,
            valueField: "id",
            displayField: "id",
            value: null,
            listeners: {
                select: this._onObservedPropertyChange,
                change: this._onObservedPropertyChange,
                scope: this
            }
        });

        this._fieldFromDateTime = new HSLayers.Widget.DateTime({
            fieldLabel: OpenLayers.i18n("From")
        });
        this._fieldToDateTime = new HSLayers.Widget.DateTime({
            fieldLabel: OpenLayers.i18n("To")
        });

        this._getObservationsButton = new Ext.Button({
            disabled: true,
            text: OpenLayers.i18n("Get observations"),
            handler: this._getObservations,
            scope: this
        });

        this._cancelRequestButton = new Ext.Button({
            disabled: false,
            text: OpenLayers.i18n("Cancel request"),
            handler: this.cancelRequest,
            scope: this
        });

        this._toMapButton = new Ext.Button({
            disabled: true,
            text: OpenLayers.i18n("To map"),
            handler: this._addSensorToMap,
            scope: this
        });
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._initOfferings
     */
    _initOfferings: function() {
        this._storeOffering.removeAll();

        for (var offeringId in this._sos.capabilities.contents.offeringList) {
            this._storeOffering.add([
                new Ext.data.Record({
                    id: offeringId,
                    name: offeringId
                })
            ]);
        }
        this._updateControlsStatus();
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._initTimePeriod
     * @param {String} fromStr
     * @param {String} toStr
     */
    _initTimePeriod: function(fromStr, toStr) {
        var fromDt = Date.parseDate(fromStr, "c");
        var toDt = Date.parseDate(toStr, "c");
        this._fieldFromDateTime.setValue(fromDt);
        this._fieldFromDateTime.setMinValue(fromDt);
        this._fieldFromDateTime.setMaxValue(toDt);
        this._fieldToDateTime.setValue(toDt);
        this._fieldToDateTime.setMinValue(fromDt);
        this._fieldToDateTime.setMaxValue(toDt);
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._onOfferingChange
     */
    _onOfferingChange: function() {
        this._storeProcedure.removeAll();
        this._storeObservedProperty.removeAll();
        this._fieldProcedure.setValue(null);
        this._fieldObservedProperty.setValue(null);

        if (this._sos.capabilities) {
            var offeringId = this._fieldOffering.getValue();
            if (offeringId) {
                var offering = this._sos.capabilities.contents.offeringList[offeringId];
                if (offering) {
                    for (var i = 0; i < offering.procedures.length; i++) {
                        this._storeProcedure.add([
                            new Ext.data.Record({
                                id: offering.procedures[i]
                            })
                        ]);
                    }

                    for (var i = 0; i < offering.observedProperties.length; i++) {
                        this._storeObservedProperty.add([
                            new Ext.data.Record({
                                id: offering.observedProperties[i]
                            })
                        ]);
                    }

                    if (offering.time && offering.time.timePeriod) {
                        this._initTimePeriod(
                            offering.time.timePeriod.beginPosition,
                            offering.time.timePeriod.endPosition
                        );
                    }
                }
            }
        }
        this._updateControlsStatus();
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._onObservedPropertyChange
     */
    _onObservedPropertyChange: function() {
        this._updateObservationsButton();
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._onProcedureChange
     */
    _onProcedureChange: function() {
        this._updateObservationsButton();
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._updateControlsStatus
     */
    _updateControlsStatus: function() {
        this._updateComboBoxState(this._fieldOffering);
        this._updateComboBoxState(this._fieldProcedure);
        this._updateComboBoxState(this._fieldObservedProperty);
        this._updateObservationsButton();
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._updateComboBoxState
     * @param {Ext.form.ComboBox} combobox
     */
    _updateComboBoxState: function(combobox) {
        if (combobox.store.getCount() > 0) {
            combobox.enable();
        } else {
            combobox.disable();
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS.Form._updateObservationsButton
     */
    _updateObservationsButton: function() {
        var enable =
            this._fieldOffering.getValue() &&
            this._fieldProcedure.getValue() &&
            this._fieldObservedProperty.getValue();

        if (enable) {
            this._getObservationsButton.enable();
        } else {
            this._getObservationsButton.disable();
            this._toMapButton.disable();
        }

    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SOS.Form.clear
     */
    clear: function() {
        this._storeOffering.removeAll();
        this._storeProcedure.removeAll();
        this._storeObservedProperty.removeAll();

        this._updateControlsStatus();

        this._fieldOffering.setValue(null);
        this._fieldProcedure.setValue(null);
        this._fieldObservedProperty.setValue(null);
        this._fieldTitle.setValue(null);
        this._fieldAbstract.setValue(null);
        this._fieldFromDateTime.setValue(null);
        this._fieldToDateTime.setValue(null);
    },

    /**
     * @function
     * @name HSLayers.SOS.Form.initComponent
     */
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        HSLayers.SOS.Form.superclass.initComponent.apply(this, arguments);
    },

    /**
     * set title, abstract and offerings from given HSLayers.SOS
     * @function
     * @name HSLayers.SOS.Form.initSOS
     * @param {HSLayers.SOS} sos
     */
    initSOS: function(sos) {
        this._sos = sos;

        this._fieldTitle.setValue(this._sos.capabilities.serviceIdentification.title);
        this._fieldAbstract.setValue(this._sos.capabilities.serviceIdentification.abstract);
        this._initOfferings();
    },

    /**
     * @function
     * @name HSLayers.SOS.Form.setAddToMapButtonEnable
     * @param {Boolean} enable
     */
    setAddToMapButtonEnable: function(enable) {
        if (enable) {
            this._toMapButton.enable();
        } else {
            this._toMapButton.disable();
        }
    },

    /**
     * Tryes what ever is needed for canceling the request and enabeling
     * all buttons again
     * @function
     * @name HSLayers.SOS.Form.cancelRequest
     */
    cancelRequest: function() {
        this.fireEvent("cancelRequest");
    },

    /**
     * @function
     * @name HSLayers.SOS.Form.setMap
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
    },

    /**
     * @name HSLayers.SOS.Form.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.SOS.Form"
});
