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

Ext4.define("HSLayers.TimeSlider.LayerMenu",{
    extend: 'Ext.menu.Menu',
    layer: undefined,
    min: undefined,
    max: undefined,

    /**
     * @constructor
     */
    constructor: function(config) {
        this.layer = config.layer;
        this.min = parseInt(config.min,10);
        this.max = parseInt(config.max,10);
        var mindate = new Date(this.min);
        var maxdate = new Date(this.max);
        config.items = [
            {
                text:"min: "+Ext4.String.format("{0}.{1}.{2} {3}",
                    mindate.getDate(), mindate.getMonth()+1,mindate.getFullYear(),
                    mindate.toLocaleTimeString())
            },
            {
                text:"max: "+ Ext4.String.format("{0}.{1}.{2} {3}",
                            maxdate.getDate(),maxdate.getMonth()+1,maxdate.getFullYear(),
                            maxdate.toLocaleTimeString())
            },
            "-",
            {
                text: OpenLayers.i18n("Zoom to"),
                scope:this,
                handler: this._onZoomClicked
            }
        ];

        config.title = this.layer.title || this.layer.name;

        this.callParent(arguments);
        
        this.addEvents({
            zoomto: true
        });
    },

    /**
     * on zoom clicked handler
     * @function
     * @private
     */
    _onZoomClicked: function() {

        this.fireEvent("zoomto",{layer: this.layer, time: [this.min, this.max]});
    }
});
