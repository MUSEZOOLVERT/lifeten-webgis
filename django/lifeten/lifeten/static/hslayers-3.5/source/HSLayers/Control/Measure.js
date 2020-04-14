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
 * Measure lenght and areas
 * @augments OpenLayers.Control
 *
 * @example
 *  var measure = new HSLayers.Control.Measure({layer:this.hsLayers.workLayer});
 *  map.addControl(this.measure);
 *  mapToolBar.addControls([measure.distance, measure.area]);

 */
HSLayers.Control.Measure = OpenLayers.Class(OpenLayers.Control, {                

    /**
     * @name HSLayers.Control.Measure.layer
     * @type OpenLayers.Layer.Vector
     */
    layer: null,

    /**
     * @name HSLayers.Control.Measure.panel
     * @type Ext.Window
     */
    panel: null,

    /**
     * @name HSLayers.Control.Measure.area
     * @type OpenLayers.Control.DrawFeature
     */
    area: null,

    /**
     * @name HSLayers.Control.Measure.distance
     * @type OpenLayers.Control.DrawFeature
     */
    distance: null,

    /**
     * @name HSLayers.Control.Measure.path
     * @type OpenLayers.Feature.Path
     */
    path: null,

    /**
     * @name HSLayers.Control.Measure.polygon
     * @type OpenLayers.Feature.Polygon
     */
    polygon: null,

    /**
     * css class style name
     * @name HSLayers.Control.Measure.distanceDisplayClass
     * @type String
     */
    distanceDisplayClass: "hsControlMeasureLine",

    /**
     * css class style name
     * @name HSLayers.Control.Measure.areaDisplayClass
     * @type String
     */
    areaDisplayClass: "hsControlMeasureArea",

    /**
     * css class style name
     * @name HSLayers.Control.Measure.style
     * @type Object
     * @default OpenLayers.Feature.Vector.style.temporary
     */
    style: OpenLayers.Feature.Vector.style.temporary,

    /**
     * event listeners for activate and deactivate events
     * @name HSLayers.Control.Measure.eventListeners
     * @type Object
     */
    eventListeners: {
        'activate': function(){
            //this.panel.show();
            this.layer.setVisibility(true);
            this.layer.destroyFeatures();
            this.map.setLayerZIndex(this.layer,this.map.layers.length+1);
            this.map.events.register("mousemove",this,this.renderLineAreaSize);
            this.isArea = (this.CLASS_NAME.search("Polygon") > -1 ? true : false);

            if (!this.keyboardHandler) {
                this.keyboardHandler = new OpenLayers.Handler.Keyboard(this,
                {"keydown": HSLayers.Control.Measure.prototype.keyPressed,
                "keyup":    HSLayers.Control.Measure.prototype.keyReleased});
            }
            this.keyboardHandler.activate();
        },
        'deactivate': function(){
            if (this.panel instanceof HSLayers.InfoPanel) {
                this.panel.clear();
            }
            else if (this.panel instanceof Ext.Window) {
                this.panel.hide();
            }
            else if (this.panel instanceof Ext.Panel) {
                this.panel.body.update("");
                this.panel.doLayout();
            }
            this.layer.destroyFeatures();
            this.map.events.unregister("mousemove",this,this.renderLineAreaSize);

            this.keyboardHandler.deactivate();
        }
    },

    /**
     * Create an OpenLayers Control.  The options passed as a parameter
     * directly extend the control.  For example passing the following:
     * @constructor
     * @name HSLayers.Control.Measure
     * @param {Object} options
     */
    initialize: function (options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        if (!options.renderTo) {
            var panelOptions = {
                        bbar        : [ {scope: this, handler: this.onClearClicked, text: OpenLayers.i18n("Clear"),
                                            icon: OpenLayers.Util.getImagesLocation()+'/empty.gif',
                                            cls: 'x-btn-text-icon'
                                        } ],
                        title       : OpenLayers.i18n("Distance and Area"),
                        layout      : 'fit',
                        width       : 300,
                        height      : 200,
                        closable    : false,
                        plain       : true,
                        layout      : "anchor"
                };

                this.panel = new Ext.Window(panelOptions);
                options.renderTo = this.panel;
        }
        
        // panel
        this.distance = new HSLayers.Control.DrawLine(this.layer, {
                            eventListeners: this.eventListeners,
                            displayClass: this.distanceDisplayClass,
                            panel: options.renderTo,
                            renderLineAreaSize: this.renderLineAreaSize
                            });

        this.area = new HSLayers.Control.DrawPolygon(this.layer, {
                            eventListeners: this.eventListeners,
                            displayClass: this.areaDisplayClass,
                            panel: options.renderTo,
                            handlerOptions: options.handlerOptions,
                            renderLineAreaSize: this.renderLineAreaSize
                            });
        this.layer.style = this.style;
        this.distance.handler.style = this.area.handler.style = this.style;
        
    },

    /**
     * Layout the size in nice format
     * @name HSLayers.Control.Measure.* 
     * @param {Event} event  mousemove
     * @function
     */
    renderLineAreaSize : function(e) {

        if (this.handler.line === null) {
            return;
        }

        var i;

        //if (this.layer.features.length > 0) {
        //      this.layer.removeFeatures(this.layer.features.slice(this.layer.features.length-1));
        //}

        //if (this.panel.CLASS_NAME && this.panel.CLASS_NAME == "HSLayers.InfoPanel") {
        //    this.panel.clear();
        //}
        //else {
        //    this.panel.body.update();
        //}
        //this.viewer.tabsPanel.activate(this.viewer.infoTab);
        //this.viewer.clearInfoTab();

        var length = this.handler.line.geometry.getLength();

        var isIN = function(child,par) {
            for (var i = 0; i < par.components.length; i++) {
                if (child == par.components[i]) {
                    return true;
                }
            }
            return false;
        };

        var ring = false;
        for (i = 0; i < this.layer.features.length; i++) {
            if (isIN(this.handler.line.geometry,this.layer.features[i].geometry)) {
                ring = true;
            }
        }

        var area = 0;
        if (ring === false) {
            area = Math.abs(this.handler.line.geometry.getArea());
        }


        for (i = 0; i < this.layer.features.length; i++) {
            length += this.layer.features[i].geometry.getLength();
            area += Math.abs(this.layer.features[i].geometry.getArea());
        }
        

        var lstr;
        // total
        if (length > 100000) {
            lstr = Math.round(length/1000) + " km";
        }
        else if (length > 1000) {
            lstr = Math.round(length)/1000 + " km";
        }
        else {
            lstr =  Math.round(length*100)/100+" m";
        }

        // last line
        length = this.handler.line.geometry.getLength();
        // take last line/polygon, if line is 0
        var takeLast = false;
        if (length == 0) {
            takeLast = true;
        }
        if (takeLast) {
            length = this.layer.features[this.layer.features.length-1].geometry.getLength();
        }
        var lastLstr;
        if (length > 100000) {
            lastLstr = Math.round(length/1000) + " km";
        }
        else if (length > 1000) {
            lastLstr = Math.round(length)/1000 + " km";
        }
        else {
            lastLstr =  Math.round(length*100)/100+" m";
        }

        // total area
        var astr;
        if (area > 100000000) {
            astr = Math.round(area/100000)/10 + " km<sup>2</sup>";
        }
        else if (area > 100000) {
        //else if (area > 1000000) {
            astr = Math.round(area/1000)/1000 + " km<sup>2</sup>";
        }
        //else if (area > 10000) {
        //    astr = Math.round(area/10)/1000  + " ha";
        //}
        else {
            astr =  Math.round(area*100)/100+" m<sup>2</sup>";
        }
        
        // last segment
        if (this.handler.line.geometry.components.length < 2) {
            return;
        }
        var ncomp = this.handler.line.geometry.components.length;
        var x = Math.abs(this.handler.line.geometry.components[ncomp-1].x - this.handler.line.geometry.components[ncomp-2].x);
        var y = Math.abs(this.handler.line.geometry.components[ncomp-1].y - this.handler.line.geometry.components[ncomp-2].y);
        length = Math.sqrt(x*x+y*y);

        var lastSstr;
        if (length > 100000) {
            lastSstr = Math.round(length/1000) + " km";
        }
        else if (length > 1000) {
            lastSstr = Math.round(length)/1000 + " km";
        }
        else {
            lastSstr =  Math.round(length*100)/100+" m";
        }

        // last area
        if (ring) {
            area = Math.abs(this.handler.line.geometry.parent.getArea());
        }
        else {
            area = Math.abs(this.handler.line.geometry.getArea());
        }
        if (takeLast) {
            area = this.layer.features[this.layer.features.length-1].geometry.getArea();
        }

        var lastr;
        if (area > 100000000) {
            lastr = Math.round(area/100000)/10 + " km<sup>2</sup>";
        }
        else if (area > 100000) {
            lastr = Math.round(area/1000)/1000 + " km<sup>2</sup>";
        }
        //else if (area > 10000) {
        //    lastr = Math.round(area/10)/1000  + " ha";
        //}
        else {
            lastr =  Math.round(area*100)/100+" m<sup>2</sup>";
        }
        
        var str = "";
        
        if (this.isArea) {
            str = "<table class='x-grid3-row-table' style='width: 100%'><thead><tr class='x-grid3-header'>";
            str += "<td width='50%'><div class='x-grid3-hd-inner x-grid3-hd-company'>"+OpenLayers.i18n('Total perimeter')+"</div></td>";
            str += "<td width='50%'><div class='x-grid3-hd-inner x-grid3-hd-company'>"+OpenLayers.i18n('Total area')+"</div></td></tr></thead>";
            str += "<tbody><tr><td>"+lstr+"</td><td>"+astr+"</td></tr></tbody></table>";
            str += "<table class='x-grid3-row-table' style='width: 100%'><thead><tr class='x-grid3-header'>";
            str += "<td width='50%'><div class='x-grid3-hd-inner x-grid3-hd-company'>"+OpenLayers.i18n('Last polygon perimeter')+"</div></td>";
            str += "<td width='50%'><div class='x-grid3-hd-inner x-grid3-hd-company'>"+OpenLayers.i18n('Last polygon area')+"</div></td></tr></thead>";
            str += "<tbody><tr><td>"+lastLstr+"</td><td>"+lastr+"</td></tr></tbody></table>";
        }
        else {
            str = "<table class='x-grid3-row-table' style='width: 100%'><thead><tr class='x-grid3-header'><td>";
            str += "<div class='x-grid3-hd-inner x-grid3-hd-company'>"+OpenLayers.i18n('Total distance')+"</div></td><td>";
            str += "<div class='x-grid3-hd-inner x-grid3-hd-company'>"+OpenLayers.i18n('Last line')+"</div></td><td>";
            str += "<div class='x-grid3-hd-inner x-grid3-hd-company'>"+OpenLayers.i18n('Last segment')+"</td></tr></thead>";
            str += "<tbody><tr><td>"+lstr+"</td><td>"+lastLstr+"</td><td>"+lastSstr+"</td></tr></tbody></table>";
        }
        if (str) {
            this.panel.body.update(str);
        }
        
    },

    /**
     * handler for the click event
     * @name HSLayers.Control.Measure.onClearClicked
     * @function
     * @oaram {Event} e
     */
    onClearClicked: function(e) {
        
        // remove features
        this.layer.destroyFeatures();
        this.panel.body.update();
    },

     /**
      * some key pressed
      * @name HSLayers.Control.Measure.keyPressed
      * @function
      * @param {Event} evt
      */
     keyPressed : function(evt) {
         switch(evt.keyCode) {
             // SHIFT
             case 16:
                 this.navigationModifierPressed = true;
                 HSLayers.Control.Measure.prototype.toggleNavigate.apply(this,[true]);
                 break;
         }
     },

     /**
      * some key released
      * @name HSLayers.Control.Measure.keyReleased
      * @function
      * @param {Event} evt
      */
     keyReleased : function(evt) {
         switch(evt.keyCode) {
             // SHIFT
             case 16:
                 HSLayers.Control.Measure.prototype.toggleNavigate.apply(this,[false]);
                 this.navigationModifierPressed = false;
                 break;
         };
     },
 
     /**
      * Turn navigation control on or off
      * @name HSLayers.Control.Measure.toggleNavigate
      * @param {Boolean} activate
      * @function
      */
     toggleNavigate: function(activate) {
        for (var j = 0; j < this.map.controls.length; j++) {
            if (this.map.controls[j].CLASS_NAME == "OpenLayers.Control.Navigation") {
                if (activate) {
                    this.map.controls[j].activate();
                }
                else {
                    this.map.controls[j].deactivate();
                }
            }
        }
     },

    /**
     * @name HSLayers.Control.Measure.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.Measure"
});

OpenLayers.Control.HSMeasure = HSLayers.Control.Measure;

