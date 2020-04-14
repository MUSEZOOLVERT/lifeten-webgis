/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
 *            Michal Sredl <sredl ccss cz>
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
Ext.namespace("HSLayers.OWS");

/**
 * OWSPanel is panel, in which WMS, WFS or other W*S panels can appear. 
 *
 * @class HSLayers.OWSPanel
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
 * @param {Object} config
 * @param {String} [config.title = OpenLayers.i18n("OWS")]
 * 
 */
HSLayers.OWSPanel = function(config) {

    config = config || {};

    HSLayers.OWSPanel.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.OWSPanel, Ext.Panel, {

    /**
     * textfield for the initial url
     * @name HSLayers.OWS.urlTextField
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Field">Ext.form.Field</a>
     */
    urlTextField : null,

    /**
     * urls store
     * @name HSLayers.OWS.urlsStore
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.data.ArrayStore">Ext.data.ArrayStore</a>
     */
    urlsStore : null,

    /**
     * textfield for the service type
     * @name HSLayers.OWS.serviceField
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Field">Ext.form.ComboBox</a>
     */
    serviceField : null,


    /**
     * HSLayers.OWS.WMS or WFS or similar
     * @name HSLayers.OWSPanel.ows
     * @type HSLayers.OWS.WMS|HSLayers.OWS.WFS
     */
    ows: null,

    /**
     * The map  object
     * use the {setMap} method for setting this attribute
     * @name HSLayers.OWS.map
     * @property {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    map: null,

    /**
     * initComponent
     * @private
     */
    initComponent: function() {

        var config = {};
        config.layout = "fit";
        config.title =  OpenLayers.i18n("OWS");
        config.hideMode = "offsets";
        config.deferLayout = true;

        this.urlsStore = new Ext.data.ArrayStore({
            fields: ['url',"service"],
            data: this.initialConfig.urls|| []
        });

        // where to write service url
        this.urlTextField = new Ext.form.ComboBox({
            store: this.urlsStore,
            flex: 2,
            colspan: 2,
            width: 90,
            triggerAction: 'all',
            mode: 'local',
            fieldLabel: OpenLayers.i18n("URL"),
            valueField: 'url',
            displayField: 'url',
            iconCls: 'no-icon',
            emptyText: "http://",
            listeners: {
                scope: this,
                change: this._onURLSelected
            }
        });

        // handle ENTER key input
        this.urlTextField.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                f.setValue(f.getEl().dom.value);
                this._onConnectClicked(); }
        }, this);

        // choose the service
        this.serviceField = new Ext.form.ComboBox({
            editable: false,
            store: new Ext.data.ArrayStore({
                iconCls: 'no-icon',
                    fields: ["service"],
                    data: (
                        HSLayers.OWS.proxy4ows ? 
                            [["WMS"],["WFS"],["WCS"],["KML"],["GeoRSS" ],["GML"],["GeoJSON"],["SOS"]] :
                                [["WMS"],["KML"],["GeoRSS"],["GML"],["GeoJSON"],["SOS"]]
                    )
            }),
            displayField: "service",
            style: {
                    //"margin-left": "175px"
            },
            valueField: "service",
            value: "WMS",
            forceSelection: true,
            width: 60,
            mode:"local",
            emptyText: OpenLayers.i18n("Service type")+"...",
            triggerAction: "all"
        });

            
        config.closable = false;

        config.tbar = [
            "URL: ",
            this.urlTextField,
            this.serviceField,
            new Ext.Button({
                    tooltip:OpenLayers.i18n("Connect"), 
                    scope:this,
                    icon: OpenLayers.Util.getImagesLocation()+"/play.png",
                    handler:this._onConnectClicked
            })
        ];

        config.tbarCfg = {
            autoWidth: true,
            enableOverwlof: true,
            forceLayout: true
        };


        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.OWSPanel.superclass.initComponent.apply(this, arguments);

        this.on("resize",function(e) {
            this.urlTextField.setWidth(this.getWidth()-115);
            this.getTopToolbar().doLayout();
        }, this);

    },


    /**
     * connec to the service for given url and type
     * @param {String} url
     * @param {String} service
     * @function
     */
    connect: function(url, type) {
        this.urlTextField.setValue(url);
        this.serviceField.setValue(type.toUpperCase());
        this._onConnectClicked();
    },

    /**
     * @private
     * on connect button clicked
     */
    _onConnectClicked: function() {
        var service = this.serviceField.getValue();

        if (!service) {
            Ext.Msg.show({title: OpenLayers.i18n("Service not set"),
                          icon: Ext.MessageBox.WARNING,
                          msg: OpenLayers.i18n("Service was not set. <br />Please choose the type of service, you want to be connected to."),
                          buttons: Ext.Msg.OK
            });
            return;
        }

        var url = this.urlTextField.getValue();
        url = url.replace(/\s*$/,"").replace(/^\s*/,"");

        if (url.search("http://") < 0) {
            url = "http://"+url;
        }
        this.urlTextField.setValue(url);

        if (!service) {
            Ext.Msg.show({
                title: OpenLayers.i18n("URL not set"),
                msg: OpenLayers.i18n("Service URL was not set. <br />Please insert URL of the service, you want to be connected to."),
                buttons: Ext.Msg.OK,
                icon: Ext.MessageBox.WARNING
            });
            return;
        }

        service = service.toLowerCase();

        switch(service.toLowerCase()) {
            case "kml":
                    this._addNonOWSLayer(url,service,"KML");
                break;
            case "gml":
            case "geojson":
            case "georss":
                // Prompt for user data and process the result using a callback:
                Ext.Msg.prompt(
                    OpenLayers.i18n('Name'),
                    OpenLayers.i18n('Please layer name: '), 
                    function(btn, text){
                        if (btn == 'ok'){
                            this.ows._addNonOWSLayer(this.url,this.service,text);
                        }
                    },{service:service, url:url,ows:this},true,service);
                break;
            default:
                this._addServicePanel(url,service);
                break;
        }

    },

    /**
     * URL Was selected from previous list
     * Sync the service type field as well
     * @private
     */
    _onURLSelected: function(combo, newval, oldval){
        var idx = combo.store.find("url",newval);
        if (idx >-1) {
            var record = combo.store.getAt(idx);
            this.serviceField.setValue(record.data.service);
        }
    },

    /**
     * @private 
     * add layer directly to map
     */
    _addServicePanel: function(url,service) {
        var cls;
        service = service.toLowerCase();
        switch(service) {
            case "wms":
                cls = HSLayers.OWS.WMS;
                break;
            case "wcs":
                cls = HSLayers.OWS.WCS;
                break;
            case "wfs":
                cls = HSLayers.OWS.WFS;
                break;
            case "sos":
                cls = "HSLayers.OWS.SOS";
                break;
        }
        if (this.ows) {
            this.remove(this.ows);
            this.ows.destroy();
            this.ows = undefined;
        }

        // SOS is Ext4
        if (cls != "HSLayers.OWS.SOS") {
            this.ows = new cls({
                url:url,
                height: this.getInnerHeight(),
                map:this.map
            });
            this.add(this.ows);
            this.doLayout();
        }
        else if (window.Ext4) {
            this.ows = Ext4.create("HSLayers.OWS.SOS",{
                url:url,
                renderTo: this.body.dom.id,
                width: this.getSize().width,
                height: this.getInnerHeight(),
                map:this.map
            });
        }


        this.ows.connect(url);

        //add it to the store, if it was not there yet
        if (this.urlTextField.store.find("url",url) == -1) {
            this.urlTextField.store.add(new Ext.data.Record({url:url,service:this.serviceField.getValue()}));
        }
    },

    /**
     * @private 
     * add layer directly to map
     */
    _addNonOWSLayer: function(url,service,name) {
        switch(service) {
            case "kml":
                var layer = new OpenLayers.Layer.Vector(name || "KML", {
                                        strategies: [new OpenLayers.Strategy.Fixed()],
                                        protocol: new OpenLayers.Protocol.HTTP({
                                            url: url,
                                            format: new OpenLayers.Format.KML({
                                                internalProjection: this.map.projection,
                                                extractStyles: true, 
                                                extractAttributes: true,
                                                maxDepth: 2
                                            })
                                        }),
                                        removable: true});

                this.map.addLayer(layer);
                break;
            case "gml":
                this.map.addLayer(new OpenLayers.Layer.Vector(name, {
                                        strategies: [new OpenLayers.Strategy.Fixed()],
                                        protocol: new OpenLayers.Protocol.HTTP({
                                            url: url,
                                            format: new OpenLayers.Format.GML({
                                                internalProjection: this.map.projection,
                                                extractAttributes: true
                                            })
                                        }),
                                        removable: true
                                    })
                        );
                break;
            case "georss":
                this.map.addLayer(new OpenLayers.Layer.GML(name, url,
                                            {format: OpenLayers.Format.GeoRSS,
                                             projection: new OpenLayers.Projection("epsg:4326"),
                                            removable: true})
                                );
                break;
            case "geojson":
                this.map.addLayer(new OpenLayers.Layer.Vector(name, {
                                            strategies: [new OpenLayers.Strategy.Fixed()],
                                            protocol: new OpenLayers.Protocol.HTTP({
                                                url: url,
                                                format: new OpenLayers.Format.GeoJSON({
                                                    externalProjection: new OpenLayers.Projection("epsg:4326"),
                                                    internalProjection: this.map.projection,
                                                    extractAttributes: true
                                                })
                                            }),
                                            removable: true
                                        })
                                );
                break;
        }
    },

    /**
     * Set the #map object
     *
     * @function
     * @name HSLayers.Printer.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     * @returns None
     */
    setMap: function(map) {
        this.map = map;
    }
});

