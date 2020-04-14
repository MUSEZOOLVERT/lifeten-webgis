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

HSLayers.namespace("HSLayers.Control","HSLayers.Control.PanZoom");

/**
 * HSLayers.Control.PanZoom build on top of OpenLayers.Control.PanZoom  and adds some more functionality and changes design
 *
 * @class HSLayers.Control.ArgParser
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/ArgParser-js.html">OpenLayers.Control.ArgParser</a>
 *
 * @example
 *   map.addControl(new HSLayers.Control.PanZoom());
 */
HSLayers.Control.PanZoom = OpenLayers.Class(OpenLayers.Control.PanZoom, {

    /**
     * The draw function
     * @param {OpenLayers.Pixel} px 
     * @returns {DOMElement} A reference to the container div for the PanZoom control.
     */
    draw: function(px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position;

        // place the controls
        this.buttons = [];

        var sz = new OpenLayers.Size(22,22);
        var centered = new OpenLayers.Pixel(px.x+sz.w, px.y);

        this._addButton("panup", "north-mini-hsl.png", centered, sz);
        px.y = centered.y+sz.h;
        this._addButton("panleft", "west-mini-hsl.png", px, sz);
        this._addButton("zoomworld", "zoom-world-mini-hsl.png", 
                        centered.add(0, sz.h), sz);
        this._addButton("panright", "east-mini-hsl.png", px.add(sz.w*2, 0), sz);
        this._addButton("pandown", "south-mini-hsl.png", 
                        centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", "zoom-plus-mini-hsl.png", 
                        centered.add(0, sz.h*3+5), sz);
        this._addButton("zoomout", "zoom-minus-mini-hsl.png", 
                        centered.add(0, sz.h*4+5), sz);
        return this.div;
    },

    buttonDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }

        switch (this.action) {
            case "panup": 
                this.map.pan(0, -this.getSlideFactor("h"));
                break;
            case "pandown": 
                this.map.pan(0, this.getSlideFactor("h"));
                break;
            case "panleft": 
                this.map.pan(-this.getSlideFactor("w"), 0);
                break;
            case "panright": 
                this.map.pan(this.getSlideFactor("w"), 0);
                break;
            case "zoomin": 
                this.map.zoomIn(); 
                break;
            case "zoomout": 
                this.map.zoomOut(); 
                break;
            case "zoomworld": 
                if (this.map.initialExtent) {
                    this.map.zoomToExtent(this.map.initialExtent);
                }
                else if (this.map.restrictedExtent) {
                    this.map.zoomToExtent(this.map.restrictedExtent);
                }
                else {
                    this.map.zoomToMaxExtent();
                }
                break;
        }

        OpenLayers.Event.stop(evt);
    },

    CLASS_NAME: "HSLayers.Control.PanZoom"
});
