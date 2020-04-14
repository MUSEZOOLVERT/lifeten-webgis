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
HSLayers.namespace("HSLayers.Permalink");

HSLayers.Permalink.PermalinkWindow = function(config)  {
    config = config || {};
    this.target = config.target;

    HSLayers.Permalink.PermalinkWindow.superclass.constructor.call(this,config);
};

/**
 * Tooltip window, which will render the permalink
 * @class HSLayers.Permalink.PermalinkWindow
 */
HSLayers.Permalink.PermalinkWindow = Ext.extend(Ext.ToolTip, {

    /**
     * {Ext.Button}
     */
    target: undefined,

    /**
     * {String}
     */
    url: undefined,

    /**
     * {OpenLayers.Map}
     */
    map: undefined,

    /**
     * @private
     */
    initComponent: function() {
        var config = {
            title: OpenLayers.i18n("permalink"),
            target: this.button,
            anchor: 'bottom',
            width: 300,
            autoHide: false,
            closable: true,
            html: this.url
        };

        config.items = this._initComponents();

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.Permalink.PermalinkWindow.superclass.initComponent.apply(this,arguments);
    },

    /**
     * @private
     */
    _initComponents: function() {
        this.linkPanel = new Ext.Panel({
            title: OpenLayers.i18n("Link"),
            html:""
        });

        this.anchorPanel = new Ext.Panel({
            title: OpenLayers.i18n("Link for your webpage"),
            html:""
        });
        
        this.layersPanel = new Ext.Panel({
            title: OpenLayers.i18n("Visible layers only"),
            html:""
        });

        return [this.linkPanel, this.anchorPanel, this.layersPanel];
    },

    /**
     * @name HSLayers.Permalink.PermalinkWindow.setUrl
     * @function
     * @param {String} url
     */
    setUrl: function(url){
        if (!url) {
            this.linkPanel.update(OpenLayers.i18n("Saving permalink failed"));
            this.anchorPanel.update("");
            this.layersPanel.update("");
        }

        this.url = url;
        try {
        this.linkPanel.update("<a id=\""+this.id+"_link\" href=\""+url+"\" target=\"_blank\">"+url+"</a>");


        this.anchorPanel.update("&lt;a href=\""+url+" target=\"_blank\"&gt;"+url+"&lt;/a&gt;");

        var layersurl = OpenLayers.Util.urlAppend(window.location.href,
                "hslayers="+this.map.getLayersBy("visibility",true).map(function(l){return l.name;}).join(","));

        this.layersPanel.update("<a id=\""+this.id+"_layers_link\" href=\""+layersurl+"\" target=\"_blank\">"+layersurl+"</a>");

        // close on click
        var elem = Ext.get(this.id+"_link");
        elem.on("click",this.hide,this);

        }catch(e){
            console.log(e);
        }
    },

    /**
     * set map object
     * @function
     * @name HSLayers.Permalink.PermalinkWindow.setMap
     * @param {OpenLayers.Map} map
     */
    setMap:function(map) {
        this.map = map;
    }
});
