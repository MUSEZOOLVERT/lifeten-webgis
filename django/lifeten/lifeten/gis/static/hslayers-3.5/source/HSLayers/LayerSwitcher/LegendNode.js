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
 * Legend's TreeNode
 *
 * @augments Ext.tree.Node
 * @class HSLayers.LayerSwitcher.LegendNode
 */

HSLayers.LayerSwitcher.LegendNode = Ext.extend(Ext.tree.TreeNode, {

    /**
     * @type OpenLayers.Layer
     */
    layer: undefined,

    /**
     * initComponent
     * @constructor
     */
    constructor: function(config) {
        config = config || {};

        // init
        // defaults 
        Ext.apply(config, {
            leaf: true,
            allowDrag: false
        });

        this.layer = config.layer;

        HSLayers.LayerSwitcher.LayerNode.superclass.constructor.apply(this, arguments);

    },

    /**
     * destroy function
     * @function
     * @private
     */
    destroy: function() {

        HSLayers.LayerSwitcher.LayerNode.superclass.destroy.apply(this, arguments);
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.LegendNode"
});
