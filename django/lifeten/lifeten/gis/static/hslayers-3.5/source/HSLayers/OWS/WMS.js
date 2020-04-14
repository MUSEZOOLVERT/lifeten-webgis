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
Ext.namespace("HSLayers.OWS.WMS");

/**
 * WMS parser is panel, with WMS capabilities
 *
 * @class HSLayers.OWS.WMS
 * @augments HSLayers.OWS
 * @param {Object} config
 */
HSLayers.OWS.WMS = function(config){

    HSLayers.OWS.WMS.superclass.constructor.call(this, config);

};

Ext.extend(HSLayers.OWS.WMS, HSLayers.OWS, {

    /**
     * Service type
     * @name HSLayers.OWS.WMS.service
     * @type String
     */
    service: "WMS",

    /**
     * Service type
     * @name HSLayers.OWS.WMS.title
     * @type String
    title: "WMS",
     */

    /**
     * Use tiles checked
     * @name HSLayers.OWS.WMS.useTiles
     * @type Boolean
     */
    useTiles : false,

    /**
     * URL of the GetMap request
     * @name HSLayers.OWS.WMS.getMapUrl
     * @type String
     */
    getMapUrl : null,

    /**
     * Prefix for ids and css styles used by this manager 
     * @name HSLayers.OWS.WMS.layerStylesPrefix
     * @type String
     */
    layerStylesPrefix: "HSWMSManager.styleCombo.",

    /**
     * Icon to be displayed in services tree
     * @name HSLayers.OWS.WMS.serviceIcon
     * @type String
     */
    serviceIcon: "maplayer.png",


    /**
     * OWS class
     * The type that will be used for tha layers added from this tab      
     * @name HSLayers.WMS.WMSClass
     * @default HSLayers.Layer.WMS
     */
    WMSClass: HSLayers.Layer.WMS,

    /**
     * List of avaiable WMS exception types
     * @name HSLayers.OWS.WMS.exceptions
     * @type String[]
     */
    exeptions : [],

    /**
     * List of avaiable WMS srss
     * @name HSLayers.OWS.WMS.srss
     * @type String[]
     */
    srss : [],

    /**
     * Checkbox for single tiles
     * @private
     * @name HSLayers.OWS.WMS.singleTileInput
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Checkbox">Ext.form.Checkbox</a>
     */
    singleTileInput : null,

    /**
     * Text field for tile size
     * @private
     * @name HSLayers.OWS.WMS.tileSizeInput
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Field">Ext.form.Field</a>
     */
    tileSizeInput : null,

    /**
     * Parse GetCapabilities XML document
     * @name HSLayers.OWS.WMS.parseCapabilities
     * @function
     *  
     * @param {XMLDOM} text input response as responseText
     */
    parseCapabilities: function(data) {

        try {
            var format = new OpenLayers.Format.WMSCapabilities();
            this.capabilities = format.read(data);

            this.title = this.capabilities.service.title;
            this.description = HSLayers.Util.addAnchors(this.capabilities.service.abstract);
            this.version = this.capabilities.version;
            this.imageFormats = this.capabilities.capability.request.getmap.formats;
            this.queryFormats = (this.capabilities.capability.request.getfeatureinfo ? this.capabilities.capability.request.getfeatureinfo.formats : []);
            this.exceptions = this.capabilities.capability.exception.formats;
            this.srss = this.capabilities.capability.layers[0].srs;
            this.services = this.capabilities.capability.nestedLayers;
            this.getMapUrl = this.capabilities.capability.request.getmap;

        }
        catch(e){
            Ext.MessageBox.show({
                    title: OpenLayers.i18n('WMS Capabilities parsing problem'),
                    msg: OpenLayers.i18n('There was error while parsing Capabilities response from given URL')+":<br />\n"+ e,
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR});
            throw "WMS Capabilities parsing problem"; 
        }
    },

    /**
     * fill metadata panel
     * @function
     * @name HSLayers.OWS.WMS.fillMetadataPanel
     */
    fillMetadataPanel: function() {

         var c = this.capabilities;
         var s = c.service;
         var a = s.contactInformation ? s.contactInformation.contactAddress : {};
         var data = {
             titleLang: OpenLayers.i18n("Title"),
             title: s.title,
             abstractLang: OpenLayers.i18n("Abstract"),
             "abstract": s["abstract"],
             contactLang: OpenLayers.i18n("Contact information"),
             addressLang: OpenLayers.i18n("Delivery point") || "&#8211;",
             address: a.address,
             cityLang: OpenLayers.i18n("City") || "&#8211;",
             city: a.city,
             countryLang: OpenLayers.i18n("Country") || "&#8211;",
             country: a.country,
             postalCodeLang: OpenLayers.i18n("Postal code") || "&#8211;",
             postalCode: a.postcode,
             phoneLang: OpenLayers.i18n("Phone") || "&#8211;",
             phone: s.contactInformation.phone,
             mailLang: OpenLayers.i18n("e-mail") || "&#8211;",
             mail: s.contactInformation.email,
             feesLang: OpenLayers.i18n("Conditions applying to access and use"),
             fees: s.fees || "&#8211;",
             accessLang: OpenLayers.i18n("Limitations on public access"),
             access: s.accessConstraints || "&#8211;",
             personLang: OpenLayers.i18n("Contact person"),
             person: s.contactInformation.personPrimary.person || "&#8211;",
             organizationLang: OpenLayers.i18n("Responsible organization"),
             organization: s.contactInformation.personPrimary.organization || "&#8211;"
         };
         var tmpl = new Ext.XTemplate(HSLayers.OWS.WMS.MetadataTemplate,{compiled:true});
         this.metadataPanel.update(tmpl.apply(data));
    },

    /**
     * fill properties form with data
     */
    fillPropertiesForm: function() {
        var imageFormatsData = [];
        var queryFormatsData = [];
        var i;
        
        // imageFormat
        for (i = 0; i < this.imageFormats.length; i++) {
            imageFormatsData.push([this.imageFormats[i]]);
        }
        this.imageFormatInput.store.loadData(imageFormatsData);
        this.imageFormatInput.setValue(
            this.getPreferedFormat(this.imageFormats, HSLayers.OWS.WMS.preferedImageFormats));

        /* gml first */
        var gmlIndex = 0;
        for (i = 0; i < this.queryFormats.length; i++) {
            queryFormatsData.push([this.queryFormats[i]]);
            if (this.queryFormats[i].toLowerCase().search("gml") > -1) {
                gmlIndex = i;
            }
        }
        this.queryFormatInput.store.loadData(queryFormatsData);
        this.queryFormatInput.setValue(this.getPreferedFormat(this.queryFormats, HSLayers.OWS.WMS.preferedQueryFormats));

        /* srs */
        var n = 0;
        var sumsrss = 0;
        
        for (var i in this.srss) {
            sumsrss += 1;
        }
        this._sumsrss = sumsrss;

        this._readSRSS(0,10);

        this.propForm.setTitle(this.title+ (this.service ? " " + this.service : ""));

    },

    /**
     * read SRS based on user feedback
     * @function
     * @private
     * @param start {Integer} start at index
     * @param stop {Integer} stop reading after N featuers count
     */
    _readSRSS: function(start, stop) {

        var i = 0;
        var n = 0;
        for (i in this.srss) {
            n += 1;
            var srsData = [];

            // skip already parsed SRSs
            if (n < start) {
                continue;
            }

            // create the Projection object
            var prj;
            try {
                prj = new OpenLayers.Projection(i);                                                                                                                          
                if (! prj.proj) {
                    prj.proj = {title:i};
                }
            }
            catch(e){
                prj = {proj:{title:i}};
            }
            if (prj.proj.readyToUse && prj.getCode() != "CRS:84") {
                srsData.push([prj.proj.title || prj.getCode(),i]);
            }
            
            // read the srs into the store
            this.srsInput.store.loadData(srsData,true);
            
            // show messgeBox, if n > 10
            if (n > 0 && n%10 == 0 && (n+5 < this._sumsrss)) {
                this._showSrsMessageBox(n);
                break;
            }
        }

        if (n == this._sumsrss) {
            this._afterSRSSread();
        }
    },

    /**
     * srss are parsed, go on with after steps
     * @private
     * @function
     * @name HSLayers.OWS.WMS._afterSRSSread
     */
    _afterSRSSread: function() {
        var value;
        var mapProj = this.map.getProjectionObject();
        if (this.srsInput.store.data.length > 0) {
            value = this.srsInput.store.getAt(0).data.code;
            for (var i = 0, len = this.srsInput.store.getCount(); i < len; i++) {
                var srsData = this.srsInput.store.getAt(i);
                if (mapProj.equals(new OpenLayers.Projection(srsData.data.code))) {
                    value = srsData.data.code;
                }
            }
        }
        else {
            value = mapProj.getCode();
        }

        this.srsInput.setValue(value);
    },

    /**
     * show srs message box with informations about number of projections
     * beeing parsed
     *
     * @function
     * @private
     * @name HSLayers.OWS.WMS._showSrsMessageBox
     * @param n {Integer} index of already read srss
     * @returns {Boolean} continue or not
     */
    _showSrsMessageBox: function(n) {

        Ext.MessageBox.show({
                title: OpenLayers.i18n("Too many projections"),
                msg: OpenLayers.i18n(
                    "Too many projections are available for this service ("+String(this._sumsrss)+
                    "). <br />Already read "+String(n)+
                    " projections. Continue with another 10?"),
                buttons: {
                    "no":OpenLayers.i18n("Stop"),
                    "yes":OpenLayers.i18n("Read another 10"),
                    "cancel": OpenLayers.i18n("Read all")
                },
                icon: Ext.MessageBox.WARNING,
                scope: this,
                fn: function(btn) {
                    if (btn == "yes") {
                        this._readSRSS(n, 10);
                    }
                    else if ( btn == "cancel") {
                        this._readSRSS(n, 0);
                    }
                    else {
                        this._afterSRSSread();
                    }
                }
        });
    },
        

    /**
     * Format properties form of this service (image format, query format,
     * ...)
     *
     * @name HSLayers.OWS.WMS.makePropertiesForm
     * @function
     */
    makePropertiesForm: function() {

        /* formats */
        var imageFormatsData = [];
        var queryFormatsData = [];
        var i;

        var imageFormatsStore = new Ext.data.SimpleStore({
                fields: [ {name: 'format', type: 'string'} ],
                data : imageFormatsData
            });
        var queryFormatsStore = new Ext.data.SimpleStore({
                fields: [ {name: 'format', type: 'string'} ],
                data : queryFormatsData
            });
        var srsStore = new Ext.data.SimpleStore({
                fields: [ {name: 'srs', type: 'string'},{name:'code',type:'string'} ],
                data : []
            });

        this.folderName = new Ext.form.TextField({
            fieldLabel: OpenLayers.i18n("Folder name")
            });


        this.imageFormatInput = new Ext.form.ComboBox({
            fieldLabel: OpenLayers.i18n("Image format"),
            displayField:'format',
            value: "",
            typeAhead: true,
            triggerAction: 'all',
            mode:"local",
            width: 150,
            store: imageFormatsStore
            });

        

        this.queryFormatInput = new Ext.form.ComboBox({
            fieldLabel: OpenLayers.i18n("Query format"),
            displayField:'format',
            value: "",
            typeAhead: true,
            triggerAction: 'all',
            mode:"local",
            width: 150,
            listWidth: 200,
            store: queryFormatsStore
            });


        this.srsInput = new Ext.form.ComboBox({
            fieldLabel: OpenLayers.i18n("SRS"),
            displayField:'srs',
            valueField: 'code',
            value : "",
            typeAhead: true,
            triggerAction: 'all',
            mode:"local",
            width: 150,
            listWidth: 200,
            store: srsStore
            });

        this.singleTileInput = new Ext.form.Checkbox({
                    autoWidth: true, 
                    fieldLabel: OpenLayers.i18n("Use tiles"),
                    checked: this.useTiles
                });

        this.tileSizeInput = new Ext.form.TextField({
            fieldLabel: OpenLayers.i18n("Tile size"),
            width:30,
            value:"512"
            });

        /* tiled/untiled */
        /* kontrola sour. systemu */
        /* kontrola formatu GetFeatureInfo */

        this.propForm = new Ext.form.FormPanel({
            title: this.title,
            autoScroll: true,
            labelWidth: 100,
            height: 160,
            region: this.ownerCt instanceof Ext.Window ? 'west' : "north",     
            frame:true,
            forceLayout: true,
            collapsible:true,
        items: [ this.imageFormatInput,
                    this.queryFormatInput,
                    this.srsInput,
                     this.singleTileInput,
                     this.tileSizeInput,
                     this.folderName
                    ] });

        return this.propForm;
    },

    /**
     * Search given attribute in the input XML
     *
     * @param {DOMElement} parentNode node, where to start to search
     * @param {String} childNodeName what is to be searched, like "srs","format", ...
     * @returns {String[]} values
     */
    parseWMSOptions : function(parentNode,childNodeName,upperCase) {
        var childNodes = parentNode.getElementsByTagName(childNodeName);
        var values = [];
        for (var i = 0; i < childNodes.length; i++) {
            var value = childNodes[i].firstChild.nodeValue;
            if (upperCase) {
                value = value.toUpperCase();
            }
            if (this.featureInList(value, values) == false) {
                values.push(value);
            }
        }

        return values;
    },

    /**
     * feature in given array
     * 
     * @param {Object} feature
     * @param {Array} list
     * @returns {Boolean}
     */
    featureInList: function(feature,list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] == feature) {
                return true;
            }
        }
        return false;
    },

    /**
     * Parse style node and return object with name,title, legend etc. back
     * @function
     * @name HSLayers.OWS.WMS.parseLayerStyle
     *
     * @param {DOMElement} styleNode 
     * @param {Object} style
     */
    parseLayerStyle: function(styleNode) {
        style = {};
        style.name = styleNode.getElementsByTagName("Name")[0].firstChild.nodeValue;
        style.title = styleNode.getElementsByTagName("Title")[0].firstChild.nodeValue;
        style.legend = {};

        try {
            style.legend.format = styleNode.getElementsByTagName("Format")[0].nodeValue;
        }
        catch(e){
            style.legend.format = "image/png";
        }

        resource = styleNode.getElementsByTagName("OnlineResource")[0];
        if (resource) {
            style.legend.resource = resource.getAttribute("xlink:href");
        }


        return style;
    },

    /**
     * Return URL with icon for the layer (queryable or not, ...)
     * @function
     * @name HSLayers.OWS.WMS.getServiceIcon
     * 
     * @parameter {String} service - layer
     * @returns {String} url
     */
    getServiceIcon: function(service) {

        var iconUrl = OpenLayers.Util.getImagesLocation()+"/"+this.serviceIcon;
        if (service && service.queryable == 1) {
            iconUrl =  OpenLayers.Util.getImagesLocation()+"/"+"maplayer-queryable.png";
        }
        if (service === undefined) {
            iconUrl= null;
        }

        return iconUrl;
    },

    /**
     * Append tree of layers to parent node
     * @function
     * @name HSLayers.OWS.WMS.makeServicesNodes
     *
     * @param {Object} service layer, with list of layers (services)
     * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a>} node to which the tree will be appended
     */
    makeServicesNodes: function(service,parentNode) {
        
        for (var i = 0; i < service.length; i++) {

            var node  = new Ext.tree.TreeNode({
                    checked: (service[i].name === undefined ? undefined : false),
                    draggable: false,
                    allowChildren: true,
                    icon:this.getServiceIcon(service[i]),
                    leaf : false,
                    singleClickExpand : true,
                    text :  service[i].title || service[i].name,
                    expanded: true,
                    serviceAttributes: service[i]
                });

            this.toolTips.push({id:node.id,
                                title: service[i].title,
                                html: service[i].abstract});
            parentNode.appendChild(node);

            if (service[i].styles.length > 0) {
                var data = [];
                for (var j = 0; j < service[i].styles.length; j++) {
                    data.push([service[i].styles[j].name,
                               service[i].styles[j].title]);
                }
                var store = new Ext.data.SimpleStore({
                        fields: [ {name: 'name', type: 'string'},
                                {name:"title",type:"string"}],
                        data : data
                });
                var input = new Ext.form.ComboBox({
                    displayField:'title',
                    value : store[0],
                    typeAhead: true,
                    triggerAction: 'all',
                    mode:"local",
                    width: 75,
                    store: store
                });

                node.attributes.stylesInput = input;
            }

            if (service[i].name != undefined) {
                this.nodes.push(node);
            }
            
            this.servicesList[service[i].name] = service[i];
            if (service[i].nestedLayers.length > 0) {
                this.makeServicesNodes (service[i].nestedLayers, node);
            }
        }
    },

    /**
     * Clicked on the button "To map". Create new layers (according to
     * checked layers) and add new layers to map.
     * @function
     * @name HSLayers.OWS.WMS.onToMapClicked
     */
    onToMapClicked: function() {

            // called to create layers 
            var colectData = function() {

                    var layers = this.findCheckedLayers();
                    var imageFormat = this.imageFormatInput.getValue();//.split("/")[1];
                    var queryFormat = this.queryFormatInput.getValue();
                    var singleTile = !this.singleTileInput.getValue();
                    var tileSize = this.tileSizeInput.getValue();
                    tileSize = new OpenLayers.Size(tileSize, tileSize);
                    var crs = this.srsInput.getValue();

                    this.addLayers(layers,imageFormat,queryFormat,singleTile,tileSize,crs);
            };

            if (this.checkMapProjection([this.srsInput.getValue()], this.map.getProjectionObject()) === false) {

                Ext.MessageBox.show({title: OpenLayers.i18n('Resample layer'), 
                                msg: OpenLayers.i18n("Map projection and layer projection not match. Add the layer to map and use server-side resampling program?"),
                                scope: this,
                                buttons: Ext.MessageBox.YESNO,
                                modal:false,
                                fn: function(btn,win) {
                                    if (btn == "yes") {
                                        if (!HSLayers.OWS.proxy4ows)  {
                                            alert(OpenLayers.i18n("Warping proxy (HSLayers.OWS.proxy4ows) not set. Layer can not be created!"));
                                            return;
                                        }
                                        colectData.apply(this,[]);
                                    }
                                }
                            });
            }
            else {
                colectData.apply(this,[]);
            }
    },

    /**
     * Get selected style for checked layer
     * @name HSLayers.OWS.WMS.getSelectedStyle
     * @function
     * @param {String} name layer name
     * @returns {String} selected style name
     */
    getSelectedStyle: function(name) {
        if (document.getElementById(this.layerStylesPrefix+name)) {
            return document.getElementById(this.layerStylesPrefix+name).value;
        }
        else {
            return null;
        }
    },

    /**
     * Find checked layers
     * @function
     * @name HSLayers.OWS.WMS.findCheckedLayers
     * @returns [{Object}] list of capabilities layer object
     */
    findCheckedLayers: function() {
        var i;

        layers = [];
        for (i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].getUI().checkbox && this.nodes[i].getUI().checkbox.checked) {
                var name = this.nodes[i].attributes.serviceAttributes.name;
                layers.push(this.servicesList[name]);
                this.nodes[i].getUI().checkbox.checked = false;
            }
        }
        return layers;
    },

    /**
     * Everything all right, add selected layers to map
     * @param [{Object}] layer list of capabilities layer object
     * @param {String} layerName layer name in the map
     * @param {String} imageFormat
     * @param {String} queryFormat
     * @param {Boolean} singleTile
     * @param {OpenLayers.Size} tileSize
     * @param {OpenLayers.Projection} crs crs of the layer
     * @function
     * @name HSLayers.OWS.WMS.addLayers
     */
    addLayers: function(layers,imageFormat,queryFormat, singleTile, tileSize,crs){
        var i,layerName;

        if (!layers.length) {
            layers  = [layers];
        }

        for (i = 0; i < layers.length; i++) {


            this.addLayer(
                            layers[i],
                            layers[i].title.replace(/\//g,"&#47;"),
                            this.folderName.getValue(),
                            imageFormat,
                            queryFormat,
                            singleTile,
                            tileSize,
                            crs
                    );
        }
        this.onLayersAddedDone.apply(this.scope,[]);
    },
    /**
     * add selected layer to map
     * @param {Object} layer capabilities layer object
     * @param {String} layerName layer name in the map
     * @param {String} folder name 
     * @param {String} imageFormat
     * @param {String} queryFormat
     * @param {Boolean} singleTile
     * @param {OpenLayers.Size} tileSize
     * @param {OpenLayers.Projection} crs of the layer
     * @function
     * @name HSLayers.OWS.WMS.addLayer
     */
    addLayer: function(layer, layerName, folder, imageFormat,queryFormat,singleTile, tileSize, crs) {

            var layerCrs = (typeof(this.map.projection) == typeof("") ? this.map.projection.toUpperCase() : this.map.projection.getCode().toUpperCase());

            var options = {
                    layers: layer.name,
                    transparent: (imageFormat.search("png") > -1 || imageFormat.search("gif") > -1 ? "TRUE" : "FALSE"),
                    format: imageFormat,
                    EXCEPTIONS: "application/vnd.ogc.se_inimage", //application/vnd.ogc.se_xml",
                    VERSION: this.version,
                    INFO_FORMAT: (layer.queryable ? queryFormat : undefined),
                    styles: layer.styles.length > 0 ? layer.styles[0].name : undefined
                };

            var maxExtent;
            var layerbbox = null;


            if (layer.llbbox) {
                layerbbox = layer;

                prj = new OpenLayers.Projection("epsg:4326");
                // NOT in 'common' form minx, miny, maxx, maxy, but
                // miny, minx, maxy, maxx
                // FIXME - you never know :-(
                // 1.3.0
                // 0: "48.1524"
                // 1: "12.7353"
                // 2: "51.3809"
                // 3: "17.1419"
                maxExtent = new OpenLayers.Bounds(layerbbox.llbbox[0],
                                                  layerbbox.llbbox[1],
                                                  layerbbox.llbbox[2],
                                                  layerbbox.llbbox[3]);

                var mapBounds = this.map.getMaxExtent().clone();
                mapBounds.transform(this.map.getProjectionObject(), prj);

                // fix sizes
                maxExtent.left = (maxExtent.left < mapBounds.left ? mapBounds.left : maxExtent.left);
                maxExtent.bottom = (maxExtent.bottom < mapBounds.bottom ? mapBounds.bottom : maxExtent.bottom);
                maxExtent.right = (maxExtent.right > mapBounds.right ? mapBounds.right : maxExtent.right);
                maxExtent.top = (maxExtent.top > mapBounds.top ? mapBounds.top : maxExtent.top);

                if (maxExtent.containsBounds(mapBounds)) {
                    maxExtent = this.map.getMaxExtent().clone();
                }
                else {
                    maxExtent.transform(prj, this.map.getProjectionObject());
                }
            }

            switch(this.version) {
                case "1.3.0":
                    options.CRS = layerCrs;
                    options.EXCEPTIONS =  "XML";
                    break;
                default:
                    options.SRS = layerCrs;
                    break;
            }

            var projections = [];

            for (var j in this.srss) {
                var prj;
                try {
                    prj = HSLayers.OWS._Projections[j.toUpperCase()];
                    if (!prj) {
                        prj = new OpenLayers.Projection(j);
                        HSLayers.OWS._Projections[j.toUpperCase()] = prj;
                    }
                    if (prj.proj.readyToUse) {
                        projections.push(prj);
                    }
                }
                catch(e){OpenLayers.Console.log(e);}
            }
            
            // HACK HACK HACK
            // min and max scale is sometimes parsed in wrong way
            layer.minScale = parseFloat(layer.minScale);
            layer.maxScale = parseFloat(layer.maxScale);
            if (layer.minScale && layer.maxScale && (layer.minScale < layer.maxScale)) {
                var mins = layer.minScale;
                layer.minScale = layer.maxScale;
                layer.maxScale = mins;
            }
            // /HACK HACK HACK

            
            var minResolution =  (layer.maxScale ? OpenLayers.Util.getResolutionFromScale(layer.maxScale,this.map.baseLayer.units) : 
                            this.map.baseLayer.resolutions[this.map.baseLayer.resolutions.length-1]);
            var maxResolution = (layer.minScale ? OpenLayers.Util.getResolutionFromScale(layer.minScale,this.map.baseLayer.units) : 
                            this.map.baseLayer.resolutions[0]);

            if (minResolution == Infinity) {
                minResolution = undefined;
                layer.maxScale = undefined;
            }

            if (maxResolution == Infinity) {
                maxResolution = undefined;
                layer.minScale = undefined;
            }
            
            var obj = {
                formats: []
            };
            layer.formats.map(function(format) {this.formats.push({value: format});},obj);

            var metadataURL = this.getLayerMetadataUrl(layer);
            var layerName = layerName.replace(/\//g,"&#47");
            var params = {
                    isBaseLayer: false,
                    attribution: layer.attribution,
                    title: layerName,
                    visibility:true,
                    transitionEffect: "resize",
                    singleTile: singleTile,
                    tileSize: tileSize, //|| new OpenLayers.Size(OpenLayers.Map.TILE_WIDTH, OpenLayers.Map.TILE_HEIGHT),
                    abstract: layer.abstract,
                    metadata: {
                        styles: layer.styles,
                        formats: obj.formats
                    },
                    saveWMC: true,
                    path: folder,
                    metadataURL: metadataURL,
                    buffer: 1,
                    ratio: 1,
                    maxExtent: maxExtent,
                    projections: projections,
                    projection: new OpenLayers.Projection(crs),
                    queryable: layer.queryable,
                    wmsMinScale: layer.minScale,
                    wmsMaxScale: layer.maxScale,
                    minResolution: minResolution,
                    maxResolution: maxResolution,
                    dimensions: layer.dimensions,
                    capabilitiesURL: this.capabilities.capability.request.getcapabilities.get.href,
                    removable:true
                };

            options.owsService = "WMS";
            //options.owsUrl = this.getMapUrl.href;
            options.fromCRS = crs;

            // unique layer name
            layerName = this.getUniqueLayerName(layerName);

            var newLayer = new this.WMSClass(layerName,this.getMapUrl.href,
                        options,
                        params
                        );

            this.map.addLayer(newLayer);
            this.onLayerAdded.apply(this.scope,[newLayer]);
    },

    /**
     * return object with layer metadataURL
     * @param {object} layer
     * @returns {Object} or undefined
     */
    getLayerMetadataUrl: function(layer) {
        
        // if the layer has metadataURLs attribute, 
        //
        //  1 - search for any text/xml - ISO-based standard, in case it
        //  exists, use it
        //  2 - no xml-ISO based standard does not exist, return the first
        //  found
        //  3 - there is no metadataURL for this layer, return undefined
        if (layer.metadataURLs && layer.metadataURLs.length > 0) {

            // search for the application or text/xml ISO standard and
            // return it
            for (var i = 0, len = layer.metadataURLs.length; i < len; i++) {
                if (/(application)|(text)\/xml/.test(layer.metadataURLs[i].format)  &&
                    /(ISO19115:2003)|(TC211)/.test(layer.metadataURLs[i].type)) {
                    return layer.metadataURLs[i];
                }
            }
            // no iso/xml found, return the first found
            return layer.metadataURLs[0];
        }
        else {
            // no metadata for this layer
            return undefined;
        }
    },

    /**
     * get prefered or fist found from formats
     * @function
     * @name HSLayers.OWS.WMS.getPreferedFormat
     * @param [{String}] formats
     * @param [{String}] preferedFormats
     */
    getPreferedFormat: function(formats, preferedFormats) {

        for (i = 0; i < preferedFormats.length; i++) {
            if (formats.indexOf(preferedFormats[i]) > -1) {
                return(preferedFormats[i]);
            }
        }
        return formats[0];
    },

    requestGetCapabilities: function(url,retFunction,capabilitiesFailed) {
        OpenLayers.Request.GET({
            url:  url,
            params: {request:"GetCapabilities",service: "WMS" },
            success: retFunction,
            scope: this,
            failure: capabilitiesFailed
        });

    },


    CLASS_NAME: "HSLayers.OWS.WMS"
});

