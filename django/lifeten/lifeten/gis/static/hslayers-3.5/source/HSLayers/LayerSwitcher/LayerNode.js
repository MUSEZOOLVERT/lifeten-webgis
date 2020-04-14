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
i * HSLayers is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 *  See http://www.gnu.org/licenses/gpl.html for the full text of the 
 *  license.
 */

/**
 * Layer's TreeNode
 *
 * @augments Ext.tree.Node
 * @class HSLayers.LayerSwitcher.LayerNode
 */

HSLayers.LayerSwitcher.LayerNode = Ext.extend(Ext.tree.TreeNode, {
    /**
     * @type OpenLayers.Layer
     * @name HSLayers.LayerSwitcher.LayerNode
     */
    layer: null,

    /**
     * icon
     * @default maplayer.png
     * @type {String}
     * @name HSLayers.LayerSwitcher.LayerNode.icon
     */
    icon: null,

    /**
     * Filter window
     * @type Ext.Window
     * @name HSLayers.LayerSwitcher.LayerNode._filterWindow
     */
    _filterWindow : null,

    /**
     * initComponent
     * @constructor
     */
    constructor: function(config) {
        config = config || {};
        this.layer = config.layer;
        this._queryable = this.layer.queryable;
        if (this.layer.params && this.layer.params.INFO_FORMAT) {
            this._queryable = true;
        }

        // init
        // defaults 
        Ext.apply(config, {
            checked: config.layer.visibility,
            allowDrop: false,
            text: config.layer.title || config.layer.name,
            leaf: (config.layer.metadata || config.layer.legend || config.leaf === false ? false : true),
            allowDrag: !config.layer.isBaseLayer,
            cls: (config.layer.calculateInRange() ? "" : "disabledNode"),
            icon: OpenLayers.Util.getImagesLocation()+(this._queryable ? "maplayer-queryable.png" : "maplayer.png"),
            uiProvider: HSLayers.LayerSwitcher.LayerNodeUI
        });

        HSLayers.LayerSwitcher.LayerNode.superclass.constructor.apply(this, [config]);

        // listeners
        this.addListener("checkchange",this._onCheckChange, this);
        this.addListener("contextmenu",this._onShowLayerMenuClicked, this);
        this.addListener("click",this._onShowLayerMenuClicked, this);
        
        // register events
        if (this.layer)  {
            this.layer.events.register("loadstart",this,this._onLoadStart);
            this.layer.events.register("loadend",this,this._onLoadEnd);
            this.layer.events.register("loadcancel",this,this._onLoadCancel);
            this.layer.events.register("visibilitychanged",this,this._onVisibilityChanged);
            this.layer.map.events.register("moveend", this, this._onMoveEnd);
        }

        // add some legend nodes
        this._addLegendNodes();

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

        HSLayers.LayerSwitcher.LayerNode.superclass.destroy.apply(this, arguments);
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
        this.setIcon(OpenLayers.Util.getImagesLocation()+(this._queryable ? "maplayer-queryable.png" : "maplayer.png"));

        // set text
        if (this._titleSet === undefined && this.layer instanceof OpenLayers.Layer.Vector) {
            if (this.layer.protocol && this.layer.protocol.format instanceof OpenLayers.Format.KML) {
                var format = this.layer.protocol.format;
                var title = this.layer.title;
                if (format.document && format.document.name && format.folder && format.folder.name) {
                    if (this.layer.title == this.layer.name) {
                        title = format.folder.name;
                    }
                }

                this.layer.title = title;
                this.setText(title);
            }
            this._titleSet = true;
        }
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

        // set layer visibility
        if (this.layer.getVisibility() != checked) {
            this.layer.setVisibility(checked);
            
            // parent node set to indeterminate
            //if (this.parentNode instanceof HSLayers.LayerSwitcher.FolderNode) {
            //    this.parentNode.checkState = 1;
            //    this.parentNode.getUI().checkbox.indeterminate = true;
            //}
        }
        
        // uncheck all layers with same hsSwitch attribute
        if (this.layer.hsSwitch && checked === true) {
            var switchLayers = this.layer.map.getLayersBy("hsSwitch",this.layer.hsSwitch);

            if (switchLayers.length > 1) {
                for (var i = 0, len = switchLayers.length; i < len; i++) {
                    if (switchLayers[i] != this.layer) {
                        switchLayers[i].setVisibility(false);
                    }
                }
            }
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
    
        if (this.layer.metadata && this.layer.metadata.styles) {

            var obj = {name: this.layer.params.STYLES};
            if (OpenLayers.Util.isArray(this.layer.metadata.styles)) {
                this.layer.metadata.styles.map(function(mystyle) {
                    if (mystyle.name == this.name) {
                        this.style = mystyle;
                    }
                },obj);
            }
            
            if (obj.style && obj.style.legend) {
                this.appendChild(
                        new HSLayers.LayerSwitcher.LegendNode({
                            layer: this.layer,
                            icon: obj.style.legend.href
                        })
                    );
            }
        }

        else if (this.layer.legend) {
                var legend  = this.layer.legend;
                if (!OpenLayers.Util.isArray(this.layer.legend)) {
                    legend = [this.layer.legend];    
                }
                for (var i = 0, len = legend.length; i < len; i++) {
                    this.appendChild(
                            new HSLayers.LayerSwitcher.LegendNode({
                                layer: this.layer,
                                icon: legend[i].href
                            })
                        );
                }
        }

        this._addResizeEventToLegendNode(this);
    },

    /**
     * add resize event to legend node
     * @private
     * @function
     */
    _addResizeEventToLegendNode: function(node) {
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
        node.addListener("expand",setAutoSize, node);
    },

    /**
     * show layer menu
     * @function
     * @private
     */
    _onShowLayerMenuClicked: function(node,e) { 
        
        var menu = new HSLayers.LayerSwitcher.LayerMenu({
            layer: node.layer,
            layerNode: node
        });
        menu.show(node.getUI().textNode);
        Ext.QuickTips.init();
    },

    /**
     * setLayerPath from this node
     * @name HSLayers.LayerSwitcher.LayerNode.setLayerPath
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

    /**
     * Open window with FES Filter
     * @name HSLayers.LayerSwitcher.LayerNode.openFilterWindow
     * @function
     */
    openFilterWindow: function() {
        // Create the window
        if (!this._filterWindow) {
            var title = this.layer.title || this.layer.name;
            title += " - " + OpenLayers.i18n("Filter");
            this._filterWindow = new Ext.Window({
                title: title,
                closeAction: 'hide' // don't destroy the window, just hide it
            });

            // Create the filter form
            filterForm = new HSLayers.LayerSwitcher.FilterForm({
                filter: this.layer.filter,
                // layerNode: this,
                layer: this.layer, 
                window: this._filterWindow
            });
            this._filterWindow.add(filterForm);
        }

        // Show the window
        this._filterWindow.setSize(580,100);
        this._filterWindow.setPosition(300,200);
        this._filterWindow.show();
    },

    /**
     * Get structure of this node
     * @name HSLayers.LayerSwitcher.LayerNode.getStructure
     * @function
     */
    getStructure: function() {
        return {name: this.layer.name, type:"layer"};
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.LayerNode"
});
