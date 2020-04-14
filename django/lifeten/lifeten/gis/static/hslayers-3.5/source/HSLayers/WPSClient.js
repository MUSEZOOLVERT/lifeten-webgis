/**
 * CCSS WPS client
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.WPSClient");

HSLayers.WPSClient = function(config) {

    config = config || {};

    HSLayers.WPSClient.superclass.constructor.call(this,config);

    if (config.url) {
        this.getCapabilities(config.url);
    }
};

Ext.extend(HSLayers.WPSClient, Ext.Panel,{

    /**
     * textfield for this getcapabilities textfield
     * @private
     */
    _urlField: null,

    /**
     * process form
     * @private
     */
    _processForm: null,

    /**
     * Colection of informations about WPS Service
     * @name HSLayers.WPSClient.wpsObj
     * @type {Object}
     */
    wpsObj: undefined,

    /**
     * map
     * @name HSLayers.WPSClient.ComplexField.map
     * @type OpenLayers.Map
     */
    map: undefined,

    /**
     * @private
     * @type HSLayers.WPSClient.ProcessField
     */
    _processField: undefined,

    /**
     * initComponents
     * @private
     */
    initComponent: function() {

        // urlField
        this._urlField = new Ext.form.TextField({
            name: "url",
            width: 300,
            fieldLabel: "URL",
            emptyText: "http://",
            value: this.initialConfig.url || undefined,
            listeners: {
                scope: this,
                specialkey: function(f,e){
                    if(e.getKey() == e.ENTER){
                        this._onGetCapabilitiesClicked();
                    }
                }
            }
        });

        var connectButton = new Ext.Button({
            text: OpenLayers.i18n("Connect"),
            handler: this._onGetCapabilitiesClicked,
            scope:this
        });

        this._processField = new HSLayers.WPSClient.ProcessField({
            listeners: {
                           "select": this._onProcessSelect,
                           "scope":this
                       }
        });

        var processFieldForm = new Ext.form.FormPanel({
            frame:true,
            items: [this._processField]
        });

        var config = this._getConfig({
            tbar:[
            {text: OpenLayers.i18n("URL: ")},
            this._urlField, connectButton],
            items: [processFieldForm]
            /*
            buttons: [{
                    text:OpenLayers.i18n("Execute"),
                    scope: this,
                    handler: this.execute
                }]
                */
        });

        this.setMap(this.initialConfig.map);

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.superclass.initComponent.apply(this, arguments);
    },

    /**
     * Call GetCapabilities request
     * @function
     * @name HSLayers.WPSClient.getCapabilities
     * @param {String} url
     */
    getCapabilities: function(url) {
        this.wpsObj = {};

        OpenLayers.Request.GET({
            url: url,
            params: {
                service:"wps",
                request:"getcapabilities",
                version: "1.0.0"
            },
            success: this._onCapabilitiesGot,
            scope: this
        });
    },

    /**
     * Call GetCapabilities parsed
     * @function
     * @private
     * @name HSLayers.WPSClient._onCapabilitiesGot
     */
    _onCapabilitiesGot: function(xhr) {

        var format = new OpenLayers.Format.WPSCapabilities.v1_0_0();
        this.wpsObj.capabilities = format.read(xhr.responseText);

        this._processField.getEl().highlight();
        this._processField.load(this.wpsObj);
    },

    /**
     * describeprocess call
     * @function
     * @name HSLayers.WPSClient.describeProcess
     * @param {String} identifier
     */
    describeProcess: function(identifier) {

        OpenLayers.Request.GET({
            url: this.wpsObj.capabilities.operationsMetadata.DescribeProcess.dcp.http.get[0].url,
            params: {
                service:"wps",
                request:"describeprocess",
                version: "1.0.0",
                identifier: identifier
            },
            success: this._onDescribeProcess,
            scope:this
        });
    },

    /**
     * make form for wps process inpu(t
     * @function
     * @name HSLayers.WPSClient.makeForm
     * @param {String} identifier
     */
    makeProcessForm: function(identifier) {
        this.clearProcessForm();

        // is there already defined WPSProcessForm?
        if (HSLayers.WPSClient.servers[this.wpsObj.capabilities.operationsMetadata.GetCapabilities.dcp.http.get] &&
                HSLayers.WPSClient.servers[this.wpsObj.capabilities.operationsMetadata.GetCapabilities.dcp.http.get][identifier]) {
            this.add(HSLayers.WPSClient.servers[this.wpsObj.capabilities.operationsMetadata.GetCapabilities.dcp.http.get][identifier]);
        }
        // create one on-the-fly
        else {
            this._processForm = new HSLayers.WPSClient.ProcessForm({
                    wps: this.wpsObj,
                    process: this.wpsObj.capabilities.processOfferings[identifier],
                    map: this.map
                });
            this.add(this._processForm);
        }
        this.doLayout();
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
     * @private
     */
    clearProcessForm: function(e) {
        if (this._processForm) {
            this.remove(this._processForm);
            this._processForm.destroy();
            this._processForm = undefined;
        }
    },


    /*
     * PRIVATE METHODS
     */ 

    /**
     * @private
     */
    _onGetCapabilitiesClicked: function() {
        var url = this._urlField.getValue();
        this.getCapabilities(url);

    },

    /**
     * @private
     */
    _getConfig: function(config) {
        config = config  || {};
        // can be adjusted here
        return config;
    },


    /**
     * @private
     */
    _onProcessSelect: function(processfield,record,idx) {
        var identifier = record.get("identifier");        
        this.describeProcess(identifier);
    },

    /**
     * @private
     */
    _onDescribeProcess: function(xhr) {
        var format = new OpenLayers.Format.WPSDescribeProcess();
        var descriptions = format.read(xhr.responseXML);
        for (var i in descriptions.processDescriptions) {
            OpenLayers.Util.extend(
                this.wpsObj.capabilities.processOfferings[i],
                descriptions.processDescriptions[i]
            );
        }
        this.makeProcessForm(Object.keys(descriptions.processDescriptions)[0]);
    },


    CLASS_NAME: "HSLayers.WPSClient" 
});

HSLayers.WPSClient.servers = [];

HSLayers.WPSClient.mimeTypes = {
    "text/xml":"",
    "text/xml; subtype=wfs-collection/1.0":"",
    "text/xml; subtype=wfs-collection/1.1":"",
    "application/json":"",
    "application/wfs-collection-1.0":"",
    "application/wfs-collection-1.1":"",
    "application/zip":""
};
