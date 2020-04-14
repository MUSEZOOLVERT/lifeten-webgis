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
 * @class HSLayers.Control.ProjectionSwitcher
 * @augments OpenLayers.Control
 *
 * @example
 * // create switcher with pre-set epsg:102067 and epsg:4326 projections
 * // if userProjections is ommited, only those projections supported by
 * // *ALL* layers will be displayed
 * var switcher = new HSLayers.Control.ProjectionSwitcher({
 *                   div: document.getElementById("projectionswitcher"),
 *                   projections: [
 *                      { 
 *                          projection: new OpenLayers.Projection("epsg:102067"),
 *                          maxExtent: new OpenLayers.Bounds(...),
 *                          scales: [2000000,1000000,...]
 *                          ...
 *                          },
 *                      {
 *                          projection:new OpenLayers.Projection("epsg:4326"},
 *                          scales: [...],
 *                          maxExtent: ...,
 *                          ...
 *
 *                          ]});
 * map.addControl(switcher);
 * // to add support for reprojecting to map layers, you have to add new
 * //*projections* parameter
 * var wmslayer = new OpenLayers.Layer.WMS("name","url",{wmsparams},{
 *          ...,
 *          projections: [{projection: new OpenLayers.Projection("epsg:4326")},{projection: new OpenLayers.Projection("epsg:102067")}, {projection: new OpenLayers.Projection("epsg:900913")}],
 *          ...
 */
HSLayers.Control.ProjectionSwitcher = OpenLayers.Class(OpenLayers.Control, {

        
    /**
     * list of projections
     * @name HSLayers.Control.ProjectionSwitcher.projDefs
     * @type {OpenLayers.Projection}[]
     */
    projDefs: [],

    /**
     * @name HSLayers.Control.ProjectionSwitcher.title
     * @type String
     */
    title: OpenLayers.i18n("Projection switcher"),

    /**
     * the select object
     * @name HSLayers.Control.ProjectionSwitcher.switcher
     * @type DOMObject
     */
    switcher: null,

    /**
     * mapping object for scales and projections
     * @name HSLayers.Control.ProjectionSwitcher.scaleMap
     * @type Object
     * @example
     *  {
     *      "epsg:4326": [minScale, maxScale],
     *      "esri:900913": [minScale, maxScale],
     *      ...
     *  }
     */
    scaleMap: {},
  
    /** 
     * @name HSLayers.Control.ProjectionSwitcher.setMap
     * @function
     * @type {OpenLayers.Map}
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        // append at least this map projection
        var mapProjDef = {
            projection: this.map.getProjectionObject() || this.map.projection,
            units: this.map.units,
            numZoomLevels: this.map.numZoomLevels,
            maxExtent: this.map.maxExtent,
            minExtent: this.map.minExtent,
            maxResolution: this.map.maxResolution,
            minResolution: this.map.minResolution,
            restrictedExtent: this.map.restrictedExtent,
            initialExtent: this.map.initialExtent,
            scales:  this.map.scales,
            resolutions: this.map.resolutions,
            minScale: this.map.minScale,
            maxScale: this.map.maxScale
        };

        this.projDefs = [mapProjDef].concat(this.projDefs);

        this.map.events.on({
            "addlayer": this.redraw,
            "removelayer": this.redraw,
            "moveend": this.onZoomChange,
            scope: this
        });
    },

    /**
     * The draw method is called when the control is ready to be displayed
     * on the page.  If a div has not been created one is created.  Controls
     * with a visual component will almost always want to override this method 
     * to customize the look of control. 
     * @name HSLayers.Control.ProjectionSwitcher.draw
     * @function
     * @param {OpenLayers.Pixel} px The top-left pixel position of the control or null.
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
     * Go through all layers in the map and find out, in which projection
     * they actually are
     * @name HSLayers.Control.ProjectionSwitcher.redraw
     * @function
     */
    redraw: function(e) {

        if (this.projDefs.length <= 1) {
            return;
        }

        if (this.switcher) {
            try{
                if (window.Ext.version.search("3") == 0) {
                    this.div.firstChild.removeChild(this.div.firstChild.firstChild)
                }
                else {
                    this.div.removeChild(this.div.firstChild)
                }
            }
            catch(e){
                this.div.removeChild(this.div.firstChild)
            }
        }
        // <select>
        this.switcher = document.createElement("select");
        
        // create <option> for each projection from this.projections
        for (var i = 0; i < this.projDefs.length; i++) {
            var option = document.createElement("option");

            if (!this.projDefs[i].projection) {
                continue;
            }  
            option.value = this.projDefs[i].projection.getCode();
            
            option.appendChild(document.createTextNode(this.getTitle(this.projDefs[i].projection)));
            this.switcher.appendChild(option);
        }
        this.switcher.ps = this;

        this.switcher.onchange = function(evt){this.ps.onSwitcherChange.apply(this.ps,[evt])};

        try{
            if (window.Ext.version.search("3") == 0) {
                this.div.firstChild.appendChild(this.switcher)
            }
            else {
                this.div.appendChild(this.switcher);
            }
        }
        catch(e){
            this.div.appendChild(this.switcher);
        }

        // return everything back button
        var backButton = document.createElement("button");
        backButton.title = OpenLayers.i18n("Zoom to original state");
        backButton.onclick = function(){this.scope.returnBack.apply()};
        backButton.scope = this;
        var backImage = document.createElement("img")
        backImage.src = OpenLayers.Util.getImagesLocation()+"/reload.png";
        backButton.appendChild(backImage);

        // TODO FIXME this.div.appendChild(backButton);
    },

    /**
     * return back to original state
     * @name HSLayers.Control.ProjectionSwitcher.returnBack
     * @function
     */
    returnBack: function() {
        if (this.origValues) {
            this.map.projection =  this.origValues.mapProj;
            this.map.maxExtent =  this.origValues.maxExtent;
            this.map.restrictedExtent =  this.origValues.restrictedExtent;
            this.map.units = this.origValues.units;
            this.map.baseLayer.options["resolutions"] = this.map["resolutions"] = this.origValues.resolutions;
            this.map.zoomToMaxExtent();
        }
    },

    /**
     * called, when the switcher has changed
     * @name HSLayers.Control.ProjectionSwitcher.onSwitcherChange
     * @function
     * @param {Event} evt
     */
    onSwitcherChange: function(evt) {
        var projDef = this.getProjDef(this.switcher.value);

        // switch!
        if (projDef.projection.getCode() != this.map.projection.getCode()) {
            this.switchProjection(projDef);
        }
    },

    /**
     * get projDef object
     * @name HSLayers.Control.ProjectionSwitcher.getProjDef
     * @function
     * @param {String} code epsg code, like "epsg:4326"
     * @returns {Object} projDef object
     */
    getProjDef: function(code) {
        for (var i = 0; i < this.projDefs.length; i++) {
            if (this.projDefs[i].projection.getCode().toLowerCase() == code.toLowerCase()) {
                return this.projDefs[i];
            }
        }
        return undefined;
    },
    /**
     * Method: switchProjection
     * ok, switch it!
     * @name HSLayers.Control.ProjectionSwitcher.switchProjection
     * @function
     * @param {OpenLayers.Projection|String} projection 
     */
    switchProjection: function(projDef) {

        // get new extent
        var mapExt = this.map.getExtent();

        var tmp = this.reproject(this.getProjDef(this.map.projection.getCode()), projDef, mapExt);

        this.map.setOptions(projDef);
        this.resetLayers(projDef);

        var newCenter = tmp[0]; var newExtent = tmp[1];
        var newZoom = this.map.getZoomForExtent(newExtent, true);
        this.map.setCenter(newCenter, newZoom, false, true);
        
    },

    /**
     * set projection options to layers
     * @function
     * @name HSLayers.ProjectionSwitcher.resetLayers
     * @param {Object} projDef
     */
    resetLayers: function(projDef) {
        var i, len, layer;
        for(i=0,len=this.map.layers.length; i<len; i++) {
            layer = this.map.layers[i];
            layer.addOptions(projDef);
            layer.initResolutions();
        }
    },

    /**
     * reproject the extent
     * @function
     * @name HSLayers.Control.ProjectionSwitcher.reproject
     * @param {Object} srcDef source projection definition
     * @param {Object} dstDef destination projection definition
     * @param {OpenLayers.Bounds} extent 
     * @return [OpenLayers.LonLat, OpenLayers.Bounds] new center and extent
     */
    reproject: function(srcDef, dstDef, extent) {
        var center = this.map.getCenter().transform(srcDef.projection, dstDef.projection);
        var newextent = extent.transform(srcDef.projection, dstDef.projection);
        var maxExtent = dstDef.maxExtent;
        if(!maxExtent.containsLonLat(center) ||
            !maxExtent.containsBounds(newextent)) {
            newextent = maxExtent;
            center = newextent.getCenterLonLat();
        }
        return [center, newextent];
    },

    /**
     * get projection title or code
     * @name HSLayers.Control.ProjectionSwitcher.getTitle
     * @function
     * @param {OpenLayers.Projection|String} proj
     * @returns {String}
     */
    getTitle: function(proj) {
        if (typeof(proj) == "string") {
            proj = new OpenLayers.Projection(proj);
        }
        return (proj.proj.title ? proj.proj.title : proj.getCode())
    },

    /**
     * @name HSLayers.Control.ProjectionSwitcher.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.ProjectionSwitcher"
});

OpenLayers.Control.HSProjectionSwitcher = HSLayers.Control.ProjectionSwitcher;
