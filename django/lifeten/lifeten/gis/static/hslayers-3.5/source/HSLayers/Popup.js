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
 * Modified Popup, with several custom buttons (links)
 *
 * @class HSLayers.Popup
 * @param {Object} options  configuration object for this popup,
 * @param {String} options.id
 * @param {OpenLayers.LonLat} options.lonlat `OpenLayers.LonLat <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/BaseTypes/LonLat-js.html>`_ coordinates
 * @param {OpenLayers.Size} options.contentSize 
 * @param {String|Function} options.contentHTML if contentHTML is a function, it will get feature (see options.feature) as parameter
 * @param {Object} options.anchor object to which we'll anchor the popup. Must expose a 'size' (`OpenLayers.Size <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/BaseTypes/Size-js.html>`_) and 'offset' (`OpenLayers.Pixel <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/BaseTypes/Pixel-js.html>`_) (Note that this is generally an `OpenLayers.Icon <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Icon-js.html>`_).
 * @param {Boolean} options.closeBox
 * @param {Function} options.closeBoxCallback  Function to be called on closeBox click.
 * @param {Object} options.menu menu configuration, see :js:attr:`Popup.menu`
 * @param {Object} options.link URL with more informations
 * @param {String} options.title title of the popup
 * @param {OpenLayers.Feature} options.feature `OpenLayers.Feature <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Feature-js.html>`_ for the popup
 * @example
 *
 *  var popup = new HSLayers.Popup({
 *          lonlat: new OpenLayers.LonLat(15,50),
 *          size: new OpenLayers.Size(230,150),
 *          feature: feature, // vector feature
 *          title: "My popup title",
 *          link: function(feature){
 *            return "http://foo/bar?feature="+feature.id
 *          },
 *          contentHTML: "the looong string",
 *          anchor: null, 
 *          closeBox: true
 *      });
 *  
 *      map.addPopup(popup);
 */
