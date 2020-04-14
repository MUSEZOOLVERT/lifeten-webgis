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
Ext.namespace("HSLayers.GeoRSSPanel");

/**
 * Panel for reading of KML
 *
 * @class HSLayers.GeoRSSPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel">Ext.form.FormPanel</a>
 *
 * @constructor
 * @param {Object} config
 * @param {String[]} [config.scales = map.scales] array of user defined
 * for printing 
 */
HSLayers.GeoRSSPanel= function(config) {

    // depandances
    if (!config) {
        config = {};
    }

    this.urlField = new Ext.form.TextField({
        fieldLabel: OpenLayers.i18n("URL"),
        emptyText: "http://",
        regex: /^http:\/\//
    });

    this.layerTitle = new Ext.form.TextField({
        fieldLabel: OpenLayers.i18n("Title")
        });

    this.updateIntervalField = new Ext.form.TextField({
        value: 10,
        fieldLabel: OpenLayers.i18n("Update interval [min.]")
        });

    config.buttons = [
            {
                text: OpenLayers.i18n("Display GeoRSS"),
                handler: this.onLoadClick,
                scope: this
            }
        ];

    config.items = [this.layerTitle,this.urlField,this.updateIntervalField];

    // call parent constructor
    HSLayers.GeoRSSPanel.superclass.constructor.call(this, config);

    if (config.map) {
        this.setMap(config.map);
    }
};

Ext.extend(HSLayers.GeoRSSPanel, Ext.form.FormPanel, {

    /**
     * field with URL of the KML
     * @name HSLayers.GeoRSSPanel.urlField
     * @type {Ext.form.TextField}
     */
    urlField : null,

    /**
     * field with file name of the KML
     * @name HSLayers.GeoRSSPanel.updateIntervalField
     * @type {Ext.form.Field}
     */
    updateIntervalField : null,

    /**
     * Panel title
     * @name HSLayers.GeoRSSPanel.title
     * @type String
     */
    title : OpenLayers.i18n("GeoRSS"),


    /**
     * layerTitle field
     * @name HSLayers.GeoRSSPanel.layerTitle
     * @type {Ext.Form.TextField}
     */
    layerTitle : null,

    /**
     * The map  object
     * use the {setMap} method for setting this attribute
     * @name HSLayers.GeoRSSPanel.map
     * @property {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    map: null,

    /**
     * Options of the OpenLayers.Format.KML
     * @name HSLayers.GeoRSSPanel.formatOptions
     * @type {Object}
     */
    formatOptions :  { 
        extractStyles: true, 
        maxDepth: 2,
        //extractTracks: true, <-- this does not work
        extractAttributes: true
    },

    /**
     * Set the #map object
     *
     * @function
     * @name HSLayers.Printer.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     * @returns None
     */
    setMap: function(map) {
        this.map = map;
        HSLayers.GeoRSSPanel.map = map;
    },

    /**
     * load kml
     *
     * @function
     * @name HSLayers.GeoRSSPanel.onLoadClick
     * @returns None
     */
    onLoadClick: function() {
        
        var layer;
        if (this.urlField.getValue()) {
            OpenLayers.Request.GET({
                    url: this.urlField.getValue(),
                    scope:this,
                    success: this.loadData
                });
        }
    },

    /**
     * load georss from URL
     *
     * @function
     * @name HSLayers.GeoRSSPanel.loadData
     * @returns None
     */
    loadData: function(req) {

        var format = new OpenLayers.Format.GeoRSS();
        var features = format.read(req.responseText);

        var layer = new OpenLayers.Layer.Vector(this.layerTitle.getValue(),
                {projection: new OpenLayers.Projection("epsg:4326")}
        );


        layer.addFeatures(features);

        this.map.addLayer(layer);

        HSLayers.GeoRSSPanel.layers[layer.id] = {interval: this.updateIntervalField.getValue(), url:this.urlField.getValue()};

        window.setTimeout("HSLayers.GeoRSSPanel.updateLayer(\""+layer.id+"\")",parseInt(HSLayers.GeoRSSPanel.layers[layer.id],10)*60*1000);
    },

    CLASS_NAME: "HSLayers.GeoRSSPanel"
});

HSLayers.GeoRSSPanel.updateLayer  = function(id){
    var layer = HSLayers.GeoRSSPanel.map.getLayer(id);

    if (layer) {

        OpenLayers.Request.GET({
            url: HSLayers.GeoRSSPanel.layers[id].url,
            success: HSLayers.GeoRSSPanel.updateFeatures,
            scope: {layer:layer}
        });

        window.setTimeout("HSLayers.GeoRSSPanel.updateLayer(\""+layer.id+"\")",parseInt(HSLayers.GeoRSSPanel.layers[layer.id],10)*60*1000);
    }
};

HSLayers.GeoRSSPanel.updateFeatures = function(req) {
    var format = new OpenLayers.Format.GeoRSS();
    var features = format.read(req.responseText);

    this.layer.destroyFeatures();
    this.layer.addFeatures(features);
};

HSLayers.GeoRSSPanel.map = null;

HSLayers.GeoRSSPanel.layers = {};
