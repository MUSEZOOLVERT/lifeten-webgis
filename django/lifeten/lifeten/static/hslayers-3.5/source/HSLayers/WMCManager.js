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
Ext.namespace("HSLayers.WMCManager");

/**
 * Manager of WMC file
 * @class HSLayers.WMCManager
 * @augments Ext.form.FormPanel
 * @constructor
 * @param {Object} config
 * @param {String} config.srvKeywordsPath path to keywords on the server 
 * @example 
 *  var wmcmanager = new HSLayers.WMCManager({
            height:400,
            width: 450,
            autoScroll: true,
            frame:true
 *      });
 */
HSLayers.WMCManager= function(config) {

    config = config || {};

    config.resizable = false;
    var profile = config.profile || {
        baselayers: true,
        keywords: ["iso","inspire","keywords"],
        contact: true,
        logo: true,
        "public": true
         
    };
    config.items = config.items || [];

    /*
     *  in this initial function, we do initialize the Context form fields
     */
    this.uuidField = new Ext.form.TextField({
        width: this.fieldWidth,
        fieldLabel: "ID",
        disabled: true,
        style: "font-weight: bold"
        });

    this.titleField = new Ext.form.TextField({
        width: this.fieldWidth,
        ctCls: "mandatory-field",
        allowBlank: false,
        msgTarget: "side",
        fieldLabel: OpenLayers.i18n("Title")
        });

    config.items.push(this.titleField);

    this.abstractField = new Ext.form.TextArea({
        fieldLabel: OpenLayers.i18n("Abstract"),
        width: this.fieldWidth,
        ctCls: "mandatory-field",
        msgTarget: "side",
        allowBlank: false,
        height: 80
        });
    config.items.push(this.abstractField);

    // logo for this WMC
    this.logoPanel = new Ext.Panel({
            fieldLabel: OpenLayers.i18n("Logo"),
            width: 100,
            height: 100,
            style: {textAlign:"center",verticalAlign:"middle", border: "1px gray solid",background: "white" ,color: "gray",cursor:"pointer"},
            listeners: {render: function(c) {c.body.scope = this; c.body.on('click', function() {this.scope.scope.selectLogo();});}},
            html :OpenLayers.i18n("Click to set"),
            scope: this
        });

    if (profile.logo) {
        config.items.push(this.logoPanel);
    }

    this.publicField = new Ext.form.Checkbox({
            fieldLabel: OpenLayers.i18n("Public"),
            labelStyle: "width:135px;"
            });

    this.baseLayersField = new Ext.form.Checkbox({
            fieldLabel: OpenLayers.i18n("Include base layers"),
            checked: false,
            labelStyle: 'width:135px;'
            });

    var checkboxes = [];
    if (profile["public"]) {
        checkboxes.push(this.publicField);
        if (profile["public"].checked) {
            this.publicField.setValue(true);
        }
    }
    if (profile.baselayers) {
        checkboxes.push(this.baseLayersField);
    }

    config.items.push(
        {
            layout: "column",
            border: false,
            defaults: {
                columnWidth: 0.5,
                border: false,
                layout: "form"
            },
            items: [
                { items: checkboxes }
            ]
        });

    this.srvKeywordsPath = config.srvKeywordsPath;
    
    var keywordsItems = [];

    // in the keywordsSet, keywords fields are to be stored
    var keywordItems = [];


    // check for global variable -> we use GEMET thesaurus for keywords as
    // well
    if (window.InspireServiceReader) {
        this.services = new InspireServiceReader({
            lang: HS.getLang(2),
            outputLangs: [HS.getLang(2)], 
            handler: this.fillKeywords,
            scope: this,
            serviceUrl: this.srvKeywordsPath 
        }); 

        keywordsItems.push({id:'gemet', title: OpenLayers.i18n('GEMET'), items: [this.services], layout: 'fit'});
    }

    if (keywordsItems.length > 0) {
        this.keywordManager = new  Ext.TabPanel({
            activeTab: 0,
            items: keywordsItems
        }); 

        var thesaurusField = new Ext.form.TriggerField({
            fieldLabel: OpenLayers.i18n('Thesaurus'),
            width: this.fieldWidth - 20,
            keywordManager: this.keywordManager,
            name:'keywords'
        });

        thesaurusField.onTriggerClick = function(a,b,c){
            if(!this.thesaurusWindow){
                this.thesaurusWindow = new Ext.Window({
                    width:400,
                    height:500,
                    layout: 'fit',
                    closeAction:'hide',
                    items: this.keywordManager
                });	
            }
            this.thesaurusWindow.show();
        };	

        keywordItems.splice(0,0,thesaurusField);
    }

    // there is the URL for INSPIRE and ISO keywords defined ->
    // we are going to prepare set of INSPIRE and ISO keywords
    if (HSLayers.WMCManager.inspireThemesURL !== null) {

        // record -> store -> field
        var xmlRecordDef = Ext.data.Record.create([                                                                                                                          
            {name: 'name', mapping: '@name'},
            {name: 'label', mapping: '/'}
            ]);

        var themesReader = new Ext.data.XmlReader({
            record: "inspireKeywords/value"
            }, xmlRecordDef);

        var isoReader = new Ext.data.XmlReader({
            record: "topicCategory/value"
            }, xmlRecordDef);

        this.stores = {};
        this.stores.INSPIRE = new Ext.data.Store({                                                                                                                                    
            url: (OpenLayers.ProxyHost &&  HSLayers.WMCManager.inspireThemesURL.search("http://") === 0 ?
                    OpenLayers.ProxyHost + encodeURIComponent(HSLayers.WMCManager.inspireThemesURL):
                    HSLayers.WMCManager.inspireThemesURL),
            reader: themesReader,
            autoload: true
        });
        this.stores.INSPIRE.load();

        this.stores.ISO = new Ext.data.Store({                                                                                                                                    
            url: (OpenLayers.ProxyHost &&  HSLayers.WMCManager.inspireThemesURL.search("http://") === 0 ?
                  OpenLayers.ProxyHost + encodeURIComponent(HSLayers.WMCManager.inspireThemesURL): 
                  HSLayers.WMCManager.inspireThemesURL),
            reader: isoReader,
            autoload: true
        });
        this.stores.ISO.load();

        // prepare two empty fields with "+" button
        this.initialFields = {};
        this.initialFields.INSPIRE = this.getKeywordField("INSPIRE","INSPIRE",true);
        this.initialFields.ISO = this.getKeywordField("ISO","ISO19115/2003",true);

        this.initialFields.INSPIRE.on("plusclicked",this.onPlusClicked,this);
        this.initialFields.ISO.on("plusclicked",this.onPlusClicked,this);

        if (profile.keywords){
            if(profile.keywords.indexOf("inspire") > -1) {
                keywordItems.push(this.initialFields.INSPIRE);
            }
            if(profile.keywords.indexOf("iso") > -1) {
                keywordItems.push(this.initialFields.ISO);
            }
        }
    }


    this.keywordsField = new Ext.form.TextArea({
        width: this.fieldWidth-20,
        fieldLabel: OpenLayers.i18n('Keywords'),
        name:'keywords'
    });
    if (profile.keywords && profile.keywords.indexOf("keywords") > -1) {
        keywordItems.push(this.keywordsField);
    }

    this.keywordsSet = new Ext.form.FieldSet({
            title: OpenLayers.i18n("Keywords"),
            items: keywordItems
    });

    if (profile.keywords) {
        config.items.push(this.keywordsSet);
    }


    // informations about contact person 
    this.contactSet = new HSLayers.WMCManager.ConcactSet({
            defaults:{
                width: this.fieldWidth - 20
            },
            profile: profile.contact
    });

    if (profile.contact) {
        config.items.push(this.contactSet);
    }

    //config.items = [
    //    //this.uuidField,
    //    this.titleField,
    //    this.abstractField,
    //    this.logoPanel,
    //    {
    //        layout: "column",
    //        defaults: {
    //            columnWidth: 0.5,
    //            border: false,
    //            layout: "form"
    //        },
    //        items: [
    //            {
    //                //items: [this.publicField]
    //            },
    //            {
    //                items: [this.baseLayersField]
    //            }]
    //    },
    //    this.keywordsSet,
    //    this.contactSet
    //];

    config.buttons = [];
    this.button_set = new Ext.Button({text:OpenLayers.i18n("Set"),
                    scope:this,
                    handler:this.setWMC,
                    toolTip: OpenLayers.i18n("Just set filled values"),
                    width: 35,
                    ctCls:"x-btn-text"
            });
    //config.buttons.push(this.button_set);

    this.button_download = new Ext.Button({text:OpenLayers.i18n("Download"),
                    scope:this,
                    handler:this.saveWMCToDisc,
                    icon: OpenLayers.Util.getImagesLocation()+"/download.png",
                    ctCls:"x-btn-text x-btn-text-icon"
            });
    config.buttons.push(this.button_download);

    this.button_save = new Ext.Button({text:OpenLayers.i18n("Save"),
                    scope:this,
                    handler: function(){this.saveWMCToServer.apply(this,arguments);},
                    icon: OpenLayers.Util.getImagesLocation()+"/server.png",
                    ctCls:"x-btn-text x-btn-text-icon"
                });

    this.button_saveas = new Ext.Button({text:OpenLayers.i18n("Save as"),
                    scope:this,
                    handler: function() { this.saveWMCToServerAsNew.apply(this,arguments);},
                    icon: OpenLayers.Util.getImagesLocation()+"/server-new.png",
                    ctCls:"x-btn-text x-btn-text-icon"
                });

    // save to server only if hanlder url is given
    if (HSLayers.WMCManager.wmcHandlerURL) {
        config.buttons.push(this.button_save);
        config.buttons.push(this.button_saveas);
    }

    this.button_clear = new Ext.Button({text:OpenLayers.i18n("Clear form"),
                    scope:this,
                    handler: function() {
                        this.reset();
                        this.baseLayersField.setValue(false);
                    }
    });
    config.buttons.push(this.button_clear);

    HSLayers.MapPanel.superclass.constructor.call(this, config);
    
    this.addEvents("saved");
    this.addEvents("set");
    this.addEvents("open");

    if (config.map) {
        this.setMap(config.map);
    }

};

