/* Copyright (c) 2007-2011 Help Service - Remote Sensing s.r.o.
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
  
HSLayers.namespace("HSLayers.Embed");

/**
 * Class for dynamic embedding map into the HTML page (pure OpenLayers). 
 *
 * @class HSLayers.Embed.EmbedHtml
 */
HSLayers.Embed.EmbedHtml = OpenLayers.Class(HSLayers.Embed, { 
    
    /**
     * @private
     * @name HSLayers.Embed.EmbedHtml._DIV_ID
     * @type {String}
     */
    _DIV_ID: "map",

    /**
     * @function
     * @name HSLayers.Embed.EmbedHtml.createControlsForMap
     */     
    createControlsForMap: function() {
        var body = document.getElementsByTagName("body")[0];
        var div = document.createElement("div");
        div.setAttribute("id", this._DIV_ID);
        div.setAttribute("style", "width:" + this._parameters.w + ";height:" + this._parameters.h);
        body.appendChild(div);
    },
    
    /**
     * @function
     * @name HSLayers.Embed.EmbedHtml.getElementIdForMap
     */     
    getElementIdForMap: function() {
        return this._DIV_ID;
    },
        
    /**
     * @name HSLayers.Embed.EmbedHtml.CLASS_NAME
     * @type String
     */ 
    CLASS_NAME: "HSLayers.Embed.EmbedHtml"    
});