HSLayers.Popup = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {                

    /**
     * Size
     * @name HSLayers.Popup.size
     * @type {OpenLayers.Size}
     */
    size: null,

    /**
     * Size name, one of 'medium','small','big', default: 'medium'
     * @name HSLayers.Popup._size
     * @type {String}
     */
    _size: "medium",

    /**
     * Sizes
     * @name HSLayers.Popup.sizes
     * @type {OpenLayers.Size}
     */
    sizes: {"small":new OpenLayers.Size(150,150), 
            "medium":new OpenLayers.Size(300,300),
            "big":new OpenLayers.Size(400,300)},

    /**
     * minimizeBox
     * @name HSLayers.Popup.minimizeBox
     * @type {Boolean}
     */
    minimizeBox: false,

    /**
     * Title div, placed in the content div.
     * Created by createTitleDiv(), filled in with title.
     * @name HSLayers.Popup.titleDiv
     * @type {DOMElement} 
     */
    titleDiv: null,
    
    /**
     * Inner content div, placed in the contentDiv 
     * together with titleDiv and menuDiv.
     * Created by createInnerContentDiv() 
     * and filled in setContentHTML() with contentHTML.
     * @name HSLayers.Popup.innerContentDiv
     * @type {DOMElement} 
     */
    innerContentDiv: null,

    /**
     * Menu div, placed in the contentDiv.
     * It bears the menu including the "More info..." link
     * @name HSLayers.Popup.menuDiv
     * @type {DOMElement} 
     */
    menuDiv: null,

    /**
     * String or Function with the title
     * useful for working with clusters (OpenLayers.Strategy.Cluster)
     * @name HSLayers.Popup.title
     * @type {String} or {Function} 
     */
    title: null,

    /**
     * options.contentHTML can be given either as a string 
     * or as a function returning a string. 
     * This is used to store it, if the string is used.
     * @name HSLayers.Popup.contentHTMLData
     */
    contentHTMLData: null,

    /**
     * options.contentHTML can be given either as a string 
     * or as a function returning a string. 
     * This is used to store it, if the function is used.
     * @name HSLayers.Popup.contentHTMLData
     */
    contentHTMLfunction: null,

    /**
     * Menu, array of objects with following parameters: 
     *
     * * {String} title item title
     * * {String} className custom class name
     * * {Function} callback function which is called on click event
     *
     * @example
     *      menu : [{title: "foo",callback:function(){}}, {title:"bar",...}]
     * @name HSLayers.Popup.menu
     * @type {Object}
     */
    menu: null,

    /**
     * "More info..." link
     * @name HSLayers.Popup.link
     * @type {URL} 
     */
    link: null,

    /**
     * Target for More info
     * @name HSLayers.Popup.target
     * @type {String} 
     */
    target: undefined,

    /**
     * Height of the titleDiv
     * @name HSLayers.Popup.titleHeight
     * @type {Integer}
     */            
    titleHeight: 20,

    /**
     * Height of the menuDiv
     * @name HSLayers.Popup.menuHeight
     * @type {Integer}
     */            
    menuHeight: 15,

    /**
     * clusterIdx index of the cluster, used by
     * `OpenLayers.Strategy.Cluster <http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Strategy/Cluster-js.html>`_
     * @name HSLayers.Popup.clusterIdx
     * @type {Integer} 
     */
    clusterIdx: 0,

    /**
     * content display class
     * @name HSLayers.Popup.contentDisplayClass
     * @type {String} 
     */
    contentDisplayClass: "hsPopupContent",

    /** 
     * @constructor
     */
    initialize: function(options) {

        options.size  = options.size || "medium";
        OpenLayers.Util.extend(this, options);
        OpenLayers.Popup.FramedCloud.prototype.initialize.apply(this,[options.id,options.lonlat,undefined,
                                                                " ", options.anchor, 
                                                                options.closeBox, options.closeBoxCallback]);
        this.size = this.minSize = this.maxSize = (typeof(options.size) === "string" ? this.sizes[options.size] : options.size);
        if (this.menu === undefined) {
            this.menu = [];
        }
        // contentHTML can be given either a text or a function returning the text.
        // Remeber the choice, we will set the contentHTML later in makeContent().
        if (typeof(options.contentHTML) === "function") {
            this.contentHTMLfunction = options.contentHTML;
       }
        else {
            this.contentHTMLData = options.contentHTML;
        }
    },

    /**
     * Call this.redraw() and then draw() method of the ancestor.
     * @name HSLayers.Popup.draw
     * @function
     */
    draw: function() {
        var retval = OpenLayers.Popup.FramedCloud.prototype.draw.apply(this,arguments);
        this.redraw();
        return retval;
    },

    /**
     * Clean and fill the contentDiv.
     * titleDiv, innerContentDiv and menuDiv are created, 
     * filled in and placed into the contentDiv.
     * @name HSLayers.Popup.redraw
     * @function
     */
    redraw: function() {
        var feature  = (this.feature.cluster ? this.feature.cluster[this.clusterIdx] : this.feature);
        feature.layer = this.feature.layer;

        // get safeSize
        var preparedHTML = "<div class='" + this.contentDisplayClass+ "'>" + 
            this.contentDiv.innerHTML + 
            "</div>";
        var realSize = OpenLayers.Util.getRenderedDimensions(
            preparedHTML, null,	{
                displayClass: this.displayClass,
                containerElement: this.map.layerContainerDiv
            }
        );
        var safeSize = this.getSafeContentSize(realSize);
        safeSize.h = safeSize.h - 3;
        safeSize.w = safeSize.w - 0;


        // Clean the content div
        this.contentDiv.innerHTML = ""; // contentDiv has been created in OpenLayers.Popup.initialize() 
        this.innerContentDiv = undefined;
        this.menuDiv = undefined;

        // titleDiv - title
        this.createTitleDiv(feature,safeSize);

        // innerContentDiv - the content itself
        this.createInnerContentDiv(feature,safeSize);
        //
        // menuDiv - menu & "More info..."
        this.createMenuDiv(feature,safeSize);
    },

    /**
     * Create and fill in the titleDiv and place it in the content div.
     * If title is not set, no action is taken.
     * @name HSLayers.Popup.createTitleDiv
     * @function
     */
    createTitleDiv: function(feature,size) {
        if (!this.title) {
            return;
        }

        // Create titleDiv
        if (this.titleDiv && this.titleDiv.parentNode) {
            this.titleDiv.parentNode.removeChild(this.titleDiv);
            this.titleDiv = undefined;
        }

        this.titleDiv = OpenLayers.Util.createDiv(this.id + "_titleDiv", 
                new OpenLayers.Size(0,0),
                new OpenLayers.Size(size.w, this.titleHeight),
                null, 
                "absolute", null, "hidden", null
            );
        this.titleDiv.className = "popupTitle";

        // Put the titleDiv in the contentDiv
        this.contentDiv.appendChild(this.titleDiv);

        // Set innerHTML
        this.titleDiv.innerHTML = (typeof(this.title) === "function" ? this.title(feature) : this.title);
    },

    /**
     * Create and fill the innerContentDiv and place it in the contentDiv.
     * @name HSLayers.Popup.createInnerContentDiv
     * @param {OpenLayers.Feature.Vector} feature
     * @function
     */
    createInnerContentDiv: function(feature,size) {

        // Create innerContentDiv
        if (this.innerContentDiv && this.innerContentDiv.parentNode) {
            this.innerContentDiv.parentNode.removeChild(this.innerContentDiv);
            this.innerContentDiv = undefined;
        }

        var t = this.titleHeight+10; // top - we have just title above + 20px magic number
        var h = size.h - this.titleHeight - this.menuHeight; // height; magic 2 allows 1px bold upper & lower border
        this.innerContentDiv = OpenLayers.Util.createDiv(this.id + "_innerContentDiv", 
                new OpenLayers.Pixel(0, this.titleHeight), new OpenLayers.Size(size.w, h), null, "absolute", null, "auto", null
            );
        this.innerContentDiv.className = "popupInnerContent";
        // Put the innerContentDiv in the contentDiv
        this.contentDiv.appendChild(this.innerContentDiv);

        // Set contentHTML and innerContentDiv.innerHTML
        this.makeContent(feature);
    },

    /**
     * Make content and update the innerContentDiv.
     * The content can be given either as a string or as a function returning the string.
     * If the function is given, we call it. Then the contentHTML is set 
     * and setContentHTML() is called to update the innerContentDiv.
     * @param {OpenLayers.Feature.Vector} feature
     * @name HSLayers.Popup.makeContent
     * @function
     */
    makeContent: function(feature) {

        // Set contentHTML
        if (this.contentHTMLfunction) { // Function given
            this.contentHTML = this.contentHTMLfunction(feature);
        }
        else { // String given
            this.contentHTML = this.contentHTMLData;
        }

        // Update the innerContentDiv
        this.setContentHTML(this.contentHTML);
    },

    /**
     * Set contentHTML (if provided) and fill innerContentDiv or contentDiv.
     * In HS Popup we put several divs in the contentDiv (title, inner content and menu),
     * so by default this sets the innerHTML of the innerContentDiv.
     * To overwrite the content of the whole contentDiv, 
     * set overwriteWholeContent to true.
     * @param {String} contentHTML 
     * @param {Boolean} overwriteWholeContent 
     * @name HSLayers.Popup.setContentHTML
     * @function
     */
    setContentHTML: function(contentHTML, overwriteWholeContent) {

        // If we want to overwrite the whole content, including the title and the menu,
        // call the ancestor function
        if (overwriteWholeContent) {
            OpenLayers.Popup.FramedCloud.prototype.setContentHTML.apply(this, contentHTML);        
            return;
        }

        // Set contentHTML
        if (contentHTML != null) {
            this.contentHTML = contentHTML;
        }

        // Fill innerContentDiv
        if ((this.innerContentDiv != null) &&
            (this.contentHTML != null) &&
            (this.contentHTML != this.innerContentDiv.innerHTML)) {

            this.innerContentDiv.innerHTML = this.contentHTML;

            if (this.autoSize) {

                // If popup has images, listen for when they finish
                // loading and resize accordingly
                this.registerImageListeners();

                // Auto size the popup to its current contents
                this.updateSize();
            }
        }
    },

    /**
     * Create menu div, place it in the content div and create the menu. 
     * Finally, create "More info..." link.
     * @param {OpenLayers.Feature.Vector} feature
     * @name HSLayers.Popup.createMenuDiv
     */
    createMenuDiv: function(feature,size) {        
        if (this.menuDiv && this.menuDiv.parentNode == this.contentDiv) {
            this.contentDiv.removeChild(this.menuDiv);
        }

        // Create menuDiv
        this.menuDiv = OpenLayers.Util.createDiv(this.id + "_menuDiv", 
                new OpenLayers.Pixel(0, size.h-this.menuHeight),
                new OpenLayers.Size(size.w, this.menuHeight),
                null, "absolute", null, "hidden", null
            );
        this.menuDiv.className = "menuDiv";

        // Put menuDiv in the contentDiv
        this.contentDiv.appendChild(this.menuDiv);

        // Create menuList
        var menuList = document.createElement("ul");
        menuList.className = "popupMenuList";

        // Put menuList in the menuDiv
        this.menuDiv.appendChild(menuList);

        // Create menu items for features, which are cluster of features 
        if (this.feature.cluster) {

            var menu = [];
            if (this.clusterIdx > 0) {
                menu.push({title: "«", callback: this._displayPrevClusterFeature,scope:this});
            }
            if (this.feature.cluster.length > 1) {
                menu.push({title: new String(this.clusterIdx+1) + "/" + new String(this.feature.cluster.length)});
            }
            if (this.clusterIdx < this.feature.cluster.length-1) {
                menu.push({title: "»", callback: this._displayNextClusterFeature,scope:this});
            }

            this.createMenuItems(feature, menu, menuList);
        }

        // Create ordinary menu items
        this.createMenuItems(feature, this.menu, menuList);

        // Create "More info..." link
        this.createInfoLink(feature, menuList);
    },

    /**
     * Create ordinary menu items
     * @name HSLayers.Popup.createMenuItems
     * @function
     * @param {OpenLayers.Feature.Vector} feature
     * @param [{Object}] items list of menu items which will be displayed in the
     *              bottom menu
     * @param {HTMLDom} menuList
     */
    createMenuItems: function(feature, items, menuList) {

        if (items) {
            for (var i = 0; i < items.length; i++) {

                var menuItem = document.createElement("li");
                menuItem.className = "popupMenuItem";
                if (i == 0 ) {
                    menuItem.className += " firstMenuItem";
                }
                
                if (items[i].className) {
                    menuItem.className += " "+items[i].className;
                }

                var menuAnchor;
                if (items[i].callback){
                    menuAnchor = document.createElement("a");
                    //menuAnchor.href = "#"+this.div.id;
                    menuAnchor.className = "popupMenuAnchor";

                    menuAnchor.popup = this;
                    menuAnchor.scope = (items[i].scope ? items[i].scope : this);
                    menuAnchor.feature = feature;
                    menuAnchor.callback = items[i].callback;
                    menuAnchor.onclick = function() {this.callback.apply(this.scope,[this.feature])};
                    menuAnchor.appendChild(document.createTextNode(items[i].title));
                }
                else {
                    menuAnchor = document.createTextNode(items[i].title);
                }

                menuItem.appendChild(menuAnchor);
                menuList.appendChild(menuItem);
            }
        }
    },

    /**
     * Create "More info..." link
     * @name HSLayers.Popup.createInfoDiv
     * @function
     * @param {OpenLayers.Feature.Vector} feature
     * @param {HTMLDom} menuList
     */
    createInfoLink: function(feature, menuList,width) {

        if (!this.link) {
            return;
        }
        var link = (typeof(this.link) === "function" ? this.link(feature) : this.link); 
 
        if (!link) {
                return;
        }

        // actual More info item
        var anchor = document.createElement("a");
        anchor.href = link;
        if (this.target) {
            anchor.target = this.target;
        }
        anchor.innerHTML = OpenLayers.i18n("More info") + " ...";


        var menuItem = document.createElement("li");
        menuItem.className = "popupMenuItem infoMenuItem";
        menuItem.appendChild(anchor);
        menuList.appendChild(menuItem);

    },

    /**
     * Used to adjust the size of the popup. 
     * @function
     * @param {OpenLayers.Size} contentSize the new size for the popup's 
     *     contents div (in pixels).
     */
    setSize:function(contentSize) { 
        OpenLayers.Popup.FramedCloud.prototype.setSize.apply(this, arguments);
        //this.contentDiv.style.overflow = "auto";

        //// this.size may have been changed. adjust the innerContentDiv height...
        //var spaceAvail = this.size.h - 70; // available space; assumed contentDiv height
        //if(this.innerContentDiv) {
        //    var h = spaceAvail - this.titleHeight - this.menuHeight - 2; // height; magic 2 allows 1px bold upper & lower border
        //    this.innerContentDiv.style.height = new String(h) + "px";
        //}
        //
        //// ...and position of menuDiv
        //if(this.menuDiv) {
        //    var t = spaceAvail - this.menuHeight; // top; we are on the bottom
        //    this.menuDiv.style.top = new String(t) + "px";
        //}
    },
    
    /**
     * Empty function
     * @name HSLayers.Popup._onPopupClose
     * @function
     * @private
     */
    _onPopupClose: function() {
    },

    /**
     * Redraw this popup with different content.
     * The popup can be a collection (a cluster) of several contents.
     * Here we move to the next one.
     * @name HSLayers.Popup._displayNextClusterFeature
     * @type function
     * @private
     */
    _displayNextClusterFeature: function(feature) {
        this.clusterIdx = this.clusterIdx + 1;
        this.redraw();
    },

    /**
     * Redraw this popup with different content.
     * the popup can be a collection (a cluster) of several contents.
     * Here we move to the previous one.
     * @name HSLayers.Popup._displayPrevClusterFeature
     * @type function
     * @private
     */
    _displayPrevClusterFeature: function(feature) {
        this.clusterIdx = this.clusterIdx - 1;
        this.redraw();
    },
                                
    CLASS_NAME: "HSLayers.Popup"
});
