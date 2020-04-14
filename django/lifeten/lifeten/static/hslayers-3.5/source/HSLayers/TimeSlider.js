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

Ext4.namespace("HSlayers","HSLayers.TimeSlider");
Ext4.define("HSLayers.TimeSlider", {
    extend: "Ext4.tree.TreePanel",
    requires: [
        "HSLayers.TimeSlider.Slider",
        "HSLayers.TimeSlider.LayerMenu",
        "HSLayers.TimeSlider.Model"
    ],

    /**
     * index of last used color
     * @pravate
     */
    _coloridx: 0,

    /**
     * map
     * @type OpenLayers.Map
     * @name HSLayers.TimeSlider.map
     */
    map: undefined,

    /**
     * layers
     * @type [OpenLayers.Layer]
     * @name HSLayers.TimeSlider.layers
     */
    layers: undefined,

    /**
     * minvalue
     * @type Float
     * @name HSLayers.TimeSlider.min
     */
    min: undefined,

    /**
     * maxvalue
     * @type Float
     * @name HSLayers.TimeSlider.max
     */
    max: undefined,

    /**
     * fade
     * @type Boolean
     * @name HSLayers.TimeSlider.fade
     */
    fade: false,

    /**
     * @constructor
     * @param config {Object}
     */
    constructor: function(config) {

        this.slider = Ext4.create("HSLayers.TimeSlider.Slider",{
            listeners: {
                scope: this,
                timewindowchange: this._onTimeWindowChange
            }
        });

        config.tbar = [{xtype:"component",width:45, style:{top:"10px"}},
                       this.slider,
                       {xtype:"component",width:45, style:{top:"10px"}}];
        config.bbar = [
                {
                    text: OpenLayers.i18n("Reset"),
                    scope: this,
                    handler: function() {
                        this.zoomToTime(this.min, this.max);
                    }
                },
                "->",
                {
                    xtype: "container",
                    html: OpenLayers.i18n("Display time")+": "
                },
                {
                    xtype: "container"
                }
        ];
        config.store = Ext4.create('Ext.data.TreeStore', {
            model: "HSLayers.TimeSlider.Model",
            root: {
                expanded: true,
                children: [
                ]
            }
        });
        config.rootVisible = false;
        if (config.fade) {
            config.style =  {
                opacity: 0.3
            };
        }


        // overwrite getRowClass
        // layers, which are outside of current time extent are marked gray
        config.viewConfig = {
            //getRowClass: function(record, index, rowParams, store) {
            //    var panel = this.up("panel");
            //    if (record.data.min > panel.slider.maxValue ||
            //        record.data.max < panel.slider.minValue) {
            //            return "row-notintime";
            //        }
            //    else {
            //        return "row-intime";
            //    }
            //}
        };

        config.hideHeaders = true;
        config.columns = [{
                xtype: "treecolumn",
                flex: 2,
                dataIndex: "text"
            },
            {
                //xtype: "",
                flex: 1,
                width: 100,
                dataIndex: "mydate"
            },
            {
                xtype: "actioncolumn",
                width: 20,
                icon: OpenLayers.Util.getImagesLocation()+"/time_zoomin.png",
                tooltip: OpenLayers.i18n("Zoom to data time extent"),
                handler: function(grid, row, col) {
                    var rec = grid.getStore().getAt(row);
                    grid.up("panel").zoomToTime(rec.data.min, rec.data.max);
                }
            }
        ];

        config.width =  500;
        config.listeners =  {
            scope: this,
            afterrender: function() {
                this.getDockedItems('toolbar[dock="top"]')[0].setHeight(50);

                if(this.fade) {
                    this.getEl().on("mouseover",this._onMouseIn,this);
                    this.getEl().on("mouseout",this._onMouseOut,this);
                }
            },
            afterlayout: function() {
                this.slider.setWidth(this.getWidth()-100); // approx place
                if (this.fade) {
                    this._onMouseOut();
                }
            }

        };

        this.callParent(arguments);

        this.on("itemcontextmenu", this._displayItemMenu,this);

        if (config.map) {
            this.setMap(config.map);
        }
    },

    /**
     * mouse in handler
     * @function
     * @private
     */
    _onMouseIn: function(e) {
        if (this._big === true) {
            return;
        }

        // change visibility
        this.getEl().setStyle("opacity",1);
        this.body.setStyle("display","block");
        this.getDockedItems('toolbar[dock="bottom"]')[0].getEl().setStyle("display","block");
        this._big = true;
    },

    /**
     * mouse out handler
     * @function
     * @private
     */
    _onMouseOut: function(e) {
        // change visibility
        if (this.layout.done) {
            this.body.setStyle("display","none");
            this.getDockedItems('toolbar[dock="bottom"]')[0].getEl().setStyle("display","none");
            this.getEl().setStyle("opacity",0.3);
            this._big = false;
        }
    },

    /**
     * set map function
     * @function
     * @name HSLayers.TimeSlider.setMap
     */
    setMap: function(map) {
        this.map = map;
        this.layers = [];

        this.map.events.register("addlayer",this,this._onAddLayer);
        this.map.events.register("removelayer",this,this._onRemoveLayer);

        // register existing layers
        for (var i = 0, ilen = map.layers.length; i < ilen; i++) {
            var layer = map.layers[i];

            this._onAddLayer({layer:layer});
        }
    },

    /**
     * destroy & clean
     * @private
     * @function
     */
    destroy: function() {
        if (this.map) {
            this.map.events.unregister("addlayer",this,this._onAddLayer);
            this.map.events.unregister("removelayer",this,this._onRemoveLayer);
        }
    },

    /**
     * on add layer - register to the stack
     * @function
     * @private
     */
    _onAddLayer: function(e) {
        var layer = e.layer;
        

        if (this.fade) {
            this._onMouseIn();
        }
        // (hsl)wms layer
        if (layer instanceof OpenLayers.Layer.WMS) {
            this._addWMSLayer(layer);
        }
        // kml (vector) layer
        else if (layer instanceof OpenLayers.Layer.Vector && layer.protocol && layer.protocol.format &&
                (layer.protocol.format instanceof OpenLayers.Format.KML ||
                 layer.protocol.format instanceof HSLayers.Format.KML )) {
            layer.events.register("featuresadded",this,function(e) {
                this._addKMLLayer(e.object);
            });
        }
    },

    /**
     * layer basic check
     * @private
     * @param layer OpenLayers.Layer
     * @param gran {Float} granularity
     * @return undefined or Record object
     */
    _basicLayerAdd: function(layer,gran,values) {
        var i = this.getRootNode().childNodes.length;
        var root = this.getRootNode();
        var min = values[0];
        var max = values[values.length-1];
        var newnode = root.appendChild({
            text: layer.title || layer.name,
            leaf: true,
            layerid: layer.id,
            layer: layer,
            icon: "data:image/png;base64,"+HSLayers.colors[this._coloridx][2],
            color: HSLayers.colors[this._coloridx][0],
            checked: true,
            min: min,
            max: max,
            gran: gran,
            slider: this.slider,
            odd: i%2,
            thrd: i%3,
            listeners: {
            }
        });
        this._coloridx += 1;


        if (this.min === undefined || min < this.min) {
            this.min = min;
        }

        if (this.max === undefined || max > this.max) {
            this.max = max;
        }

        this.slider.getEl().appendChild(newnode.updateFromToEl());
        this.slider.addValues(values);

        this.zoomToTime(this.min, this.max);

    },

    /**
     * add WMS layer
     * @function
     * @private
     */
    _addWMSLayer: function(layer) {
        var min, max, gran;

        var values = [];

        if (layer.dimensions && layer.dimensions.time) {

            if (layer.dimensions.time.values) {
                for (var i = 0, ilen = layer.dimensions.time.values.length; i < ilen; i++) {
                    var strtime = layer.dimensions.time.values[i];
                    var datetime = new Date(strtime);
                    if (min === undefined || min > datetime) {
                        min = datetime;
                    }
                    if (max === undefined || max < datetime) {
                        max = datetime;
                    }
                    values.push(datetime.valueOf());
                }
            }
        }

        if (min != undefined && max != undefined) {
            layer._wmsLayer = true;
            this.layers.push(layer);
            this._basicLayerAdd(layer,gran,values);
        }

    },

    /**
     * add KML layer
     * @function
     * @private
     */
    _addKMLLayer: function(layer) {
        var min, max, gran;
        var values = [];
        for (var i = 0, ilen = layer.features.length; i < ilen; i++) {
            var feature = layer.features[i];

            // set min/max
            if (feature.attributes && feature.attributes.TimeStamp) {
                var strtime = feature.attributes.TimeStamp.when;
                var datetime = new Date(strtime);
                if (min === undefined || min > datetime) {
                    min = datetime;
                }
                if (max === undefined || max < datetime) {
                    max = datetime;
                }
                // be faster, use integers
                feature.attributes.TimeStamp._when = datetime;
                values.push(datetime.valueOf());
            }

        }

        if (min != undefined && max != undefined) {
            layer._kmlLayer = true;
            this.layers.push(layer);
            this._basicLayerAdd(layer,gran,values);
        }
    },

    /**
     *

    /**
     * on remove layer - remove to the stack
     * @function
     * @private
     */
    _onRemoveLayer: function(e) {
        var layer = e.layer;

        var idx = this.store.find("layerid",layer.id);
        if (idx > -1) {
            this.store.removeAt(idx);
        }
        idx = this.layers.indexOf(layer);
        if (idx > -1) {
            this.layers.splice(idx,1);
        }
    },


    /**
     * time window change, handle it for all layres
     * @private
     * @function
     */
    _onTimeWindowChange: function() {
        var value = this.slider.getValue();
        var checked = this.getView().getChecked();

        for (var i = 0, ilen = checked.length; i < ilen; i++) {
            var layer = checked[i].layer;

            if (layer._kmlLayer) {
                this._kmlLayerHandler(layer,value);
            }
            else if (layer instanceof OpenLayers.Layer.WMS) {
                this._wmsLayerHandler(layer,value);
            }
        }

        var middate = new Date(value);
        middate = Ext4.String.format("{0}.{1}.{2}<br />{3}",
                    middate.getDate(), middate.getMonth()+1,middate.getFullYear(),
                    middate.toLocaleTimeString());
        this.getDockedItems('toolbar[dock="bottom"]')[0].items.get(3).getEl().setHTML(middate);
    },

    /**
     * display/hide kml layer featuers accordint to given time window
     * @private 
     * @function
     */
    _kmlLayerHandler: function(layer,timewin) {
        var resol = (this.slider.maxValue-this.slider.minValue)/this.slider.getWidth()/2;
        var min = timewin-resol, max = timewin+resol;
        for (var i = 0, ilen = layer.features.length; i < ilen; i++) {
            var feature = layer.features[i];
            if (min <= feature.attributes.TimeStamp._when && feature.attributes.TimeStamp._when<=max) {
                layer.renderer.drawFeature(feature);
            }
            else {
                layer.renderer.eraseFeatures(feature);
            }
        }

        var node = this.store.getRootNode().findChild("layerid",layer.id);
        if (node) {
            node.setDateText(new Date(timewin));
        }
    },

    /**
     * display/hide wms layer featuers accordint to given time window
     * @private 
     * @function
     */
    _wmsLayerHandler: function(layer,timewin) {
        var values = layer.dimensions.time.values;
        var middle = timewin;
        var diff = -1;
        var display_value;
        for (var i = 0, ilen = values.length; i < ilen; i++) {
            var value = new Date(values[i]);
            
            var val_diff = Math.abs(value.valueOf()-middle)
            
            if (diff == -1) {
                diff = val_diff
            }

            if (val_diff <= diff) {
                display_value = value;    
                diff = val_diff;
            }

            //layer.renderer.drawFeature(feature);
        }
        if (display_value !== undefined) {
            var isotime = display_value.toISOString();
            if (layer.params.TIME != isotime) {
                layer.mergeNewParams({TIME: isotime});
            }
        }

        var node = this.store.getRootNode().findChild("layerid",layer.id);
        if (node) {
            node.setDateText(display_value);
        }
    },

    /**
     * display item menu
     * @private
     * @function
     */
    _displayItemMenu: function(switcher,record,element,idx,e,o) {
        var menu = Ext4.create("HSLayers.TimeSlider.LayerMenu", {
            layer: record.layer,
            min: record.data.min,
            max: record.data.max,
            listeners: {
                scope: this,
                zoomto: function(e) {this.zoomToTime(e.time[0],e.time[1]);}
            }
        });
        menu.showAt(e.xy[0],e.xy[1]);
        Ext4.EventManager.stopEvent(e);
    },

    /**
     * zoom to particular time click handler
     * @function
     * @param min {Float}
     * @param max {Float}
     */
    zoomToTime: function(min,max) {

        min = parseInt(min);
        max = parseInt(max);
        // 0 is the smaller one
        // 1 is the bigger one
        this.slider.setMinValue(min);
        this.slider.setMaxValue(max);


        // update from-to element for each layer displayed in the slider
        this.getRootNode().cascadeBy(function(node) {
            if (node.slider) {
                node.updateFromToEl();
            }
        }, this);

        // adjust sencod slider
        //this.slider._diff = 10000;
        this.slider.setValue(0,min,false);
        //var thumb_width_as_time = (max-min)/this.slider.getWidth()*this.slider.thumbs[1].el.getWidth();
        //this.slider.setValue(1, min+thumb_width_as_time,false); 

        // update min and max date before and after the slider
        var mindate = new Date(min);
        var maxdate = new Date(max);
        mindate = Ext4.String.format("{0}.{1}.{2}<br />{3}",
                    mindate.getDate(), mindate.getMonth()+1,mindate.getFullYear(),
                    mindate.toLocaleTimeString());
        maxdate = Ext4.String.format("{0}.{1}.{2}<br />{3}",
                    maxdate.getDate(),maxdate.getMonth()+1,maxdate.getFullYear(),
                    maxdate.toLocaleTimeString());
        this.getDockedItems('toolbar[dock="top"]')[0].items.get(0).getEl().setHTML(mindate);
        this.getDockedItems('toolbar[dock="top"]')[0].items.get(2).getEl().setHTML(maxdate);

        // update row  class
        this.view.collectData(this.getRootNode().childNodes,0);
    },

});

