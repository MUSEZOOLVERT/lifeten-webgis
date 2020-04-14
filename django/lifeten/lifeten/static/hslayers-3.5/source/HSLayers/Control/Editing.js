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
HSLayers.namespace("HSLayers.Control","HSLayers.Control.Editing");
HSLayers.Control.Editing = OpenLayers.Class(
  OpenLayers.Control.Panel, {

    /**
     * displayClass
     * @type String
     */
    displayClass: "hsEditPanel",

    /**
     * event types
     * @type [String]
     */
    EVENT_TYPES: ["toolchanged"],

    /**
     * form div id
     * @type String
     */
    formId: "formular",

    /**
     * ext form object
     * @type {Ext.form}
     */
    extForm: null,

    /**
     * navigationModifierPressed
     * @type {Boolean}
     */
    navigationModifierPressed: false,

    /**
     * layer
     * @type OpenLayers.Layer.Vector
     */
    layer: null,

    /**
     * keyboard handler
     * @type OpenLayers.Handler.Keyboard
     */
    keyboardHandler: null,

    /**
     * split handler
     * @type {OpenLayers.Control.Split}
     * @name HSLayers.Control.Editing.split
     */
    split: null,

    /**
     * controls
     * @type {Array}
     * @name HSLayers.Control.Editing.controls
     * @private
     */
    controls: [],

    /**
     * other panels in the map
     * @type [{OpenLayers.Control.Panel}]
     * @name HSLayers.Control.Editing.panels
     */
    panels: [],

    /**
     * snapping handler
     * @type {OpenLayers.Control.Snap}
     * @name HSLayers.Control.Editing.snap
     */
    snap: null,

    /**
     * buttons array of strings,
     * "point","line","polygon","edit","move","navigate"
     * @name HSLayers.Control.Editing.buttons
     * @type [String]
     */
    buttons: ["edit","move","point","line","polygon"],

    /**
     * Activate snap
     * @name HSLayers.Control.Editing.snapActive
     * @type Boolean
     */
    snapActive: true,

    /**
     * Activate split
     * @name HSLayers.Control.Editing.splitActive
     * @type Boolean
     */
    splitActive: true,

    /**
     * snapping radius in pixels 
     * @type Integer
     */
    snapping: 10,

    /**
     * styleMap for edited features
     * @type OpenLayers.StyleMap
     */
    styleMap: null,

    /**
     * @constructor
     * @param {Object} options options for OpenLayers.Control.Panel
     *
     */
    initialize: function(options) {
        this.EVENT_TYPES =
            HSLayers.Control.Editing.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.Panel.prototype.EVENT_TYPES
        );

        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);

        // create this layer, if does not exist yet
        this._destroyLayer = false;
        if (!this.layer) {
            this._destroyLayer = true;
            this.layer = new OpenLayers.Layer.Vector(OpenLayers.i18n("Edit layer"),
                {
                    visibility: true,
                    displayInLayerSwitcher: false,
                    saveWMC: false
            });
            this.layer.styleMap = HSLayers.Control.Editing.styles;
        }
        this.setLayer(this.layer);
        

        // add default controls -- vector editing
        var controls = [];

        // convert buttons to array
        if (typeof(this.buttons) == "string") {
            this.buttons = [this.buttons];
        }

        var tmpButtons = {};
        var style = OpenLayers.Feature.Vector.style["default"];

        // add buttons
        for (var i = 0; i < this.buttons.length; i++) {
            var control = null;
            switch(this.buttons[i]) {
                case "navigate":
                    control = new OpenLayers.Control.Navigation();
                    control._name = "navigate";
                    tmpButtons["navigate"] = control;
                    break;
                case "modify":
                case "edit":
                    control = new OpenLayers.Control.ModifyFeature(this.layer, {
                        mode: OpenLayers.Control.ModifyFeature.RESHAPE,
                        displayClass: "hsControlModifyFeature"
                    });
                    control.deleteCodes = [OpenLayers.Event.KEY_DELETE];
                    control._name = "modify";
                    tmpButtons["modify"] = control;
                    control.events.register("activate",control,function() {
                        this.layer._control = this;
                    });
                    this.layer.events.register("featureremoved",control,function() {
                        if (this.layer) {
                            this.layer.removeFeatures(this.virtualVertices, {silent: true});
                            this.layer.removeFeatures(this.vertices, {silent: true});
                            this.layer.redraw();
                        }
                    });
                    break;
                case "move":
                    control = new OpenLayers.Control.ModifyFeature(this.layer, {
                        displayClass: "hsControlDragFeature",
                        mode: OpenLayers.Control.ModifyFeature.DRAG});
                    control.deleteCodes = [OpenLayers.Event.KEY_DELETE];
                    control._name = "move";
                    tmpButtons["move"] = control;
                    control.events.register("activate",control,function() {
                        this.layer._control = this;
                    });
                    break;
                case "point":
                    control = new HSLayers.Control.DrawPoint(this.layer, {
                        handlerOptions: {layerOptions: {style:style}},
                        'displayClass': 'hsControlDrawFeaturePoint'
                    });
                    control._name = "point";
                    tmpButtons["point"] = control;
                    break;
                case "line":
                    control = new HSLayers.Control.DrawLine(this.layer, {
                        'displayClass': 'hsControlDrawFeaturePath',
                        handlerOptions: {freehandToggle: null, layerOptions: {style:style}} 
                    });
                    control._name = "line";
                    tmpButtons["line"] = control;
                    break;
                case "polygon":
                    control = new HSLayers.Control.DrawPolygon(this.layer, 
                        {'displayClass': 'hsControlDrawFeaturePolygon',
                            handlerOptions: {
                                    freehandToggle: null, 
                                    layerOptions: {style:style},
                                    holeModifier: "ctrlKey"
                            } 
                        });
                    control._name = "polygon";
                    tmpButtons["polygon"] = control;
                    break;
            }
            if(control){ 
              //control.events.unregister("activate", this,this.onEditButtonActivated);
              control.events.register("activate",this,this.onEditButtonActivated);
              controls.push(control);
              control.setStyle = HSLayers.Control.Editing.setStyle;
            }  
        }

        this.buttons = tmpButtons;

        this.addControls(controls);
    },

    /**
     */
    draw: function() {
        var div = OpenLayers.Control.Panel.prototype.draw.apply(this,arguments);

        // set tooltips
        for (var i = 0, i_len = this.controls.length; i < i_len; i++) {
            switch(this.controls[i].CLASS_NAME) {
                case "OpenLayers.Control.ModifyFeature":
                    switch (this.controls[i].mode) {
                        case 1:
                            new Ext.ToolTip({target: this.controls[i].panel_div, html: OpenLayers.i18n('Select and modify feature')});
                            break;
                        case 8:
                            new Ext.ToolTip({target: this.controls[i].panel_div, html: OpenLayers.i18n('Select and move feature')});
                            break;
                    };
                    break;
                case "HSLayers.Control.DrawPoint":
                    new Ext.ToolTip({target: this.controls[i].panel_div, html: OpenLayers.i18n("Draw point")});
                    break;
                case "HSLayers.Control.DrawLine":
                    new Ext.ToolTip({target: this.controls[i].panel_div, html: OpenLayers.i18n('Draw line')});
                    break;
                case "HSLayers.Control.DrawPolygon":
                    new Ext.ToolTip({target: this.controls[i].panel_div, html: OpenLayers.i18n('Draw polygon')});
                    break;
            }
        }
        Ext.QuickTips.init();
        return div;
    },

    /**
     * setup the coexistance with other OpenLayers.Control.Panel in the map
     * @name HSLayers.Control.Editing.setupPanels
     * @function
     */
     setupPanels: function() {
        // collect panels
        this.panels = this.map.getControlsBy("CLASS_NAME","OpenLayers.Control.Panel");

        // for each control within each panel, deactivate this panel
        // controls,when activated somethning else somewhere else
        for (var i = 0; i < this.panels.length; i++) {
            // for each control within
            for (var j = 0; j < this.panels[i].controls.length; j++) {
                var control = this.panels[i].controls[j];
                
                // ignore the navigation
                // if (control.CLASS_NAME != "OpenLayers.Control.Navigation") {


                    // deactivate this controls
                    var deactivate = function() {
                            for (var k = 0; k < this.controls.length; k++) {
                                this.controls[k].deactivate();
                            }
                    };
                    control.events.unregister("activate", this,this.deactivateEditingPanelControl);
                    //control.events.register("activate", this,this.deactivateEditingPanelControl);
                //}
            }
        }

     },
     
    /**
     * set this drawing control to vector layer used by handler
     * deactivate ALL buttons in all different panles, which might be in
     * the map
     */
    onEditButtonActivated: function(evt) {
        if (evt && evt.object.handler) {
            evt.object.handler.layer.control = evt.object;
            this.handler = evt.object.handler;
        }
        this.control = evt.object;
        //this.activateTool = this.control;

        // coexisting with other panels
        this.setupPanels();

        // deactivate
        for (var i = 0; i < this.panels.length; i++) {
            for (var j = 0; j < this.panels[i].controls.length; j++) {
                var control = this.panels[i].controls[j];
                //control.deactivate();
            }
        }
        this.events.triggerEvent("toolchanged",this);

    },

    deactivate: function() {
        OpenLayers.Control.Panel.prototype.deactivate.apply(this,arguments);
        this.handler = undefined;
        this.layer.events.unregister("featureadded",this,this._onFeatureAdd);
        this.activateTool = (this.control ? this.control._name : undefined);
    },

    deactivateEditingPanelControl: function(evt) {
        for (var i = 0; i < this.controls.length; i++) {

            // if navigation is active AND navigation would like to be
            // activated AND SHIFT was pressed, activate navigation and
            // leave editing
            // deactivate editing and everything else in all other cases
            if ((this.controls[i].displayClass.search("hsControlDrawFeature") < 0 ||
                evt.object.CLASS_NAME != "OpenLayers.Control.Navigation") ||
                this.navigationModifierPressed == false) {
                this.controls[i].deactivate();
            }
        }
    },

    /**
     */
    activate: function() {
        OpenLayers.Control.Panel.prototype.activate.apply(this, arguments);

        this.layer.events.register("featureadded",this,this._onFeatureAdd);

        // actiate last selected tool
        if (this.activateTool && this.buttons[this.activateTool]) {
            this.buttons[this.activateTool].activate();
            this.control = this.buttons[this.activateTool];
            this.control.activate();
        }

        if (!this.keyboardHandler) {
            this.keyboardHandler = new OpenLayers.Handler.Keyboard(this,
            {
                "keydown": this.keyPressed,
                "keyup":  this.keyReleased
            });
        }
        this.keyboardHandler.activate();

        if (this.snapActive) {
            this.snap.activate();
        }

        OpenLayers.Control.prototype.draw.apply(this);
    },

    /**
     */
    destroy: function() {

        for (var i = 0; i < this.panels.length; i++) {
            for (var j = 0; j < this.panels[i].controls.length; j++) {
                var control = this.panels[i].controls[j];
                control.events.unregister("activate", this,this.deactivateEditingPanelControl);
            }
        }

        for(var i = this.controls.length - 1 ; i >= 0; i--) {
            if(this.controls[i].events) {
                this.controls[i].events.un({
                    "activate": this.redraw,
                    "deactivate": this.redraw,
                    scope: this
                });
                this.controls[i].events.unregister("activate",this,this.onEditButtonActivated);
            }
            OpenLayers.Event.stopObservingElement(this.controls[i].panel_div);
            this.controls[i].panel_div = null;

            this.map.removeControl(this.controls[i]);
            this.controls[i].destroy();
            this.controls[i] = null;
        }

        this.controls = null;
        if (this.control) {
            this.control.destroy();
        }

        this.snap.destroy();
        //this.split.destroy();
        this.buttons = [];
        this.keyboardHandler.deactivate();
        this.keyboardHandler.destroy();
        this.keyboardHandler = null;
        if (this._destroyLayer) {
            this.layer.destroy();
        }

        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     */
    setMap: function() {
        OpenLayers.Control.Panel.prototype.setMap.apply(this, arguments);
	if (!this.layer.map) {
            this.map.addLayer(this.layer);
	}

        // configure snap agent
        this.snap = new OpenLayers.Control.Snapping({layer: this.layer, targets: [this.layer] });
        this.map.addControl(this.snap);

        // this hssnap agent
        if (this.snapCfg) {
            this.snapCfg.layer = this.layer;
            this.snapCfg.editLayer = this.baseLayer;
            this.hssnap = new HSLayers.Control.Snapping(this.snapCfg);
        }
        else {
            this.hssnap = undefined;
        }
        this.toggleSnap(true);

    },

    /**
     * Set snap tolernace to this.snap control
     * @name HSLayers.Control.Editing.setSnapTolerance
     * @param {Integer} tolerance [m]
     */
    setSnapTolerance: function(tolerance) {
        tolerance = tolerance/this.layer.map.getResolution();

        for (var i = 0; i < this.snap.targets.length; i++) {
            if (this.snap.targets[i].layer == this.layer) {
                this.snap.targets[i].edgeTolerance = 
                this.snap.targets[i].nodeTolerance =
                this.snap.targets[i].tolerance = 
                this.snap.targets[i].vertexTolerance = tolerance;
            }
        }
        this.hssnap && this.hssnap.updateParams({
            distance: tolerance
        });
    },

    /**
     * Toggle active state of snap control
     * @name HSLayers.Control.Editing.toggleSnap
     * @param {Boolean} activate
     */
    toggleSnap: function(activate) {
        this.snapActive = activate;
        activate ? this.snap.activate() : this.snap.deactivate();
        if (this.hssnap) {
            activate ? this.hssnap.activate() : this.hssnap.deactivate();
        }
    },


    /**
     * some key pressed
     * @name HSLayers.Control.Editing.keyPressed
     * @function
     * @param {Event} evt
     */
    keyPressed : function(evt) {
        switch(evt.keyCode) {
            // SHIFT
            case 16:
                this.navigationModifierPressed = true;
                this.toggleNavigate(true);
                break;
            // DELETE 46
            case OpenLayers.Event.KEY_DELETE: 
                this.deleteLastVertex();
                break; 
            // RETURN 13
            case OpenLayers.Event.KEY_RETURN: 
            // SPACE
            case 32: 
                this.finelizeFeature();
                break; 
        };
    },

    /**
     * some key released
     * @name HSLayers.Control.Editing.keyReleased
     * @function
     * @param {Event} evt
     */
    keyReleased : function(evt) {
        switch(evt.keyCode) {
            // SHIFT
            case 16:
                this.toggleNavigate(false);
                this.navigationModifierPressed = false;
                break;
            // ESC
            //case OpenLayers.Event.KEY_ESC:
            //    this.toggleDigitize(false);
            //    break;
        };
    },

    /**

     * Turn navigation control on or off
     * @name HSLayers.Control.Editing.toggleNavigate
     * @param {Boolean} activate
     * @function
     */
    toggleNavigate: function(activate) {
        var navigate_controls =  this.map.getControlsBy("CLASS_NAME","OpenLayers.Control.Navigation");

        for (var i = 0; i < navigate_controls.length; i++) {
            // ehm - run "activate" or "deactivate" function of Navigation
            // control
            navigate_controls[i][(activate ? "activate" : "deactivate")]();
        }
    },

    /**
     * Turn digitizing off 
     * @name HSLayers.Control.Editing.toggleDigitize
     * @function
     */
    toggleDigitize: function() {
        for (var i = 0; i < this.controls.length; i++) {
        }
    },

    /**
     * get the drawed geometry as string
     * @function
     * @name HSLayers.Control.EditingToolbar.getWKTGeometry
     * @param {String} type type of the geometry ("POINT", "LINE","POLYGON")
     * @param {Integer} count first feature will be drawed back
     * @returns {String} wkt geometry
     */
    getWKTGeometry:  function(gtype, count) {
        var s = "";

        if(this.layer.features.length == 0) {
            return "";
        }


        var wktFormat = new OpenLayers.Format.WKT();

        if(gtype){
            gtype = gtype.toUpperCase();
            if(gtype=='LINE') gtype += 'STRING';
            for (var i=0;i<this.layer.features.length;i++){
                if (this.layer.features[i].geometry.CLASS_NAME.toUpperCase()=='OPENLAYERS.GEOMETRY.'+gtype) {
                    if(s) {
                        s += ",";
                    }
                    s += wktFormat.write(this.layer.features[i]).substring(gtype.length);
                }  
            }
            if(s) {
                s = "MULTI"+gtype+"("+s+")";
            }
        }
        else if(count){
            var s = wktFormat.write(this.layer.features[0]);
        }
        else  {
            var s = wktFormat.write(this.layer.features);
        }

        return s;
    },

    /**
     * put the drawn geometry to layer
     * @function
     * @name HSLayers.Control.EditingToolbar.putWKTGeometry
     * @param {String} WKT geometry 
     * @params {Object} associative array of parameters
     * 	zoom: aoutomaticaly zooms to added features
     * 	explode: multigeometries are exploded to simple ones - i.e. multipolygon to array of polygons
     * 	zoomonly: only map zoom and not draw features		      
     *  layer: layer where the features are drawed to. if not set, default workLayer is used
     */
    putWKTGeometry : function(wkt,params){
        
        if(!wkt) {
            return false;
        }
        if(!params) params = {};

        var wktFormat = new OpenLayers.Format.WKT();
        var features = wktFormat.read(wkt);

        if(!features) {
            return false;
        }

        if(features.constructor != Array) {
            features = [features];
        }
        
        // performs projection to map coordinates
        if(params.crs){
            var pr1 = new OpenLayers.Projection(params.crs);
            var pr2 = (this.map.projection instanceof OpenLayers.Projection ? this.map.projection : new OpenLayers.Projection(this.map.projection));
            for(var i=0;i<features.length;i++){
                    features[i].geometry = features[i].geometry.transform(pr1, pr2);
            }
        }

        // extract features from MULTI Features
        if(params.explode){
            var exploded = new Array();
            for(var i=0;i<features.length;i++) {
              // multigeometry
                if(features[i].geometry.CLASS_NAME.toUpperCase().indexOf('MULTI')>-1){
                var components = features[i].geometry.components;
                for(var j=0;j<components.length;j++) { 
                    exploded.push(wktFormat.read(components[j]));
                }
              }
              //simple geometry
              else {
                exploded.push(features[i]);
            	}  
            }
            features = exploded;
        }

        var layer = (params.layer ? params.layer : this.layer);
        layer.addFeatures(features);

        // selects the graphics
        /*for (var i = 0; i < this.map.controls.length; i++) {
          if (this.map.controls[i].CLASS_NAME == "OpenLayers.Control.ModifyFeature") {
            // TODO 
            this.map.controls[i].selectFeature(features[0]);
          }
        }*/

        // get the bounding box
        var bounds;
        for(var i=0; i<features.length; ++i) {
            var b = features[i].geometry.getBounds();
            if (!bounds) {
                bounds = b;
            }
            else {
                bounds.extend(b);
            }
        }

        if(params.zoom) {
            this.map.zoomToExtent(bounds);
        }
        return true; 
    },
    
    deleteLastVertex : function(){
        if (this.control && this.control.handler && this.control.handler.line) {
            this.control.handler.line.geometry.components.splice(
                this.control.handler.line.geometry.components.length-2,1);
            this.control.handler.layer.redraw();
        }
    },

    /**
     * common submit function
     */
    onSubmit: function() {
        this.baseLayer.params.savequery = 3;
        this.baseLayer.redraw(true);
        this.baseLayer.params.savequery = undefined;
        this.layer.destroyFeatures();
        this.clearForm();
    },

    /**
     * on submit succeeded
     */
    onSubmitSuccess: function(){
        this.onSubmit();
        this.submitSuccess.apply(this.targetScope,arguments);
    },

    /**
     * on failed
     */
    onSubmitFailure: function(){
        this.onSubmit();
        this.submitFailure.apply(this.targetScope,arguments);
    },

    /**
     * finelize currently digitized feature
     */
    finelizeFeature: function(event){
        // HACK -- just call the dblclick method of the drawing handler,
        // everything else is setuped there
        if (this.handler) {
            this.handler.dblclick(event);
        }
        OpenLayers.Event.stop(event);
    },

    /**
     * activate particular tool
     * @param {Integer} idx control index to be activated
     */
    setControl: function(idx) {
        // deactivate all
        for (var i = 0; i < this.controls.length; i++) {
            this.controls[i].deactivate();
        }

        this.controls[idx].activate();
        this.control = this.controls[idx];
    },

    /**
    * opens editing form and draws its geometry to map
    * @function
    * @name HSLayers.Control.Editing.edit
    * @param {Object} options
    *   url - editing script url 
    *   project - mapserver project name
    *   layer - edit layer name
    *   geomType - geometry type (point, line, polygon) 
    *   recno - record number (-1 for new record)
    *   tileindex - optional for tiled data
    *   formName - name of editing form 
    *   success - function run on success submit
    *   failure - function run on submit error
    *      
    */
    loadForm: function(options){
        this.url = options.url;
        this.formElement = (typeof (options.applyTo) == "string" ? document.getElementById(options.applyTo) : options.applyTo);
        this.formName = options.formName;
        this.submitSuccess = options.success;
        this.submitFailure = options.failure;
        this.geomType = options.geomType;
        this.baseLayer = options.baseLayer;
        this.targetScope = options.scope ? options.scope : this;

        OpenLayers.Request.GET({ 
            params: {
                request:'get',
                project: options.project,
                lyrname: options.layer,
                recno: options.recno,
                tileindex: options.tileindex
            },
            url: this.url,
            scope: this,
            success: this.onFormLoaded,
            failure: function(){alert('edit form load error');}
        });  
    },

    /**
     * Clears existing form element
     * @function
     */
    clearForm: function (){
        if (!this.formElement) {
            return;
        }
        if (this.formElement.ctype && this.formElement.ctype.search("Ext") > -1) {
            this.formElement.body.update();
            this.formElement.doLayout();
        }
        else {
            this.formElement.innerHTML = '';
        }
        this.extForm = null;
    },

    /**
     * Form loaded, clear previous form, append form to element
     * @function
     */
    onFormLoaded: function(r){
        this.clearForm();
        var isExt = false;
        if (this.formElement.ctype && this.formElement.ctype.search("Ext") > -1) {
            this.formElement.body.update(r.responseText);
            this.formElement.doLayout();
            isExt = true;

        }
        else {
            this.formElement.innerHTML = r.responseText;
        }
        //this.layer.destroyFeatures();
        //var htmlForm = (isExt ?  this.formElement.body.getElementsByTagName("form")[0] : this.formElement.getElementsByTagName("form")[0]);
        var htmlForm = document.getElementById(this.formId);
        if (!htmlForm) {
            return;
        }
        this.putWKTGeometry(htmlForm.geometry.value,{explode:true,zoom:false});
        
        // remember old geometry comming from server
        this.originalGeometry = this.getWKTGeometry(this.geomType);

        // extjs dependent part - creating Ext form
        this.extForm = new Ext.form.BasicForm(htmlForm, {
            url: this.url,
            fileUpload: (htmlForm.enctype=="multipart/form-data"), 
            scope: this
        });
        htmlForm.extForm = this.extForm;

        for(var i=0;i<htmlForm.elements.length;i++){
            var f = new Ext.form.Field({
                applyTo:htmlForm.elements[i]
            });
            this.extForm.add(f);
        }
    
        // submitting the form
        htmlForm.onsubmit = function(){
            var editor = this.extForm.scope;
            
            //tests user changes of geometry. if not changed blank geometry is posted 
            var editedGeometry = editor.getWKTGeometry(editor.geomType);
            var vals = this.extForm.getValues();
            if((vals.recno>-1) && (editedGeometry==editor.originalGeometry)){
                this.extForm.setValues({geometry: ''});
            }
            else{
                this.extForm.setValues({geometry: editor.getWKTGeometry(editor.geomType)});
            }

            //OpenLayers.Request.GET({
            //    url: this.extForm.url,
            //    params: this.extForm.getValues(),
            //    scope: this.extForm.scope,
            //    success: editor.onSubmitSuccess, 
            //    failure: editor.onSubmitFailure
            //});
            
            //submit form
            this.extForm.submit({
                scope: this.extForm.scope,
                success: editor.onSubmitSuccess, 
                failure: editor.onSubmitFailure
            });
            return false;
        }
    },

    /**
     * featureAdd handler
     * @function
     * @name HSLayers.Control.Editing.onFeatureAdd
     */
    _onFeatureAdd:function(e) {
    },

    /**
     * set layer
     * 
     * @function
     * @name HSLayers.Control.Editing.setLayer
     * @param layer {OpenLayers.Layer.Vector} `vector layer <http://dev.openlayers.org/apidocs/files/OpenLayers/Layer/Vector-js.html>`_
     */
    setLayer: function(layer) {
        this.layer = layer;
    },

    CLASS_NAME: "HSLayers.Control.Editing"
});    

