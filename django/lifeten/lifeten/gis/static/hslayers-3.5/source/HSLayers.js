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
 * HSLayers namespace. Within this namespace, some base functions and
 * attributes are defined.
 * @namespace
 */
HSLayers = { };

/**
 * Version of HSLayers, e.g. "3.3"
 * @constant
 * @static
 * @type String
 */
HSLayers.version  = "3.5";

/**
 * URL of renderer of ISO-encoded metadata. Default value points to czech national INSPIRE geoportal http://geoportal.gov.cz
 * @constant
 * @default http://geoportal.gov.cz/php/catalogue/libs/cswclient/cswClientRun.php?template=iso2html.xsl&metadataURL=
 */
HSLayers.MetadataViewerURL = "http://geoportal.gov.cz/php/catalogue/libs/cswclient/cswClientRun.php?template=iso2html.xsl&metadataURL=";

/**
 * URL of the status manager, used by :class:`HSLayers.Control.State`
 * @constant
 * @default /statusmanager/index.php
 */
HSLayers.statusManagerUrl = "/statusmanager/index.php";

// Return Location of HSLayers.js (directory)
HSLayers.getLocation = function () {
    var scripts = document.getElementsByTagName("script");
    var r = new RegExp("(^|(.*?\\/))(" + "HSLayers.js" + ")(\\?|$)");
    for (var i = 0, len = scripts.length; i < len; i++) {
        src = scripts[i].getAttribute('src');
        if (src) {
            var m = src.match(r);
            if (m) {
                return m[1];
            }
        }
    }
};


/**
 * Add namespace to object, if this does not exist yet.
 * This method should be used always, when new class is defined
 * @function
 */
HSLayers.namespace = function() {
    var a=arguments, o=null, i, j, d, rt;

    for (var i=0; i < arguments.length; i++) {
        var names = arguments[i].split(".");
        var root = names[0];

        eval('if (typeof ' + root + ' == "undefined"){' + root + ' = {};} var out = ' + root + ';');

        for (var j=1; j < names.length; j++) {
            out[names[j]]=out[names[j]] || {};
            out=out[names[j]];
        }
    }
};


/**
 * Modifies :class:`Ext.Panel`, so it will be dockable
 * @function
 * @private
 */
