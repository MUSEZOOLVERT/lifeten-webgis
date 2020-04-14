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
 * Class for dynamic embedding map into the HTML page (HSLayers.MapPanel base). 
 *
 * @class HSLayers.Embed.EmbedSimpleExtJs
 */
HSLayers.Embed.EmbedSimpleExtJs = OpenLayers.Class(HSLayers.Embed, { 

    /**
     * @private
     * @name HSLayers.Embed.EmbedSimpleExtJs._mapPanel
     * @type {HSLayers.MapPanel}
     */
    _mapPanel: null,

    /**
     * @function
     * @name HSLayers.Embed.EmbedSimpleExtJs.createControlsForMap
     */     
    createControlsForMap: function() {
        this._mapPanel = new HSLayers.MapPanel({});
        var container = new Ext.Viewport({
            layout:"fit",
            items: [this._mapPanel]
        });
    },
    
    /**
     * @function
     * @name HSLayers.Embed.EmbedSimpleExtJs.getElementIdForMap
     */     
    getElementIdForMap: function() {
        return this._mapPanel.body.dom.id;
    },
    
    /**
     * @function
     * @name HSLayers.Embed.EmbedSimpleExtJs.initControlsForMap
     */     
    initControlsForMap: function() {
        this._mapPanel.setMap(this.map);
    },
    
    /**
     * @name HSLayers.Embed.EmbedSimpleExtJs.CLASS_NAME
     * @type String
     */ 
    CLASS_NAME: "HSLayers.Embed.EmbedSimpleExtJs"    
});