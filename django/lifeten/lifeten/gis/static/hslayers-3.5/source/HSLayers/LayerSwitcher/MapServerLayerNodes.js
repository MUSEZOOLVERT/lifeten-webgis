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
 * @class HSLayers.LayerSwitcher.MapServerLayerNode
 */

HSLayers.LayerSwitcher.MapServerLayerNode = Ext.extend(HSLayers.LayerSwitcher.LayerNode, {
    /**
     * @type OpenLayers.Layer
     * @name HSLayers.LayerSwitcher.MapServerLayerNode
     */
    layer: null,

    /**
     * icon
     * @default maplayer.png
     * @type {String}
     * @name HSLayers.LayerSwitcher.MapServerLayerNode.icon
     */
    icon: null,

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

        HSLayers.LayerSwitcher.MapServerLayerNode.superclass.constructor.apply(this, [config]);

        this._getLayerTree();
    },

    /**
     * destroy function
     * @function
     * @private
     */
    destroy: function() {

        this.layer.events.unregister("loadstart",this,this._onLoadStart);
        this.layer.events.unregister("loadend",this,this._onLoadEnd);
        this.layer.events.unregister("loadcancel",this,this._onLoadCancel);
        this.layer.events.unregister("visibilitychanged",this,this._onVisibilityChanged);
        this.layer.map.events.unregister("moveend", this, this._onMoveEnd);

        HSLayers.LayerSwitcher.MapServerLayerNode.superclass.destroy.apply(this, arguments);
    },

    /**
     * Called, when layer begin to load
     * 
     * @private
     * @function
     */ 
    _onLoadStart: function(e) {
        // var layer = e.object;
        this.setIcon(OpenLayers.Util.getImagesLocation()+"indicator.gif");
    },

    /**
     * Called, when layer ended to load
     *
     * @private
     * @function
     */ 
    _onLoadEnd: function(e) {
        // var layer = e.object;
        this.setIcon(OpenLayers.Util.getImagesLocation()+"maplayer.png");
    },

    /**
     * Called, when layer loading was canceled
     * 
     * @private
     * @function
     */ 
    _onLoadCancel: function(e) {
        // TODO: Make icon of the layer in the layerswitcher (both panels)
        // to something normal, maybe indicate some error ?
        var layer = e.object;
        this.setIcon(OpenLayers.Util.getImagesLocation()+"maplayer-cancel.png");
    },

    /**
     * Called, when layer visibility was changed
     * 
     * @private
     * @function
     */ 
    _onVisibilityChanged: function(e) {
        // TODO: Check or Uncheck the checkbox
        var layer = e.object;
        if (this.getUI().isChecked() != layer.getVisibility()) {
            this.getUI().toggleCheck(layer.getVisibility());
        }
    },

    /**
     * Called, when check was changed
     * @private
     * @function
     */
    _onCheckChange: function(node, checked){
        if (this.layer.getVisibility() != checked) {
            this.layer.setVisibility(checked);
        }
    },

    /**
     * map moved, toggle disabled node
     * @private
     * @function
     */
    _onMoveEnd: function() {

        // toggle disabled node
        if (this.layer.calculateInRange()) { 
            this.getUI().removeClass("disabledNode");
        }
        else {
            this.getUI().addClass("disabledNode");
        }

    },

    /**
     * add legend nodes to this layer node
     * @private
     * @function
     */
    _addLegendNodes: function() {
    
        if (this.layer.legend) {
            var legends = (this.layer.legend.length ? 
                            this.layer.legend : 
                            [ this.layer.legend ]);


            for (var i = 0, len = legends.length; i < len; i++) {
                this.appendChild(
                        new HSLayers.LayerSwitcher.LegendNode({
                            icon: legends[i].href
                        })
                    );
            }
        }

        // define local function. It will set CSS size properties (width &
        // height) of legend icon to "auto"
        var setAutoSize = function() {
            this.childNodes.map(
                function(node) {
                    node.getUI().getIconEl().style.width = "auto";
                    node.getUI().getIconEl().style.height = "auto";
                })

            // unregister this event, once it is done
            // we do not have to call it every time, layer is rendered
            this.removeListener("expand",setAutoSize,this);
        };

        // register "expand" event to this layer node and call the
        // previsously defined function
        this.addListener("expand",setAutoSize, this);
    },

    /**
     * show layer menu
     * @function
     * @private
     */
    _onShowLayerMenuClicked: function(node,e) { 
        
        var menu = new HSLayers.LayerSwitcher.LayerMenu({
            layer: node.layer
        });
        menu.show(node.getUI().textNode);
    },

    /**
     * setLayerPath from this node
     * @name HSLayers.LayerSwitcher.MapServerLayerNode.setLayerPath
     * @function
     * @private
     */
    setLayerPath: function() { 
        var path = this.getPath("text").split(this.getOwnerTree().pathSeparator).slice(2);
        path = path.slice(0,path.length-1).join(this.getOwnerTree().pathSeparator);
        if (this.layer.path != path)  {
            this.layer.path = path;
        }

        return path;
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.MapServerLayerNode"
});