HSLayers.colors = [
    ["white"     ,"#FFFFFF", "R0lGODdhDAAMAIABAP//////ACwAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["yellow"    ,"#FFFF00", "R0lGODdhDAAMAIABAP//AP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["fuchsia"   ,"#FF00FF", "R0lGODdhDAAMAIABAP8A/////ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["red"       ,"#FF0000", "R0lGODdhDAAMAIABAP8AAP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["silver"    ,"#C0C0C0", "R0lGODdhDAAMAIABAMDAwP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["gray"      ,"#808080", "R0lGODdhDAAMAIABAICAgP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["olive"     ,"#808000", "R0lGODdhDAAMAIABAICAAP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["purple"    ,"#800080", "R0lGODdhDAAMAIABAIAAgP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["maroon"    ,"#800000", "R0lGODdhDAAMAIABAIAAAP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["aqua"      ,"#00FFFF", "R0lGODdhDAAMAIABAAD//////ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["lime"      ,"#00FF00", "R0lGODdhDAAMAIABAAD/AP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["teal"      ,"#008080", "R0lGODdhDAAMAIABAACAgP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["green"     ,"#008000", "R0lGODdhDAAMAIABAACAAP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["blue"      ,"#0000FF", "R0lGODdhDAAMAIABAAAA/////ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["navy"      ,"#000080", "R0lGODdhDAAMAIABAAAAgP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="],
    ["black"     ,"#000000", "R0lGODdhDAAMAIABAAAAAP///ywAAAAADAAMAAACCoSPqcvtD6OclBUAOw=="]
];

