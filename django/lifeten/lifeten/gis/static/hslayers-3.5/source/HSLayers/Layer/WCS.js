/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
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
 * "WFS" Layer - we inherit from WMS: 
 * the original WFS layer has been transformed to WMS by the ows proxy script. 
 * @class OpenLayers.Layer.WMS
 */

HSLayers.Layer.WCS = OpenLayers.Class(HSLayers.Layer.OWS,{

    /**
     * service
     */
    serviceType: "WCS",

    /**
     * Feature type properties
     */
    properties: null,

    /**
     * getCoverage url for actual extend and map properties
     * @param {String} mimeType
     */
    getCoverageUrl: function(mimeType) {
        var imageSize = this.getImageSize();
        var params = {
            VERSION: "1.0.0",
            SERVICE: "WCS",
            REQUEST: "GetCoverage",
            CRS: this.map.getProjectionObject().getCode(),
            //BBOX: this.map.getExtent().toArray(this.reverseAxisOrder()),
            BBOX: this.map.getExtent().toArray(),
            COVERAGE: this.params.LAYERS,
            BANDS: "1,2,3,4",
            WIDTH: imageSize.w,
            FORMAT: mimeType || "image/tiff",
            HEIGHT: imageSize.h
        }; 

        return unescape(unescape(OpenLayers.Util.urlAppend(this.url,
                    OpenLayers.Util.getParameterString(params))));

    },    

    /**
     * Class name property
     * @type String
     * @name HSLayers.Layer.WFS.CLASS_NAME
     */
    CLASS_NAME: "HSLayers.Layer.WCS"
});

