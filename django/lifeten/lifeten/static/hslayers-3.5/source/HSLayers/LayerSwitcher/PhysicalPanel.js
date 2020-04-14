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

/**
 * Logical Panel of LayerSwitcher
 *
 * @augments Ext.Panel
 * @class HSLayers.LayerSwitcher.PhysicalPanel
 */

HSLayers.LayerSwitcher.PhysicalPanel = Ext.extend(HSLayers.LayerSwitcher.Panel, {

    /**
     * @name HSLayers.LayerSwitcher.title
     * @type {String}
     */
    title: "Physical Order",

    /**
     * @name HSLayers.LayerSwitcher._physicalTreeSorter
     * @type Ext.tree.TreeSorter
     * @private
     */
    _physicalTreeSorter: undefined,

    /**
     * @private
     */
    initComponent: function() {

        this.title = OpenLayers.i18n(this.title);
        this.tabTip = OpenLayers.i18n("Organize layer order in the map");

        HSLayers.LayerSwitcher.PhysicalPanel.superclass.initComponent.apply(this, arguments);

        // register drat
        this.addListener("dragdrop",this._onDragDrop, this);

    },

    /**
     * drag drop event handler
     * @private
     * @function
     */
    _onDragDrop: function(thisPanel, node, dd, e) {
                     
        // node index
        var nodeidx = thisPanel.getRootNode().indexOf(node); 

        // new and old inex of the layer
        var newidx, oldidx;
        newidx = oldidx = this.map.getLayerIndex(node.layer);

        // steal index from other layer in the layer tree
        if (nodeidx < this.getRootNode().childNodes.length - 1) {
            newidx = this.map.getLayerIndex(thisPanel.getRootNode().childNodes[nodeidx+1].layer);
        }
        else {
            newidx = this.map.getLayerIndex(thisPanel.getRootNode().childNodes[this.getRootNode().childNodes.length-1].layer)-2;
        }

        // if mooving "down", we have to add one more
        if (newidx < oldidx) {
            newidx++;
        }

        // reorder layers
        if (newidx != oldidx) {
            this.map.setLayerIndex(node.layer, newidx);
        }
    },
    
    /**
     * @function
     * @private
     */
    setMap: function(map) {
        HSLayers.LayerSwitcher.PhysicalPanel.superclass.setMap.apply(this,arguments);

        this.map.events.register("changelayer",this,this._onLayerChanged);

        // create the TreeSorter
        this._physicalTreeSorter = new Ext.tree.TreeSorter(this, {
            folderSort: false,
            dir: "desc",
            property: "layer",
            sortType: function(layer) { // sort according to layer index
                return layer.map.getLayerIndex(layer);
            }
        });
    },

    /**
     * @function
     * @private
     */
    destroy: function() {

        this.map.events.unregister("changelayer",this,this._onLayerChanged);

        HSLayers.LayerSwitcher.superclass.destroy.apply(this, arguments);
    },

    /**
     * @function
     * @private
     */
    _onLayerChanged: function(e) {
        // resort
        if (e.property == "order") {
            this._physicalTreeSorter.doSort(this.getRootNode());
        }
        HSLayers.LayerSwitcher.PhysicalPanel.superclass._onLayerChanged.apply(this,arguments);
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.PhysicalPanel"
});
