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

HSLayers.namespace("HSLayers.Control");

/**
 * Advanced layer switcher. <OpenLayers.Layer>s are grouped into "group"
 * object. This object behaves like layer and has some similar methods. 
 * 
 * New properties for each <OpenLayers.Layer>:
 * - *group* {String} name of the group of layers, which will have same checkbox
 * - *removable* {Boolean} is the layer removable from the map?
 * - *metadata* {Object} URL to metadata of the layer
 * - *legend* {Object} URL to layer legend. The returned object should be image with the legend - no text is expected.
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/LayerSwitcher-js.html">OpenLayers.Control.LayerSwitcher</a>
 *
 * @example
 *  var wmsLayer = new OpenLayers.Layer.WMS("WMS Layer","http://foo/bar/wms",
 *      {layers: 'layer1',format:"image/png"},
 *      {
 *          isBaseLayer: false,
 *          format: "image/png",
 *          displayInLayerSwitcher: true,
 *          visibility:true,
 *          buffer:0,
 *          transitionEffect:"resize",
 *          //
 *          // Aditional parameters:
 *          // ---------------------
 *          // The group name can be ommited (Layer.name will be used)
 *          // if the name is in "parent/child" form, resulting layers tree
 *          // will look like
 *          // - Parent
 *          //      |- Tree
 *          //
 *          group: "WMS Layer", 
 *          metadata: {href:"http://foo/bar/metadata/"},
 *          legend: {href:"http://foo/bar/legend/"},
 *          isBaseGroup: true,
 *          removable: true
 *      });
 *  map.addLayer(wmsLayer);
 *  //
 *  // if container omited, the layerswitcher will be displayed in separate
 *  // window
 *  // container can be: 
 *  // - {String} id of some <div></div>
 *  // - {Element} some html element
 *  // - {Extjs.Object}
 *  //
 *
 *  var ls = new HSLayers.Control.LayerSwitcher.MultiLayer({container: layersTab });
 *  map.addControl(ls);
 *
 */

