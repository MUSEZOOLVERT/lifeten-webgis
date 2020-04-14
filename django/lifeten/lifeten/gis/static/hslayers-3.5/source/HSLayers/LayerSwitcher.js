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

/**
 * Advanced LayerSwitcher
 *
 * @augments Ext.Panel
 * @class HSLayers.LayerSwitcher
 */

HSLayers.LayerSwitcher = Ext.extend(Ext.TabPanel,{
    /**
     * @name HSLayers.LayerSwitcher.title
     * @type {String}
     */
    title: "Layers",

    /**
     * @name HSLayers.LayerSwitcher.logicalPanel
     * @type Ext.tree.Panel
     */
    logicalPanel: undefined,

    /**
     * @name HSLayers.LayerSwitcher.physicalPanel
     * @type Ext.tree.Panel
     */
    physicalPanel: undefined,

    /**
     * @name HSLayers.LayerSwitcher.map
     * @type OpenLayers.Map
     */
    map: undefined,

    /**
     * initialize this component
     * @name HSLayers.LayerSwitcher.initComponent
     * @function
     */
    initComponent: function() {
        
        this.logicalPanel = new HSLayers.LayerSwitcher.LogicalPanel();
        this.physicalPanel = new HSLayers.LayerSwitcher.PhysicalPanel();
 
        Ext.apply(this, {
            activeTab: 0,
            title: OpenLayers.i18n(this.title),
            bodyBorder: false,
            border: false,
            header: true,
            //closable: false,
            tabPosition: "bottom",
            deferredRender: false,
            items: [
                this.logicalPanel,
                this.physicalPanel
            ]
        });


        HSLayers.LayerSwitcher.superclass.initComponent.apply(this, arguments);

        this.addEvents("getcapabilitiesclicked");

    },

    /**
     * setMap
     * @function
     * @name HSLayers.LayerSwitcher.setMap
     */
    setMap: function(map) {
        this.map = map;

        this.map.events.register("addlayer",this,this._onLayerAdd);
        this.map.events.register("removelayer",this,this._onLayerRemoved);
        this.map.events.register("changelayer",this,this._onLayerChanged);

        for (var i = 0, len = this.items.getCount(); i < len; i++) {
            this.items.get(i).setMap(map);
        }

        var layers = this.map.getLayersBy("displayInLayerSwitcher",true);
        for(len = layers.length, i = len-1 ; i > -1 ;  i--)  {
            this._onLayerAdd({layer:layers[i]});
        }
    },

    /**
     * @function
     * @name HSLayers.LayerSwitcher.destroy
     */
    destroy: function() {

        this.map.events.unregister("addlayer",this,this._onLayerAdd);
        this.map.events.unregister("removelayer",this,this._onLayerRemoved);
        this.map.events.unregister("changelayer",this,this._onLayerChanged);

        HSLayers.LayerSwitcher.superclass.destroy.apply(this, arguments);
    },

    /**
     * Called, when new layer was added to the map
     * 
     * @private
     * @function
     */ 
    _onLayerAdd: function(e) {
        var layer = e.layer;

        if (layer.displayInLayerSwitcher !== true) {
            return;
        }

        // set title
        layer.title = layer.title || layer.name;

        // create logical and physical nodes
        var logicalClass = (HSLayers.Layer.TreeLayer && layer instanceof HSLayers.Layer.TreeLayer ? HSLayers.LayerSwitcher.TreeLayerNode : HSLayers.LayerSwitcher.LayerNode);
        var lNode = new logicalClass({
            layer: layer
        });
        var pNode = new HSLayers.LayerSwitcher.LayerNode({
            layer: layer
        });

        // appendChilds
        this.physicalPanel.getRootNode().appendChild(pNode);
        var pathNode = this.logicalPanel.getNodeForPath(layer.path);
        pathNode.insertBefore(lNode,pathNode.firstChild);

    },

    /**
     * Called, when new layer was removed from the map
     * 
     * @private
     * @function
     */ 
    _onLayerRemoved: function(e) {
        if (e.layer.displayInLayerSwitcher !== true) {
            return;
        }
        var pNode = this.physicalPanel.getRootNode().findChild("layer",e.layer);
        var lNode = this.logicalPanel.getRootNode().findChild("layer",e.layer,true);
        if (pNode) {
            pNode.removeAll();
            pNode.parentNode.removeChild(pNode);
        }
        if (lNode) {
            pNode.removeAll();
            lNode.parentNode.removeChild(lNode);
        }
    },

    /**
     * Called, when new layer was changed
     * 
     * @private
     * @function
     */ 
    _onLayerChanged: function(e) {
        //var layer = e.layer;
        if (e.property == "path") {
            this.logicalPanel.updatePath(e.layer);
        }
    },


    CLASS_NAME: "HSLayers.LayerSwitcher"
});
