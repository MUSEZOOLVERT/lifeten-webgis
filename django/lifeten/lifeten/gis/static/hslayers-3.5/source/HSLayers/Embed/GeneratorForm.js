/* Copyright (c) 2007-2011 Help Service - Remote Sensing s.r.o.
 * Author(s): Martin Vlk
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

HSLayers.namespace("HSLayers.Embed");
 
/**
 * Form panel for generate code for embedding map into the HTML page
 *
 * @class HSLayers.Embed.GeneratorForm
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel">Ext.form.FormPanel</a>
 *
 * @constructor
 * @param {Object} config
 *    possible values (key / value pair):
 *      generateParams - parameters for generated code
 * @example 
 *      var form = new HSLayers.Embed.GeneratorForm({
 *          generateParams: {}
 *      });
 */
 
HSLayers.Embed.GeneratorForm = function(config) { 
    HSLayers.Embed.GeneratorForm.superclass.constructor.call(this, config); 
}
  
Ext.extend(HSLayers.Embed.GeneratorForm, Ext.form.FormPanel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Embed.GeneratorForm._generator
     * @type {HSLayers.Embed.Generator}
     */
    _generator: null,
    
    /**
     * @name HSLayers.Embed.GeneratorForm.generateParams
     * @type {String}
     */
    generateParams: "",
    
    /**
     * @private
     * @name HSLayers.Embed.GeneratorForm._items
     * @type {Array}
     */
    _items: null,
    
    /**
     * @private
     * @name HSLayers.Embed.GeneratorForm._mapCompositionPermalink
     * @type {String}
     */
    _mapCompositionPermalink: "",

    /**
     * @name HSLayers.Embed.GeneratorForm.map
     * @type {OpenLayers.Map}
     */
    map: null,
    
    /**
     * @private
     * @function
     * @name HSLayers.Embed.GeneratorForm._generate
     */     
    _generate: function() {
        var code = this._generator.generateCode({
            hslayersPath: this.generateParams.hslayersPath,
            scriptPath: this.generateParams.scriptPath,
            mapId: "map",
            height: this.getMapWindowHeight(),
            width: this.getMapWindowWidth(),
            mapType: this.getMapWindowType(),
            permalink: this._mapCompositionPermalink
        });        
        this.setCode(code);
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Embed.GeneratorForm._getConfig
     * @returns {Object}
     */     
    _getConfig: function() {
        var config = {
            baseCls: "x-plain",
            hideLabels: false,
            items: this._items
        };
        return config;
    },
        
    
    /**
     * @private
     * @function
     * @name HSLayers.Embed.GeneratorForm._initChildComponents
     */     
    _initChildComponents: function() {
        this._changeTypeHandler = OpenLayers.Function.bind(
            this._changeType, this
        );    
            
        this.labelWidth = 150;
        
        this._items = [{
            xtype: "combo",
            anchor: "100%",
            fieldLabel: OpenLayers.i18n("Type of map window"),
            forceSelection: true,
            lazyInit: false,
            mode: "local",
            typeAhead: true,
            triggerAction: "all",
            store:  new Ext.data.SimpleStore({
                fields: ["value", "name"],
                data: [
                    ["html", "Pure HTML"],
                    ["simple", "Simple ExtJS based"],
                    ["advanced", "Advanced ExtJS based"]
                ]
            }),
            valueField: "value",
            displayField: "name",
            value: "simple",
            listeners: {
                select: this._generate,
                change: this._generate,
                scope: this
            }
        }, {
            xtype: "textfield",
            fieldLabel: OpenLayers.i18n("Width"),
            enableKeyEvents: true,
            value: this.initialConfig.generateParams.width || 300,
            listeners: {
                keyup: this._generate, 
                scope: this,
                specialkey: this._generate
            }
        }, {
            xtype: "textfield",
            fieldLabel: OpenLayers.i18n("Height"),
            enableKeyEvents: true,
            value: this.initialConfig.generateParams.height || 300,
            listeners: {
                keyup: this._generate, 
                scope: this,
                specialkey: this._generate
            }
        }, {
            xtype: "textarea",
            allowBlank: false,
            anchor: "100%, -90",
            fieldLabel: OpenLayers.i18n("Generated code"),
            hideLabel: true,
            invalidClass: "",
            name: "code",
            value: ""
        }];
    },
        
    // **********************************************************************
    // public members
    // **********************************************************************
    
    /**
     * @function
     * @name HSLayers.Embed.GeneratorForm.initComponent
     */     
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();
         
        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.Embed.GeneratorForm.superclass.initComponent.apply(this, arguments);
        
        this._generator = new HSLayers.Embed.Generator();
        this._generate();
    },

    /**
     * @function
     * @name HSLayers.Embed.GeneratorForm.getMapWindowHeight
     * @returns {Integer}
     */
    getMapWindowHeight: function() {
        return Math.round(this.items.get(2).getValue());
    },

    /**
     * @function
     * @name HSLayers.Embed.GeneratorForm.getMapWindowType
     * @returns {String}
     */
    getMapWindowType: function() {
        return this.items.get(0).getValue();
    },

    /**
     * @function
     * @name HSLayers.Embed.GeneratorForm.getMapWindowWidth
     * @returns {Integer}
     */
    getMapWindowWidth: function() {
        return Math.round(this.items.get(1).getValue());
    },
    
    /**
     * @function
     * @name HSLayers.Embed.GeneratorForm.setCode
     * @param {String} code
     */
    setCode: function(code) {
        this.items.get(3).setValue(code);
    },

    /**
     * @function
     * @name HSLayers.Embed.GeneratorForm.setMap
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
    },
    
    /**
     * @function
     * @name HSLayers.Embed.GeneratorForm.setMapCompositionPermalink
     * @param {String} path
     */
    setMapCompositionPermalink: function(path) {
        this._mapCompositionPermalink = path;
        this._generate();
    },

    /**
     * @name HSLayers.Embed.GeneratorForm.CLASS_NAME
     * @type String
     */ 
    CLASS_NAME: "HSLayers.Embed.GeneratorForm"
});
