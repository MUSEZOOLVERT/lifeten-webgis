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
 * Layer's TreeNode
 *
 * @augments Ext.tree.Node
 * @class HSLayers.LayerSwitcher.FolderNode
 */

HSLayers.LayerSwitcher.FolderNode = Ext.extend(Ext.tree.TreeNode, {

    /**
     * check state
     * 0 - unchecked
     * 1 - checked - all layers visible
     * 2 - checked - only selected layers visible
     */
    checkState: undefined,


    /**
     * initComponent
     * @constructor
     */
    constructor: function(config) {
        config = config || {};

        // init defaults 
        Ext.apply(config,{
            text: config.text || OpenLayers.i18n("New folder"),
            checked: true,
            checkState: 1,
            allowDrop: true,
            //cls:"x-tree-node-collapsed",
            cls: "checkstate-1",
            allowDrag: true,
            leaf: false
        });


        //this.checkbox.indeterminate = true;

        HSLayers.LayerSwitcher.FolderNode.superclass.constructor.apply(this, [config]);
        this.checkState = 1;

        // listeners
        this.addListener("checkchange",this._onCheckChange, this);
        this.addListener("contextmenu",this._onShowFolderMenuClicked, this);
        this.addListener("click",this._onShowFolderMenuClicked, this);
        //this.addListener("remove",this._onNodeRemoved, this);
        this.addListener("append",this._onNodeAppend, this);
        this.addListener("insert",this._onNodeAppend, this);

        
    },

    /**
     * render function
     * @function
     * @private
     */
    render: function(){
        HSLayers.LayerSwitcher.FolderNode.superclass.render.apply(this,arguments);

        if (this.checkState == 1 && this.getUI().checkbox) {
            this.getUI().checkbox.indeterminate = true;
            this.getUI().checkbox.checked = false;
        }
    },

    /**
     * destroy function
     * @function
     * @private
     */
    destroy: function() {

        HSLayers.LayerSwitcher.FolderNode.superclass.destroy.apply(this, arguments);
    },

    /**
     * Called, when check was changed
     * @private
     * @function
     */
    _onCheckChange: function(node, checked){
        this.checkState = ++this.checkState > 2 ? 0 : this.checkState;
        this._setCheckboxState(this.checkState);

        node.cascade(function(parentCheck) {
            // layer node
            if (this.layer && this.getUI().checkbox) {
                this.un("checkchange",this.parentNode._onChildNodeCheckChange, this.parentNode);
                switch(parentCheck) {
                    case 0:
                        this.layer.setVisibility(false);
                        break;
                    case 1:
                        this.layer.setVisibility(this._visible);
                        break;
                    case 2:
                        this._visible = this.layer.getVisibility();
                        this.layer.setVisibility(true);
                        break;
                }
                this.on("checkchange",this.parentNode._onChildNodeCheckChange, this.parentNode);
            }
            // folder node
            else if(this._setCheckboxState){
                this._setCheckboxState(parentCheck);
                this.setCls("checkstate-"+String(this.checkState));
                
                //if (this.getUI().checkbox && this.getUI().checkbox.checked != checked) {
                //    this.getUI().checkbox.checked = checked;
                //}
            }
            else {
                //console.log("legend");
            }

        },undefined, [this.checkState]);
    },

    /**
     * set checkbox state
     * @private
     * @function
     * @param Integer state
     */
    _setCheckboxState: function(state) {
        state = (state === undefined ? this.checkState : state);
        if (this.getUI().checkbox) {
            switch(state) {
                case 0:
                    this.getUI().checkbox.checked = false;
                    this.getUI().checkbox.indeterminate = false;
                    break;
                case 1:
                    this.getUI().checkbox.indeterminate = true;
                    this.getUI().checkbox.checked = false;
                    break;
                case 2:
                    this.getUI().checkbox.checked = true;
                    this.getUI().checkbox.indeterminate = false;
                    break;
            }
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
            if (!node.getUI().checkbox) {
                continue;
            }

            if (node.getUI().checkbox.checked) {
                nr++;
            }
            if (node.getUI().checkbox.indeterminate) {
                ind++;
            }

        }
        // no child node checked - switch off
        if (nr === 0 && ind === 0) {
            if(this.getUI().checkbox) {
                this.getUI().checkbox.indeterminate = false;
                this.getUI().checkbox.checked = false;
            }
            this.checkState = 0;
        }
        // every child node is checked - switch on
        else if (nr == this.childNodes.length) {
            if(this.getUI().checkbox) {
                this.getUI().checkbox.indeterminate = false;
                this.getUI().checkbox.checked = true;
            }
            this.checkState = 2;
        }
        // some are, some not - make the middle state
        else if (nr !== 0 && nr != this.childNodes.length || ind > 0) {
            if(this.getUI().checkbox) {
                this.getUI().checkbox.checked = false;
                this.getUI().checkbox.indeterminate = true;
            }
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

    /**
     * show folder menu
     * @function
     * @private
     */
    _onShowFolderMenuClicked: function(node,e) { 
        
        var menu = new HSLayers.LayerSwitcher.FolderMenu({
            folderNode: this
        });

        menu.show(node.getUI().textNode);
    },

    /**
     * on layer node removed, drop folder as well?
     * @function
     * @private
     */
    _onNodeRemoved: function(tree,folderNode,node) { 
        if (this.childNodes.length === 0) {
            this.collapse();
            this.parentNode.collapse();
            this.remove();
        }
    },

    /**
     * on layer node append, expand
     * @function
     * @private
     */
    _onNodeAppend: function(tree,folderNode,node,idx) { 
        this.expand();
        node.on("checkchange",this._onChildNodeCheckChange, this);
    },

    /**
     * get structure of this node
     * @function
     * @name HSLayers.LayerSwitcher.FolderNode.getStructure
     */
    getStructure: function() {
        var structure = {};

        for (var i = 0, len = this.childNodes.length; i < len; i++) {
            var node = this.childNodes[i];
            if (node instanceof HSLayers.LayerSwitcher.LayerNode ||
                node instanceof (HSLayers.LayerSwitcher.FolderNode)) {
                structure[i] = node.getStructure();
            }
        }

        return {name: this.text, type: "folder", structure: structure};

    },

    CLASS_NAME: "HSLayers.LayerSwitcher.FolderNode"
});
