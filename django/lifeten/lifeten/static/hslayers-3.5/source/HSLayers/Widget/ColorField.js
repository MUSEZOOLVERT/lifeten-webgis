/* Copyright (c) 2007-2010 Help Service - Remote Sensing s.r.o.
 * Author(s): Martin Vlk
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

Ext.namespace("HSLayers.Widget");

/**
 * Color field for input color
 *
 * @class HSLayers.Widget.ColorField
 */
HSLayers.Widget.ColorField = Ext.extend(Ext.form.TriggerField,  {

    // **********************************************************************
    // private members
    // **********************************************************************

    /**
     * @private
     * @name HSLayers.Widget.ColorField.defaultAutoCreate
     * @type Object
     */
    defaultAutoCreate : {
        tag: "input",
        type: "text",
        size: "10",
        maxlength: "7",
        autocomplete: "off"
    },

    /**
     * @private
     * @name HSLayers.Widget.ColorField.invalidText
     * @type String
     */
    invalidText : "'{0}' is not a valid color - it must be in a the hex format (# followed by 3 or 6 letters/numbers 0-9 A-F)",

    /**
     * @private
     * @name HSLayers.Widget.ColorField.maskRe
     * @type RegExp
     */
	maskRe: /[#a-f0-9]/i,

    /**
     * @private
     * @function
     * @name HSLayers.Widget.ColorField._formatColor
     * @param {String}  value
     * @returns {String}
     */
    _formatColor : function(value){
		if (!value || this._parseColor(value)) {
			return value;
        }
		if (value.length == 3 || value.length == 6) {
			return "#" + value;
		}
        return "";
    },

    /**
     * @private
     * @function
     * @name HSLayers.Widget.ColorField._isDark
     * @param {String} hex
     */
    _isDark: function(hex) {
        var dark = false;
        if(hex) {
            var r = parseInt(hex.substring(1, 3), 16) / 255;
            var g = parseInt(hex.substring(3, 5), 16) / 255;
            var b = parseInt(hex.substring(5, 7), 16) / 255;
            var brightness = (r * 0.299) + (g * 0.587) + (b * 0.144);
            dark = brightness < 0.5;
        }
        return dark;
    },

    /**
     * @private
     * @function
     * @name HSLayers.Widget.ColorField._menuListeners
     */
    _menuListeners : {
        select: function(e, c) {
            this.setValue(c);
        },
        show : function() {
            this.onFocus();
        },
        hide : function() {
            this.focus.defer(10, this);
            var ml = this._menuListeners;
            this.menu.un("select", ml.select, this);
            this.menu.un("show", ml.show, this);
            this.menu.un("hide", ml.hide, this);
        }
    },

    /**
     * @private
     * @function
     * @name HSLayers.Widget.ColorField._parseColor
     * @param {String} value
     * @returns {String}
     */
    _parseColor : function(value){
		return (!value || (value.substring(0,1) != "#")) ?
			false : (value.length == 4 || value.length == 7 );
    },

    // **********************************************************************
    // public members
    // **********************************************************************

    /**
     * @function
     * @name HSLayers.Widget.ColorField.getValue
     * @returns {String}
     */
    getValue : function() {
        return (HSLayers.Widget.ColorField.superclass.getValue.call(this) || "");
    },

    /**
     * @function
     * @name HSLayers.Widget.ColorField.onTriggerClick
     */
    onTriggerClick : function() {
        if(this.disabled) {
            return;
        }
        if(this.menu == null) {
            this.menu = new Ext.menu.ColorMenu();
        }

        this.menu.on(Ext.apply({}, this._menuListeners, {
            scope: this
        }));

        this.menu.show(this.el, "tl-bl?");
    },

    /**
     * @function
     * @name HSLayers.Widget.ColorField.setColor
     * @param {String} color
     */
	setColor : function(color) {
		if (color == "" || color == undefined) {
			if (this.emptyText != "" && this._parseColor(this.emptyText)) {
				color = this.emptyText;
            } else {
				color = "transparent";
            }
		}

		if (this.trigger) {
			this.getEl().setStyle({
                "background-image": "url(\"\")",
				"background-color": color,
                "color": this._isDark(color) ? "#ffffff" : "#000000"
			});
        } else {
			this.on("render", function(){
                    this.setColor(color)
                }, this
            );
		}
	},

    /**
     * @function
     * @name HSLayers.Widget.ColorField.setValue
     * @param {String} color
     */
    setValue : function(color) {
        HSLayers.Widget.ColorField.superclass.setValue.call(this, this._formatColor(color));
		this.setColor(this._formatColor(color));
    },

    /**
     * @function
     * @name HSLayers.Widget.ColorField.validateBlur
     * @returns {Boolean}
     */
    validateBlur : function() {
        return (!this.menu || !this.menu.isVisible());
    },

    /**
     * @function
     * @name HSLayers.Widget.ColorField.validateValue
     * @param {String} value
     * @returns {Boolean}
     */
    validateValue : function(value){
        if(! HSLayers.Widget.ColorField.superclass.validateValue.call(this, value)) {
            return false;
        }
        if(value.length < 1) {
        	 this.setColor("");
        	 return true;
        }

        var parseOK = this._parseColor(value);

        if(!value || (parseOK == false)) {
            this.markInvalid(String.format(this.invalidText,value));
            return false;
        }

		this.setColor(value);
        return true;
    }
});

Ext.reg("hslayers_colorfield", HSLayers.Widget.ColorField);