HSLayers.Control.Editing.styles = new OpenLayers.StyleMap({
                "default": new OpenLayers.Style(null, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    pointRadius: 5,
                                    graphicName: "circle",
                                    fillColor: "white",
                                    fillOpacity: 0.25,
                                    strokeWidth: 1,
                                    strokeOpacity: 1,
                                    strokeColor: "#3333aa"
                                },
                                "Line": {
                                    strokeWidth: 3,
                                    strokeOpacity: 1,
                                    strokeColor: "#6666aa"
                                },
                                "Polygon": {
                                    strokeWidth: 1,
                                    strokeOpacity: 1,
                                    fillColor: "#9999aa",
                                    strokeColor: "#6666aa"
                                }
                            }
                        })
                    ]
                }),
                "select": new OpenLayers.Style(null, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    pointRadius: 5,
                                    graphicName: "circle",
                                    fillColor: "white",
                                    fillOpacity: 0.25,
                                    strokeWidth: 2,
                                    strokeOpacity: 1,
                                    strokeColor: "#0000ff"
                                },
                                "Line": {
                                    strokeWidth: 3,
                                    strokeOpacity: 1,
                                    strokeColor: "#0000ff"
                                },
                                "Polygon": {
                                    strokeWidth: 2,
                                    strokeOpacity: 1,
                                    fillColor: "#0000ff",
                                    strokeColor: "#0000ff"
                                }
                            }
                        })
                    ]
                }),
                "temporary": new OpenLayers.Style(null, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    graphicName: "circle",
                                    pointRadius: 5,
                                    fillColor: "white",
                                    fillOpacity: 0.25,
                                    strokeWidth: 2,
                                    strokeColor: "#0000ff"
                                },
                                "Line": {
                                    strokeWidth: 3,
                                    strokeOpacity: 1,
                                    strokeColor: "#0000ff"
                                },
                                "Polygon": {
                                    strokeWidth: 2,
                                    strokeOpacity: 1,
                                    strokeColor: "#0000ff",
                                    fillColor: "#0000ff"
                                }
                            }
                        })
                    ]
                })
});