/**
 * Query formats
 * @constant
 * @name HSLayers.OWS.WMS.preferedQueryFormats
 */
HSLayers.OWS.WMS.preferedQueryFormats = [ "application/vnd.esri.wms_featureinfo_xml",
                                          "application/vnd.ogc.gml",
                                          "application/vnd.ogc.wms_xml",
                                          "text/plain","text/html"];
/**
 * ImagImage formats
 * @constant
 * @name HSLayers.OWS.WMS.preferedImageFormats
 */
HSLayers.OWS.WMS.preferedImageFormats = ["image/png","image/gif","image/jpeg"];

HSLayers.OWS.WMS.MetadataTemplate = '<div class="metadata">'+
    '<dl>'+
        '<dt>{titleLang}:</dt>'+
        '<dd>{title}</dd>'+

        '<dt>{abstractLang}:</dt>'+
        '<dd>{abstract}</dd>'+

        '<dt>{contactLang}:</dt>'+
        '<dd><address>'+
            '<dl>'+
            '<dt>{personLang}:</dt>'+
            '<dd>{person}</dd>'+

            '<dt>{organizationLang}:</dt>'+
            '<dd>{organization}</dd>'+

            '<dt>{addressLang}:</dt>'+
            '<dd>{address}</dd>'+

            '<dt>{cityLang}:</dt>'+
            '<dd>{city}</dd>'+

            '<dt>{postalCodeLang}:</dt>'+
            '<dd>{postalCode}</dd>'+

            '<dt>{countryLang}:</dt>'+
            '<dd>{country}</dd>'+

            '<dt>{phoneLang}:</dt>'+
            '<dd>{phone}</dd>'+

            '<dt>{mailLang}:</dt>'+
            '<dd>{mail}</dd>'+

            '</dl>'+
        '</address></dd>'+

        
        '<dt>{feesLang}:</dt>'+
        '<dd>{fees}</dd>'+

        '<dt>{accessLang}:</dt>'+
        '<dd>{access}</dd>'+
    '</dl>'+
    '</div>';
