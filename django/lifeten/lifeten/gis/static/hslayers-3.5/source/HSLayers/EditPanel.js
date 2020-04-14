/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
 *
 * This file is part of HSLayers.
 *
 * This files is NOT released under GNU/GPL. For further informations, ask
 * 
 * Stanislav Holy
 * Director
 * standa at bnhelp cz
 *
 * Help Service - Remote Sensing s.r.o.
 * 256 01 - Bensov
 * Czech republic
 */
Ext.namespace("HSLayers.EditPanel");


/**
 * EditPanel is special panel with editing functions
 *
 * @class HSLayers.EditPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
 *
 * @constructor
 * @param {Object} config
 * @param {String} [config.title = OpenLayers.i18n("Edit")] title for the panel
 * @example 
 * var infoPanel = new HSLayers.EditPanel({
 *              renderTo: Ext.get("edit")
 *      });
 * TODO
 */
HSLayers.EditPanel = function(config) {

    config = config ? config : {};

    config.title =  (config.title ? config.title : OpenLayers.i18n("Edit"));

    config.autoScroll = true;
    config.deferredRender = false;

    // layerForm
    this.layerCombo = new Ext.form.ComboBox({
        store: this.editLayerStore,
        displayField:'title',
        valueField: "layer",
        mode: 'local',
        forceSelection: true,
        editable:false,
        triggerAction: 'all',
        selectOnFocus:true,
        width: 150,
        listWidth: 150,
        fieldLabel: OpenLayers.i18n("Layer"),
        listeners: {
		"select": this.onLayerSelected, 
		scope:this
        },
        emptyText: OpenLayers.i18n('Select a layer')+"..."
    });

    var clearButton = new Ext.Button({
            //text: OpenLayers.i18n("Clear"),

            icon: OpenLayers.Util.getImagesLocation()+'/empty.gif',
            cls: 'x-btn-icon',
            scope: this,
            tooltip: OpenLayers.i18n("Clear the form and edited object"),
            handler: this.clearPanel
    });

    var inputButton = new Ext.Button({
            //text: OpenLayers.i18n("Clear"),
            icon: OpenLayers.Util.getImagesLocation()+'/input.png',
            tooltip: OpenLayers.i18n("Keyboard input"),
            disabled: (window.inputSour ? false : true),
            cls: 'x-btn-icon',
            scope: this,
            handler: this.onInputButtonClicked
    });

    this.layerForm = new Ext.Panel({
        layout: 'fit'
    });

    this.attributesPanel = new Ext.Panel({
        title: OpenLayers.i18n("Edit"),
        tbar: [
                OpenLayers.i18n("Layer")+": ",
                this.layerCombo,
                new Ext.Toolbar.Separator(),
                inputButton,
                new Ext.Toolbar.Separator(), 
                clearButton
        ],
        items:  [this.layerForm]
    });

    config.items = [this.attributesPanel];

    //
    HSLayers.EditPanel.superclass.constructor.call(this, config);

    this.activate(0);

    if (this.layer) {
        if (this.layer.loadingTree === false && this.layer.editLayers) {
            this.setLayer();
        }
        else {
            this.layer.events.register("layerloaded",this,this.setLayer);
        }
    }

};

