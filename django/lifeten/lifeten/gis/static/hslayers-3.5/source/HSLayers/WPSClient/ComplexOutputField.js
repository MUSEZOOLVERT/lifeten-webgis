/**
 * HSLayers WPS client
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.WPSClient.ComplexOutputField");

HSLayers.WPSClient.ComplexOutputField = function(config) {

    config = config || {};
    this.inoutput = config.inoutput;

    HSLayers.WPSClient.ComplexOutputField.superclass.constructor.call(this,config);

    this.setMap(config.map);
};

Ext.extend(HSLayers.WPSClient.ComplexOutputField, Ext.form.CompositeField,{

    /**
    * map
    * @name HSLayers.WPSClient.ComplexOutputField.map
    * @type OpenLayers.Map
    */
    map: undefined,

    /**
    * @name HSLayers.WPSClient.ComplexOutputField.layer
    * @type OpenLayers.Layer.Vector
    */
    layer: undefined,

    /**
    * wps
    * @name HSLayers.WPSClient.ComplexOutputField.inoutput
    * @type OpenLayers.WPS
    */
    inoutput: undefined,

    /**
    * setMap
    * @function
    * @name HSLayers.WPSClient.ComplexOutputField.setMap
    * @param {OpenLayers.Map} map
    */
    setMap: function(map)  {
        this.map = map;
    },

    /**
    * @private
    */
    initComponent: function() {

        this.actionField = new Ext.form.ComboBox({
            store: new Ext.data.ArrayStore({
                       fields: ["action","title"],
                       data: [
                                ["download",OpenLayers.i18n("Download")],
                                ["display", OpenLayers.i18n("Display in the map")]
                            ]
                   }),
            displayField: "title",
            valueField: "action",
            mode: 'local',
            forceSelection: true,
            emptyText: OpenLayers.i18n("Select action"),
            triggerAction: "all",
            disabled: true
        });
        this.actionButton = new Ext.Button({
            text: OpenLayers.i18n("Confirm"),
            scope: this,
            handler: this._onActionClicked,
            disabled: true
        });

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
            listeners : {
                    select: this._onMimeTypeSelect,
                    change: this._onMimeTypeChange,
                    scope: this
                },
            scope : this
        });

        data = this._getMimeTypeData();
        this.mimeTypeField.store.loadData(data);
        this.mimeTypeField.setValue(this.mimeTypeField.store.getAt(0).data.name);
        this.inoutput.mimeType = this.mimeTypeField.getValue();

        var config = {
            xtype: 'compositefield',
            items: [this.actionField, this.mimeTypeField, this.actionButton],
            fieldLabel: this.inoutput.title || this.inoutput.identifier
        };

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.ComplexOutputField.superclass.initComponent.apply(this, arguments);
    },

    /**
    * @private
    */ 
    destroy: function() {

        /*
            * this is empty now
            */

        HSLayers.WPSClient.ComplexOutputField.superclass.destroy.apply(this, arguments);
    },

    /**
    * @private
    * type of the map
    */
    _getType: function() {

        // TODO
        // very very approx
        // if (self.inoutput.format.search("xml")) {


    },

    /**
    * @private
    * on value change
    */
    _onChange: function() {
    },
        

    /**
    * getValue
    */
    setValue: function(data) {
        if (data && data.complexData)  {
            this.inoutput.value = data.complexData.value;
            this.inoutput.encoding = data.complexData.encoding;
            this.inoutput.mimeType = data.complexData.mimeType;
            this.inoutput.schema = data.complexData.schema;
        }
        else {

            this.inoutput.value = data;
        }
    },

    /**
     * @private
     */
    _onActionClicked: function(e) {
        if (this.actionField.getValue() == "display") {
            this._displayOutput();
        }
        else {
            this._downloadLayer();
        }
    },
    /**
     * function display layer behind this data
     * @function 
     * @private
     */
    _downloadLayer: function() {
        window.open(unescape(this.inoutput.value.reference.href), "_blank");
    },

    /**
     * function display layer behind this data
     * @function 
     * @private
     */
    _displayOutput: function() {
        switch(this._getLayerType()) {
            case "gml":
                    this.layer = this.inoutput.value.reference ? this._gmlLayerFromURL() : this._gmlLayerFromData();
                    break;
            case "json":
                    this.layer = this.inoutput.value.reference ? this._jsonLayerFromURL() : this._jsonLayerFromData();
                    break;
            case "image":
                    this.layer = new OpenLayers.Layer.Image(this.inoutput.identifier,
                                this.inoutput.value.reference.href,
                                this.map.getExtent(),
                                this.map.getSize(),
                                {
                                    isBaseLayer: false,
                                    removable: true,
                                    title: this.inoutput.title || this.inoutput.identifier,
                                    visibility: true
                                });
                    break;
        }

        if (this.layer && !this.layer.map) {
            this.layer.removable = true;
            var layers = {};
            this.map.layers.map(function(layer) {
                            var name = layer.name.replace(/ [0-9]*$/,"");
                            this.layers[name] = (this.layers[name] ? this.layers[name]+1 : 1);
                        },
                        {layers:layers, layer: this.layer});
            this.layer.name = (this.layer.name in layers ? this.layer.name+" "+String(layers[this.layer.name]+1) : this.layer.name);
            this.map.addLayer(this.layer);
        }
   
    },

    /**
     * @privateImage classification
     */
    _gmlLayerFromURL: function() {
        return new OpenLayers.Layer.Vector(this.inoutput.title || this.inoutput.identifier, {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: unescape(this.inoutput.value.reference.href),
                format: new OpenLayers.Format.GML({
                    internalProjection: this.map.projection,
                    xy: (this.map.getProjectionObject().getCode() in OpenLayers.Layer.WMS.prototype.yx ? false : true),
                    extractAttributes: true
                })
            }),
            visibility: true,
            removable: true
        });
    },

    /** 
     * @private
     */
    _gmlLayerFromData: function() {
        var format = new OpenLayers.Format.GML({
            xy: (this.map.getProjectionObject().getCode() in OpenLayers.Layer.WMS.prototype.yx ? false : true)
        });
        var layer = new OpenLayers.Layer.Vector(this.inoutput.title || this.inoutput.identifier);
        var data = {};
        data.documentElement = this.inoutput.value;
        layer.addFeatures(format.read(data));

        return layer;
    },

    /**
     * @private
     */
    _jsonLayerFromURL: function() {
        return new OpenLayers.Layer.GeoJSON(this.inoutput.title || this.inoutput.identifier,
                                        this.inoutput.value.reference.href,{removable: true,visibility:true});
    },

    /** 
     * @private
     */
    _jsonLayerFromData: function() {
        var format = new OpenLayers.Format.GeoJSON();
        var layer = new OpenLayers.Layer.Vector(this.inoutput.title || this.inoutput.identifier);
        layer.addFeatures(format.read(this.inoutput.value));

        return layer;
    },

    /**
     * @private
     * get openlayers layer class, based on output format
     */
    _getLayerType: function() {
        var mimeType = this.inoutput.value.reference ?
                this.inoutput.value.reference.mimeType :
                    this.inoutput.mimeType;
        if (mimeType.search("xml") > -1) {
            return "gml";
        }
        if (mimeType.search("gml") > -1) {
            return "gml";
        }
        if (mimeType.search("wfs") > -1) {
            return "wfs";
        }
        if (mimeType.search("json") > -1) {
            return "json";
        }
        if (mimeType.search("image") > -1) {
            return "image";
        }
    },

    /**
     * get mimetypes
     * @function
     * @private
     */
    _getMimeTypeData: function() {
        var data = [];
        for (var i  in this.inoutput.complexOutput.supported.formats) {
            data.push([i])
        }
        return data;
    },

    /**
     * enable the field
     */
    enable: function(){
        this.actionField.enable();
        this.actionButton.enable();
    },

    /**
     * disable the field
     */
    disable: function(){
        this.actionField.disable();
        this.actionButton.disable();
    },

    _onMimeTypeSelect: function(combo, record, idx) {
        this.inoutput.mimeType  = record.data.name;
    },

    _onMimeTypeChange: function(combo,val,idx) {
        this.inoutput.mimeType  = val;
    },

    CLASS_NAME: "HSLayers.WPSClient.ComplexOutputField"
});
