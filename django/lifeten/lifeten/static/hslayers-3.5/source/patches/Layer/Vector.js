/**
 * $Id: Vector.js 3155 2009-03-02 09:40:32Z mavlk $
 * Author  : Martin Vlk <mavlk at helpforest dot cz>
 * Purpose : Implements posibility to work with more vector layers for one control.
 *           See readme.txt for details.
 * Version : $Rev: 3155 $
 */

OpenLayers.Layer.Vector.prototype.display = function(display) { 
    OpenLayers.Layer.prototype.display.apply(this, arguments); 
    // we need to set the display style of the root in case it is attached 
    // to a foreign layer 
    var currentDisplay = this.div.style.display; 
    if(currentDisplay != this.renderer.root.style.display) { 
        this.renderer.root.style.display = currentDisplay; 
    } 
};
    