/**
 * @class HSLayers.WMCManager
 */
Ext.extend(HSLayers.WMCManager, Ext.form.FormPanel, {

    /**
     * Field for title - mandatory
     * @name HSLayers.WMCManager.titleField
     * @type Ext.form.TextField
     */
    titleField: null,
    /**
     * Field for abstract - mandatory
     * @name HSLayers.WMCManager.abstractField
     * @type Ext.form.TextArea
     */
    abstractField: null,

    /**
     * Field width
     * @name HSLayers.WMCManager.fieldWidth
     * @type Integer
     */
    fieldWidth: 300,

    /**
     * Form set with Contact fields
     * @name HSLayers.WMCManager.contactSet
     * @type HSLayers.WMCManager.ConcactSet
     */
    contactSet: null,

    /**
     * Tab panel, for varuous thesauri - used only when thesaurus URL is
     * set
     * @name HSLayers.WMCManager.keywordManager
     * @type Ext.tabs.TabPanel
     */
    keywordManager: null,

    /**
     * Reader for GEMET & co. keyword clients
     * @name HSLayers.WMCManager.thesaurusReader
     * @type Ext.data.Reader
     */
    thesaurusReader: null,

    /**
     * Services keywords (GEMET)
     * @name HSLayers.WMCManager.services
     * @type InspireServiceReader
     */
    services: null,

    /**
     * scope for modifyContext function
     * @name HSLayers.WMCManager.scope
     */
    scope: null,

    /**
     * URL to the GEMET thesaurus
     * @name HSLayers.WMCManager.srvKeywordsPath
     * @type String
     */
    srvKeywordsPath:null,

    /**
     * Window, in which the GEMET reader will be opened
     * @name HSLayers.WMCManager.thesaurusWindow
     * @type Ext.Window
     */
    thesaurusWindow: null,

    /**
     * Window for selection of the logsho
     * @name HSLayers.WMCManager.logoWindow
     * @type HSLayers.FileDialog
     */
    logoWindow: null,

    /**
     * This context of the map, use setContext() for writing
     * @name HSLayers.WMCManager.context
     * @type Object
     */
    context: null,

    /**
     * Initial context, which will always be used
     * @name HSLayers.WMCManager.initContext
     * @type Object
     */
    initContext: null,

    /**
     * Stored UUID for the context. It will be changed only, if the context
     * is stored to the server
     * @name HSLayers.WMCManager.uuid
     * @type String
     */
    uuid: null,

    /**
     * Object with initial INSPIRE and ISO pair of fields
     * @name HSLayers.WMCManager.initialFields
     * @type {Object} of {HSLayers.WMCManager.KeywordsField}
     */
    initialFields: null,

    /**
     * Attributes of loaded compositon from the catalogue service
     * @name HSLayers.WMCManager.cat_attributes
     * @type {Object}
     */
    cat_attributes: null,

    /**
     * Initial pair of data stores for initialFields
     * @name HSLayers.WMCManager.stores
     * @type {Object} with {Ext.data.Store}
     */
    stores: null,

    /**
     * mask
     * @private
     * @name HSLayers.WMCManager._mask
     * @type {Ext.Mask}
     */
    _mask: null,

    /**
     * Hidden form for submitting it, so the user recieves back the data
     * from the server as file
     * @name HSLayers.WMCManager.wmcForm
     * @type {DOMElement}
     */
    wmcForm: null,

    /**
     * Fill keywords with given text from GEMET thesaurus reader
     * @function
     * @name HSLayers.WMCManager.fillKeywords
     * @param {Object}
     * @returns null
     */
    fillKeywords : function(result){
        this.theForm.form.setValues({'keywords': result.terms[HS.getLang(2)]});
        this.thesaurusWindow.hide();
    },

    /**
     * Called, when clicked at the logo space, new logoWindow will popup
     * and user can select the context logo
     * @function
     * @name HSLayers.WMCManager.selectLogo
     */
    selectLogo: function() {
        if (this.logoWindow === null) {
            this.logoWindow= new HSLayers.FileDialog({type:"open",title:OpenLayers.i18n("Choose Image"),url:HSLayers.WMCManager.getImagesURL});
            this.logoWindow.on("open",this.onIconSelected,this);
        }
        this.logoWindow.show();
    },

    /**
     * When the icon is selected from the window, logoPanel is filled with
     * new image
     * @function
     * @name HSLayers.WMCManager.onIconSelected
     * @param {Ext.event} e
     */
    onIconSelected: function(e) {
        var record = e.record;
        this.logoPanel.update("<img src=\""+record.data.link+"\" width=\"100%\" height=\"100%\" />");
    },

    /**
     * Set this.map object
     * @function
     * @name HSLayers.WMCManager.setMap
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
    },

    /**
     * Create WMC XML from map 
     * @function
     * @name HSLayers.WMCManager.createWMC
     * @returns {String} WMC xml
     */
    createWMC: function() {
        if (this.map) {

            var wmcParser = new HSLayers.Format.WMC(); 
            var xmlParser = new OpenLayers.Format.XML(); 
            this.contextToMap();
            this.context = this.modifyContext.apply(this.scope || this, [this.context]);
            var s = wmcParser.write(this.context,{id:this.uuid});

            //HACK for IE
            var r = new RegExp('<ol:transparent xmlns:ol="http://openlayers.org/context">-1</ol:transparent>', 'g');
            s = s.replace(r,'<ol:transparent xmlns:ol="http://openlayers.org/context">true</ol:transparent>');
            return xmlParser.read(s);
        }
    },

    /**
     * Save WMC to server under new name
     * @function
     * @name HSLayers.WMCManager.saveWMCToServerAsNew
     */
    saveWMCToServerAsNew: function() {
        //this.setUUID(undefined);
        this.getUUID(true,true);
        this.saveWMCToServer();
    },

    /**
     * Save WMC to server - rewrite existing wmc on the server, if exists
     * @function
     * @name HSLayers.WMCManager.saveWMCToServer
     */
    saveWMCToServer: function() {

        // check, if the form is filled propperly
        if (!this.getForm().isValid()) {
            return;
        }

        // we have to crate JSON object:
        // {wmc: "<?xml ...>...", 
        //  request:"put",
        //  public: true/false,
        //  uuid: undefined/String
        //  }
        var xmlParser = new OpenLayers.Format.XML(); 
        var wmc = this.createWMC();
        wmc = xmlParser.write(wmc);
        var data = {wmc: wmc,request:"put","public": this.publicField.getValue()};
        if (this.uuid) {
            data.uuid = this.uuid;
        }
        var jsonParser =  new OpenLayers.Format.JSON(); 
        data = jsonParser.write(data);

        if (!this._mask) {
            this._mask = new Ext.LoadMask(this.body.dom, {msg:OpenLayers.i18n("Saving")+"..."});
        }
        this._mask.show();

        OpenLayers.Request.POST({
            url:HSLayers.WMCManager.wmcHandlerURL,
            success: function(r) {
                            var format = new OpenLayers.Format.JSON();
                            var response = format.read(r.responseText);
                            if (!response) {
                                this.onSaveToServerFailed({error:{message:OpenLayers.i18n("No server response")}});
                            }
                            else if (response["status"] === 0) {
                                this.onSaveToServerFailed(response);
                            }
                            else {
                                this.onSaveToServerSuccess(response);
                            }
                    }, 
            failure: this.onSaveToServerFailed,
            scope:this,
            params: {_rand:Math.random()},
            data: data
        });
    },

    /**
     * save to server failed, display error message
     * @function
     * @name HSLayers.WMCManager.onSaveToServerFailed
     * @param {Object} message
     */
    onSaveToServerFailed: function(r) {
        this._mask.hide();
        
        var msg = OpenLayers.i18n("File was not be saved to on the server") +": ";
        if (r.error) {
            msg += r.error.message || "";

        }
        Ext.Msg.show({title:OpenLayers.i18n("WMC Save error"),
                msg: msg,
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR});
    },

    /**
     * save to server successed, use the UUID, fire 'saved' event
     * @function
     * @name HSLayers.WMCManager.onSaveToServerFailed
     * @param {Object} r
     */
    onSaveToServerSuccess: function(r) {
        
        this._mask.hide();

        //this.setUUID(r.result.id);
        this.fireEvent("saved",r.result);
    },

    /**
     * set WMC to the application
     * @function
     * @name HSLayers.WMCManager.setWMC
     */
    setWMC: function() {
        this.createWMC();
        this.fireEvent("set",{title:this.titleField.getValue(), link: null, uuid:null});
    },

    /**
     * Save WMC to local hard disc
     * @function
     * @name HSLayers.WMCManager.saveWMCToDisc
     */
    saveWMCToDisc: function() {

        if (!this.getForm().isValid()) {
            return;
        }

        var wmc = this.createWMC();

        // create some form
        var inputField;

        // wmcForm is hidden HTML form, which has to be submitted
        // the server returns back the WMC file itself
        if(this.wmcForm) {
            inputField = this.wmcForm.data;
        }
        else {

            this.wmcForm = document.createElement('form');
            document.body.appendChild(this.wmcForm);
            this.wmcForm.setAttribute('method', 'post');
            this.wmcForm.setAttribute('action', HSLayers.statusManagerUrl);
            this.wmcForm.style.display='none';

            inputField = document.createElement('input');
            inputField.setAttribute('name','request');
            inputField.setAttribute('value','feedback');
            this.wmcForm.appendChild(inputField);

            inputField = document.createElement('input');
            inputField.setAttribute('name','filename');
            inputField.setAttribute('value','wmc-'+this.uuid+'.xml');
            this.wmcForm.appendChild(inputField);

            inputField = document.createElement('input');
            inputField.setAttribute('name','data');
            this.wmcForm.appendChild(inputField);
        }
        // create the xml file
        var xmlParser = new OpenLayers.Format.XML(); 
        inputField.setAttribute('value', xmlParser.write(wmc));
        this.wmcForm.submit();
        this.fireEvent("saved",{title:this.titleField.getValue(), link: null, uuid:null});
    },

    /**
     * convert map to context, as we need it, creates this.context
     * attribute
     * @private
     * @function
     * @name HSLayers.WMCManager.contextToMap
     * @returns {Object} this.context
     */
    contextToMap: function() {

        var i;
        var len;
        var img;
        var val;
        var format = new HSLayers.Format.WMC({
                            includeBaseLayers: this.baseLayersField.getValue()
                        });
        var parser = format.getParser();

        if (!this.map) {
            return;
        }
        if (!this.map.metadata) {
            this.map.metadata = {};
        }

        // custom things
        this.map.title = this.titleField.getValue();
        this.map.metadata['abstract'] = this.abstractField.getValue();

        // keywords
        this.map.metadata.keywords = [];
        for (i = 0, len = this.keywordsSet.items.length; i < len; i++) {
            var kw = this.keywordsSet.items.items[i];

            // take keywords from the fields ISO and INSPIRE
            if (kw instanceof HSLayers.WMCManager.KeywordsField) {
                val =  kw.getValue();
                if (val) {
                    this.map.metadata.keywords.push(kw.getValue());
                }
            }
            // take keywords from the text area
            else if (kw instanceof Ext.form.TextArea) {

                val = kw.getValue();
                if (val){
                    this.map.metadata.keywords = this.map.metadata.keywords.concat(val.split(","));
                }
            }
        }

        // logo
        if (this.logoPanel.body) {
            img = this.logoPanel.body.dom.getElementsByTagName("img");
            if (img.length) {
                this.map.metadata.logo = {};
                this.map.metadata.logo.href = img[0].getAttribute("src");
            }
        }

        // contact informations
        this.map.metadata.contactInformation = {};
        this.map.metadata.contactInformation.contactPersonPrimary = {};
        this.map.metadata.contactInformation.contactPersonPrimary.contactPerson = this.contactSet.personField.getValue();
        this.map.metadata.contactInformation.contactPersonPrimary.contactOrganization = this.contactSet.organisationField.getValue();
        this.map.metadata.contactInformation.contactPosition = this.contactSet.positionField.getValue();
        this.map.metadata.contactInformation.contactAddress = {};
        this.map.metadata.contactInformation.contactAddress.addressType = "";
        this.map.metadata.contactInformation.contactAddress.address = this.contactSet.addressField.getValue();
        this.map.metadata.contactInformation.contactAddress.city = this.contactSet.cityField.getValue();
        this.map.metadata.contactInformation.contactAddress.stateOrProvince = this.contactSet.stateField.getValue();
        this.map.metadata.contactInformation.contactAddress.postCode = this.contactSet.codeField.getValue();
        this.map.metadata.contactInformation.contactAddress.country = this.contactSet.countryField.getValue();
        this.map.metadata.contactInformation.telephone = this.contactSet.phoneField.getValue();
        this.map.metadata.contactInformation.email = this.contactSet.emailField.getValue();

        // date and time
        this.map.metadata.extension = {};
        var now  = new Date();
        this.map.metadata.extension.timeStamp = HSLayers.Util.getIsoDate(new Date());

        // base layers
        if (this.baseLayersField.getValue()) {
            this.map.metadata.extension.baseLayersIncluded = true;
        }

        // language
        if (window.HS && HS.getLang()) {
            this.map.metadata.extension.language = HS.getLang();
        }

        this.context = format.toContext(this.map);
        return this.context;
    },

    /**
     * fill the form with data and set this.context to new one
     * @function
     * @name HSLayers.WMSManager.setContext
     * @param {Object} context
     */
    setContext: function(context){

        // if there is any initContext, use it
        if (this.initContext){
            context = OpenLayers.Util.extend({},this.initContext);
        }

        // use the old context as well
        if (this.context) {
            context = OpenLayers.Util.extend(context,this.context);
        }

        this.context = context;
        

        if (this.context && this.context.uuid) {
            this.setUUID(this.context.uuid);
        }
        
        // fill the forms
        if (this.rendered) {
            this._setContextToForm();
        }
        else {
            this.on("afterrender",this._setContextToForm,this);
        }
    },

    _setContextToForm: function() {

        var context = this.context || {};

        this.titleField.setValue(context.title);
        this.abstractField.setValue(context.abstract);
        var keywords = "";
        var kwf;
        // for each keyword
        if (context.keywords && context.keywords.length) {
            for (var i = 0; i < context.keywords.length; i++) {

                // split "INSPIRE:Keyword" to ["INSPIRE","Keyword"]
                var val = context.keywords[i].split(":");
                if (val.length > 1 && val[1]) {
                    var label = (val[0] == "INSPIRE" ? val[0] : "ISO" );
                    var initField = this.initialFields[label];

                    // create new field, initial is empty
                    if (initField.getValue()) { 
                        kwf = this.getKeywordField(label, val[0],false);
                        this.insertKwTolist(kwf);
                        kwf.setValue(val[1]);
                    }
                    else {
                        this.initialFields[label].setValue(val[1]);
                    }
                }
                else if (val.length === 1) {
                    keywords += context.keywords[i]+",";
                }
            }
        }
        // all other keywords without prefix
        this.keywordsField.setValue(keywords.replace(/,$/,""));

        // set the logo
        if (this.logoPanel.rendered && context.logoURL) {
            this.logoPanel.update("<img src=\""+context.logoURL.href+"\" width=\"100%\" height=\"100%\" />");
        }

        // set contact informations
        if (context.contactInformation) {
            if (context.contactInformation.contactPersonPrimary) {
                this.contactSet.personField.setValue(context.contactInformation.contactPersonPrimary.contactPerson);
                this.contactSet.organisationField.setValue(context.contactInformation.contactPersonPrimary.contactOrganization);
            }
            this.contactSet.positionField.setValue(context.contactInformation.contactPosition);
            if (context.contactInformation.contactAddress) {
                this.contactSet.addressField.setValue(context.contactInformation.contactAddress.address);
                this.contactSet.cityField.setValue(context.contactInformation.contactAddress.city);
                this.contactSet.stateField.setValue(context.contactInformation.contactAddress.stateOrProvince);
                this.contactSet.codeField.setValue(context.contactInformation.contactAddress.postCode);
                this.contactSet.countryField.setValue(context.contactInformation.contactAddress.country);
            }
            this.contactSet.phoneField.setValue(context.contactInformation.telephone);
            this.contactSet.emailField.setValue(context.contactInformation.email);
        }
    },

    /**
     * get details of composition
     * @function
     * @private
     */
    _getCompositionDetails: function() {
        if (!this.uuid || !HSLayers.WMCManager.wmcDetailURL) {
            return;
        }

        OpenLayers.Request.GET({
            params: {
                    query: "identifier="+this.uuid
            },
            scope:this,
            success: this._onCompositionDetails,
            url: HSLayers.WMCManager.wmcDetailURL
        });

    },

    /**
     * parse details of composition
     * @function
     * @private
     */
    _onCompositionDetails: function(xhr) {
        var f = new OpenLayers.Format.JSON();
        var attrs = f.read(xhr.responseText);
        for (var i = 0; i < attrs.returned; i++) {
            var rec = attrs.records[i];
            if (rec.id == this.uuid) {
                
                /*
                 * disable/enable propper buttons
                 */
                rec.mayedit ? this.button_save.enable() : this.button_save.disable();
                this.cat_attributes = rec;
            }
        }
    },

    /**
     * reset the form
     * @function
     * @name HSLayers.WMCManager.reset
     */
    reset: function() {
        this.context = null;
        var items = this.getForm().items;
        for (var i = 0, len  = items.length; i<len; i++) {
            items.get(i).setValue("");
        }
        this.baseLayersField.setValue(true);
        this.setUUID(undefined);
        if (this.logoPanel.rendered) {
            this.logoPanel.update("");
        }
    },


    /**
     * set UUID of this map context
     * @function
     * @name HSLayers.WMCManager.setUUID
     * @param {String} uuid 
     */
    setUUID: function(uuid) {
        if (!!uuid) {
            //this.uuidField.setValue(uuid);
            this.uuid = uuid;
        }
        else {
            //this.uuidField.setValue();
            this.uuid = uuid;
        }

        if (this.uuid && HSLayers.WMCManager.wmcHandlerURL) {
            this._getCompositionDetails();
        }
    },

    /**
     * get UUID of this map context
     * @function
     * @name HSLayers.WMCManager.setUUID
     * @param {Boolean} force default false 
     * @param {Boolean} async default true
     */
    getUUID: function(force,async) {
        if (HSLayers.WMCManager.uuidURL) {
            if (force || !this.uuid) {
                OpenLayers.Request.GET({
                    url: HSLayers.WMCManager.uuidURL,
                    async: !async,
                    params: {_salt:Math.random()},
                    success: function(r){this.setUUID(r.responseText);},
                    scope:this
                });
            }
        }
    },

    /**
     * set keyword
     * @function
     * @name HSLayers.WMCManager.addKeyword
     * @param {String} keyword 
     * @param {String} prefix 
     */
    addKeyword: function(keyword,prefix) {
        if (this.keywordsField.getValue()) {
            this.keywordsField.setValue(
                    this.keywordsField.getValue()+",");
        }
        if (prefix) {
            this.keywordsField.setValue(this.keywordsField.getValue()+prefix+":"+keyword);
        }
        else {
            this.keywordsField.setValue(this.keywordsField.getValue()+keyword);
        }
    },

    /**
     * create instance of KeywordsField and return it
     * @function
     * @private
     * @name HSLayers.WMCManager.getKeywordsField
     * @param {String} label
     * @param {Ext.data.Store} store
     * @param {Boolean} plusButton
     * @param {String} value initial, can be ommitted
     * @returns {KeywordsField}
     */
    getKeywordField: function(label,keyword,plusButton,value) {
        config = {
                    anchor:'95%',
                    fieldLabel: label,
                    displayPlus:plusButton,
                    hideParent: true,
                    displayField:'label',
                    valueField: 'name',
                    typeAhead: true,
                    value: value,
                    keyword: keyword,
                    width: this.fieldWidth - 20,
                    store: this.stores[label],
                    triggerAction: 'all'
        };
        return new HSLayers.WMCManager.KeywordsField(config);
    },

    /**
     * clicked at the '+' button for adding new keyword field, add new one
     *
     * @function
     * @param {KeywordsField}
     * @param {Event}
     *
     */
    onPlusClicked: function(kw, event) {

        var config = kw.initialConfig;
        config.displayPlus = false;

        var new_kw = new HSLayers.WMCManager.KeywordsField(config);
        this.insertKwTolist(new_kw);
    },
    
    /**
     * insert keyword field to the kw list
     * @function
     * @name HSLayers.WMCManager.insertKwTolist
     * @param {KeywordsField}
     */
    insertKwTolist: function(kw) {
                        
        // get the last index of given Label
        // last must always free keywords textarea appear
        var lastLabelIndex = -1;
        for (var i = 0, len = this.keywordsSet.items.length; i < len; i++) {
            if (kw.fieldLabel == this.keywordsSet.items.items[i].fieldLabel) {
                lastLabelIndex = i + 1;
            }
        }

        // get the  propper field index
        var idx = (lastLabelIndex  == -1 ? this.keywordsSet.items.length -1 : lastLabelIndex); 

        // insert field into fieldset
        this.keywordsSet.insert(idx,kw);
        this.doLayout();
    },

    /**
     * custom function for modifing the context, before it is cursed to
     * XML
     * @function
     * @name HSLayers.WMCManager.modifyContext
     * @param {Object} context
     * @returns {Object} modified context
     */
    modifyContext: function(context) {
        return context;
    },

    CLASS_NAME: "HSLayers.WMCManager"
});

