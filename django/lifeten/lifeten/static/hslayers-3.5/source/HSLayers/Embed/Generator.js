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
 * Class for direct generate code for embedding map into the HTML page
 *
 * @class HSLayers.Embed.Generator
 */
HSLayers.Embed.Generator = OpenLayers.Class({ 

    /**
     * @function
     * @name HSLayers.Embed.Generator.initialize
     */     
    initialize: function(options) {        
        // nop;
    }, 
    
    /**
     * @function
     * @name HSLayers.Embed.Generator.generateCode
     * @param {Object} parameters
     * @returns {String}
     */     
    generateCode: function(parameters) {
        var baseUrl = window.location.protocol + "//" + window.location.hostname;
        if (window.location.port) {
            baseUrl += ":" + window.location.port;
        }
        var url = baseUrl + parameters.hslayersPath + "/HSLayers/Embed/Base.js";
        
        var code = 
            '<script type="text/javascript">\n' +
            'var host = document.write(unescape("%3Cscript src=\'' + url + '\' type=\'text/javascript\'%3E%3C/script%3E"));\n' +
            '</script>\n' +
            '<script type="text/javascript">\n' +
            'var embed = new HSLayersEmbed()\n;' +
            'embed.initialize({' +
            'baseUrl: "' + baseUrl + '",' +
            'scriptPath: "' + parameters.scriptPath + '",' +
            'mapId: "' + parameters.mapId + '",' +
            'height: "' + parameters.height + 'px",' +
            'width: "' + parameters.width + 'px",' +
            'type: "' + parameters.mapType + '",' +
            'permalink: "' + parameters.permalink + '"' +
            '});\n' +
            'embed.display();\n' +
            '</script>';
        return code;
    },
    
    /**
     * @name HSLayers.Embed.Generator.CLASS_NAME
     * @type String
     */ 
    CLASS_NAME: "HSLayers.Embed.Generator"    
});
