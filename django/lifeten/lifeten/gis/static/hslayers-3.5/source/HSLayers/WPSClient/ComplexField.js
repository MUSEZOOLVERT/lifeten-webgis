/**
 * HSLayers WPS client
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.WPSClient.ComplexField");

HSLayers.WPSClient.ComplexField = function(config) {

    config = config || {};
    this.inoutput = config.inoutput;
    this.wps = config.wps;
    
    this.setMap(config.map);

    HSLayers.WPSClient.ComplexField.superclass.constructor.call(this,config);


};

Ext.extend(HSLayers.WPSClient.ComplexField, Ext.form.CompositeField,{

    /**
    * map
    * @name HSLayers.WPSClient.ComplexField.map
    * @type OpenLayers.Map
    */
    map: undefined,

    /**
     * wps capabilities of the whole server
     * @name HSLayers.WPSClient.ComplexField.wps
     * @type {Object}
     */
    wps: undefined,

    /**
    * @name HSLayers.WPSClient.ComplexField.layer
    * @type OpenLayers.Layer.Vector
    */
    layer: undefined,

    /**
    * @name HSLayers.WPSClient.ComplexField.panel
    * @type OpenLayers.Control.EditingToolbar
    */
    panel: undefined,

    /**
    * wps
    * @name HSLayers.WPSClient.ComplexField.inoutput
    * @type OpenLayers.WPS
    */
    inoutput: undefined,

    /**
    * setMap
    * @function
    * @name HSLayers.WPSClient.ComplexField.setMap
    * @param {OpenLayers.Map} ma    
    */
    setMap: function(map)  {
        this.map = map;
    },

    /**
    * @function
    * @private
    * @name HSLayers.WPSClient.ComplexField.setInputValue
    */ 
    _getValue: function(mimeType) {

        if (!this.layer){
            return;
        }

        // custom url, set inoutput
        // will be put as reference
        if (this.layer.name == OpenLayers.i18n("Custom URL")) {
            this.inoutput.asReference = true;
            this.inoutput.value = this.layer.url;
        }

        // existing layer inoutput
        else {

            // vector layer
            // layer.featuers will be encoded to GML using
            // OpenLayers.Format.GML and appended to Execute request
            // document
            this.inoutput.asReference = false;
            this.inoutput.mimeType = mimeType;
            if (this._getType() == "vector") {
                // there is layer id in selected record
                var format;
                var toFormat;
                // assume, any XML will be GML
                if (mimeType.search("gml") > -1 && mimeType.search("2") > -1) {
                    format = new OpenLayers.Format.GML.v2({
                        xy: (this.map.getProjectionObject().getCode() in OpenLayers.Layer.WMS.prototype.yx ? false : true)
                    });
                    toFormat = new OpenLayers.Format.XML();
                }
                else if (mimeType.search("gml") > -1) { // && mimeType.search("3") > -1) {
                    format = new OpenLayers.Format.GML({
                        xy: (this.map.getProjectionObject().getCode() in OpenLayers.Layer.WMS.prototype.yx ? false : true)
                    });
                    toFormat = new OpenLayers.Format.XML();
                }
                else if (mimeType.search("json") > -1) {
                    format = new OpenLayers.Format.JSON();
                }
                else if (mimeType.search("wfs") > -1) {
                    format = new OpenLayers.Format.GML.v2({
                        xy: (this.map.getProjectionObject().getCode() in OpenLayers.Layer.WMS.prototype.yx ? false : true)
                    });
                    toFormat = new OpenLayers.Format.XML();
                }

                //
                // get the data
                var layer = this.layer;
                if (layer instanceof OpenLayers.Layer.Vector) {
                    var features = format.write(layer.features);
                    this.inoutput.value = toFormat ? toFormat.read(features) : features;
                    this.inoutput.value = this.inoutput.value.firstChild;
                }
                // HSLayers.Layer.WFS handler
                else if (layer instanceof HSLayers.Layer.WFS){
                    this.inoutput.value = layer.getFeatureTypeURL();
                    this.inoutput.asReference = true;
                }
            }

            // raster layer
            // will be set as WCS request call, as reference
            else {
                this.inoutput.asReference = true;
                this.inoutput.value = this.layer.getCoverageUrl(mimeType);
            }
        }
        return this.inoutput.value;
    },

    /**
    * @private
    */
    initComponent: function() {

        OpenLayers.Feature.Vector.style['default']['strokeWidth'] = '2';

        this._layer = new OpenLayers.Layer.Vector(OpenLayers.i18n("Custom drawings")+" (WPS)",
                {
                    displayInLayerSwitcher: false,
                    removable: true
                });

        this.valueField = new Ext.form.ComboBox({
            store : new Ext.data.ArrayStore ({
                    fields: [
                        {
                            name: "name"
                        },
                        {
                            name: "description"
                        },
                        {
                            name: "layer_data"
                        }
                    ]
                }),
            allowBlank: (this.inoutput.minOccurs > 0 ? false : true),
            displayField : "name",
            valueField : "description",
            mode: "local",
            triggerAction : 'all',
            emptyText: OpenLayers.i18n("Select input data ... "),
            listeners : {
                    select: this._onSelect,
                    change: this._onChange,
                    scope: this
                },
            scope : this});

        var data = this._getLayresData();
        this.valueField.store.loadData(data);

        this.mimeTypeField = new Ext.form.ComboBox({
            fieldLabel: OpenLayers.i18n("Mime type"),
            store : new Ext.data.ArrayStore ({
                    fields: [
                        {
                            name: "name"
                        }
                    ]
                }),
            displayField : "name",
            triggerAction : 'all',
            valueField : "name",
            emptyText: OpenLayers.i18n("Select mime type ... "),
            mode: "local",
            value: Object.keys(this.inoutput.complexData["default"].formats)[0],
            listeners : {
                    select: this._onMimeTypeSelect,
                    change: this._onMimeTypeChange,
                    scope: this
                },
            scope : this});

        data = this._getMimeTypeData();
        this.mimeTypeField.store.loadData(data);

        config = {};
        config.fieldLabel = (this.inoutput.title || this.inoutput.identifier) + (this.inoutput.minOccurs > 0 ? "<sup style=\"color:red\">*</sup>" : "");
        config.items = [this.valueField, this.mimeTypeField];

        // edting toolbar panel
        this.panel = new OpenLayers.Control.EditingToolbar(this._layer);

        // another button, which will bring up the LayerAttributes form
        var attributeTable = new OpenLayers.Control({
                                    title: OpenLayers.i18n("Attribute table"),
                                    displayClass:"hslAttributeTable",
                                    layer:this._layer
        });


        attributeTable.events.register("activate",attributeTable,function() {
            if (!this._layerAttributes) {
                this._layerAttributes = new HSLayers.LayerAttributes({
                    layer:this.layer,
                    width:400, 
                    height:200,
                    closeAction: "hide"
                });
                this._layerAttributes._win = new Ext.Window({
                    title: OpenLayers.i18n("Create/Edit layer attributes"),
                    items: [this._layerAttributes],
                    listeners: {
                        scope: this,
                        hide: function() { this.deactivate();}
                    }
                });
                this._layerAttributes.addListener("done",this._layerAttributes._win.hide,this._layerAttributes._win);
                this._layerAttributes.addListener("cancel",this._layerAttributes._win.hide,this._layerAttributes._win);

            }
            this._layerAttributes._win.show();
        });

        attributeTable.events.register("deactivate",attributeTable,function() { this._layerAttributes._win.hide(); });

        // modify
        this._modify = new OpenLayers.Control.ModifyFeature(this._layer,{title: OpenLayers.i18n("Modify feature")});
        this.panel.addControls([this._modify, attributeTable]);



        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.ComplexField.superclass.initComponent.apply(this, arguments);

    },

    /**
    * @private
    */ 
    destroy: function() {
        this._deactivatePanel();

        HSLayers.WPSClient.ComplexField.superclass.destroy.apply(this, arguments);
    },

    /**
    * @private
    * raster or vector?
    */
    _getType: function() {

        // FIXME very primitive
        // if there is "xml" in formats, we assume, it is vector
        for (var i in this.inoutput.complexData.supported.formats)  {
            if (i.search("xml") > -1) {
                return "vector";
            }
            if (i.search("gml") > -1) {
                return "vector";
            }
        }

        // no "xml" found in formats, it must be raster then
        return "raster";
    },

    _onMimeTypeSelect: function(combo, record, idx) {
    },

    _onMimeTypeChange: function() {
    },

    /**
     * @function
     * @private
     * @param onlyPanel
     */
    _deactivatePanel: function(onlyPanel) {
            for (var i = 0, len = this.panel.controls.length; i<len; i++) {
                this.panel.controls[i].deactivate();
            }

            var navigationControls = this.map.getControlsByClass("OpenLayers.Control.Navigation");
            if (navigationControls.length > 0) {
                navigationControls[0].activate();
            }

            this._modify.destroy();
            this._modify = undefined;

            this.map.removeControl(this.panel);
            this.panel.destroy();
            this.panel.div = undefined;
            this.map.removeLayer(this._layer);
            this._layer.destroy();
    },

    /**
    * @private
    * on inoutput select
    * check, if "custom text" or "custom url" is to be used
    */
    _onSelect: function() {
    
        var value = this.valueField.getValue();
        var store = this.valueField.getStore();
        var idx = store.find("description",value);
        var record = store.getAt(idx);

        //this._deactivatePanel(true);

        // custom drawings
        if (record.get("description") == "custom_drawings") {
            this.layer = this._layer;
            this.map.addControl(this.panel);
            this.map.addLayer(this.layer);
            this._layer.saveState = false; // brutal force
            
            record.set("layer_data",this.layer.id);
        }
        else {
            if (this.panel.map) {
                this.panel.deactivate();
                this.map.removeControl(this.panel);
                this.panel.div = undefined;
            }
            // custom URL
            if (record.get("description") == "custom_url") {
                var setRecordValue = function(id,text) {
                    this.layer = {name: OpenLayers.i18n("Custom URL"),url:text};

                    //var value = this.valueField.getValue();
                    //var store = this.valueField.getStore();
                    //var idx = store.find("description",value);
                    //var record = store.getAt(idx);

                    //record.set("name",text);
                    //record.set("layer_data",{name:OpenLayers.i18n("Custom URL"), url: text});
                };
                var text = "";
                if (typeof(record.get("layer_data")) != "string") {
                    text = record.get("layer_data").url;
                }
                    
                Ext.MessageBox.prompt(OpenLayers.i18n("Custom URL"), OpenLayers.i18n("Data source URL:"), setRecordValue,this,false,text);
            }
            // existing layer is selected
            else {
                this.layer = this.map.getLayer(record.get("layer_data"));
            }
        }
        
    },

    /**
    * @private
    * on value change
    */
    _onChange: function() {
        //this._onSelect.apply(this,arguments);
        //this.setInputValue();
    },
        

    /**
    * getValue
    */
    getValue: function() {
        var mimeType = this.mimeTypeField.getValue();
        var value = this._getValue(mimeType);
        return [value,mimeType];

    },

    /**
     * get selected mimetype
     * @function
     * @name HSLayers.WPSClient.ComplexField.getMimeType
     */
    getMimeType: function() {
        return this.mimeTypeField.getValue();
    },

    /**
     * get data array with sutiable layers
     * @private
     */
    _getLayresData: function() {
        var data = [];
        var rasterXvector = this._getType();

        for (var i = 0; i < this.map.layers.length; i++) {
            if (rasterXvector == "raster") {
                if (this.map.layers[i] instanceof HSLayers.Layer.WCS) {
                    if (this.map.layers[i].displayInLayerSwitcher) {
                        data.push([this.map.layers[i].name,
                                "raster",this.map.layers[i].id]);
                    }
                }
            }
            if (rasterXvector == "vector") {
                if (this.map.layers[i] instanceof HSLayers.Layer.WFS||
                    this.map.layers[i] instanceof OpenLayers.Layer.Vector) {
                    if (this.map.layers[i].displayInLayerSwitcher) {
                        data.push([this.map.layers[i].name,
                                "vector",this.map.layers[i].id]);
                    }
                }
            }
        }

        data.push([OpenLayers.i18n("Custom URL"),"custom_url",""]);
        if (rasterXvector == "vector") {
            data.push([OpenLayers.i18n("Custom drawings"),"custom_drawings",""]);
        }

        return data;
    },

    /**
     * get mimetypes
     * @function
     * @private
     */
    _getMimeTypeData: function() {
        var data = [];
        for (var i  in this.inoutput.complexData.supported.formats) {
            data.push([i])
        }
        return data;
    },

    
    CLASS_NAME: "HSLayers.WPSClient.ComplexField"
});
