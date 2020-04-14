HSLayers.Control.PanZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoomBar, HSLayers.Control.PanZoom, {

    zoomStopWidth: 22,

    barZoomStopWidth: 18,

    zoomStopHeight: 11,
    
    variant: "gray",

    dummyScaleDiv: undefined,

    dummyScales: undefined,

    dummyScaleDivs: undefined,

    zoomWorldIcon: true,

    /**
    * Method: draw 
    *
    * Parameters:
    * px - {<OpenLayers.Pixel>} 
    */
    draw: function(px) {
         var variant = "panzoombar/"+this.variant;

        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position.clone();

        // place the controls
        this.buttons = [];

        var sz = new OpenLayers.Size(22,22);
        var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);
        var wposition = sz.w;

        if (this.zoomWorldIcon) {
            centered = new OpenLayers.Pixel(px.x+sz.w, px.y);
        }

        this._addButton("panup", variant+"/"+"hsl-north.png", centered, sz);
        px.y = centered.y+sz.h;
        this._addButton("panleft", variant+"/"+"hsl-west.png", px, sz);
        if (this.zoomWorldIcon) {
            this._addButton("zoomworld", variant+"/"+"hsl-zoom-world.png", px.add(sz.w, 0), sz);
            
            wposition *= 2;
        }
        this._addButton("panright", variant+"/"+"hsl-east.png", px.add(wposition, 0), sz);
        this._addButton("pandown", variant+"/"+"hsl-south.png", centered.add(0, sz.h*2), sz);
        this._addButton("zoomin", variant+"/"+"hsl-zoom-plus.png", centered.add(0, sz.h*3+5), sz);
        centered = this._addZoomBar(centered.add(0, sz.h*4 + 5));
        this._addButton("zoomout", variant+"/"+"hsl-zoom-minus.png", centered.add(-2,0), sz);

        this.div.style.top = "20px";


        OpenLayers.Event.stopObservingElement(this.div,
            "mouseover", this.onMouseOver, false);
        OpenLayers.Event.stopObservingElement(this.div,
            "mouseout", this.onMouseOut, false);

        OpenLayers.Event.observe(this.div, "mouseover", 
            OpenLayers.Function.bind(this.onMouseOver, this));
        OpenLayers.Event.observe(this.div, "mouseout", 
            OpenLayers.Function.bind(this.onMouseOut, this));

        return this.div;
    },

    /** 
    * Method: _addZoomBar
    * 
    * Parameters:
    * location - {<OpenLayers.Pixel>} where zoombar drawing is to start.
    */
    _addZoomBar:function(centered) {

        centered = centered.add(2, 0);

        var imgLocation = OpenLayers.Util.getImagesLocation();
        
        var id = this.id + "_" + this.map.id;
        var zoomsToEnd = this.map.getNumZoomLevels() - 1 - this.map.getZoom();
        var slider = OpenLayers.Util.createAlphaImageDiv(id,
                       centered.add(-1, zoomsToEnd * this.zoomStopHeight), 
                       new OpenLayers.Size(20,9), 
                       imgLocation+"panzoombar/"+this.variant+"/"+"hsl-slider.png",
                       "absolute");
        this.slider = slider;
        
        this.sliderEvents = new OpenLayers.Events(this, slider, null, true,
                                            {includeXY: true});
        this.sliderEvents.on({
            "mousedown": this.zoomBarDown,
            "mousemove": this.zoomBarDrag,
            "mouseup": this.zoomBarUp,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });
        
        var sz = new OpenLayers.Size();
        sz.h = this.zoomStopHeight * this.map.getNumZoomLevels();
        sz.w = this.barZoomStopWidth;
        var div = null;
        
        if (OpenLayers.Util.alphaHack()) {
            var id = this.id + "_" + this.map.id;
            div = OpenLayers.Util.createAlphaImageDiv(id, centered,
                                      new OpenLayers.Size(sz.w, 
                                              this.zoomStopHeight),
                                      imgLocation + "panzoombar/"+this.variant+"/"+"hsl-zoombar.png", 
                                      "absolute", null, "crop");
            div.style.height = sz.h + "px";
        } else {
            div = OpenLayers.Util.createDiv(
                        'OpenLayers_Control_PanZoomBar_Zoombar' + this.map.id,
                        centered,
                        sz,
                        imgLocation+"panzoombar/"+this.variant+"/"+"hsl-zoombar.png");
        }
        
        this.zoombarDiv = div;
        
        this.divEvents = new OpenLayers.Events(this, div, null, true, 
                                                {includeXY: true});
        this.divEvents.on({
            "mousedown": this.divClick,
            "mousemove": this.passEventToSlider,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });
        
        this.div.appendChild(div);

        this.startTop = parseInt(div.style.top,10);
        this.div.appendChild(slider);

        this.map.events.register("zoomend", this, this.moveZoomBar);

        centered = centered.add(0, 
            this.zoomStopHeight * this.map.getNumZoomLevels());
        return centered; 
    },

    onMouseOver: function(e) {
        if (this.dummyScaleDiv) {
            this.dummyScaleDiv.style.opacity = 1;
            this.dummyScaleDiv.style.filter = "(opacity=100)";
            for (var i = 0, len = this.dummyScaleDivs.length; i < len; i++) {
                this.dummyScaleDivs[i].style.display = "block";
            }
        }
        else {
            this.dummyScaleDivs = [];
            if (this.dummyScales && this.dummyScales.length > 0) {

                var sz = new OpenLayers.Size();
                sz.h = this.zoomStopHeight * this.map.getNumZoomLevels();
                sz.w = 100;
                var center = new OpenLayers.Pixel(parseInt(this.zoombarDiv.style.left,10),
                                                parseInt(this.zoombarDiv.style.top,10)); 
                this.dummyScaleDiv = OpenLayers.Util.createDiv(
                            'OpenLayers_Control_PanZoomBar_DummyZoombar' + this.map.id,
                            center.add(0,0),
                            sz);
                this.dummyScaleDiv.className = "dummyScaleDivBackground";
                this.div.appendChild(this.dummyScaleDiv);
                this.dummyScaleDiv.style.display = "block";
                this.dummyScaleDiv.style.zIndex = "-1";
                this.dummyScaleDiv.style.opacity = 1;
                this.dummyScaleDiv.style.filter = "alpha=(opacity=100";

                this.addDummyScales();

                OpenLayers.Event.observe(this.dummyScaleDiv, "mouseover", 
                    OpenLayers.Function.bind(this.onMouseOver, this));
                OpenLayers.Event.observe(this.dummyScaleDiv, "mouseout", 
                    OpenLayers.Function.bind(this.onMouseOut, this));
            }
        }
    },

    addDummyScales: function() {
        var center = new OpenLayers.Pixel(0,0);
        center = center.add(this.zoomStopWidth,0);
        var sz = new OpenLayers.Size(64,19);

        for (var i = 0; i < this.dummyScales.length; i++) {
            var res = OpenLayers.Util.getResolutionFromScale(
                    this.dummyScales[i].scale, this.map.units);
            var zoom  = this.map.getZoomForResolution(res);
            var pos = ((this.map.getNumZoomLevels()-1) - zoom ) * 
                this.zoomStopHeight-3;
            var dummyScaleDiv = OpenLayers.Util.createDiv(
                        'OpenLayers_Control_PanZoomBar_DummyZoombarDiv' + this.map.id,
                        center.add(0,pos),
                        sz);
            var a = document.createElement("a");
            a.zoom = zoom;
            a.appendChild(document.createTextNode(this.dummyScales[i].label));
            dummyScaleDiv.appendChild(a);
            dummyScaleDiv.className = "dummyScaleLabel";
            this.zoombarDiv.appendChild(dummyScaleDiv);

            OpenLayers.Event.observe(a, "mouseup", 
                    OpenLayers.Function.bind(this.onDummyScaleMouseUp, {map:this.map,zoom:zoom}));
            this.dummyScaleDivs.push(dummyScaleDiv);
        }
    },

    onMouseOut: function(e) {
        if (this.dummyScaleDiv) {
            this.dummyScaleDiv.style.opacity = 0.01;
            this.dummyScaleDiv.style.filter = "alpha(opacity=.1)";
        }
        for (var i = 0, len = this.dummyScaleDivs.length; i < len; i++) {
            this.dummyScaleDivs[i].style.display = "none";
        }
    },

    onDummyScaleMouseUp: function(e) {
        this.map.zoomTo(this.zoom);
    },

    CLASS_NAME: "HSLayers.Control.PanZoomBar"
});
