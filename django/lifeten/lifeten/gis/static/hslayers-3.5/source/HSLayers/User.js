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
HSLayers.namespace("HSLayers.User");

/**
 * Logged in user
 *
 * @class
 * @name HSLayers.User
 * @augments OpenLayers.Class
 *
 */
HSLayers.User = OpenLayers.Class({

    name: undefined,
    organization: undefined,
    position: undefined,
    address: undefined,
    city: undefined,
    state: undefined,
    postalcode: undefined,
    country: undefined,
    phone: undefined,
    email: undefined,
    url: undefined,

    /**
     * events
     * * change - any change
     */
    events: undefined,

    /**
     * Initialize
     * @constructor
     * @name HSLayers.InitBus.initialize
     * @param {Object} options
     */
    initialize: function(options) {

        OpenLayers.Util.extend(this, options);

        this.events = new OpenLayers.Events(this);
    },

    /**
     * set values
     * @function
     * @name HSLayers.User.set
     * @param object options
     */
    set: function(options) {
        var k;
        options = options || {};
        for (k in this) {
            if (options[k] !== undefined) {
                this[k] = options[k];
            }
        }

        this.events.triggerEvent("change",this);
    },

    /**
     * get json
     */
    get: function() {
        return {
            name: this.name,
            organization: this.organization,
            position: this.position,
            address: this.address,
            city: this.city,
            state: this.state,
            postalcode: this.postalcode,
            country: this.country,
            phone: this.phone,
            email: this.email,
            url: this.url
        };
    },

    CLASS_NAME: "HSLayers.User"
});
