/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
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
HSLayers.namespace("HSLayers.Control");

/**
 * @description Drawing point into the map. When the point is drawed, the function of
 * the handler "done" will be called.
 *
 * <code>
 * var point = new HSLayers.Control.DrawPoint(hsLayers.workLayer,{displayClass:"hsControlDrawPoint"});
 * panel.addControls([point]);
 * point.handler.callbacks["done"] = function(g){ // do something or in this
 * case nothing};
 * </code>
 *
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html">OpenLayers.Control.DrawFeature</a>
 *
 */
HSLayers.Control.DrawPoint = OpenLayers.Class(OpenLayers.Control.DrawFeature, {

    /**
     * Used to set non-default properties on the control's handler
     * @name HSLayers.Control.DrawPoint.pointOptions
     * @type {Object} 
     */
    pointOptions: null,

    /**
     * @constructor
     * 
     * @name HSLayers.Control.DrawPoint
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/Vector-js.html">OpenLayers.Layer.Vector</a>} layer
     * @param {Object} options
     */
    initialize: function(layer, options) {
        // concatenate events specific to vector with those from the base
        //this.EVENT_TYPES =
        //    OpenLayers.Control.DrawFeature.prototype.EVENT_TYPES.concat(
        //    OpenLayers.Control.prototype.EVENT_TYPES
        //);

        
        options = options || {};
        options.callbacks = OpenLayers.Util.extend({done: this.drawFeature},
                                                this.callbacks);

        OpenLayers.Control.DrawFeature.prototype.initialize.apply(this, [layer, OpenLayers.Handler.Point, options]);
    },

    activate: function() {
        this.layer._control = this;
        OpenLayers.Control.DrawFeature.prototype.activate.apply(this,arguments);
    },

    /**
     * @name HSLayers.Control.DrawPoint.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.DrawPoint"

});

OpenLayers.Control.HSDrawPoint = HSLayers.Control.DrawPoint;

/**
 * Drawing line into the map. When the line is drawed, the function of
 * the handler "done" will be called.
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html">OpenLayers.Control.DrawFeature</a>
 *
 * @example
 *  var line = new HSLayers.Control.DrawLine(hsLayers.workLayer,{displayClass:"hsControlMeasureLine"});
 *  panel.addControls([line]);
 *  line.handler.mousedown = MyonMeasureLineMousedown;
 *  line.handler.mousemove = MyonMeasureLineMousemove;
 *  line.handler.callbacks["done"] = function(g){ // do something or in this
 *  case nothing};
 */
HSLayers.Control.DrawLine = OpenLayers.Class(OpenLayers.Control.DrawFeature, {

    /**
     * Used to set non-default properties on the control's handler
     * @name HSLayers.Control.DrawLine.lineOptions
     * @type {Object} 
     */
    lineOptions: null,

    /**
     * @constructor
     * @name HSLayers.Control.DrawLine
     */
    initialize: function(layer, options) {
      
        // concatenate events specific to vector with those from the base
        //this.EVENT_TYPES =
        //    OpenLayers.Control.DrawFeature.prototype.EVENT_TYPES.concat(
        //    OpenLayers.Control.prototype.EVENT_TYPES
        //);
        
        options = options || {};
        options.callbacks = OpenLayers.Util.extend({done: this.drawFeature,
                                                cancel: function(f) {
                                                    //this.layer.events.triggerEvent("featureremoved",{feature:f});
                                                }
                                                },
                                                this.callbacks);

        OpenLayers.Control.DrawFeature.prototype.initialize.apply(this, [layer, OpenLayers.Handler.Path, options]);

    },

    activate: function() {
        this.layer._control = this;
        OpenLayers.Control.DrawFeature.prototype.activate.apply(this,arguments);
    },

    /**
     * @name HSLayers.Control.DrawLine.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.DrawLine"

});

OpenLayers.Control.HSDrawLine = HSLayers.Control.DrawLine;

/**
 * Drawing point into the map. When the point is drawed, the function of
 * the handler "done" will be called.
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html">OpenLayers.Control.DrawFeature</a>
 *
 * @example
 *  var polygon = new HSLayers.Control.DrawPolygon(hsLayers.workLayer,{displayClass:"hsControlMeasureArea"});
 *  this.panel.addControls([polygon]);
 *  polygon.handler.mousedown = this.onMeasureLineMousedown;
 *  polygon.handler.mousemove = this.onMeasureLineMousemove;
 *  polygon.handler.callbacks["done"] = function(g){};
 *
 */

HSLayers.Control.DrawPolygon =
    OpenLayers.Class(OpenLayers.Control.DrawFeature, {

    /**
     * Used to set non-default properties on the control's handler
     * @name HSLayers.Control.DrawPolygon.polyOptions
     * @type {Object} 
     */
    polyOptions: null,

    /**
     * @constructor
     * @name HSLayers.Control.DrawPolygon
     */
    initialize: function(layer, options) {
      
        // concatenate events specific to vector with those from the base
        // this.EVENT_TYPES =
        //     OpenLayers.Control.DrawFeature.prototype.EVENT_TYPES.concat(
        //     OpenLayers.Control.prototype.EVENT_TYPES
        // );
        
        options = options || {};
        options.callbacks = OpenLayers.Util.extend({done: this.drawFeature}, this.callbacks);

        OpenLayers.Control.DrawFeature.prototype.initialize.apply(this, [layer, OpenLayers.Handler.Polygon ,options]);
    },

    activate: function() {
        this.layer._control = this;
        OpenLayers.Control.DrawFeature.prototype.activate.apply(this,arguments);
    },

    /**
     * @name HSLayers.Control.DrawPolygon.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.DrawPolygon"

});

OpenLayers.Control.HSDrawPolygon = HSLayers.Control.DrawPolygon;

/**
 * Drawing box into the map. When the point is drawed, the function of
 * the handler "done" will be called.
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html">OpenLayers.Control.DrawFeature</a>
 * 
 * @example
 *  var boxbutton = new HSLayers.Control.DrawBox({displayClass:"hsControlDrawBox"});
 *  app.panel.addControls([boxbutton]);
 *  boxbutton.handler.callbacks["done"] = function(g){console.log("#");};
 *
 */
HSLayers.Control.DrawBox = OpenLayers.Class(OpenLayers.Control, {

    /**
     * @constructor
     * @name HSLayers.Control.DrawBox
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        this.handler = new OpenLayers.Handler.Box(
            this, {done: this.onBoxDrawed}, {keyMask: this.keyMask} );
    },

    /**
     * @name HSLayers.Control.DrawPolygon.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.DrawBox"

});
OpenLayers.Control.HSDrawBox = HSLayers.Control.DrawBox;

HSLayers.Control.DrawPoint.prototype.drawFeature = HSLayers.Control.DrawLine.prototype.drawFeature = HSLayers.Control.DrawPolygon.prototype.drawFeature = OpenLayers.Control.DrawFeature.prototype.drawFeature;
