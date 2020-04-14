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
HSLayers.namespace("HSLayers.Metadata");

/**
 * map metadata
 *
 * @class
 * @name HSLayers.Metadata
 * @augments OpenLayers.Class
 *
 */
HSLayers.Metadata = OpenLayers.Class({

    title: undefined,
    id: undefined,
    abstract: undefined,
    keywords: undefined,

    /**
     * events
     * * change - any change
     */
    events: undefined,

    /**
     * Initialize
     * @constructor
     * @param {Object} options
     */
    initialize: function(options) {

        OpenLayers.Util.extend(this, options);

        this.events = new OpenLayers.Events(this);

        if (!this.keywords) {
            this.keywords = [];
        }
    },

    /**
     * set values
     * @function
     * @name HSLayers.Map.set
     * @param object options
     */
    set: function(options) {
        var k;
        for (k in this) {
            if (options[k] !== undefined) {
                this[k] = options[k];
            }
        }

        this.events.triggerEvent("change",this);
    },

    /**
     * get as json
     */
    get: function() {
        return {
            title: this.title,
            id: this.id,
            abstract: this.abstract,
            keywords: this.keywords
        };
    },

    CLASS_NAME: "HSLayers.Metadata"
});
