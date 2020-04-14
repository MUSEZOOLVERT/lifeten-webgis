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
Ext.namespace("HSLayers.MapPanel");

/**
 * MapPanel with div for OpenLayers.Map object. You can initialize the Map
 * object later using  MapPanel.body.dom.id for it's initialization.
 *
 * @class HSLayers.MapPanel
 * @augments `Ext.Panel <http://www.extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 *
 * @constructor
 * @param {Object} config configuration object of the panel
 * @param {String[]} config.components ["permalink","searchfield","wmc","history"] array of panel visible components. 
 * @example 
 * var mapPanel = new HSLayers.MapPanel();
 * var map = new OpenLayers.Map(mapPanel.body.dom);
 * mapPanel.setMap(map);
 */
HSLayers.MapPanel= function(config) {

    if (!config) {
        config = {};
    }
    
    if (config.components) {
        this.components = config.components;
    }

    if (!config.items) {
        if (this.components.indexOf("permalink") > -1) {
            // permalink panel
            this.permalinkContainer = new Ext.Container();
        }

        if (this.components.indexOf("searchfield") > -1) {

            // search field
            this.searchField = new Ext.form.TriggerField({
                width: 200,
                emptyText: OpenLayers.i18n("Type city or place"),
                triggerClass:'x-form-search-trigger'

            });

            this.scope = config.scope ? config.scope : this;
            this.scope._onTriggerClick = config.onSearch ? config.onSearch : this.onSearch;
            this.searchField.on('specialkey', function(f, e){
                    if(e.getKey() == e.ENTER){
                    this._onTriggerClick(f); }
                }, this.scope);

        }

    }

    this.projectionSwitcherContainer = new Ext.Container();
    this.scaleSwitcherContainer = new Ext.Container();
    this.scaleLineContainer = new Ext.Container();
    this.attributionContainer = new Ext.Container();
    this.positionContainer = new Ext.Container();
    this.infoContainer = new Ext.Container();

    // tbar
    if (!config.tbar) {
        config.tbar = [];
        this.historyPreviousButton ? config.tbar.push(this.historyPreviousButton) : 1;
        this.historyNextButton ? config.tbar.push(this.historyNextButton) : 1;
        config.tbar.push(new Ext.Toolbar.Fill());
        this.projectionSwitcherContainer ? config.tbar.push(this.projectionSwitcherContainer) : 1;
        config.tbar.push(new Ext.Toolbar.Separator());
        this.scaleSwitcherContainer ? config.tbar.push(this.scaleSwitcherContainer) : 1;
        config.tbar.push(new Ext.Toolbar.Separator());
        this.permalinkContainer ? config.tbar.push(this.permalinkContainer) : 1;
        this.searchField ? config.tbar.push(this.searchField) : 1;
    }

    // bbar
    if (!config.bbar) {
        config.bbar = [];
        config.bbar.push(this.scaleLineContainer);
        config.bbar.push(new Ext.Toolbar.Separator());
        config.bbar.push(this.attributionContainer);
        config.bbar.push(new Ext.Toolbar.Fill());
        config.bbar.push(new Ext.Toolbar.Separator());
        config.bbar.push(this.infoContainer);
        config.bbar.push(new Ext.Toolbar.Separator());
        config.bbar.push(this.positionContainer);
    }

    //this.permalinkPanel.hide();
    //this.searchField.hide();
    
    // call parent constructor
    HSLayers.MapPanel.superclass.constructor.call(this, config);


    // initialization of properties
    // ... nothing yet
    //

};

Ext.extend(HSLayers.MapPanel, Ext.Panel, {
     
    /**
     * Container for later placement of :js:class:`HSLayers.Permalink`
     * @name HSLayers.MapPanel.permalinkContainer
     * @type `Ext.Container <http://www.extjs.com/deploy/dev/docs/?class=Ext.Container>`_ 
     */
    permalinkContainer : null,

    /**
     * Compoments, which should be available, when the MapPanel starts.
     * Possible values: `permalink,searchfield,wmc,history`
     *
     * @name HSLayers.MapPanel.components
     * @type {String[]} 
     * @default ["permalink"]
     */
    components: ["permalink"],

    /**
     * Field for searching (usually cities)
     * @name HSLayers.MapPanel.searchField
     * @type `Ext.form.TriggerField <http://www.extjs.com/deploy/dev/docs/?class=Ext.form.TriggerField>`_
     */
    searchField : null,

    /**
     * Scope of the searchField
     * @name HSLayers.MapPanel.scope
     * @type {Object}
     * @default this object
     */
    scope : null,

    /**
     * Container, where later the :js:class:`HSLayers.Control.ProjectionSwitcher`
     * class can be stored.
     * @name HSLayers.MapPanel.projectionSwitcherContainer
     * @type `Ext.Container <http://www.extjs.com/deploy/dev/docs/?class=Ext.Container>`_ 
     */
    projectionSwitcherContainer : null,

    /**
     * Container, where later the :js:class:`HSLayers.Control.ScaleSwitcher`
     * class can be stored.
     * @name HSLayers.MapPanel.scaleSwitcherContainer
     * @type `Ext.Container <http://www.extjs.com/deploy/dev/docs/?class=Ext.Container>`_ 
     */
    scaleSwitcherContainer : null,

    /**
     * Container, where later the `OpenLayers.Control.MousePosition <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/MousePosition-js.html>`_
     * class can be stored.
     * @name HSLayers.MapPanel.scaleSwitcherContainer
     * @type `Ext.Container <http://www.extjs.com/deploy/dev/docs/?class=Ext.Container>`_ 
     */
    positionContainer : null,

    /**
     * Container, where some info you need to display
     * @name HSLayers.MapPanel.infoContainer
     * @type `Ext.Container <http://www.extjs.com/deploy/dev/docs/?class=Ext.Container>`_ 
     */
    infoContainer : null,

    /**
     * Container, where later the `Open.Control.ScaleLine <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/ScaleLine-js.html>`_
     * class can be stored.
     * @name HSLayers.MapPanel.scaleLineContainer
     * @type `Ext.Container <http://www.extjs.com/deploy/dev/docs/?class=Ext.Container>`_ 
     */
    scaleLineContainer : null,

    /**
     * Container, where later the :js:class:`HSLayers.Control.Attribution`
     * class can be stored.
     * @name HSLayers.MapPanel.attributionContainer
     * @type `Ext.Container <http://www.extjs.com/deploy/dev/docs/?class=Ext.Container>`_ 
     */
    attributionContainer : null,

    /**
     * The map  object
     * use the :js:func:`HSLayers.MapPanel.setMap` method for setting this attribute
     * @name HSLayers.MapPanel.map
     * @type `OpenLayers.Map <http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html>`_ 
     */
    map : null,

    /**
     * Set `map <http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html>`_
     * :js:attr:`HSLayers.MapPanel.map` property
     *
     * @function
     * @name HSLayers.MapPanel.setMap
     * @param OpenLayers.Map map http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html
     */
    setMap: function(map) {
        if (this.rendered) {
            map.render(this.body.dom);
        }
        else {
            this.on("afterrender",function() {
                this.map.render(this.body.dom);
            },this);
        }
        this.map = map;
    },

    /**
     * Handler for the click event, triggered when the user clicks the
     * trigger button or hits ENTER key with focus on the search field
     * This method should be redefined for each application.
     *
     * @function
     * @param Ext.form.Field field http://www.extjs.com/deploy/dev/docs/?class=Ext.form.Field
     */
    onSearch: function(field) {
        OpenLayers.Console.log("onSearch method called. The value is "+field.getValue());
    }

});
