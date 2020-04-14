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
Ext.namespace("HSLayers.EditPanel.SettingsPanel");


/**
 * SettingsPanel is special panel with editing functions
 *
 * @class HSLayers.EditPanel.SettingsPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel">Ext.form.FormPanel</a>
 *
 * @constructor
 * @param {Object} config
 * @param {String} [config.title = OpenLayers.i18n("Edit")] title for the panel
 */
HSLayers.EditPanel.SettingsPanel = function(config) {

    config = config ? config : {};

    config.title =  (config.title ? config.title : OpenLayers.i18n("Settings"));
    config.layout = 'fit'; 
    config.frame = true;

    this.units = new Ext.form.ComboBox({
        fieldLabel: OpenLayers.i18n("Units"),
        store: [['m','meters'],['px','pixels']],
        mode: 'local',
        width: 80,
        forceSelection:true,
        editable:false,
        disabled: true,
        triggerAction: 'all',
        listeners: {"select":this.onSnapChanged, scope:this},
        value: "m"
    });

    this.distance = new Ext.form.TextField({
        fieldLabel: OpenLayers.i18n("Distance"),
        disabled: true,
        enableKeyEvents: true,
        listeners: {"keyup":this.onSnapChanged, scope:this},
        value: "5",
        width: 80
    });

    this.snapOn = new Ext.form.Checkbox({
        fieldLabel: OpenLayers.i18n("Active"),
        listeners: {"check":this.onSnapChanged, scope:this},
        checked: false
    });

    this.snapToSelf = new Ext.form.Checkbox({
        fieldLabel: OpenLayers.i18n("Snap to self"),
        listeners: {"check":this.onSnapChanged, scope:this},
        checked: true
    });

    this.split = new Ext.form.Checkbox({
        fieldLabel: OpenLayers.i18n("Split"),
        listeners: {"check":this.onSnapChanged, scope:this},
        checked: true
    });


    this.snapFieldSet =  new Ext.form.FieldSet({
        items: [this.snapOn, this.distance, this.units  /*, this.snapToSelf*/],
        // checkboxToggle: true,
        checkboxName: "snapOn",
        collapsible: false,
        onCheckClick: function() {
            Ext.form.FieldSet.prototype.onCheckClick.apply(this,arguments);
            console.log(this);
        },
        autoHeight:true,
        defaultType: 'textfield',
        title: OpenLayers.i18n("Snapping")
    });

    this.editFieldSet =  new Ext.form.FieldSet({
        items: [this.split],
        collapsible: true,
        autoHeight:true,
        defaultType: 'textfield',
        title: OpenLayers.i18n("Editing")
    });


    this.color = new Ext.ColorPalette({value:'993300',
        fieldLabel: OpenLayers.i18n("Line color")});

    this.width = new Ext.form.TextField({
        fieldLabel: OpenLayers.i18n("Line width"),
        value: "1"
    });
    
    var lineFieldSet =  new Ext.form.FieldSet({
        items: [ this.width, this.color],
        collapsible: true,
        autoHeight:true,
        defaultType: 'textfield',
        title: OpenLayers.i18n("Line")
        });


    //this.attributes = new Ext.form.Checkbox({
    //    fieldLabel: OpenLayers.i18n("Display attributes form"),
    //    value: true,
    //});

    //var attributesFieldSet =  new Ext.form.FieldSet({
    //    items: [ this.attributes],
    //    collapsible: true,
    //    autoHeight:true,
    //    defaults: {width: 210},
    //    defaultType: 'textfield',
    //    title: OpenLayers.i18n("Attributes")
    //    });

    config.items = [this.snapFieldSet /*,this.editFieldSet , lineFieldSet*/]; //TODO jednou dodelat vyber barev ...

    //
    HSLayers.EditPanel.SettingsPanel.superclass.constructor.call(this, config);

    // after initialization

    var vertexColumn = new Ext.grid.CheckColumn({
                header: OpenLayers.i18n("Snap"),
                dataIndex: 'snap',
                width: 45
            });

    // this is not used
    var linesColumn = new Ext.grid.CheckColumn({
                header: OpenLayers.i18n("Lines"),
                dataIndex: 'lines',
                width: 55
            });

    // column model
    var cm = new Ext.grid.ColumnModel({
        defaults: {
            sortable: false,
            menuDisabled: true,
            width: 500
        },
        columns: [
            vertexColumn,
            {
                header: OpenLayers.i18n("Layer"), 
                dataIndex: 'title', id: 'lyr-title'
            }           
        ]
    });



    // create the editor grid
    this.snappingGrid = new Ext.grid.EditorGridPanel({
        store: this.getStore(),
        cm: cm,
        frame: true,
        autoHeight: true,
        hideHeaders: true,
        title: OpenLayers.i18n('Snap layers'),
        disabled: true,
        width: '100%',
        plugins: [vertexColumn],
        //autoExpandColumn: 'lyr-title',
        clicksToEdit: 1
    });
    this.snapFieldSet.add(this.snappingGrid);
    vertexColumn.grid.addListener("clicked",this.onSnapClicked,this);

    // grid is empty, fill it
    this.updateSnapLayers();
};

