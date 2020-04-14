/**
 * Advanced layer switcher. <OpenLayers.Layer>s are grouped into "group"
 * object. This object behaves like layer and has some similar methods. 
 * This child class is able to handle <HSLayers.Layer.MapServer>
 *
 * @class HSLayers.Control.LayerSwitcher.MultiLayer
 * @augments {HSLayer.Control.LayerSwitcher}
 *
 * @example
 *  var hslayer = new HSLayers.Layer.MapServer("HS-RS (HSRSMapServer)",
 *          "http://www.bnhelp.cz/mapserv/hsmap/hsmap.php?"+
 *          "project=cr_hslayers&mode=lyrlist",{},{visibility:false, isBaseLayer: false});
 *  map.addLayer(hslayer)
 *  var ls = new HSLayers.Control.LayerSwitcher.MultiLayer({container: layersTab });
 *  map.addControl(ls);
 */
HSLayers.Control.LayerSwitcher.MultiLayer =
    OpenLayers.Class(HSLayers.Control.LayerSwitcher, {

    /**
     * list of legend nodes of HSMapServer
     * @name HSLayers.Layer.MapServer.destroy
     * @type Ext.tree.TreeNode
     */
    legendNodes: [],

    /** 
     * @name HSLayers.Layer.MapServer.destroy
     * @type {Mixed}
     * @private
     */
    _objectToBeUnregistered: null,
    
    /**
     * Show/hide checkbox for layer based on HSLayers.Layer.MapServer
     * @name HSLayers.Control.LayerSwitcher.MultiLayer.showCheckBoxForHSMapServer
     * @type {Boolean}
     */
    showCheckBoxForHSMapServer: false,

    /**
     * @constructor
     * 
     * @name HSLayers.Control.LayerSwitcher.MultiLayer
     * @param {Object} options
     */
    initialize : function(options) {
        HSLayers.Control.LayerSwitcher.prototype.initialize.apply(this, [options]); 
        
        this.showCheckBoxForHSMapServer = 
            (options.showCheckBoxForHSMapServer != null) ? options.showCheckBoxForHSMapServer : false;        
    },

    /**
     * Unregister all events and destroy this control
     * @name HSLayers.Layer.MapServer.destroy
     * @function
     * @private
     */    
    destroy: function() {
        OpenLayers.Event.stopObservingElement(this.div);

        this.treePanel.destroy();
        this.treePanel = null;

        this.map.events.unregister("addlayer", this, this.onAddLayer);
        this.map.events.unregister("changelayer", this, this.onChangeLayer);
        this.map.events.unregister("removelayer", this, this.onRemoveLayer);
        this.map.events.unregister("changebaselayer", this, this.onChangeBaseLayer);
        this.map.events.unregister("moveend", this, this.onMoveEnd);


        for (var i = 0; i < this.groups.length; i++) {
            this.events.unregister("loadstart", this.groups[i], this.groupLoadStart);
            this.events.unregister("loadend", this.groups[i], this.groupLoadEnd);
        }
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * Return back Ext.tree.TreeNode for specified group
     * @name HSLayers.Control.LayerSwitcher.createGroupNode
     * @function
     * @param {OpenLayers.Control.LayerSwitcher.LayerGroup} group
     */
    createGroupNode: function(group) {

        var HSLayer = false; 

        for (var i = 0; i < group.layers.length; i++) {
            var layer = group.layers[i];

            // Will call method for creating nodes of the HSMapServer layer,
            // when the list of layers is loaded
            if (layer.CLASS_NAME.search("HSLayers.Layer.MapServer")> -1) {
                this._objectToBeUnregistered = {ls:this,group:group,layer:layer};
                layer.events.register("layerloaded",
                        this._objectToBeUnregistered, this.hsLayerCreateNodes);
                HSLayer = true;
            }
        }

        var text = group.name.split("/");
        text = text[text.length-1];

        // ordinary node
        group.node =  new Ext.tree.TreeNode({
                checked: (group.isHSMapServer && !this.showCheckBoxForHSMapServer) ?
                    undefined : group.getVisibility(),
                allowDrag: true,
                allowDrop: false,
                //disabled: !group.calculateInRange(),
                draggable: !group.isBaseGroup,
                allowChildren: true,
                expandable : (group.legendURLs.length || HSLayer ? true : false),
                leaf : true,
                text : text,
                icon: (group.hideIcon ? undefined :  group.icon),
                expanded: HSLayer,
                cls:"LayerSwitcherGroupNode "+(group.calculateInRange() ? "" : "disabledNode" ),
                group: group,
                myNodeType: "group",
                ls: this
            });

        group.node.on("contextmenu",this.onRightClick,this);
        group.node.on("click",this.onRightClick,this);
        group.node.on("checkchange",this.onCheckboxChange);

        //this.createAttributesForm(group);
        this.createLegendNodes(group);

        return ;
    },

    /**
     * Create hsGroupNodes, which will create the HSMapServer
     * layer nodes
     * @name HSLayers.Layer.MapServer.hsLayerCreateNodes
     * @function
     * @param {Event} e
     */
    hsLayerCreateNodes: function(e) {
        try {
            this.ls.createHSGroupNodes(this.group,this.layer,this.layer.baseGroup); 
        }catch(ex){console.log(ex);}

        this.layer.events.unregister("layerloaded",
                this.ls._objectToBeUnregistered, this.ls.hsLayerCreateNodes);

        var group = this.ls.groups[this.layer.group];
        group.node.collapse(true);

        // expand group nodes, where ALL layers are NOT VISIBLE
        var expand = function(node) {
            if (node) {
                expand(node.parentNode);
                node.expand();
            }
        }

        for ( var i = 0; i < this.layer.layers.length; i++) {
            var layer = this.layer.layers[i];
            if (layer.getVisibility()) {
                // call the recursive collapse function from above
                expand(layer.__parentGroup.node);
            }
        }
    },

    /**
     * Create nodes for groups of HSMapServer layer
     * @name HSLayers.Layer.MapServer.createHSGroupNodes
     * @function
     * @param {HSLayers.Control.LayerSwitcher.LayerGroup} group
     * @param {HSLayers.Layer.MapServer} layer
     */
    createHSGroupNodes: function(group,layer, baseGroup) { 
        
        // create group node or layer node
        for (var name in baseGroup) {

            if (name.indexOf("__") == 0) {
                continue;
            }

            if (baseGroup[name].isGroup) {
                var hsGroup = baseGroup[name];
                var name = (hsGroup.title ? hsGroup.title : hsGroup.name);

                hsGroup.node =  new Ext.tree.TreeNode({
                        checked: hsGroup.getVisibility(),
                        allowChildren: true,
                        allowDrag: false,
                        allowDrop: false,
                        expandable : true,
                        leaf : true,
                        text : name,
                        icon: undefined, // group.icon,
                        expanded: true,
                        group: group,
                        hsGroup: hsGroup,
                        myNodeType: "group",
                        ls: this
                    });
                
                hsGroup.events.register("visibilitychanged",hsGroup, function() {
                            this.node.getUI().checkbox.checked = this.visibility;
                        });
                hsGroup.node.on("checkchange",this.onGroupCheckboxChange,this);

                if (hsGroup.__parentGroup && hsGroup.__parentGroup.node) {
                    hsGroup.__parentGroup.node.appendChild(hsGroup.node);
                }
                else { 
                    group.node.appendChild(hsGroup.node);
                }
                
                // create the layer nodes as well
                this.createHSGroupNodes(group, layer, hsGroup);
            }
            else if (baseGroup[name].isLayer) {
                this.createHSLayerNodes(group, baseGroup[name]);
            }
        }

        //layer.baseGroup.node = group.node;
        //this.createHSLayerNodes(group, layer);

    },


    /**
     * Will create nodes of sublayers of the HSMapServer layer
     * @name HSLayers.Layer.MapServer.createHSLayerNodes
     * @function
     * @param {HSLayers.Control.LayerSwitcher.LayerGroup} group the layer switcher group
     * @param {HSLayers.Control.LayerSwitcher.LayerGroup} hsGroup HSMapServer group
     * @note This is a mess, I know :-/
     */
    createHSLayerNodes: function(group,layer) {
            var name = (layer.title ? layer.title : layer.name);

            layer.node =  new Ext.tree.TreeNode({
                    checked: layer.getVisibility(),
                    //disabled: !layer.calculateInRange(),
                    allowChildren: true,
                    allowDrag: false,
                    allowDrop: false,
                    expanded : false,
                    leaf : true,
                    text : name,
                    cls:"LayerSwitcherGroupNode "+(layer.calculateInRange() ? "" : "disabledNode" ),
                    //cls: (group.calculateInRange() ? "": "disabledNode"),
                    expandable: layer.legendURL,
                    group: group,
                    hsGroup: layer.__parentGroup,
                    hsLayer: layer,
                    icon: OpenLayers.Util.getImagesLocation()+(layer.queryable ? this.layerInfoIcon : this.layerIcon),
                    myNodeType: "group",
                    ls: this
                });
            
            
            if (layer.__parentGroup && layer.__parentGroup.node) {
                layer.__parentGroup.node.appendChild(layer.node);
            }
            else {
                group.node.appendChild(layer.node);
            }

            // create the legend node as well
            if (layer.legendURL) {
                // create the node
                this.createHSLayerLegendNode(layer.__parentGroup,layer);
            }

            layer.node.on("checkchange",this.onLayerCheckboxChange);
            layer.node.on("contextmenu",this.onHSLayerRightClick);
            layer.events.register("visibilitychanged",layer, function() {
                            this.node.getUI().checkbox.checked = this.visible;
            });

    },

    /**
     * Will create the legend node
     * @name HSLayers.Layer.MapServer.createHSLayerLegendNode
     * @function
     * @param {HSLayers.Control.LayerSwitcher.LayerGroup} hsGroup HSMapServer layer group
     * @param {HSLayers.Layer.MapServer} layer hsMapServer layer
     */
    createHSLayerLegendNode: function(hsGroup,layer) {
        var node = new Ext.tree.TreeNode({
                draggable: false,
                allowChildren: false,
                iconCls: "legend",
                icon: layer.legendURL
            });
        layer.node.appendChild(node);
        this.legendNodes.push(node);

    },

    /**
     * Will update the nodes according to current scale
     * @function
     * @name HSLayers.Layer.MapServer.onMoveEnd
     * @param {Event} e
     */
    onMoveEnd: function(e) {
        for (var i in this.groups) {
            var group = this.groups[i];

            // dis/enable normal nodes
            //group.calculateInRange() ? group.node.enable() : group.node.disable();
            this.toggleNodeDisabled(group.node, !group.calculateInRange());

            var cascade = function(innode) {
                // HSMapServer layers 
                for (var j = 0; j < innode.childNodes.length; j++) {
                    var node = innode.childNodes[j];
                    if (node.attributes.hsGroup || node.attributes.hsLayer) {

                        // for each layer within group
                        for (var name in node.attributes.hsGroup) {
                            if (name.indexOf("__") == 0) {
                                continue;
                            }
                            // toggle hslayer
                            if (node.attributes.hsGroup[name].isLayer) {
                                var layer = node.attributes.hsGroup[name];
                                this.toggleNodeDisabled(layer.node, !layer.calculateInRange());
                            }
                            // toggle hsgroup
                            if (node.attributes.hsGroup[name].isGroup) {
                                cascade.apply(this,[node]);
                            }
                            
                        }
                    }
                }
            };

            // call recursively function
            cascade.apply(this,[group.node]);
        }
    },

    /**
     * Will uncheck mutualy disabled layers and redraw the map
     * @name HSLayers.Layer.MapServer.onLayerCheckboxChange
     * @function
     * @param {Ext.tree.TreeNode} node
     * @param {Boolean} checked
     */
    onLayerCheckboxChange: function(node,checked) {


        // redraw
        node.attributes.hsLayer.setVisibility(checked);

        // trigger evernt
        node.attributes.hsLayer.__layer.map.events.triggerEvent("changelayer");
    },

    /**
     * Will (un)check all layers within the group
     * @name HSLayers.Layer.MapServer.onGroupCheckboxChange
     * @function
     * @param {Ext.tree.TreeNode} node
     * @param {Boolean} checked 
     */
    onGroupCheckboxChange: function(node,checked) {
        //for (var i = 0; i < node.childNodes.length; i++) {
        //    if (node.childNodes[i].getUI().checkbox) {
        //        node.childNodes[i].getUI().checkbox.checked = checked;
        //        if (node.childNodes[i].childNodes) {
        //            this.onGroupCheckboxChange(node.childNodes[i], checked);
        //        }
        //    }
        //}
        node.attributes.hsGroup.setVisibility(checked);
    },

    /**
     * Called, when the button under the legend was clicked. Show/Hide legend for all groups. 
     * @name HSLayers.Layer.MapServer.onShowLegendClicked
     */
    onShowLegendClicked: function() {
        var show = HSLayers.Control.LayerSwitcher.prototype.onShowLegendClicked.apply(this,arguments);

        var expand = function(node) {
            node.expand();
        };

        // HSMapServer legends
        for (i = 0; i < this.legendNodes.length; i++) {
            var parNode = this.legendNodes[i].parentNode;

            if (show) {
                if (parNode.getUI().checkbox.checked) {
                    parNode.bubble(expand);
                }
            }
            else {
                parNode.collapse();
            }
        }
    },

    /**
     * Display layer menu
     * @name HSLayers.Control.LayerSwitcher.onHSLayerRightClick
     * @function
     * @param {Ext.tree.TreeNode} node
     * @param {Event} evt
     */
    onHSLayerRightClick: function(node, evt) {

        var menu = new Ext.menu.Menu({
            id: 'layerMenu',
            items: [{text:layer.title,canActivate:false,style:"font-weight:bold;"}]});
        menu.addSeparator();

        var items = [];
        if (layer.metadata) {
            var item = menu.add({text:OpenLayers.i18n("Layer metadata")});
            item.on("click",function() {open(layer.metadata); });
            items.push(item);
        }
        if (layer.source) {
            var item = menu.add({text:OpenLayers.i18n("Download layer")});
            item.on("click",function() { open(layer.source); });
            items.push(item);
        }

        if (items.length > 0)  {
            menu.show(evt.target);
        }
        evt.stopEvent();
    },

    /**
     * @name HSLayers.Control.LayerSwitcher.onNodeDragOver
     * @param {Event} de
     */
    onNodeDragOver: function(de) {

        if (!!de.target.attributes.hsGroup == true &&
            !!de.data.node.attributes.hsGroup  != true) {
            de.cancel = true;
        }
    },

    /**
     * @name HSLayers.Control.LayerSwitcher.MultiLayer.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Control.LayerSwitcher.MultiLayer"
});
