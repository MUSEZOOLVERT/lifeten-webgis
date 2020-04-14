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
 * Layer's menu
 *
 * @augments Ext.menu.Menu
 * @class HSLayers.LayerSwitcher.LayerMenu
 */

HSLayers.LayerSwitcher.LayerMenu = Ext.extend(Ext.menu.Menu, {
    /**
     * @type OpenLayers.Layer
     * @name HSLayers.LayerSwitcher.LayerMenu
     */
    layer: null,

    /**
     * @type Ext.Slider
     * @name HSLayers.LayerSwitcher._opacitySlider
     * @private
     */
    _opacitySlider: null,

    /**
     * initComponent
     * @constructor
     */
    initComponent: function() {
        this.layer = this.initialConfig.layer;

        var items = this._initMenuItems();

        // init
        // defaults 
        Ext.apply(this, {
            width: 300,
            plain: true,
            items: items
        });

        HSLayers.LayerSwitcher.LayerMenu.superclass.initComponent.apply(this, arguments);

    },

    /**
     * create list of menu items
     * @function
     * @private
     */
    _initMenuItems: function() {
        var items =  [];

        items.push(this._createTitleItem());
        if (this.layer.abstract) {
            items.push(new Ext.menu.Separator());
            items.push(this._createAbstractItem());
        }
        items.push(new Ext.menu.Separator());
        items.push(this._createScaleItem());
        if (this.layer instanceof OpenLayers.Layer.Vector || this.layer.maxExtent) {
            // && !this.layer.maxExtent.equals(this.layer.map.maxExtent)) {
            items.push(new Ext.menu.Separator());
            items.push(this._createExtentItem());
        }
        items.push(new Ext.menu.Separator());
        items.push({text: OpenLayers.i18n("Opacity: "), canActivate: false});
        items.push(this._createOpacityItem());
        // TODO: time
        // TODO: filter
        if (this.layer.attribution) {
            items.push(new Ext.menu.Separator());
            items.push(this._createAttributionItem());
        }
        if (this.layer.metadata.href) {
            items.push(new Ext.menu.Separator());
            items.push(this._createMetadataItem());
        }
        if (this.layer.removable) {
            items.push(new Ext.menu.Separator());
            items.push(this._createRemoveItem());
        }
        return items;
    },

    /**
     * @private
     * @function
     */
    _createTitleItem: function() {
        return new Ext.menu.Item({
            text: this.layer.title || this.layer.name,
            cls: "x-panel-header",
            canActivate: false
        });
    },

    /**
     * @private
     * @function
     */
    _createRemoveItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Remove layer"),
            cls: 'x-btn-text-icon',
            scope:this,  
            handler: function(){
                this.hide();
                this.layer.map.removeLayer(this.layer);
            },
            icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
        });
    },

    /**
     * @private
     * @function
     */
    _createAbstractItem: function() {
        return new Ext.menu.Item({
            html: this.layer.abstract,
            style: {
                "white-space": "normal"
            },
            canActivate: false
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

        if (typeof (this.layer.attribution) == "string") {
            cfg.text = this.layer.attribution;
            cfg.canActivate = false;
        }
        else {
           cfg.text = (this.layer.attribution.title || this.layer.title);
           cfg.hrefTarget = "_blank";
           cfg.href = this.layer.attribution.href;
        }
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

        if (/(application)|(text)\/xml/.test(this.layer.metadata.format)  &&
            (this.layer.metadata.type == "ISO19115:2003" ||
            /TC211/.test(this.layer.metadata.type))) {
            cfg.text = this.layer.title || this.layer.name;
            cfg.hrefTarget = "_blank";
            cfg.href = HSLayers.MetadataViewerURL+escape(this.layer.metadata.href);
        }
        else {
            cfg.text = this.layer.name;
            cfg.hrefTarget = "_blank";
            cfg.href = this.layer.metadata.href;
        }

        return new Ext.menu.Item(cfg);
    },


    /**
     * @private
     * @function
     */
    _createScaleItem: function() {

        // scale
        var minScale = this.layer.wmsMinScale || this.layer.minScale;
        var maxScale = this.layer.wmsMaxScale || this.layer.maxScale;

        var scaleStr = "";

        if (minScale) {
            scaleStr += " 1:"+ Math.round(minScale);
        }

        else if (maxScale) {
            scaleStr += "1:&infin;";
        }

        if (minScale && maxScale) {
            scaleStr += " - ";
        }

        if (maxScale) {
            scaleStr += "1:"+Math.round(maxScale);
        }
        else if (minScale) {
            scaleStr += "&infin;";
        }

        return new Ext.menu.Item({
            html: OpenLayers.i18n("Scale")+": "+scaleStr,
            canActivate: false
        });
    },

    /**
     * @private
     * @function
     */
    _createExtentItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Zoom to layer"),
            handler: this._zoomToLayersExtent,
            cls: 'x-btn-text-icon',
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
                value: this.layer.opacity*100,
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
        this.layer.setOpacity((max-val)/max);
        
    },

    /**
     * @private
     * @function
     */
    _zoomToLayersExtent: function(item, e) {
        var layer = item.parentMenu.layer;
        if (layer instanceof OpenLayers.Layer.Vector) {
            layer.map.zoomToExtent(layer.getDataExtent(),true);
        }
        else {
            layer.map.zoomToExtent(layer.maxExtent,true);
        }
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.LayerMenu"
});
