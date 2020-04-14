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
 * Add marker to the map and specify it's title and description
 * @augments HSLayers.Control.Click
 */
HSLayers.Control.Pin = OpenLayers.Class(HSLayers.Control.Click, {                

    /**
     * @name HSLayers.Control.Pin.layer
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/Markers-js.html">OpenLayers.Layer.Markers</a>
     */
    layer: null,

    /**
     * @name HSLayers.Control.Pin.inputDiv
     * @type DOMElement
     */
    inputDiv: null,

    /**
     * @name HSLayers.Control.Pin.style
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Style-js.html">OpenLayers.Style</a>
     */
    style: null,

    /**
     * @name HSLayers.Control.Pin.displayClass
     * @type String
     */
    displayClass:"hsControlAddPin",

    /**
     * listeners for activate and deactivate control events
     * @name HSLayers.Control.Pin.eventListeners
     * @type Object
     */
    eventListeners: {
        'activate': function(){
            if (this.clearMarkers) {
                this.layer.removeFeatures(this.layer.features);
            }
            this.map.setLayerIndex(this.layer,this.map.layers.length+1); 
            this.map.events.register("click",this,this.onClick);
        },
        'deactivate': function(){
            if (this.clearMarkers) {
                this.layer.removeFeatures(this.layer.features);
            }
            this.map.events.unregister("click",this,this.onClick);
        }
    },

    /**
     * Clear markers no activate/deactivate of the Control
     * @name HSLayers.Control.Pin.clearMarkers 
     * @type Boolean
     * @default false
     */
    clearMarkers: false,

    /**
     * @name HSLayers.Control.Pin.iconUrl
     * @typeString
     */
    iconUrl: OpenLayers.Util.getImagesLocation()+"icons/red.png",

    /**
     * default icon
     * @name HSLayers.Control.Pin.icon
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Icon-js.html">OpenLayers.Icon</a>
     */
    icon: null,

    /**
     * list of markers
     * @name HSLayers.Control.Pin.markers 
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Marker-js.html">OpenLayers.Marker</a>[]
     */
    markers: [],

    /**
     * @name HSLayers.Control.Pin.pinInputForm
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel">Ext.form.FormPanel</a>
     */
    pinInputForm: null,

    /**
     * Create an OpenLayers Control.  The options passed as a parameter
     * directly extend the control.  For example passing the following:
     * @constructor
     * @name HSLayers.Control.Pin
     * @param {Object} options
     */
    initialize: function (options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
  
                
                if (options.style) {
                    this.style = options.style;
                }
                else {
                    this.style = OpenLayers.Util.extend({
                            externalGraphic: this.iconUrl,
                            fillOpacity:1,
                            pointRadius: 12
                        },OpenLayers.Feature.Vector.style['default']);
                }

    },

    /**
     * on map click handler
     * @name HSLayers.Control.Pin.onClick
     * @function
     * @param {Event} evt
     */
    onClick: function(evt) {

        // pridani ikony
        this.lonlat = this.map.getLonLatFromViewPortPx(evt.xy);

        // hide other popups
        for (var i = 0; i < this.map.popups.length; i++) {
            this.map.popups[i].hide();
        }

        if (!this.contentDiv || this.popup) {
            if (this.popup) {
                this.map.removePopup(this.popup);
                this.popup.destroy();
            }

            this.popup = new OpenLayers.Popup.FramedCloud(
                                        this.id+"_inputDiv",
                                        this.lonlat,
                                        null,
                                        " ",
                                        null,
                                        true
                                        );
            this.map.addPopup(this.popup);
            this.contentDiv = this.popup.contentDiv;
        }
        this.contentDiv.innerHTML = "";

        this.titleInput = document.createElement("input");
        this.titleInput.id = this.id+"_titleinput";
        this.titleInput.style.width="220px";
        var titleLabel = document.createElement("label");
        titleLabel.id = this.id+"_titlelabel";
        titleLabel["for"] = this.titleInput.id;
        titleLabel.style.display = "block";
        titleLabel.appendChild(document.createTextNode(OpenLayers.i18n('Title')+": "));
        this.contentDiv.appendChild(titleLabel);
        this.contentDiv.appendChild(this.titleInput);

        this.contentInput = document.createElement("textarea");
        this.contentInput.style.width="220px";
        this.contentInput.style.height="100px";
        this.contentInput.id = this.id+"_contentinput";
        var contentLabel = document.createElement("label");
        contentLabel.style.display = "block";
        contentLabel.id = this.id+"_titlelabel";
        contentLabel["for"] = this.titleInput.id;
        contentLabel.appendChild(document.createTextNode(OpenLayers.i18n('Content')+": "));
        this.contentDiv.appendChild(contentLabel);
        this.contentDiv.appendChild(this.contentInput);

        this.moreInput = document.createElement("input");
        this.moreInput.id = this.id+"_moreinput";
        this.moreInput.style.width="220px";
        this.moreInput.value = "http://";
        var moreLabel = document.createElement("label");
        moreLabel.id = this.id+"_morelabel";
        moreLabel.style.display = "block";
        moreLabel["for"] = this.titleInput.id;
        moreLabel.appendChild(document.createTextNode(OpenLayers.i18n('More info')+": "));
        this.contentDiv.appendChild(moreLabel);
        this.contentDiv.appendChild(this.moreInput);

        var button = document.createElement("input");
        button.type = "button";
        button.id+"_addbutton";
        button.style.display = "block";
        button.value = OpenLayers.i18n("Add to map");
        button.scope = this;
        button.onclick = function(){this.callback.apply(this.scope,arguments)}
        button.callback = this.onAddClicked;

        this.contentDiv.appendChild(button);

        var x = parseInt(this.map.div.style.width,10)-50;
        var y = parseInt(this.map.div.style.height,10)-150;
        
        if (this.popup) {
            this.popup.setSize(new OpenLayers.Size((x < 250 ? x : 250), (y < 250 ? y : 250)));
        }

        // back to navigation
        var nav = this.map.getControlsBy("CLASS_NAME","OpenLayers.Control.Navigation");
        if (nav.length > 0) {
            this.deactivate();
            nav[0].activate();
        }

    },

    /**
     * add new feature to map
     * @name HSLayers.Control.Pin.onRemoveClicked 
     * @param {Event} evt
     */
    onAddClicked : function(e) {
            var icon = OpenLayers.Util.getImagesLocation()+"icons/blue.png";
            var geometry = new OpenLayers.Geometry.Point(this.lonlat.lon, this.lonlat.lat)

            var style = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style['default'],{
                        externalGraphic: icon,
                        fillOpacity:1,
                        pointRadius: 12
                        });
            var feature = new OpenLayers.Feature.Vector(geometry,
                                { title: this.titleInput.value ||"",
                                    description: this.contentInput.value ||" ",
                                    moreInfo: (this.moreInput.value === "http://" ? undefined : this.moreInput.value)},
                                    style
                                    );

            feature.closeBox = true;
            feature.popupClass = HSLayers.Popup;
            feature.data.popupContentHTML = feature.data.description;

            this.layer.addFeatures([feature]);
            this.layer.redraw();
            this.map.removePopup(this.popup);
    },

    /**
     * @name HSLayers.Control.Pin.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.Pin"
});

OpenLayers.Control.HSPin = HSLayers.Control.Pin;
