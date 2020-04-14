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
Ext.namespace("HSLayers.Print.Printer");

/**
 * Printing manager. User can define the paper on the map, scale, title,
 * text and custom which will be layuoted to PDF.
 *
 * @class HSLayers.Printer
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel">Ext.form.FormPanel</a>
 *
 * @constructor
 * @param {Object} config
 * @param {String[]} [config.scales = map.scales] array of user defined
 * for printing 
 */
HSLayers.Printer= function(config) {

    // depandances
    if (!config) {
        config = {};
    }

    // scales
    if  (config.scales) {
        this.scales = config.scales;
    }
    config.frame = true;

    /* Title */
    this.titleField = new Ext.form.TextField({
            fieldLabel: OpenLayers.i18n("Map title")
            });

    /* Paper */
    this.paperCombo = new Ext.form.ComboBox({
                fieldLabel: OpenLayers.i18n("Paper format"),
                displayField:'name',
                value :"a4",
                triggerAction: 'all',
                mode:"local",
                width: 50,
                store: this.papers
            });
    this.paperCombo.on("change",this.drawPaper,this);
    this.paperCombo.on("select",this.drawPaper,this);

    this.scalesStore = new Ext.data.SimpleStore({
            fields: [ {name: 'scale', type: 'string'}]
    });

    this.scalesCombo = new Ext.form.ComboBox({
                fieldLabel: OpenLayers.i18n("Map scale 1"),
                displayField:'scale',
                triggerAction: 'all',
                mode:"local",
                width: 100,
                store: this.scalesStore
            });

    this.scalesCombo.on("change",this.drawPaper,this);
    this.scalesCombo.on("select",this.drawPaper,this);

    /* landscape */
    this.landscapeButton = new Ext.Button({
            icon: OpenLayers.Util.getImagesLocation()+"/landscape.png",
            style: {paddingLeft:"5px",paddingRight:"5px"},
            text:  OpenLayers.i18n('Landscape'),
            cls:"x-btn-text-icon",
            enableToggle :true,
            thisPrinter: this,
            tooltipType: 'title',
            scope:this,
            handler: function(){
                            var value = this.landscapeCheck.getValue();
                            this.landscapeCheck.setValue(value == 'landscape' ? 'portrait' : 'landscape');
                            this.landscapeButton.setText((value == 'landscape' ? OpenLayers.i18n('Portrait') : OpenLayers.i18n('Landscape')));
                            value = this.landscapeCheck.getValue();
                            this.landscapeButton.el.child("td.x-btn-mc " + this.landscapeButton.buttonSelector).dom.style.backgroundImage= 'url('+OpenLayers.Util.getImagesLocation()+"/"+value+".png"+")";
                            this.drawPaper();
                        }
            });

    this.landscapePanel = new Ext.Panel({
            layout:'form',
            style: {paddingTop:"5px",paddingBottom:"5px",border:"0px"},
            layoutConfig: {
                columns: 3
            },
items:[{html: "<label class=\"x-form-item x-form-item-label\" style=\"border:0px\">"+OpenLayers.i18n('Paper orientation:')+"</label>"}, 
                    this.landscapeButton ]
            });

    this.landscapeCheck = new Ext.form.Hidden({
                value: 'landscape'
            });

    /* text */
    this.textArea = new Ext.form.TextArea({
                fieldLabel: OpenLayers.i18n("Aditional text"),
                height: 175,
                width: 175
            });

    this.renderMapButton = new Ext.Button({text:OpenLayers.i18n("Print"),
                    icon: OpenLayers.Util.getImagesLocation()+'/printer.png',
                    cls: 'x-btn-text-icon',
                    thisPrinter: this,
                    scope: this,
                    handler: this.onRenderMapClicked
            });

    config.fileUpload = true;
    config.items = [this.titleField,
                        this.paperCombo,
                        this.landscapeCheck,
                        this.landscapeButton,
                        this.scalesCombo,
                        this.textArea
                        ];
    config.bbar =  [this.renderMapButton];

    // call parent constructor
    HSLayers.Printer.superclass.constructor.call(this, config);

    if (config.map) {
        this.setMap(config.map);
    }

    this.on("activate",this.onFocus,this);
    this.on("deactivate",this.onUnfocus,this);

};

