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

HSLayers.namespace("HSLayers.FileDialog");

/**
 * HSLayers File dialog is used for opening the file from local disc as well as  from remote servers. The file dialog should be similar to standard desktop file pickers.
 * @class
 * @augments Ext.Window
 * @name HSLayers.FileDialog
 *
 * @constructor
 * @param {Object} config
 * @param {String} config.url  Url, which points to JSON file with available files
 * @param {Boolean} config.multiSelect  indicates, if more then one file can be selected
 * @param {String} config.action "save" | "open"
 * @param {String} config.title panel's title
 *
 * @example 
 * // initialize the file dialog
 *      var fd =  new HSLayers.FileDialog({
 *                              type:"open",
 *                              title:"Choose Image",
 *                              url:HSLayers.WMCManager.getImagesURL
 *                          });
 *      fd.show();
 *
 *      // example respones from url:
 *      {records: [
 *           {
 *               id: "id",
 *               title:"file title",
 *               abstract: "file absract",
 *               link: "http://path/to/file,
 *               imgURL: "http://path/to/icon/url"
 *           },
 *           {
 *                   ....
 *           }, ...
 *      ]}
 *
 */
HSLayers.FileDialog = Ext.extend(Ext.Window, {

    /**
     * Button for saving
     * @type {Ext.Button}
     * @private
     * @name HSLayers.FileDialog.saveButton
     */
    saveButton: null,

    /**
     * Button for opening file
     * @private
     * @type {Ext.Button}
     */
    openButton: null,

    /**
     * Cancel button
     * @private
     * @type {Ext.Button}
     */
    cancelButton: null,

    /**
     * Data store, in which the files are loaded in
     * @type {Ext.data.JsonStore}
     */
    store: null,

    /**
     * Form where input fields are stored
     * @type {Ext.form.FormPanel}
     * @private
     */
    fieldsPanel: null,

    /**
     * One of two file dialog types: 'load' or 'save'
     * @type {String}
     * @default save
     */
    type: null,

    /**
     * Called no Save button is clicked
     * @name HSLayers.FileDialog.open
     * @event
     * @param {Ext.data.Record} record
     * @param {String} origin origin of the file - server or local
     * @example
     * fd.on("open",function(){},this);
     */

    /**
     * Called no Open button is clicked
     * @name HSLayers.FileDialog.save
     * @event
     * @param {Ext.data.Record} record
     * @param {String} origin origin of the file - server or local
     * @example
     * fd.on("save",function(){},this);
     */

    /**
     * @private
     */
    initComponent: function() {
        
        var config = {};
        config.width = 600;
        config.height = 320;
        config.layout = "border";
        config.type = this.initialConfig.type || "save";
        config.resizable = false;

        var url =  this.initialConfig.url;
        if(url && OpenLayers.ProxyHost && (url.indexOf("http") === 0)) {
            url = OpenLayers.ProxyHost + encodeURIComponent(url);
        }

        var panel;
        if (url){
            if (!this.initialConfig.store) {
                this.store = new Ext.data.JsonStore({
                        url: url,
                        autoLoad: true,
                        root: "records",
                        id: 'name',
                        fields: [ "id", "title", "abstract", "link", "imgURL", "bbox"]
                    });
            }

            this.fileView = new Ext.DataView ({
                multiSelect: this.initialConfig.multiSelect || false,
                region:"center",
                singleSelect: true,
                simpleSelect: true,
                itemSelector: 'div.thumb-wrap',
                overClass:'x-view-over',
                autoScroll: true,

                store: this.store,
                tpl: new Ext.XTemplate(
                    '<tpl for=".">',
                    '<div class="thumb-wrap" style="width:150px; height:30px; float:left;">',
                    '<div class="thumb" style="float:left; padding-right: 5px;"><img width="25" height="25" src="{imgURL}" class="thumb-img"></div>',
                    '<span style="clear:right;">{title}</span></div>',
                    '</tpl>'
                ),

                listeners: {click: this.onThumbClick,
                            scope:this}
            });
            panel = new Ext.Panel({
                    layout: "fit",region:"center",frame:false,items:[this.fileView]
                });
        }
        else {
            config.height = 100;
        }


        this.actionButton = new Ext.Button({
                text: this.initialConfig.type == "save" ? OpenLayers.i18n("Save") : OpenLayers.i18n("Open"),
                scope:this,
                handler: this.initialConfig.type == "save" ? this.onSaveButtonClick : this.onOpenButtonClick
            });

        this.cancelButton = new Ext.Button({
                text: OpenLayers.i18n("Cancel"),
                scope:this,
                handler: function() { this.fileField.setValue(''); this.record = null; this.hide();}
            });

        this.fileField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("File"),
                width: 300
            });


        this.localFileField = new Ext.form.Field({
                inputType:"file",
                fieldLabel: OpenLayers.i18n("Local file"),
                width: 300
                });

        this.fieldsPanel = new Ext.form.FormPanel({
                url: OpenLayers.Util.urlAppend(HSLayers.statusManagerUrl,
                                            OpenLayers.Util.getParameterString({_salt:Math.random()})),
                defaultType: 'textfield',
                enctype: 'multipart/form-data',
                fileUpload: true,
                region:"center",
                labelWidth: 60,
                items: this.initialConfig.url ? [this.fileField] : [this.localFileField]
            });

        var buttonsPanel = new Ext.Panel({
                region: "east",
                width: 200,
                buttons: [this.actionButton, this.cancelButton]
            });

        var formPanel = new Ext.Panel({
                region: url ? "south" : "center",
                layout: "border",
                frame:true,
                height: 75,
                items: [this.fieldsPanel,buttonsPanel]
            });


        config.items = this.initialConfig.url ? [panel,formPanel] : [formPanel];

        config.title = this.initialConfig.title || (this.initialConfig.type == "save" ? OpenLayers.i18n("Save") : OpenLayers.i18n("Open"));
        config.closeAction = "hide";

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 

        HSLayers.FileDialog.superclass.initComponent.apply(this, arguments);

        this.addEvents("open");
        this.addEvents("save");
    },

    /**
     * Click on the icon handler 
     * @private
     * @function
     * @param {Ext.DataView} view
     * @param {Integer} idx
     * @param {Ext.data.Node} node
     * @param {Event} evt
     */
    onThumbClick: function(view,idx,node,evt) {
        this.record = view.getStore().getAt(idx);
        this.fileField.setValue(this.record.data.link);
    },

    /**
     * Save button handler
     * @private
     * @function
     */
    onSaveButtonClick: function(){
        this.fireEvent("save",{url:this.fileField.getValue(),exists: !(!this.record)});
        this.fileField.setValue('');
        this.record = null;
        this.hide();
    },

    /**
     * Open button handler
     * @private
     * @function
     */
    onOpenButtonClick: function(){
        if (this.record){
            this.fireEvent("open",{record: this.record, origin: "server"});
            this.fileField.setValue('');
            this.record = null;
        }
        else if (this.localFileField.getValue()) {

            this.fieldsPanel.getForm().submit({
                        waitMsg: OpenLayers.i18n('Loading file')+"  ...",
                        scope: this,
                        params: {method:"JSON",request: "feedback"},
                        success: function(f,o) {
                            if (o.result) {
                                this.record = new Ext.data.Record({
                                        data: {link: o.result.url}
                                    });
                                this.fireEvent("open",{record:this.record,origin:"local"});
                                this.record = null;
                            }
                            this.hide();
                        }
                });

        }
        this.hide();
    },

    /**
     * @private
     */
    CLASS_NAME: "HSLayers.FileDialog"
});