/**
 * Base class for WMS, WFS, WPS and other W*S parsers
 *
 * @class HSLayers.OWS
 * @augments <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
 *
 * @constructor
 * @param {Object} config
 */
HSLayers.OWS = function(config){

    config = config || {};

    if (config.map) {
        this.setMap(config.map);
    }

    HSLayers.OWS.superclass.constructor.call(this, config);

    this.nodes = [];
    this.on("undocked",this.createCapsPanel,this);
    this.on("docked",this.createCapsPanel,this);

};

Ext.extend(HSLayers.OWS, Ext.TabPanel, {

    /**
     * Mask object
     * @name HSLayers.OWS.mask
     * @private
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Mask</a>
     */
    mask: null,
    
    /**
     * OWS namespace
     * @name HSLayers.OWSPanel.owsns
     * @type String
     */
    owsns: "http://www.opengis.net/ows",

    /**
     * xlink namespace
     * @name HSLayers.OWSPanel.xlinkns
     * @type String
     */
    xlinkns: "http://www.w3.org/1999/xlink",

    /**
     * Panel with capabilities
     * @name HSLayers.OWS.capsPanel
     * @private
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel">Ext.Panel</a>
     */
    capsPanel: null,

    /**
     * Scope for #onLayerAdded method
     * @name HSLayers.OWS.scope
     * @type object
     */
    scope: this,

    /**
     * Tree panel for list services
     * @name HSLayers.OWS.treePanel
     * @private
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreePanel">Ext.tree.TreePanel</a>
     */
    treePanel: null,

    /**
     * @name HSLayers.OWS.propForm
     * @private
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreePanel">Ext.form.FormPanel</a>
     */
    propForm: null,

    /**
     * Root node for services
     * @name HSLayers.OWS.servicesRoot
     * @private
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a>
     */
    servicesRoot: null,

    /**
     * Button with "To Map" text on it
     * @name HSLayers.OWS.toMapButton
     * @private
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Button">Ext.Button</a>
     */
    toMapButton: null,

    /**
     * Icon to be displayed in services tree
     * @name HSLayers.OWS.serviceIcon
     * @type string
     */
    serviceIcon: null,
   
    /**
     * Title for this manager
     * @name HSLayers.OWS.managerTitle
     * @type string
     */
    managerTitle: null,

    /**
     * Service type (WMS, WFS)
     * @name HSLayers.OWS.service
     * @type string
     */
    service: null,

    /**
     * Property: toolTips
     * @name HSLayers.OWS.toolTips
     * @ype string=[] toolTips Object
     */
    toolTips: [],

    /**
     * List of Services (Layers for WMS or WFS, Process for WPS ...)
     * @name HSLayers.OWS.services
     * @type object=[]
     */
    services: null,

    /**
     * List of nodes
     * @private
     * @name HSLayers.OWS.nodes
     * @type object=[]
     */
    nodes: [],

    /**
     * URL of the OWS service
     * @name HSLayers.OWS.owsUrl
     * @type string
     */
    owsUrl : null,

    /**
     * list of supported projections
     * @name HSLayers.OWS.projections
     * @type array of string
     */
    projections : [],

    /**
     * The map  object
     * use the {setMap} method for setting this attribute
     * @name HSLayers.OWS.map
     * @property {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    map: null,

    /**
     * List of available services/layers/whatever offer by the server
     * @name HSLayers.OWS.servicesList
     * @private
     * @type object
     */
    servicesList: {},

    /**
     * Title of this webservice
     * @name HSLayers.OWS.title
     * @type string
     */
    title : null,

    /**
     * Description of this webservice
     * @name HSLayers.OWS.description
     * @type string
     */
    description : null,

    /**
     * Version of this webservice
     * @name HSLayers.OWS.version
     * @type string
     */
    version : null,

    /**
     * Default projection, supported by posssibly all wms serveres
     * @default "epsg:4326"
     * @name HSLayers.OWS.defaultProjection
     * @type string
     */
    defaultProjection: "epsg:4326",

    //width: 750,
    //height: 350,

    /**
     * Called, when the button is clicked. Cleans the input URL and call
     * #getCapabilities
     * @name HSLayers.OWS.connect
     * @function
     */
    connect : function(url) {

        url = url.replace(/^\s+|\s+$/g, '');

        /* url was not set */
        if (!url || url == "http://") {
            // FIXME
            return;
        }
        
        /* http at the begin */
        if (url.search("http://") != 0 &&
            url.search("https://") != 0) {
            url = "http://"+url;
        }

        // clean url parameters
        var urlParams = OpenLayers.Util.getParameters(url);
        for (var param in urlParams) {
            if (param.toLowerCase() == "service") {
                urlParams[param] = undefined;
            }
            if (param.toLowerCase() == "request") {
                urlParams[param] = undefined;
            }
        }

        url =  OpenLayers.Util.removeTail(url);
        url = OpenLayers.Util.urlAppend(url, 
                OpenLayers.Util.getParameterString(urlParams));

        this.owsUrl = url;
        this.getCapabilities();
    },

    /**
     * Formulate GetCapabilities URL and run Ajax request.
     * @name HSLayers.OWS.getCapabilities
     * @function
     */
    getCapabilities : function() {
        var url = this.owsUrl;

        var retFunction = function(resp) {
            if (resp.status == 200) {
                try {

                    if (!resp.responseXML) {
                        var paramString = OpenLayers.Util.getParameterString({service:"WMS",request:"GetCapabilities"});
                        var separator = (url.indexOf('?') > -1) ? '&' : '?';
                        url += separator + paramString;

                        Ext.MessageBox.show({
                                title: OpenLayers.i18n("OWS Request problem"),
                                msg: OpenLayers.i18n("There was an error while opening the OWS GetCapabilities request")+": <br />\n"+
                                    "<a href=\""+url+"\" target=\"_blank\">"+url+"</a>",
                                buttons: Ext.MessageBox.OK,
                                icon: Ext.MessageBox.ERROR
                        });
                        this.body.update();
                        this.mask.hide();
                    }
                    else {
                        this.onCapabilitiesArrived(resp.responseXML);
                    }
                }
                catch(e) {
                    if(window.console && window.console.log) {
                        console.log(e);
                    }
                }
            }
        };

        var capabilitiesFailed = function(resp) {
            alert(OpenLayers.i18n("Given URL failed")+". \n" + resp.responseText);
            
            this.mask.hide();
        };

        try {
        if (!this.mask) {
            this.mask = new Ext.LoadMask(this.body);
        }
        this.mask.show();
        }catch(e){}

/*
        OpenLayers.Request.GET({
            url: url,
            params: {request:"GetCapabilities",service:this.service},
            success: retFunction,
            scope: this,
            failure: capabilitiesFailed
        });
*/

        this.requestGetCapabilities(url,retFunction,capabilitiesFailed);
    },

    /**
     * What is called, when getCapabilities response arrived
     * @name HSLayers.OWS.onCapabilitiesArrived
     * @param {XMLDOM} data http ajax response in text form
     * @function
     */
    onCapabilitiesArrived: function(data) {

        this.parseCapabilities(data);


        if (this.mask) {
            this.mask.hide();
        }

        /* clear the properties */
        if (this.capsPanel) {
            this.remove(this.capsPanel);
            this.capsPanel.destroy();
            this.capsPanel = null;
            this.body.update("");
            this.nodes = [];
        }


        this.fillPropertiesForm();
        this.makeServicesTree();
        this.fillMetadataPanel();

        this.doLayout();
        this.fireEvent("capabilitiesparsed");

        //if (!Ext.isIE && this.serviceAbstract.getSize().height > 100) {
        //    this.serviceAbstract.setHeight(100);
        //}
        //

        //this.makeToolTips();

    },

    /**
     * To be adjusted by different OWS Managers
     * @function
     * @name HSLayers.OWS.parseCapabilities
     * @param {String} text text to be parsed
     */
    parseCapabilities: function(text) {
        return;
    },

    /**
     * Clear comments and other stuff from returned capabilities response
     * @name HSLayers.OWS.clearXMLText
     * @param {String} text input XML as text
     * @returns {String} cleared XML in text form (not DOM)
     * @function
     */
    /*
    clearXMLText: function(text) {
        //text = text.replace(/\n/g,"");
        if (Ext.isIE) {
            text = text.replace(/<!DOCTYPE .[^>]*>/, '');//skip DOCTYPE
            text = text.replace(/\]>/g,"");
        }
        text = text.replace(/<!--.*?-->/g, ''); //Helped with ESA server
        text = text.replace(/\[.<!.*?>.\]/g, ''); //Helped with ESA server
        text = text.replace(/<GetTileService>.*?GetTileService>/g, '');//skip NASA DTD error
        return text;
    },
    */

    /**
     * Create properties form, different for each service, empty. 
     * @name HSLayers.OWS.makePropertiesForm
     * @function
     */
    makePropertiesForm: function() {
        return;
    },

    /**
     * Render the tree of services (layers, features)
     * @name HSLayers.OWS.makeTreePanel
     * @function
     */
    makeTreePanel: function() {
        this.checkAllButton = new Ext.Button({text:OpenLayers.i18n("All"),
                        scope: this,handler: this.onCheckAllButtonClicked,disabled:false//,
                        //icon: OpenLayers.Util.getImagesLocation()+"/showmap.gif",
                        //ctCls:"x-btn-text x-btn-text-icon"
                });

        this.toMapButton = new Ext.Button({text:OpenLayers.i18n("To map"),
                        scope: this,handler: this.onToMapClicked,disabled:false,
                        icon: OpenLayers.Util.getImagesLocation()+"/showmap.gif",
                        ctCls:"x-btn-text x-btn-text-icon"
                });

        /* panel for service list */
        this.treePanel = new Ext.tree.TreePanel({
            layout: 'fit',
            useArrows: true,
            autoScroll: true,
            region: this.ownerCt instanceof Ext.Window ? 'center' : "center",     
            split: true, // enable resizing
            bbar: [this.toMapButton, this.checkAllButton],
            rootVisible: false    
        }); 

        /* root for list of services */
        this.servicesRoot = new Ext.tree.TreeNode({
            draggable: false,
            allowChildren: true,
            leaf : false,
            expanded: true
        });

        this.treePanel.setRootNode(this.servicesRoot);

        return this.treePanel;
    },

    /**
     * Make tree with services
     * @name HSLayers.OWS.makeServicesTree
     * @function
     */
    makeServicesTree: function() {

        var servicesTreeRoot = new Ext.tree.TreeNode({
                checked: (this.services.name == undefined ? undefined : false),
                draggable: false,
                allowChildren: true,
                icon: this.getServiceIcon(),
                leaf : false,
                singleClickExpand : true,
                text : this.services.title,
                serviceAttributes: this.services,
                expanded: true
            });
        this.nodes.push(servicesTreeRoot);
        try {
            this.makeServicesNodes(this.services, servicesTreeRoot,0);
        }catch(e){console.log(e)}


        this.servicesRoot.appendChild(servicesTreeRoot);
    },

    /**
     * Return URL with icon for service
     * @name HSLayers.OWS.getServiceIcon
     * @function
     * @returns {String} url with icon
     */
    getServiceIcon: function() {
        var iconUrl = OpenLayers.Util.getImagesLocation()+"/"+this.serviceIcon;
    },

    /**
     * Create the node for particular service (layer,feature,process, ...)
     * @name HSLayers.OWS.makeServicesNodes
     * @function
     * @param {Object} service with "services" attribute, which is an {Array} of WMS layers or WFS features or WPS processes
     * @param {array} service.services 
     * @param <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a> parentNode
     */
    makeServicesNodes: function(service,parentNode) {

        for (var i = 0; i < service.services.length; i++) {

            var node  = new Ext.tree.TreeNode({
                    checked: (service.services[i].name == undefined ? undefined : false),
                    draggable: false,
                    allowChildren: true,
                    icon:this.getServiceIcon(),
                    leaf : false,
                    singleClickExpand : true,
                    text :  this.formatNodeText(service.services[i]),
                    expanded: true,
                    serviceAttributes: service.services[i]
                });

            this.toolTips.push({id:node.id,
                                title: service.services[i].title,
                                html: service.services[i].description});
            parentNode.appendChild(node);

            if (service.services[i].styles.length > 0) {
                var data = [];
                for (var j = 0; j < service.services[i].styles.length; j++) {
                    data.push([service.services[i].styles[j].name,
                               service.services[i].styles[j].title]);
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
            this.nodes.push(node);
            


            if (service.services[i].services.length > 0) {
                this.makeServicesNodes (service.services[i], node);
            }
        }
    },

    /**
     * Check all button clicked
     * @function
     * @name HSLayers.OWS.onCheckAllButtonClicked
     * @param {Ext.Button} b button
     * @param {Event} e event
     */
    onCheckAllButtonClicked: function(b,e) {
        if (b.getText() == OpenLayers.i18n("All")) {
            b.setText(OpenLayers.i18n("None"));
            var check = function(node) {
                if (node.childNodes.length === 0) {
                    node.getUI().toggleCheck(true);
                }
                return true;
            };
            this.servicesRoot.cascade(check,this);
        }
        else {
            b.setText(OpenLayers.i18n("All"));
            var uncheck = function(node) {
                if (node.childNodes.length === 0) {
                    node.getUI().toggleCheck(false);
                }
                return true;
            };
            this.servicesRoot.cascade(uncheck,this);
        }
        return;
    },

    /**
     * To Map button clicked handler
     * To be redefined by each service
     * @function
     * @name HSLayers.OWS.onToMapClicked
     */
    onToMapClicked: function() {
        return;
    },

    /**
     * Layer is in map, do something
     * To be used by application
     * @function
     * @name HSLayers.OWS.onLayerAdded
     */
    onLayerAdded: function(service) {
        return;
    },

    /**
     * After layer added the map
     * @function
     * @name HSLayers.OWS.onLayersAddedDone
     */
    onLayersAddedDone: function() {
        return;
    },

    /**
     * Return HTML formated string for the specified
     * layer/featue/process/coverage
     * To be redefined by each service
     * @function
     * @name HSLayers.OWS.formatNodeText
     * @param {object} service 
     * @returns {string} title
     */
    formatNodeText: function(service) {
        return service.title;
    },

    /**
     * Append tool tips to each service (e.g. wms layer) with abstract
     * information. At the end, <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.QuickTips">Ext.QuickTips</a>.init is called
     * @function
     * @name HSLayers.OWS.makeToolTips
     */
    makeToolTips: function() {

        
        for (var i = 0; i < this.nodes.length;i++) {
            this.nodes[i].ui.anchor.id = this.nodes[i].id;
        }
        
        for (var i = 0; i < this.toolTips.length; i++) {
            var tip = this.toolTips[i];
            if (Ext.get(tip.id)) {
                new Ext.ToolTip({
                    target: tip.id,
                    title: tip.title,
                    trackMouse:true,
                    html: tip.html
                });
            }
        }

        Ext.QuickTips.init();
    },

    /**
     * Check, if the layers projections do match map projection
     * @name HSLayers.OWS.checkMapProjection
     * @function
     *
     * @param {array} layerPrjs strings of layer projections
     * @param {OpenLayers.Projection} mapPrj map projections
     * @returns {boolean} layer can be displayed, if True
     */
    checkMapProjection: function(layerPrjs,mapPrj) {
        this.projections = [];

        var retValue = false;

        for (var i = 0; i < layerPrjs.length; i++) {
            var proj = new OpenLayers.Projection(layerPrjs[i]);
            this.projections.push(proj.getCode().toLowerCase());
            if (mapPrj.equals(proj)) {
                retValue = true;
            }
        }

        return retValue;
    },


    /**
     * Clear comments and other stuff from returned capabilities response
     * @name HSLayers.OWS.clearXMLText
     * @param {String} text input XML as text
     * @returns {String} cleared XML in text form (not DOM)
     * @function
     */
    clearXMLText: function(text) {
        //text = text.replace(/\n/g,"");
        if (Ext.isIE) {
            text = text.replace(/<!DOCTYPE .[^\]\]>]*\]\]>/, '');//skip DOCTYPE
            //text = text.replace(/\]>/g,"");
        }
        text = text.replace(/<!--.[^\-\->]*?-->/g, ''); //Helped with ESA server
        text = text.replace(/<GetTileService>.*?GetTileService>/g, '');//skip NASA DTD error
        return text;
    },

    /**
     * Init component method of Ext.Panel, add the "clearPanel" event
     *
     * @name HSLayers.OWS.initComponent
     */
    initComponent : function(){

         var config = {};

         this.propForm = this.makePropertiesForm();
         this.treePanel = this.makeTreePanel();

         this.layersPanel = new Ext.Panel({
                title: OpenLayers.i18n("Layers"),
                layout: "border",
                items: [this.propForm, this.treePanel]
         });


         this.metadataPanel = new Ext.Panel({
             frame: false,
             autoScroll: true,
             bodyStyle: {
                 padding: 5
             },
             title: OpenLayers.i18n("Metadata"),
             html: ""
         });

        config.items = [this.layersPanel,this.metadataPanel];
        config.activeTab = 0;
        config.deferredRender = false;

         Ext.apply(this, Ext.apply(this.initialConfig, config)); 
         HSLayers.OWS.superclass.initComponent.apply(this, arguments);

         this.addEvents("capabilitiesparsed");
    },

    /**
     * @private
     */
    createCapsPanel: function() {

        if (this.capsPanel) {
            this.getCapabilities();
            return;
        }

        var items = [this.propForm,this.treePanel];
        
        if (this.ownerCt instanceof Ext.Window) {
            if (this.ownerCt.getWidth() < 600) {
                this.ownerCt.setWidth(780);
            }
        }

        this.capsPanel = new Ext.Panel({
            //layout:"border",
            layout:"fit",
            items: items
            });

        this.add(this.capsPanel);
        return this.capsPanel;

    },

    /**
     * parse time value
     */
    parseTimeValue: function(timestr) {
    },

    /**
     * get unique layer name
     *
     * @function
     * @name HSLayers.OWS.getUniqueLayerName
     * @param {String} ln
     * @returns {String}
     */
   getUniqueLayerName: function(ln) {
       var layers = this.map.getLayersBy("name",ln);

       if (layers && layers.length > 0) {
           var nr = parseInt(ln.replace(/^.* \([0-9].*\)$/,"$1"));
           if (nr) {
               return this.getUniqueLayerName(ln+" "+String(nr+1));
           } 
           else {
               return this.getUniqueLayerName(ln+" 1");
           }
       }
       else {
           return ln;
       }
    },

    /**
     * Set {@link HSLayers.OWS.map} object
     *
     * @function
     * @name HSLayers.OWS.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     * @returns {None}
     */
   setMap: function(map) {
        this.map = map;
    },

    CLASS_NAME: "HSLayers.OWS"

});

HSLayers.OWS._Projections = {};

HSLayers.OWS.proxy4ows = "/cgi-bin/proxy4ows.cgi";

