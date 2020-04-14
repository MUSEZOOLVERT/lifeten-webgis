Ext4.define("HSLayers.ContextBrowser.Local", {

    extend: "Ext4.form.Panel",
    requires: [],

    map: undefined,

    constructor: function(config) {

        if (config.map) {
            this.setMap(config.map);
        }

        config.title = OpenLayers.i18n("Local");
        config.frame = true;
        config.style = {textAlign: "center"};
        config.url = HSLayers.statusManagerUrl;
        config.layout = {
            type: "vbox",
            padding: 5,
            align: "stretch"
        };


        config.items = [
            {
                xtype: 'component',
                margin: 20,
                html: OpenLayers.i18n("Pickup file from your local disc. It can be either JSON encoded composition or OGC WMC file.")
            },
            {
                xtype: "hidden",
                name: "format",
                value: "JSON"
            },
            {
                xtype: "hidden",
                name: "request",
                value: "feedback"
            },
            {
                xtype: "hidden",
                name: "project",
                value: config.project
            },
            Ext4.create('Ext4.form.field.File', {
                
                name: "file",
                hideLabel: true
            })
        ];

        config.buttons = [
            Ext4.create('Ext4.button.Button', {
                text: 'Load',
                scope: this,
                handler: this._onLoadClicked
            })
        ];

        this.callParent(arguments);
        this.addEvents("uploaded");

    },

    /*
     * @private
     */
    _onLoadClicked: function() {
        var form = this.getForm();
        var data = form.getValues();

        if (form.isValid()) {
            form.submit({
                success: function(form,action) {
                        var context = action.result.data;
                        this.fireEvent('uploaded', context);
                },
                failure: function(form, action) {
                    Ext4.Msg.alert('Failed', 'Opening local file failed');
                    if (window.console) {
                        console.log (action);
                    }
                },
                scope: this
            });
        }

    },

    setMap: function(map) {
        this.map = map;
    }
});
