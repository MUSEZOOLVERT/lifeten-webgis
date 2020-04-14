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

/**
 * Sensor Observation Service
 *
 * @class HSLayers.SOS
 */
HSLayers.SOS = OpenLayers.Class({

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.SOS._selectFeatureControl
     * @type {OpenLayers.Control.SelectFeature}
     */
    _selectFeatureControl: null,
    
    /**
     * @name HSLayers.SOS.service
     * @type {String}
     */
    service: "SOS",

    /**
     * @name HSLayers.SOS.request
     * @type {String}
     */
    request: null,

    /**
     * @name HSLayers.SOS.version
     * @type {String}
     */
    version: "1.0.0",

    /**
     * @name HSLayers.SOS._getCapabilitiesUrl
     * @type {String}
     */
    _getCapabilitiesUrl: null,

    /**
     * @name HSLayers.SOS.EVENT_TYPES
     * @type {Array}
     */
    EVENT_TYPES: ["beforegetcapabilities", "getcapabilities", "getobservation","requestcanceled"],

    /**
     * @function
     * @name HSLayers.SOS._createLayer
     * @returns {OpenLayers.Layer.Vector}
     */
    _createLayer: function() {
        var layer = new OpenLayers.Layer.Vector(OpenLayers.i18n("Sensors"), {
            sosLayer: true
        });

        layer.preFeatureInsert = function(feature) {
            var src = new OpenLayers.Projection("EPSG:4326");
            var dest = new OpenLayers.Projection(this.map.getProjection());
            OpenLayers.Projection.transform(feature.geometry, src, dest);
        };
        this.map.addLayers([layer]);

        this._selectFeatureControl = new OpenLayers.Control.SelectFeature(layer, {
            onSelect: this._onFeatureSelect,
            scope: this
        });
        
        for (var i = 0; i < this.map.controls.length; i++) {
            if (this.map.controls[i].CLASS_NAME == "OpenLayers.Control.Navigation") {
                this.map.controls[i].events.register(
                    "activate", this, function() {
                        this._selectFeatureControl.activate();
                    }
                );
                this.map.controls[i].events.register(
                    "deactivate", this, function() {
                        this._selectFeatureControl.deactivate();
                    }
                );
            }
        }
        
        this.map.addControl(this._selectFeatureControl);
        this._selectFeatureControl.activate();

        return layer;
    },

    /**
     * @function
     * @name HSLayers.SOS._getLayer
     * @returns {OpenLayers.Layer.Vector}
     */
    _getLayer: function() {
        var layer = null;
        if (this.map) {
            for (var i = 0; i < this.map.layers.length; i++) {
                if (this.map.layers[i].sosLayer === true) {
                    layer = this.map.layers[i];
                    break;
                }
            }

            if (! layer) {
                layer = this._createLayer();
            }
        }
        return layer;
    },

    /**
     * @function
     * @name HSLayers.SOS._getPopupContent
     * @param {OpenLayers.Feature} feature
     * @returns {String}
     */
    _getPopupContent: function(feature) {
        var html = "";
        html += "<table>";
        html += "<tr><td>" + OpenLayers.i18n("Service") + ":</td><td>" + feature.attributes.service + "</td></tr>";
        html += "<tr><td>" + OpenLayers.i18n("Sensor name") + ":</td><td>" + feature.attributes.name + "</td></tr>";
        html += "<tr><td>" + OpenLayers.i18n("Sensor ID") + ":</td><td>" + feature.attributes.id + "</td></tr>";
        html += "</table>";
        return html;
    },

    /**
     * @function
     * @name HSLayers.SOS._mergeParams
     * @param {Object} destination
     * @param {Object} source
     * @returns {Object}
     */
    _mergeParams: function(destination, source) {
        destination = destination || {};
        for (var property in source) {
            var value = source[property];
            if (value !== undefined) {

                // example: service -> SERVICE
                if (property.toUpperCase() in destination) {
                    destination[property.toUpperCase()] = value;
                }
                // example: SERVICE -> service
                else if (property.toLowerCase() in destination) {
                    destination[property.toLowerCase()] = value;
                }
                // example SeRvIce
                else {
                    destination[property] = value;
                }
            }
        }
        return destination;
    },

    /**
     * @function
     * @name HSLayers.SOS._onFeatureSelect
     * @param {OpenLayers.Feature} feature
     */
    _onFeatureSelect: function(feature) {
        var popup = new OpenLayers.Popup.FramedCloud(
            "sensor",
            feature.geometry.getBounds().getCenterLonLat(),
            null,
            this._getPopupContent(feature),
            null,
            true,
            function(e) {
                this.hide();
                OpenLayers.Event.stop(e);
                this.map.getControlsByClass("OpenLayers.Control.SelectFeature")[0].unselectAll();
            }
        );
        feature.popup = popup;
        this.map.addPopup(popup);
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS._parseGetCapabilities
     * @param {XMLHTTP} resp
     */
    _parseGetCapabilities: function (resp) {
        var format = new OpenLayers.Format.SOSCapabilities();
        this.capabilities = null;
        if (resp.responseXML) {
            this.capabilities = format.read(resp.responseXML);
        } else {
            if (resp.responseText != "") {
                this.capabilities = format.read(resp.responseText);
            }
        }
        this.events.triggerEvent("getcapabilities");
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS._parseGetObservation
     * @param {XMLHTTP} resp
     */
    _onRequestFailed: function (resp) {
        this.events.triggerEvent("requestcanceled");
    },

    /**
     * @private
     * @function
     * @name HSLayers.SOS._parseGetObservation
     * @param {XMLHTTP} resp
     */
    _parseGetObservation: function (resp) {
        var format = new OpenLayers.Format.SOSGetObservation();
        var data = null;
        if (resp.responseXML) {
            data = format.read(resp.responseXML);
        } else {
            if (resp.responseText != "") {
                data = format.read(resp.responseText);
            }
        }
        this.events.triggerEvent("getobservation", {data: data});
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.SOS.addSensorToMap
     * @param {Object} getObservationResult
     */
    addSensorToMap: function(getObservationResult) {
        if (getObservationResult && this.map) {
            var sosLayer = this._getLayer();
            if (sosLayer) {
                if (getObservationResult.observations[0].fois) {
                    var fois = getObservationResult.observations[0].fois;
                    for (var i = 0; i < fois.length; i++) {
                        for (var j = 0; j < fois[i].features.length; j++) {
                            var featureSos = fois[i].features[j];
                            if (this.sensorIcon) {
                                var icon = this.sensorIcon;
                            } else {
                                var icon = OpenLayers.Util.getImagesLocation() + "icons/blue.png";
                            }
                            var geometry = new OpenLayers.Geometry.Point(featureSos.geometry.x, featureSos.geometry.y);

                            var style = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style["default"], {
                                externalGraphic: icon,
                                fillOpacity:1,
                                pointRadius: 12
                            });

                            var feature = new OpenLayers.Feature.Vector(geometry, {
                                    id: featureSos.attributes.id || "",
                                    name: featureSos.attributes.name || "",
                                    service: this.capabilities.serviceIdentification.title
                                },
                                style
                            );
                            sosLayer.addFeatures([feature]);
                        }
                    }
                }
            }
        }
    },

    /**
     * @function
     * @name HSLayers.SOS.getCapabilities
     * @param {String} url
     */
    getCapabilities : function(url) {
        this._getCapabilitiesUrl = url;
        var params = OpenLayers.Util.getParameters(url);
        params = this._mergeParams(
            params, {
                SERVICE: this.service,
                VERSION: this.version,
                REQUEST: "GetCapabilities"
        });
        paramStr = OpenLayers.Util.getParameterString(params);

        if (url.indexOf("?") > -1) {
            url = url.substr(0,url.indexOf("?"));
        }

        url = OpenLayers.Util.urlAppend(url, paramStr);

        this.events.triggerEvent("beforegetcapabilities");
        var request = OpenLayers.Request.GET({
            url: url,
            params: {},
            success: this._parseGetCapabilities,
            scope:this
        });
    },

    /**
     * @function
     * @name HSLayers.SOS.getObservation
     * @param {String} url
     */
    getObservation: function(options) {
        var format = new OpenLayers.Format.SOSGetObservation();
        var xml = format.write(options);

        var url = this._getCapabilitiesUrl; // ToDo : url get from GetCapabilities document !!!

        this.request = OpenLayers.Request.POST({
            url: url,
            params: {},
            data: xml,
            failure: this._onRequestFailed,
            success: this._parseGetObservation,
            scope:this
        });
        this.request.onabort = function(){
            console.log("#####",this,arguments);
        };
    },

    /**
     * @function
     * @name HSLayers.SOS.initialize
     * @param {Object} options
     */
    initialize: function(options) {
        this.processes =  [];
        OpenLayers.Util.extend(this, options);

        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);

        if(this.eventListeners instanceof Object) {
            this.events.on(this.eventListeners);
        }

        OpenLayers.Util.extend(this,options);

        this.sosNS += this.version;
    },

    /**
     * @name HSLayers.SOS.CLASS_NAME
     * @type String
     */
    CLASS_NAME : "OpenLayers.SOS"
});
