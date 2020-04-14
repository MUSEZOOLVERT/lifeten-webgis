/**
 * $Id: Util.js 4609 2011-05-17 13:49:06Z jachym $
 * Author  : Martin Vlk <mavlk at helpforest dot cz>
 * Purpose : Fix handle URL with encoded special latin character
 *           See readme.txt for details.
 * Version : $Rev: 4609 $
 */
OpenLayers.Util.getParameters = function(url) {
    // if no url specified, take it from the location bar
    url = url || window.location.href;

    //parse out parameters portion of url string
    var paramsString = "";
    if (OpenLayers.String.contains(url, '?')) {
        var start = url.indexOf('?') + 1;
        var end = OpenLayers.String.contains(url, "#") ?
                    url.indexOf('#') : url.length;
	        paramsString = url.substring(start, end);
    }

    var parameters = {};
    var pairs = paramsString.split(/[&;]/);
    for(var i=0, len=pairs.length; i<len; ++i) {
        var keyValue = pairs[i].split('=');
        if (keyValue[0]) {

            var key = keyValue[0];
            try {
                key = decodeURIComponent(key);
            } catch (err) {
                key = decodeURIComponent(unescape(key));
            }
           
            // being liberal by replacing "+" with " "
            var value = (keyValue[1] || '').replace(/\+/g, " ");

            try {
                value = decodeURIComponent(value);
            } catch (err) {
                value = unescape(value);
            }
           
            // follow OGC convention of comma delimited values
            value = value.split(",")

            //if there's only one value, do not return as array                   
            if (value.length == 1) {
                value = value[0];
            }               
           
            parameters[key] = value;
        }
    }
    return parameters;
};

/**
 * $Id: Util.js 4609 2011-05-17 13:49:06Z jachym $
 * Author  : Michal Sredl <sredl at ccss dot cz>
 * Purpose : For pixel & size, check for each property if it is present.
 *           Otherwise, IE is troubled when one property is present and the other is not.
 * Version : $Rev: 4609 $
 */
OpenLayers.Util.modifyDOMElement = function(element, id, px, sz, position,
                                            border, overflow, opacity) {

    if (id) {
        element.id = id;
    }
    if (px) {
        if (px.x) {
            element.style.left = px.x + "px";
        }
        else {
            element.style.left = "0px";
        }
        if (px.y) {
            element.style.top = px.y + "px";
        }
        else {
            element.style.top = "0px";
        }
    }
    if (sz) {
        if (sz.w) {
            element.style.width = sz.w + "px";
        }
        else {
            element.style.width = "auto";
        }
        if (sz.h) {
            element.style.height = sz.h + "px";
        }
        else  {
            element.style.height = "auto";
        }
    }
    if (position) {
        element.style.position = position;
    }
    if (border) {
        element.style.border = border;
    }
    if (overflow) {
        element.style.overflow = overflow;
    }
    if (parseFloat(opacity) >= 0.0 && parseFloat(opacity) < 1.0) {
        element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
        element.style.opacity = opacity;
    } else if (parseFloat(opacity) == 1.0) {
        element.style.filter = '';
        element.style.opacity = '';
    }
};