Ext.extend(HSLayers.Printer, Ext.form.FormPanel, {

    /**
     * print bounding box
     * @name HSLayers.Printer.box
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/BaseTypes/Bounds-js.html">OpenLayers.Bounds</a>
     */
    box : null,

    /**
     * printer title
     * @name HSLayers.Printer.title
     * @type String
     */
    title : OpenLayers.i18n("Print"),

    /**
     * print bounding box
     * @name HSLayers.Printer.box
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Marker/Box-js.html">OpenLayers.Marker.Box</a>
     */
    paperBox : null,

    /**
     * Scales for the printing map
     * @name HSLayers.Printer.scales
     * @type Array
     */
    scales: [],

    /**
     * paper margins
     * @name HSLayers.Printer.margins in [mm]
     * @type Array
     */
    margins: new OpenLayers.Size(25,25),

    /**
     * List of available paper formats
     * The size is in form [width,height] in "pt" units. Since we print 1:1
     * to screen resolution, pt==px in this case. Papers do have 2.5cm
     * margins (for title, scale)
     * @name HSLayers.Printer.papers
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.data.SimpleStore">Ext.data.SimpleStore</a>
     */
    papers: new Ext.data.SimpleStore({
                fields: [ {name: 'name', type: 'string'},
                          {name: 'size', type: 'string'}],
                data : [
                            ["a5",[148 , 210]],
                            ["a4",[210 , 297]],
                            ["a3",[297 , 420]],
                            ["a2",[420 , 594]],
                            ["a1",[594 , 841]],
                            ["a0",[841 , 1189]]
                        ]
    }),

    /**
     * Combo box for paper format selection
     * @name HSLayers.Printer.paperCombo
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.ComboBox">Ext.form.ComboBox</a>
     */
    paperCombo: null,

    /**
     * Checkbox for indication of landscape paper
     * @name HSLayers.Printer.landscapeCheck
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Checkbox">Ext.form.Checkbox</a>
     */
    landscapeCheck: null,

    /**
     * Field for map title
     * @name HSLayers.Printer.titleField
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.TextField">Ext.form.TextField</a>
     */
    titleField: null,

    /**
     * Field for aditional map text
     * @name HSLayers.Printer.textArea
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.TextArea">Ext.form.TextArea</a>
     */
    textArea: null,

    /**
     * Field for setuping scale
     * @name HSLayers.Printer.scalesCombo
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Combobox">Ext.form.Combobox</a>
     */
    scalesCombo: null,

    /**
     * Layer where to draw the paper 
     * @name HSLayers.Printer.paperLayer
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/Boxes-js.html">OpenLayers.Layer.Boxes</a>
     */
    paperLayer: null,

    /**
     * The map  object
     * use the {setMap} method for setting this attribute
     * @name HSLayers.Printer.map
     * @property {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    map: null,

    /**
     * Setup the printing form, so it coresponds with the map state, draw
     * the paper box to the map
     * @function
     * @name HSLayers.Printer.onFocus
     * @param Event e
     */
    onFocus: function(e) {
        if (this.paperLayer) {
            this.onUnfocus();
        }
        this.scalesCombo.setValue(Math.round(this.map.getScale()));
        // paper format and size
        this.paperLayer = new OpenLayers.Layer.Boxes("Paper",
                                        {displayInLayerSwitcher:false,
                                         displayOutsideMaxExtent:true}); 
        this.map.addLayer(this.paperLayer);
        this.map.setLayerIndex(this.paperLayer,0);

        // set proper paper size
        var paper = this.getPaperSize();
        var map = this.map.getSize();

        var scaleFactor = this.scalesCombo.getValue()/this.map.getScale();

        var getNextScale = function(scale) {
            var store = this.scalesCombo.store;
            var nextScale = null;
            for (var i = 0; i < store.data.items.length; i++) {
                if (store.data.items[i].data['scale'] == scale) {
                    try {
                        nextScale = store.data.items[i+1].data['scale'];
                    }
                    catch(e) {}
                    break;
                }
            }

            return (nextScale ? nextScale : scale);

        };

        paper.w *= scaleFactor;
        paper.h *= scaleFactor;
        while (paper.w > map.w || paper.h > map.h) {
            var oldScale = this.scalesCombo.getValue();
            var newScale = getNextScale.apply(this,[oldScale]);
            this.scalesCombo.setValue(newScale);
            scaleFactor = this.scalesCombo.getValue()/this.map.getScale();
            paper.w *= scaleFactor;
            paper.h *= scaleFactor;


            if (newScale == oldScale) {
                break;
            }
        }
        // draw paper
        this.drawPaper();

        // FIXME hodnot top je nejaka divna, ale jinak to vypada, ze to
        //celkem chodi
        //
        var nlayers = this.map.layers.length;
        this.map.setLayerIndex(this.paperLayer,nlayers);

    },

    /**
     * Stop the mousedown event, when clicked on the paper box - means, we
     * will move only the paper, but not whole map
     * @function
     * @name HSLayers.Printer.onBoxMouseDown
     * @param Event e
     * @private
     */
    onBoxMouseDown: function (e) {
        this.dragstarted = true;
        this.startPoint = [e.clientX,e.clientY];
        OpenLayers.Event.stop(e, true);
    },
      
    /**
     * Move the paper box on the map
     * @function
     * @name HSLayers.Printere.onBoxMouseMove
     * @param Event e
     */
    onBoxMouseMove: function (e) {
        if (this.dragstarted) {
            var diffX = e.clientX-this.startPoint[0];
            var diffY = e.clientY-this.startPoint[1];
            this.bounds = new OpenLayers.Bounds(
                    this.bounds.left+this.map.getResolution()*diffX,
                    this.bounds.bottom-this.map.getResolution()*diffY,
                    this.bounds.right+this.map.getResolution()*diffX,
                    this.bounds.top-this.map.getResolution()*diffY);
            this.startPoint[0] += diffX;
            this.startPoint[1] += diffY;
            this.printer.paperLayer.redraw();
        }
        OpenLayers.Event.stop(e, true);
    },

    /**
     * Stop the mouseup event, when clicked on the paper box
     * @function
     * @name HSLayers.Printer.onBoxMouseUp
     * @param Event e
     * @private
     */
    onBoxMouseUp: function (e) {
        this.dragstarted = false;
        OpenLayers.Event.stop(e, true);
    },

    /**
     * Return the paper size object 
     * @function
     * @name HSLayers.Printer.getPaperSize
     * @param {String} paper "a4" for example
     * @return {@link <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Size-js.html">OpenLayers.Size</a>}
     */
    getPaperSize: function(paper) {
        if (!paper) {
            var paper = this.paperCombo.getValue();
        }
        var sizeRecordIdx = this.papers.find("name",paper);
        var paperRecord = this.papers.getAt(sizeRecordIdx);
        var paperSize = paperRecord.get("size");
        paperSize = paperSize.split(",");
        if (this.landscapeCheck.getValue() == 'landscape') {
            paperSize = new OpenLayers.Size(paperSize[1],paperSize[0]);
        }
        else {
            paperSize = new OpenLayers.Size(paperSize[0],paperSize[1]);
        }

        // margins
        paperSize.w = paperSize.w - 2*this.margins.w;
        paperSize.h = paperSize.h - 2*this.margins.h;

        // mm -> px
        paperSize.w = paperSize.w*OpenLayers.DOTS_PER_INCH*OpenLayers.INCHES_PER_UNIT.mm;
        paperSize.h = paperSize.h*OpenLayers.DOTS_PER_INCH*OpenLayers.INCHES_PER_UNIT.mm;
        return paperSize;
    },

    /**
     * Draw the paper to the map
     * @function
     * @name HSLayers.Printer.drawPaper
     */
    drawPaper: function(g) {

        if (this.paperBox) {
            this.unRegisterBoxEvents();
            this.paperLayer.removeMarker(this.paperBox);
            this.paperLayer.redraw();
        }
        var scaleFactor = this.scalesCombo.getValue()/this.map.getScale();
        this.paperSize = this.getPaperSize();
        this.paperSize.w *= scaleFactor;
        this.paperSize.h *= scaleFactor;

        // draw the paper box
        var mapSize = this.map.getSize();

        // if box is drawed by the user
        if (this.box) {
            var boxSize = this.box.getSize();
            mapSize = new OpenLayers.Size(Math.round(boxSize.w/this.map.getResolution()),
                                          Math.round(boxSize.h)/this.map.getResolution());
        };

        // pixels
        if (this.box) {
            var paperCorner = new OpenLayers.LonLat(this.box.left,this.box.top);
            var paperCornerVieport = this.map.getViewPortPxFromLonLat(paperCorner);
            var left = Math.round( paperCornerVieport.x + (mapSize.w-this.paperSize.w)/2 );
            var topp = Math.round( paperCornerVieport.y + (mapSize.h-this.paperSize.h)/2 );
        }
        else {
            var left =  (mapSize.w-this.paperSize.w)/2;
            var topp =  (mapSize.h-this.paperSize.h)/2;
        }
        var right = Math.round(left+this.paperSize.w);
        var bottom = Math.round(topp+this.paperSize.h);

        // paper pixles
        var lb = new OpenLayers.Pixel(left,bottom);
        var rt = new OpenLayers.Pixel(right,topp);

        // geo lonlat
        lb = this.map.getLonLatFromPixel(lb);
        rt = this.map.getLonLatFromPixel(rt);

        // paper box
        var bounds = new OpenLayers.Bounds(lb.lon, lb.lat, rt.lon, rt.lat);
        this.paperBox = new OpenLayers.Marker.Box(bounds,"black");
        OpenLayers.Util.modifyDOMElement(this.paperBox.div,null,null,null,null,
                                         null,null,0.5);
        this.paperBox.div.style.background = "white";
        this.paperBox.printer = this;

        this.paperLayer.addMarker(this.paperBox);

        this.registerBoxEvents();
    },

    /**
     * Register box events
     * @function
     * @name HSLayers.Printer.registerBoxEvents
     * @private
     */
    registerBoxEvents: function() {
        this.paperBox.events.register("mousedown", this.paperBox, this.onBoxMouseDown);
        this.paperBox.events.register("mousemove", this.paperBox, this.onBoxMouseMove);
        this.paperBox.events.register("mouseup",   this.paperBox, this.onBoxMouseUp);
    },

    /**
     * Unregister box events
     * @function
     * @name HSLayers.Printer.unRegisterBoxEvents
     * @private
     */
    unRegisterBoxEvents: function() {
        try {
            this.paperBox.events.unregister("mousedown", this.paperBox, this.onBoxMouseDown);
            this.paperBox.events.unregister("mousemove", this.paperBox, this.onBoxMouseMove);
            this.paperBox.events.unregister("mouseup",   this.paperBox, this.onBoxMouseUp);
        } catch(e){}
    },

    /**
     * Delete the paper box
     * @function
     * @name HSLayers.Printer.onUnfocus
     * @param Event e
     */
    onUnfocus: function(e) {
        this.map.removeLayer(this.paperLayer);
        this.paperLayer.destroy();
        this.paperLayer = null;
    },


    /**
     * DefineBox button clicked
     * @function
     * @name HSLayers.Printer.onDefineBoxClicked
     */
    onDefineBoxClicked : function() {
        try {
            this.thisPrinter.onClearBoxClicked();
        }catch(e) {}
        this.thisPrinter.unRegisterBoxEvents();
        this.thisPrinter.boxprint = new OpenLayers.Control.HSDrawBox({displayClass:"hsControlDrawBox"});
        this.thisPrinter.map.addControl(this.thisPrinter.boxprint);
        this.thisPrinter.boxprint.handler.callbacks["done"] = this.thisPrinter.onBoxDrawed;
        this.thisPrinter.boxprint.printer = this.thisPrinter;
        this.thisPrinter.boxprint.activate();
    },

    /**
     * Draw the paper the the map
     * @function
     * @name HSLayers.Printer.onBoxDrawed
     * @param {@link <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Bounds-js.html">OpenLayers.Bounds</a>} g
     */
    onBoxDrawed: function(g){
        
        var br = this.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(g.left,g.bottom));
        var ul = this.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(g.right,g.top));
        var printbox = new OpenLayers.Bounds(br.lon,br.lat,ul.lon,ul.lat);
        var vbox = new OpenLayers.Feature.Vector(printbox.toGeometry());

        this.printer.printerLayer = new OpenLayers.Layer.Vector("Box",{displayInLayerSwitcher:false});
        this.map.addLayer(this.printer.printerLayer);

        this.printer.printerLayer.addFeatures(vbox);

        this.printer.box = printbox;
        this.map.removeControl(this.printer.boxprint);
        this.printer.boxprint.destroy();
        this.printer.boxprint = null;
        this.printer.unRegisterBoxEvents();
        this.printer.drawPaper(g);
    },

    /**
     * Clear the map from paper box
     * @name HSLayers.Printer.onClearBoxClicked 
     */
    onClearBoxClicked : function() {
        var printer = this;
        if (this.thisPrinter) {
            printer = this.thisPrinter;
        }
        if (printer.printerLayer) {
            printer.map.removeLayer(printer.printerLayer);
            printer.printerLayer.destroy();
            printer.printerLayer = null;
            printer.box = null;
        }
    },

    onRenderMapClicked : function() {

        this.makePDF();
    },

    /**
     * Make JSON object and request the PDF file
     * @function
     * @name HSLayers.PrintermakePDF
     */
    makePDF: function() {
        var map = this.map;

        // create the input JSON object
        var box = (this.box ? this.box : this.paperBox.bounds);

        // store temporary layer buffers
        var layerAttrs = [];
        // rescale
        var paperSize = this.getPaperSize();
        var ratio = Math.ceil(Math.max(paperSize.w/map.size.w > paperSize.w/map.size.w ? paperSize.w/map.size.w : paperSize.h/map.size.h))*2;
        for (var i = 0; i < this.map.layers.length; i++) {

            layerAttrs.push([this.map.layers[i].buffer,
                            this.map.layers[i].singleTile]);
            this.map.layers[i].buffer = ratio;
            if (this.map.layers[i].singleTile) {
                this.map.layers[i].singleTile = false;
            }
            this.map.layers[i].setTileSize();
        }
        
        // zoom to the box
        var currentBBox = this.map.getExtent();
        var mask = new Ext.LoadMask(this.map.div,{"msg":OpenLayers.i18n("Configuring layers for printing")});
        mask.enable();
        var center = new OpenLayers.LonLat(box.left+(box.right-box.left)/2,box.bottom+(box.top-box.bottom)/2)
        if (this.map.getZoom()+1 > this.map.baseLayer.resolutions.length) {
            this.map.zoomTo(this.map.getZoom()-1);
        }
        else {
            this.map.zoomTo(this.map.getZoom()+1);
        }
        this.map.setCenter(center);
        this.map.zoomToScale(this.scalesCombo.getValue(),true);

        var format = new HSLayers.Format.PrinterContext();
        format.setBounds(box);
        var json = format.write(this.map,this.paperCombo.getValue(), this.landscapeCheck.getValue() == 'landscape' ? true : false);

        // zoom back
        this.map.zoomToExtent(currentBBox,true);
        mask.disable();

        var form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", HSLayers.Printer.printerScript);
        form.setAttribute("target", "_blank");
        form.style.display="none";
        var input = document.createElement("input");
        input.setAttribute("name", "json");
        input.value = json;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    },

    /**
     * Set the #map object
     *
     * @function
     * @name HSLayers.Printer.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     * @returns None
     */
    setMap: function(map) {
        this.map = map;

        /* scales */
        if (!this.scales || !this.scales.length) {
            for (var i = 0; i < this.map.baseLayer.resolutions.length; i++) {
                var scale = OpenLayers.Util.getScaleFromResolution(this.map.baseLayer.resolutions[i],this.map.units);
                this.scales.push(scale);        
                this.scalesStore.add(new Ext.data.Record({scale: Math.round(scale)}));
            }
        }
        else {
            for (var i = 0; i < this.scales.length; i++) {
                this.scalesStore.add(new Ext.data.Record({scale: this.scales[i]}));
            }
        }

        this.scalesCombo.setValue(this.getClosestScale());
    },

    /**
     * Get closest scale for {@link <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html#OpenLayers.Map.getScale">this.map.getScale()</a>} from this.scales list
     * @function
     * @name HSLayers.Printer.getClosestScale
     * @return {Float} scale
     */
    getClosestScale: function() {
        var closest = this.scales[0];
        var scale = this.map.getScale();
        for (var i = 1; i < this.scales.length; i++) {
            if (Math.abs(this.scales[i]-scale) < Math.abs(this.scales[i]-closest)) {
                closest = this.scales[i];
            }
        }
        return Math.round(closest);
    }
});

/**
 * The URL to the printing script
 * @name HSLayers.Printer.printerScript
 * @type String
 */
HSLayers.Printer.printerScript = "/cgi-bin/mapCreator.py";