/**
 * Called on click on the 'edit' button in the attribute table, which comes
 * from MapServer, when clicked on the feature using HSLayers.Control.Query
 * @function
 * @name HSLayers.Control.Editing.edit
 * @param {String} project name of the MapServer project
 * @param {String} layer layer name
 * @param {Integer} id record number
 * @param {Integer} tileIndex tile index for the shapefile, default -1
 */
HSLayers.Control.Editing.edit = function(project,layer,id) {

    // empty, do what you need here
};

/**
 * Called on click on the 'delete' button in the attribute table, which comes
 * from MapServer, when clicked on the feature using HSLayers.Control.Query
 * @function
 * @name HSLayers.Control.Editing.edit
 * @param {String} project name of the MapServer project
 * @param {String} layer layer name
 * @param {Integer} id record number
 * @param {Integer} tileIndex tile index for the shapefile, default -1
 */
HSLayers.Control.Editing.deleteFeature = function(project,layer,id) {

    // empty, do what you need here
};

/**
 * set radius for the point. this method is added to each control of this
 * editing capabilities
 * @param {Object} new properties
 * @example {pointRadius: 20, strokeColor: 'red'}
 */
HSLayers.Control.Editing.setStyle = function(properties,control){
        control = control || this;
        if (control.handler && control.handler.layer) {
            var layer = control.handler.layer;
            if (layer.style) {
                for (var i in properties) {
                    layer.style[i]  = properties[i];
                }
            }
        }

        if (layer.style.pointRadius < 5) {
            layer.style.pointRadius = 5;
        }
    };
