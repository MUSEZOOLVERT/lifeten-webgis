/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
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
  
HSLayers.namespace("HSLayers.Print");
  
/**
 * Dialog for input print parameters
 *
 * @class HSLayers.Print.PrintDialog
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Window">Ext.Window</a>
 *
 * @constructor
 * @param {Object} config
 *    possible values (key / value pair):
 *      map - {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>}
 *      printTemplates - {Array of Array} - templates info
 * @example 
 *      HSLayers.Print.printerUrl = "/hsprinter/print";
 *      var dialog = new HSLayers.Print.PrintDialog({
 *          map: map,
 *          printTemplates: [
 *              ["basic.html", "pdf", "A4 portrait",[800,600]]
 *          ]
 *      });
 *      dialog.show();
 */
HSLayers.Print.PrintDialog = function(config) { 
    HSLayers.Print.PrintDialog.superclass.constructor.call(this, config); 
};
  
Ext.extend(HSLayers.Print.PrintDialog, Ext.Panel, {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Print.PrintDialog._buttonCancel
     * @type {Ext.Button}
     */
    _buttonCancel: null,

    /**
     * @private
     * @name HSLayers.Print.PrintDialog._buttonPrint
     * @type {Ext.Button}
     */
    _buttonPrint: null,

    /**
     * @private
     * @name HSLayers.Print.PrintDialog._formPanel
     * @type {Ext.form.FormPanel}
     */
    _form: null,

    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintDialog._getConfig
     */     
    _getConfig: function() {
        var config = {
            bodyStyle: "padding:5px;",
            buttonAlign: "center",
            buttons: [
                this._buttonPrint,
                this._buttonCancel
            ],
            height: 350,
            items: [this._form],
            layout: "fit",
            minWidth: 306,
            minimizable: true,
            collapsible: true,
            minHeight: 266,
            //modal: true,
            plain: true,
            resizable: true,
            title: OpenLayers.i18n("Print"),
            width: 375,
            //tools: [{id:"help",
            //        handler: this._onHelp
            //}],
            listeners: {"hide":this._onHide,"scope":this,
                        "minimize":this._onMinimize,
                        "close":this._onHide,
                        "deactivate":this._onHide,
                        "activate": function(){
                            this._form._getPaperLayer();
                            this._form._changeType();
                        }
            }
        };
        return config;
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintDialog._initChildComponents
     */     
    _initChildComponents: function() {
        
        this._buttonCancel = new Ext.Button({
            text: OpenLayers.i18n("Cancel"),
            handler: this.onCancelClick.createDelegate(this)
        });
        this._buttonPrint = new Ext.Button({
            text: OpenLayers.i18n("Print"),
            handler: this.onPrintClick.createDelegate(this)
        });
        this._form = new HSLayers.Print.PrintForm({
            printTemplates: this.printTemplates,
            buttonPrint: this._buttonPrint
        });
              
    },

    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintDialog._onHide
     */     
    _onHide: function() {
        this._form.removePaper();
    },

    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintDialog._onMinimize
     */     
    _onMinimize: function() {
        this.setHeight(0);
    },
    
    /**
     * @private
     * @function
     * @name HSLayers.Print.PrintDialog._print
     */     
    _print: function(printOptions) {
        if (this._form._paperLayer) {
            this._form._paperLayer.setVisibility(false);
        }
        var printContext = new HSLayers.Format.PrinterContext();
        printContext.setBounds(this._form.getPaperBounds());
        printContext.setScale(this._form.getScale());
        var data = printContext.toContext(this.map);
        data.output = printOptions.output;
        data.template = printOptions.template;
        data.download = printOptions.download;
        data.size = printOptions.size;
        data.resolution = this.printResolution || 96; //OpenLayers.DOTS_PER_INCH;
        data.text = this._form.getText();

        if (printOptions.template) {
            // delete data.scale;
        }

        // call custom function
        data = this.updatePrintContext(data);

        var json = new OpenLayers.Format.JSON();
        
        var form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", OpenLayers.Util.urlAppend(HSLayers.Print.printerUrl,"_salt="+String(Math.random())));
        form.setAttribute("target", "_blank");
        form.style.display="none";
        var input = document.createElement("input");
        input.setAttribute("name", "printContext");
        input.value = json.write(data);
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);        

        if (this._form._paperLayer) {
            this._form._paperLayer.setVisibility(true);
        }
    },
    
    // **********************************************************************
    // public members
    // **********************************************************************
    //
    /**
     * This is empty function, you can fix printer context in your
     * application, before it is send to the server
     *
     * @function
     * @name HSLayers.Print.PrintDialog.updatePrintContext
     * @param {Object} data printer conext
     * @return {Object} modified printer context
     */
    updatePrintContext: function(data) {
        return data;
    },

    /**
     * @function
     * @name HSLayers.Print.PrintDialog.getForm
     */     
    getForm: function() {
        return this._form;
    },
    
    /**
     * @function
     * @name HSLayers.Print.PrintDialog.initComponent
     */     
    initComponent:function() {
        this._initChildComponents();
        var config = this._getConfig();       
 
        Ext.apply(this, Ext.apply(config, this.initialConfig)); 
        HSLayers.Print.PrintDialog.superclass.initComponent.apply(this, arguments);

        this.on("deactivate", function() {
            // nothing implemented yet
        });

    },
    
    /**
     * @function
     * @name HSLayers.Print.PrintDialog.onCancelClick
     */     
    onCancelClick: function() {
        this._onCancel();
    },

    /**
     * @function
     * @name HSLayers.Print.PrintDialog.onPrintClick
     */     
    onPrintClick: function() {
        this._print(this.getForm().getPrintOptions());
        //this.getForm().destroy();
        //this.close();
    },

    /**
     * @function
     * @name HSLayers.Print.PrintDialog.setMap
     */     
    setMap: function(map) {
        this.map = map;    
        this._form.setMap(map);
    },

    CLASS_NAME: "HSLayers.Print.PrintDialog"

});
HSLayers.Print.printerUrl = "/hsprinter/print";
