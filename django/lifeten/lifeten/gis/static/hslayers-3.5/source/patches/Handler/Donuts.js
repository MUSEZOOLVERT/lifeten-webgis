/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD       
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. 

 * Author(s): Jachym Cepicky <jachym bnhelp cz>, Help Service - Remote
 * Sensing s.r.o.
 *
 * Purpose: enable digitizing donut-line polygons (polygons with holes)
 */
OpenLayers.Handler.Polygon.prototype.createFeature = function(pixel) {
        var lonlat = this.control.map.getLonLatFromPixel(pixel);
        this.point = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
        );

        /* donut starts here */
        var found = false;
        var features = this.control.layer.features;
        if (features) {
            for (var i = 0; i < features.length; i++) {
                // intersects and is polygon
                if (features[i].geometry.intersects(this.point.geometry) && features[i].geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                    this.polygon = features[i];
                    found = true;
                    break;
                }
                this.polygon = null;
            }
        }
        
        this.line = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.LinearRing([this.point.geometry])
        );
        if (!this.polygon)  {
            this.polygon = new OpenLayers.Feature.Vector(
                                            new OpenLayers.Geometry.Polygon());
        }
        this.polygon.geometry.addComponent(this.line.geometry);
        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
        if (!found) {
            this.layer.addFeatures([this.polygon, this.point.geometry], {silent: true});
        }
        /* donut ends here */
    };

OpenLayers.Handler.Path.prototype.mousedown = OpenLayers.Handler.Polygon.prototype.mousedown = function(evt) {
        

        // ignore double-clicks
        if (this.lastDown && this.lastDown.equals(evt.xy)) {
            return false;
        }

        if(this.lastDown == null) {
            if(this.persist) {
                this.destroyFeature();
            }
            this.mod = this.checkModifiers(evt);
            this.createFeature(evt.xy);
        } else if((this.lastUp == null) || !this.lastUp.equals(evt.xy)) {
            this.addPoint(evt.xy);
        }
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.drawing = true;
        return false;
    };

OpenLayers.Handler.Polygon.prototype.finalize = function(cancel) {
        var key = cancel ? "cancel" : "done";
        this.drawing = false;
        this.mouseDown = false;
        this.lastDown = null;
        this.lastUp = null;

        // destroy the feature from original layer, if needed
        if (this.polygon.layer == this.control.layer) {
            for (var i = 0; i < this.control.layer.features.length; i++) {
                if (this.control.layer.features[i] == this.polygon) {
                    this.control.layer.removeFeatures([this.control.layer.features[i]]);
                }
            }
        }

        this.callback(key, [this.geometryClone()]);
        if(cancel || !this.persist) {
            this.destroyFeature();
        }
    };
