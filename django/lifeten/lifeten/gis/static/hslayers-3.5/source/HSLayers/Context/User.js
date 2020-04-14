Ext4.define("HSLayers.Context.User", {
    extend: "Ext4.form.Panel",

    map: undefined,
    bodyCls: "context-user",

    constructor: function(config) {

        config.layout = "anchor";
        config.items = [
            {
                name: "name",
                fieldLabel: OpenLayers.i18n("Person"),
                xtype: "textfield",
                allowBlank: true
            },
            {
                name: "organization",
                fieldLabel: OpenLayers.i18n("Organization"),
                xtype: "textfield"
            },
            {
                name: "position",
                fieldLabel: OpenLayers.i18n("Position"),
                xtype: "textfield"
            },
            {
                name: "address",
                fieldLabel: OpenLayers.i18n("Address"),
                xtype: "textfield"
            },
            {
                name: "city",
                fieldLabel: OpenLayers.i18n("City"),
                xtype: "textfield"
            },
            {
                name: "state",
                fieldLabel: OpenLayers.i18n("State or province"),
                xtype: "textfield"
            },
            {
                name: "postalcode",
                fieldLabel: OpenLayers.i18n("Postal code"),
                xtype: "textfield"
            },
            {
                name: "country",
                fieldLabel: OpenLayers.i18n("Country"),
                xtype: "textfield"
            },
            {
                name: "phone",
                fieldLabel: OpenLayers.i18n("Phone"),
                xtype: "textfield"
            },
            {
                name: "email",
                fieldLabel: OpenLayers.i18n("e-mail"),
                xtype: "textfield",
                vtype: "email"
            },
            {
                name: "url",
                fieldLabel: OpenLayers.i18n("WWW"),
                xtype: "textfield",
                vtype: "url"
            }
        ];

        //config.buttons = [
        //    {
        //        text:"Clear",
        //        scope: this,
        //        handler: this._onResetClicked
        //    },
        //    {
        //        text:"Create",
        //        scope: this,
        //        handler: this._onCreateClicked
        //    }
        //];


        this.callParent(arguments);

    },

    _onResetClicked: function() {
        this.getForm().reset();
    },

    setContext: function(context) {
        this.getForm().setValues(context);
    },

    setMap: function(map) {
        this.map = map;
    }



});
