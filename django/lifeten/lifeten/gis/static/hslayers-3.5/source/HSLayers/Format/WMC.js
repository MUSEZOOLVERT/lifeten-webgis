HSLayers.namespace("HSLayers.Format","HSLayers.Format.WMC");
/**
 * Read and write Web Map Context documents.
 * @class HSLayers.Format.WMC
 * @augments OpenLayers.Format.WMC
 */
HSLayers.Format.WMC = OpenLayers.Class(OpenLayers.Format.WMC, {

    initialize: function() {
        OpenLayers.Format.WMC.prototype.initialize.apply(this,arguments);

        this.options = this.options ? this.options : {};
    },

    /**
     * brutal-force way how to get the propper version
     * @function
     * @name HSLayers.Format.WMC.getParser
     * @returns HSLayers.Format.WMC.v1_1_0
     */
    getParser: function() {
        return new HSLayers.Format.WMC.v1_1_0(this.options);
    },

    write: function(obj, options) {

        // convert to context only, if obj == map
        if (obj instanceof OpenLayers.Map) {
            obj = this.toContext(obj);
        }
        return OpenLayers.Format.XML.VersionedOGC.prototype.write.apply(this,
            arguments);
    },

    toContext: function(obj) {
        var context = OpenLayers.Format.WMC.prototype.toContext.apply(this,arguments);
        context.layersContext = [];
        context.extension = obj.metadata.extension;

        // redefine layers
        for (var i = 0, len = obj.layers.length; i < len; i++) {
            var layer = obj.layers[i];
            var layer = obj.layers[i];
            // layer must be of type WMS || layer has context
            if (layer instanceof OpenLayers.Layer.WMS || layer.context){

                // includeBaseLayes or not
                if (!this.options.includeBaseLayers && layer._isBaseContextLayer === true) {
                    continue;
                }
                if (layer._isBaseContextLayer && layer.getVisibility() === false) {
                    continue;
                }
                context.layersContext.push(this.layerToContext(layer));
            }
        }
        return context;
    },
        

    layerToContext : function(layer) {
        
        if (!layer.params) {
            layer.params = {};
        }

        // call the original function
        var layerContext = OpenLayers.Format.WMC.prototype.layerToContext.apply(this,[layer]);

        // fill what you can
        layerContext.path = layer.path;
        layerContext.layer_title = layer.title;
        layerContext.info_format = layer.params.INFO_FORMAT;
        if (layer.params.OWSSERVICE) {
                layerContext.owsservice = layer.params.OWSSERVICE;
        }
        layerContext.attribution = layer.attribution;
        layerContext.capabilitiesURL = layer.capabilitiesURL;
        layerContext.abstract = layer.abstract;

        // projection
        if (layer.projection) {
            layerContext.projection = typeof(layer.projection) == "String" ?
                                        new OpenLayers.Projection(layer.projection) : 
                                        layer.projection;
        }
        else {
            layerContext.projection = layer.map.getProjectionObject();
        }
        
        // projections
        if (layer.projections) {
            layerContext.projections = layer.projections.map(function(p) {
                                            if (p) {
                                                if (typeof(p) == "String") {
                                                    return p;
                                                }
                                                else {
                                                    return p.getCode();
                                                }
                                            }
                                        });
        }
        
        // fix OpenLayers bug
        srs = {};
        if (layerContext.version == "1.3.0" && layer.params.CRS) {
            srs[layer.params.CRS] = true;
        }
        else if (layer.params.SRS){
            srs[layer.params.SRS] = true;
        }
        else {
            srs[layer.map.getProjectionObject().getCode()] = true;
        }
        layerContext.srs = srs;

        // overwrite with layer.context values, if any specified
        if (layer.context) {
            OpenLayers.Util.applyDefaults(layerContext, layer.context);
            layerContext.server.version  = (layerContext.version || "1.1.0");

            layerContext.server.url = layer.context.url;
        }

        // overwrite HSLayers.Layer.OWS urls
        if (layer instanceof HSLayers.Layer.WMS ||
            layer instanceof HSLayers.Layer.WCS ||
            layer instanceof HSLayers.Layer.WFS)  {
                if (layer.params.OWSURL) {
                    layerContext.server.url = layer.params.OWSURL;
                }
        }


        return layerContext;
    },

    /**
     * Method: getLayerFromContext
     * Create a WMS layer from a layerContext object.
     *
     * Parameters:
     * layerContext - {Object} An object representing a WMS layer.
     *
     * Returns:
     * {<OpenLayers.Layer.WMS>} A WMS layer.
     */
    getLayerFromContext: function(layerContext) {
        var i, len;
        // fill initial options object from layerContext
        var options = {
            queryable: layerContext.queryable, //keep queryable for api compatibility
            visibility: layerContext.visibility,
            maxExtent: layerContext.maxExtent,
            metadata: OpenLayers.Util.applyDefaults(layerContext.metadata, 
            {
                styles: layerContext.styles,
                formats: layerContext.formats,
                "abstract": layerContext["abstract"],
                dataURL: layerContext.dataURL
            }),
            numZoomLevels: layerContext.numZoomLevels,
            units: layerContext.units,
            isBaseLayer: !!layerContext.isBaseLayer,
            opacity: layerContext.opacity,
            displayInLayerSwitcher: layerContext.displayInLayerSwitcher,
            singleTile: layerContext.singleTile,
            attribution: layerContext.attribution,
            capabilitiesURL: layerContext.capabilitiesURL,
            tileSize: (layerContext.tileSize) ? 
                new OpenLayers.Size(
                    layerContext.tileSize.width, 
                    layerContext.tileSize.height
                ) : undefined,
            minScale: layerContext.minScale || layerContext.maxScaleDenominator,
            maxScale: layerContext.maxScale || layerContext.minScaleDenominator,
            srs: layerContext.srs,
            dimensions: layerContext.dimensions,
            metadataURL: layerContext.metadataURL,
            title: layerContext.layer_title,
            projection: layerContext.projection,
            projections: layerContext.projections,
            path: layerContext.path
        };
        if (this.layerOptions) {
            OpenLayers.Util.applyDefaults(options, this.layerOptions);
        }

        var params = {
            layers: layerContext.name,
            transparent: layerContext.transparent,
            INFO_FORMAT: layerContext.info_format,
            version: layerContext.version,
            owsservice: layerContext.owsservice
        };
        if (layerContext.formats && layerContext.formats.length>0) {
            // set default value for params if current attribute is not positionned
            params.format = layerContext.formats[0].value;
            for (i=0, len=layerContext.formats.length; i<len; i++) {
                var format = layerContext.formats[i];
                if (format.current == true) {
                    params.format = format.value;
                    break;
                }
            }
        }
        if (layerContext.styles && layerContext.styles.length>0) {
            for (i=0, len=layerContext.styles.length; i<len; i++) {
                var style = layerContext.styles[i];
                if (style.current == true) {
                    // three style types to consider
                    // 1) linked SLD
                    // 2) inline SLD
                    // 3) named style
                    if(style.href) {
                        params.sld = style.href;
                    } else if(style.body) {
                        params.sld_body = style.body;
                    } else {
                        params.styles = style.name;
                    }
                    break;
                }
            }
        }
        if (this.layerParams) {
            OpenLayers.Util.applyDefaults(params, this.layerParams);
        }

        var layer = null;
        var service = layerContext.service;
        if (service == OpenLayers.Format.Context.serviceTypes.WFS) {
            options.strategies = [new OpenLayers.Strategy.BBOX()];
            options.protocol = new OpenLayers.Protocol.WFS({
                url: layerContext.url,
                // since we do not know featureNS, let the protocol
                // determine it automagically using featurePrefix
                featurePrefix: layerContext.name.split(":")[0],
                featureType: layerContext.name.split(":").pop()
            });
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
        } else if (service == OpenLayers.Format.Context.serviceTypes.KML) {
            // use a vector layer with an HTTP Protcol and a Fixed strategy
            options.strategies = [new OpenLayers.Strategy.Fixed()];
            options.protocol = new OpenLayers.Protocol.HTTP({
                url: layerContext.url, 
                format: new OpenLayers.Format.KML()
            });
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
        } else if (service == OpenLayers.Format.Context.serviceTypes.GML) {
            // use a vector layer with a HTTP Protocol and a Fixed strategy
            options.strategies = [new OpenLayers.Strategy.Fixed()];
            options.protocol = new OpenLayers.Protocol.HTTP({
                url: layerContext.url, 
                format: new OpenLayers.Format.GML()
            });
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
        } else if (layerContext.features) {
            // inline GML or KML features
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
            layer.addFeatures(layerContext.features);
        } else if (layerContext.categoryLayer !== true) {

            // HSLayers.Layer.OWS
            if (params.owsservice) {
                layer = new HSLayers.Layer[params.owsservice.toUpperCase()](
                            layerContext.title || layerContext.name,
                            layerContext.url,
                            params,
                            options
                        );
            }
            // OpenLayers.Layer.WMS
            else {
                layer = new OpenLayers.Layer.WMS(
                    layerContext.title || layerContext.name,
                    layerContext.url,
                    params,
                    options
                );
            }
        }
        return layer;
    },

    CLASS_NAME: "HSLayers.Format.WMC" 
});