HSLayers.Control.LayerSwitcher = 
  OpenLayers.Class(OpenLayers.Control, {

    /**
     * onChange for one layer means, that all other layer within group will
     * be changed as well
     * @name HSLayers.Control.LayerSwitcher.oneChangesAll
     */
    oneChangesAll: true,

    /**
     * EVENT_TYPES
     * @private
     * @name HSLayers.Control.LayerSwitcher.EVENT_TYPES
     */
    EVENT_TYPES: ["reset"],
          
    /**
     * List of groups in this map (layerswitcher) {@link HSLayers.Control.LayerSwitcherGroupNode}
     * @type Object
     * @name HSLayers.Control.LayerSwitcher.groups
     */
    groups: {},

    /**
     * Node for base layers
     * @name HSLayers.Control.LayerSwitcher.baseLayersNode
     */
    baseLayersNode: null,

    /**
     * Panel with the layers tree
     * @name HSLayers.Control.LayerSwitcher.treePanel
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreePanel">Ext.tree.TreePanel</a>
     */
    treePanel: null,

    /**
     * icon for each layer (group)
     * @default maplayer.png
     * @type String
     * @name HSLayers.Control.LayerSwitcher.layerIcon
     */
    layerIcon: "maplayer.png",

    /**
     * icon for each querable layer (group)
     * @default maplayer-queryable.png
     * @type String
     * @name HSLayers.Control.LayerSwitcher.layerInfoIcon
     */
    layerInfoIcon: "maplayer-queryable.png",

    /**
     * @default indicator.gif
     * @type String
     * @name HSLayers.Control.LayerSwitcher.layerLoadingIcon
     */
    layerLoadingIcon:"indicator.gif",

    /**
     * Layer switcher container. 
     * @name HSLayers.Control.LayerSwitcher.container
     * @type <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.Container">Ext.Container</a>|String|DOMElement
     *
     */
    container: null,

    /**
     * Show legend indicator
     * @name HSLayers.Control.LayerSwitcher.showLegend
     * @type {Boolean}
     *
     */
    showLegend: false,

    /**
     * @constructor
     * 
     * @name HSLayers.Control.LayerSwitcher
     * @param {Object} options
     */
    initialize : function(options) {
        this.groups = {};
        this._toolTips = [];
        
        this.EVENT_TYPES = HSLayers.Control.LayerSwitcher.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );
        
        OpenLayers.Control.prototype.initialize.apply(
            this, [options]); 
        
    },

    /**
     * does nothing
     * @name HSLayers.Control.LayerSwitcher.clear
     * @private
     * @function
     */
    clear: function() {

        return;
    },

    /**
     * Deactivates a control and it's associated handler if any.  The exact
     * effect of this depends on the control itself.
     * @function
     * @name HSLayers.Control.LayerSwitcher.deactivate
     * @returns {Boolean} true if the control was effectively deactivated
     * or false if the control was already inactive.
     */
    deactivate: function () {
        if (this.active) {
            if (this.handler) {
                this.handler.deactivate();
            }
            this.active = false;
            this.events.triggerEvent("deactivate");
            return true;
        }
        return false;
    },
           
    /**
     * unregister all layerswitcher events
     * @name HSLayers.Control.LayerSwitcher.destroy
     * @function
     */    
    destroy: function() {

        if (this.treePanel) {
            this.treePanel.destroy();
            this.treePanel = null;
        }

        OpenLayers.Event.stopObservingElement(this.div);

        if (this.map) {
            this.map.events.unregister("addlayer", this, this.onAddLayer);
            this.map.events.unregister("changelayer", this, this.onChangeLayer);
            this.map.events.unregister("removelayer", this, this.onRemoveLayer);
            this.map.events.unregister("changebaselayer", this, this.onChangeBaseLayer);
            this.map.events.unregister("moveend", this, this.onMoveEnd);
        }

        for (var i = 0; i < this.groups.length; i++) {
            this.events.unregister("loadstart", this.groups[i], this.groupLoadStart);
            this.events.unregister("loadend", this.groups[i], this.groupLoadEnd);
        }
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * Set {@link HSLayers.MapPanel.map} object
     *
     * @function
     * @name HSLayers.Control.LayerSwitcher.setMap
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Map-js.html">OpenLayers.Map</a>} map
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        this.map.events.on({
            "changelayer": this.redraw,
            scope: this
        });
    },

    /**
     * Register all events Init groups Init main treePanel
     * @name HSLayers.Control.LayerSwitcher.draw
     * @function
     * @returns {DOMElement} A reference to the DIV DOMElement containing
     * the switcher tabs.
     */  
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this);
        // just some empty div
        this.div = OpenLayers.Util.createDiv(this.id);

        this.initBaseNodes();
        this.initGroups();
        this.initPanel();

        this.map.events.register("addlayer", this, this.onAddLayer);
        this.map.events.register("changelayer", this, this.onChangeLayer);
        this.map.events.register("removelayer", this, this.onRemoveLayer);
        this.map.events.register("changebaselayer", this, this.onChangeBaseLayer);
        this.map.events.register("moveend", this, this.onMoveEnd);


        return this.div;
    },

    /**
     * empty, does nothing
     * @name HSLayers.Control.LayerSwitcher.redraw
     * @function
     */
    redraw: function() {
    },

    /**
     * Initializa groups again
     * @name HSLayers.Control.LayerSwitcher.onAddLayer
     * @function
     * @param {Event} e
     */
    onAddLayer: function(e) {
        this.initGroups();
    },

    /**
     * When something has changed with some layer in the map and it was not
     * caused by this layer switcher, the layerswitcher has to react (e.g.
     * uncheck some checkbox.
     * @name HSLayers.Control.LayerSwitcher.onChangeLayer
     * @param {Event} e
     * @function
     */
    onChangeLayer: function(e) {
        
        var allSame = false; /* all layers within groups do have same visibility status */
        var group = null;
        /* find the group */

        // visibility
        for (var i in this.groups) {
            for (var j = 0; j < this.groups[i].layers.length; j++) {
                if (e.layer == this.groups[i].layers[j]) {
                    group = this.groups[i];
                    // visibility
                    if (j > 0 && (this.groups[i].layers[j].getVisibility() == this.groups[i].layers[j-1].getVisibility())) {
                        allSame = true;
                    }

                }
            }
        }

        /* change all layers within group */
        if ((group && this.oneChangesAll) || (group && allSame)) {
            group.setVisibility(e.layer.getVisibility());
        }

        var sort = function(firstNode, secondNode) {
            var firstGroup = firstNode.attributes.group;
            var secondGroup = secondNode.attributes.group;
            if ((firstGroup && secondGroup) &&
                secondGroup.getIndex() > firstGroup.getIndex()) {

                return true;
            }
            else {
                return false;
            }
        };
        this.groupsRoot.sort(sort);
    },

    /**
     * Enable/disable Tree node of the group, when the map moved
     * @name HSLayers.Control.LayerSwitcher.onMoveEnd
     * @param {Event} e
     */
    onMoveEnd: function(e) {
        for (var i in this.groups) {
            var group = this.groups[i];
            this.toggleNodeDisabled(group.node, !group.calculateInRange());
       }
    },

    /**
     * Remove Tree node from the layer switcher
     * @name HSLayers.Control.LayerSwitcher.onRemoveLayer
     * @function
     * @param {Event} e
     */
    onRemoveLayer: function(e) {
        /* find group */
        var group = null;
        for (var i in this.groups) {
            for (var j = 0; j < this.groups[i].layers.length; j++) {
                if (this.groups[i].layers[j] == e.layer) {
                    group = this.groups[i];
                }
            }
        }

        /* remove layer from group */
        var layers = [];
        if (group) {
            group.layers.remove(e.layer);

            if (group.layers.length == 0) {
                group.ls.removeGroup(group);
            }
        }
    },

    /**
     * The layer group will be removed from the map.
     * @name HSLayers.Control.LayerSwitcher.onRemoveLayerClicked
     * @function
     * @param item
     */
    onRemoveLayerClicked: function(item) {
        Ext.MessageBox.confirm(OpenLayers.i18n("LayerSwitcher:Confirm"), OpenLayers.i18n("LayerSwitcher:Really remove?"), 
            function(yesno){
                if (yesno == "yes") {
                    item.group.ls.removeGroup(item.group);
                }
            }
        );
    },

    /**
     * Remove group
     * @name HSLayers.Control.LayerSwitcher.removeGroup
     * @function
     * @param {HSLayers.Control.LayerSwitcher.LayerGroup} group group to be removed
     */
    removeGroup: function(group) {
        var i;
        if (!group) {
            return;
        }
        var layers = [];
        for (i = 0; i < group.layers.length; i++) {
            layers.push(group.layers[i]);
        }
        group.layers = [];
        for (i = 0; i < layers.length; i++) {
            layers[i].group = undefined;
            if (layers[i].isBaseLayer && layers[i].getVisibility()) {
                layers[i].setVisibility(false);
            }
            else {
                this.map.removeLayer(layers[i]);
                layers[i].destroy();
            }
        }

        var parentNode = group.node.parentNode;
        parentNode.removeChild(group.node);
        if (parentNode.childNodes.length === 0) {
            parentNode.parentNode.removeChild(parentNode);
        }
        
        this.groups[group.name] = undefined;

        // clean groups object
        var groups = {};
        for (var g in this.groups) {
            if (this.groups[g]) {
                groups[g] = this.groups[g];
            }
        }
        this.groups = groups;
    },


    /**
     * Will create main tree panel
     * @name HSLayers.Control.LayerSwitcher.initPanel
     * @function
     */
    initPanel: function() {
        /* panel for layer list */

        this.showLegendButton = new Ext.Button({text:OpenLayers.i18n("Show legend"), 
                        ls:this,  
                        handler: this.onShowLegendClicked,
                        scope:this,
                        cls: 'x-btn-text-icon',
                        icon: OpenLayers.Util.getImagesLocation()+"/legend.gif"
                    });

        this.treePanel = new Ext.tree.TreePanel({
            layout: 'fit',
            ls: this,
            enableDD: true,
            useArrows: true,
            autoScroll: true,
            region: 'center',     
            cls: "olLayerSwitcher",
            rootVisible: false,
            root:this.groupsRoot,
            renderTo: (this.container.body ? null : this.container),
            //frame:true,
            bbar: [this.showLegendButton,
                    {text:OpenLayers.i18n("Remove layers"), 
                        tooltip: OpenLayers.i18n("Remove layers added to the map"),
                        scope:this,  
                        handler: this.onClearLayersClicked,
                        cls: 'x-btn-text-icon',
                        icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
                    }
            ]
            }); 
            

        this.treePanel.on("enddrag", this.onEndDrag);
        this.treePanel.on("startdrag", this.onStartDrag);
        this.treePanel.on("nodedragover", this.onNodeDragOver);

        if (this.container.body) {
            this.container.add(this.treePanel);
            this.container.doLayout();

            this.container.on("deactivate",function(){if(this.attributesWindow){this.attributesWindow.hide();}},this);
        }
    },

    /**
    * Will initialize root and base group nodes
    * @name HSLayers.Control.LayerSwitcher.initBaseNodes
    * @function
    */
    initBaseNodes: function() {

        this.groupsRoot = new Ext.tree.TreeNode({
                text: "Groups root",
                allowChildren: true,
                leaf : false,
                expanded: true,
                ls: this
            });

        this.baseLayersNode = new Ext.tree.TreeNode({
                text: OpenLayers.i18n("baseLayer"),
                draggable:false,
                expanded: true,
                allowDrop: false,
                ls: this
            });

        //this.groupsRoot.appendChild(this.baseLayersNode);
    },

    /**
    * Initializa this.groups objects and its nodes
    * @name HSLayers.Control.LayerSwitcher.initGroups
    * @function
    */
    initGroups: function() {

        /* root for list of layers */
        for (var i = 0; i <this.map.layers.length; i++) {
            var layer = this.map.layers[i];

            if (!layer.displayInLayerSwitcher) {
                continue;
            }
            /* find out, which group it is*/ 
            if (!layer.group) {
                layer.group = layer.name;
            }

            if (!this.groups[layer.group]) {
                this.groups[layer.group] = this.createGroup(layer.group);
            }

            this.groups[layer.group].addLayer(layer);

            var group = this.groups[layer.group];

            /* unregister, if already registered */
            layer.events.unregister("loadstart", group, this.groupLoadStart);
            layer.events.unregister("loadend", group, this.groupLoadEnd);
            layer.events.register("loadstart", group, this.groupLoadStart);
            layer.events.register("loadend", group, this.groupLoadEnd);

        }

        for (var i in this.groups) {

            /* move node, if group is base but node is normal */
            if (this.groups[i].node) {
                if (this.groups[i].isBaseGroup && this.groups[i].node.parentNode == this.groupsRoot) {
                    this.groupsRoot.removeChild(this.groups[i].node);
                    this.baseLayersNode.appendChild(this.groups[i].node);
                }

                if (!this.groups[i].isBaseGroup) {
                    this.groups[i].node.draggable = true;
                }
                // this.groups[i].calculateInRange() ? this.groups[i].node.enable() : this.groups[i].node.disable();
                this.toggleNodeDisabled(this.groups[i].node, !this.groups[i].calculateInRange());

                if (this.groups[i].queryable) {
                    this.groups[i].setIcon(this.layerInfoIcon);
                }

                this.groups[i].node.checked = this.groups[i].getVisibility();
                continue;
            }


            // push base layer node, if not appended yet
            if (this.groups[i].isBaseGroup && ! this.baseLayersNode.parentNode){
                this.groupsRoot.appendChild(this.baseLayersNode);
            }

            /* create node */
            var groupNames = this.groups[i].name;
            if (groupNames instanceof Array) {
                for (var j = 0; j < groupNames.length; j++) {
                    var name = groupNames[j];
                }
            } else {
                var name = groupNames;
            }

            var parentNode = null;
            if (this.groups[i].name.split("/").length > 1) {
                var name = this.groups[i].name.split("/");
                name = this.groups[i].name.replace("/"+name[name.length-1],"");
                thisParentNode = this.groups[i].isBaseGroup ? this.baseLayersNode : this.groupsRoot;
                parentNode = this.createTreeNode(name, thisParentNode);
            }

            this.createGroupNode(this.groups[i]);

            if (!parentNode) {
                parentNode = this.groups[i].isBaseGroup ? this.baseLayersNode : this.groupsRoot;
            }

            if (parentNode.childNodes.length) {
                parentNode.insertBefore(this.groups[i].node,parentNode.firstChild);
            }
            else {
                parentNode.appendChild(this.groups[i].node);
            }
            this._makeToolTip(this.groups[i]);
        }

    },

    /**
    * Create empty group with given name
    * @name HSLayers.Control.LayerSwitcher.createGroup
    * @function
    *
    * @param {String} name
    * @returns {OpenLayers.Control.LayerSwitcher.LayerGroup} group for this.groups object
    */
    createGroup: function(name) {
        var group = new HSLayers.Control.LayerSwitcher.LayerGroup(name, {
                icon: OpenLayers.Util.getImagesLocation()+this.layerIcon,
                ls: this
                });
        return group;
    },

    /**
    * Create tree node for given group
    * @name HSLayers.Control.LayerSwitcher.createGroupNode
    * @function
    * @param {HSLayers.Control.LayerSwitcher.LayerGroup} group
    * @returns <a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.etree.TreeNode">Ext.tree.TreeNode</a> for given group
    */
    createGroupNode: function(group) {

        var text = group.name.split("/");
        text = text[text.length-1];

        group.node =  new Ext.tree.TreeNode({
                uiProvider: HSLayers.Control.LayerSwitcher.TreeNodeUI,
                checked: group.getVisibility(),
                allowDrag: true,
                draggable: !group.isBaseGroup,
                cls:"LayerSwitcherGroupNode "+ (group.calculateInRange() ? "" : "disabledNode"),
                allowChildren: true,
                expandable : (group.legendURLs.length ? true : false),
                leaf : true,
                text : text,
                icon: (group.hideIcon ? undefined : group.icon),
                expanded: (this.showLegend && group.legendURLs.length > 0),
                group: group,
                myNodeType: "group",
                ls: this
            });


        group.node.on("click",this.onRightClick,this);
        group.node.on("contextmenu",this.onRightClick,this);
        group.node.on("checkchange",this.onCheckboxChange);

        //this.createAttributesForm(group);
        this.createLegendNodes(group);


        return ;
    },

    /**
    * Create form with attributes of the layer for settings
    * @name HSLayers.Control.LayerSwitcher.createAttributesForm
    * @param {HSLayers.Control.LayerSwitcher.LayerGroup} group
    */
    createAttributesForm: function(group) {

        var sld = new Ext.form.TextField({
                    fieldLabel: "SLD",
                    style: {width: "100px"},
                    value: (group.sld ? group.sld : '')
                });

        sld.on("blur",group.setSLD,group);
        sld.on("change",group.setSLD,group);

        var node = new Ext.OpenLayers.HS.TreeFormNode({
            title: group.name,
            items: [sld]
            });
        group.node.appendChild(node);
    },

    /**
    * Return back Ext.tree.TreeNode as tree node for specified group. If
    * the group name includes "/" in it's name, parent node will be
    * created also.
    * @function
    * @example
    *  Group name like "foo/bar/hallo/world"
    *  will produce something like
    *  (code)
    *  - ParentNode
    *    |- foo
    *        |- bar
    *            |- hallo
    *                 |- world
    *                     |- First layer
    * @name HSLayers.Control.LayerSwitcher.createTreeNode
    * @param {String} groupName node name
    * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a>} parentNode parent node
    */
    createTreeNode: function(groupName, parentNode) {

        var text = groupName;
        var groupName = groupName.split("/");

        if (groupName.length > 1) {
            var withoutLast = text.replace("/"+groupName[groupName.length-1],"");
            parentNode = this.createTreeNode(withoutLast,parentNode);
        }

        groupName = groupName[groupName.length-1];

        var onCheckboxChange = function(node) {

            var cascade  = function(node,checked) {
                var checked = node.parentNode.getUI().checkbox.checked;
                if (node.getUI().checkbox) {
                    node.getUI().checkbox.checked = checked;
                    var group = node.attributes.group;

                    if (group) {
                        group.setVisibility(checked);
                    }
                }
            };

            for (var i = 0; i < node.childNodes.length; i++) {
                node.childNodes[i].cascade( cascade );
            }
        }

        // node already exists ?
        for (var i = 0; i < parentNode.childNodes.length; i++) {
            if (parentNode.childNodes[i].text == groupName) {
                return parentNode.childNodes[i];
            }
        }
        // create new one
        var node =  new Ext.tree.TreeNode({
                checked: false,
                allowDrag: false,
                draggable: false,
                allowChildren: true,
                expandable : true,
                leaf : true,
                text : groupName,
                fullGroupName: text,
                expanded: true,
                myNodeType: "group",
                ls: this
            });

        node.on("checkchange",onCheckboxChange);

        // insert before baseLayersNode

        parentNode.insertBefore(node,this.baseLayersNode);
        //if (parentNode.childNodes[parentNode.childNodes.length-1] == this.baseLayersNode) {
        //    parentNode.insertBefore(node,this.baseLayersNode);
        //}
        //else {
        //    parentNode.appendChild(node);
        //}

        return node;
    },

    /**
    * Create nodes with legends for this group
    * @name HSLayers.Control.LayerSwitcher.createLegendNodes
    * @function
    * @param {HSLayers.Control.LayerSwitcher.LayerGroup} group
    */
    createLegendNodes: function(group) {
        for (var i = 0; i < group.legendURLs.length; i++) {
            /* check, if the legend node already exists */
            var nodeExists = false;
            for (var j = 0; j < group.node.childNodes.length; j++) {
                if (group.node.childNodes[j].getUI().node.attributes.icon == group.legendURLs[i]) {
                    nodeExists = true;
                }
            }

            if (!nodeExists) {
                var node = new Ext.tree.TreeNode({
                        draggable: false,
                        allowChildren: false,
                        allowDrag: true,
                        allowDrop: true,
                        iconCls: "legend",
                        icon: group.legendURLs[i]
                    });
                group.node.appendChild(node);
            }
        }

    },

    /**
    * Remove layer from this group
    * @name HSLayers.Control.LayerSwitcher.groupRemoveLayer
    * @function
    * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/-js.html">OpenLayers</a>} layer
    */
    groupRemoveLayer: function(layer) {
        var layers = [];
        for (var i = 0; i < this.layers; i++) {
            if (layer != this.layers[i]){
                layers.push(this.layers[i]);
            }
        }
        this.layers = layers;
    },


    /**
    * Called, when the button under the legend was clicked. Show/Hide legend for all groups. 
    * @name HSLayers.Control.LayerSwitcher.onShowLegendClicked
    * @function
    */
    onShowLegendClicked: function() {
        this.showLegend = true;
        if (this.showLegendButton.text == OpenLayers.i18n("Show legend")) {
            this.showLegendButton.setText(OpenLayers.i18n("Hide legend"));
        }
        else {
            this.showLegend = false;
            this.showLegendButton.setText(OpenLayers.i18n("Show legend"));
        }

        for (var i in this.groups) {
            if (this.showLegend) {
                if (this.groups[i].node.getUI().checkbox &&
                            this.groups[i].node.getUI().checkbox.checked) {
                    this.groups[i].node.expand();
                }
            }
            else if (this.groups[i].node.getUI().checkbox) {
                this.groups[i].node.collapse();
            }
        }
        return this.showLegend;
    },

    /**
     * ClearLayers button handler
     * @name HSLayers.Control.LayerSwitcher.onClearLayersClicked
     */
    onClearLayersClicked: function() {

        var resetLayers = [];
        for (var i = 0, len = this.map.layers.length; i < len; i++) {
            if (this.map.layers[i].displayInLayerSwitcher && this.map.layers[i].saveState) {
                resetLayers.push(this.map.layers[i]);
            }
        }

        while(resetLayers.length) {
            this.map.removeLayer(resetLayers[resetLayers.length-1]);
            resetLayers.remove(resetLayers[resetLayers.length-1]);
        }
        
        this.events.triggerEvent("reset");
    },

    /**
     * Display group menu on right mouse click
     * @name HSLayers.Control.LayerSwitcher.onRightClick
     * @function
     * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext">Ext</a>} node
     * @param {Event} evt
     */
    onRightClick: function(node, evt) {

        var group = node.attributes.group;
        if (!group) {
            return;
        }

        if (!group.menu) {
            group.menu = new HSLayers.Control.LayerSwitcher.LayerMenu({group:group});
        }
        if (group.menu.hidden) {
            group.menu.show(node.getUI().textNode);
        }
        else {
            group.menu.hide();
        }
        return;
    },

    /**
     * Dislay/Hide all layers within groups
     * @name HSLayers.Control.LayerSwitcher.onCheckboxChange
     * @function
     * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a>} node
     * @param {Boolean} checked
     */
    onCheckboxChange: function(node,checked) {

        var group = node.attributes.group;

        if (group) {
            group.setVisibility(checked);
        }
    },

    
    /**
     * Drag started, get layers index
     * @name HSLayers.Control.LayerSwitcher.onStartDrag
     * @function
     * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreePanel">Ext.tree.TreePanel</a>} panel
     * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreePanel">Ext.tree.TreePanel</a>} node
     * @param {Event} e
     */
    onStartDrag: function(panel, node,e) {
        var ls = panel.ls;

        /* find current node index */
        /*
        for (var i = 0; i < this.root.childNodes.length; i++) {
            if (this.root.childNodes[i] == node) {
                this.HSLswNodeIdx = i;
            }
        }
        */
    },

    /**
     * Drag ended, move layers up/down
     * @name HSLayers.Control.LayerSwitcher.onEndDrag
     * @function
     * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreePanel">Ext.tree.TreePanel</a>} panel
     * @param {<a href="http://www.extjs.com/deploy/dev/docs/?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a>} node
     * @param {Event} e
     */
    onEndDrag: function(panel, node,e) {
        var idx = null;
        var group;
        var map;
        var i;
        try {
            var maxIndex = -1;
            group = node.nextSibling.attributes.group;
            map = group.layers[0].map;
            for (i = 0; i < group.layers.length; i++) {
                maxIndex = (maxIndex > map.getLayerIndex(group.layers[i]) ? maxIndex : map.getLayerIndex(group.layers[i]));
            }

            idx = maxIndex;
        }
        catch(exception) {
            if (!node.previousSibling) {
                return;
            }
            var minIndex = 1000000;
            group = node.previousSibling.attributes.group;
            map = group.layers[0].map;
            for (i = 0; i < group.layers.length; i++) {
                minIndex = (minIndex < map.getLayerIndex(group.layers[i]) ? minIndex : map.getLayerIndex(group.layers[i]));
            }

            group = node.attributes.group;
            for (i = 0; i < group.layers.length; i++) {
                map.setLayerIndex(group.layers[i], minIndex-1);
            }

            idx = minIndex-1;
        }

        group = node.attributes.group;

        for (i = 0; i < group.layers.length; i++) {
            map.setLayerIndex(group.layers[i], idx);
        }

    },

    /**
     * group will be reloaded
     * @name HSLayers.Control.LayerSwitcher.groupLoadStart
     * @function
     * @param {Event} e
     */
    groupLoadStart: function(e) {
        this.setIcon(this.ls.layerLoadingIcon);
        this.loading += 1;
        this.events.triggerEvent("loadstart");
    },

    /**
     * one layer within group is loaded
     * @name HSLayers.Control.LayerSwitcher.groupLoadEnd
     * @function
     * @param {Event} e
     */
    groupLoadEnd: function(e) {
        this.loading -= 1;
        if (this.loading <= 0) {
            this.setIcon(this.queryable ? this.ls.layerInfoIcon : this.ls.layerIcon);
            this.loading = 0;
            this.events.triggerEvent("loadend");
        }
    },

    /**
     * Method onBeforeNodeDrop
     * @note empty now
     * @name HSLayers.Control.LayerSwitcher.onNodeDragOver
     * @function
     * @private
     * @param {Event} e
     */
    onNodeDragOver: function(e) {

    },

    /**
     * Changes color (css styles) of the node
     * @name HSLayers.Control.LayerSwitcher.toggleNodeDisabled
     * @function
     * @param {<a href="http://www.extjs.com/deploy/dev/docs?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a>} node
     * @param {Boolean} disable
     */
    toggleNodeDisabled: function(node,disable) {

        var ui = node.getUI();
        if (ui.elNode) {
            if (disable) {
                if (ui.elNode.className.search("disabledNode") == -1) {
                    ui.elNode.className += " disabledNode";
                }
            }
            else {
                ui.elNode.className = ui.elNode.className.replace(/disabledNode/g,"");
            }
        }
    },

    _makeToolTip: function(group) {

        if (group.node.ui.anchor) {
            group.node.ui.anchor.id = group.node.id;
            if (Ext.get(group.node.id)) {
                var scaleRange = group.getScaleRange();
                if (scaleRange) {
                    new Ext.ToolTip({
                        target: group.node.id,
                        title: OpenLayers.i18n("Layer visibility"),
                        trackMouse:true,
                        html: scaleRange
                    });
                }
            }
        }

        Ext.QuickTips.init();
    },

    /**
     * @name HSLayers.Control.LayerSwitcher.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.LayerSwitcher"
});


/**
 * Group class - layers are organized into groups. Sometimes, ofcourse,
 * there is only onle layer within the group
 *
 */
