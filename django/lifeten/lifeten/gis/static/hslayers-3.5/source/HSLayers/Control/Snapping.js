/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Control.Snapping
 * Acts as a snapping agent while editing vector features.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
HSLayers.Control.Snapping = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     * Listeners will be called with a reference to an event object.  The
     *     properties of this event depends on exactly what happened.
     *
     * Supported control event types (in addition to those from <OpenLayers.Control>):
     * beforesnap - Triggered before a snap occurs.  
     * snap - Triggered when a snap occurs. 
     * snapchanged - snapping parameteres were changed
     */
    EVENT_TYPES: ["snapchanged"],

    /**
     * URL
     */
    serverSnapScript: "",

    /**
     * units for snapping, use 'px' or 'map'
     * @name HSLayers.Control.Snapping.units
     * @type String
     * @default 'px'
     */
    units: "map",

    /**
     * edit layer 
     * @type HSLayers.Layer.MapServer
     */
    editLayer: null,

    /**
     * list of currently snapping vertexes, which is stored, during the
     * asynchronous call
     * @name HSLayers.Layer.vertexCache
     * @name [OpenLayers.Geometry.Point]
     */
    _vertexCache: null,

    /**
     * CONSTANT: DEFAULTS
     * Default target properties.
     */
    SERVER_DEFAULTS: {
        tol: 10,
        rec: -1,
        lyrs:"snap"
    },

    /**
     * Default target properties.
     * Valid options are:
     *   * edit - name of the edited layer from HSLayers.Layer.MapServer
     *   * tol - tolerance
     *   * active - activated or not
     *   * lyrs - comma separated list of layers to be snaped on 
     *   * rec - record number. -1 for new, Ingeter id for existing
     *   * prj  - project name
     * @name HSLayers.Control.Snapping
     * @type Object
     *
     */
    snapParams: {},
    
    /**
     * Property: resolution
     * {Float} The map resolution for the previously considered snap.
     */
    resolution: null,
    
    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>} The current editable layer.  Set at
     *     construction or after construction with <setLayer>.
     */
    layer: null,

    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>} The current editable feature.
     */
    feature: null,
    
    /**
     * Property: point
     * {<OpenLayers.Geometry.Point>} The currently snapped vertex.
     */
    point: null,

    /**
     * Property: vertex
     * {<OpenLayers.Geometry.Point>} last vertex in the feature
     */
    vertex: null,
    
    /**
     * @constructor
     * @param {Object} options
     */
    initialize: function(options) {
        // concatenate events specific to measure with those from the base
        Array.prototype.push.apply(
            this.EVENT_TYPES, OpenLayers.Control.prototype.EVENT_TYPES
        );
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.options = options || {}; // TODO: this could be done by the super
        
        // set the editable layer if provided
        if(this.options.layer) {
            this.setLayer(this.options.layer);
        }

        this._vertexCache = {};
    },

    /**
     * APIMethod: setLayer
     * Set the editable layer.  Call the setLayer method if the editable layer
     *     changes and the same control should be used on a new editable layer.
     *     If the control is already active, it will be active after the new
     *     layer is set.
     *
     * Parameters:
     * layer - {OpenLayers.Layer.Vector}  The new editable layer.
     */
    setLayer: function(layer) {
        if(this.active) {
            this.deactivate();
            this.layer = layer;
            this.activate();
        } else {
            this.layer = layer;
        }
    },
    
    /**
     * APIMethod: activate
     * Activate the control.  Activating the control registers listeners for
     *     editing related events so that during feature creation and
     *     modification, moving vertices will trigger snapping.
     */
    activate: function() {
        var activated = OpenLayers.Control.prototype.activate.call(this);
        if(activated) {
            if(this.layer && this.layer.events) {
                this.layer.events.on({
                    featuremodified: this.afterFeatureModified,
                    vertexmodified: this.onVertexModified,
                    sketchmodified: this.onSketchModified,
                    sketchcomplete: this.onPointAdded,
                    scope: this
                });
            }

        }
        if (this.map){
            this.map.events.register("moveend",this,this.update);
        }

        this.layer.events.register("featureselected",this, this.update);
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the control.  Deactivating the control unregisters listeners
     *     so feature editing may proceed without engaging the snapping agent.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Control.prototype.deactivate.call(this);
        if(deactivated) {
            if(this.layer && this.layer.events) {
                this.layer.events.un({
                    featuremodified: this.afterFeatureModified,
                    vertexmodified: this.onVertexModified,
                    sketchmodified: this.onSketchModified,
                    sketchcomplete: this.onPointAdded,
                    scope: this
                });
            }
        }
        this.feature = null;
        this.point = null;
        if (this.map) {
            this.map.events.unregister("moveend",this,this.update);
        }
        this.layer.events.unregister("addfeature",this, this.update);
        return deactivated;
    },

    /**
     * feture was modified, snap
     */
    onVertexModified: function(event) {
        this.vertexToBeModified = event.vertex;
    },

    /**
     * sketch started, set the style
     */
    onSketchStarted: function(event) {
        this.control = event.object._control;
        this.feature = event.feature;
        this.update();
    },

    /**
     * get radius in pixels
     */
    getRadius: function() {
        var radius = 0;
        if (this.units != "px") {
            var tol = this.snapParams.tol != undefined ? this.snapParams.tol : this.SERVER_DEFAULTS.tol
            radius =  tol/this.layer.map.getResolution();
        }
        else {
            radius =  this.snapParams.tol != undefined ? this.snapParams.tol : this.SERVER_DEFAULTS.tol;
        }

        return radius;
    },

    /**
     * feture was modified, snap
     */
    afterFeatureModified: function(event) {
        var vertex;
        this.feature = event.feature;
        switch(this.feature.geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Polygon":
                for (var i = 0; i < this.feature.geometry.components.length; i++) {
                    var component = this.feature.geometry.components[i];
                    for (var j = 0; j < component.components.length; j++) {
                        if (component.components[j].x == this.vertexToBeModified.x &&
                           component.components[j].y == this.vertexToBeModified.y){
                            vertex = component.components[j];
                        }
                    }
                }
                break;
            case "OpenLayers.Geometry.LineString":
                for (var i = 0; i < this.feature.geometry.components.length; i++) {
                    var component = this.feature.geometry.components[i];
                    if (component.x == this.vertexToBeModified.x &&
                        component.y == this.vertexToBeModified.y){
                        vertex = component;
                    }
                }
                break;
            case "OpenLayers.Geometry.Point":
                vertex = this.feature.geometry;
                break;
        }
        if (vertex) {
            this.considerSnapping(-1,vertex,vertex);
            this.layer.redraw();
        }
    },

    /**
     * Method: onVertexModified
     * Registered as a listener for the vertexmodified event on the editable
     *     layer.
     *
     * Parameters:
     * event - {Object} The vertex modified event.
     */
    onSketchModified: function(event) {

        this.onSketchStarted(event);

        event.object._control.handler.layer.styleMap.createSymbolizer(event.feature,"default");
        this.feature = event.feature;
        switch(this.feature.geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Polygon":
                var polygons = this.feature.geometry.components.length;
                var geometry = this.feature.geometry.components[polygons-1];
                var len = geometry.components.length;
                if (this.vertex != geometry.components[len-3]) {  
                    this.vertex = geometry.components[len-3];
                    this.considerSnapping(len-3,event.vertex,geometry);
                }
                break;
            case "OpenLayers.Geometry.Path":
            case "OpenLayers.Geometry.LineString":
                var geometry = this.feature.geometry;
                var len = geometry.components.length;
                if (this.vertex != geometry.components[len-2]) {
                    this.vertex = geometry.components[len-2];
                    this.considerSnapping(len-2,event.vertex,geometry);
                }
                break;
        }
    },

    /**
     * for points
     * @function
     * @name HSLayers.Control.Snapping.onPointAdded
     */
    onPointAdded:function(event) {
        switch(event.feature.geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Point":
                this.feature = event.feature;
                var geometry = this.feature.geometry;
                this.considerSnapping(-1,geometry,geometry);
                break;
            default:
                break;

            // nothing else
            case "OpenLayers.Geometry.Path":
                this.feature = event.feature;
                var points = this.feature.geometry.components.length-1;
                var geometry = this.feature.geometry;
                this.considerSnapping(points,geometry,geometry);
            case "OpenLayers.Geometry.Polygon":
                this.feature = event.feature;
                var rings = this.feature.geometry.components.length-1;
                var point = this.feature.geometry.components[rings].components.length-2;
                var geometry = this.feature.geometry.components[rings];
                this.considerSnapping(point,geometry,geometry);
                break;
        };
    },

    /**
     * Method: considerSnapping
     *
     * @param {Integer} idx index of the point in the geometry
     * @param {OpenLayers.Geometry.Point} vertex The vertex to be snapped
     * @param [{OpenLayers.Geometry}] geometry geometry  of the snapped
     * feature
     */
    considerSnapping: function(idx,vertex, geometry) {

        if (this.snapParams.tol == 0 || this.snapParams.active != true) {
            return;
        }

        /*
         * Consider snapping the the FIRST point of line
         */
        // if (geometry.CLASS_NAME == "OpenLayers.Geometry.LineString") {

        //     // If the distance to first point is smaller then tolerance
        //     if (geometry.components.length > 1 && Math.sqrt(Math.pow(geometry.components[0].x - vertex.x,2) + 
        //                 Math.pow(geometry.components[0].y - vertex.y,2)) < 
        //                 this.snapParams.tol && false) {

        //         // change the point
        //         if (idx > -1) {
        //             geometry.components[idx].x = geometry.components[0].x;
        //             geometry.components[idx].y = geometry.components[0].y;
        //         }
        //         this.point = new OpenLayers.Geometry.Point(geometry.components[0].x,geometry.components[1].y);
        //     
        //         vertex.x = geometry.components[0].x;
        //         vertex.y = geometry.components[0].y;

        //         return vertex;
        //     }
        // }

        /*
         * snap to server
         */

        var point;
        if (idx > -1) {
            point = geometry.components[idx];
        }
        else {
            point = geometry;
        }

        var snapParams = OpenLayers.Util.extend(this.SERVER_DEFAULTS,this.snapParams);
        snapParams.coords = point.x+","+point.y;
        snapParams.tol = (this.units == "px" ?  this.getGeoTolerance(this.snapParams.tol): this.snapParams.tol);
        snapParams.id = vertex.id;

        if (this.editLayer && this.editLayer.project || this.editLayer.params.project) {
            snapParams.prj = this.editLayer.project || this.editLayer.params.project;
        }
        this._vertexCache[vertex.id] = point;

        var request =  OpenLayers.Request.GET({
            url: this.serverSnapScript,
            params: snapParams,
            scope: this,
            success: this._onVertexSnappedResponse,
            async: true
        });

        return vertex;
    },

    /**
     * Method: snapToSelf
     * Snap last point to first point, if needed
     *
     * @param {Integer} idx index of the point in the geometry
     * @param {OpenLayers.Geometry.Point} vertex The vertex to be snapped
     * @param [{OpenLayers.Geometry}] geometry geometry  of the snapped
     * feature
     */
    snapToSelf: function(idx,vertex, geometry) {
                    // nothing yet
    },

    /**
     * Server-side script reponse handler
     * @function
     * @private
     */
    _onVertexSnappedResponse: function(r) {

        // new vertex
        var format = new OpenLayers.Format.JSON();
        var coords = format.read(r.responseText.trim());
        var newVertex = new OpenLayers.Geometry.Point(coords.x, coords.y);

        // get the vertex to be modified
        var oldVertex = this._vertexCache[coords.id];

        if ( newVertex.x && oldVertex) {
            oldVertex.x = newVertex.x;
            oldVertex.y = newVertex.y;
        }
        this.feature.layer.drawFeature(this.feature);
        // this.control.handler.layer.drawFeature(this.feature);
        //this.control.handler.layer.redraw(true); // makes problems when
        //making holes in polygons

    },

    
    /**
     * Method: getGeoTolerance
     * Calculate a tolerance in map units given a tolerance in pixels. 
     *     
     * Parameters:
     * tolerance - {Number} A tolerance value in pixels.
     *
     * Returns:
     * {Number} A tolerance value in map units.
     */
    getGeoTolerance: function(tolerance) {
        var resolution = this.layer.map.getResolution();
        geoTolerance = tolerance * resolution;
        return geoTolerance;
    },
    
    /**
     * Method: destroy
     * Clean up the control.
     */
    destroy: function() {
        if(this.active) {
            this.deactivate(); // TODO: this should be handled by the super
        }
        delete this.layer;
        delete this.targets;
        OpenLayers.Control.prototype.destroy.call(this);
    },

    /**
     * update relevant this parameters to the controls
     * 
     */
    update: function(evt) {
        // OpenLayers.Handler.DrawFeature
        var radius = this.getRadius();
        if (radius < 5) {
            radius = 5;
        }
        if (this.control && this.control.handler && this.control.handler.point && this.control.handler.point.style) {
            this.control.handler.point.style.pointRadius = radius;
        }

        // OpenLayers.Handler.ModifyFeature
        if (this.layer._control &&
                this.layer._control instanceof OpenLayers.Control.ModifyFeature && 
                this.layer._control.virtualStyle) {
                 
            this.layer._control.virtualStyle.pointRadius = radius;
            this.layer.styleMap.addUniqueValueRules("default",
                                                    "sketch",
                                                    {"true":
                                                        {
                                                            "pointRadius": radius
                                                        }
                                                    },
                                                    function(f){
                                                        return {sketch:String(f._sketch)};
                                                    }
                                                );
            this.layer._control.layer.redraw();
            // evt.feature.style = {"pointRadius":radius}; // FIXME normal
            // poits are drawed with radius 6, no matter, what we try
        }

    },
            
    /**
     * updateParams - update snapParams
     *
     * 
     */
    updateParams: function(snapObj) {
        for (var i in snapObj) {
            switch(i) {
                case "units": this.units = snapObj[i];
                    break;
                case "edit": this.snapParams.edit = snapObj[i];
                    break;
                case "active": this.snapParams.active = snapObj[i];
                    break;
                // case "distance": this.snapParams.tol = (this.snapParams.active || snapObj.active ? snapObj[i] : 0);
                case "distance": this.snapParams.tol = snapObj[i];
                    break;
                case "layers": 
                    var layers = "";
                    for (var j = 0; j < snapObj[i].length;j++) {
                        layers += snapObj[i][j]; 
                        layers += (j < snapObj[i].length-1 ? ",":'');
                    }
                    this.snapParams.lyrs = layers;
                    break;
            }
        }
        this.update();
        this.events.triggerEvent("snapchanged",this.snapParams);
    },

    CLASS_NAME: "HSLayers.Control.Snapping"
});
