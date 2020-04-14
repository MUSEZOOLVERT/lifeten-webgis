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

/**
 * General embedding of map into the HTML page
 * @static
 * @function
 * @name HSLayersEmbed
 */
HSLayersEmbed = function() {

    this._generateFrameMarkup = function() { 
        var iframeUrl = 
            this.baseUrl + this.scriptPath + 
            "?t=" + this.type +
            "&w=" + this.width +
            "&h=" + this.height +
            "&p=" + this.permalink;
            
        var scroll = "no";
        if (this.autoResize == false) {
            scroll = "auto";
        }        
        var src = 
            '<iframe id="' + this.mapId + '" height="' + this.height + '" allowTransparency="true" frameborder="0" scrolling="'+
            scroll + '" style="width:' + this.width + ';border:none"' + 'src="' + iframeUrl + '"></iframe>';            
        return src;
    },
    
    this.initialize = function(params) {
        for (key in params) {
            this[key] = params[key];
        }
    },
    
    this.display = function() {
        document.write(this._generateFrameMarkup());
    }    
};

