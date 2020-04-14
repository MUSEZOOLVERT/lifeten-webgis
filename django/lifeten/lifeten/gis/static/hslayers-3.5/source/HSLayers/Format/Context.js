HSLayers.namespace("HSLayers.Format","HSLayers.Format.Context");
/**
 * Read and write Web Map Context documents.
 * @class HSLayers.Format.Context
 * @augments OpenLayers.Format.Context
 */
HSLayers.Format.Context = OpenLayers.Class(OpenLayers.Format.Context, {

    getLayerFromContext : function(layerContext) {
        var i, len;
        // fill initial options object from layerContext
        var options = {
            queryable: layerContext.queryable, //keep queryable for api compatibility
            abstract: layerContext.abstract,
            visibility: layerContext.visibility,
            maxExtent: layerContext.maxExtent,
            metadata: layerContext.metadata,
            transitionEffect:"resize",
            legend: layerContext.legend,
            numZoomLevels: layerContext.numZoomLevels,
            units: layerContext.units,
            isBaseLayer: layerContext.isBaseLayer,
            opacity: layerContext.opacity,
            displayInLayerSwitcher: layerContext.displayInLayerSwitcher,
            singleTile: layerContext.singleTile,
            info_format: layerContext.info_format,
            projection: layerContext.projection,
            projections: layerContext.projections,
            tileSize: (layerContext.tileSize) ? 
                new OpenLayers.Size(
                    layerContext.tileSize.width, 
                    layerContext.tileSize.height
                ) : undefined,
            minScale: layerContext.minScale || layerContext.maxScaleDenominator,
            maxScale: layerContext.maxScale || layerContext.minScaleDenominator,
            attribution: layerContext.attribution
        };
        if (this.layerOptions) {
            OpenLayers.Util.applyDefaults(options, this.layerOptions);
        }

        var params = {
            layers: layerContext.name,
            transparent: layerContext.transparent,
            version: layerContext.version
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
            layer = new OpenLayers.Layer.WMS(
                layerContext.title || layerContext.name,
                layerContext.url,
                params,
                options
            );
        }
        return layer;
    }, 
    
    CLASS_NAME: "HSLayers.Format.Context"
});
