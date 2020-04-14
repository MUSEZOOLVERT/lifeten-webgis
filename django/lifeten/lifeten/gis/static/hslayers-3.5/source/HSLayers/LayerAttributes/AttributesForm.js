/**
 * HSLayers Attribute editation form
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.LayerAttributes.AttributesForm");

HSLayers.LayerAttributes.AttributesForm = Ext.extend(Ext.form.FormPanel,{

    /**
     * @name HSLayers.LayerAttributes.AttributesForm.layer
     * @type OpenLayers.Feature.Vector
     */
    feature: undefined,

    /**
     * @private
     */
    initComponent: function() {

        this.feature = this.initialConfig.feature;

        var items = [];

        for (var i = 0, len = this.feature.layer.attributes.length; i < len; i++) {
            items.push(new Ext.form.TextField({
                name: this.feature.layer.attributes[i],
                value: this.feature.attributes[i],
                fieldLabel: this.feature.layer.attributes[i]
            }));
        }

        Ext.apply(this,{
            items: items,
            buttons: [{
                    handler: function (){
                        var layer = this.feature.layer;
                        for (var i = 0, len = layer.attributes.length; i < len; i++) {
                            this.feature.attributes[layer.attributes[i]] = this.items.get(i).getValue();
                        }
                        this.fireEvent("done");

                    },
                    scope: this,
                    text: OpenLayers.i18n("Done")
                },
                {
                    handler: function (){ this.fireEvent("cancel"); },
                    scope: this,
                    text: OpenLayers.i18n("Cancel")
                }
            ]
        });

        HSLayers.LayerAttributes.AttributesForm.superclass.initComponent.apply(this, arguments);

        this.addEvents("done");
        this.addEvents("cancel");
    },

    /**
     * update attributes
     * @function
     * @name HSLayers.LayerAttributes.AttributesForm.updateAttributes
     */
    updateAttributes: function() {

        var layer = this.feature.layer;
        for (var i = 0, len = this.feature.layer.attributes.length; i < len; i++) {
            this.items.get(i).setValue(this.feature.attributes[layer.attributes[i]]);
        }
    },

    CLASS_NAME: "HSLayers.LayerAttributes.AttributesForm"
});
