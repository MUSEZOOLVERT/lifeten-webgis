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
 * Logical Panel of LayerSwitcher
 *
 * @augments Ext.Panel
 * @class HSLayers.LayerSwitcher.Panel
 */

HSLayers.LayerSwitcher.Panel = Ext.extend(Ext.tree.TreePanel, {

    /**
     * @name HSLayers.LayerSwitcher.Panel.map
     * @type OpenLayers.Map
     */
    map: undefined,

    /**
     * indicates, weather the legend should be displayed or not
     * @name HSLayers.LayerSwitcher.Panel.showLegend
     * @type Boolean
     */
    showLegend: false,

    /**
     * tree editor
     * @name HSLayers.LayerSwitcher.Panel.treeEditor
     * @type Ext.tree.TreeEditor
     */
    treeEditor: undefined,

    /**
     * initialize this component
     * @name HSLayers.LayerSwitcher.Panel.initComponent
     * @function
     */
    initComponent: function() {
        var bbar = [
                {text:OpenLayers.i18n("Filter")+":"},
                new Ext.form.TextField({
                    enableKeyEvents: true,
                    tooltip: OpenLayers.i18n("Add text to display only filtered layers"),
                    width: 100,
                    listeners:{
                        scope: this,
                        keyup: this._onFilterKeyPress
                    }
                }),
                {xtype: 'tbfill'},
                {
                    tooltip: OpenLayers.i18n("Hide all visible layers"),
                    scope:this,  
                    handler: this._onHideAllClicked,
                    cls: 'x-btn-icon',
                    icon: OpenLayers.Util.getImagesLocation()+'/hide.gif'
                },
                {
                    scope: this,
                    toggleHandler: this._onShowLegendToggled,
                    enableToggle: true,
                    tooltip: OpenLayers.i18n("Show legend for all visible layers"),
                    cls: "x-btn-icon",
                    icon: OpenLayers.Util.getImagesLocation()+"/legend.gif"
                },
                {
                    tooltip: OpenLayers.i18n("Remove layers added to the map"),
                    scope:this,  
                    handler: this._onClearLayersClicked,
                    cls: 'x-btn-icon',
                    icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
                }

            ];

        if (this.bbar && this.bbar.length) {
            this.bbar.map(function(item) {this.bbar.push(item);},{bbar: bbar});
        }
        else {
            this.bbar = bbar;
        }

        Ext.apply(this, {
            root: new HSLayers.LayerSwitcher.FolderNode({text:"rootnode"}),
            bbar: bbar,
            forceLayout: true,
            rootVisible: false,
            autoScroll: true,
            enableDD: true,
            useArrows: true,
            containerScroll: true,
            animate: true,
            // force selection model to *NEVER* select any node
            // this prevents treeEditor (defined later in this file) to
            // start editing, when second click on the node
            selModel: new Ext.tree.DefaultSelectionModel({
                onNodeClick: function() {}
            }),
            listeners: { 
                scope: this
            }
        });


        HSLayers.LayerSwitcher.Panel.superclass.initComponent.apply(this, arguments);

        // set the legend button to right position
        this.getBottomToolbar().get(3).toggle(this.showLegend);

        // set tree editor
        this.treeEditor = new Ext.tree.TreeEditor(this, {}, {
            cancelOnEsc: true,
            completeOnEnter: true,
            selectOnFocus: false,
            allowBlank: false,
            listeners: {
                complete: this._onTreeEditComplete,
                scope: this
            }
        });

        Ext.QuickTips.init();

    },

    /**
     * @function
     * @private
     */
    _onShowLegendToggled: function(button, state) {

        this.showLegend = state;
        this.getRootNode().cascade(
                function(state) {
                    if (state) {
                        if (this.layer && this.layer.getVisibility() && this.hasChildNodes() && this.layer.calculateInRange()) {
                            this.expand();
                        }
                    }
                    else {
                        if (this instanceof HSLayers.LayerSwitcher.LegendNode) {
                            this.parentNode.collapse();
                        }
                    }
                },undefined, [state]);
        

    },

    /**
     * @function
     * @private
     */
    _onHideAllClicked: function(button, state) {
        this.getRootNode()._onCheckChange(this.getRootNode(),this.getRootNode.checkState);
        //for (var i = 0, len = this.map.layers.length; i < len; i++) {
        //    if (this.map.layers[i].displayInLayerSwitcher) {
        //        this.map.layers[i].setVisibility(false);
        //    }
        //}

    },


    /**
     * @function
     * @private
     */
    _onClearLayersClicked: function() {
        var layers = this.map.getLayersBy("displayInLayerSwitcher",true);

        // remove all removable layers
        for (var i = 0, len = layers.length; i < len; i++) {
            if (layers[i].removable) {
                this.map.removeLayer(layers[i]);
            }
        }
    },

    /**
     * @function
     * @private
     */
    _onTreeEditComplete: function(editor, newtitle, oldtitle) {
        var layer = this.treeEditor.editNode.layer;
        if (layer) {
            // change title of the layer and trigger event
            layer.title = newtitle;
            layer.map.events.triggerEvent("changelayer", {
                layer: layer, property: "title"
            });
        }
    },

    /**
     * setMap
     * @function
     * @name HSLayers.LayerSwitcher.Panel.setMap
     */
    setMap: function(map) {
        this.map = map;
        this.map.events.register("changelayer",this,this._onLayerChanged);
    },

    /**
     * @function
     * @private
     * @name HSLayers.LayerSwitcher.destroy
     */
    destroy: function() {
        this.map.events.unregister("changelayer",this,this._onLayerChanged);
        HSLayers.LayerSwitcher.Panel.superclass.destroy.apply(this, arguments);
    },

    /**
     * @private
     * @function
     */
    _onLayerChanged: function(e) {
        // change title
        if (e && e.property == "title") {
            var node = this.getRootNode().findChild("layer",e.layer,true);
            if (node.text != e.layer.title) {
                node.setText(e.layer.title);
            }
        }
    },

    /**
     * @private
     * @function
     */
    _onFilterKeyPress: function(field, e){
        var regex = new RegExp(field.getValue(),"i");

        this.getRootNode().cascade(function(regex) {
            // filter layers
            if (this.layer) {
                var name = this.layer.title || this.layer.name;
                if (name.search(regex) > -1) {
                    this.getUI().show();
                    this.bubble(function() {
                        if (this instanceof(HSLayers.LayerSwitcher.FolderNode)) {
                            this.expand();
                        }
                    });
                }
                else {
                    this.getUI().hide();
                }
            }
            // filter folders
            else if (this instanceof(HSLayers.LayerSwitcher.FolderNode)){
                // pass
            }
        },undefined,[regex]);
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.Panel"
});