/**
 * @class HSLayers.WMCManager.ConcactCollection
 * @augments Ext.form.FieldSet
 * @constructor 
 */
HSLayers.WMCManager.ConcactSet = function(config) {
    config = config || {};
    config.items = [];

    var profile = (typeof(config.profile) == typeof([]) ? config.profile : ["person",
                                    "organisation",
                                    "position",
                                    "address",
                                    "city",
                                    "state",
                                    "code",
                                    "country",
                                    "phone",
                                    "email"]);

    this.personField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("Person")
            });
    if (profile.indexOf("person") > -1) {
        config.items.push(this.personField) 
    }

    this.organisationField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("Organization")
            });
    if (profile.indexOf("organisation") > -1) {
        config.items.push(this.organisationField) 
    }

    this.positionField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("Position")
            });
    if (profile.indexOf("position") > -1) {
        config.items.push(this.positionField) 
    }

    this.addressField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("Address")
            });
    if (profile.indexOf("address") > -1) {
        config.items.push(this.addressField) 
    }

    this.cityField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("City")
            });
    if (profile.indexOf("city") > -1) {
        config.items.push(this.cityField) 
    }

    this.stateField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("State or Province")
            });
    if (profile.indexOf("state") > -1) {
        config.items.push(this.stateField) 
    }

    this.codeField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("Postal code")
            });
    if (profile.indexOf("code") > -1) {
        config.items.push(this.codeField) 
    }

    this.countryField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("Country")
            });
    if (profile.indexOf("country") > -1) {
        config.items.push(this.countryField) 
    }

    this.phoneField = new Ext.form.TextField({
                fieldLabel: OpenLayers.i18n("Phone")
            });
    if (profile.indexOf("phone") > -1) {
        config.items.push(this.phoneField) 
    }

    this.emailField = new Ext.form.TextField({
                vtype: "email",
                fieldLabel: OpenLayers.i18n("e-mail")
            });
    if (profile.indexOf("email") > -1) {
        config.items.push(this.emailField) 
    }

    this.loadContactFromSystemButton = new Ext.Button({
        text: OpenLayers.i18n("Get from user profile"),
        disabled: true,
        handler: this.loadContactFromSystem,
        scope: this
    });

    config.items.push(this.loadContactFromSystemButton) 

    config.title = OpenLayers.i18n("Contact information");
    config.collapsible = true;


    HSLayers.MapPanel.superclass.constructor.call(this, config);
};

