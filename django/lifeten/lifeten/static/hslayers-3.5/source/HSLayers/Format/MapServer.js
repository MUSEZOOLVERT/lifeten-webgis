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

HSLayers.namespace("HSLayers.Format","HSLayers.Format.MapServer");
/**
 * Read HSLayers.Layer.MapServer format
 * This class is not intende to be used for wring
 * @class HSLayers.Format.MapServer
 * @augments OpenLayers.Format.JSON
 */
HSLayers.Format.MapServer = OpenLayers.Class(OpenLayers.Format.JSON, {

    read: function() {
        var data = OpenLayers.Format.JSON.prototype.read.apply(this,arguments);
        var out = new HSLayers.Layer.TreeLayer.Group({});

        for (var name in data) {
            var newObj;
            if (data[name].isGroup) {
                newObj = this.obj2group(name, data[name]);
            }
            else if (data[name].isLayer) {

                newObj = this.obj2layer(name, data[name]);
            }

            if (newObj) {
                out.appendChild(newObj);
            }
        }

        return out;
    },

    obj2group: function(name,obj) {
        var group = new HSLayers.Layer.TreeLayer.Group({
                            name: name,
                            title: obj.title}); 

        for (var name in obj) {
            var newObj;
            if (obj[name].isGroup) {
                newObj = this.obj2group(name, obj[name]);
            }
            else if (obj[name].isLayer) {
                newObj = this.obj2layer(name, obj[name]);
            }

            if (newObj) {
                group.appendChild(newObj);
            }
        }
        return group;
    },
    
    obj2layer: function(name, obj) {
        return new HSLayers.Layer.TreeLayer.Layer({
                        name: name,
                        maxScale: obj.maxScale,
                        minScale: obj.minScale,
                        queryable: obj.queryable,
                        visibility: !!obj.visible,
                        attribution: obj.attribution,
                        title: obj.title,
                        legendUrl: obj.legendURL,
                        editable: obj.edit ? true : false,
                        hsswitch: obj.hsSwitch,
                        edit: obj.edit
                    }); 
    },

    CLASS_NAME: "HSLayers.Format.MapServer"
});
