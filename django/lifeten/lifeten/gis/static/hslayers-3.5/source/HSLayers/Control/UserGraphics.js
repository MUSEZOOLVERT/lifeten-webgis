/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
 *
 * This file is part of HSLayers.
 *
 */

/**
 * User drawings to the vector layer
 * @class HSLayers.Control.UserGraphics
 */
HSLayers.namespace("HSLayers.Control","HSLayers.Control.UserGraphics");
HSLayers.Control.UserGraphics = OpenLayers.Class(
  OpenLayers.Control, {

    /**
     * displayClass
     * @type String
     */
    displayClass: "hsUserGraphics",

    /**
     * editing
     * @type {HSLayers.Control.Editing}
     * @name HSLayers.Control.UserGraphics.editing
     */
    editing: undefined,

    /**
     * layer
     * @type {OpenLayers.Layer.Vector}
     * @name HSLayers.Control.UserGraphics.layer
     */
    layer: undefined,

    /**
     * config option - display/do not display form for attributes editing
     * @type {Boolean}
     * @name HSLayers.Control.UserGraphics.editAttributes
     * @default true
     */
    editAttributes: undefined,

    /**
     * grid
     * @type {Ext.data.GridPanel}
     * @name HSLayers.Control.UserGraphics.grid
     */
    grid: undefined,

    /**
     * schema, which will be used for generating of the editing form
     * @type [{Object}]
     * @name HSLayers.Control.UserGraphics.formFields
     */
    formFields: [
        {
            fieldLabel: "Title",
            xtype: "textfield",
            width: 160,
            name: "title"
        },
        {
            fieldLabel: "Description",
            xtype: "textarea",
            width: 160,
            name: "description"
        }
    ],

    /**
     * listeners for activate and deactivate control events
     * @name HSLayers.Control.UserGraphics.eventListeners
     * @type Object
     */
    eventListeners: {
        'activate': function(){
            this._activateLayer();
            this.layer.setVisibility(true);
            this.map.setLayerIndex(this.layer,this.map.layers.length+1); 

            if (!this.editing) {
                var cfg = {
                    buttons: ["navigation","edit","move","point","line","polygon"],
                    activateTool: "line",
                    layer: this.layer
                };
                cfg = OpenLayers.Util.applyDefaults(this.editingCfg || {},cfg);
                this.editing = new HSLayers.Control.Editing(cfg);
                this.map.addControl(this.editing);

            }
            this.editing.activate();
            this.editing.redraw();
            
            // deactivate eding KEYBOARD handler
            this.editing.keyboardHandler.deactivate();
            
        },
        'deactivate': function(){
            this.editing.deactivate();
            this._deActivateLayer();
        }
    },

    /**
     * @constructor
     * @name HSLayers.Control.UserGraphics
     * @param {Object} options options for OpenLayers.Control.Panel
     * @param options.featuresGridCfg {Object} configuration for the :js:class:`HSLayers.FeaturesGrid` 
     */
    initialize: function(options) {
        options.editAttributes = (options.editAttributes === false ? false : true);
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },

    /**
     * setMap
     * @function
     * @private
     * @param {Object} options options for OpenLayers.Control.Panel
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    /**
     * activate layer
     * @private
     * @function
     */
    _activateLayer: function() {
        if (this._dropLayer === undefined) {
            this._dropLayer = false;
        }

        if (!this.layer) {
            this.layer = new OpenLayers.Layer.Vector(OpenLayers.i18n("User graphics"));
            this._dropLayer = this.layer.id;
            this.map.addLayer(this.layer);
        }

        this.layer.events.register("featureadded",this,this._onFeatureAdd);
        this.layer.events.register("featureselected",this,this._addPopupToMap);
        this.layer.setVisibility(true);

        if (!this.grid) {
            var cfg = OpenLayers.Util.applyDefaults({layer: this.layer}, this.featuresGridCfg || {});
            cfg.title = this.layer.title || this.layer.name;
            this.grid = new HSLayers.FeaturesGrid(cfg);
        }
    },

    /**
     * private function
     * @private
     * @function
     */
    _addPopupToMap: function(e) {
        if (this.editAttributes) {
            this.addPopup(e.feature);
        }
    },

    /**
     * deactivate layer
     * @private
     * @function
     */
    _deActivateLayer: function() {

        this.layer.events.unregister("featureadded",this,this._onFeatureAdd);
        this.layer.events.unregister("featureselected",this,this._addPopupToMap);
        this.grid._unRegisterEvents();
        this.grid.destroy();
        this.grid = undefined;
        //this.layer.setVisibility(false);

        //this.grid.hide();

    },

    /**
     * getgrid
     * @function
     * @returns {Ext.grid.GridPanel}
     */
    getGrid: function() {
        return this.grid;
    },

    /**
     * @function
     * @private
     */
    destroy: function() {

        if (this._dropLayer) {
            var layer = this.map.getLayer(this._dropLayer);
            if (layer) {
                layer.destroyFeatures();
                this.map.removeLayer(layer);
                layer.destroy();
            }
        }

        OpenLayers.Control.prototype.destroy.apply(this, arguments);

    },

    /**
     * feature select handler
     * @function
     * @private
     */
    _onFeatureSelect: function() {
    },

    /**
     * feature add handler
     * @function
     * @private
     */
    _onFeatureAdd: function(e) {
        var feature = e.feature;

        if (this.editAttributes) {
            
            // add form to target, which can be either "some div" or
            // Ext.Container (much better)
            if (this.target) {
                var form = this.getEditForm(feature,{
                    autoScroll: true,
                    width: 270,
                    height: 130
                });
                if (this.target instanceof Ext.Container) {
                    this.target.removeAll();
                    this.target.add(form);
                }
                else {
                    this.target.innerHTML = "";
                    form.renderTo(Ext.get(this.target));
                }
            }
            // create HSLayers.Popup and add the form there
            else {
                this.addPopup(feature);
            }
            if (this.editing.control.handler) {
                this.editing.control.handler.deactivate();
            }
        }
        else {
            // find feature value
            var get_feature_nr = function(feature,id) {
                var cls = feature.geometry.CLASS_NAME;
                var name = cls.search("Line") > -1 ? OpenLayers.i18n("Line") : 
                        (cls.search("Point") > -1 ? OpenLayers.i18n("Point") : OpenLayers.i18n("Polygon"));
                                
                var fid  = name +" "+String(id);
                var found = false;
                for (var i = 0, ilen = feature.layer.features.length; i < ilen; i++) {
                    var oldf = feature.layer.features[i];
                    if (oldf.attributes.title && (
                                (oldf.attributes.title == fid) ||
                                (oldf.attributes.title.value == fid))) {
                        found = true;
                    }
                }
                if (found) {
                    fid = get_feature_nr(feature, id+1);
                }
                return fid;
            };
            
            e.feature.attributes.title = {
                displayName: "Title",
                value: get_feature_nr(e.feature,1)
            };
            this.layer.events.triggerEvent("afterfeaturemodified",e);
        }
    },

    /**
     * create popup with edit form for given feature and add it to the map
     * @function
     * @name HSLayers.Control.UserGraphics.addPopup
     * @param {OpenLayers.Feature} feature `OpenLayers.Feature <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Feature/Vector-js.html>`_
     * @returns {HSLayers.Popup}
     */
    addPopup: function(feature) {
        var form = this.getEditForm(feature,{
            autoScroll: true,
            width: 270,
            height: 130
        });

        var lonlat = this._getFeatureCentroid(feature);

        var popup = new HSLayers.Popup({
            feature: feature,
            closeBox: true,
            closeBoxCallback: function(e) {
                this.hide();
                OpenLayers.Event.stop(e);
                var editing = this._ug.editing;
                if (editing.control.handler) {
                    editing.control.handler.activate(); // activate control again
                }
            },
            lonlat: lonlat,
            size: new OpenLayers.Size(300,230),
            contentHTML: " "
        });
        popup._ug = this;
        feature.layer.map.popups.map(function(p){p.map.removePopup(p);});
        feature.layer.map.addPopup(popup);
        form.render(popup.innerContentDiv);
        feature.popup = popup;
        form.on("destroy",function(){this.popup.hide();},feature);

        return popup;
    },

    /**
     * create and return Ext.Form.Panel usable for feature editing based on
     * :js:attr:`HSLayers.Control.UserGraphics.formFields`
     *
     * @name HSLayers.Control.UserGraphics.getEditForm
     * @function
     * @param {OpenLayers.Feature} feature `OpenLayers.Feature <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Feature/Vector-js.html>`_ 
     * @param {Object} configuration object
     * @returns `Ext.form.FormPanel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.FormPanel>`_ editing form
     */
    getEditForm: function(feature,config) {
        config = Ext.apply(config,{
            //title: feature.attributes.title || feature.id,
            frame: false,
            bodyStyle: {border: "none"},
            labelWidth: 75, 
            items: this.getFeatureFormFields(feature), 
            buttons: [
                {
                    text: OpenLayers.i18n("Save attributes"),
                    tooltip: OpenLayers.i18n("Save feature"),
                    icon: OpenLayers.Util.getImagesLocation()+"accept.png",
                    width: 50,
                    scope: feature,
                    handler: function() {
                        var items = this.form.getForm().items;
                        var color;
                        for (var i = 0, ilen = items.length; i < ilen; i++) {
                            var item = items.get(i);
                            var value = item.getValue();
                            var label = item.fieldLabel;
                            var name = item.name;


                            // fields that start with "_" are not "normal"
                            // attributes
                            if (name.search("_") == -1) {
                                if (typeof(this.attributes[name]) != "string" || 
                                    this.attributes[name] === undefined) {
                                    this.attributes[name] = {displayName: label, value: value};
                                }
                                else {
                                    this.attributes[name] = vals[i];
                                }
                            }
                            else  {
                                switch(name) {
                                    case "_COLOR":
                                        if (value.search("#") == -1) {
                                            value = "#"+value;
                                        }
                                        feature.style = OpenLayers.Util.extend({}, this.layer.styleMap.styles["default"].defaultStyle);
                                        feature.style = OpenLayers.Util.extend(feature.style, {strokeColor: value,fillColor: value});
                                        break;
                                }
                            }
                        }

                        this.layer.redraw();
                        this.layer.events.triggerEvent("afterfeaturemodified",{feature:this});
                        var editing = this.popup._ug.editing;
                        if (editing.control.handler) {
                            editing.control.handler.activate(); // activate the control again
                        }
                        this.form.destroy();
                    }
                },
                {
                    text: OpenLayers.i18n("Delete geometry"),
                    tooltip: OpenLayers.i18n("Delete this feature"),
                    icon: OpenLayers.Util.getImagesLocation()+"cross.png",
                    width: 50,
                    scope: feature,
                    handler: function() {
                        this.form.destroy();
                        var layer = this.layer;
                        var editing = this.popup._ug.editing;
                        if (editing.control.handler) {
                            editing.control.handler.activate(); // activate the control again
                        }
                        this.layer.removeFeatures([this]);
                        this.destroy();
                    }
                }
            ]
        });
        var form =  new Ext.form.FormPanel(config);
        //form.getForm().setValues(feature.attributes);
        //form.getForm().setValues({
        //    title: feature.attributes.title,
        //    length: Math.round(feature.geometry.getLength()) || "Ø" ,
        //    area: Math.round(feature.geometry.getArea()) || "Ø"
        //});
        feature.form = form;
        return form;
    },

    /**
     * generate list of form fields for particular feature
     * 
     * @name HSLayers.Control.UserGraphics.getFeatureFormFields
     * @function
     * @param feature {OpenLayers.Feature} `feature <http://dev.openlayers.org/apidocs/files/OpenLayers/Feature/Vector-js.html>`_
     * @return [{Object}] object with form items configuration 
     */
    getFeatureFormFields: function(feature) {
        var items = [];
        for (var i in feature.attributes) {
            var attr = feature.attributes[i];

            var label;
            var value;
            var name =i;

            if (typeof(attr) == "string") {
                label = i;
                value = attr;
            }
            else {
                if (attr.displayName) {
                    label = attr.displayName;
                }
                else {
                    label = i;
                }
                if (attr.value) {
                    value = attr.value;
                }
            }

            items.push({
                fieldLabel: OpenLayers.i18n(label),
                value: value,
                xtype: (i == "description" ? "textarea" : "textfield"),
                width: 160,
                name: name
            });


        }
        
        if (items.length == 0) {
            for (var j = 0, jlen = this.formFields.length; j < jlen; j++) {
                this.formFields[j].fieldLabel = OpenLayers.i18n(this.formFields[j].fieldLabel);
                items.push(Ext.apply({},this.formFields[j]));
            }
        }

        if (Ext.ux.ColorField) {
            var hex = (feature && feature.style ? feature.style.strokeColor : OpenLayers.Feature.Vector.style["default"].strokeColor).replace("#","");
            var fb = new Ext.ux.ColorField({hideOnClick: true, name:"_COLOR",fieldLabel: OpenLayers.i18n("Color"), value: hex, fallback: true})
            items.push(fb);  // initial selected color
        }

        return items;

    },

    /**
     * set layer
     * 
     * @function
     * @name HSLayers.Control.Editing.setLayer
     * @param layer {OpenLayers.Layer.Vector} `vector layer <http://dev.openlayers.org/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
     */
    setLayer: function(layer) {
        if (this.activate) {
            this.deactivate();
        }
        this.layer = layer;

        if (this.editing) {
            this.editing.deactivate();
            this.editing.setLayer(layer);
            this.editing.activate();
        }

    },

    /**
     * get centroid for all feature types
     * @function
     * @private
     */
    _getFeatureCentroid: function(feature) {
        var lonlat;
        var centr;
        if (feature.geometry) {

            // for area, get ceontrid
            if (feature.geometry.getArea()) {
                centr = feature.geometry.getCentroid();
                lonlat = new OpenLayers.LonLat(centr.x, centr.y);
            }
            else if (feature.geometry.getLength()) {
                // for line, get the middle point
                var centr;
                var vertices = feature.geometry.components;
                var len = vertices.length;
                if (len%2 == 1) {
                    centr = vertices[(len-1)/2+1];
                }
                else {
                    var idx = len/2-1;

                    var prevVertex = feature.geometry.components[idx];
                    var nextVertex = feature.geometry.components[idx + 1];
                    var x = (prevVertex.x + nextVertex.x) / 2;
                    var y = (prevVertex.y + nextVertex.y) / 2;
                    centr = new OpenLayers.Geometry.Point(x, y);
                }
                lonlat = new OpenLayers.LonLat(centr.x, centr.y);
            }
            else {
                // for point, get centroid
                centr = feature.geometry.getCentroid();
                lonlat = new OpenLayers.LonLat(centr.x, centr.y);
            }
        }
        else {
            // for no geometry, put it left-bottom corner
            centr = {x:feature.layer.map.getExtent().left, y: feature.layer.amp.getExtent().bottom};
            lonlat = new OpenLayers.LonLat(centr.x, centr.y);
        }

        return lonlat;
    },

    CLASS_NAME: "HSLayers.Control.UserGraphics"
});    
