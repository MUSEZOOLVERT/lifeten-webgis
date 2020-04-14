HSLayers.namespace("HSLayers.Format","HSLayers.Format.PrinterContext");
HSLayers.Format.PrinterContext = OpenLayers.Class({

    /**
     * paper box
     * @type {OpenLayers.Bounds}
     */
    bounds: undefined,

    /**
     * Get default value for style attribute. This value correspond to  
     * appropriate default value from OpenLayers
     * @type {Object}
     */
    DEFAULT_STYLE_ATTRIBUTE_VALUE: {
        graphicName: "circle",
        fillOpacity: 0.4,
        strokeColor: "#ee9900",
        strokeOpacity: 1,
        strokeWidth: 1,
        strokeLinecap: "round",
        strokeDashstyle: "solid",
        pointRadius: 6    
    },

    /**
     * resolution
     * @default 100
     * @type {Integer}
     */
    resolution: 100,

    /**
     * Get default value for style attribute. This value correspond to  
     * appropriate default value from OpenLayers
     * @function
     * @private
     * @param {String} attrName
     * @returns {mixed}
     */
    _getDefaultStyleAttributeValue: function(attrName) {
        var defaultValue = this.DEFAULT_STYLE_ATTRIBUTE_VALUE[attrName];
        return defaultValue;
    },

    /**
     * modify style attributes sended to hsprinter service
     * @function
     * @private
     * @param {String} attrName
     * @param {mixed} attrValue
     * @returns {mixed}
     */
    _modifyVectorStyleAttribute: function(attrName, attrValue) {
        var newValue = attrValue;
        switch (attrName) {
            case "externalGraphic":
                // add server name to relative file path
                if (newValue.search("/") === 0) {
                    newValue = window.location.protocol+"//"+window.location.hostname+newValue;
                }
                break;
            case "fillOpacity":
            case "strokeOpacity":
                newValue = newValue * 100;
                break;
            case "pointRadius":
                //newValue = newValue * 2;
                break;
            case "externalGraphic":
                if (attrName == "externalGraphic" && attrValue.search("http") !== 0) {
                    newValue = window.location.protocol+"//"+window.location.hostname+"/"+attrValue;
                }
            break;
        }
        return newValue;
    },

    /**
     * @constructor
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.options = options;
    },

    /**
     * set box
     * @function
     * @param {OpenLayers.Bounds} bounds
     */
    setBounds: function(bounds) {
        this.bounds = bounds;
    },

    /**
     * set scale
     * @function
     * @param {Float} scaledenom
     */
    setScale: function(scaledenom) {
        this.scale = scaledenom;
    },

    /**
     * set resolution
     * @function
     * @param {Integer} resolution
     */
    setResolution: function(resolution) {
        this.resolution = resolution;
    },
            
    /**
     * to context
     * @function
     * @param {OpenLayers.Map} map
     * @returns {Object}
     */
    toContext: function(map) {
        var context = {};
        context.name = map.name; 
        context.title = map.title || ""; 
        context.scale = this.scale || map.getScale();
        // round bounds
        if (map.getProjectionObject().getUnits() != "degrees") {
            this.bounds.left = Math.round(this.bounds.left);
            this.bounds.bottom = Math.round(this.bounds.bottom);
            this.bounds.right = Math.round(this.bounds.right);
            this.bounds.top = Math.round(this.bounds.top);
        }
        context.paperBox = this.bounds;
        context.resolution = this.resolution;
        context.units = map.units;
        context.layers = this.getLayers(map);
        context.projection = map.projection.getCode ? map.projection.getCode() : map.projection;
        context.size = [map.getSize().w, map.getSize().h];
        context.parameters = {};
        var overviews = map.getControlsByClass("OpenLayers.Control.OverviewMap");
        if ( overviews.length > 0) {
            context.reference = this.getRefence(overviews[0]);
        }
        return context;
    },

    /**
     * write map context to JSON
     * @param {OpenLayers.Map} map
     * @param {String} template file name
     * @returns {String}
     */
    write: function(map,template,parameters) {
        var context = this.toContext(map);
        context.template = template || "basic_a4p.html";
        if (parameters) {
            context.parameters = parameters;
        }

        var format = new OpenLayers.Format.JSON();
        return format.write(context);
    },

    /**
     * this function takes care, that only layers we are able to convert
     * into the context, will be converted
     */
    getLayers: function(obj) {
        var layers = [];
        for (var i = 0, len = obj.layers.length; i <  len; i++) {

            var layer = obj.layers[i];

            if (!layer.getVisibility()) {
                continue;
            }
            if (!layer.calculateInRange()) {
                continue;
            }
            if (layer._noPrint) {
                continue;
            }

            if (
                obj.layers[i] instanceof OpenLayers.Layer.Grid ||
                obj.layers[i] instanceof OpenLayers.Layer.Image ||
                obj.layers[i] instanceof OpenLayers.Layer.Vector) {
                layers.push(this.layerToContext(obj.layers[i]));
            }
        }
        return layers;
    },

    /**
     * Layer To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerToContext: function(layer) {


        if (layer.context) {
            return this.layerWithContextToContext(layer);
        }
        else {
            if (layer instanceof HSLayers.Layer.WMS) {
                return this.layerHSWMSToContext(layer);
            }
            if (layer instanceof OpenLayers.Layer.WMS) {
                return this.layerWMSToContext(layer);
            }
            else if (layer instanceof OpenLayers.Layer.MapServer) {
                return this.layerMapServerToContext(layer);
            }
            else if (layer instanceof OpenLayers.Layer.Grid) {
                return this.layerGridToContext(layer);
            }
            else if (layer instanceof OpenLayers.Layer.Image) {
                return this.layerImageToContext(layer);
            }
            else if (layer instanceof OpenLayers.Layer.Vector) {
                return this.layerVectorToContext(layer);
            }
        }
    },

    /**
     * Layer To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerMapServerToContext: function(layer) {
       var obj = this.layerGridToContext(layer); 

        //fix image zoom, scale, resolution request
        //determine new tile bounds
        // from OpenLayers.Layer.Grid
        var ll = new OpenLayers.LonLat(this.bounds.left, this.bounds.bottom);
        var rt = new OpenLayers.LonLat(this.bounds.right, this.bounds.top);

        var dpi = OpenLayers.DOTS_PER_INCH;
        OpenLayers.DOTS_PER_INCH = 96; // TODO make this globaly configureable
        var resolution = OpenLayers.Util.getResolutionFromScale(this.scale,layer.map.units);
        OpenLayers.DOTS_PER_INCH = dpi;

        var width = Math.round(1/resolution*this.bounds.getWidth());
        var height = Math.round(1/resolution*this.bounds.getHeight());

        // get legend url for the mapserver layer
        var imgurl = obj.grid[0][0].url;
        var params = OpenLayers.Util.getParameters(imgurl);

        // logged in users
        params.PHPSESSID = HSLayers.Util.getCookie("PHPSESSID");

        // fix the URL
        if (OpenLayers.String.contains(imgurl, '?')) {
            var start = imgurl.indexOf('?') + 1;
            var end = OpenLayers.String.contains(imgurl, "#") ?
                        imgurl.indexOf('#') : imgurl.length;
            params.mode = "map";
            params.map_size = width+" "+height;
            params.imgext = params.mapext = this.bounds.left+" "+this.bounds.bottom+" "+this.bounds.right+" "+this.bounds.top;
        
            obj.grid[0][0].url = OpenLayers.Util.urlAppend(imgurl.substring(0,start),
                                OpenLayers.Util.getParameterString(params));
            obj.grid[0][0].bounds = this.bounds;

            params.mode = "legend";
            obj.legend = OpenLayers.Util.urlAppend(imgurl.substring(0,start),
                                OpenLayers.Util.getParameterString(params));

        }

        // add titles, if they are available
        if (HSLayers.Layer.TreeLayer && layer instanceof HSLayers.Layer.TreeLayer) {
            obj.titles = {};
            var layers = layer.params.LAYERS;
            for (var i = 0, ilen = layers.length; i < ilen; i++) {
                var tlayer = layer.getLayer(layers[i]); 
                obj.titles[layers[i]] = tlayer.title;
            }
        }

        return obj;
    },

    /**
     * Layer To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerGridToContext: function(layer) {
        var obj = this.getBasicLayerContext(layer);
        obj.type = "grid";

        obj.grid = [];
        for (var i = 0; i < layer.grid.length; i++) {
            var columns = [];
            for (var j = 0; j < layer.grid[i].length; j++) {

                if ((layer.grid[i][j].bounds.left < this.bounds.right &&
                    layer.grid[i][j].bounds.right > this.bounds.left) &&
                    (layer.grid[i][j].bounds.top > this.bounds.bottom &&
                        layer.grid[i][j].bounds.bottom < this.bounds.top)) {

                    var url = layer.grid[i][j].url;

                    if (url) {

                        // make relative paths to absolute
                        if (url.search("http") !== 0) {
                            url = window.location.protocol+"//"+window.location.hostname+"/"+url;
                        }
                        columns.push({url:url,bounds:layer.grid[i][j].bounds});
                    }
                }
            }

            if (columns.length > 0) {
                obj.grid.push(columns);
            }
        }
        
        return obj;
    },

    /**
     * Layer To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerImageToContext: function(layer) {
        var obj = this.getBasicLayerContext(layer);
        obj.type = "grid";

        obj.grid = [];
        obj.grid.push([
                {
                    bounds: layer.extent,
                    url: layer.url
                }
        ]);
        return obj;
    },

    /**
     * some Layer with wms context To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerWithContextToContext: function(layer) {
        var options = OpenLayers.Util.extend({},layer.options);
        options.opacity = layer.opacity;
        var fakeWMS = new OpenLayers.Layer.WMS(layer.name, layer.context.url,
                {
                        layers: layer.context.name,
                        format: layer.context.format
                }, options);

        fakeWMS.params.SRS = layer.map.getProjectionObject().getCode();
        return this.layerWMSToContext(fakeWMS);
    },

    /**
     * HS.WMS Layer To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerHSWMSToContext: function(layer) {

        var obj = this.layerWMSToContext(layer);

        if (!layer.projection.equals(layer.map.getProjectionObject())) {
            obj.params.OWSSERVICE = "WMS";
            obj.params.OWSURL = obj.url;
            obj.params.FROMCRS = layer.projection.getCode();
            obj.url = HSLayers.OWS.proxy4ows;
        
            if (obj.url.search("http") != 0) {
                obj.url = window.location.protocol+"//"+window.location.host+obj.url;
            }
        }
        else {
            obj.url = layer.url;
        }
        
        return obj;
    },

    /**
     * WMS Layer To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerWMSToContext: function(layer) {
        var obj = this.getBasicLayerContext(layer);
        obj.type = "wms";

        obj.url = layer.url;

        if (obj.url.search("http") != 0) {
            obj.url = window.location.protocol+"//"+window.location.host+obj.url;
        }
        obj.params = layer.params; 
        obj.version = layer.params.VERSION; 
        
        return obj;
    },

    /**
     * Layer To Context
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    layerVectorToContext: function(layer) {
        var obj = this.getBasicLayerContext(layer);
        obj.type = "vector";
        obj.features = [];
        
        var geoJson = new OpenLayers.Format.GeoJSON();
        var json = new OpenLayers.Format.JSON;
        
        var styleAttributes = [
            "externalGraphic", "fillColor", "fillOpacity", "graphicName", 
            "pointRadius", "strokeColor", "strokeDashstyle", "strokeOpacity", 
            "strokeWidth"
        ];
        
        var mapBbox = layer.map.getExtent().toGeometry();
        
        for(var i = 0, len = layer.features.length; i < len; i++) {
            var feature = layer.features[i].clone();
            var selectedFeatures = layer._selectedFeaturesToBePrinted || layer.selectedFeatures;
            // skip features without geometry
            if (!feature.geometry) {
                continue;
            }
            if (mapBbox.intersects(feature.geometry)) {
                
                var style= null;
                if(feature.state === OpenLayers.State.DELETE) {
                    style = "delete";
                }
                else if(OpenLayers.Util.indexOf(selectedFeatures,layer.features[i]) > -1) {
                    style = "select";
                }
                else if (layer.styleMap.styles.print) {
                    style = "print";
                }
                style = feature.style || style;
                var renderIntent = style || feature.renderIntent;
                style = layer.styleMap.createSymbolizer(feature, renderIntent);
                delete feature.crs;
                feature.attributes = {};
                for (var j = 0; j < styleAttributes.length; j++) {
                    var styleAttribute = styleAttributes[j];
                    if (style[styleAttribute]) {
                        feature.attributes[styleAttribute] = 
                            this._modifyVectorStyleAttribute(styleAttribute, style[styleAttribute]);
                    } else {
                        var defaultValue = 
                            this._getDefaultStyleAttributeValue(styleAttribute);
                        if (defaultValue) {
                            feature.attributes[styleAttribute] = defaultValue;
                        }
                    }
                }

                var featureJson = json.read(geoJson.write(feature));
                obj.features.push(featureJson);
            }
            feature.destroy();
        }      
        return obj;
    },

    /**
     * creates basic layer object
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Object}
     */
    getBasicLayerContext: function(layer)  {
        var obj = {};
        obj.name = layer.name;
        obj.attribution = layer.attribution;
        obj.legend = this._getLayerLegend(layer);
        obj.htmllegend = layer.htmllegend;
        var transparency = 255;
        var opacity = (layer.context && layer.context.opacity ?
                            layer.context.opacity : layer.opacity);
        if (opacity) {
            transparency = Math.round((opacity)*255);
        }
        obj.transparency = transparency;
        return obj;
    },

    /**
     * get legend
     * @private
     * @function
     */
    _getLayerLegend: function(layer) {
        if (layer.metadata && layer.metadata.styles) {
            for (var i = 0, len = layer.metadata.styles.length; i< len; i++) {
                if (layer.metadata.styles[i].current === true) {
                    return layer.metadata.styles[i].legend;
                }
            }
        }
    },

    /**
     * format reference map informations
     */
    getRefence: function(overview) {
        var extent = overview.ovmap.getExtent();
        return {
            "extent": extent, 
            "size": overview.size,
            "image": overview.ovmap.layers[0].getURL(extent)
        };
    },

    CLASS_NAME: "HSLayers.Format.PrinterContext"
});
