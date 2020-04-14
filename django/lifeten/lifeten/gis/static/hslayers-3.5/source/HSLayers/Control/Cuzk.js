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

HSLayers.namespace("HSLayers.Control","HSLayers.Control.Cuzk");

/**
 * Control for getting informations from czech cadaster
 * @class OpenLayers.Control.Cuzk
 * @augments HSLayers.Control.Click
 */
HSLayers.Control.Cuzk = OpenLayers.Class(HSLayers.Control.Click, {                

    /**
     * markers layer, where the pins markers of the click event will be
     * displayed
     * @name HSLayers.Control.Cuzk.layer
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/Layer/Markers-js.html">OpenLayers.Layer.Markers</a>
     */
    layer: null,

    /**
     * default event listeners for 'activate' and 'deactivate' actions
     * @private
     * @name HSLayers.Control.Cuzk.eventListeners
     * @type Object
     */
    eventListeners: {
        'activate': function(){
            this.map.events.register("click",this,this.onClick);
        },
        'deactivate': function(){
            this.clearIcon();
            this.map.events.unregister("click",this,this.onClick);
        }
    },

    /**
     * url of the icon
     * @name HSLayers.Control.Cuzk.iconUrl
     * @type String
     */
    iconUrl: OpenLayers.Util.getImagesLocation()+"icons/blue.png",

    /**
     * icon object
     * @name HSLayers.Control.Cuzk.icon
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/Icon-js.html">OpenLayers.Icon</a> 
     */
    icon: null,

    /**
     * marker  object
     * @name HSLayers.Control.Cuzk.marker
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/Marker-js.html">OpenLayers.Marker</a> 
     */
    marker: null,

    /**
     * css class name
     * @name HSLayers.Control.Cuzk.displayClass
     * @type {String}
     */
    displayClass: "hsControlCuzk",

    /**
     * url of the cuzk service
     * @name HSLayers.Control.Cuzk.cuzkURL
     * @type String
     */
    cuzkURL: "http://nahlizenidokn.cuzk.cz/MapaIdentifikace.aspx",

    /**
     * the response, which comes from the server
     * @name HSLayers.Control.Cuzk.cuzkResponse
     * @type XMLHTTP
     */
    cuzkResponse: null,

    /**
     * Create an OpenLayers Control.  The options passed as a parameter
     * directly extend the control.  For example passing the following:
     *
     * @constructor
     * @example
     *  var control = new OpenLayers.Control({div: myDiv});
     *
     * @param {Object} options configuration
     */
    initialize: function (options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },

    /**
     * On click handler: call the service
     *
     * @function
     * @param {Event} evt 
     */
    onClick: function(evt) {

        //this.clearIcon();

        // pridani ikony
        var lonlat = this.map.getLonLatFromViewPortPx(evt.xy);

        var paramsString = OpenLayers.Util.getParameterString({
                x: Math.round(lonlat.lon),
                y: Math.round(lonlat.lat),
                l:"KN"
                });
        var url =  OpenLayers.Util.urlAppend(this.cuzkURL, paramsString);
        window.open(url,"KN");

        


        return;

        //var size = new OpenLayers.Size(32,32);
        //var offset = new OpenLayers.Pixel(-16, -32);
        //this.icon = new OpenLayers.Icon(this.iconUrl,size,offset);

        // informace o tom, ze se neco deje
        //HSLayers.info("Načítám data z ČUZK","...");

        // feature
        //var feature = new OpenLayers.Feature(this.layer, lonlat );

        //CUZK
        var cuzkHTML = this.getCuzk(lonlat);
        var separator = (this.cuzkURL.indexOf('?') > -1) ? '&' : '?';
        var url = this.cuzkURL + separator + "x="+Math.round(lonlat.lon)+"&y="+Math.round(lonlat.lat)+"&l=KN";

        //feature.closeBox = true;
        //Ext.example.msg('Button Click','You clicked the "{0}" button.', btn.text);
        //feature.popupClass = OpenLayers.Popup.FramedCloud;
        //feature.data.popupSize = new OpenLayers.Size(100,250);
        //feature.data.popupContentHTML = "<div>"+cuzkHTML+"</div><a href=\""+url+"\" target=\"_blank\">-&gt;ČUZK</a>";
        //feature.data.overflow = "auto";
        //feature.data.icon = this.icon.clone();

        // marker
        //var marker = feature.createMarker();

        //var markerClick = function (evt) {
        //    this.popup.toggle();
        //    OpenLayers.Event.stop(evt);
        //};
        //marker.events.register("mousedown", feature, markerClick);

        // hide other popups
        //for (var i = 0; i < this.map.popups.length; i++) {
        //    this.map.popups[i].hide();
        //}
       
        // add popup
        //this.layer.addMarker(marker);
        //this.marker = marker;
        //marker.popup = feature.createPopup(feature.closeBox);
        //this.map.addPopup(marker.popup);

        //marker.popup.show();
    },

    /**
     * call the service
     *
     * @name HSLayers.Control.Cuzk.getCuzk
     * @function
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/LonLat-js.html">OpenLayers.LonLat</a> } lonlat
     */
    getCuzk : function(lonlat) {
        var req = OpenLayers.Request.GET({
            url: this.cuzkURL,
            params: {
                x: lonlat.lon,
                y: lonlat.lat,
                l:"KN"
                },
            success: function(resp){this.cuzkResponse = resp;},
            scope:this,
            async: false
            });

        var xml = OpenLayers.parseXMLString(this.clearXMLText(this.cuzkResponse.responseText));
        
        //var tables = xml.getElementsByTagName("table");
        var tables = this.prettyPrint(this.clearXMLText(this.cuzkResponse.responseText));
        if (tables) {
            return tables;
        }
        else {
            return "Parcela nebyla nalezena";
        }

    },
             
    /**
     * remove the icon from the map
     * @name HSLayers.Control.Cuzk.clearIcon
     * @function
     */
    clearIcon : function() {
        
        try {
            if (this.marker) {
                if (this.marker.popup) {
                    this.layer.map.removePopup(this.marker.popup);
                }
                this.layer.removeMarker(this.marker);
                this.marker.destroy();
            }
            //this.popup.destroy();
        }catch(e){}
        this.popup = this.marker = null;
    },

    /**
     * Clear comments and other stuff from returned capabilities response
     * @function
     * @name HSLayers.Control.Cuzk.clearXMLText
     * @param {String} text input XML as text
     * @return {String} cleared XML in text form (not DOM)
     */
    clearXMLText: function(text) {
        text = text.replace(/<!--.*?-->/g, ''); //Helped with ESA server
        text = text.replace(/<!DOCTYPE .*transitional.dtd">/, ''); //Helped with ESA server
        text = text.replace(/\[.<!.*?>.\]/g, ''); //Helped with ESA server
        text = text.replace(/&/g,"&amp;");
        text = text.replace(/border="0"/g,"");
        //console.log(text);
        return text;
    },

    /**
     * Print the results pretty - remove some obsolote headdings etc.
     * @name HSLayers.Control.Cuzk.prettyPrint
     * @function
     * @param {String} txt
     * @return {string}
     */
    prettyPrint: function(txt) {
        txt = txt.replace(/\n/g,"");
        
        var tabs = txt.replace(/(.*[^<h1])<h1/,"<h1");
        tabs = tabs.replace(/<h2>Způsob ochrany nemovitosti<\/h2>.*/,"");
        tabs = tabs.replace(/h1>/g,"b>");
        tabs = tabs.replace(/h2>/g,"b>");

        return tabs;

    },

    /**
     * @name HSLayers.Control.Cuzk.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.Cuzk"
});
OpenLayers.Control.HSCuzk = HSLayers.Control.Cuzk;
