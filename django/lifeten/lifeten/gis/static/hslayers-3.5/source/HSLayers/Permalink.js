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
 * Modified OpenLayers.Control.Permalink 
 * @class HSLayers.Permalink
 * @augments Ext.Button
 * @constructor
 * @example
 *
 * var permalink = new HSLayers.Permalink({map: new OpenLayers.Map("map")});
 */
HSLayers.Permalink = Ext.extend(Ext.Button, {
    
    /**
     * @name HSLayers.Permalink.tooltip
     * @type HSLayers.Permalink.PermalinkWindow
     */
    tooltip: null,

    /**
     * @name HSLayers.Permalink.map
     * @type OpenLayers.Map
     */
    map: null,

    /**
     * @name HSLayers.Permalink.project
     * @type String
     */
    project: null,

    /**
     * @private
     * @name HSLayers.Permalink._url
     * @type {String}
     */
    _url: null,

    /**
     * @private
     */
    initComponent: function() {
        config = {
                cls: 'x-btn-icon',
                icon: OpenLayers.Util.getImagesLocation()+"world_link.png",
                handler: this.displayTooltip,
                scope: this
        };

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.Permalink.superclass.initComponent.apply(this,arguments);
    },

    /**
     * Display the tooltip window
     * @function
     * @name HSLayers.Permalink.displayToolkit
     */
    displayTooltip: function(){
        if (!this.tooltip) {
            this.tooltip = new HSLayers.Permalink.PermalinkWindow({target:this.id,
                anchor: 'bottom',
                width: 300,
                autoHide: false,
                closable: true,
                html: ""
            });
            Ext.QuickTips.init();
            this.tooltip.setMap(this.map);
        }
        this.updateUrl();
        this.tooltip.showAt(this.getPosition().map(function(a){return a+16;}));
        //this.tooltip.setUrl("http://moje/neco");
        this.tooltip.setUrl(this._url);
    },

    /**
     * Update Peralink URL
     * @function
     * @name HSLayers.PermalinkWindow.updateUrl
     */
    updateUrl: function() {

        var format = new HSLayers.Format.State();
        var context = {"data":format.map2json(this.map,false)};
        var json = new OpenLayers.Format.JSON();
        var id = this.map.generateUuid();

        context.request="save";
        context.id = id;
        context.project = this.project;
        context.permalink = true;
        
        var xhr = OpenLayers.Request.POST({
            url: HSLayers.statusManagerUrl,
            data: json.write(context),
            async: false,
            scope: this
        });

        var result = json.read(xhr.responseText);
        if (result.success === true) {
            var href =  document.location.href;
            if (href.indexOf('?') != -1) {
                href = href.substring( 0, href.indexOf('?') );
            }
            var params = OpenLayers.Util.getParameters(href);
            params.permalink = id;

            this._url = OpenLayers.Util.urlAppend(href,OpenLayers.Util.getParameterString(params));
        }
        else {
            this._url = undefined;
        }
    },

    /**
     * @function
     * @name HSLayers.PermalinkWindow.setMap
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
    },

    /**
     * read permalink
     * @function
     * @name HSLayers.PermalinkWindow
     */
    read: function() {
        var params = new OpenLayers.Util.getParameters();
        if (!params.permalink) {
            this.fireEvent("read",{content:undefined});
        }
        else {
            OpenLayers.Request.GET({
                url: HSLayers.statusManagerUrl,
                params: {
                    id: params.permalink,
                    project: this.project,
                    request: "load"
                },
                success: function(xhr) {
                    var data = new OpenLayers.Format.JSON().read(xhr.responseText);
                    if (data.success) {
                        this.parsePermalink(data);
                    }
                },
                scope: this
            });
        }
    },

    /**
     * parse permalink data
     * @function
     */
    parsePermalink: function(permalink) {
        //var state = this.map.getControlsBy("CLASS_NAME","HSLayers.Control.ReadState");
        //if (state) {
        //    state[0].parseState(permalink);
        //}
        this.map.loadComposition(permalink);
        this.fireEvent("read",permalink);
    },

    
    /**
     * @name HSLayers.Control.Permalink.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Permalink"
});

// not used anymore
HSLayers.Permalink.PermalinkURL = "/cgi-bin/hspermalink.py";