HSLayers.Control.LayerSwitcher.LayerGroup = OpenLayers.Class({

    /**
     * name of this group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.name
     * @type String
     */
    name : null,


    /**
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.visibility
     * @type Boolean
    */
    visibility : false,

    /**
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.icon
     * @type String
     */
    icon : null,

    /**
     * list of layers
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.layers
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer-js.html">OpenLayers.Layer</a>[]
     */
    layers : null,

    /**
     * list of URLs for each legend
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.legendURLs
     * @type String[]
     */
    legendURLs : null,

    /**
     * list of URLs for each metadata
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.metadataURLs
     * @type String[]
     */
    metadataURLs : null,

    /**
     * list of URLs for each source
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.sources
     * @type String[]
     */
    sources : null,

    /**
     * the group can be removed from layerswitcher or not
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.removable
     * @type {Boolean}
     */
    removable : false,

    /**
     * dimensions
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.dimensions
     * @type {Object}
     */
    dimensions : undefined,

    /**
     * this group is base group (always at bottom)
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.isBaseGroup
     * @type {Boolean}
     * @default false
     */
    isBaseGroup : false,

    /**
     * layer is type of <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/WMS-js.html">OpenLayers.Layer.WMS</a>}
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.isWMS
     * @type {Boolean}
     */
    isWMS : false,

    /**
     * Node for this group in the layer tree
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.node
     * @type <a href="http://www.extjs.com/deploy/dev/docs?class=Ext.tree.TreeNode">Ext.tree.TreeNode</a>
     */
    node : null,

    /**
     * group opacity
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.opacity
     * @type Float
     */
    opacity : null,

    /**
     * the layerswitcher object
     * @type HSLayers.Control.LayerSwitcher
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.ls
     */
    ls : null,

    /**
     * indicator if group was loaded or not
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.loading
     * @type Boolean
     */
    loading : null,

    /**
     * minimal resolution for this group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.minResolution
     * @type Float
     */
    minResolution : null,

    /**
     * maxExtent
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.maxExtent
     * @type OpenLayers.Bounds
     */
    maxExtent : null,

    /**
     * maximal resolution for this group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.maxResolution
     * @type Float
     */
    maxResolution : null,

    /**
     * EVENT_TYPES
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.EVENT_TYPES
     * @type [{String}]
     */
    EVENT_TYPES : ["loadstart","loadend"],

    /**
     * indicator if the group is queryable
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.queryable
     * @type Boolean
     * @default false
     */
    queryable : false,

    /**
     * list of projection codes supported within the group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.projections
     * @type String[]
     */
    projections : null,

    /**
     * FES Filter
     * Makes sense only for WFS layers
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.filter
     * @type OpenLayers.Filter
     */
    filter : null,

    /**
      Filter window
     */
    filterWindow : null,

    /**
     * Create Group
     * @constructor 
     * @name HSLayers.Control.LayerSwitcher.LayerGroup
     * 
     * @param {String} name
     * @param {Object} options
     */
    initialize: function(name,options) {
        this.name = name;
        // init 
        this.projections = [];
        this.layers = [];
        this.legendURLs = [];
        this.metadataURLs = [];
        this.sources = [];
        this.ls = null;
        this.dimensions = {};

        this.EVENT_TYPES = HSLayers.Control.LayerSwitcher.LayerGroup.prototype.EVENT_TYPES.concat(
                OpenLayers.Class.prototype.EVENT_TYPES);

        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);

        // extend 
        OpenLayers.Util.extend(this, options);
    },

    /**
     * destroy this group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.destroy
     * @function
     */
    destroy: function() {
        var map = this.layers[0];
        while (this.layers.length) {
            var layer = this.layers[this.layers.length-1];
            this.layers.pop();
            layer.destroy();
        }
        this.layers = null;
        this.ls = null;
        this.node.destroy();
    },

    /**
     * get layer attribution
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getLayerAttribution
     * @function
     * @return {String}
     */
    getLayerAttribution: function() {
        var html ="<dl>";
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].attribution) {
                html += "<dt>"+this.layers[i].name+"</dt><dd>"+this.layers.attribution+"</dd>";
            }
        }
        html +="</dl>";
        return html;
    },

    /**
     * get layer abstracts
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getLayerAbstracts
     * @function
     * @return {String}
     */
    getLayerAbstracts: function(){
        var html = "";
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].abstract) {
                html += "<div>"+this.layers[i].abstract+"</div>";
            }
        }
        return html === "" ? null : html;
    },

    /**
     * get layer urls
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getLayerUrls
     * @function
     * @return {String}
     */
    getLayerUrls: function(){
        var html = "<ul>";
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].url) {
                var url = this.layers[i].url;
                if (this.layers[i].CLASS_NAME == "OpenLayers.Layer.WMS") {
                    url = OpenLayers.Util.urlAppend(url,
                    OpenLayers.Util.getParameterString({SERVICE:"WMS",REQUEST:"GetCapabilities"}));
                }
                html += "<li><a href=\""+url+"\" target=\"_blank\">"+OpenLayers.i18n("Data source")+"...</a></li>";
            }
        }
        html += "</ul>";
        return html == "" ? null : html;
    },

    /**
     * get layer metadata
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getLayerMetadata
     * @function
     * @return {String}
     */
    getLayerMetadata: function() {

        var metadata = [];
        var hasMetadata = false;
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].metadata && this.layers[i].metadata.href) {
                hasMetadata = true;
                // layer.metadata = {
                //                      format: string
                //                      href: string
                //                      type: string
                //
                if (/(application)|(text)\/xml/.test(this.layers[i].metadata.format)  &&
                    (this.layers[i].metadata.type == "ISO19115:2003" ||
                    /TC211/.test(this.layers[i].metadata.type))) {
                    metadata.push({text: this.layers[i].name,
                                   hrefTarget:"_blank",
                                   href: HSLayers.MetadataViewerURL+escape(this.layers[i].metadata.href)
                                   });
                }
                else {
                    metadata.push({text:this.layers[i].name,
                               hrefTarget:"_blank",
                               href:this.layers[i].metadata.href});
                }

            }
        }
        if (hasMetadata) {
            return metadata;
        }
        else {
            return null;
        }
    },

    /**
     * get layer attribution
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getLayerAttribution
     * @function
     * @return {String}
     */
    getLayerAttribution: function() {

        var attribution = [];
        var hasAttribution = false;
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            if (layer.attribution) {
                hasAttribution = true;
                if (typeof(layer.attribution) == "string") {
                    attribution.push(new Ext.menu.TextItem({text:layer.attribution}));
                }
                else {
                    attribution.push({text:layer.attribution.title || layer.name,
                                      hrefTarget:"_blank",
                                      href:layer.attribution.href});
                }

            }
        }
        if (hasAttribution) {
            return attribution;
        }
        else {
            return null;
        }
    },

    /**
     * get layer layers
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getLayersLayers
     * @function
     * @return {Ext.Panel}
     */
    getLayerLayers: function() {
        return  {html:""};
    },

    /**
     * get layer sources
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getLayerSources
     * @function
     * @return {String}
     */
    getLayerSources: function() {

        var html = "<dl>";

        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].source) {
                html += "<dt>"+this.layers[i].name+"</dt><dd><a href=\""+this.layers[i].source+"\" target=\"_blank\">"+this.layers[i].source+"</a></dd>";
            }
            else if (this.layers[i] instanceof OpenLayers.Layer.Vector && this.layers[i].getFullRequestString) {
                html += "<dt>"+this.layers[i].name+"</dt><dd><a href=\""+this.layers[i].getFullRequestString()+"\" target=\"_blank\">"+this.layeres[i].getFullRequestString()+"</a></dd>";
            }
        }
        html += "</dl>";
        return html;
    },

    /**
     * Set group visibility - visibility for each layer within group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.setVisibility
     * @function
     * @param {Boolean} visibility
     */
    setVisibility: function(visibility) {
        for (var i = 0; i < this.layers.length; i++) {
            this.layers[i].setVisibility(visibility);
            if (this.layers[i].isBaseLayer && visibility) {
                this.ls.map.setBaseLayer(this.layers[i]);
            }
            if (this.layers[i].isBaseGroup && visibility) {
                for (var g in this.ls.groups) {
                    if (this.ls.groups[g].name != this.layers[i].group) {
                        if (this.ls.groups[g].isBaseGroup) {
                            this.ls.groups[g].setVisibility(false);
                        }
                    }
                }
            }
        }
        this.visibility = visibility;
        
        /* (un)check node */
        if (this.node) {
            if (this.node.ui.checkbox) {
                this.node.ui.checkbox.checked = this.getVisibility();
            }
        }
    },

    /**
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.setOpacity
     * @param {Float} opacity 
     */
    setOpacity: function(opacity) {

        for (var i = 0; i < this.layers.length;i++) {
            this.layers[i].setOpacity(opacity);
        }
        this.opacity = opacity;
        return true;
    },


    /**
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.calculateInRange
     * @function
     * @returns {Boolean} yes 
     */
    calculateInRange: function() {
        if (!this.projections ||
                this.projections.length === 0) {
        }

        if (this.getMinResolution() <= this.ls.map.getResolution() && 
                this.ls.map.getResolution() <= this.getMaxResolution()) {
            return true;
        }
        else {
            return false;
        }
    },

    /**
     * Get group min resolution
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getMinResolution
     * @returns {float} resolution
     */
    getMinResolution: function() {
        var res;
        for (var i = 0; i < this.layers.length; i++) {
            if (res === undefined || res > this.layers[i].minResolution) {
                res = this.layers[i].minResolution;
            }
        }
        return res;
    },

    /**
     * Get group visibility
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getMaxResolution
     * @returns {float} resolution
     */
    getMaxResolution: function() {
        var res;
        for (var i = 0; i < this.layers.length; i++) {
            if (res === undefined || res < this.layers[i].maxResolution) {
                res = this.layers[i].maxResolution;
            }
        }
        return res;
    },
                      
    /**
     * Get group min resolution based on WMS capabilities definition
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getWMSMinScale
     * @returns {float} resolution
     */
    getWMSMinScale: function() {
        var res;
        for (var i = 0; i < this.layers.length; i++) {
            if (res === undefined || res > this.layers[i].wmsMinScale) {
                res = this.layers[i].wmsMinScale;
            }
        }
        return res;
    },

    /**
     * Get group max resolution based on WMS capabilities definition
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getWMSMaxScale
     * @returns {float} resolution
     */
    getWMSMaxScale: function() {
        var res;
        for (var i = 0; i < this.layers.length; i++) {
            if (res === undefined || res < this.layers[i].wmsMaxScale) {
                res = this.layers[i].wmsMaxScale;
            }
        }
        return res;
    },

    /**
     * Get group visibility
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getVisibility
     * @returns {Boolean} visibility
     */
    getVisibility: function() {
        return this.visibility;
    },

    /**
     * Append new layer to group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.addLayer
     * @function
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer-js.html">OpenLayers.Layer</a>} layer
     */
    addLayer: function(layer) {
        var i;
        if (layer.isBaseLayer || layer.isBaseGroup) {

            /* if it was not before, we have to move whole node */
            if (!this.isBaseGroup) {
                if (this.node && this.node.parentNode) {
                    if (this.node.parentNode != this.ls.baseLayersNode) {
                        //this.node.parentNode.removeChild(this.node);
                        this.ls.baseLayersNode.appendChild(this.node);
                    }
                }
            }
            this.isBaseGroup = true;
        }

        /* push only, if does not exist yet */
        for (i = 0; i < this.layers.length; i++) {
            if (this.layers[i] == layer) {
                return;
            }
        }

        this.layers.push(layer);

        if (layer.legend) {
            if (layer.legend.length) {
                for (i = 0; i < layer.legend.length; i++) {
                    this.addAttribute("legendURLs",layer.legend[i].href);
                }
            }
            else {
                this.addAttribute("legendURLs",layer.legend.href);
            }
        }

        if (layer.metadata) {
            this.addAttribute("metadataURLs",layer.metadata);
        }

        if (layer.source) {
            this.addAttribute("sources",layer.source);
        }

        if (layer.opacity) {
            this.opacity = layer.opacity;
        }

        if (layer.removable) {
            this.removable = true;
        }

        if (layer.dimensions) {
             OpenLayers.Util.extend(this.dimensions,layer.dimensions);
        }

        if (layer.info_format || layer.queryable) {
            this.addAttribute("queryable",true);
            this.icon = OpenLayers.Util.getImagesLocation()+this.ls.layerInfoIcon;

        }

        if (layer.CLASS_NAME.search("WMS") > -1) {
            this.isWMS = true;
        }

        if (layer.__initVisibility === undefined) {
            layer.__initVisibility = layer.visibility;
        }

        if (layer.CLASS_NAME.search("HSLayers.Layer.MapServer") > -1) {
            this.isHSMapServer = true;
            layer.events.register("layerloaded",layer,function() { 
                    this.__initVisibility = (this.params.layers ? this.params.layers.split(" "): []);
                    });
        }

        if (layer.hideIcon) {
            this.hideIcon = true;
        }

        if (layer.icon) {
            this.icon = layer.icon;
        }

        if (layer.sld) {
            this.addAttribute("sld",layer.sld);
        }

        /* visibility */
        if (layer.getVisibility()) {
            this.setVisibility(true);
        }

        /* maxExtent */
        if (layer.maxExtent) {
            if (!this.maxExtent) {
                this.maxExtent = layer.maxExtent;
            }
            else {
                this.maxExtent.extend(layer.maxExtent);
            }
        }

    },

    /**
     * set sld
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.setSLD
     * @function
     * @param {<a href="http://www.extjs.com/deploy/dev/docs?class=Ext.form.FormField">Ext.form.FormField</a>} field
     */
    setSLD: function(field) {

        this.sld = field.getValue();
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].CLASS_NAME.search("WMS") > -1) {
                this.layers[i].sld = field.getValue();
                this.layers[i].params.sld = this.layers[i].sld;
                this.layers[i].redraw(true);
            }
        }
    },

    /**
     * Add some attribute to group
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.addAttribute
     * @function
     * @param {Stringh} key attribute key
     * @param {String} value attribute value
     */
    addAttribute: function(key,value) {
        for (var i = 0; i < this[key].length; i++) {
            if (this[key][i] == value) {
                return;
            }
        }
        switch(typeof(this[key])) {
            case typeof([]): this[key].push(value);
                            break;
            default: this[key] = value;
                            break;
        }
    },

    /**
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.setIcon
     * @function
     * @param {String} icon url
     */
    setIcon: function(icon) {

        if (!this.hideIcon && this.node && this.node.getUI() && this.node.getUI().getIconEl()) {
            this.node.getUI().getIconEl().src = OpenLayers.Util.getImagesLocation()+icon;
        }
        return true;
    },

    /**
     * return highest index of layer from group layers
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.getIndex
     * @returns {Integer} idx
     */
    getIndex: function() {
        var idx = null;
        if (!this.layers.length) {
            return -1;
        }
        var map = this.layers[0].map;
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].map) {
                idx = (idx === null || map.getLayerIndex(this.layers[i] > idx ) ?  map.getLayerIndex(this.layers[i]) : idx  );
            }
        }
        return idx;
    },

    /**
     * mergeNewParams propagation from layer to group
     */
    mergeNewParams: function(params) {
        var ret;
        for (var i = 0; i < this.layers.length; i++) {
            ret = ret || this.layers[i].mergeNewParams(params);
        }
        return ret;
    },

    /**
     * Open window with FES Filter
     */ 
    openFilterWindow: function() {
        // Create the window
        if (!this.filterWindow) {
            this.filterWindow = new Ext.Window({
                title: OpenLayers.i18n("Filter"),
                closeAction: 'hide' // don't destroy the window, just hide it
            });

            // Create the filter form
            filterForm = new HSLayers.Control.LayerSwitcher.WFSFilterForm({
                filter: this.filter,
                layerGroup: this,
                layer: this.layers[0], // ugly hack - yes, we assume there is only one layer, ay...
                window: this.filterWindow 
            });
            this.filterWindow.add(filterForm);
        }
        
        // Show the window
        this.filterWindow.setSize(700,200);
        this.filterWindow.setPosition(300,200);
        this.filterWindow.show();
    },

    /**
     * Set filter
     * Called by WFSFilterForm
     * @param {OpenLayers.Filter} filter
     */
    setFilter: function(filter) {
        this.filter = filter;
    },

    /**
     * returns tring with scale range of this group
     * @function
     * @name HSLayers.Control.LayerSwitcher.LayerGroup
     * @returns String
     */
    getScaleRange: function() {

        // scale
        var map = this.ls.map;
        var groupMaxScale = this.getWMSMaxScale();
        var groupMinScale = this.getWMSMinScale();

        var scaleStr = "";

        if (groupMinScale) {
            scaleStr += " 1:"+ Math.round(groupMinScale);
        }

        else if (groupMaxScale) {
            scaleStr += "1:&infin;";
        }

        if (groupMinScale || groupMaxScale) {
            scaleStr += " - ";
        }

        if (groupMaxScale) {
            scaleStr += "1:"+Math.round(groupMaxScale);
        }
        else if (groupMinScale) {
            scaleStr += "&infin;";
        }
        return scaleStr;
    },

    /**
     * @name HSLayers.Control.LayerSwitcher.LayerGroup.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.LayerSwitcher.LayerGroup"
});

Ext.namespace("HSLayers.Control.LayerSwitcher");

HSLayers.Control.LayerSwitcher.TreeFormNode = function(config) {

    // call parent constructor
    HSLayers.Control.LayerSwitcher.TreeFormNode.superclass.constructor.call(this, config);

    // redefine this UI method
    this.ui.renderElements =  function(n, a, targetNode, bulkRender){
        // add some indent caching, this helps performance when rendering a large tree
        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

        var cb = typeof a.checked == 'boolean';

        var href = a.href ? a.href : Ext.isGecko ? "" : "#";
        var buf = ['<li class="x-tree-node"><div ext:tree-node-id="',n.id,'" class="x-tree-node-el x-tree-node-leaf x-unselectable ', a.cls,'" unselectable="on">',
            '<span class="x-tree-node-indent" style="display:none;">',this.indentMarkup,"</span>",
            '<img src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" style="display:none" />',
            '<img src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon',(a.icon ? " x-tree-node-inline-icon" : ""),(a.iconCls ? " "+a.iconCls : ""),'" unselectable="on" style="display:none"/>',
            cb ? ('<input class="x-tree-node-cb" type="checkbox" ' + (a.checked ? 'checked="checked" />' : '/>')) : '',
            '<a hidefocus="on" class="x-tree-node-anchor" href="',href,'" tabIndex="1" ',
             a.hrefTarget ? ' target="'+a.hrefTarget+'"' : "", '><span unselectable="on">'+"</span></a></div>",
            '<ul class="x-tree-node-ct" style="display:none;"></ul>',
            "</li>"].join('');

        var nel;
        if(bulkRender !== true && n.nextSibling && (nel = n.nextSibling.ui.getEl())){
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin", nel, buf);
        }else{
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf);
        }
        
        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1];
        var cs = this.elNode.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];
        var index = 3;
        if(cb){
            this.checkbox = cs[3];
	    // fix for IE6
	    this.checkbox.defaultChecked = this.checkbox.checked;			
            index++;
        }
        this.anchor = cs[index];
        this.textNode = cs[index].firstChild;
        n.form.render(this.textNode);
        this.elNode.style.marginLeft = "18px";
        this.elNode.style.lineHeight = "0px";
    };

    // create the form
    this.form = new Ext.form.FormPanel({
            //title: config.title,
            title: " ",
            collapsed: true,
            collapsible: true,
            frame: true,
            items: config.items
        });

    this.text = this.form.title;
 
}; // end of Ext.ux.IconCombo constructor
 
// extend
Ext.extend(HSLayers.Control.LayerSwitcher.TreeFormNode, Ext.tree.TreeNode, {

    setText : function(text){
        var oldText = this.form.title;
        this.form.setTitle(text);
        this.text = this.form.ui.dom;
        this.attributes.text = text;
        this.ui.textNode.appendChild(this.text.ui.dom);
        //if(this.rendered){ // event without subscribing
        //  this.ui.onTextChange(this, text, oldText);
        //}
        this.fireEvent("textchange", this, "ahoj", oldText);
    }
}); // end of extend


HSLayers.Control.LayerSwitcher.LayerMenu = function(config) {
    config = (config ? config : {});
    config.items = [];
    config.plain = true;
    config.width = 300;
    config.allowOtherMenus = true;

    if (config.group) {
        var names = config.group.name.split("/");

        // abstracts
        config.items.push({text:names[names.length-1],
                           canActivate:false,cls:"x-panel-header"});
        var abstracts = config.group.getLayerAbstracts();
        if (abstracts) {
            config.items.push({text:abstracts,
                           canActivate:false
                           });
                           // style: {height: "auto",
                           // lineHeight:"auto",
                           // whiteSpace:"normal"}});
        }


        var scaleStr = config.group.getScaleRange();
        if (scaleStr) {
            config.items.push({canActivate:false,html:OpenLayers.i18n("Scale")+":"+" "+scaleStr});
        }

        if (config.group.maxExtent) {
            config.items.push(
                    {text:OpenLayers.i18n("Zoom to layer"), 
                        scope:config.group,  
                        handler: function() {this.layers[0].map.zoomToExtent(this.maxExtent);},
                        cls: 'x-btn-text-icon',
                        icon: OpenLayers.Util.getImagesLocation()+'/zoom-fit.png'
                });
        }

        // Check if it is a WFS and if so, add "Filter" button
        // Here we assume, that any WFS layer is always alone in the LayerGroup
        var filterable = (config.group.layers[0].CLASS_NAME == "HSLayers.Layer.WFS");

        // Filter
        if (filterable) {
            config.items.push({
                text:OpenLayers.i18n("Filter"),
                handler: function() {config.group.openFilterWindow();}
            });
        }

        // opacity
        this.opacitySlider =  new Ext.Slider({
                fieldLabel: OpenLayers.i18n("Opacity"),
                title: OpenLayers.i18n("Opacity"),
                labelStyle: "font-weight: bold",
                width: config.width-16,
                minValue: 0,
                value: config.group.layers[0].opacity*100,
                group: config.group,
                listeners: {'drag':this.onOpacityDrag,
                            'change':this.onOpacityDrag},
                maxValue: 100
        });
    
        config.items.push({xtype:"buttongroup",title:OpenLayers.i18n("Opacity"),items:[this.opacitySlider]});

        if (config.group.dimensions && config.group.dimensions.time) {
            config.items.push(new HSLayers.Control.LayerSwitcher.TimeSlider({group:config.group,width: config.width}));
        }

        // attribution
        var attribution = config.group.getLayerAttribution();

        if (attribution && attribution.length) {
            var attributionMenu = new Ext.menu.Menu({
                items: attribution
            });
            config.items.push({text:OpenLayers.i18n("Attribution"),menu:attributionMenu});
        }
 
        // metadata
        var metadata = config.group.getLayerMetadata();
        if (metadata && metadata.length) {
            var metadataMenu = new Ext.menu.Menu({
                items: metadata
            });
            config.items.push({
                               text:OpenLayers.i18n("Metadata"),
                               menu:metadataMenu,
                               icon: OpenLayers.Util.getImagesLocation()+"info_blue.png"
            });
        }

        // removable
        if (config.group.removable) {
            config.items.push(
                    {text:OpenLayers.i18n("Remove layer"), 
                        scope:this,  
                        handler: function(){
                            this.hide();
                            this.group.ls.removeGroup(this.group);
                            this.group.destroy.apply(this.group,[]);
                        },
                        cls: 'x-btn-text-icon',
                        icon: OpenLayers.Util.getImagesLocation()+'/empty.gif'
                });
        }
    }

    config.listeners = config.listeners || {};
    config.listeners.beforehide = function(menu) {
        if (config.group.dimensions && config.group.dimensions.time &&
           (menu.group.menu.items.items[3].fromTime.isExpanded() ||
                    menu.items.items[3].toTime.isExpanded())) {
            return false;
        }};
    
    HSLayers.Control.LayerSwitcher.LayerMenu.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.Control.LayerSwitcher.LayerMenu, Ext.menu.Menu, {
    /**
     * on opacity was draged
     * @name HSLayers.Control.LayerSwitcher.LayerMenu.onOpacityDrag
     * @function
     */
     onOpacityDrag:  function(e){
        var min = this.minValue;
        var max = this.maxValue;
        var val = this.getValue();
        this.group.setOpacity((max-val)/100);
    },

    /**
     * on time was dragged
     * @name HSLayers.Control.LayerSwitcher.LayerMenu.onTimeDrag
     * @function
     */
     onTimeDrag:  function(e){
        var min = this.time.minValue;
        var max = this.time.maxValue;
        var res = this.time.resol;
        var val = this.getValue();
        //this.group.setOpacity((max-val)/100);
    },
    CLASS_NAME: "HSLayers.Control.LayerSwitcher.LayerMenu"
});

HSLayers.Control.LayerSwitcher.TreeNodeUI = function(config) {
    config = config || {};

    HSLayers.Control.LayerSwitcher.TreeNodeUI.superclass.constructor.call(this, config);
};

Ext.extend(HSLayers.Control.LayerSwitcher.TreeNodeUI, Ext.tree.TreeNodeUI, {


    CLASS_NAME: "HSLayers.Control.LayerSwitcher.TreeNodeUI"
});
