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
 * @class HSLayers.LayerSwitcher.LogicalPanel
 */

HSLayers.LayerSwitcher.LogicalPanel = Ext.extend(HSLayers.LayerSwitcher.Panel, {

    /**
     * @name HSLayers.LayerSwitcher.title
     * @type {String}
     */
    title: "Logical Order",

    /**
     * @private
     * @function
     */
    initComponent: function() {
        Ext.apply(this, {
            title: OpenLayers.i18n(this.title),
            tabTip: OpenLayers.i18n("Organize layers to thematic groups"),
            bbar: [{
                scope: this,
                handler: this._onAddGroupClicked,
                cls: 'x-btn-icon',
                tooltip: OpenLayers.i18n("Create new folder"),
                icon: OpenLayers.Util.getImagesLocation()+'/add-folder.gif'
            }]
        });

        HSLayers.LayerSwitcher.LogicalPanel.superclass.initComponent.apply(this, arguments);

        // register drat
        this.addListener("dragdrop",this._onDragDrop, this);
    },

    /**
     * @function
     * @private
     */
    _onAddGroupClicked: function() {
        var node = new HSLayers.LayerSwitcher.FolderNode();
        this.getRootNode().insertBefore(node,this.getRootNode().firstChild);
    },

    /**
     * update path given by layer
     * @function
     * @name HSLayers.LayerSwitcher.updatePath
     * @param {OpenLayers.Layer} layer
     */
    updatePath: function(layer) {
        var node = this.getRootNode().findChild("layer",layer,true);
        if (node) {
            var target = this.getNodeForPath(layer.path);
            target.appendChild(node);
        }
    },

    /**
     * @function
     * @private
     */
    _onDragDrop: function(thisPanel, node, dd, e) {

        // set layer path
        if (node.layer) {
            this.setLayerPath(node.layer, this.getLayerPath(node));
        }
    },

    /**
     * @function
     * @private
     */
    getLayerPath: function(node) {

        var path = node.getPath("text").split(this.pathSeparator).slice(2);
        return path.slice(0,path.length-1);
    },

    /**
     * Set path property of the layer, according to this tree
     * @function
     * @name HSLayers.LayerSwitcher.LogicalPanel.setLayerPath
     * @param [{String}] path
     */
    setLayerPath: function(layer,path) {
        if (layer.path != path) {
            layer.path = path.join(this.pathSeparator);
        }
    },

    /**
     * Find and potentialy create folder structure based on given path
     * @function
     * @name HSLayers.LayerSwitcher.LogicalPanel.getNodeForPath
     * @param {String} path "/" separated
     * @return {Ext.tree.TreeNode} 
     */
    getNodeForPath: function(path) {
        if (path) {
            return this._getNodeForPathRecursive(path, this.getRootNode());
        }
        else {
            return this.getRootNode();
        }
    },

    /**
     * Return or create fodler node recursively
     * @function
     * @name HSLayers.LayerSwitcher.LogicalPanel._getNodeForPathRecursive
     * @param {String} path node text, "/" separated
     * @return {Ext.tree.TreeNode} 
     */
    _getNodeForPathRecursive: function(path,parentNode) {
        var name = path.split(this.pathSeparator)[0];

        var node = parentNode.findChild("text",name);
        if (!node) {
            node = new HSLayers.LayerSwitcher.FolderNode({text: name,expanded: true});
            parentNode.insertBefore(node,parentNode.firstChild);
        }

        if (path.split(this.pathSeparator).length > 1) {
            return this._getNodeForPathRecursive(path.split(this.pathSeparator).slice(1).join(this.pathSeparator), node);
        }
        else {
            return node;
        }
    },


    /**
     * @function
     * @private
     */
    _onTreeEditComplete: function(editor, newtitle, oldtitle) {

        if (this.treeEditor.editNode instanceof HSLayers.LayerSwitcher.FolderNode) {
            this.treeEditor.editNode.setText(newtitle);
            this.treeEditor.editNode.cascade(function(panel) {
                if (this.layer) {
                    //this.setLayerPath();
                    panel.setLayerPath(this.layer, panel.getLayerPath(this));
                }
            },undefined, [this]);

        }

        HSLayers.LayerSwitcher.LogicalPanel.superclass._onTreeEditComplete.apply(this, arguments);
    },

    /**
     * Get JSON structure of this logical panel
     * @function
     * @name HSLayers.LayerSwitcher.LogicalPanel.getStructure
     * @returns {Object} tree layer structure
     */
    getStructure: function() {
        // TODO: For Ext4, this should be done with help of TreeStore
        var structure = {};

        var rnode = this.getRootNode();
        for (var i =0, len = rnode.childNodes.length; i < len; i++) {
            var node = rnode.childNodes[i];
            if (typeof(node.getStructure) == "function") {
                structure[i] = node.getStructure();
            }
        }
        return structure;
    },

    /**
     * Set JSON structure of this logical panel, based on structure
     * generated by getStructure
     * @function
     * @name HSLayers.LayerSwitcher.LogicalPanel.setStructure
     */
    setStructure: function(structure, parentNode) {
        // TODO: For Ext4, this should be done with help of TreeStore

        parentNode = parentNode || this.getRootNode();

        // define node search function
        // searches nodes based on their type ("folder" vs. "layer") and
        // text (layer.name vs. node.text)
        var findNode = function(n) {
                if (this.type && this.type == "folder") {
                    if (n.text == this.name)  {
                        return true;
                    }
                }
                else if (this.type && this.type == "layer") {
                    if (n.layer && n.layer.name == this.name) {
                        return true;
                    }
                }
            };
        // sorting is 2 steps process
        // in this for loop, assign just _struc_idx attribute to each node
        // - the index, it has in the structure and _node attribute
        for (var i in structure) {
            var struct = structure[i];
            var node = parentNode.findChildBy(findNode, struct,false);

            if (node) {
                node._struct_idx = parseInt(i);
                struct._node = node;
            }
        }

        // define sort function
        var sort = function(node1,node2) {
            if (node1._struct_idx < node2._struct_idx) {
                return -1;
            }
            else if (node1._struct_idx > node2._struct_idx) {
                return 1;
            }
            else {
                return 0;
            }

        };

        // call the sort function for all child nodes of the parentNode
        parentNode.sort(sort);

        // in this secod loop, go through all nodes, if the node is folder
        // node, than call setStructure itertively
        for (var i in structure) {
            var struct = structure[i];
            if (struct && struct._node) {
                if (struct.type == "folder") {
                    struct._node.sort(sort);
                    this.setStructure(struct.structure, struct._node);
                }
            }
        }
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.LogicalPanel"
});
