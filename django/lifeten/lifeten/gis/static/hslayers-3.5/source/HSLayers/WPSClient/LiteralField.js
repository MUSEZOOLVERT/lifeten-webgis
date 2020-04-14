/**
 * HSLayers WPS client
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.WPSClient.LiteralField");


HSLayers.WPSClient.LiteralField = Ext.extend(Ext.form.TextArea,{
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
     * wps
     * @name HSLayers.WPSClient.LiteralField.inoutput
     * @type OpenLayers.WPS
     */
    inoutput: undefined,

    constructor: function(config) {

        config = config || {};
        this.inoutput = config.inoutput;

        this.wps = config.wps;

        this.setMap(config.map);

        HSLayers.WPSClient.LiteralField.superclass.constructor.call(this,config);
    },

    /**
     * setMap
     * @function
     * @name HSLayers.WPSClient.ComplexField.setMap
     * @param {OpenLayers.Map} map
     */
    setMap: function(map)  {
        this.map = map;
    },

    /**
     * @function
     * @name HSLayers.WPSClient.ComplexField.setInputValue
     */ 
    setInputValue: function() {
        
        this.inoutput.value = HSLayers.WPSClient.LiteralField.superclass.getValue.apply(this, arguments);
    },

    /**
     * @function
     */
    getValue: function() {
        this.setInputValue();
        return this.inoutput.value;
    },

    /**
     * @function
     */
    setValue: function(value) {
        if (value.literalData) {
            this.inoutput.value = value.literalData.value;
            this.inoutput.uom = value.literalData.uom;
            this.inoutput.dataType = value.literalData.dataType;
        }
        else {
        }
        this.inoutput.value = value;
        this.setInputValue();

        return Ext.form.TextArea.prototype.setValue.apply(this,[value.literalData.value]);
    },

    /**
     * @private
     */
    initComponent: function() {

        var config = {};

        config.fieldLabel = (this.inoutput.title || this.inoutput.identifier) + (this.inoutput.minOccurs > 0 ? "<sup style=\"color: red;\">*</sup>" : "");
        config.allowBlank = (this.inoutput.minOccurs > 0 ? false : true);
        if (this.inoutput.literalData && this.inoutput.literalData.dataType) {
            if (this.inoutput.literalData.dataType.search("double") > -1) {
                config.regex = /[0-9](\.([0-9]))*/;
            }
            else if (this.inoutput.literalData.dataType.search("integer") > -1) {
                config.regex = /[0-9]*/;
            }
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.LiteralField.superclass.initComponent.apply(this, arguments);
    },

    CLASS_NAME: "HSLayers.WPSClient.LiteralField"
});


HSLayers.WPSClient.LiteralFieldSelect = Ext.extend(Ext.form.ComboBox,{
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
     * wps
     * @name HSLayers.WPSClient.LiteralField.inoutput
     * @type OpenLayers.WPS
     */
    inoutput: undefined,

    store: undefined,

    constructor: function(config) {

        config = config || {};
        this.inoutput = config.inoutput;

        this.wps = config.wps;

        this.setMap(config.map);

        HSLayers.WPSClient.LiteralField.superclass.constructor.call(this,config);
    },

    /**
     * setMap
     * @function
     * @name HSLayers.WPSClient.ComplexField.setMap
     * @param {OpenLayers.Map} map
     */
    setMap: function(map)  {
        this.map = map;
    },

    /**
     * @function
     * @name HSLayers.WPSClient.ComplexField.setInputValue
     */ 
    setInputValue: function() {
        
        this.inoutput.value = HSLayers.WPSClient.LiteralFieldSelect.superclass.getValue.apply(this, arguments);
    },

    /**
     * @function
     */
    getValue: function() {
        this.setInputValue();
        return this.inoutput.value;
    },

    /**
     * @function
     */
    setValue: function(value) {
        if (value.literalData) {
            this.inoutput.value = value.literalData.value;
            this.inoutput.uom = value.literalData.uom;
            this.inoutput.dataType = value.literalData.dataType;
        }
        else {
        }
        this.inoutput.value = value;
        this.setInputValue();

        return Ext.form.ComboBox.prototype.setValue.apply(this,[value]);
    },

    /**
     * @private
     */
    initComponent: function() {

        var config = {};
        config.mode = "local";

        config.fieldLabel = (this.inoutput.title || this.inoutput.identifier) + (this.inoutput.minOccurs > 0 ? "<sup style=\"color: red;\">*</sup>" : "");
        config.allowBlank = (this.inoutput.minOccurs > 0 ? false : true);
        if (this.inoutput.literalData && this.inoutput.literalData.dataType) {
            if (this.inoutput.literalData.dataType.search("double") > -1) {
                config.regex = /[0-9](\.([0-9]))*/;
            }
            else if (this.inoutput.literalData.dataType.search("integer") > -1) {
                config.regex = /[0-9]*/;
            }
        }

        var data = [];
        for (var val in this.inoutput.literalData.allowedValues) {
            data.push([val]);
        }

        config.valueField = "val";
        config.displayField = "val";

        config.store = new Ext.data.ArrayStore({
            fields: ["val"],
            triggerAction: "all",
            data: data
        });

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.LiteralFieldSelect.superclass.initComponent.apply(this, arguments);
    },

    CLASS_NAME: "HSLayers.WPSClient.LiteralFieldSelect"
});
