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
 * Form for editing layer attributes
 *
 * @augments Ext.form.Panel
 * @class HSLayers.LayerAttributes
 */

HSLayers.LayerAttributes = Ext.extend(Ext.grid.EditorGridPanel,{

    /**
     * @name HSLayers.LayerAttributes.map
     * @type OpenLayers.Map
     */
    layer: undefined,

    /**
     * Array of Ext.data.Records, with *name* and *type* attribute for
     * predefined layer data types.
     * @name HSLayers.LayerAttributes.dataTypes
     * @type [{Ext.data.Record}]
     * @default: integer, float, string
     */
    dataTypes: undefined,

    /**
     * Element, where to render the attributes form for each feature
     * default: undefined -> new window
     * @name HSLayers.LayerAttributes.containerElem
     * @default: undefined
     */
    containerElem: undefined,

    /**
     * initialize this component
     * @name HSLayers.LayerAttributes.initComponent
     * @function
     */
    initComponent: function() {
        var data;
        var layer = this.initialConfig.layer;

        this.dataTypes = this.initialConfig.dataTypes ||
                    {
                       INTEGER:[
                                    typeof(0),
                                    OpenLayers.i18n("Integer")
                                ],
                        FLOAT: [
                                    typeof(0.1),
                                    OpenLayers.i18n("Float")
                                ],
                        STRING: [
                                    typeof(""),
                                    OpenLayers.i18n("String")
        ]
                    };

        var dataTypesData = [];
        for (var i in this.dataTypes) {
            dataTypesData.push(this.dataTypes[i]);
        }


        var cm = new Ext.grid.ColumnModel({
            columns: [
                {
                    header: OpenLayers.i18n("Attribute"),
                    dataIndex: "attribute",
                    editor: new Ext.form.TextField({
                        allowBlank: false 
                    })
                },
                {
                    header: OpenLayers.i18n("Data type"),
                    dataIndex: "type",
                    displayField: "name",
                    valueField: "type",
                    editor: new Ext.form.ComboBox({
                        mode: "local",
                        valueField: "name",
                        displayField: "name",
                        triggerAction: "all",
                        store: new Ext.data.ArrayStore({
                            fields: ["type","name"],
                            data: dataTypesData
                        })
                    })
                }
            ]
        });


        if (layer._attributes) {
            data = this._initFormLayerAttributes();
        }
        else if (layer.features && layer.features.length > 0) {
            data = this._initFromFeature(layer.features[0]);
        }


        var storeCfg = {
            autoDestroy: true,
            fields: ["attribute","type"],
            autoSave: false
        };

        if (data && data.length) {
            storeCfg.data = data;
        }

        var store = new Ext.data.ArrayStore(storeCfg);
        
        Ext.apply(this, {
            cm:cm,
            store: store,
            defaults: {
                width: 200
            },
            viewConfig: {
                forceFit: true
            },
            tbar: [{
                handler: this._onAddAttributeClick,
                scope: this,
                text: OpenLayers.i18n("Add attribute")
            },
            {
                handler: this._onRemoveAttributeClick,
                scope: this,
                text: OpenLayers.i18n("Remove attribute")
            } ],
            buttons: [{
                    handler: this._onAttributesSaveClick,
                    scope: this,
                    text: OpenLayers.i18n("Done")
                },
                {
                    handler: this._onAttributesCancelClick,
                    scope: this,
                    text: OpenLayers.i18n("Cancel")
                }
            ]
        });

        HSLayers.LayerAttributes.superclass.initComponent.apply(this, arguments);

        this.addEvents("done");
        this.addEvents("cancel");

        this.layer.events.register("beforefeatureadded",this,this._onFeatureAdd);
        this.layer.events.register("featureselected",this,this._onFeatureSelect);
        this.layer.events.register("featureunselected",this,this._onFeatureUnselect);

    },

    /**
     * setMap
     * @function
     * @name HSLayers.LayerAttributes.setMap
     */
    setMap: function(map) {
        this.map = map;
    },

    /**
     * create new attributes array and assign it to the map
     * @function
     * @private
     */
    _onAttributesSaveClick: function() {
        this.store.commitChanges();
        var attributes =  {};
        var records = this.store.getRange();

        for (var i = 0, len = records.length; i < len; i++) {
            attributes[records[i].get("attribute")] = records[i].get("type");
        }

        this.layer.attributes = Object.keys(attributes);

        for (i = 0, len = this.layer.features.length; i < len; i++) {
            var feature = this.layer.features[i];

            // delete non existing attributes from features
            for (var j in feature.attributes) {
                if (!(j in attributes)) {
                    delete feature.attributes[j];
                }
            }

            // add new attributes to features
            for (j in attributes) {
                if (!feature.attributes[j]) {
                    feature.attributes[j] =  '';
                }
            }
        }

        this.fireEvent("done");
    },

    /**
     * cancel attribute creating
     * @functionLa
     * @private
     */
    _onAttributesCancelClick: function() {
        this.store.rejectChanges();
        console.log("TODO: _onAttributesCancelClick");
    },

    /**
     * add new attribute row
     * @function
     * @private
     */
    _onAddAttributeClick: function() {
        this.getStore().add([new Ext.data.Record({
                attribute: "",
                type: ""
                })
            ]);
    },

    /**
     * init attributes from layers feature
     * @function
     * @private
     */
    _initFromFeature: function(feature) {
        var data = [];
        for (var i in feature.attributes) {
            var type = this._getTypeFromData(feature.attributes[i]);
            data.push([ i, type ]);
        }

        return data;
    },

    /**
     * remove attribute
     * @function
     * @private
     */
    _onRemoveAttributeClick: function() {

        // function, which will be called on OK clicked (see lower)
        var removeAttribute = function(butt) {

            var rec = this.getSelectionModel().getSelectedCell();

            if ((butt == "yes") && (rec && rec.length > 0)) {
                this.getStore().removeAt(rec[0]);

            }
        };

        Ext.MessageBox.confirm(OpenLayers.i18n("Attribute deleting confirmation"), 
                    OpenLayers.i18n("Really remove selected attribute from attribute table? <br /> All existing attributes of features will be removed"),
            removeAttribute, this);
    },

    /**
     * get attribute data type from data
     * just guessing
     * @private
     * @function
     */
    _getTypeFromData: function(data) {
        var type;
        if (parseFloat(data) == data) {
            type = typeof(1.0);
        }
        else {
            type =  typeof("");
        }

        // get the propper label
        for (var i in this.dataTypes) {
            if (type == this.dataTypes[i][0]) {
                return this.dataTypes[i][1];
            }
        }
    },


    /**
     * display attributes form
     * @private
     * @function
     */
    _onFeatureAdd: function(e) {
        var feature = e.feature;

        if (this.layer.attributes) {
            this._attributesForm = new HSLayers.LayerAttributes.AttributesForm({feature:feature});
            if (this.containerElem === undefined) {
                this._attributesForm._win = new Ext.Window({
                    width: 300,
                    items: [this._attributesForm],
                    closeAction: "hide"
                });
                this._attributesForm.addListener("done",this._attributesForm._win.hide,this._attributesForm._win);
                this._attributesForm.addListener("cancel",this._attributesForm._win.hide,this._attributesForm._win);
            }

            this._attributesForm._win.show();
        }
    },

    /**
     * display attributes form
     * @private
     * @function
     */
    _onFeatureSelect: function(e) {

        this._form = new HSLayers.LayerAttributes.AttributesForm({feature:e.feature});
        this._form._win = new Ext.Window({
            items: [this._form],
            width: 300,
            closeAction: "hide",
            listeners: {
                scope: this._form,
                show: this._form.updateAttributes
            }
        });
        this._form.addListener("cancel",this._form._win.hide,this._form._win);
        this._form.addListener("done",this._form._win.hide,this._form._win);


        this._form._win.show();
    },

    /**
     * display attributes form
     * @private
     * @function
     */
    _onFeatureUnelect: function(e) {

        if (this._form && this._form._win) {
            form._win.hide();
        }
    },

    /**
     * makeAttributesForm
     * @private
     * @function
     */
    _makeAttributesForm: function(feature) {
        var items = [];

        for (var i = 0, len = this.layer.attributes.length; i < len; i++) {
            items.push(new Ext.form.TextField({
                name: this.layer.attributes[i],
                fieldLabel: this.layer.attributes[i]
            }));
        }

        return new Ext.form.FormPanel({
            items: items,
            buttons: [{
                    handler: function (){
                        for (var attrib in this.feature.layer.attributes) {
                            feature.attributes[attrib] = this._attributesForm.items.get(attrib).getValue();
                            console.log(attrib,this._attributesForm.items.get(attrib).getValue());
                        }

                    },
                    scope: {attrib: this, feature: feature},
                    text: OpenLayers.i18n("Done")
                },
                {
                    handler: function (){this.attrib._attributesForm.hide();},
                    scope: {attrib: this, feature: feature},
                    text: OpenLayers.i18n("Cancel")
                }
            ]
        });
    },

    CLASS_NAME: "HSLayers.LayerAttributes"
});
