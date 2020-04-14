/**
 * @class 
 * @name HSLayers.Control.Attribution
 */
HSLayers.namespace("HSLayers.Control.Attribution");
HSLayers.Control.Attribution = OpenLayers.Class(OpenLayers.Control.Attribution, {
    /**
     * @name HSLayers.Control.Attribution.copyrightText
     * @type {String}
     */
    copyrightText: OpenLayers.i18n("Copyright"),

    /**
     * @name HSLayers.Control.Attribution.width
     * @type {Integer}
     */
    width: 500,

    /**
     * @name HSLayers.Control.Attribution.height
     * @type {Integer}
     */
    height: 500,

    /**
     * "Copyright" link
     * @name HSLayers.Control.Attribution.copyrightLink
     * @type {DOMElement}
     */
    copyrightLink: null,
    
    /**
     * @name HSLayers.Control.Attribution.attributions
     * @type {String} or {Object}
     */
    attributions: null,
    
    /**
     * Copyright div element
     * @name HSLayers.Control.Attribution.copyrightDiv
     * @type {DOMElement}
     */
    copyrightDiv: null,

    /**
     * fill this option, if you want to get some text to be displayed
     * always from some URL
     * @name HSLayers.Control.Attribution.url
     * @type {String}
     */
    url: null,

    /**
     * Fixed height of copyright logos. Default 32.
     * @name HSLayers.Control.logoHeight
     * @type {Integer}
     */
    logoHeight: 32,

    /**
     * @name HSLayers.Control.copyrightImage
     */
    copyrightImage: undefined,

    /**
     * @name HSLayers.Control.Attribution._urlText
     * @type {String}
     * @private
     */
    _urlText: null,

    /**
     * @name HSLayers.Control.Attribution._loadingURL
     * @type {Boolean}
     * @private
     */
    _loadingURL: null,

    /**
     * Overloaded function from OpenLayers.Control.Attibution
     * Create "Copyright" link, create copyright div 
     * and make attribution for every layer.
     * @name HSLayers.Control.Attribution.updateAttribution
     * @function
     */
    updateAttribution: function() {
        if (!window.Ext) {
            OpenLayers.Control.Attribution.prototype.updateAttribution.apply(this,arguments);
            return;
        }

        // Create "Copyright" link
        if (this.copyrightLink) {
            this.div.removeChild(this.copyrightLink);
        }
        this.copyrightLink = document.createElement("a");
        this.copyrightLink.className = "hsLayers-attribution-link";

        if (this.copyrightImage) {
            var img = document.createElement("img");
            img.src = this.copyrightImage;
            this.copyrightLink.appendChild(img);
        }
        if(this.copyrightText) {
            this.copyrightLink.appendChild(document.createTextNode(this.copyrightText));
        }
        this.copyrightLink.scope = this;
        this.copyrightLink.onclick = function(){this.scope.onCopyrightClicked();};
        this.div.appendChild(this.copyrightLink);

        // Create copyright div
        if (this.copyrightDiv && this.window) {
            this.window.remove(this.copyrightDiv);
        }
        this.copyrightDiv = document.createElement("div");
        this.copyrightDiv.style.background="white";
        this.attributions = [];
        if (this.map && this.map.layers) {
            // For every layer...
            for(var i=0, len=this.map.layers.length; i<len; i++) {
                var layer = this.map.layers[i];
                if (layer.attribution && layer.getVisibility()) {
                    // ...make attribution node.
                    this.makeAttributionNode(layer.attribution);

                }
                // If it is a MapServer layer...
                if (HSLayers.Layer && HSLayers.Layer.TreeLayer &&
                        (layer instanceof HSLayers.Layer.TreeLayer) && layer.getVisibility() && layer.loadingTree === false) {
                    // ...for every its layer... 
                    var visibleLayers = layer.getVisibleLayers();
                    for (var j = 0; j < visibleLayers.length; j++) {
                        if (visibleLayers[j].attribution) {
                            // ...make attribution node as well.
                            this.makeAttributionNode(visibleLayers[j].attribution);
                        }
                    }
                }
            } 
        }

/*
        // Place predefined text at the beginning of the copyright window        
        if (this._urlText) {
            this.copyrightDiv.innerHTML = this._urlText;
            this.copyrightDiv.appendChild(document.createElement("hr"));
        }
*/

        this.copyrightDiv = new Ext.Component(Ext.get(this.copyrightDiv));
        //this.copyrightDiv.removeClass("x-window-body");
        this.copyrightDiv.addClass("copyrightDiv");

        if (this.window) {
            this.window.add(this.copyrightDiv);
            this.window.doLayout();
        }
    },

    /**
     * 
     * @name HSLayers.Control.Attribution.makeAttributionNode
     * @function
     * @param {OpenLayers.Layer} layer
     * @param {Object} attribution
     * @param {DOMElement} dl
     */
    makeAttributionNode: function(attribution) {
// todo - maybe if it is a text node, we should create some list or whatever

        // If the attribution is not there yet...
        if (this.findAttribution(attribution) === null) {
            // ...get attribution node... 
            var attributionNode = this.getAttributionNode(attribution);
            // ...and add it.
            this.copyrightDiv.appendChild(attributionNode);
            this.attributions.push(attribution);
        }
    },

    /**
     * 
     * @name HSLayers.Control.Attribution.appendToExisting
     * @function
     * @param {OpenLayers.Layer} layer
     * @returns {Boolean} appended or no
     */
    findAttribution: function(attribution) {
        var result = null;

        for (var i = 0, len = this.attributions.length; i < len; i++) {
            if (this.attributions[i].title == attribution.title &&
                this.attributions[i].href  == attribution.href) {
                result = i;
                break;
            }
        }
        return result;
    },

    /**
     * 
     * @HSLayers.Control.this.getAttribution.getAttributionNode
     * @function
     * @param {Object|String} attribution object or string 
     */
    getAttributionNode: function(attribution) {
        var node = null;

        // If it is a string...
        if (typeof attribution == "string") {
            // ...create text node
            node = document.createTextNode(attribution);
        }
        else { // If not, hopefully it is an attribution object:
            // {logo: {href:string, width: int, height: int}, href: string, title: string}
            var img = null;

            // Try to create a logo image
            if (attribution.logo) {
                if (attribution.logo.href) {
                    img = document.createElement("img");
                    img.setAttribute("src", attribution.logo.href);
                    img.setAttribute("height", this.logoHeight);

                    if (attribution.logo.height && attribution.logo.width) {
                        var ratio = attribution.logo.height / this.logoHeight;
                        var logoWidth = attribution.logo.width / ratio;
                        logoWidth = Math.ceil(logoWidth);
                        img.setAttribute("width", logoWidth);
                    }

                    if (attribution.title) {
                        img.setAttribute("alt", attribution.title);
                    }
                }
            }

            // If there is a href...
            if (attribution.href) {
                // ...create anchor node
                var anchor = document.createElement("a");
                anchor.setAttribute("href", attribution.href);
                anchor.target = "_blank";
                anchor.className="hslCopyrightLink";

                if (attribution.title) {
                    anchor.setAttribute("title", attribution.title);
                }

                // Use logo image or title or href
                anchor.appendChild(img || document.createTextNode(
                            attribution.title || attribution.href));

                node = anchor;
            }
            else { // There is no href
                
                // Try to use the logo image...
                if (img) {
                    node = img;
                }
                else {                
                    // ...or at least the title...
                    if (attribution.title) {
                        node = document.createTextNode(attribution.title);
                    } // ...in the worst case, return null
                }
            }
        }

        return node;
    },


    /**
     * On copyright click, copyright window is created and filled using updateAttribution().
     * @name HSLayers.Control.Attribution.onCopyrightClicked
     * @function
     */
    onCopyrightClicked: function() {
        if (!this.window) {
            this.window = new Ext.Window({title:this.copyrightText,
                    bodyStyle: {
                        background: "white"
                    },
                    clearCls:true,
                    cls: this.CLASS_NAME.replace(/\./g, "")+"_window",
                    closeAction:"hide",
                    maximizable: true,
                    width: this.map.getSize().w,
                    autoScroll: true
            });
        }
        if (this.copyrightDiv) {
            this.window.remove(this.copyrightDiv);
            this.window.add(this.copyrightDiv);
        }
        this.updateAttribution();
        var s = this.map.getSize();
        this.window.setSize(s.w,150);
        this.window.show();
        var mapelem = Ext.get(this.map.div.id);
        this.window.setPosition(mapelem.getLeft(),mapelem.getBottom()-this.window.getHeight());

    },

    /**
     * @name HSLayers.Control.Attribution.setUrl
     * @function
     * @parma {String} url
     */
    setUrl: function(url) {
        this.url = url;

        OpenLayers.Request.GET({
            url: this.url,
            failure: function() {},
            scope: this,
            success: function(r){this._urlText = r.responseText; this.updateAttribution();}
        });

    },

    CLASS_NAME: "HSLayers.Control.Attribution"
});
HSLayers.Control.Attribution.script = null;
