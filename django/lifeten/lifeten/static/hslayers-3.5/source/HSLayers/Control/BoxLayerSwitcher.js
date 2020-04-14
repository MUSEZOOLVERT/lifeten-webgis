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
HSLayers.namespace("HSLayers.Control","HSLayers.Control.BoxLayerSwitcher");

/** 
 * Google-like layer switcher
 * @contructor
 * @class HSLayers.Control.BoxLayerSwitcher
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/ArgParser-js.html">OpenLayers.Control.ArgParser</a>
 * 
 * @example
 *  var base = new OpenLayers.Layer.FOO();
 *  var ortho = new OpenLayers.Layer.BAR();
 *  var shadow =  new OpenLayers.Layer.FOO();
 *  var roads =  new OpenLayers.Layer.BAR();
 *  var labels =  new OpenLayers.Layer.FOO();
 *  var box = new HSLayers.Control.BoxLayerSwitcher();
 *  map.addControl(box);
 *  box.add("Base map",base,shadow,{active:true});
 *  box.add("Aerial map",ortho,[[labels,roads]],{});
 */
HSLayers.Control.BoxLayerSwitcher = 
  OpenLayers.Class(OpenLayers.Control, {

    /**
     * Element, where the layer list is stored
     * @type DOMElement
     * @name HSLayers.Control.BoxLayerSwitcher.mainLayersDiv
     */
    mainLayersDiv: null,

    /**
     * Element, where the layer list is stored
     * @type DOMElement
     * @name HSLayers.Control.BoxLayerSwitcher.subLayersDiv
     */
    subLayersDiv: null,

    /**
     * groups, their titles, names, layers and status
     * @type Object
     * @name HSLayers.Control.BoxLayerSwitcher.groups
     */
    groups: {},

    /**
     * destroy this object and unregister all events
     * @function
     * @private
     * @name HSLayers.Control.BoxLayerSwitcher.destroy
     */    
    destroy: function() {
        
        OpenLayers.Event.stopObservingElement(this.div);

        this.map.events.unregister("addlayer", this, this.redraw);
        this.map.events.unregister("changelayer", this, this.redraw);
        this.map.events.unregister("removelayer", this, this.redraw);
        this.map.events.unregister("changebaselayer", this, this.redraw);
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * Set the map property for the control. 
     * @function
     * @name HSLayers.Control.BoxLayerSwitcher.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        this.map.events.on({
            "changelayer": this.redraw,
            scope: this
        });
        
    },

    /**
     * Draw the control to map canvas
     * @name HSLayers.Control.BoxLayerSwitcher.draw
     * @function
     * @return {DOMElement} A reference to the DIV DOMElement containing the 
     *     switcher tabs.
     */  
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this);

        this.mainLayersDiv = OpenLayers.Util.createDiv(
                                    OpenLayers.Util.createUniqueID());
        this.mainLayersDiv.className = "olMainlayersList";
        this.div.appendChild(this.mainLayersDiv);

        //this.div.style.height="50px"; // For IE only

        // populate div with current info
        this.subLayersDiv = OpenLayers.Util.createDiv(
                                    OpenLayers.Util.createUniqueID());
        this.subLayersDiv.className = "olSublayersList";
        this.subLayersDiv.style.position = "relative";
        this.subLayersDiv.style.top = "25px";
        this.div.appendChild(this.subLayersDiv);

        return this.div;
    },

    /**
     * Initializes new layer group and creates button for it
     * @function
     * @name HSLayers.Control.BoxLayerSwitcher.add
     *
     * @param {String} name which will appear in the layer switcher
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer-js.html">OpenLayers.Layer</a>[]} layers list of layers, which do belong to the button
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer-js.html">OpenLayers.Layer</a>[]} [sublayers] list of sublayers, which will appear in pullOWSContextdown menu
     * @param {Object} [attributes] - {Object} base, img, title, active
     * @param {Boolean} [attributes.base] is this group base group?
     * @param {String} [attributes.img] any image, which should appear on the button
     * @param {String} [attributes.title] optionaly different title
     * @param {Boolean} [attributes.active] is this group active, at the beginning?
     *
     */
    add: function(name,layers, sublayers, attributes) {

        /* group div */
        var group = new HSLayers.Control.BoxLayerSwitcher.LayerGroup(name,layers,sublayers,attributes);
        group.events.register("activitychange",this,this.onActivityChanged);
        this.mainLayersDiv.appendChild(group.div);
        if (group.sublayersDiv) {
            this.subLayersDiv.appendChild(group.sublayersDiv);
        }

        this.groups[name] = group;
    },

    /**
     * get group based on given layer
     * @param {OpenLayers.Layer} layer
     * @returns {Object}OWSContext group
     */
    getLayerGroup: function(layer) {
        for (var i in this.groups) {
            for (var j = 0; j < this.groups[i].layers.length; j++) {
                if (layer == this.groups[i].layers[j]) {
                    return this.groups[i];
                }
            }
        }
    },

    /**
     * some group activity was changed, if it was 'activated', deactivate
     * all other available 'base' groups
     * @param {Event} evt
     */
    onActivityChanged: function(evt) {
        var group = evt.object;
        if (group.active) {
            for (var i in this.groups) {
                if (this.groups[i] != group && 
                    this.groups[i].base &&
                    this.groups[i].alwaysActive === false &&
                    this.groups[i].active === true) {
                    this.groups[i].setActivity(false);
                }
            }
        }
    },
    
    /**
     * @name HSLayers.Control.BoxLayerSwitcher.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.BoxLayerSwitcher"
});
OpenLayers.Control.HSBoxLayerSwitcher = HSLayers.Control.BoxLayerSwitcher;

HSLayers.Control.BoxLayerSwitcher.LayerGroup = OpenLayers.Class({

    EVENT_TYPES: ["activitychange"],
    events: undefined,
    layers: undefined,
    name: undefined,
    div: undefined,
    sublayers: undefined, 
    sublayersDiv: undefined,
    sublayersDivs: undefined,
    img: undefined,
    base: true,
    active: undefined,
    alwaysActive: false,

    /**
     * - img - image url
     * @type {Object}
     */
    attributes: undefined,

    initialize: function(name,layers,sublayers,options){

        this.base = true;

        OpenLayers.Util.extend(this, options);

        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);

        this.name = name;
        this.layers = [];
        this.sublayers = [];
        this.sublayersDivs = [];
        this.addLayers(layers);
        this.createSublayersDiv();
        this.addSublayers(sublayers);
        this.createDiv();


    },

    createDiv: function() {
        this.div = OpenLayers.Util.createDiv(
                                    OpenLayers.Util.createUniqueID(), 
                                    null, 
                                    null,
                                    (this.img  || null),
                                    "static");

        this.div.style.cursor = "pointer";
        this.div.style.display = "block";
        this.div.style.cssFloat = "left";
        this.div.style.styleFloat = 'left';
        this.div.appendChild(document.createTextNode(this.name));
        this.div.className = "olGroup";
        this.div.group = this;
        if (this.base) {
            if (this.layers && this.layers.length) {
                this.setActivity(this.layers[0].getVisibility());
            }
            else {
                this.setActivity(false);
            }
        }
        else {
            this.setActivity(true);
        }

        if (this.alwaysActive) {
            this.setDivClass(this.active);
        }

        OpenLayers.Event.observe(this.div, "mouseup", 
            OpenLayers.Function.bindAsEventListener(this.onGroupClicked, this));

        // stop anything else
        OpenLayers.Event.observe(this.div, "mousedown", 
            OpenLayers.Function.bindAsEventListener(function(evt){OpenLayers.Event.stop(evt);}, this));

        OpenLayers.Event.observe(this.div, "click", 
            OpenLayers.Function.bindAsEventListener(function(evt){OpenLayers.Event.stop(evt);}, this));

        OpenLayers.Event.observe(this.div, "mouseover", 
            OpenLayers.Function.bindAsEventListener(this.onGroupMouseOver, this));

        OpenLayers.Event.observe(this.div, "mouseout", 
            OpenLayers.Function.bindAsEventListener(this.onGroupMouseOut, this));

        
    },

    createSublayersDiv: function() {
        this.sublayersDiv  = OpenLayers.Util.createDiv(
                                    OpenLayers.Util.createUniqueID(), 
                                    null, 
                                    null,
                                    null,
                                    "relative");
        this.sublayersDiv.style.display = "none";
        this.sublayersDiv.style.cssFloat="left";
        this.sublayersDiv.style.styleFloat="left";

        OpenLayers.Event.observe(this.sublayersDiv, "mouseover", 
            OpenLayers.Function.bindAsEventListener(this.onSublayerMouseOver, this));

        OpenLayers.Event.observe(this.sublayersDiv, "mouseout", 
            OpenLayers.Function.bindAsEventListener(this.onSublayerMouseOut, this));
    },

    addLayer: function(layer) {
        layer.events.register("visibilitychanged",this, this.onLayerVisibilityChanged);
        this.layers.push(layer);
    },

    addLayers: function(layers) {
        if (layers && layers.length === undefined) {
            layers = [layers];
        }
        else {
            return;
        }
        for (var i = 0; i < layers.length; i++) {
            this.addLayer(layers[i]);
        }
    },

    setActivity: function(activity) {
        var i,llen,slen;
        if (this.layers && this.activity != activity &&
            this.alwaysActive === false) {
            this.active = activity;
            this.setDivClass(this.active);

            for (i = 0, llen = this.layers.length; i < llen; i++) {
                if (this.layers[i].visibility != activity) {
                    this.layers[i].setVisibility(activity);
                }
            }
            for (i = 0, slen = this.sublayers.length; i < slen; i++) {
                if (activity) {
                    this.sublayers[i].restoreActivity();
                }
                else {
                    this.sublayers[i].suppressActivity();
                }
            }

            this.events.triggerEvent("activitychange");
        }
    },

    setDivClass: function(activity) {
        var regex = /olGroup[IA]n*a*ctive/;
        this.div.className = this.div.className.replace(regex,"");
        this.div.className += " "+(activity ? "olGroupActive" : "olGroupInactive");
        this.div.className = this.div.className.replace(/ ( *)/g," ");
    },

    addSublayers: function(layers) {
        if (!layers) {
            return;
        }
        for (var i = 0, len = layers.length; i < len; i++) {
            this.addSublayer(layers[i]);
        }
    },

    onLayerVisibilityChanged: function(evt) {
        var layer = evt.object;
        this.setActivity(layer.getVisibility());
    },

    addSublayer: function(layer) {

        var sublayer = new HSLayers.Control.BoxLayerSwitcher.SubLayer(layer);

        this.sublayers.push(sublayer);

        var visibility = this.sublayers[0].layers[0].getVisibility();
        sublayer.setActivity(visibility);

        this.sublayersDivs.push(sublayer.div);
        this.sublayersDiv.appendChild(sublayer.div);

    },

    /**
     * Handler for the click event on the button associated with the group
     *
     * @function
     * @name  HSLayers.Control.BoxLayerSwitcher.onGroupClicked
     * @param {Event} evt 
     */
    onGroupClicked: function(evt) {
        var div = OpenLayers.Event.element(evt);
        var group = div.group;

        group.setActivity.apply(group,[!group.active]);
        OpenLayers.Event.stop(evt);
        this.onGroupMouseOver();
    },

    /**
     * Handler for the mouseover event over the sublayer list. The list of
     * sublayers will appear
     *
     * @function
     * @name HSLayers.Control.BoxLayerSwitcher.onSublayerMouseOver
     * @param {Event} evt 
     */
    onSublayerMouseOver: function(evt) {

        HSLayers.Control.BoxLayerSwitcher.hideSublayer = false;
        this.sublayersDiv.style.display="block";
        OpenLayers.Event.stop(evt);
    },

    /**
     * Handler for the mouseout event over the list of sublayers. The list
     * of sublayers will disappear
     *
     * @function
     * @name HSLayers.Control.BoxLayerSwitcher.onSublayerMouseOut
     * @param {Event} evt 
     */
    onSublayerMouseOut: function(evt) {
        this.hideSublayerDiv(this.sublayersDiv);
    },


    /**
     * Handler for the mouseover event over the group button. The list of
     * sublayers will appear
     *
     * @function
     * @name HSLayers.Control.BoxLayerSwitcher.onGroupMouseOver
     * @param {Event} evt 
     */
    onGroupMouseOver: function(evt) {

        if (!this.active) {
            return;
        }

        if (this.sublayers) {
            this.sublayersDiv.style.display="block";
            this.sublayersDiv.style.left = this.div.offsetLeft+"px";
        }
        if (evt) {
            OpenLayers.Event.stop(evt);
        }
    },

    /**
     * Handler for the mouseout event over the group button. The list of
     * sublayers will disappear
     *
     * @function
     * @name HSLayers.Control.BoxLayerSwitcher.onGroupMouseOut
     * @param {Event} evt 
     */
    onGroupMouseOut: function(evt) {

        if (this.sublayersDiv) {
            this.hideSublayerDiv(this.sublayersDiv);
        }

        OpenLayers.Event.stop(evt);
    },

    /**
     * Hide the list of sublayers
     * @function
     * @param {DOMElement} div with list of sublayers
     */
    hideSublayerDiv: function(div) {

        HSLayers.Control.BoxLayerSwitcher.hideSublayer = true;
        HSLayers.Control.BoxLayerSwitcher.subLayersDiv = div;
        HSLayers.Control.BoxLayerSwitcher.hide = function() {
            if (HSLayers.Control.BoxLayerSwitcher.hideSublayer && 
                HSLayers.Control.BoxLayerSwitcher.subLayersDiv) {
                HSLayers.Control.BoxLayerSwitcher.subLayersDiv.style.display = "none";
            }
        };
        window.setTimeout("HSLayers.Control.BoxLayerSwitcher.hide()", 300);
    },

    CLASS_NAME: "HSLayers.Control.BoxLayerSwitcher.LayerGroup"
});

