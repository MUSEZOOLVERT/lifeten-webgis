/* Copyright (c) 2007-2010 Help Service - Remote Sensing s.r.o.
 * Author(s): Martin Vlk
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

Ext.namespace("HSLayers.Widget");

/**
 * Box for rendering feature with symbolizer
 *
 * @class HSLayers.Widget.BoxFeatureRenderer
 */
HSLayers.Widget.BoxFeatureRenderer = Ext.extend(Ext.BoxComponent, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * Feature which is rendered
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.feature
     * @type OpenLayers.Feature
     */
    feature: undefined,

    /**
     * Default line feature
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.lineFeature
     * @type OpenLayers.Feature.Vector
     */
    lineFeature: undefined,

    /**
     * Minimal component width
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.minWidth
     * @type Integer
     */
    minWidth: 30,

    /**
     * Minimal component height
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.minHeight
     * @type Integer
     */
    minHeight: 20,

    /**
     * Default point feature
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.polygonFeature
     * @type OpenLayers.Feature.Vector
     */
    pointFeature: undefined,

    /**
     * Default polygon feature
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.polygonFeature
     * @type OpenLayers.Feature.Vector
     */
    polygonFeature: undefined,

    /**
     * Active renderer which is used for render
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.renderer
     * @type OpenLayers.Renderer
     */
    renderer: null,

    /**
     * Options for renderer
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.rendererOptions
     * @type Object
     */
    rendererOptions: null,

    /**
     * Renderer types
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.renderers
     * @type Array of String
     */
    renderers: ["SVG", "VML", "Canvas"],

    /**
     * Resolution for render
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.resolution
     * @type Double
     */
    resolution: 1,

    /**
     * Symbolizer used for render feature
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.symbolizers
     * @type Object
     */
    symbolizers: [OpenLayers.Feature.Vector.style["default"]],

    /**
     * Type of geometry for rendered feature
     * @private
     * @name HSLayers.Widget.BoxFeatureRenderer.
     * @type String
     */
    symbolType: "Point",

    /**
     * Assign appropriate renderer by browser capabilities
     * @private
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer._assignRenderer
     */
    _assignRenderer: function()  {
        for(var i=0, len=this.renderers.length; i<len; ++i) {
            var Renderer = OpenLayers.Renderer[this.renderers[i]];
            if(Renderer && Renderer.prototype.supported()) {
                this.renderer = new Renderer(
                    this.el, this.rendererOptions
                );
                break;
            }
        }
    },

    /**
     * Clear custom events
     * @private
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer._clearCustomEvents
     */
    _clearCustomEvents: function() {
        if (this.el && this.el.removeAllListeners) {
            this.el.removeAllListeners();
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.
     * @param
     * @return {}
     */
    _initCustomEvents: function() {
        this._clearCustomEvents();
        this.el.on("click", this.onClick, this);
    },

    /**
     * @private
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer._setRendererDimensions
     */
    _setRendererDimensions: function() {
        var gb = this.feature.geometry.getBounds();
        var gw = gb.getWidth();
        var gh = gb.getHeight();
        var resolution = this.initialConfig.resolution;
        if(!resolution) {
            resolution = Math.max(gw / this.width || 0, gh / this.height || 0) || 1;
        }
        this.resolution = resolution;
        var width = Math.max(this.width || this.minWidth, gw / resolution);
        var height = Math.max(this.height || this.minHeight, gh / resolution);
        var center = gb.getCenterPixel();
        var bhalfw = width * resolution / 2;
        var bhalfh = height * resolution / 2;
        var bounds = new OpenLayers.Bounds(
            center.x - bhalfw, center.y - bhalfh,
            center.x + bhalfw, center.y + bhalfh
        );
        this.renderer.setSize(new OpenLayers.Size(Math.round(width), Math.round(height)));
        this.renderer.setExtent(bounds, true);
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.initComponent
     */
    initComponent: function() {
        HSLayers.Widget.BoxFeatureRenderer.superclass.initComponent.apply(this, arguments);

        Ext.applyIf(this, {
            pointFeature: new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(0, 0)
            ),
            lineFeature: new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.LineString([
                    new OpenLayers.Geometry.Point(-8, -3),
                    new OpenLayers.Geometry.Point(-3, 3),
                    new OpenLayers.Geometry.Point(3, -3),
                    new OpenLayers.Geometry.Point(8, 3)
                ])
            ),
            polygonFeature: new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Polygon([
                    new OpenLayers.Geometry.LinearRing([
                        new OpenLayers.Geometry.Point(-8, -4),
                        new OpenLayers.Geometry.Point(-6, -6),
                        new OpenLayers.Geometry.Point(6, -6),
                        new OpenLayers.Geometry.Point(8, -4),
                        new OpenLayers.Geometry.Point(8, 4),
                        new OpenLayers.Geometry.Point(6, 6),
                        new OpenLayers.Geometry.Point(-6, 6),
                        new OpenLayers.Geometry.Point(-8, 4)
                    ])
                ])
            )
        });
        if(!this.feature) {
            this.setFeature(null, {draw: false});
        }
        this.addEvents(
            "click"
        );
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.afterRender
     */
    afterRender: function() {
        HSLayers.Widget.BoxFeatureRenderer.superclass.afterRender.apply(this, arguments);
        this._initCustomEvents();
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.beforeDestroy
     */
    beforeDestroy: function() {
        this._clearCustomEvents();
        if (this.renderer) {
            this.renderer.destroy();
        }
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.drawFeature
     */
    drawFeature: function() {
        this.renderer.clear();
        this._setRendererDimensions();
        for (var i=0, len=this.symbolizers.length; i<len; ++i) {

            // *****************************
            // WebKit/Chrome hack
            this.renderer.supportUse = true;
            // *****************************

            this.renderer.drawFeature(
                this.feature.clone(),
                Ext.apply({}, this.symbolizers[i])
            );
        }
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.onClick
     */
    onClick: function() {
        this.fireEvent("click", this);
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.onRender
     * @param {Object} component
     * @param {Object} position
     */
    onRender: function(component, position) {
        if(!this.el) {
            this.el = document.createElement("div");
            this.el.id = this.getId();
        }
        if(!this.renderer || !this.renderer.supported()) {
            this._assignRenderer();
        }
        this.renderer.map = {
            getResolution: (function() {
                return this.resolution;
            }).createDelegate(this)
        };

        this.drawFeature();
        HSLayers.Widget.BoxFeatureRenderer.superclass.onRender.apply(this, arguments);
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.onResize
     * @param {Integer} width
     * @param {Integer} height
     */
    onResize: function(width, height) {
        this._setRendererDimensions();
        HSLayers.Widget.BoxFeatureRenderer.superclass.onResize.apply(this, arguments);
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.setFeature
     * @param {OpenLayers.Feature.Vector} feature
     * @param {Object} options
     */
    setFeature: function(feature, options) {
        this.feature = feature || this[this.symbolType.toLowerCase() + "Feature"];
        if(!options || options.draw) {
            this.drawFeature();
        }
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.setSymbolizers
     * @param {Array of Object} symbolizers
     * @param {Object} options
     */
    setSymbolizers: function(symbolizers, options) {
        this.symbolizers = symbolizers;
        if(!options || options.draw) {
            this.drawFeature();
        }
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.setSymbolType
     * @param {String} type
     * @param {Object} options
     */
    setSymbolType: function(type, options) {
        this.symbolType = type;
        this.setFeature(null, options);
    },

    /**
     * @function
     * @name HSLayers.Widget.BoxFeatureRenderer.update
     * @param {Object} options
     */
    update: function(options) {
        options = options || {};
        if(options.feature) {
            this.setFeature(options.feature, {draw: false});
        } else if(options.symbolType) {
            this.setSymbolType(options.symbolType, {draw: false});
        }
        if(options.symbolizers) {
            this.setSymbolizers(options.symbolizers, {draw: false});
        }
        this.drawFeature();
    }
});

Ext.reg("hslayers_boxfeaturerenderer", HSLayers.Widget.BoxFeatureRenderer);
