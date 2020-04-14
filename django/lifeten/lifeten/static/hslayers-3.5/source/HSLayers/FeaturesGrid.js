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
Ext.namespace("HSLayers.FeaturesGrid");

/**
 * @class HSLayers.FeaturesGrid
 * @augments `Ext.Panel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.GridPanel>`_
 *
 * @constructor
 * @param {Object} config configuration object of the panel
 * @param {OpenLayers.Layer.Vector} config.layer see `OpenLayers <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
 * @example 
 * ...
 * var fg = new HSLayers.FeaturesGrid({
 *              layer:vector_layer,
 *              renderTo: Ext.getBody()
 *              });
 */
HSLayers.FeaturesGrid = function(config) {

    if (!config) {
        config = {};
    }
    config.autoDestroy = false;
    

    // call parent constructor
    HSLayers.FeaturesGrid.superclass.constructor.call(this, config);

    if (config.layer) {
        this.setLayer(config.layer);
    }
};

Ext.extend(HSLayers.FeaturesGrid, Ext.grid.EditorGridPanel, {
     
    /**
     * Layer, which features will be reflected by this panel
     *
     * @name HSLayers.FeaturesGrid.layer
     * @type `OpenLayers.Layer.Vector <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
     */
    layer: undefined,

    /**
     * Container for feature count
     *
     * @private
     * @name HSLayers.FeaturesGrid._countContainer
     * @type `Ext.Container <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Container>`_
     */
    _countContainer: undefined,

    /**
     * Container for overall feature length
     *
     * @private
     * @name HSLayers.FeaturesGrid._lengthContainer
     * @type `Ext.Container <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Container>`_
     */
    _lengthContainer: undefined,

    /**
     * Container for overall feature area
     *
     * @private
     * @name HSLayers.FeaturesGrid._areaContainer
     * @type `Ext.Container <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Container>`_
     */
    _areaContainer: undefined,

    /**
     * @private
     * @function
     */
    initComponent: function() {

        var config = {};
        config.autoDestroy = false;
        config.viewConfig = {
            forceFit: true
        };
        config.store = new Ext.data.ArrayStore({
            autoDestroy: false,
            idIndex: 0,
            fields: [
                {name: "id", type: "string"},
                {name:"idx",type:"int"},
                {name:"type",type:"string"},
                {name:"title",type:"string"},
                {name:"length",type:"string"},
                {name:"area",type:"string"}
        ]
        });

        var units = this.layer.map.units;
        if (units == "degrees") {
            units = "°";
        }
        config.colModel = new Ext.grid.ColumnModel({
                defaults: {
                    sortable: true,
                    menuDisabled: true
                },
                columns: [
                    {header: OpenLayers.i18n(" "), dataIndex: "type",
                        width: 30,
                        fixed: true,
                        renderer: {
                            fn: function(value,metadata,record, rowIndex,colIndex,store) {
                                return (value == "unknown" ? "?" : 
                                    "<img src=\""+OpenLayers.Util.getImagesLocation()+value+"-type.png\" />");
                            },
                            scope: this
                        }
                    },
                    {
                        header: OpenLayers.i18n("Title"),
                        dataIndex: "title",
                        editor: new Ext.form.TextField({
                            allowBlank: true
                        })
                    },
                    {header: OpenLayers.i18n("Length"),dataIndex: "length",
                        renderer: {
                            fn: function(v,m,rec,row,c,s) {
                                return HSLayers.Util.renderLength(v);
                            },
                            scope: this
                        }
                    },
                    {header: OpenLayers.i18n("Area"),dataIndex: "area",
                        renderer: {
                            fn: function(v,m,rec,row,c,s) {
                                return HSLayers.Util.renderArea(v);
                            },
                            scope: this
                        }
                    },
                    {
                        xtype: 'actioncolumn',
                        width: 30,
                        fixed: true,
                        sortable: false,
                        items: [{
                            icon   : OpenLayers.Util.getImagesLocation()+"empty.gif", 
                            tooltip: OpenLayers.i18n("Delete"),
                            scope: this,
                            handler: function(grid, rowIndex, colIndex) {
                                var rec = grid.store.getAt(rowIndex);
                                var f = this.layer.getFeatureById(rec.data.id);

                                if (f) {
                                    this.layer.removeFeatures([]);
                                    if (f.popup) {
                                        f.popup.hide();
                                    }
                                    f.destroy();
                                }
                            }
                        }]
                    }
                ]
            });
        config.viewConfig = {
                autoFill: true,
                forceFit: true
            };
        config.columnLines = true;
        config.sm = new Ext.grid.RowSelectionModel({singleSelect:true});

        this._countContainer = new Ext.Container({html:""});
        this._lengthContainer = new Ext.Container({html:""});
        this._areaContainer = new Ext.Container({html:""});

        config.bbar = [
            "&#8721; ",
            this._lengthContainer,
            "-",
            this._areaContainer,
            "-",
            this._countContainer,
            "->",
            {
                icon: OpenLayers.Util.getImagesLocation()+"keyboard.png", 
                tooltip: OpenLayers.i18n("Manualy add new feature"),
                menu: new Ext.menu.Menu({
                    items: {
                        xtype: "buttongroup",
                        columns: 1,
                        defaults: {
                            xtype: 'button',
                            width: 22,
                            height: 22
                        },
                        items: [
                            {
                                tooltip: OpenLayers.i18n("Point"),
                                icon: OpenLayers.Util.getImagesLocation()+"point-type.png",
                                scope: this,
                                itemId: "point_manual_entry",
                                handler: this.openManualEntry
                            },
                            {
                                tooltip: OpenLayers.i18n("Line"),
                                icon: OpenLayers.Util.getImagesLocation()+"line-type.png",
                                scope: this,
                                itemId: "line_manual_entry",
                                handler: this.openManualEntry
                            },
                            {
                                tooltip: OpenLayers.i18n("Polygon"),
                                icon: OpenLayers.Util.getImagesLocation()+"polygon-type.png",
                                scope: this,
                                itemId: "polygon_manual_entry",
                                handler: this.openManualEntry
                            }
                        ]
                    }
                })
            },
            {
                icon   : OpenLayers.Util.getImagesLocation()+"empty.gif", 
                tooltip: OpenLayers.i18n("Delete all features"),
                scope: this,
                handler: function(){
                    Ext.Msg.confirm(
                        OpenLayers.i18n("Removing features"),
                        OpenLayers.i18n("Really remove all features from this layer?"),
                        function(b){
                            if(b == "yes") {
                                this.layer.removeAllFeatures();
                                this._updateStore();
                            }
                        },
                        this
                    );
                }
            }
        ];

        config.listeners = {
            scope: this,
            "afteredit": this._afterEdit
        };

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.FeaturesGrid.superclass.initComponent.apply(this, arguments);

        this.getSelectionModel().on("rowselect",this._onRowSelected,this);
        this.on("afterrender",this.updateFeaturesInfo, this);
    },

    /**
     * create store
     * @function
     * @private
     */
    _createStore: function() {
    },

    /**
     * @private
     * @function
     */
    _updateStore: function(e) {
        var data = [];

        //if (e && e.feature) {
        //    console.log(this.store.find("id",e.feature.id), e.feature.id,this._sketch);
        //}
        //if (e && this.store.find("id",e.feature.id) > -1) {
        //    return;
        //}

        var units = this.layer.map.units;
        
        // new feature, add
        if (e && e.feature) {
            var feature = e.feature;

            // get real length and area - no degrees
            /*
            if (units == "degrees") {
                if (feature.geometry.getGeodesicLength) {
                    length = Math.round(feature.geometry.getGeodesicLength(new OpenLayers.Projection("epsg:3857")));
                }
                if (feature.geometry.getGeodesicArea) {
                    area = Math.round(feature.geometry.getGeodesicArea(new OpenLayers.Projection("epsg:3857")));
                }
                units = "m";
            }
            // TODO rounding
            */

            if (e.feature.layer) {

                var length = Math.round(feature.geometry.getLength());
                var area = Math.round(feature.geometry.getArea());

                this.store.loadData([[
                        feature.id,
                        this.store.data.length+1,
                         this.getFeatureType(feature),
                         this.getFeatureTitle(feature),
                         length || 0,
                         area || 0,
                         feature
                ]],true);
                this.getView().focusRow(this.store.getCount()-1);
            }
            else {
                var idx = this.store.find("id",feature.id);
                this.store.removeAt(idx);
            }

        }
        else {
            for (var i = 0, len =  this.layer.features.length; i < len; i++) {
                var feature = this.layer.features[i];
                this.store.loadData([[
                        feature.id,
                        i,
                         this.getFeatureType(feature),
                         this.getFeatureTitle(feature),
                         feature.geometry ? (Math.round(feature.geometry.getLength()*100)/100 || 0) : 0,
                         feature.geometry ? (Math.round(feature.geometry.getArea()) || 0) : 0,
                         feature
                ]],true);

            }

        }

        this.updateFeaturesInfo();
    },

    /**
     * update feature informations in the bottom bar
     * @function
     * @name HSLayers.FeaturesGrid.updateFeaturesInfo
     */
    updateFeaturesInfo: function() {
        this.updateFeatureAreaInfo();
        this.updateFeatureLengthInfo();
        this.updateFeatureCountInfo();
    },

    /**
     * Set `layer <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
     * :js:attr:`HSLayers.FeaturesGrid.layer` property
     *
     * @function
     * @name HSLayers.FeaturesGrid.setLayer
     * @param OpenLayers.Layer.Vector layer http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html
     */
    setLayer: function(layer) {
        this.layer = layer;

        this._registerEvents();

    },

    /**
     * register layer events
     * @function
     * @private
     */
    _registerEvents: function() {
        if (this.layer) {
            this._unRegisterEvents();
            this._sketch = undefined;
            this.layer.events.register("featureadded", this, this._updateStore);
            this.layer.events.register("featureremoved",this, this._updateStore);
            this.layer.events.register("featureselected",this, this._onFeatureSelected);
            this.layer.events.register("afterfeaturemodified",this, this._onFeatureModified);
            this.layer.events.register("sketchstarted",this, this._onSketchStarted);
            this.layer.events.register("sketchmodified",this, this._onSketchModified);
            this.layer.events.register("sketchcomplete",this, this._onSketchComplete);
            this.layer.events.register("vertexmodified",this, this._onVertexModified);
            this.layer.events.register("vertexremoved",this, this._onVertexRemoved);
            this._updateStore();
        }
    },

    /**
     * unregister layer events
     * @function
     * @private
     */
    _unRegisterEvents: function() {
            this.layer.events.unregister("featureadded", this, this._updateStore);
            this.layer.events.unregister("featureremoved",this, this._updateStore);
            this.layer.events.unregister("featureselected",this, this._onFeatureSelected);
            this.layer.events.unregister("afterfeaturemodified",this, this._onFeatureModified);
            this.layer.events.unregister("sketchstarted",this, this._onSketchStarted);
            this.layer.events.unregister("sketchmodified",this, this._onSketchModified);
            this.layer.events.unregister("sketchcomplete",this, this._onSketchComplete);
            this.layer.events.unregister("vertexmodified",this, this._onVertexModified);
            this.layer.events.unregister("vertexremoved",this, this._onVertexRemoved);
    },

    /**
     * feature selected handler
     * @function
     * @private
     */
    _onFeatureSelected: function(e) {
        var feature = e.feature;
        var idx = this.store.find("id",feature.id);
        if (idx > -1) {
            var record = this.store.getAt(idx);
            var sm  =this.getSelectionModel();
            if (sm.getSelected() != record) {
                this.getSelectionModel().selectRecords([record]);
            }
        }
    },

    /**
     * sketch started handler 
     * @private
     * @function
     */
    _onSketchStarted: function(e) {
        if (this._sketch === undefined) {
            this._sketch = {
                feature: e.feature,
                record: new Ext.data.Record({
                    "id": e.feature.id,
                    "idx": this.layer.features.length,
                    "type": this.getFeatureType(e.feature),
                    "title": this.getFeatureTitle(e.feature),
                    "length": e.feature.geometry.getLength(),
                    "area": e.feature.geometry.getArea()
                })
            };
        }
    },
    /**
     * sketch started handler 
     * @private
     * @function
     */
    _onSketchModified: function(e) {
        if (this._sketch) {
            var length = e.feature.geometry.getLength();
            if (!this._sketch.record.store && length > 0) {
                this.store.add(this._sketch.record);
            }
            this._sketch.record.set("length",length);
            this._sketch.record.set("area",e.feature.geometry.getArea());
            this._sketch.record.endEdit();
            this.getView().focusRow(this.store.indexOf(this._sketch.record));
        }
    },
    /**
     * sketch started handler 
     * @private
     * @function
     */
    _onSketchComplete: function(e) {
        if (this._sketch) {
            this.store.remove(this._sketch.record);
            this._sketch = undefined;
        }
    },
    /**
     * sketch started handler 
     * @private
     * @function
     */
    _onVertexModified: function(e) {
        var idx = this.store.find("id",e.feature.id);
        var record = this.store.getAt(idx);
        record.set("length",e.feature.geometry.getLength());
        record.set("area",e.feature.geometry.getArea());
        this.updateFeaturesInfo();
    },
    /**
     * sketch started handler 
     * @private
     * @function
     */
    _onVertexRemoved: function(e) {
        this._onVertexModified(e);
    },

    /**
     * row selected handler
     * @function
     * @private
     */
    _onRowSelected: function(model, idx, record) {
        if (record && record.data.id) {
            var feature = this.layer.getFeatureById(record.data.id);
            if (feature) {
                var layer = feature.layer;
                var map = layer.map;
                var modify = map.getControlsByClass("OpenLayers.Control.ModifyFeature");
                var select = map.getControlsByClass("HSLayers.Control.SelectFeature");

                if (modify.length > 0) {
                    //modify[0].active();
                    modify.map(function(m) { if (m.active) { m.selectFeature(feature);} });
                    //modify[0].selectFeature(feature);
                }

                // select feature control existing - use it of the
                // clickFeature
                if (select.length > 0) {
                    // unselect potentionaly selected feature
                    this.layer.features.map(select[0].unselect,select[0]);
                    // select the right one
                    select[0].clickFeature(feature);
                }
                // just trigger the event, it will be fine
                else {
                    layer.events.triggerEvent("featureselected",{feature:feature});
                }


            }
        }
    },

    /**
     * feature modified handler
     * @function
     * @private
     */
    _onFeatureModified: function(e) {
        var feature = e.feature;
        var idx = this.store.find("id",feature.id);
        if (idx > -1) {
            var record = this.store.getAt(idx);
            for (var a in record.data) {
                var val = feature.attributes[a];
                if (a === "length") {
                    val = Math.round(feature.geometry.getLength()) || 0;
                }
                else if (a === "area") {
                    val = Math.round(feature.geometry.getArea()) || 0;
                }
                if (val !== undefined || (val == undefined && a == "title")) {
                    if (a == "title" && !feature.attributes.title) {
                        val = feature.attributes.name;
                    }
                    if (typeof (val) == "string" || typeof (val) =="number") {
                        record.set(a,val);
                    }
                    else if (val && val.value){
                        record.set(a,val.value);
                    }
                }

            }
            record.commit();
        }

        this.updateFeatureAreaInfo();
        this.updateFeatureLengthInfo();
    },

    /**
     * set information about feature count to bbar
     * @function
     * @HSLayers.FeaturesGrid.updateFeatureCountInfo
     * @param count {Integer} features count
     */
    updateFeatureCountInfo: function(count) {
        count = count || this.layer.features.length;

        if (this.rendered) {
            this._countContainer.update(OpenLayers.i18n('Count')+": "+String(count));
        }
    },

    /**
     * set information about features length to bbar
     * @function
     * @HSLayers.FeaturesGrid.updateFeatureLengthInfo
     * @param count {Float} features length
     */
    updateFeatureLengthInfo: function(length) {
        length = length || function(layer) {
            var l = 0;
            for (var i = 0, len = layer.features.length; i < len; i++) {
                if (layer.features[i].geometry && layer.features[i].geometry.getLength) {
                    l += layer.features[i].geometry.getLength();
                }
            }
            return l;
        }(this.layer);

        if (this.rendered) {
            var units = this.layer.map.units;
            length = HSLayers.Util.renderLength(length);
            this._lengthContainer.update('<img style="vertical-align: middle;" src="'+OpenLayers.Util.getImagesLocation()+"line-type.png"+'" alt="Total length" /> '+length);
        }
    },

    /**
     * set information about features area to bbar
     * @function
     * @HSLayers.FeaturesGrid.updateFeatureAreaInfo
     * @param count {Float} features length
     */
    updateFeatureAreaInfo: function(area) {
        area = area || function(layer) {
            var a = 0;
            for (var i = 0, len = layer.features.length; i < len; i++) {
                if (layer.features[i].geometry && layer.features[i].geometry.getArea) {
                    a += layer.features[i].geometry.getArea();
                }
            }
            return a;
        }(this.layer);

        if (this.rendered) {
            area = HSLayers.Util.renderArea(area);
            this._areaContainer.update('<img style="vertical-align: middle" src="'+OpenLayers.Util.getImagesLocation()+"polygon-type.png"+'" alt="Total area" /> '+area);
        }
    },


    /**
     * get feature type
     *
     * @function
     * @name HSLayers.FeaturesGrid.getFeatureType
     * @param feature {OpenLayers.Feature.Vector}
     * @returns {String} point, line, polygon
     */
    getFeatureType: function(feature) {
        if (feature && feature.geometry) {
            if (/Polygon|Ring/.test(feature.geometry.CLASS_NAME)) {
                return "polygon";
            }
            else if (/Line|Path|Collection/.test(feature.geometry.CLASS_NAME)) {
                return "line";
            }
            else if (/Point/.test(feature.geometry.CLASS_NAME)) {
                return "point";
            }
            else {
                return "unknown";
            }
        }
        else {
            return "unknown";
        }
    },

    /**
     * get feature title
     *
     * @function
     * @name HSLayers.FeaturesGrid.getFeatureTitle
     * @param feature {OpenLayers.Feature.Vector}
     * @returns {String} 
     */

    getFeatureTitle: function(feature) {
        var ftitle;
        if (feature.attributes.title) {
            if (typeof(feature.attributes.title) == "string") {
                ftitle = feature.attributes.title;
            }
            else {
                ftitle = feature.attributes.title.value;
            }
        }
        else if (feature.attributes.name){
            if (typeof(feature.attributes.name) == "string") {
                ftitle = feature.attributes.name;
            }
            else {
                ftitle = feature.attributes.name.value;
            }
        }

        return ftitle;
    },

    /**
     * feature title edited handler
     *
     * @function
     * @private
     * @name HSLayers.FeaturesGrid._afterEdit
     * @param e Event
     */
    _afterEdit: function(e) {
        var f = this.layer.getFeatureById(e.record.data.id);
        var name = e.field;
        if (typeof(f.attributes[name]) != "string" || 
            f.attributes[name] === undefined) {
            f.attributes[name] = {displayName: name, value: e.value};
        }
        else {
            f.attributes[name] = e.value;
        }
         e.record.commit();
    },

    /**
     * open window for manual geometry entry
     * @function
     * @name HSLayers.FeaturesGrid.openManualEntry
     * @param b {Ext.Button || String} button or 'point, line, polygon'
     * @param e {Event}
     */
    openManualEntry: function(b,e) {
        var help = "";
        var type = "";

        // prepare values for point/line/polygon
        if (b.itemId == "point_manual_entry" || b == "point") {
            help = OpenLayers.i18n("Point format")+" [x y]: 213434.123 123423.435";
            type = "point";
        }
        else if (b.itemId == "line_manual_entry" || b == "line") {
            help = OpenLayers.i18n("Line format")+" [x1 y1,x2 y2, ...]: 213434.123 123423.435,234234.234 8765445.456,345345.234 9876532.234";
            type = "line";
        }
        else if (b.itemId == "polygon_manual_entry" || b == "polygon") {
            help = OpenLayers.i18n("Polygon format")+" [x1 y1,x2 y2, ...]: 213434.123 123423.435,234234.234 8765445.456,345345.234 9876532.234";
            type = "polygon";
        }

        // input form
        var form = new Ext.form.FormPanel({
            frame: true,
            items: [{
                xtype: "hidden",
                name:"type",
                value: type
            },
            {
                xtype: "textfield",
                width: 300,
                name: "geom",
                fieldLabel: OpenLayers.i18n("Input geometry")
            },
            {
                xtype:"checkbox",
                name: "latlon",
                fieldLabel: OpenLayers.i18n("As latlon")
            },
            {
                xtype:"checkbox",
                name: "wgs84",
                fieldLabel: OpenLayers.i18n("As WGS84")
            }],
            buttons: [{
                text: OpenLayers.i18n("Add geometry"),    
                scope: this,
                handler: this._onAddGeometryClicked
            }]
        });

        // open input form into new window
        form._win = new Ext.Window({
            title :OpenLayers.i18n("Manual entry"),
            width: 325,
            items: [
                {html:help},
                form
            ]
        });
        form._win.show();
    },

    /**
     * add geometry handler
     * @private
     * @function
     */
    _onAddGeometryClicked: function(b,e) {
        var g;
        var vals = b.findParentByType(Ext.form.FormPanel).getForm().getValues();

        // separate each point by ","
        var coords = vals.geom.split(",");

        // convert coordinate pairs to floint point numbers
        coords = coords.map(function(pair){
            pair = pair.replace(/(^\s*)|(\s*$)/g,"").replace(/\s+/g," ").split(" "); 
            return [parseFloat(pair[0]), parseFloat(pair[1])];
        });

        // create geometries
        if (vals.type == "point") {
            g = (vals.latlon == "on" ? new OpenLayers.Geometry.Point(coords[0][1],coords[0][0]) : 
                new OpenLayers.Geometry.Point(coords[0][0],coords[0][1]));
        }
        else if (vals.type =="line" || vals.type == "polygon" ) {
            var idxs = vals.latlon == "on" ? [1,0] : [0,1];
            coords = coords.map(function(pair) {
                return new OpenLayers.Geometry.Point(pair[idxs[0]], pair[idxs[1]]);
            })
            if (vals.type == "line") {
                g = new OpenLayers.Geometry.LineString(coords);
            }
            else {
                g = new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(coords)]);
            }
        }

        // eventually transform geometries
        if (vals.wgs84 == "on") {
            g.transform(new OpenLayers.Projection("epsg:4326"),
                        this.layer.map.getProjectionObject());
        }

        // create new feature and add it to layer
        this.layer.addFeatures([
            new OpenLayers.Feature.Vector(g)
        ]);
        this.layer.redraw();
    },

    CLASS_NAME: "HSLayers.FeaturesGrid"
});
