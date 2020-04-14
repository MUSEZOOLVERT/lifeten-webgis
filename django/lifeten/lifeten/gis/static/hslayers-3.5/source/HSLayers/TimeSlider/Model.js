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

Ext4.define("HSLayers.TimeSlider.Model",{
    extend: 'Ext.data.Model',
    fields: [
        {name: 'text', type: 'string'},
        {name: 'color',type:"string"},
        {name: 'layerid',type:"string"},
        {name: 'min',type:"string"},
        {name: 'mydate',type:"string"},
        {name: 'max',type:"string"},
        {name: 'gran',type:"string"},
        {name: 'layer',type:"object"}
    ],
    fromtoel: undefined,
    slider: undefined,

    /**
     * @constructor
     */
    constructor: function(config) {
        this.layer = config.layer;
        this.slider = config.slider;
        this.odd = config.odd;
        this.thrd = config.thrd;
        this.callParent(arguments);
    },
    

    /**
     * create element, which will demonstrate from/to extent on the slider for
     * particular layer
     * @function
     * @param odd {Integer}
     * @param thrd {Integer} number between 0 and 2 (including)
     */
    updateFromToEl: function(odd,thrd) {

        var maxwidth = this.slider.getWidth();
        var width = (this.data.max - this.data.min)/(this.slider.maxValue- this.slider.minValue) * maxwidth;
        var left = (this.data.min-this.slider.minValue)/(this.slider.maxValue-this.slider.minValue)*maxwidth;

        if (left < 0) {
            width += left;
            left = 0;
        }
        if (width < 0) {
            width = 0;
        }

        if (left + width > maxwidth) {
            width = maxwidth;
        }

        if (!this.fromtoel) {
            this.fromtoel = new Ext4.dom.Element(document.createElement("div"));
            Ext4.create("Ext4.tip.ToolTip",{
                html: this.data.text,
                target: this.fromtoel
            });

            //this.fromtoel.setWidth(width);
            //this.fromtoel.setHeight(7);

            // fix border
            var style = {
                border: "2px solid "+this.data.color,
                height: String(7)+"px",
                position: "absolute"
            };


            style = Ext4.applyIf((this.odd ? 
                    {
                        top: String(-10+(-1+this.thrd))+"px"
                    } : 
                    {
                        top: String(20+(-1+this.thrd))+"px"
                    }),style);

            this.fromtoel.setStyle(style);

            this.odd ? this.fromtoel.setStyle("border-bottom-style","none") : this.fromtoel.setStyle("border-top-style","none");


        }

        this.fromtoel.setStyle("width",String(width)+"px");
        this.fromtoel.setStyle("left",String(left)+"px");
    

        return this.fromtoel;
    },

    /**
     * display date text next to layer name text in the node
     * @param Date
     */
    setDateText: function(mydate) {
        var txt ="";
        if (mydate instanceof Date) {
            txt = Ext4.String.format("{0}.{1}.{2} {3}",
            mydate.getDate(), mydate.getMonth()+1,mydate.getFullYear(),
            mydate.toLocaleTimeString());
        }
        else if (mydate.length) {
            txt = Ext4.String.format("{0}.{1}.{2} {3}",
            mydate[0].getDate(), mydate[0].getMonth()+1,mydate[0].getFullYear(),
            mydate[0].toLocaleTimeString());
            txt +="<br /> ";
            txt += Ext4.String.format("{0}.{1}.{2} {3}",
            mydate[1].getDate(), mydate[1].getMonth()+1,mydate[1].getFullYear(),
            mydate[1].toLocaleTimeString());
        }

        this.set("mydate",txt);
    }
});
