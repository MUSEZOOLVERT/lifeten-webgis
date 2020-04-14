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
 * Switches projection on for the map
 * @class HSLayers.Control.ScaleSwitcher
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control-js.html">OpenLayers.Control</a>
 *
 */
HSLayers.Control.ScaleSwitcher = OpenLayers.Class(OpenLayers.Control, {

    /**
     * the select object
     * @name HSLayers.Control.ScaleSwitcher.switcher
     * @type DOMObject
     */
    switcher: null,

    /** 
     * @name HSLayers.Control.ProjectionSwitcher.setMap
     * @function
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        this.map.events.on({
            "moveend": this.onZoomChange,
            "changebaselayer": this.redraw,
            scope: this
        });
    },

    /**
     * The draw method is called when the control is ready to be displayed
     * on the page.  If a div has not been created one is created.  Controls
     * with a visual component will almost always want to override this method 
     * to customize the look of control. 
     * @name HSLayers.Control.ScaleSwitcher.draw
     * @function
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Pixel-js.html">OpenLayers.Pixel</a>} px The top-left pixel position of the control or null.
     *
     * @returns {DOMElement} A reference to the DIV DOMElement containing the control
     */
    draw: function (px) {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv(this.id);
            this.div.className = this.displayClass;
            if (!this.allowSelection) {
                this.div.className += " olControlNoSelect";
                this.div.setAttribute("unselectable", "on", 0);
                this.div.onselectstart = function() { return(false); }; 
            }    
            if (this.title != "") {
                this.div.title = this.title;
            }
        }
        if (px != null) {
            this.position = px.clone();
        }
        this.moveTo(this.position);

        this.redraw();
        return this.div;
    },


    /**
     * Go through scales and generate the switcher
     * they actually are
     * @name HSLayers.Control.ProjectionSwitcher.redraw
     * @function
     */
    redraw: function(e) {


        if (this.switcher) {
            this.switcherDiv.parentNode.removeChild(this.switcherDiv);
        }
        // <select>
        this.switcherDiv = document.createElement("div");
        this.switcher = document.createElement("input");
        this.switcher.style.width="50px";

        this.switcher.ss = this;

        var onchange = function(evt){
            if (evt && evt.keyCode == OpenLayers.Event.KEY_RETURN) {
                this.ss.onSwitcherChange.apply(this.ss,[evt]);
            }
        };

        this.switcher.onkeyup = onchange;
        this.switcher.onchange = onchange;

        this.switcherDiv.appendChild(document.createTextNode("1: "));
        this.switcherDiv.appendChild(this.switcher);
        try{
            if (window.Ext.version.search("3") == 0) {
                this.div.firstChild.appendChild(this.switcherDiv)
            }
            else {
                this.div.appendChild(this.switcherDiv);
            }
        }
        catch(e){
            this.div.appendChild(this.switcherDiv);
        }
    },

    /**
     * called, when the switcher has changed
     * @name HSLayers.Control.ProjectionSwitcher.onSwitcherChange
     * @function
     * @param {Event} evt
     */
    onSwitcherChange: function(evt) {
        var selectedScale = this.switcher.value;
        this.map.zoomToScale(selectedScale);
    },

    /**
     * check, if the projection should be changed automatically, while zoom
     * was changed
     * @name HSLayers.Control.ProjectionSwitcher.onZoomChange
     * @function
     */
    onZoomChange: function() {
        this.switcher.value = parseInt(Math.round(this.map.getScale()));
    },

    /**
     * @name HSLayers.Control.ProjectionSwitcher.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.ScaleSwitcher"
});