HSLayers._setDockable = function() {
        
    if (window.Ext) {
        Ext.override(Ext.Panel, {
            _win: undefined,
            _helpWin: undefined,
            _ownerCt: undefined,
            helpLink: undefined,
            
            // private
            //initDraggable : function(){
            //    /**
            //    * <p>If this Panel is configured {@link #draggable}, this property will contain
            //    * an instance of {@link Ext.dd.DragSource} which handles dragging the Panel.</p>
            //    * The developer must provide implementations of the abstract methods of {@link Ext.dd.DragSource}
            //    * in order to supply behaviour for each stage of the drag/drop process. See {@link #draggable}.
            //    * @type Ext.dd.DragSource.
            //    * @property dd
            //    */

            //    if (this.draggable === true) {
            //        this.draggable = {
            //            isTarget: false,
            //            onDrag: this._onDrag,
            //            onBeforeDrag: this._onBeforeDrag,
            //            endDrag: this._endDrag,
            //            b4startDrag: function() {
            //                if (!this.el) {
            //                    this.el = Ext.get(this.getEl());
            //                }

            //                this.originalXY = this.el.getXY();
            //            },
            //        };
            //    }
            //    this.dd = new Ext.Panel.DD(this, Ext.isBoolean(this.draggable) ? null : this.draggable);
            //},

            makeDockable: function() {
                    var o = this.ownerCt;
                    //if (!o) {
                    //    return;
                    //}
                    // tab in the TabPanel
                    if (o instanceof Ext.TabPanel) {
                        Ext.fly(o.getTabEl(this)).on("dblclick", this.undock, this);
                    }
                    // common panel
                    else {
                        if (this.helpLink /*this.getTool("help")*/) {
                            this.addTool({id:"help",qtip:OpenLayers.i18n("Help"), scope: this, handler:this._onHelp});
                        }
                        this.addTool({id:"unpin",scope:this,handler:this.undock,qtip: OpenLayers.i18n("Dock")});
                        if (this.closable) {
                            this.addTool({id:"close",scope: this, handler:this._onCancel, qtip: OpenLayers.i18n("Close")});
                        }
                    }

                    this.addEvents("docked","undocked");
                    this.docked = true;
            },
            
            undock: function() {


                    if (this.ownerCt) {
                        this._ownerCt = this.ownerCt;
                    }
                    var itemNr = this._ownerCt.items.findIndex("id",this.id);
                    
                    this.expand();
                    this.doLayout();
                    if (itemNr > -1) {
                        this._ownerCt.layout.setActiveItem(itemNr);
                    }

                    var h,w;
                    if (this.getEl()) {
                        h = this.getEl().getHeight();
                        w = this.getEl().getWidth();
                    }
                    else {
                        h = this.initialConfig.height || 300;
                        w = this.initialConfig.width || 300;
                    }

                    this._ownerCt.remove(this,false);

                    var tools = [];
                    if (this.helpLink /*this.getTool("help")*/) {
                        tools.push({id:"help", qtip:OpenLayers.i18n("Help"), scope: this, handler:this._onHelp});
                    }
                    tools.push({
                            id: 'pin',
                            qtip: OpenLayers.i18n('Redock to original parent'),
                            handler: this.dock,
                            scope: this
                    });

                    this._win = new Ext.Window({
                            renderTo: Ext.getBody(),
                            title: this.title,
                            constrain: true,
                            items: [this],
                            collapsible:true,
                            maximizable: true,
                            autoDestroy: true,
                            closable: this.closable,
                            listeners: {
                                scope:this._win
                            },
                            tools: tools
                    });

                    if (!(this._ownerCt instanceof Ext.TabPanel)) {
                        this.header.setStyle("display","none");
                    }

                    this._win.setHeight(h);
                    this._win.setWidth(w);
                    this._ownerCt.doLayout();
                    this._win.show();
                    this.doLayout();

                    this._win.on("bodyresize",function(p,w,h){
                                    this.setHeight(h);
                                    this.setWidth(w);
                                    },this);

                    this.docked = false;
                    this.fireEvent("undocked");
            },


            dock : function() {
                    this._win.remove(this,false);
                    //
                    // collapse all other items
                    for (var i = 0; i < this._ownerCt.items.length; i++) {
                        var item = this._ownerCt.items.get(i);
                        item.collapse();
                        item.doLayout();
                    }

                    this._ownerCt.add(this);

                    var pinTool = this.getTool("pin");

                    if (this._ownerCt instanceof Ext.TabPanel) {
                        this._ownerCt.setActiveTab(this);
                    }
                    else {
                        this.header.toggle(true);
                    }

                    var itemNr = this.ownerCt.items.findIndex("id",this.id);
                    this.expand();
                    this.ownerCt.layout.setActiveItem(itemNr);
                    this._ownerCt.doLayout();
                    this._win.destroy();
                    this.makeDockable(); // The tab selector is new.
                    this.fireEvent("docked");
            },

            _onCancel: function() {
                if (this.ownerCt) {
                    this.ownerCt.remove(this);
                }
                if (this._win) {
                    this._win.close();
                }
            },

            _onDrag: function(e) {

            },

            _onBeforeDrag: function(e) {
                this.panel.undock();
                this.panel._win.dd.startDrag();

            },
            
            _endDrag: function(e) {
            },


            _onHelp: function(evt, button, panel, config,lang) {
                var w = window.open(this.helpLink, "help");
                w.focus();
                return;
                var path = panel._getHelpUrl();
                if (panel._helpWin) {
                    panel._helpWin.hide();
                    panel._helpWin.destroy();
                }
                panel._helpWin = new Ext.ToolTip({
                    title: OpenLayers.i18n("Help for")+" "+panel.title || panel.CLASS_NAME,
                    html: null,
                    width: 400,
                    height: 400,
                    autoScroll:true,
                    anchor: "top",
                    target: button,
                    preventBodyReset: true,
                    autoHide: false,
                    closable: true,
                    autoLoad: {
                        url: path,
                        nocache: true,
                        scripts: true,
                        text: OpenLayers.i18n("Loading help ..."),
                        lang: lang,
                        target: button,
                        callback: panel._onHelpArrived,
                        scope: panel
                    }
                });
                //win.showAt(evt.xy);
                panel._helpWin.show();
            },

            _onHelpArrived: function(el, success, response, options) {
                if (success === false && options.lang != "en") {
                    this._onHelp(undefined, options.target, this, this.getTool("help"),"en");
                }
                else if (success === false) {
                    el.update(OpenLayers.i18n("No help found"));
                }
                else {
                    el.setHeight (400);
                }
            },

            _getHelpUrl: function(lang) {
                var hslpath =  HSLayers.getLocation();
                if (hslpath.search("build") > -1) {
                    return hslpath + "/help/"+ (lang || OpenLayers.Lang.getCode())+"/"+this.CLASS_NAME+".html";
                }
                else {
                    return hslpath + "/../../resources/help/"+ (lang || OpenLayers.Lang.getCode())+"/"+this.CLASS_NAME+".html";
                }
            }


        }); // /overwrite

    }
};

HSLayers._setDockable();


'use strict';

/**
 * Modify prototype of basic data types: String,  Function, Array
 */
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s*/, "").replace(/\s*$/, "");
    }
}

if (!String.prototype.normalizeSpace ) {
    String.prototype.normalizeSpace = function() {
        return this.replace(/^\s*|\s(?=\s)|\s*$/g, "");
    }
}


// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind= function(owner) {
        var that= this;
        if (arguments.length<=1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args= Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim= function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf= function(find, i /*opt*/) {
        if (i===undefined) i= this.length-1;
        if (i<0) i+= this.length;
        if (i>this.length-1) i= this.length-1;
        for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach= function(action, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter= function(filter, that /*opt*/) {
        var other= [], v;
        for (var i=0, n= this.length; i<n; i++)
            if (i in this && filter.call(that, v= this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}
