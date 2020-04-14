/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
 * Author(s): Michal Sredl <sredl ccss cz>
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
Ext.namespace("HSLayers.OWS.WFS");

/**
 * WFS parser is panel, with WFS capabilities
 *
 * @class HSLayers.OWS.WFS
 * @augments HSLayers.OWS
 * @param {Object} config
 */
HSLayers.OWS.WFS = function(config) {
    config = config || {};
    
    HSLayers.OWS.WFS.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.OWS.WFS, HSLayers.OWS.WMS, {
    /**
     * Service type
     * @name HSLayers.OWS.WFS.service
     * @type String
     */
    service: "WFS",

    /**
     * OWS class
     * The type that will be used for tha layers added from this tab      
     * @name HSLayers.WFS.WMSClass
     * @default HSLayers.Layer.WFS
     */
    WMSClass: HSLayers.Layer.WFS,

    /**
     * Request WFS Capabilities 
     * Here we use the OWS proxy and give it some extra parameters 
     * to let it know that we want WFS
     */
    requestGetCapabilities: function(url,retFunction,capabilitiesFailed) {
        OpenLayers.Request.GET({
            url:  HSLayers.OWS.proxy4ows,
            params: {request:"GetCapabilities",service: "WMS", owsUrl: url, owsService: this.service},
            success: retFunction,
            scope: this,
            failure: capabilitiesFailed
        });

    },

    /**
     * make properties form
     */
    makePropertiesForm: function() {
        this.propForm = HSLayers.OWS.WFS.superclass.makePropertiesForm.apply(this, arguments);

        this.rasterize = new Ext.form.Checkbox({
                    autoWidth: true, 
                    fieldLabel: OpenLayers.i18n("Rasterize"),
                    checked: true
                });

        this.propForm.add(this.rasterize);
        return this.propForm;
    },

    addLayer: function(layer, layerName, folder, imageFormat, queryFormat, singleTile, tileSize, crs) {
        if (this.rasterize.getValue() ) {
            HSLayers.OWS.WFS.superclass.addLayer.apply(this,arguments);
        }
        else {
            var layer = new OpenLayers.Layer.Vector(layerName,
                    {
                        strategies: [new OpenLayers.Strategy.BBOX()],
                        protocol: new OpenLayers.Protocol.WFS({
                            url: this.owsUrl, // FIXME: does not have to work
                            featureType: layer.name
                        }),
                        isBaseLayer: false,
                        attribution: layer.attribution,
                        visibility: true,
                        abstract: layer.abstract,
                        saveWMC: true,
                        path: folder,
                        queryable: true,
                        capabilitiesURL: this.capabilities.capability.request.getcapabilities.get.href,
                        removable: true
                    }
            );
            this.map.addLayer(layer);
        }
    },

    CLASS_NAME: "HSLayers.OWS.WFS"

});
