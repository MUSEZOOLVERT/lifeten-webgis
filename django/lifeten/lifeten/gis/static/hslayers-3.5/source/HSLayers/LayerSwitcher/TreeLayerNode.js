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
 * Layer's TreeNode for HSLayers.Layer.MapServer
 *
 * @augments Ext.tree.Node
 * @class HSLayers.LayerSwitcher.TreeLayerNode
 */

HSLayers.LayerSwitcher.TreeLayerNode = Ext.extend(HSLayers.LayerSwitcher.LayerNode, {
    /**
     * @type OpenLayers.Layer
     * @name HSLayers.LayerSwitcher.TreeLayerNode
     */
    layer: null,

    /**
     * icon
     * @default maplayer.png
     * @type {String}
     * @name HSLayers.LayerSwitcher.TreeLayerNode.icon
     */
    icon: null,

    leaf:false,

    /**
     * initComponent
     * @constructor
     */
    constructor: function(config) {
        config = config || {};
        this.layer = config.layer;

        // init
        // defaults 
        Ext.apply(config, {
            checked: undefined,
            leaf: false
        });


        HSLayers.LayerSwitcher.TreeLayerNode.superclass.constructor.apply(this, [config]);

        // set indicator, if loading 
        if (this.layer.loadingTree) {
            this.setIcon(OpenLayers.Util.getImagesLocation()+"indicator.gif");
        }
       
        this.layer.events.register("layerloaded",this,this._makeLayerTree);
        this.layer.events.register("loadstart",this,this._onLoadStart);
    },

    /**
     * @function
     * @private
     */
    destroy: function() {
        this.layer.events.unregister("layerloaded",this,this._makeLayerTree);
        HSLayers.LayerSwitcher.TreeLayerNode.superclass.destroy.apply(this, arguments);
    },

    /**
     * Called, when layer ended to load
     *
     * @private
     * @function
     */ 
    _onLoadEnd: function(e) {
        // var layer = e.object;
        if (this.layer.loadingTree === false) {
            this.setIcon(OpenLayers.Util.getImagesLocation()+(this._queryable ? "maplayer-queryable.png" : "maplayer.png"));
        }
    },

    /**
     * @function
     * @private
     */
    _makeLayerTree: function() {
        this._makeLayerTreeRecursive(this,this.layer.baseGroup);
        this.setIcon(OpenLayers.Util.getImagesLocation()+(this._queryable ? "maplayer-queryable.png" : "maplayer.png"));

        if (this._expanded) {
            this.expand();
        }

        this._onMoveEnd();
    },

    /**
     * @function
     * @private
     */
    _makeLayerTreeRecursive: function(node,group) {
        var newNode;
        var childs = group.childs;

        for (var i = 0, len = childs.length; i < len; i++) {
            var obj = childs[i];
            if (obj instanceof HSLayers.Layer.TreeLayer.Group) {
                newNode = new HSLayers.LayerSwitcher.TreeLayerFolderNode({
                    group: obj
                });

                this._makeLayerTreeRecursive(newNode, obj);
            }
            else if (obj instanceof HSLayers.Layer.TreeLayer.Layer) {
                // toggle disabled node
                var discls = obj.calculateInRange() ? "" : "notinscale";
                var discls = obj.layer.calculateInRange() ? "" : "notinscale";
                newNode = new Ext.tree.TreeNode({
                        checked: obj.visibility, 
                        allowChildren: true,
                        allowDrag: false,
                        allowDrop: false,
                        expanded : false,
                        leaf : !obj.legendUrl,
                        editable: false,
                        text : obj.title,
                        cls:"LayerSwitcherTreeLayerNode "+discls,
                        expandable: !!obj.legendUrl,
                        icon: OpenLayers.Util.getImagesLocation()+(obj.queryable ?  "maplayer-queryable.png" : "maplayer.png"),
                        layer: obj,
                        listeners: {
                            scope: obj,
                            checkchange: function(node, checked) {

                                // toggle visibility, do not redraw
                                this.toggleVisibility(checked,false);

                                // uncheck all nodes based on hsswitch
                                // attribute
                                node.getOwnerTree().getRootNode().cascade(function(hsswitch,layer,node) {
                                    // uncheck, if
                                    if ((node.getUI().checkbox && node.getUI().checkbox.checked) && // checkbox was checked
                                        (this.layer && this.layer instanceof HSLayers.Layer.TreeLayer.Layer) && // it's about TreeLayer
                                        (this.layer.hsswitch && this.layer.hsswitch == hsswitch) && // hsswitch attributes match
                                        (this.layer != layer)) { // it is different layer, than this

                                        // unecheck now
                                        this.layer.toggleVisibility(false,false);
                                    }
                                }, undefined, [this.hsswitch,this,node]);

                                // redraw
                                this.layer.redraw(true);
                            }
                        }
                    });
                newNode.layer = obj;

                if (obj.legendUrl) {
                    newNode.appendChild(new HSLayers.LayerSwitcher.LegendNode({
                            icon: obj.legendUrl
                        })
                    );
                    this._addResizeEventToLegendNode(newNode);
                }
            }
            node.appendChild(newNode);

            obj.events.register("visibilitychanged",newNode,this._onTreeNodeChecked);

            if (obj.visibility) {
                node.expanded = true;
                this._expanded = true;
            }
        }
    },

    /**
     * function called with different scope, when treenode is toggled
     * @private
     * @function
     */
    _onTreeNodeChecked: function(e) {

        this.checked = e.visibility;
        this.attributes.checked = e.visibility;

        if (this.getUI().isChecked() != e.visibility) {
            if (this.getUI().checkbox) {
                this.getUI().checkbox.checked = e.visibility; 
                this.checked = e.visibility;

            }

            //this.bubble(function(visibility) {
            //    if (this.group) {
            //        this.getUI().checkbox.indeterminate = true;
            //        this.checkState = 1;
            //    }
            //} , undefined);
        }
    },

    /**
     * map moved, toggle disabled node
     * @private
     * @function
     */
    _onMoveEnd: function() {
        HSLayers.LayerSwitcher.TreeLayerNode.superclass._onMoveEnd.apply(this, arguments);

        this.cascade(function(node) {
                if (node.layer) {
                    if (node == this) {
                        return;
                    }

                    // max: 200 000 000
                    // min: 500
                    var minScale = node.layer.minScale == -1 ? this.layer.maxScale : node.layer.minScale;
                    var maxScale = node.layer.maxScale == -1 ? this.layer.minScale : node.layer.maxScale;
                    var scale = this.layer.map.getScale();

                    //if (minScale <= scale && scale <= maxScale ) {
                    if (node.layer.calculateInRange()) {
                        node.getUI().removeClass("notinscale");
                    }
                    else {
                        node.getUI().addClass("notinscale");
                    }

                    
            }
        }, this,undefined);

    },

    CLASS_NAME: "HSLayers.LayerSwitcher.TreeLayerNode"
});
