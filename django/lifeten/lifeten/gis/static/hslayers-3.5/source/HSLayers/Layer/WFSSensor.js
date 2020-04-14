/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
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
 * Vector layer for visualization data from sensors over WFS.
 * @class HSLayers.Layer.WFSSensor
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/WFS-js.html">OpenLayers.Layer.WFS</a>  
 */ 
HSLayers.Layer.WFSSensor = OpenLayers.Class(OpenLayers.Layer.WFS, {

    // **********************************************************************
    // private members
    // **********************************************************************
    
    _ATTR_PHENOMENON_ID: "phenomenon_id",
    _ATTR_PHENOMENON_NAME: "phenomenon_name",
    _ATTR_VALUE: "value",
    _ATTR_UNIT: "unit",
    _ATTR_TIME_STAMP: "time_stamp",
    _ATTR_GID: "gid",
    _ATTR_SENSOR_NAME: "sensor_name",

    /**
     * @private
     * @name HSLayers.Layer.WFSSensor._actualGid
     * @type Object
     */
    _sensors: null,
        
    /**
     * @private
     * @function
     * @name HSLayers.Layer.WFSSensor._getSensorFeature
     *
     * @param {Object} sensor
     *
     * @returns {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature-js.html">OpenLayers.Feature</a>}
     */
    _getSensorFeature: function(sensor) {
        var feature = sensor.features[0];
        var attributes = {};
        attributes["name"] = "Sensor " + sensor.name;
        attributes["sensorName"] = sensor.name;
        feature.observations = new Array();
        for (var j = 0; j < sensor.features.length; j++) {
            var observation = this._getSensorObservation(sensor.features[j]);
            feature.observations.push(observation);
        }                
        feature.attributes = attributes;
        return feature;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Layer.WFSSensor._getSensorFeatures
     *
     * @returns {Array of <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature-js.html">OpenLayers.Feature</a>}
     */
    _getSensorFeatures: function() {
        var features = new Array();
        for (sensorName in this._sensors) {
            var sensor = this._sensors[sensorName];
            if (sensor instanceof Object) {
                if (sensor.features.length > 0) {
                    var feature = this._getSensorFeature(sensor);
                    features.push(feature);
                }
            }
        }
        return features;
    },

    /**
     * @private
     * @function
     * @name HSLayers.Layer.WFSSensor._getSensorObservation
     *
     * @param {Object} observationFeature
     */
    _getSensorObservation: function(observationFeature) {
        var observation = {
            phenomenonId: observationFeature.attributes[this._ATTR_PHENOMENON_ID], 
            phenomenonName: observationFeature.attributes[this._ATTR_PHENOMENON_NAME],
            value : observationFeature.attributes[this._ATTR_VALUE],
            unit : observationFeature.attributes[this._ATTR_UNIT],
            gid: observationFeature.attributes[this._ATTR_GID],
            timeStamp: observationFeature.attributes[this._ATTR_TIME_STAMP]
        };
        return observation;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Layer.WFSSensor._onBeforeFeaturesAdded
     *
     * @param {Object} event
     */
    _onBeforeFeaturesAdded: function(event) {
        this._processFeatures(event.features);
        var sensorFeatures = this._getSensorFeatures();
        event.features = sensorFeatures;
        return true;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Layer.WFSSensor._processFeatures
     *
     * @param {Array of <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature-js.html">OpenLayers.Feature</a>} features
     */
    _processFeatures: function(features) {
        this._sensors = {};
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var sensorName = feature.attributes[this._ATTR_SENSOR_NAME];
            var sensor = this._sensors[sensorName];
            if (sensor == null) {
                sensor = {
                    name: sensorName,
                    features: new Array()
                };
                this._sensors[sensorName] = sensor;                
            }
            sensor.features.push(feature);
        }
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Layer.WFSSensor.initialize
     *
     * @param {String} name
     * @param {String} url
     * @param {Object} params
     * @param {Object} options hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, params, options) {    
        this.extractAttributes = true;        
        OpenLayers.Layer.WFS.prototype.initialize.apply(this, arguments);        
        this.events.register(
            "beforefeaturesadded", this, this._onBeforeFeaturesAdded
        );
    },
    
    /**
     * @function
     * @name HSLayers.Layer.WFSSensor.destroy
     */
    destroy: function() {
        this.events.unregister(
            "beforefeaturesadded", this, this._onBeforeFeaturesAdded
        );
        OpenLayers.Layer.WFS.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * @name HSLayers.Layer.WFSSensor.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Layer.WFSSensor"
});
OpenLayers.Layer.WFSSensor = HSLayers.Layer.WFSSensor;
