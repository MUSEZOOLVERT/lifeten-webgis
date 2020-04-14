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
 * "WFS" Layer - we inherit from WMS: 
 * the original WFS layer has been transformed to WMS by the ows proxy script. 
 * @class OpenLayers.Layer.WMS
 */

HSLayers.Layer.WFS = OpenLayers.Class(HSLayers.Layer.OWS,{

    /**
     * Feature type properties
     */
    properties: undefined,

    /**
     * Describe Feature Type URL
     */
    dftUrl: undefined,

    /**
     * Feature type name
     */
    featureType: undefined,

    /**
     * wfs version
     */
    version: undefined,

    /**
     * GetCapabilities response
     */
    capabilities: undefined,

    /**
     * FES Filter
     * @name HSLayers.Layer.WFS.filter
     * @type OpenLayers.Filter
     */
    filter : null,

    serviceType : "WFS",

    /**
     * @constructor 
     * @param {String} name name of the layer
     * @param {String} url url of the layer
     * @param {Object} params default WMS parameters
     * @param {Object} options configuration options for this layer
     */
    initialize: function(name, url, params, options) {
        HSLayers.Layer.OWS.prototype.initialize.apply(this, arguments);
        options = options || {};

        var args = OpenLayers.Util.getParameters(url);

        this.featureType = this.params.LAYERS;        
        var urlParams = OpenLayers.Util.getParameters(url);

        // We may move the following stuff to WFSFilterForm

        // Request capabilities to extract Filter_Capabilities 
        OpenLayers.Request.GET({
             url: this.params.OWSURL,
             success: this.onGetCapabilitiesResponse,
             scope: this,
             params: {
                service: "WFS",
                request: "GetCapabilities",
                version: options.version || "1.0.0"
             }
        });
    },    

    /**
     * Set filter capabilities from the GetCapabilities response
     * and request Describe Feature Type
     */
    onGetCapabilitiesResponse: function(response) {

        if (!response.responseXML) {
            return ;
        }

        // Read the response into an object
        var formatCapa = new OpenLayers.Format.WFSCapabilities();
        var schema = this.capabilities = formatCapa.read(response.responseXML);
  
        // Check the version 
        this.version = schema.version; // it was checked in OL getVersion(root) from root element

        // Set Describe Feature Type URL
        if (this.version == "1.0.0" || this.version == "1.0") {
            this.dftUrl = schema.capability.request.describefeaturetype.href.get;
        } else { // assume 1.1.0
            this.dftUrl = schema.operationsMetadata.describefeaturetype.dcp.http.get;
        }

        // FIXME
        // set get feature type url
        // this.gftUrl = schema.operationsMetadata.getFeatureType.dcp.http.get;
        this.gftUrl = this.dftUrl;
        
        // Set filter capabilities 
        this.filterCapabilities = schema.filterCapabilities;
        
        // Request feature type properties using DescribeFeatureType 
        OpenLayers.Request.GET({
             url: this.dftUrl, // this is direct url of the service
             success: this.onDescribeFeatureTypeResponse,
             scope: this,
             params: {
                service: "WFS",
                request: "DescribeFeatureType",
                typeName: this.featureType, // feature type name
                version: this.version
             }
        });
    },

    /**
     * Set properties from the DescribeFeatureType response
     */
    onDescribeFeatureTypeResponse: function(response) {

        // Read the response into an object
        var formatDFT = new OpenLayers.Format.WFSDescribeFeatureType();
        var schema = formatDFT.read(response.responseXML);

        // Find the index of the <complexType> element with the proper name attribute
        var cut = this.featureType.indexOf(':'); // cut off the namespace
        var typeName = (cut==-1) ? this.featureType : this.featureType.substring(cut+1);
        var index = -1;
        // schema.featureTypes corresponds to <complexType>s
        for (i=0; i<schema.featureTypes.length; ++i) {
            if (schema.featureTypes[i].typeName == typeName) {
                index = i;
                break;
            }
        }

        // Set the properties
        if (index >= 0) {
            this.properties = schema.featureTypes[index].properties; 
        }
    },

    /**
     * Get feature attributes
     * @function
     * @name HSLayers.Layer.WFS.getAttributes
     * @returns [{String}]
     */
    getAttributes: function() {
        var attributes = [];
        if (this.properties) {
            for (var i = 0, len = this.properties.length; i < len; i++) {
                attributes.push(this.properties[i].name);
            }
        }
        return attributes;
    },

    /**
     * Create a clone of this layer
     * @function
     * @name HSLayers.Layer.WFS.clone
     * @returns {HSLayers.Layer.WFS}
     */
    clone: function (obj) {
        
        if (obj === null) {
            obj = new HSLayers.Layer.WFS(this.name,
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
     * get feature type url
     * @function
     * @name HSLayers.Layer.WFS.getFeatureTypeURL
     * @return String
     */
    getFeatureTypeURL: function() {
        var srs = this._getSrs();
        var params = {
            VERSION: "1.1.0",
            SERVICE: "WFS",
            REQUEST: "GetFeature",
            SRSNAME: "urn:ogc:def:crs:"+this.map.getProjectionObject().getCode().replace(":","::"),
            TYPENAME: this.featureType,
            FILTER: this.params.fes
            //BBOX: this.map.getBounds.toBBOX() // see lower
        }; 

        if (!this.params.fes) {
            var bounds = this.map.getExtent();
                
            if (srs.toLowerCase() in OpenLayers.Layer.WMS.prototype.yx) {

                var newBounds = new OpenLayers.Bounds(
                                        bounds.bottom,
                                        bounds.left,
                                        bounds.top,
                                        bounds.right);
                bounds = newBounds;
            }
            params.BBOX = bounds.toBBOX();

            return unescape(unescape(OpenLayers.Util.urlAppend(this.url,
                        OpenLayers.Util.getParameterString(params))));
        }

    },

    /**
     * @private
     * @returns String "EPSG:CODE"
     */
    _getSrs: function() {
        for (var i = 0, len = this.capabilities.featureTypeList.featureTypes.length; i < len; i++) {
            if (this.featureType.search(this.capabilities.featureTypeList.featureTypes[i].name) > - 1) {
                return this.capabilities.featureTypeList.featureTypes[i].srs;
            }
        }

    },

    /**
     * Class name property
     * @type String
     * @name HSLayers.Layer.WFS.CLASS_NAME
     */
    CLASS_NAME: "HSLayers.Layer.WFS"
});

