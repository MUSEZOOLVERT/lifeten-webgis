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
HSLayers.namespace("HSLayers.Control","HSLayers.Control.Click");

/**
 * Click control is used for others high-level controls, which are using
 * clicks in the map.
 *
 * @class HSLayers.Control.Click
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control-js.html">OpenLayers.Control</a>
 *
 */
HSLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                

    /**
     * default options for <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Handler-js.html">OpenLayers.Handler</a>
     * @private
     * @name HSLayers.Control.Click.defaultHandlerOptions
     */
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },

    /**
     * @constructor
     * @function
     * @name HSLayers.Control.Click.initialize
     *
     * @param {Object} options
     * @param {Object} options.handlerOptions
     */
    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions
            );
        OpenLayers.Control.prototype.initialize.apply(
            this, arguments
            ); 
        this.handler = new OpenLayers.Handler.Click(
            this, {
                'click': this.onClick,
                'dblclick': this.onDblclick 
                }, this.handlerOptions
            );
    }, 

    /**
     * empty onClick method
     * to be redefined in higher-level controls
     * @name HSLayers.Control.Click.onClick
     * @function
     * @param {Event} evt
     */
    onClick: function(evt) {
    },

    /**
     * empty onDblclick method
     * to be redefined in higher-level controls
     * @name HSLayers.Control.Click.onDblclick
     * @function
     * @param {Event} evt
     */
    onDblclick: function(evt) {  
    },

    /**
     * @name HSLayers.Control.Click.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.Click"
});

OpenLayers.Control.HSClick = HSLayers.Control.Click;