HSLayers.Control.BoxLayerSwitcher.SubLayer = OpenLayers.Class({
    div: undefined,
    layers: undefined,
    active: undefined,
    name: undefined,
    activeWhenGroupactive: undefined,
    EVENT_TYPES:"activitychange",

    initialize: function(layers) {
        this.layers = [];
        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);

        this.div = document.createElement("div");
        this.div.style.cursor = "pointer";
        this.div.className = "olSublayer";

        this.addLayers(layers);
        this.setActivity(this.layers[0].getVisibility());
        this.name = this.layers[0].title || this.layers[0].name;
        this.div.appendChild(document.createTextNode(this.name));

        OpenLayers.Event.observe(this.div, "mouseup", 
            OpenLayers.Function.bindAsEventListener(this.onClicked, this));

        // stop anything else
        OpenLayers.Event.observe(this.div, "mousedown", 
            OpenLayers.Function.bindAsEventListener(function(evt){OpenLayers.Event.stop(evt);},this));

    },

    addLayers: function(layers) {
        if (layers && layers.length === undefined) {
            layers = [layers];
        }
        else {
            return;
        }

        for (var i = 0, len = layers.length; i < len; i++) {
            this.addLayer(layers[i]);
        }
    },

    addLayer: function(layer) {
        layer.events.register("visibilitychanged",this,this.onLayerVisibilityChanged);
        this.layers.push(layer);
    },

    onLayerVisibilityChanged: function(evt) {
        var layer = evt.object;
        this.setActivity(layer.getVisibility());
    },

    onClicked: function(evt) {

        this.setActivity(!this.active);
        OpenLayers.Event.stop(evt);
    },

    setActivity: function(active) {

        //if (this.active != active) {

            this.div.className = this.div.className.replace(/olSublayer[IA]n*a*ctive/g, '');
            this.div.className += " "+(active ? "olSublayerActive" : "olSublayerInactive");
            this.div.className = this.div.className.replace(/ ( *)/g," ");

            for (var i = 0; i < this.layers.length; i++) {
                this.layers[i].setVisibility(active);
            }

            if (this.active != active) {
                this.events.triggerEvent("activitychange");
                this.active = active;
            }
        //}
    },

    suppressActivity: function() {
        this.activeWhenGroupactive = this.active;
        this.setActivity(false);
    },

    restoreActivity: function() {
        this.setActivity(this.activeWhenGroupactive);
    },

    CLASS_NAME: "HSLayers.Control.BoxLayerSwitcher.SubLayer"
});
