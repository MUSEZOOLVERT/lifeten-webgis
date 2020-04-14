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
 * Folders's menu
 *
 * @augments Ext.menu.Menu
 * @class HSLayers.LayerSwitcher.FolderMenu
 */

HSLayers.LayerSwitcher.FolderMenu = Ext.extend(Ext.menu.Menu, {
    /**
     * @type HSLayers.LayerSwitcher.FolderNode
     * @name HSLayers.LayerSwitcher.FolderMenu.folderNode
     */
    folderNode: null,

    /**
     * @type Ext.Slider
     * @name HSLayers.LayerSwitcher.FolderMenu._opacitySlider
     * @private
     */
    _opacitySlider: null,

    /**
     * initComponent
     * @constructor
     */
    initComponent: function() {
        this.folderNode = this.initialConfig.folderNode;

        var items = this._initMenuItems();

        // init
        // defaults 
        Ext.apply(this, {
            width: 300,
            plain: true,
            items: items
        });

        HSLayers.LayerSwitcher.FolderMenu.superclass.initComponent.apply(this, arguments);

    },

    /**
     * create list of menu items
     * @function
     * @private
     */
    _initMenuItems: function() {
        var items =  [];

        items.push(this._createTitleItem());
        items.push(new Ext.menu.Separator());
        items.push(this._createExtentItem());
        items.push(new Ext.menu.Separator());
        items.push({text: OpenLayers.i18n("Opacity: "), canActivate: false});
        items.push(this._createOpacityItem());
        // TODO: time
        //items.push(this._createAttributionItem());
        //items.push(this._createMetadataItem());
        items.push(new Ext.menu.Separator());
        items.push(this._createRemoveItem());
        items.push(this._createRemoveFolderItem());
        items.push(this._createRenameItem());

        return items;
    },

    /**
     * @private
     * @function
     */
    _createTitleItem: function() {
        return new Ext.menu.Item({
            text: this.folderNode.text,
            cls: "x-panel-header",
            canActivate: false
        });
    },

    /**
     * @private
     * @function
     */
    _createRenameItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Rename"),
            scope:this,  
            handler: function(){
                this.hide();
                this.folderNode.getOwnerTree().treeEditor.triggerEdit(this.folderNode);
            }
        });
    },

    /**
     * @private
     * @function
     */
    _createRemoveItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Remove layers"),
            cls: 'x-btn-text-icon',
            scope:this,         
            handler: this._onRemoveItemClicked,
            icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
        });
    },

    /**
     * @private
     * @function
     */
    _createRemoveFolderItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Remove folder (shift layers upwards)"),
            cls: 'x-btn-text-icon',
            scope:this,         
            handler: function() {
                    while(this.folderNode.childNodes.length > 0) {
                        var node = this.folderNode.childNodes[0];
                        this.folderNode.parentNode.insertBefore(node,this.folderNode);
                        if (node.layer) {
                            node.setLayerPath();
                        }
                    }
                    this.folderNode.remove(true);
            },
            icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
        });
    },

    /**
     * @private
     * @function
     */
    _createAttributionItem: function() {
        var cfg = {};
        cfg.cls = 'x-btn-text-icon';
        cfg.icon = OpenLayers.Util.getImagesLocation()+"/copyright.gif";
        cfg.handler = this._onAttributionItemClicked;
        cfg.scope = this;
        cfg.text = OpenLayers.i18n("Layer")+" "+OpenLayers.i18n("Attribution");

        return new Ext.menu.Item(cfg);
    },

    /**
     * @private
     * @function
     */
    _createMetadataItem: function() {
        var cfg = {};
        cfg.cls = 'x-btn-text-icon';
        cfg.icon = OpenLayers.Util.getImagesLocation()+"/info_blue.png";
        cfg.handler = this._onMetadataItemClicked;
        cfg.scope = this;
        cfg.text = OpenLayers.i18n("Layer")+" "+OpenLayers.i18n("Metadata");

        return new Ext.menu.Item(cfg);
    },

    /**
     * @private
     * @function
     */
    _createExtentItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Zoom to layers"),
            handler: this._zoomToFolderExtent,
            cls: 'x-btn-text-icon',
            scope:this,
            icon: OpenLayers.Util.getImagesLocation()+"/zoom-to-layer.png"
        });
    },

    /**
     * @private
     * @function
     */
    _createOpacityItem: function() {
        this._opacitySlider = new Ext.Slider({
                title: OpenLayers.i18n("Opacity"),
                width: (this.initialConfig.width || 300) - 40,
                minValue: 0,
                value: 0,
                plugins: new Ext.slider.Tip({
                    getText: function(thumb){
                        return String.format('{0}%', thumb.value);
                    }
                }),
                listeners: {
                            drag:this._onOpacitySliderDrag,
                            change:this._onOpacitySliderDrag,
                            scope: this
                },
                maxValue: 100
        });

        return new Ext.ButtonGroup({
            items: [ this._opacitySlider ],
            style: {
                "margin-left": "20px"
            }
        });
    },

    /************************ Handlers ************************/
    _onOpacitySliderDrag: function(e) {
        var min = this._opacitySlider.minValue;
        var max = this._opacitySlider.maxValue;
        var val = this._opacitySlider.getValue();

        this.folderNode.cascade(function(opacity) {
            if (this.layer) {
                this.layer.setOpacity((max-opacity)/max);
            }
        },undefined, [val]);
        
    },

    /**
     * @private
     * @function
     */
    _zoomToFolderExtent: function(item, e) {

        // get the OpenLayers map from some layer
        var obj = {};
        this.folderNode.cascade(function(obj) {
            if (this.layer) {
                obj.map = this.layer.map;
            }
        },undefined,[obj]);

        var map = obj.map;

        // now get the extent
        obj = {};
        this.folderNode.cascade(function(obj) {

            if (this.layer) {
                var layer = this.layer;

                // get extent from vector
                if (layer instanceof OpenLayers.Layer.Vector) {
                    if (obj.extent) {
                        var extent = layer.getDataExtent();
                        if (extent) {
                            obj.extent.extend();
                        }
                    }
                    else {
                        obj.extent = layer.getDataExtent();
                    }
                }
                // get extent from raster
                else {
                    if (obj.extent) {
                        obj.extent.extend(layer.maxExtent);
                    }
                    else {
                        obj.extent = layer.maxExtent;
                    }
                }
            }

        }, undefined, [obj]);

        var extent = obj.extent;

        // zoom
        map.zoomToExtent(extent, true);

    },

    /**
     * @private
     * @function
     */
    _onAttributionItemClicked: function() {

        this.folderNode.cascade(function() {
            if (this.layer && this.layer.attribution && this.layer.attribution.href) {
                window.open(HSLayers.MetadataViewerURL+escape(this.layer.attribution.href), "_blank");
            }
        }, undefined);
    },

    /**
     * @private
     * @function
     */
    _onMetadataItemClicked: function() {

        // fore each layer, open metadata in new window
        this.folderNode.cascade(function(){

            if (this.layer && this.layer.metadata && this.layer.metadata.href) {
                if (/(application)|(text)\/xml/.test(this.layer.metadata.format)  &&
                    (this.layer.metadata.type == "ISO19115:2003" ||
                    /TC211/.test(this.layer.metadata.type))) {
                        window.open(HSLayers.MetadataViewerURL+escape(this.layer.metadata.href), "_blank");
                }
                else {
                    window.open(this.layer.metadata.href, "_blank");
                }
            }

        },undefined);
    },

    /**
     * @function
     * @private
     */
    _onRemoveItemClicked: function() {

        var remove = {};
        remove.removable = [];
        remove.folders = [];

        // collect removable layers
        this.folderNode.cascade(function(remove) {
            if (this instanceof HSLayers.LayerSwitcher.LayerNode &&
                this.layer && this.layer.map) {
                if (this.layer.removable) {
                    remove.removable.push(this);
                }
            }
        },undefined,[remove]);

        // remove removable layers
        if (remove.removable.length > 0) {
            var map = remove.removable[0].layer.map;
            for (var i = 0, len = remove.removable.length; i < len; i++) {
                map.removeLayer(remove.removable[i].layer);
            }
        }

        // remove empty folders
        var removeMe = function() {
            if (this.childNodes.length > 0) {
                for (var i = 0; i < this.childNodes.length; i++) {
                    removeMe.apply(this.childNodes[i],[]);
                }
            }
            if (this instanceof HSLayers.LayerSwitcher.FolderNode  &&
                    this.childNodes.length === 0) {
                this.parentNode.removeChild(this);
            }
        };

        removeMe.apply(this.folderNode,[]);
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.FolderMenu"
});
