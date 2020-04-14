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
 * Layer's TreeNode for HSLayers.Layer.MapServer.Group
 *
 * @augments Ext.tree.Node
 * @class HSLayers.LayerSwitcher.TreeLayerFolderNode
 */

HSLayers.LayerSwitcher.TreeLayerFolderNode = Ext.extend(Ext.tree.TreeNode, {
    group: undefined,
    checkState: undefined,

    constructor: function(config) {

        config = config || {};
        this.group = config.group;

        // init
        // defaults 
        Ext.apply(config, {
            checked: false,
            allowChildren: true,
            allowDrag: false,
            allowDrop: false,
            expandable : true,
            checkState: 1,
            leaf : false,
            text : this.group.title,
            editable: false,
            icon: undefined, // group.icon,
            expanded: false,
            group: this.group
        });


        HSLayers.LayerSwitcher.TreeLayerFolderNode.superclass.constructor.apply(this, [config]);
        this.checkState = 1;
        this._origState = 1;

        this.addListener("checkchange",this._onCheckChange, this);
        this.addListener("append", function(tree,pnode,node) {
                    node.on("checkchange",this._onChildNodeCheckChange, this);
                }, this);

    },

    _onCheckChange: function(node, checked) {

            node.cascade(function(node) {

                // this node is a GROUP node
                if (this.group) {
                    if (node == this) {
                        this.checkState = ++this.checkState > 2 ? 0 : this.checkState;
                    }
                    else {
                        switch(this.parentNode.checkState) {
                            case 0:
                                this.checkState = 0;
                                break;
                            case 1:
                                this.checkState = this._origState;
                                break;
                            case 2:
                                this._origState = this.checkState;
                                this.checkState = 2;
                                break;
                        }
                    }
                    //this.group.toggleVisibility(checked,false);
                    this._setCheckboxState();
                }
                // this node is a LAYER node
                else {
                    switch(this.parentNode.checkState) {
                        case 0:
                            this.layer.toggleVisibility(false);
                            break;
                        case 1:
                            this.layer.toggleVisibility(this._visible);
                            break;
                        case 2:
                            this._visible = this.layer.visibility;
                            this.layer.toggleVisibility(true);
                            break;
                    }
                }
            }, undefined, [node]);
            this.group.layer.redraw(true);
    },

    /**
     * set checbox state
     * @private
     * @function
     * @param Integer state
     */
    _setCheckboxState: function(state) {
        state = state || this.checkState;
        switch(this.checkState) {
            case 0:
                this.getUI().checkbox.indeterminate = false;
                this.getUI().checkbox.checked = false;
                break;
            case 1:
                this.getUI().checkbox.checked = false;
                this.getUI().checkbox.indeterminate = true;
                break;
            case 2:
                this.getUI().checkbox.indeterminate = false;
                this.getUI().checkbox.checked = true;
                break;
        }
    },

    /**
     * on child node check change
     * @function
     * @private
     */
    _onChildNodeCheckChange: function(node,e) { 
        var nr = 0;
        var ind = 0;
        var state = this.checkState;
        this.un("checkchange",this._onCheckChange, this);
        for (var i = 0, ilen = this.childNodes.length; i < ilen; i++) {
            var node = this.childNodes[i];
            if (node.getUI().checkbox.checked) {
                nr++;
            }
            if (node.getUI().checkbox.indeterminate) {
                ind++;
            }

        }
        // no child node checked - switch off
        if (nr === 0 && ind === 0) {
            this.getUI().checkbox.indeterminate = false;
            this.getUI().checkbox.checked = false;
            this.checkState = 0;
        }
        // every child node is checked - switch on
        else if (nr == this.childNodes.length) {
            this.getUI().checkbox.indeterminate = false;
            this.getUI().checkbox.checked = true;
            this.checkState = 2;
        }
        // some are, some not - make the middle state
        else if (nr !== 0 && nr != this.childNodes.length || ind > 0) {
            this.getUI().checkbox.checked = false;
            this.getUI().checkbox.indeterminate = true;
            this.checkState = 1;
        }
        // this should not happen
        else {
            //console.log(this.text, "??", nr, ind);
        }

        // state change, call event
        if(state != this.checkState && this.parentNode && this.parentNode._onChildNodeCheckChange) {
            this.parentNode._onChildNodeCheckChange(this, e);
        }

        this.on("checkchange",this._onCheckChange, this);
    },

    render: function() {
        Ext.tree.TreeNode.prototype.render.apply(this,arguments);
        if(this.checkState == 1) {
            this.getUI().checkbox.indeterminate = true;
        }
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.TreeLayerNode"
});
