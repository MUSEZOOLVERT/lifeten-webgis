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
Ext.namespace("HSLayers.InfoPanel");


/**
 * InfoPanel is special panel with Clear button, to which you can bound
 * some action. 
 *
 * @class HSLayers.InfoPanel
 * @augments Ext.Panel
 *
 * @constructor
 * @param {Object} config
 * @param {String} [config.scope] scope for the clear button event
 * @example 
 * var infoPanel = new HSLayers.InfoPanel({
 *              html: "Some text",
 *              renderTo: Ext.get("info")
 *      });
 *      var map = new OpenLayers.Map(mapPanel.body.dom.id);
 *      infoPanel.on("clearPanel",someFunction);
 *      var someFunction = function(){
 *          alert ("clear clicked");
 *      }
 */
HSLayers.InfoPanel = function(config) {

    config = config ? config : {};

    config.title =  (config.title ? config.title : OpenLayers.i18n("Info"));

    this.clearButton = new Ext.Button({
                    text: OpenLayers.i18n("Clear"),
                    icon: OpenLayers.Util.getImagesLocation()+'/empty.gif',
                    cls: 'x-btn-text-icon',
                    scope: config.scope ? config.scope : this,
                    handler: this.clearWithEvent
                });

    config.bbar = [this.clearButton];
    config.autoScroll = true;

    //
    HSLayers.InfoPanel.superclass.constructor.call(this, config);

};

Ext.extend(HSLayers.InfoPanel, Ext.Panel, {
    /**
     * Fired, when the panel is cleared
     * @name HSLayers.InfoPanel.clearPanel
     * @event
     */

    /**
     * Clear button
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Button">Ext.Button</a>
     * @name HSLayers.InfoPanel.clearButton
     */
    clearButton: null,

    /**
     * Mask
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Mask">Ext.Mask</a>
     * @name HSLayers.InfoPanel.mask
     */
    mask: null,

    /**
     * Deprecated, use HSLayers.InfoPanel.clear instead
     * @function
     * @name HSLayers.InfoPanel.clearPanel
     */
    clearPanel: function() {
        if (window.console) {
            console.info("HSLayers.InfoPanel.clearPanel() is deprecated. Use HSLayers.InfoPanel.clear() instead");
        }
        this.clear.apply(this,arguments);
    },

    /**
     * Clear this panel and fire clearPanel event 
     * @function
     * @name HSLayers.InfoPanel.clearWithEvent
     */
    clearWithEvent: function() {
        this.clear.apply(this,arguments);
        this.fireEvent("clearPanel");
    },

    /**
     * Clear this panel and do not fire event
     * @function
     * @name HSLayers.InfoPanel.clear
     */
    clear: function() {
        this.removeAll(false);
        this.update("");
        this.doLayout();
    },

    /**
     * Turn the Mask on
     * @function
     * @name HSLayers.InfoPanel.maskOn
     */
    maskOn: function() {
        if (!this.mask) {
            this.mask = new Ext.LoadMask(this.body.dom);
        }
        this.mask.show();
    },

    /**
     * Turn the Mask off
     * @function
     * @name HSLayers.InfoPanel.maskOff
     */
    maskOff: function() {
        if (this.mask) {
            this.mask.hide();
        }
    },

    /**
     * Init component method of Ext.Panel, add the "clearPanel" event
     *
     * @name HSLayers.InfoPanel.initComponent
     */
    initComponent : function(){

        var config = {};
        config.closable = false;

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.InfoPanel.superclass.initComponent.apply(this, arguments);

        this.addEvents("clearPanel");
    }
    
});
