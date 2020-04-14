/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD       
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. 

 * Author(s): Jachym Cepicky <jachym bnhelp cz>, Help Service - Remote
 * Sensing s.r.o.
 *
 * Purpose: Making nicer scales
 */

OpenLayers.Control.Scale.prototype.updateScale = function () {
        var scale = this.map.getScale();
        var imageName = OpenLayers.Util.getImagesLocation()+"/scales/scale"+Math.round(scale)+".gif";
        var imgLocation = OpenLayers.Util.getImagesLocation();
        this.element.innerHTML = "";
        if (!scale) return;

        if (scale < 1000) {
            scale = Math.round(scale);
        }
        else if (scale >= 1000 && scale <= 999999) {
            scale = (Math.round(scale)+"");
            var length = scale.length;
            scale = scale.substring(0,length-3)+" "+scale.substring(length-3,length+1);
        }
        else if (scale >= 999999 && scale <= 9999999) {
            scale = (Math.round(scale)+"");
            var length = scale.length;
            scale = scale.substring(0,length-3)+" "+scale.substring(length-3,length);
            scale = scale.substring(0,length-6)+" "+scale.substring(length-6,length+2);
        }
        else if (scale >= 9999999 && scale <= 999999999) {
            scale = (Math.round(scale)+"");
            var length = scale.length;
            scale = scale.substring(0,length-3)+" "+scale.substring(length-3,length);
            scale = scale.substring(0,length-6)+" "+scale.substring(length-6,length+2);
            scale = scale.substring(0,length-9)+" "+scale.substring(length-9,length+3);
        }
        
        var scaleImage = OpenLayers.Util.createImage(OpenLayers.Util.createUniqueID("scale"),
                                                    null, null,
                                                    imageName, null, null, null, null);
        this.element.appendChild(scaleImage);
        var scaleDiv = document.createElement("div");
        scaleDiv.className = "olScaleNumber";
        scaleDiv.appendChild(document.createTextNode("1 : " + scale));
        this.element.style.textAlign="center";

        this.element.appendChild(scaleDiv);
};