/**
 * @class HSLayers.WMCManager.ConcactSet
 */
Ext.extend(HSLayers.WMCManager.ConcactSet, Ext.form.FieldSet, {

    personField:null,
    organisationField:null,
    addressField: null,
    cityField: null,
    stateField: null,
    codeField: null,
    countryField:null,
    loadContactFromSystemButton: null,
    context: null,

    loadContactFromSystem: function() {
        if (this.context) {
            this.emailField.setValue(this.context.email);
            this.phoneField.setValue(this.context.telephone);
            if (this.context.contactPersonPrimary) {
                this.personField.setValue(this.context.contactPersonPrimary.contactPerson);
                this.organisationField.setValue(this.context.contactPersonPrimary.contactOrganization);
            }
            if (this.context.contactAddress) {
                this.addressField.setValue(this.context.contactAddress.address);
                this.countryField.setValue(this.context.contactAddress.country);
                this.codeField.setValue(this.context.contactAddress.postCode);
                this.cityField.setValue(this.context.contactAddress.city);

            }
        }
    },

    setContext: function(context) {
        this.context = context;
        if (this.context) {
            this.loadContactFromSystemButton.enable();
        }
        else {
            this.loadContactFromSystemButton.disable();
        }
    },

    CLASS_NAME: "HSLayers.WMCManager.ConcactSet"
});

