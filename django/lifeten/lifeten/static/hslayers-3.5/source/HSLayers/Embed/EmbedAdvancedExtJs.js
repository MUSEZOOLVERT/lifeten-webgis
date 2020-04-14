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
 * Class for dynamic embedding map into the HTML page (HSLayers.MapViewer base). 
 *
 * @class HSLayers.Embed.EmbedAdvancedExtJs
 */
HSLayers.Embed.EmbedAdvancedExtJs = OpenLayers.Class(HSLayers.Embed, { 

    /**
     * @private
     * @name HSLayers.Embed.EmbedAdvancedExtJs._mapViewer
     * @type {HSLayers.MapViewer}
     */
    _mapViewer: null,

    /**
     * @function
     * @name HSLayers.Embed.EmbedAdvancedExtJs.createControlsForMap
     */     
    createControlsForMap: function() {
        HSLayers.WMCManager.inspireThemesURL = null;
        Proj4js.libPath = this._parameters.proj4jsUrl;
        this._mapViewer = new HSLayers.MapViewer({
            panels: ["layerSwitcher"]
        });
        var container = new Ext.Viewport({
            layout:"fit",
            items: [this._mapViewer]
        });
    },
    
    /**
     * @function
     * @name HSLayers.Embed.EmbedAdvancedExtJs.getElementIdForMap
     */     
    getElementIdForMap: function() {
        return this._mapViewer.mapPanel.body.dom.id;
    },
    
    /**
     * @function
     * @name HSLayers.Embed.EmbedAdvancedExtJs.initControlsForMap
     */     
    initControlsForMap: function() {
        this._mapViewer.setMap(this.map);
        // remove WMC buttons
        for (var i = 0; i < 4; i++) {
            this._mapViewer.mapPanel.getTopToolbar().remove(0);
        }
    },
    
    /**
     * @name HSLayers.Embed.EmbedAdvancedExtJs.CLASS_NAME
     * @type String
     */     
    CLASS_NAME: "HSLayers.Embed.EmbedAdvancedExtJs"    
});