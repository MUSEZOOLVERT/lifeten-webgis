/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
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

HSLayers.namespace("HSLayers.Print");
 
/**
 * Form panel for input print parameters
 *
 * @class HSLayers.Print.PrintForm
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel">Ext.form.FormPanel</a>
 *
 * @constructor
 * @param {Object} config
 *    possible values (key / value pair):
 *      printTemplates - {Array of Array} - templates info
 *      buttonPrint - {Ext.Button} - Button which executes print
 * @example 
 *      var form = new HSLayers.Print.PrintForm({
 *          printTemplates: [
 *              ["basic.html", "pdf", "A4 portrait"]
 *          ],
 *          buttonPrint: new Ext.Button({ .. })
 *      });
 */
 
HSLayers.Print.PrintForm = function(config) { 
    HSLayers.Print.PrintDialog.superclass.constructor.call(this, config); 
    this._scaleSet = false;
};
  
Ext.extend(HSLayers.Print.PrintForm, Ext.form.FormPanel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Print.PrintForm._items
     * @type {Array}
     */
    _items: null,

    /**
     * @private
     * @name HSLayers.Print.PrintForm._paper
     * @type {OpenLayers.Feature.Vector}
     */
    _paper: null,

    /**
     * @private
     * @name HSLayers.Print.PrintForm._paperLayer
     * @type {OpenLayers.Layer.Vector}
     */
    _paperLayer: null,


    /**
     * @private
     * @name HSLayers.Print.PrintForm._imageBox
     * @type {OpenLayers.Bounds}
     */
    _imageBox: null,

    /**
     * @private
     * @name HSLayers.Print.PrintForm._imageScaleInput
     * @type {Ext.form.TextField}
     */

    _imageScaleInput: null,

    /**
     * @private
     * @name HSLayers.Print.PrintForm._paperScaleInput
     * @type {Ext.form.TextField}
     */
    _paperScaleInput: null,

    /**
     * @private
     * @name HSLayers.Print.PrintForm._drag
     * @type {OpenLayers.Control.Drag}
     */
    _drag: null,

    /**
     * @private
     * @name HSLayers.Print.PrintForm._scaleFactor
     * @type {Float}
     */
    _scaleFactor: 1.0,

    /**
     * @name HSLayers.Print.PrintForm.map
     * @type {OpenLayers.Map}
     */
    map: null,

    /**
     * @private
     * @name HSLayers.Print.PrintDialog._buttonPrint
     * @type {Ext.Button}
     */
    //_buttonPrint: this.buttonPrint,

    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm._createStoreTemplates
     */     
    _createStoreTemplates: function() {
        this._storeTemplate = new Ext.data.ArrayStore({
            fields: ["template", "output", "name","size"],
            data: this.printTemplates
        });
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm._getConfig
     */     
    _getConfig: function() {
        var config = {
            baseCls: "x-plain",
            hideLabels: true,
            frame:true,
            items: this._items
        };
        return config;
    },

    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm.destroy
     */     
    destroy: function() {
        if (this._drawAreaControl) {
            this.map.removeControl(this._drawAreaControl);
            this._drawAreaControl.deactivate();
            this._drawAreaControl.destroy();
        }
        if (this._paperLayer) {
            this.removePaper();
        }

        HSLayers.Print.PrintForm.superclass.destroy.apply(this, arguments);
    },
        
    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm._getDefaultTemplate
     */     
    _getDefaultTemplate: function() {
        var template = null;
        if (this._storeTemplate.getCount() > 0) {
            template = this._storeTemplate.getAt(0).get("template");
        }
        return template;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm._hasTemplates
     */     
    _hasTemplates: function() {
        return (this._storeTemplate.getCount() > 0);
    },

    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm._collapse
     */     
    _collapse: function(panel) {
        if (this.items.get(0).collapsed && this.items.get(1).collapsed) {
            this.buttonPrint.disable();
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm._changeType
     */     
    _changeType: function(panel) {
        if (!panel) {
            panel = this.items.get(0).collapsed ? this.items.get(1) : this.items.get(0);
        }

        if (this.buttonPrint.disabled) {
            this.buttonPrint.enable();
        }
    
        // print to image
        if ((panel == this.items.get(0) && this.items.get(0).collapsed) ||
            (panel == this.items.get(1) && !this.items.get(1).collapsed)) {
            this.items.get(1).expand();
            this.items.get(0).collapse();
            if (this._paperLayer) {
                this._paperLayer.removeFeatures(this._paperLayer.features);
                this._paperLayer.events.register("featureadded",this,this._onImageAreaDrawed);
            }

        } 
        // print to template
        else if ((panel == this.items.get(0) && !this.items.get(0).collapsed) ||
                 (panel == this.items.get(1) && this.items.get(1).collapsed)) {
            this.items.get(0).expand();
            this.items.get(1).collapse();

            if (this._drawAreaControl) {
                this._drawAreaControl.deactivate();
                this.map.removeControl(this._drawAreaControl);
                this._drawAreaControl.destroy();
                this._drawAreaControl = undefined;
            }
            if (this._paperLayer) {
                this._paperLayer.removeFeatures(this._paperLayer.features);
                this._paperLayer.events.unregister("featureadded",this,this._onImageAreaDrawed);
            }
            this.drawPaper(true);

        }

    },    

    
    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintForm._initChildComponents
     */     
    _initChildComponents: function() {
        this._changeTypeHandler = OpenLayers.Function.bind(
            this._changeType, this
        );    
        
        this._collapseHandler = OpenLayers.Function.bind(
            this._collapse, this
        );    
       
        this._createStoreTemplates();

	this._paperScaleInput = new Ext.form.TextField({
			xtype: "textfield",
			width: 65,
			name:"scale",
			enableKeyEvents: true,
			listeners: {keyup: this.drawPaper, scope:this,
				    specialkey: this.drawPaper}
		});
	this._imageScaleInput = new Ext.form.TextField({
                                xtype: "textfield",
                                width: 65,
                                name:"image_scale"
			});

    
        this._items = [{
            xtype: "fieldset",
            fieldLabel: "Label",
            title: OpenLayers.i18n("Print by template"),
            disabled: ! this._hasTemplates(),
            anchor: "100%",
            name: "printType",
            labelWidth: 75,
            collapsed: true,
            checkboxToggle: true,
            listeners: {
                    expand: this._changeTypeHandler,
                    collapse: this._collapseHandler
            },
            items: [
                    {
                        xtype: "combo",
                        anchor: "100%",
                        fieldLabel: OpenLayers.i18n("Template"),
                        forceSelection: true,
                        lazyInit: false,
                        name:"template",
                        mode: "local",
                        typeAhead: true,
                        triggerAction: "all",
                        store: this._storeTemplate,
                        valueField: "name",
                        displayField: "name",
                        value: this._storeTemplate.getAt(0).get("name")
                    }, {
                        xtype: "checkbox",
                        boxLabel: OpenLayers.i18n("Download as file"),
                        anchor: "100%"
                    },
                    {
                        xtype:"compositefield",
                        fieldLabel: OpenLayers.i18n("Scale")+" 1",
                        name:"scale",
                        items:[
                            this._paperScaleInput,
                            {
                                xtype: "button",
                                text: OpenLayers.i18n("Map scale"),
                                scope: this,
                                handler: this._onSetMapScaleClicked,
                                tooltip: OpenLayers.i18n("Set print scale to current map scale")
                            }
                        ]
                    },
                    {
                        xtype: "textarea",
                        name:"text",
                        fieldLabel: OpenLayers.i18n("Text"),
                        width: 220,
                        scope: this
                    }
                ]
        }, {
            xtype: "fieldset",
            anchor: "100%",
            title: OpenLayers.i18n("Print to image"),
            checked: true,
            checkboxToggle: true,
            fieldLabel: "Label",
            name: "printType",
            listeners: {
                    expand: this._changeTypeHandler,
                    collapse: this._collapseHandler
            },
            items: [
                    {
                        xtype: "combo",
                        anchor: "100%",
                        fieldLabel: OpenLayers.i18n("Image format"),
                        forceSelection: true,
                        lazyInit: false,
                        mode: "local",
                        name: "imgformat",
                        typeAhead: true,
                        triggerAction: "all",
                        store: new Ext.data.ArrayStore({
                            fields: ["type", "name"],
                            data: [["geotiff", "GeoTIFF"], ["png", "PNG"], ["jpeg", "JPEG"], ["gif", "GIF"]]
                        }),                
                        value: "png",
                        valueField: "type",
                        displayField: "name"
                    }, 
                    {
                        xtype: "checkbox",
                        name:"imgasfile",
                        fieldLabel: "",
                        boxLabel: OpenLayers.i18n("Download as file"),
                        anchor: "100%"
                    },
                    {
                        xtype:"compositefield",
                        fieldLabel: OpenLayers.i18n("Scale")+" 1",
                        name:"image_scale_composite",
                        items:[
                            this._imageScaleInput,
                            {
                                xtype: "button",
                                text: OpenLayers.i18n("Map scale"),
                                scope: this,
                                handler: this._onSetImageScaleClicked,
                                tooltip: OpenLayers.i18n("Set print scale to current map scale")
                            }
                        ]
                    },
                    {
                        xtype: "button",
                        text: OpenLayers.i18n("Draw area"),
                        scope: this,
                        handler: this._onDrawImageBoxClicked,
                        tooltip: OpenLayers.i18n("Specify print area. Whole map content is going to be printed, in case no area is drawn.")
                    }]
                }
            ];
    },
        
    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Print.PrintForm.getPrintOptions
     */     
    getPrintOptions: function() {
        var options = {
            output: "pdf",
            template: null,
            download: false
        };

        if (!this.items.get(0).collapsed) {

            var idx = this._storeTemplate.find("name",this.find("name","template")[0].getValue());
            var rec = this._storeTemplate.getAt(idx);
            options.output = rec.get("output");
            options.template = rec.get("template");
            options.download = rec.get("name");
            options.size = rec.get("size");
        }
        if (!this.items.get(1).collapsed) {
            options.output = this.find("name","imgformat")[0].getValue();
            options.download = this.find("name","imgasfile")[0].checked;
        }

        return options;
    },
    
    /**
     * @function
     * @name HSLayers.Print.PrintForm.initComponent
     */     
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();
         
        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.Print.PrintForm.superclass.initComponent.apply(this, arguments);

        // draw paper, when needed
        this.find("name","template")[0].on("select",this.drawPaper,this);
        this.find("name","template")[0].on("change",this.drawPaper,this);

        // set scale
        this.find("name","scale")[0].items.get(0).on("select",this.drawPaper,this);
        this.find("name","scale")[0].items.get(0).on("change",this.drawPaper,this);

        this._onSetImageScaleClicked();
    },



    /**
     * Draw paper on the map
     * @function
     * @param {Boolean} fit fit paper size to map frame
     * @name HSLayers.Print.PrintForm.drawPaper
     */
    drawPaper: function() {

        var idx = this._storeTemplate.find("name",this.find("name","template")[0].getValue());
        var rec = this._storeTemplate.getAt(idx);
        var size = [rec.get("size")[0],
                    rec.get("size")[1]];

        var fit = false;

        if (!this.find("name","scale")[0].items.get(0).getValue()) {
            // set the scale factor to the input field
            // but only once
            if (this._scaleSet === false) {
                this.find("name","scale")[0].items.get(0).setValue(Math.round(this.map.getScale()));
                this._scaleSet = true;
            }

            fit = true;
        }

        // scale
        var scale = this.find("name","scale")[0].items.get(0).getValue();

        if (!scale && this._paper) {
            //this._paperLayer.removeFeatures([this._paper]);
            return;
        }



        var getsize = function(rec, fit, scale) {

            var origVal = this.find("name","scale")[0].items.get(0).getValue();
            if (scale != origVal) {
                this.find("name","scale")[0].items.get(0).setValue(scale);
            }
            this._scaleFactor = scale/this.map.getScale();

            size = [rec.get("size")[0],
                        rec.get("size")[1]];

            size[0] = size[0]*this._scaleFactor/(96/OpenLayers.DOTS_PER_INCH); // 1.3333 72DPI->96DPI
            size[1] = size[1]*this._scaleFactor/(96/OpenLayers.DOTS_PER_INCH);

            if (fit && (size[0] > this.map.getSize().h ||
                        size[1] > this.map.getSize().w)) {
                            return getsize.apply(this,[rec, fit, scale/2]);
            }
            else {
                return size;
            }
        };

        size = getsize.apply(this,[rec, fit, scale]);

        this._getPaperLayer();

        // get Upper-Left corner of the maper
        var getUL = function(size,center,map) {

            var centerpx = map.getViewPortPxFromLonLat(center);
            return map.getLonLatFromViewPortPx(new OpenLayers.Pixel(centerpx.x - size[0]/2, centerpx.y - size[1]/2));
        };

        var ul_ll = getUL(size, this.map.getCenter(), this.map);

        // if paper exists, remove _paper, but set new upper_corner
        if  (this._paper && this._paper.geometry) {
            var centroid = this._paper.geometry.getCentroid();
            if (centroid) {
                ul_ll = getUL(size, new OpenLayers.LonLat(centroid.x, centroid.y), this.map);
                //this._paperLayer.removeFeatures([this._paper]);
            }
        }

        this._paperLayer.removeAllFeatures();

        this._paper = undefined;

        var ul_px = this.map.getViewPortPxFromLonLat(ul_ll); 
        var ul_pt = new OpenLayers.Geometry.Point(ul_ll.lon, ul_ll.lat);

        var ll_px = new OpenLayers.Pixel(ul_px.x, ul_px.y+size[1]);
        var ll_ll = this.map.getLonLatFromViewPortPx(ll_px);
        var ll_pt = new OpenLayers.Geometry.Point(ll_ll.lon, ll_ll.lat);

        var lr_px = new OpenLayers.Pixel(ll_px.x+size[0], ll_px.y);
        var lr_ll = this.map.getLonLatFromViewPortPx(lr_px);
        var lr_pt = new OpenLayers.Geometry.Point(lr_ll.lon, lr_ll.lat);

        var ur_px = new OpenLayers.Pixel(lr_px.x, lr_px.y-size[1]);
        var ur_ll = this.map.getLonLatFromViewPortPx(ur_px);
        var ur_pt = new OpenLayers.Geometry.Point(ur_ll.lon, ur_ll.lat);

        var pointList = [ul_pt, ll_pt, lr_pt, ur_pt, ul_pt];

        var linearRing = new OpenLayers.Geometry.LinearRing(pointList);
        this._paper = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Polygon([linearRing]));

        this._paperLayer.addFeatures([this._paper]);
        this._paperLayer.redraw();

    },

    /**
     * @function
     * @name HSLayers.Print.PrintForm.getScale
     */
    getScale: function() {
        var scale;

        //  take the scale either from Template or from Image fieldset
        if (this.items.get(0).checkbox.getValue()) {
            scale =  Math.round(this.find("name","scale")[0].items.get(0).getValue());
        }
        else {
            scale =  Math.round(this.find("name","image_scale_composite")[0].items.get(0).getValue());
        }
        if (scale) {
            return scale;
        }
        else {
            return this.map.getScale();
        }
    },

    /**
     * @function
     * @name HSLayers.Print.PrintForm.getText
     */
    getText: function() {
        return this.find("name","text")[0].getValue();
    },

    /**
     * @function
     * @name HSLayers.Print.PrintForm.getPaperBounds
     */
    getPaperBounds: function() {
        //if (this._paper && this._paper.geometry) {
        //    return this._paper.geometry.getBounds();
        //}
        if (this._paperLayer && this._paperLayer.features && this._paperLayer.features.length) {
            return this._paperLayer.getDataExtent();
        }
        else {
            return this.map.getExtent();
        }
    },
    
    /**
     * @function
     * @name HSLayers.Print.PrintForm.removePaper
     */
    removePaper: function() {
        if (this._drag) {
            this._drag.deactivate();
            this.map.removeControl(this._drag);
            this._drag.destroy();
            this._drag = undefined;
        }
        if (this._paperLayer) {
            this.map.removeLayer(this._paperLayer);
            this._paperLayer.destroy();
            this._paperLayer = undefined;
        }
        this._clearSavedSelectedFeatures();


    },

    setMap: function(map) {
        this.map = map;
        this._onSetImageScaleClicked();
        this._onSetMapScaleClicked();
    },

    /**
     * @private
     */
    _onSetMapScaleClicked: function(){
        if (this.map && this.items.get(0).checkbox && this.items.get(0).checkbox.getValue() == "on") {
            this._paperScaleInput.setValue(Math.round(this.map.getScale()));
            this.drawPaper();
        }
    },

    /**
     * @private
     */
    _onSetImageScaleClicked: function(){
        if (this.map && this.items.get(1).checkbox && this.items.get(1).checkbox.getValue() == "on") {

	        if (this.map) {
		    this._imageScaleInput.setValue(Math.round(this.map.getScale()));
	        }
	}
    },

    /**
     * @private
     * @function
     */
    _getPaperLayer: function() {
        if (!this._paperLayer) {
            this._paperLayer = new OpenLayers.Layer.Vector("Printing paper layer",
                    {displayInLayerSwitcher: false, visibility:true, removable: true });
        }
        if (!this._paperLayer.map) {
            this.map.addLayer(this._paperLayer);
        }
        if (!this._drag) {
            this._drag = new OpenLayers.Control.DragFeature(this._paperLayer);
        }
        if (!this._drag.map) {
            this.map.addControl(this._drag);
            this._drag.activate();
        }

        return this._paperLayer;
    },

    /**
     * draw box for the image output
     * @private
     * @function
     */
    _onDrawImageBoxClicked: function() {

        if (!this._drawAreaControl) {
            this._drawAreaControl = new OpenLayers.Control.DrawFeature(this._getPaperLayer(),
                                                OpenLayers.Handler.Polygon);
            this.map.addControl(this._drawAreaControl);
            this._drawAreaControl.activate();
            this._paperLayer.events.register("featureadded",this,this._onImageAreaDrawed);
        }

        this._drag.deactivate();
        this._drag.activate();
        this._paperLayer.removeFeatures(this._paperLayer.features);

    },

    /**
     * draw box for the image output
     * @private
     * @function
     */
    _onImageAreaDrawed: function(evt) {

        this._paperLayer.events.unregister("featureadded",this,this._onImageAreaDrawed);
        var imageArea = evt.feature;
        var bounds = this._paperLayer.getDataExtent();
        this._paperLayer.removeFeatures(this._paperLayer.features);
        this._paperLayer.addFeatures([
            new OpenLayers.Feature.Vector(bounds.toGeometry())
        ]);
        this._paperLayer.events.register("featureadded",this,this._onImageAreaDrawed);

    },

    /**
     * Save selected featuers from other vector layers
     * HACK HACK HACK
     * @private
     * @function
     */
    _saveSelectedFeatures: function() {
        for (var i = 0, len = this.map.layers.length; i < len; i++) {
            var layer = this.map.layers[i];
            if (layer instanceof OpenLayers.Layer.Vector &&
                layer.selectedFeatures &&
                layer.selectedFeatures.length > 0) {
                layer._selectedFeaturesToBePrinted = [];
                for (var j = 0; j < layer.selectedFeatures.length; j++) {
                    layer._selectedFeaturesToBePrinted.push(layer.selectedFeatures[j]);
                }
            }
        }
    },

    /**
     * Clear saved selected features
     * HACK HACK HACK
     * @private
     * @function
     */
    _clearSavedSelectedFeatures: function() {
        for (var i = 0, len = this.map.layers.length; i < len; i++) {
            var layer = this.map.layers[i];
            if (layer instanceof OpenLayers.Layer.Vector &&
                layer._selectedFeaturesToBePrinted) {
                layer._selectedFeaturesToBePrinted = undefined;
            }
        }
    },

    CLASS_NAME: "HSLayers.Print.PrintForm"
});
