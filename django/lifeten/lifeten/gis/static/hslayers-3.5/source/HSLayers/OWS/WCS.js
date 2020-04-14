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
Ext.namespace("HSLayers.OWS.WCS");

/**
  * @constructor
  */
HSLayers.OWS.WCS = function(config) { 
    config = config || {}; 
    /* nejaky kod */ 
    HSLayers.OWS.WCS.superclass.constructor.call(this,config);
};

Ext.extend(HSLayers.OWS.WCS, HSLayers.OWS.WMS, { 

    /**
     * Service type
     * @name HSLayers.OWS.WCS.service
     * @type String
     */
    service: "WCS",

    /**
     * OWS class
     * The type that will be used for tha layers added from this tab      
     * @name HSLayers.WFS.WMSClass
     * @default HSLayers.Layer.WFS
     */
    WMSClass: HSLayers.Layer.WCS,

    requestGetCapabilities: function(url,retFunction,capabilitiesFailed) {
        OpenLayers.Request.GET({
            url:  HSLayers.OWS.proxy4ows,
            params: {request:"GetCapabilities",service: "WMS", owsUrl: url, owsService: this.service},
            success: retFunction,
            scope: this,
            failure: capabilitiesFailed
        });

    },

    CLASS_NAME: "HSLayers.OWS.WCS"

});


/*

Ext.extend(HSLayers.OWS.WCS, HSlayers.OWS.WMS, {
    constructor: function(config){ 
        config = config || {}; 
        /* nejaky kod * / 
        HSLayers.OWS.WCS.superclass.constructor.call(this,config);
    } 
});
*/
