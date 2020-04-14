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
 * Dialog for generate code for embedding map into the HTML page
 *
 * @class HSLayers.Embed.GeneratorDialog
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Window">Ext.Window</a>
 *
 * @constructor
 * @param {Object} config
 *    possible values (key / value pair):
 *      generateParams - parameters for generated code
 *      scriptPath - path to embed script
 *      map - {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>}
 * @example 
 *      var dialog = new HSLayers.Embed.GeneratorDialog({
 *          generateParams: {},
 *          map: map,
 *          saveUrl: "server/path"
 *      });
 *      dialog.show();
 */
HSLayers.Embed.GeneratorDialog = function(config) { 
    HSLayers.Embed.GeneratorDialog.superclass.constructor.call(this, config); 
};
  
Ext.extend(HSLayers.Embed.GeneratorDialog, Ext.Window, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Embed.GeneratorDialog._formPanel
     * @type {Ext.form.FormPanel}
     */
    _form: null,
    
    /**
     * @name HSLayers.Embed.GeneratorDialog.generateParams
     * @type {String}
     */
    generateParams: "",

    /**
     * @name HSLayers.Embed.GeneratorDialog.map
     * @type {Ext.form.FormPanel}
     */
    map: null,
    
    /**
     * @name HSLayers.Embed.GeneratorDialog.saveUrl
     * @type {String}
     */
    saveUrl: "",

    /**
     * @private
     * @function
     * @name HSLayers.Embed.GeneratorDialog._afterSave
     * @param {<OpenLayers.Request.XMLHttpRequest>} xmlhttp
     */     
    _afterSave: function(xmlhttp) {
        var json = new OpenLayers.Format.JSON();
        var response = json.read(xmlhttp.responseText); 
        this._form.setMapCompositionPermalink(response.permalink);
    },    

    /**
     * @private
     * @function
     * @name HSLayers.Embed.GeneratorDialog._getConfig
     * @returns {Object}
     */     
    _getConfig: function() {
        var config = {
            bodyStyle: "padding:5px;",
            buttonAlign: "center",
            height: 400,
            items: [this._form],
            layout: "fit",
            minWidth: 306,
            saveUrl: this.initialConfig.saveUrl || HSLayers.statusManagerUrl,
            minHeight: 266,
            modal: true,
            plain: true,
            resizable: true,
            title: OpenLayers.i18n("Embed Generator"),
            width: 400
        };
        return config;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Embed.GeneratorDialog._initChildComponents
     */     
    _initChildComponents: function() {        
        this._form = new HSLayers.Embed.GeneratorForm({
            generateParams: this.generateParams
        });
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Embed.GeneratorDialog._storeMapOnServer
     */     
    _storeMapOnServer: function() {
        var format = new HSLayers.Format.State();
        var json = format.map2json(this.map, true);         
        var text = format.map2string(this.map, true, true); 
        
        var saveStructure = {};
        saveStructure.data = json;
        saveStructure.permalink = "true";
        saveStructure.request="save";
        saveStructure.project=window.location.pathname;
        
        var str = (new OpenLayers.Format.JSON()).write(saveStructure, true);        
        
        var reqUrl = this.saveUrl+"?"+OpenLayers.Util.getParameterString({"request":"save","permalink":"true"});

        var proxy = OpenLayers.ProxyHost;
        OpenLayers.ProxyHost = null;
        var request =  OpenLayers.Request.POST({
            url: reqUrl, 
            data: str,
            async: false,
            success: this._afterSave,
            failure: function(){},
            scope: this
        });
        OpenLayers.ProxyHost = proxy;        
    },
    
    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Embed.GeneratorDialog.getForm
     * @returns {HSLayers.Embed.GeneratorForm}
     */     
    getForm: function() {
        return this._form;
    },
    
    /**
     * @function
     * @name HSLayers.Embed.GeneratorDialog.initComponent
     */     
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();       

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.Embed.GeneratorDialog.superclass.initComponent.apply(this, arguments);

    },
    
    /**
     * @function
     * @name HSLayers.Embed.GeneratorDialog.setMap
     * @param {OpenLayers.Map} map
     */     
    setMap: function(map) {
        this.map = map;    
        this._form.setMap(map);
    },
    
    /**
     * @function
     * @name HSLayers.Embed.GeneratorDialog.showDialog
     */     
    showDialog: function() {
        this.show();
        this._storeMapOnServer();
    },

    /**
     * @name HSLayers.Embed.GeneratorDialog.CLASS_NAME
     * @type String
     */ 
    CLASS_NAME: "HSLayers.Embed.GeneratorDialog"
});
