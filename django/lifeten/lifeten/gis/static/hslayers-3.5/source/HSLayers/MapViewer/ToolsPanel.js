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
Ext.namespace("HSLayers.MapViewer.ToolsPanel");


/**
 * ToolsPanel is special panel, usually on the right side of the map,
 * where all the tools will be going to
 *
 * @class HSLayers.MapViewer.ToolsPanel
 * @augments Ext.Panel
 *
 * @constructor
 * @param {Object} config
 * @param {String} [config.scope] scope for the clear button event
 */
HSLayers.MapViewer.ToolsPanel = function(config) {
    HSLayers.MapViewer.ToolsPanel.superclass.constructor.call(this, config); 
};

Ext.extend(HSLayers.MapViewer.ToolsPanel, Ext.Panel, {

    /**
     * components stack
     * @type [Ext.Panel]
     * @name HSLayers.MapViewer.ToolsPanel.stack
     */
    stack:undefined,

    /**
     * last activated panel
     * @type ExtPanel
     * @name HSLayers.MapViewer.ToolsPanel.lastActive
     */
    lastActive:undefined,
    
    /**
     * @function
     * @private
     */
    initComponent: function() {
        this.stack = [];
        var config = {};

        config.layout = "accordion";
        config.layoutConfig  = {
            animate: false,
            autoWidth: false
        };

        config.listeners = {
            "beforeadd":this._onAddItem,
            "scope":this
            };

        config.listeners = {
            scope: this
        };

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.MapViewer.ToolsPanel.superclass.initComponent.apply(this, arguments);

    },

    /**
     * add
     * @function
     * @name HSLayers.MapViewer.ToolsPanel.add
     */
    add: function(p) {

        if (Ext.isArray(p)) {
            HSLayers.MapViewer.ToolsPanel.superclass.add.apply(this,[p]);
        }
        else {
            // insert component into component stack
            if (this.stack.indexOf(p) == -1) {
                this.stack.push(p);
                this.lastActive = p;
                this._registerPanelEvents(p);
                HSLayers.MapViewer.ToolsPanel.superclass.add.apply(this,[p]);
            }
            else {
                var idx = this._findComponentIndex(p);
                HSLayers.MapViewer.ToolsPanel.superclass.insert.apply(this,[idx,p]);
            }
            p.makeDockable();
        }
    },

    /**
     * insert
     * @function
     * @name HSLayers.MapViewer.ToolsPanel.insert
     */
    insert: function(idx,p) {

        if (Ext.isArray(p)) {
            HSLayers.MapViewer.ToolsPanel.superclass.insert.apply(this,arguments);
        }
        else {
            // insert component into component stack
            if (this.stack.indexOf(p) == -1) {
                this.lastActive = p;
                this.stack.splice(idx,0,p);
                this._registerPanelEvents(p);
            }
            HSLayers.MapViewer.ToolsPanel.superclass.insert.apply(this,arguments);
            p.makeDockable();
        }
    },

    /**
     * register events
     * @public
     * @private
     */
    _registerPanelEvents: function(p) {
        p.on("destroy",this._onComponentDestroyed,this);
    },

    /**
     * @function
     * @private
     */
    _findComponentIndex: function(p,idx) {
        idx =  idx || 0;
        var cidx = this.stack.indexOf(p);
        for (var i = 0; i < this.stack.length; i++) {
            var c = this.stack[i];
            var itemNr = this.items.findIndex("id",c.id);
            if (i == cidx) {
                break;
            }
            if (itemNr > -1) {
                idx = itemNr+1;
            }
        }

        return idx;
    },

    /**
     * component destroyed
     * @private
     * @function
     */
    _onComponentDestroyed: function(c) {
        var index = this.stack.indexOf(c);
        if (index > -1) {
            this.stack.splice(index,1);
        }
    },

    CLASS_NAME: "HSLayers.MapViewer.ToolsPanel"
});