/**
 * @constructor
 */
HSLayers.WMCManager.KeywordsField = function(config){
    config = config || {};

    this.addEvents("plusclicked");
    this.addEvents("minusclicked");
    HSLayers.WMCManager.KeywordsField.superclass.constructor.call(this, config);
};

/**
 * special type of Combo field, with + button
 * @class HSLayers.WMCManager.KeywordsField
 */
Ext.extend(HSLayers.WMCManager.KeywordsField,Ext.form.ComboBox, {

    displayPlus: false,
    displayMinus: true,
    keyword: "",
      
    // private
    onRender : function(ct, position){
        this.doc = Ext.isIE ? Ext.getBody() : Ext.getDoc();
        HSLayers.WMCManager.KeywordsField.superclass.onRender.call(this, ct, position);

        this.doc = Ext.isIE ? Ext.getBody() : Ext.getDoc();
        Ext.form.TriggerField.superclass.onRender.call(this, ct, position);

        this.wrap = this.el.wrap({cls: 'x-form-field-wrap x-form-field-trigger-wrap'});
        this.trigger = this.wrap.createChild(this.triggerConfig ||
                {tag: "img", src: Ext.BLANK_IMAGE_URL, alt: "", cls: "x-form-trigger " + this.triggerClass});

        this.initTrigger();


        // minus button
        // NOTE: minus is not necessary: you  can always delete it by hand
        //if (this.displayMinus) {
        //    this.minus = this.wrap.createChild(this.minusConfig ||
        //        {tag: "img", src: Ext.BLANK_IMAGE_URL, alt: "", cls: "remove-button",style:"position:absolute; top:0; right:0px;"});
        //    this.initMinus();
        //}

        // plus button
        if (this.displayPlus) {
            this.plus = this.wrap.createChild(this.plusConfig ||
                {tag: "img", src: Ext.BLANK_IMAGE_URL, alt: "", cls: "add-button",style:"position:absolute; top:0; right:0px;"});

            // initialize the events on the plus button
            this.initPlus();
        }

        // set the width
        if(!this.width){
            this.wrap.setWidth(this.el.getWidth()+this.trigger.getWidth()+this.minus.getWidth()+this.plus.getWidth());
        }
        this.el.setWidth(this.el.getWidth()-21);
        this.resizeEl = this.positionEl = this.wrap;
    },
             
    // private
    onResize : function(w, h){
        Ext.form.TriggerField.superclass.onResize.call(this, w, h);
        var tw = this.getTriggerWidth();
        if(Ext.isNumber(w)){
            this.el.setWidth(w - tw-21);
        }
        this.wrap.setWidth(this.el.getWidth() + tw+21);
    },
               
    // private
    initMinus : function(){
        this.mon(this.minus, 'click', this.onMinusClick, this, {preventDefault:true});
    },
               //
    // private
    initPlus : function(){
        this.mon(this.plus, 'click', this.onPlusClick, this, {preventDefault:true});
    },

    onPlusClick: function(e) {
        this.fireEvent('plusclicked', this, e);
    },

    onMinusClick: function(e) {
        this.setValue("");
        this.fireEvent('minusclicked', this, e);
    },

    // getValue
    getValue: function() {
        var val = HSLayers.WMCManager.KeywordsField.superclass.getValue.call(this);
        if (val) {
            return this.keyword+":"+val;
        }
    },

    reset : function(){
        HSLayers.WMCManager.KeywordsField.superclass.reset.call(this);
        this.setValue("");
    },

    CLASS_NAME:"HSLayers.WMCManager.KeywordsField"
});

/**
 * URL for WMC Images
 * @name HSLayers.WMCManager.getImagesURL
 * @type String
 */
HSLayers.WMCManager.getImagesURL = null;

/**
 * URL for existing WMCs
 * @name HSLayers.WMCManager.getWMCsURL
 * @type String
 */
HSLayers.WMCManager.getWMCsURL = null;

/**
 * URL with saved WMC Handler 
 * @name HSLayers.WMCManager.wmcHandlerURL
 * @type String
 */
HSLayers.WMCManager.wmcHandlerURL = null;

/**
 * URL which will return back detailed information about saved WMC based on
 * catalogue 
 * @name HSLayers.WMCManager.wmcDetailURL
 * @type String
 */
HSLayers.WMCManager.wmcDetailURL = null;

/**
 * URL, where to get fresh UUID from
 * @name HSLayers.WMCManager.uuidURL
 * @type String
 */
HSLayers.WMCManager.uuidURL = null;

/**
 * URL, where JSON object with INSPIRE themes and ISO keywords is stored
 * @name HSLayers.WMCManager.inspireThemesURL
 * @type String
 */
HSLayers.WMCManager.inspireThemesURL = null;
