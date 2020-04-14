/**
 * HSLayers WPS client
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.WPSClient.ProcessField");

HSLayers.WPSClient.ProcessField = function(config) {

    config = config || {};
    config.disabled = true;
    config.fieldLabel= OpenLayers.i18n("Processes");

    HSLayers.WPSClient.ProcessField.superclass.constructor.call(this,config);
};

Ext.extend(HSLayers.WPSClient.ProcessField, Ext.form.ComboBox,{

    /**
     * processes store
     * @private
     */
    store: undefined,

    /**
     * wps
     * @name HSLayers.WPSClient.ProcessField.wps
     * @type OpenLayers.WPS
     */
    wps: undefined,

    /**
     * load list of processes into the store
     * @name HSLayers.WPSClient.ProcessField.load
     */
    load: function(wps) {
        this.wps = wps;
        var data = [];

        var processes = this.wps.capabilities.processOfferings;
        for (var i in processes) {
            data.push([i,
                       processes[i].title || i,
                       processes[i].abstract,
                       processes[i].version]);
        }

        this.store.loadData(data);
        this.enable();
    },

    /**
     * @private
     */
    initComponent: function() {
        var store = new Ext.data.ArrayStore({
            fields: [
                {
                    name: "identifier"
                },
                {
                    name: "title"
                },
                {
                    name: "abstract"
                },
                {
                    name: "version"
                }
            ]
        });

        config = {};
        config.store = store;
        config.displayField = "title";
        config.valueField = "identifier";
        config.typeAhead = true;
        config.mode = 'local';
        config.forceSelection = true;
        config.triggerAction = 'all';
        config.emptyText ='Select a process...';
        config.selectOnFocus = true;
        config.width = 200;

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.ProcessField.superclass.initComponent.apply(this, arguments);
    },


    CLASS_NAME: "HSLayers.WPSClient.ProcessField"
});
