
/* Copyright (c) 2007-2011 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
 *            Michal Sredl <sredl ccss cz>
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
 * "OWS" Layer - we inherit from WMS: 
 * Parent class for WCS, WFS and WMS types of layers
 * @class HSLayers.Layer.OWS
 */

HSLayers.Layer.OWS = OpenLayers.Class(OpenLayers.Layer.WMS,{

    /**
     * serviceType
     * @name HSLayers.Layer.OWS.serviceType
     * @type String
     */
    serviceType: "OWS",

    /**
     * htmllegend
     * @name HSLayers.Layer.OWS.serviceType
     * @type String
     */
    htmllegend: undefined,

    /**
     * @name HSLayers.Layer.OWS
     * @constructor
     */
    initialize: function(name, url, params, options) {

        var urlParams = OpenLayers.Util.upperCaseObject(OpenLayers.Util.getParameters(url));

        if (urlParams.OWSURL) {
            url = urlParams.OWSURL;
        }

        params.OWSSERVICE = this.serviceType;

        params = OpenLayers.Util.upperCaseObject(params);


        options = options || {};

        OpenLayers.Layer.WMS.prototype.initialize.apply(this, [name, url,
                       OpenLayers.Util.applyDefaults(urlParams,params), options]);
        
    },

    getFullRequestString: function(newParams,altUrl) {
        var origurl = this.url;
        this.url = HSLayers.OWS.proxy4ows;
        this.params.OWSURL = origurl;
        this.params.OWSSERVICE = this.serviceType;
        var str = OpenLayers.Layer.WMS.prototype.getFullRequestString.apply(this,arguments);
        this.url = origurl;
        return str;
    },

    CLASS_NAME: "HSLayers.Layer.OWS"
});