Ext.extend(HSLayers.EditPanel.SettingsPanel, Ext.form.FormPanel, {

    /**
     * snapping distance
     * @name HSLayers.EditPanel.SettingsPanel.distance
     * @type Float
     */
    distance: null,

    /**
     * snapping layers grid
     * @name HSLayers.EditPanel.SettingsPanel.snappingGrid
     * @type Ext.data.Grid
     */
    snappingGrid: null,
    
    /**
     * snapping units
     * @name HSLayers.EditPanel.SettingsPanel.units
     * @type String
     */
    units: null,

    /**
     * snapping to nodes
     * @name HSLayers.EditPanel.SettingsPanel.snapToNode
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Select">Ext.form.CheckBox</a>
     */
    snapToNode: null,

    /**
     * Field set with snapping configration
     * @name HSLayers.EditPanel.SettingsPanel.snapFieldSet
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Select">Ext.form.FieldSet</a>
     */
    snapFieldSet: null,

    /**
     * snap field was checked
     * @name HSLayers.EditPanel.SettingsPanel.snapChecked
     * @type Boolean
     */
    snapChecked: null,

    /**
     * Field set with editing configration
     * @name HSLayers.EditPanel.SettingsPanel.editFieldSet
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Select">Ext.form.FieldSet</a>
     */
    editFieldSet: null,

    /**
     * snapping to lines
     * @name HSLayers.EditPanel.SettingsPanel.snapToLine
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Select">Ext.form.CheckBox</a>
     */
    snapToLine: null,

    /**
     * base mapserver edited layer
     * @name HSLayers.EditPanel.SettingsPanel.editLayer
     * @type HSLayers.Layer.MapServer
     */
    editLayer: null,

    /**
     * layer edited
     * @name HSLayers.EditPanel.SettingsPanel.layer
     * @type Object
     */
    layer: null,

    /**
     * line color
     * @name HSLayers.EditPanel.SettingsPanel.distance
     * @type String
     */
    color: null,
    
    /**
     * line width
     * @name HSLayers.EditPanel.SettingsPanel.width
     * @type Float
     */
    width: null,

    /**
     * avaliable snap layers
     * @name HSLayers.EditPanel.SettingsPanel.snapLayers
     * @type Float
     */
    snapLayers: {},

    /**
     * set this snaping layer
     * @name HSLayers.EditPanel.SettingsPanel.setLayer
     * @param {HSLayers.Layer.MapServer} layer snapping layer
     * @function
     */
    setLayer: function(layer) {
        this.layer = layer;
    },

    /**
     * clicked on snap checkbox 
     * @name HSLayers.EditPanel.SettingsPanel.onSnapClicked
     * @param {Ext.grid.Record} record 
     * @function
     */
    onSnapClicked: function(record) {
        var name = record.data.name; 
        var snap = record.data.snap;

        this.onSnapChanged();
        
    },

    /**
     * soma snapping attribute has changed
     * @name HSLayers.EditPanel.SettingsPanel.onSnapChanged
     * @param {Ext.grid.Record} record 
     * @function
     */
    onSnapChanged: function(f, e) {
        var layers = [];

        this.snapChecked = this.snapOn.checked;
        if(this.snapOn.checked){
            this.distance.enable();
            this.units.enable();
            this.snappingGrid.enable();

            for (var i in this.layer.edit.snapLayers){
                if (this.layer.edit.snapLayers[i].record && this.layer.edit.snapLayers[i].record.data.snap) {
                    layers.push(i);
                }
            }
        }
        else {
            this.distance.disable();
            this.units.disable();
            this.snappingGrid.disable();
        }

        this.fireEvent("snapChanged",{
            edit: (this.snapOn.checked ? this.layer.name : null),
            layers: layers,
            split: this.split.checked,
            //snapToSelf: this.snapToSelf.checked,
            active: this.snapOn.checked,
            distance: this.distance.getValue(),
            units:this.units.getValue()
        });

    },

    /**
     * Init component method 
     *
     * @name HSLayers.EditPanel.SettingsPanel.initComponent
     */
    initComponent : function(){
        HSLayers.EditPanel.SettingsPanel.superclass.initComponent.call(this);

        this.addEvents("snapChanged");
    },

    updateSettings : function(layer){
	this.layer = layer;
	this.updateSnapLayers();
        this.snapOn.setValue(this.snapChecked);
        this.onSnapChanged();
    },

    updateSnapLayers: function() {

            this.snappingGrid.store.removeAll();
	    // data
	    var data = [];
	    for (var i in this.layer.edit.snapLayers) {
		if (i == "remove" || i == "indexOf") {
		    continue;
		}
                if (typeof(this.layer.edit.snapLayers[i]) == "string") {
                    this.layer.edit.snapLayers[i] = {
                            title: this.layer.edit.snapLayers[i],
                            record: new Ext.data.Record({name:i,title:this.layer.edit.snapLayers[i],
                                    snap:  true
                                    })
                    }
                }
		data.push(this.layer.edit.snapLayers[i].record);
	    }

            // add data and show/hide the snappingGrid
            this.snappingGrid.store.add(data);
            if (this.snappingGrid.store.getCount() > 0) {
                this.snappingGrid.show();
            }
            else {
                this.snappingGrid.hide();
            }
            this.snappingGrid.doLayout();
            this.snapFieldSet.doLayout();
	    this.doLayout();

    },

    getStore: function() {
    // create the Data Store

        try {
            return new Ext.data.SimpleStore({
                fields: ["name","title","snap"]
            });
        } catch(e){
            return new Ext.data.ArrayStore({
                fields: ["name","title","snap"]
            });
        }
    },

    /**
     * name of this class
     * @name HSLayers.EditPanel.SettingsPanel.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.EditPanel.SettingsPanel"

});

Ext.grid.CheckColumn = function(config){
    Ext.apply(this, config);
    if(!this.id){
        this.id = Ext.id();
    }
    this.renderer = this.renderer.createDelegate(this);
};

Ext.grid.CheckColumn.prototype ={
    
    init : function(grid){
        this.grid = grid;
        this.grid.on('render', function(){
            var view = this.grid.getView();
            view.mainBody.on('mousedown', this.onMouseDown, this);
        }, this);
    },

    initComponent: function(){
        Ext.grid.CheckColumn.superclass.initComponent.call(this);
        this.addEvents("clicked");
    },

    onMouseDown : function(e, t){
        if(t.className && t.className.indexOf('x-grid3-cc-'+this.id) != -1){
            e.stopEvent();
            var index = this.grid.getView().findRowIndex(t);
            var record = this.grid.store.getAt(index);
            record.set(this.dataIndex, !record.data[this.dataIndex]);
            this.grid.fireEvent("clicked",record);
        }
    },

    renderer : function(v, p, record){
        p.css += ' x-grid3-check-col-td'; 
        return '<div class="x-grid3-check-col'+(v?'-on':'')+' x-grid3-cc-'+this.id+'">&#160;</div>';
    }
};
