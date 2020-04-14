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

HSLayers.namespace("HSLayers.Layer");
 
/**
 * WMS layer warped on the server to target coordinate system. 
 * @class HSLayers.Layer.WMS
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/WMS-js.html">OpenLayers.Layer.WMS</a>
 *
 * @example
 *  var transWms = new HSLayers.Layer.WMS("Name","http://foo/bar/",
 *      wmsParams,
 *      {srs: "epsg:4326", // target SRS
 *      });
 */

HSLayers.Layer.WMS = OpenLayers.Class(HSLayers.Layer.OWS,{
    /**
     * @name HSLayers.Layer.WMS.singleTile
     * @type Boolean
     * @default true
     */
    singleTile: true,

    /**
     * Indicates, if following getFullRequestString request is intended to
     * be used for query request or not (usually not)
     * @name HSLayers.Layer.WMS.forQuery
     * @type {Boolean}
     * @default false
     */
    forQuery: false,

    /**
     * Default Service projection code
     * @default "epsg:4326"
     * @type String
     * @name HSLayers.Layer.WMS.sourceProjection
     */
    sourceProjection: new OpenLayers.Projection("epsg:4326"),

    /**
     * serviceType
     * @name HSLayers.Layer.WMS.serviceType
     * @type String
     */
    serviceType: "WMS",

    /**
     * @constructor 
     * @param {String} name name of the layer
     * @param {String} url url of the layer
     * @param {Object} params default WMS parameters
     * @param {Object} options configuration options for this layer
     */
    initialize: function(name, url, params, options) {

        //if (window.console) {
        //    console.warn("HSLayers.Layer.WarpedWMS is deprecated, OpenLayers.Layer.WMS is used together with owxproxy");
        //}

        HSLayers.Layer.OWS.prototype.initialize.apply(this, arguments);
    },    

    /**
     * Create a clone of this layer
     * @function
     * @name HSLayers.Layer.WMS.clone
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/WMS-js.html">OpenLayers.Layer.WMS</a>} obj=new OpenLayers.Layer.WSM base for the clone
     * @returns {HSLayers.Layer.WMS}
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new HSLayers.Layer.WMS(this.name,
                                                   this.url,
                                                   this.params,
                                                   this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.WMS.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    }, 


    /** 
     * Combine the layer's url with its params and these newParams. 
     * Add the SRS parameter from projection -- this is probably
     * more eloquently done via a setProjection() method, but this 
     * works for now and always.
     *
     * @name HSLayers.Layer.WMS.getFullRequestString
     * @function
     * @param {Object} newParams 
     * @param {String} altUrl Use this as the url instead of the layer's url
     * @returns {String} 
     */
    getFullRequestString:function(newParams, altUrl) {


        // do nothing, if projection match
        if (this.supportsProjection()) {
            var str = OpenLayers.Layer.WMS.prototype.getFullRequestString.apply(this,arguments);
            return str;
        }

        var projectionCode = this.projection.getCode();

        // if the layer does support current map projection, do nothign
        // warp over server otherwise
        newParams.FROMCRS = projectionCode;

        var url = HSLayers.Layer.OWS.prototype.getFullRequestString.apply(
                                                    this, arguments);

        return url;
    },

    /**
     * does this layer support current map projection? use it!
     * @function
     * @name HSLayers.Layer.WMS.supportsMapProjection
     * @returns {Boolean} projection supported
     */
    supportsProjection: function() {
        // if projections are defined,check, return false otherwise
        if (!this.projection.equals(this.map.getProjectionObject())) {
            if (this.projections && this.projections.length > 0){
                for (var i = 0; i < this.projections.length; i++) {
                    if (this.projections[i].equals(this.map.getProjectionObject())) {
                        this.projection = this.projections[i];
                        return true;
                    }
                }
            }

            return false;
        }
        return true;
    },

    /**
     * Class name property
     * @type String
     * @name HSLayers.Layer.WMS.CLASS_NAME
     */
    CLASS_NAME: "HSLayers.Layer.WMS"
});


// backwards compatibility
HSLayers.Layer.WarpedWMS = HSLayers.Layer.WMS;

