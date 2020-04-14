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
     * @name HSLayers.LayerSwitcher.LayerMenu.layer
     */
    layer: null,

    /**
     * @type HSLayers.LayerSwitcher.LayerNode
     * @name HSLayers.LayerSwitcher.LayerMenu.layerNode
     * @name 
     */
    layerNode: null,

    /**
     * @type Ext.Slider
     * @name HSLayers.LayerSwitcher._opacitySlider
     * @private
     */
    _opacitySlider: null,

    /**
     * Last selected style
     * @type String
     * @name HSLayers.LayerSwitcher._styleValue
     * @private
     */
    _styleValue: "",

    /**
     * initComponent
     * @constructor
     */
    initComponent: function() {
        this.layer = this.initialConfig.layer;
        this.layerNode = this.initialConfig.layerNode;

        if (this.layer.params && this.layer.params.STYLES) {
            this._styleValue = this.layer.params.STYLES;
        }
        else if (this.layer.params && this.layer.params.SLD) {
            this._styleValue = "_custom_url";
        }
        else {
            this._styleValue = "";
        }

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
            items.push(this._createAbstractItem());
        }
        var scaleItem = this._createScaleItem();
        if (scaleItem) {
            if (items.length > 1) {
                items.push(new Ext.menu.Separator());
            }
            items.push(scaleItem);
        }
        if (this.layer instanceof OpenLayers.Layer.Vector || this.layer.maxExtent) {
            // && !this.layer.maxExtent.equals(this.layer.map.maxExtent)) {
            items.push(new Ext.menu.Separator());
            items.push(this._createExtentItem());

        }
        if (this.layer instanceof OpenLayers.Layer.Vector) {

            items.push(new Ext.menu.Separator());
            items.push(this._createDeleteFeaturesItem());

            var edits = this.layer.map.getControlsBy("CLASS_NAME","HSLayers.Control.UserGraphics");
            //if (edits.length > 0 && this.layer == edits[0].layer) {
            if (edits.length > 0) {
                items.push(new Ext.menu.Separator());
                items.push(this._createEditItem(edits[0]));
            }
        }

        if (this.isWCS() ||
            this.isWFS() ||
            this.layer instanceof OpenLayers.Layer.Vector) {
            items.push(new Ext.menu.Separator());
            items.push(this._createFilterItem(this.layerNode));
            items.push(new Ext.menu.Separator());
            items.push(this._createDownloadItem(this.layerNode));
        }

        items.push(new Ext.menu.Separator());
        items.push({text: OpenLayers.i18n("Opacity")+": ", canActivate: false});
        items.push(this._createOpacityItem());

        if (this.layer.dimensions && this.layer.dimensions.time) {
            items.push(new Ext.menu.Separator());
            items.push({
                text: OpenLayers.i18n("Time")+": ",
                //canActivate: false,
                menu: new Ext.menu.Menu({
                    plain: true,
                    items: [
                        {
                            cls: "x-panel-header",
                            text: OpenLayers.i18n("Time"),
                            canActivate: false
                        },
                        this._createTimeItem()
                    ]
                })
            });
        }

        if (this.layer instanceof OpenLayers.Layer.WMS) {

            items.push(new Ext.menu.Separator());
            items.push({text: OpenLayers.i18n("Style")+": ", canActivate: false});
            items.push(this._createStylesItem());

            if (this.layer.metadata && this.layer.metadata.formats) {
                items.push(new Ext.menu.Separator());
                items.push({text: OpenLayers.i18n("Format")+": ", canActivate: false});
                items.push(this._createFormatsItem());
            }
        }
        items.push(new Ext.menu.Separator());
        items.push(this._createAttributionItem());
        items.push(new Ext.menu.Separator());
        items.push(this._createMetadataItem());
        if (this.layer.capabilitiesURL) {
            items.push(new Ext.menu.Separator());
            items.push(this._createCapabilitiesItem());
        }
        if (this.layer.removable) {
            items.push(new Ext.menu.Separator());
            items.push(this._createRemoveItem());
        }

        if (this.layer._isBaseContextLayer !== true) {
            items.push(new Ext.menu.Separator());
            items.push(this._createRenameItem());
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
    _createRenameItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Rename"),
            //cls: 'x-btn-text-icon',
            scope:this,  
            handler: function(){
                this.hide();
                this.layerNode.getOwnerTree().treeEditor.triggerEdit(this.layerNode);
            }
            //icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
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
    _createSLDItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("SLD"),
            cls: 'x-btn-text-icon',
            scope:this,  
            handler: function(){

            },
            icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
        });
    },


    /**
     * @private
     * @function
     */
    _createAbstractItem: function() {
        var text = this.layer.abstract;
        var t;
        
        if (text.length > 150) { 
            text = this.layer.abstract.substring(0,150)+'... <a name="abstract" style="text-decoration:underline;">'+OpenLayers.i18n("more")+'</a>';
            t = true;
        }

        var item = new Ext.menu.Item({
            html: text,
            style: {
                "white-space": "normal"
            },
            canActivate: false
        });

        // add quicktip - but only after render
        if (t) {
            item.addListener("afterrender", function(item) {
                t = new Ext.ToolTip({
                    target: this.id,
                    trackMouse: true,
                    html: this.text,
                    autoHide: true,
                    dismissDelay: 30000,
                    closable: true,
                    title: this.title
                });

                Ext.QuickTips.init();
            }, {id:item.id, text: this.layer.abstract,title: this.layer.title});
        }

        return item;
    },

    /**
     * @private
     * @function
     */
    _createAttributionItem: function() {
        var cfg = {};
        cfg.cls = 'x-btn-text-icon';
        cfg.icon = OpenLayers.Util.getImagesLocation()+"/copyright.gif";

        if (this.layer.attribution) {
            if (typeof (this.layer.attribution) == "string") {
                cfg.text = this.layer.attribution;
                cfg.canActivate = false;
            }
            else {
            cfg.text = (this.layer.attribution.title || this.layer.title);
            cfg.hrefTarget = "_blank";
            cfg.href = this.layer.attribution.href;
            }
        }
        else {
            cfg.text = OpenLayers.i18n("Copyright info");
            cfg.disabled = true;
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

        if (this.layer.metadataURL && this.layer.metadataURL.href) {

            if (/(application)|(text)\/xml/.test(this.layer.metadataURL.format)) {
                //cfg.text = this.layer.title || this.layer.name;
                cfg.text = OpenLayers.i18n("Layer metadata");
                cfg.hrefTarget = "_blank";
                cfg.href = HSLayers.MetadataViewerURL+escape(this.layer.metadataURL.href);
            }
            else {
                cfg.text = OpenLayers.i18n("Layer metadata");
                cfg.hrefTarget = "_blank";
                cfg.href = (this.layer.metadataURL.href ? this.layer.metadataURL.href : this.layer.metadataURL);
            }
        }
        else {
                cfg.text = OpenLayers.i18n("Layer metadata");
                cfg.disabled = true;
        }

        return new Ext.menu.Item(cfg);
    },

    /**
     * @private
     * @function
     */
    _createCapabilitiesItem: function() {

        var cfg = {};
        cfg.text = OpenLayers.i18n("Get Service Capabilities");
        cfg.href = this.layer.capabilitiesURL;
        var service = "WMS";
        if (this.layer.CLASS_NAME.toLowerCase().search("wfs") > -1) {
            service = "WFS";
        }
        else if (this.layer.CLASS_NAME.toLowerCase().search("wcs") > -1) {
            service = "WCS";
        }
        cfg.listeners = {
            click: function(item, evt){
                this.layerNode.getOwnerTree().ownerCt.fireEvent(
                        "getcapabilitiesclicked",
                        {
                            layer: this.layer,
                            url: this.layer.capabilitiesURL,
                            service: service
                         });
                evt.stopEvent();
            },
            scope: this
        };

        return new Ext.menu.Item(cfg);
    },



    /**
     * @private
     * @function
     */
    _createScaleItem: function() {

        // scale
        var minScale;
        var maxScale;

        // wms layers
        if (this.layer instanceof OpenLayers.Layer.WMS) {
            minScale = this.layer.wmsMinScale;
            maxScale = this.layer.wmsMaxScale;
        }
        // all other layers
        else {
            var map_min = this.layer.map.minScale || this.layer.map.baseLayer.minScale;
            var map_max = this.layer.map.maxScale || this.layer.map.baseLayer.maxScale;

            if (this.layer.minScale && this.layer.minScale != map_min) {
                minScale = this.layer.minScale;
            }
        
            if (this.layer.maxScale && this.layer.maxScale != map_max) {
                maxScale = this.layer.maxScale;
            }
        }


        var scaleStr = "";

        if (minScale && maxScale) {
            scaleStr = "1:"+String(Math.round(minScale))+" - "+
                       "1:"+String(Math.round(maxScale))
        }
        else if (minScale) {
            scaleStr = OpenLayers.i18n("to")+" 1:"+String(Math.round(minScale));
        }
        else if (maxScale) {
            scaleStr = OpenLayers.i18n("from")+" 1:"+String(Math.round(maxScale));
        }
        //

        if (scaleStr !== "") {
            return new Ext.menu.Item({
                html: OpenLayers.i18n("Scale")+": "+scaleStr,
                canActivate: false
            });
        }
        else {
            return null;
        }
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
    _createFilterItem: function(layerNode) {
        return new Ext.menu.Item({
            text:OpenLayers.i18n("Filter"),
            handler: function() {layerNode.openFilterWindow();}
        });
    },

    /**
     * @private
     * @function
     */
    _createDownloadItem: function(layerNode) {
        if (this.isWFS() || this.isWCS()) {
            var href;

            if (this.isWFS()) {
                href = this.layer.getFeatureTypeURL();
            }
            else {
                href = this.layer.getCoverageUrl();
            }
            return new Ext.menu.Item({
                text: OpenLayers.i18n("Download data"),
                handler: this._zoomToLayersExtent,
                href: href,
                hrefTarget: "_blank",
                cls: 'x-btn-text-icon',
                icon: OpenLayers.Util.getImagesLocation()+"/download.png"
            });
        }
        else if (this.layer instanceof OpenLayers.Layer.Vector) {
            return new Ext.menu.Item({
                text: OpenLayers.i18n("Download data"),
                menu: new Ext.menu.Menu({
                    plain: true,
                    items: [
                        new Ext.menu.Item({
                            handler: function(){this._saveVectorsToDisc(OpenLayers.Format.GML);},
                            text: OpenLayers.i18n("GML"),
                            scope: this
                        }),
                        new Ext.menu.Item({
                            handler: function(){this._saveVectorsToDisc(OpenLayers.Format.KML);},
                            text: OpenLayers.i18n("KML"),
                            scope: this
                        })/*,
                        new Ext.menu.Item({
                            handler: function(){this._saveVectorsToDisc(OpenLayers.Format.GPX);},
                            text: OpenLayers.i18n("GPX"),
                            scope: this
                        })*/
                    ]
                }),
                scope: this,
                cls: 'x-btn-text-icon',
                icon: OpenLayers.Util.getImagesLocation()+"/download.png"
            });
        }
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
                value: (1-(this.layer.opacity === null ? 1 : this.layer.opacity))*100,
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

    /**
     * @private
     * @function
     */
    _createTimeItem: function() {
        var timeItem = new HSLayers.LayerSwitcher.TimeSlider({
            layer: this.layer,
            width: (this.initialConfig.width || 300) - 40
        });
        return timeItem;
    },

    /**
     * @private
     * @function
     */
    _createStylesItem: function() {

        var data = {data:[]};

        if (this.layer.metadata && this.layer.metadata.styles) {
            this.layer.metadata.styles.map(function(style) {
                this.data.push([style.name, style.title]);
            }, data);
        }

        data.data.push(["_custom_url",OpenLayers.i18n("Open SLD Location")]);
        data.data.push(["_custom_file",OpenLayers.i18n("Open SLD File")]);
        data.data.push(["_custom_text",OpenLayers.i18n("Create SLD File")]);
        data.data.push(["",OpenLayers.i18n("No style")]);

        this._stylesCombo = new Ext.form.ComboBox({
                width: (this.initialConfig.width || 300) - 40,
                value : this._styleValue,
                displayField: "title",
                triggerAction: 'all',
                valueField: "name",
                mode: "local",
                style: {
                    "margin-left": "20px"
                },
                store: new Ext.data.ArrayStore({
                    fields: ["name", "title"],
                    data: data.data
                }),
                listeners: {
                            change:this._onStyleChange,
                            //select:this._onStyleChange,
                            scope: this
                }
        });

        return this._stylesCombo;
    },

    /**
     * @private
     * @function
     */
    _createFormatsItem: function() {
        var data = {data:[]};

        this.layer.metadata.formats.map(function(format) {
            this.data.push([format.value]);
        }, data);

        this._formatsCombo = new Ext.form.ComboBox({
                width: (this.initialConfig.width || 300) - 40,
                value : this.layer.params.FORMAT,
                displayField: "name",
                triggerAction: 'all',
                valueField: "name",
                mode: "local",
                style: {
                    "margin-left": "20px"
                },
                store: new Ext.data.ArrayStore({
                    data: data.data,
                    fields: ["name"]
                }),
                listeners: {
                            change:this._onFormatChange,
                            select:this._onFormatChange,
                            scope: this
                }
        });

        return this._formatsCombo;
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
        var extent;
        if (layer instanceof OpenLayers.Layer.Vector) {
            extent = layer.getDataExtent();
        }
        else {
            extent = layer.maxExtent;
        }
        if (extent) {
            layer.map.zoomToExtent(extent,true);
        }
    },

    /**
     * apply URL with the style
     * @private
     * @function
     */
    _addURLWithStyle: function(button,style) {
        if (button == "ok") {
            this.layer.params.SLD = style;
            this.layer.params.STYLES = "";
            this.layer.redraw(true);
        }
    },

    /**
     * apply SLD directly
     * @private
     * @function
     */
    _addSLDStyle: function(e) {
        var link = e.record.data.data.link;
        if (link.search("http") == -1) {
            link = window.location.protocol+"//"+window.location.hostname+"/"+link;
        }
        this.layer.params.SLD = link;
        this.layer.params.STYLES = "";
        this.layer.redraw(true);
    },


    /**
     * @private
     * @function
     */
    _onStyleChange: function(e) {
        var style = this._stylesCombo.getValue();

        switch(style) {
            case "_custom_file":
                var filedialog = new HSLayers.FileDialog({
                        type:"open",
                        title:OpenLayers.i18n("Open SLD file"),
                        scope:this
                });
                filedialog.on("open",this._addSLDStyle,this);
                filedialog.show();
                break;
            case "_custom_url":
                Ext.Msg.prompt(
                        OpenLayers.i18n("SLD URL"),
                        OpenLayers.i18n("Add external URL for SLD: "),
                        this._addURLWithStyle, 
                        this, 
                        false, 
                        "http://"
                );
                break;
            case "_custom_text":
                var sldEditor = new HSLayers.SLD.LayerSymbologyWindow({
                    attributes: this._getLayerAttributes(),
                    symbolType: "polygon",
                    layer: this.layer,
                    getValuesHandler: {
                        func: function(comp, attrName) {
                            return ["a","b","c","d"];
                            //return getValuesFromLayer(layer, attrName);
                        }
                    },
                    listeners: {
                        onAccept: function(w) {
                            var style = w.getSelectedStyle();
                            var textStyle = HSLayers.SLD.Util.getSLDFromStyle(style);

                            // xhr = HSLayers.Util.feedback(textStyle,"sld.xml");
                            //
                            //var url = HSLayers.statusManagerUrl;
                            //if (url.search("http") == -1) {
                            //    url = "http://"+window.location.hostname+"/"+url;
                            //}
                            //url = OpenLayers.Util.urlAppend(HSLayers.statusManagerUrl, 
                            //    OpenLayers.Util.getParameterString({request:"feedback",data:textStyle}));
                            // this.layer.params.SLD=url;
                            this.layer.params.SLD_BODY=textStyle;
                            //layer.styleMap.styles["default"] = style;
                            this.layer.redraw(true);
                        }

                    }
                });
                sldEditor.show();
                break;
            default:
                this.layer.params.STYLES = style;
                this.layer.params.SLD = undefined;
                this.layer.redraw(true);
        }
        this._styleValue = style;
    },

    /**
     * return list of attributes of the layer
     * @private
     * @function
     */
    _getLayerAttributes: function() {

        // applies for HSL.Layer.OWS types
        if (this.layer.getAttributes)  {
            return this.layer.getAttributes();
        }
        else {
            if (this.layer instanceof OpenLayers.Layer.WMS()) {
                // TODO 
            }
            else if (this.layer instanceof OpenLayers.Layer.Vector) {
                // TODO
            }
        }
    },

    /**
     * @private
     * @function
     */
    _onFormatChange: function(e) {
        this.layer.params.FORMAT = this._formatsCombo.getValue();
        this.layer.redraw(true);
    },

    /**
     * Save Vector data to local hard disc as file
     * @function
     * @private
     */
    _saveVectorsToDisc: function(format) {

        format = format || OpenLayers.Format.GML;


        // create some form
        var inputField;

        // _gmlForm is hidden HTML form, which has to be submitted
        // the server returns back the WMC file itself
        if(this._gmlForm) {
            inputField = this._gmlForm.data;
        }
        else {

            this._gmlForm = document.createElement('form');
            document.body.appendChild(this._gmlForm);
            this._gmlForm.setAttribute('method', 'post');
            this._gmlForm.setAttribute('action', HSLayers.statusManagerUrl);
            this._gmlForm.style.display='none';

            inputField = document.createElement('input');
            inputField.setAttribute('name','request');
            inputField.setAttribute('value','feedback');
            this._gmlForm.appendChild(inputField);

            inputField = document.createElement('input');
            inputField.setAttribute('name','filename');

            var suffix = format.prototype.CLASS_NAME.split(".")[2].toLowerCase();
            inputField.setAttribute('value',this.layer.name+'.'+suffix);
            this._gmlForm.appendChild(inputField);

            inputField = document.createElement('input');
            inputField.setAttribute('name','data');
            this._gmlForm.appendChild(inputField);
        }
        // create the xml file
        var options = {};
        if (format != OpenLayers.Format.GML) {
            options.internalProjection = this.layer.map.getProjectionObject();
            options.externalProjection = new OpenLayers.Projection("epsg:4326");
        }
        var xmlParser = new format(options); 
        inputField.setAttribute('value', xmlParser.write(this.layer.features));
        this._gmlForm.submit();
        this.fireEvent("saved",{title:this.titleField.getValue(), link: null, uuid:null});
    },

    /**
     * create delete features item
     * @function
     * @private
     */
    _createDeleteFeaturesItem: function() {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Remove features"),
            cls: 'x-btn-text-icon',
            scope:this,  
            handler: function(){
                this.hide();
                this.layer.removeAllFeatures(true);
            },
            icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
        });
        
    },

    /**
     * create edit features item
     * @function
     * @private
     */
    _createEditItem: function(edit) {
        return new Ext.menu.Item({
            text: OpenLayers.i18n("Edit features"),
            cls: 'x-btn-text-icon',
            scope: {menu: this,edit: edit},  
            handler: function(){
                this.menu.hide();
                this.edit.setLayer(this.menu.layer);
                this.edit.activate();
            },
            icon: OpenLayers.Util.getImagesLocation()+'/edit.gif'
        });
    },

    /**
     * check for wfs layer
     * @function
     */
     isWFS: function() {
       if (HSLayers.Layer && HSLayers.Layer.WFS) {
             if (this.layer instanceof HSLayers.Layer.WFS) {
                 return true;
             }
       }
        return false;
    },

    /**
     * check for wcs layer
     * @function
     */
     isWCS: function() {
       if (HSLayers.Layer && HSLayers.Layer.WCS) {
             if (this.layer instanceof HSLayers.Layer.WCS) {
                 return true;
             }
       }
        return false;
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.LayerMenu"
});