Ext.extend(HSLayers.EditPanel, Ext.TabPanel, {

    /**
     * editing
     * @name HSLayers.EditPanel.editing
     * @type HSLayers.Control.Editing
    */
    editing: null,

    /**
     * the feature, which is added to layer soon, is does already have
     * attribute form
     * @name HSLayers.EditPanel.featureExists
     * @type HSLayers.Control.Editing
     * @private
    */
    featureExists: false,

    /**
     * layer object to be edited
     * @name HSLayers.EditPanel.editLayer
     * @type Object
     * @private
    */
    editLayer: null,

    /**
     * panel for displayin the attribute form
     * @name HSLayers.EditPanel.attributesPanel
     * @type Ext.Panel
    */
    attributesPanel: null,

    /**
     * url for the server-side editing script
     * @name HSLayers.EditPanel.editorUrl
     * @type String
    */
    editorUrl: null,

    /**
     * Ext.data.SimpleStore for list of layers, which can be edited
     * @name HSLayers.Control.Editing.editLayerStore
     * @type Ext.data.SimpleStore
     */
    editLayerStore: new Ext.data.SimpleStore({
        fields: ["name", "title", "layer"]
    }),

    /**
     * selection of the layer to be edited combox
     * @name HSLayers.EditPanel.layerCombo
     * @type Ext.form.ComboBox
    */
    layerCombo: null,

    /**
     * layer
     * @name HSLayers.EditPanel.layer
     * @type HSLayers.Layer.MapServer
    */
    layer: null,

    /**
     * map
     * @name HSLayers.EditPanel.map
     * @type OpenLayers.Map
     */
    map: null,

    /**
     * set and initialize this layer object. called, on "layerloaded" event
     * fired
     * @name HSLayers.EditPanel.setLayer
     * @function
     */
    setLayer: function() {
        var data = [];
        for (var i = 0; i < this.layer.editLayers.length; i++) {
            var layer = this.layer.editLayers[i];
            data.push([layer.name, layer.title,layer]);
        }
        this.editLayerStore.loadData(data);
    },

    /**
     * display editing operation result
     * @name HSLayers.EditPanel.deleteddisplayResult
     * @function
     * @param {OBject} result form
     */
    displayResult: function(msg) {
        this.layerForm.body.update(
            '<div class="hs-edit-msg">'
            + OpenLayers.i18n('Feature')
            + " "
            + OpenLayers.i18n(msg)+".</div>");
    },

    /**
     * layer selected, save the current edited layer, if any, and start to
     * editing new one
     * @name HSLayers.EditPanel.onLayerSelected
     * @function
     */
    onLayerSelected: function(combo,record) {
        if (this.editing) {
            this.editing.layer.destroyFeatures();
        }
        this.editLayer = record.data.layer;
        this.displayToolBar(this.editLayer);
        this.clearPanel();
        record.data.layer.toggleVisibility(true,true);

        // snapping panel
        if (!this.settingsPanel) {
		this.settingsPanel = new HSLayers.EditPanel.SettingsPanel({
                    editLayer: this.editLayer,
                    layer: record.data.layer,
                    listeners: {snapChanged:this.onSnapChanged,scope:this}
                    });
		this.add(this.settingsPanel);
	}
	else {
		this.settingsPanel.updateSettings(record.data.layer);
        }
	this.doLayout();
        this.settingsPanel.onSnapChanged();
    },

    /**ce - linie
     * display the editing tool bar
     * @param {String}|{Object} layer name of the layer to be edited
     */
     displayToolBar: function(layerObj,forNewFeature,activateEditing) {

        // toolbar exists, remove it
        if (this.editing) {
            this.editing.destroy();
            this.editing = null;
        }

        for (var i =0; i < this.map.controls.length; i++) {
            if (this.map.controls[i].CLASS_NAME ==
                "HSLayers.Control.Editing") {
            }
        }

        // snaping
        var snappingOptions = this.snappingOptions || {};
        //snappingOptions.layer = this.editing.layer;
        //snappingOptions.editLayer = this.layer;
        //snappingOptions.snapParams.edit = this.editLayer.name;
        // /snaping
        
        // load eventually stored attributes from ReadState control
        var readState = this.map.getControlsBy("CLASS_NAME","HSLayers.Control.ReadState");
        if (readState.length > 0) {
            if (readState[0].editingParams) {
                //console.log("TODO: ",readState[0].editingParams);
            }
        }

        this.toolbarOptions = [layerObj,forNewFeature,activateEditing];

        // init new toolbar
        var activate = (activateEditing ? "modify" : layerObj.edit.type );
        this.editing = new HSLayers.Control.Editing({
            buttons: ["modify","move",layerObj.edit.type],
            baseLayer: this.layer,
            activateTool: activate,
            snapCfg: snappingOptions
        });
        this.map.addControl(this.editing);


        // when new feature added, display the form
        this.editing.layer.events.register("featureadded",this,this.onNewFeatureAdded);

        // snap events
        this.editing.hssnap.events.register("snapchanged",this,this.onSnapParamsChanged);
        //this.settingsPanel.onSnapChanged(this.snappingOptions.snapParams);   

        // do not display the form, when we are editing existing feature,
        // which was put in the map using this.edit method
        if (forNewFeature == false) {
            this.editing.layer.events.register("beforefeatureadded",this,this.onExistingFeatureAdded);
        }
     },

    /**
     * feature added, add the attribute form
     */
    onNewFeatureAdded: function() {
        if (this.featureExists == false) {
            this.addAttributeForm((this.layer.project ? this.layer.project : this.layer.params.project),
                                            this.editLayer, -1);
                                                              // TODO the
                                                              // project must be defined 
                                                              // somewhere: possibly redefine the
                                                              //MapServerLayer ?
        }
        this.featureExists = true;
    },

    /**
     * feature added, add the attributes form
     */
    onExistingFeatureAdded: function() {
        this.featureExists = true;
        this.editing.layer.events.unregister("beforefeatureadded",this,this.onExistingFeatureAdded);
    },

    /**
     * called, when the feature id identified using the query control and
     * user want's to edit it
     */
    edit: function(projectName,layerName,featureId) {


        // set the title to combo box
        this.editLayer = this.layer.getLayer(layerName);
        this.layerCombo.setValue(this.editLayer.title);

        var idx = this.editLayerStore.find("name",this.editLayer.name);
        var record = this.editLayerStore.getAt(idx);

        this.layerCombo.fireEvent("select",this.layerCombo, record);
        // activate the first (modify) control
        this.displayToolBar(this.editLayer,false,true);
        this.editing.setControl(0);
        this.addAttributeForm(projectName, this.editLayer, featureId);

    },

    /**
     * called, when deleted
     */
    deleteFeature: function(projectName,layerName,featureId) {

        Ext.MessageBox.confirm(OpenLayers.i18n('Delete'), 
                            OpenLayers.i18n('Really remove selected feature?'),
            function(btn) {

                if (btn == "yes") {
                        var params = {
                            lyrname: layerName,
                            project: projectName,
                            request: "delete",
                            recno: featureId
                        };

                        var onDone = function(r) {
                            eval("var result="+r.responseText);
                            if(result.success){
                              this.displayResult("deleted");
                              this.layer.params.savequery = 3;
                              this.layer.redraw(true);
                              this.layer.params.savequery = undefined;
                            }
                            else{
                                Ext.Msg.show({
                                  title: OpenLayers.i18n('Error'),
                                  msg: result.msg,
                                  icon: Ext.MessageBox.ERROR
                                });
                            }
                        };


                        var url = new OpenLayers.Request.GET({
                                url: this.editorUrl,
                                params: params, 
                                success: onDone,
                                failure: onDone,
                                scope: this
                            });

                        this.fireEvent("featuredeleted");
                }
                else {
                    //this.displayResult({'msg':"not deleted",recno:featureId});
                }
            }
        ,this);

    },

    // private
    // init this EditPanel
    initComponent : function(){
        HSLayers.EditPanel.superclass.initComponent.call(this);
        this.addEvents( 'beforeLoadForm',"featuredeleted")
    },

    onSaveFormSuccess : function(form,response){
        this.displayResult("saved");
        this.featureExists = false;
    },

    onSaveFormFailure : function(form,response){
        Ext.Msg.show({
            title: OpenLayers.i18n('Error'),
            msg: response.result.msg,
            icon: Ext.MessageBox.ERROR
        });
        this.featureExists = false;
    },

    /**
     * load attributes form for editing
     * @function
     * @name HSLayers.EditPanel.addAttributeForm
     * @param {String} project name of the MapServer project
     * @param {Object} layer edit layer name
     * @param {Integer} id record number
     */
    addAttributeForm: function(project, editLayer, id) {

        // set snapping to record number
        this.editing.hssnap.snapParams.rec = id;

        // fire the event
        this.fireEvent('beforeLoadForm', this, editLayer ,this.layer);
        this.activate(0);

        // load the attributes form
        this.editing.loadForm({
            url: this.editorUrl,
            project: project,
            baseLayer: this.layer,
            layer: editLayer.name,
            recno: id,
            applyTo: this.layerForm,
            scope:this,
            geomType: editLayer.edit.type,
            success: this.onSaveFormSuccess,
            failure: this.onSaveFormFailure
        }); 
    },

    /**
     * set this map object
     * @param OpenLayers.Map map
     */
    setMap: function(map) {
        this.map = map;
    },

    /**
     * start editing new feature
     */
    clearPanel: function() {
        if (this.editing) {
            this.editing.layer.destroyFeatures();
            this.layerForm.body.update();
            this.layerForm.doLayout();
            this.featureExists  = false;
            this.editing.hssnap.snapParams.rec = -1;
        }
    },

    /**
     * start manual input
     */
    onInputButtonClicked: function() {
        if (window.inputSour) {
            inputSour();
        }
    },

    /**
     * onSnapChanged in settings panel
     * @param {Object} snapObject object with snapping attributes
     */
    onSnapChanged: function(snapObj) {

        for (var i in snapObj) {
            switch(i) {
                case "distance": 
                    this.editing.setSnapTolerance(snapObj.active ? snapObj[i]:0);
                    break;
                case "snapToSelf":
                    this.editing.toggleSnap(snapObj[i]);
                    break;
                //case "split":
                //    this.editing.toggleSplit(snapObj[i]);
                //    break;
            }
        }
        this.editing.hssnap.updateParams(snapObj,true);
    },

    /**
     * onSnapParamsChanged
     * @param {Object} snapParams HSLayers.Snapping.snapParams object with snapping attributes
     */
    onSnapParamsChanged: function(snapParams) {

        this.settingsPanel.distance.setValue(snapParams.tol);
        this.settingsPanel.snapOn.setValue(snapParams.active);
    },

    /**
     * name of this class
     * @name HSLayers.EditPanel.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.EditPanel"
});
