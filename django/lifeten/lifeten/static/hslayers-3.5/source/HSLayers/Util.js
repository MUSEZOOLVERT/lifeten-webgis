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
 * HSLayers.Util do contain set of tools, which can be useful. For
 * programing.
 * @namespace HSLayers.Util 
 */
HSLayers.Util = {};

/**
 * Return some options, like resolution etc. for specified projection,
 * usable for {OpenLayers.Map}
 *
 * @param {String} projection projection such as "epsg:102067"
 * @param {Integer} min minimum scale (20 000 000 default)
 * @param {Integer} max maximum scale (500 default)
 *
 * @returns {Object} with parameters for `OpenLayers.Map`
 */
HSLayers.Util.getProjectionOptions = function(projection, min, max) {
    var options = {};
    switch (projection.toLowerCase()){
        case "epsg:102067": 
            options = { 
                maxExtent: new OpenLayers.Bounds(-905000,-1230000,-400000,-900000),
                resolutions: [],
                maxResolution: "auto",
                units: "m",
                projection: new OpenLayers.Projection("epsg:102067") 
            };

            var scales  = [ 20000000, 10000000, 5000000, 2000000,
                        1000000, 500000, 200000, 100000, 50000,
                        20000, 10000, 5000, 2000, 1000, 500 ];

            var resolutions = scales.map(function(s) {
                                return OpenLayers.Util.getResolutionFromScale(s, 
                                        (projection.proj ? projection.proj.units : undefined) || "m");
                             });
            
            if (!min) {
                min =  20000000;
            }
            if (!max) {
                max =  500;
            }
            // there is no indexOf in ECMA Script definition: custom
            // implementation
            for (var  i = 0; i < resolutions.length; i++) {
                if (max <= scales[i] &&
                    scales[i] <= min) {
                    options.resolutions.push(resolutions[i]);
                }
            }
            break;
        case "epsg:900913":
        case "epsg:3857":
            options = {
                projection: new OpenLayers.Projection("EPSG:3857"),
                numZoomLevels: 22,
                allOverlays: true
                //sphericalMercator: true,
                //maxResolution: 156543.0339,
                //maxExtent: new OpenLayers.Bounds( -20037508.34, -20037508.34, 20037508.34, 20037508.34),
                //units: "m"
            };
            break;
    }
    return options;
};

/**
 * Return cookie value for given cookie name
 *
 * @param {String} c_name  name of the cookie
 *
 * @returns {String} value of the cookie or empty string
 */
HSLayers.Util.getCookie = function(c_name) {
    if (document.cookie.length>0) {
        c_start=document.cookie.indexOf(c_name + "=");
        if (c_start!=-1) { 
            c_start=c_start + c_name.length+1; 
            c_end=document.cookie.indexOf(";",c_start);
            if (c_end==-1) {
                c_end=document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start,c_end));
        } 
    }
    return "";
};

/**
 * Geo microformat parser - parser for "geo" microformat for "span" tags
 *
 * @param {DOMObject} elem element, in which the parser should look after 
 * @param {String} source projection
 * @param {String} target projection
 *
 * @returns {OpenLayers.Feature.Vector} resulting vector feature
 */
HSLayers.Util.geoMicroformatParser = function(elem,srcprj,destprj) {
    var features = [];
    var elems =  elem.getElementsByTagName("span");

    for (var i = 0; i < elems.length; i++) {
        if (elems[i].className != "geo") {
            continue;
        }
        var lonlat = [];
        var innerElms = elems[i].getElementsByTagName("span");
        for (var j = 0; j < innerElms.length; j++) {
            lonlat.push(innerElms[j]);
        }
        var innerElms = elems[i].getElementsByTagName("abbr");
        for (var j = 0; j < innerElms.length; j++) {
            lonlat.push(innerElms[j]);
        }
        var lat = null;
        var lon = null;
        var title = null;
        for (var j=0; j < lonlat.length; j++) {
            if (lonlat[j].className == "latitude") {
                lat = parseFloat(lonlat[j].firstChild.nodeValue);
            }
            if (lonlat[j].className == "longitude") {
                lon = parseFloat(lonlat[j].firstChild.nodeValue);
            }
            if (lonlat[j].className == "title"){
                title = lonlat[j].firstChild.nodeValue;
            }
        }


        var lonlat = new OpenLayers.LonLat(lon,lat);
        // transform
        if (srcprj && destprj) {
            var destProj = (typeof(destprj) == "string" ?
                    new OpenLayers.Projection(destprj) :
                    destprj);
            var srcProj = (typeof(srcprj) == "string" ?
                    new OpenLayers.Projection(srcprj) :
                    srcprj);
            lonlat = lonlat.transform(srcProj,destProj);
        }
        
        var geometry  = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
        features.push(new OpenLayers.Feature.Vector(geometry,
                    {name:title,elem:elems[i],
                    _HSID: i
                    }));
    }

    return features;
};

/**
 * Geonames parser
 *
 * @param {DOMElement} XMLDOM xml document in DOM form
 * @param {String} projection=map.getProjection() target projection
 *
 * @returns {OpenLayers.Feature.Vector} resulting vector feature
 */
HSLayers.Util.geoNamesParser = function(XMLDOM,projection,extent) {
    var nodes = XMLDOM.getElementsByTagName("geoname");
    var features = [];
    for (var i = 0; i < nodes.length; i++) {
        var lon = nodes[i].getElementsByTagName("lng")[0].firstChild.nodeValue;
        var lat = nodes[i].getElementsByTagName("lat")[0].firstChild.nodeValue;
        var lonlat = new OpenLayers.LonLat(lon,lat)

        // transform
        if (projection) {
            var destProj = (typeof(projection) == "string" ?
                    new OpenLayers.Projection(projection) :
                    projection);
            lonlat = lonlat.transform(new OpenLayers.Projection("epsg:4326"),destProj);
        }

        var data = {
                name: nodes[i].getElementsByTagName("name")[0].firstChild.nodeValue
        };
        var geometry  = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
        var feature = new OpenLayers.Feature.Vector(geometry,data);

        features.push(feature);
    }

    return features;
};

/**
 * Create base layer OpenLayers.Layer.Image with specified attributes.
 *
 * @param {Boolean} sphericalMercator
 * @param {OpenLayers.Bounds} extent
 * @param [{Float}] resolutions
 * @param [{Float}] scaels
 * @returns {[OpenLayers.Layer]} base layer
 */
HSLayers.Util.getBaseLayer = function(sphericalMercator,extent,resolutions,scales) {
    var baseLayer;
    if (sphericalMercator) {
        baseLayer = new OpenLayers.Layer.XYZ("BaseLayer SpericalMercator",
                //"http://foo/bar/${z}/${x}/${y}",
                OpenLayers.Util.getImagesLocation("blank.gif")+"?${z},${x},${y}",
                {
                    isBaseLayer: true, 
                    sphericalMercator: true,
                    visibility: false, 
                    wrapDateLine: true,
                    displayInLayerSwitcher:false 
                });
    }
    else {
        var size = new OpenLayers.Size(1,(extent.right-extent.left)/(extent.top-extent.bottom)); 
        baseLayer = new OpenLayers.Layer.Image("BaseLayer", 
                        OpenLayers.Util.getImagesLocation()+"blank.gif", 
                        extent, size, 
                        { 
                            isBaseLayer: true, 
                            resolutions: resolutions,
                            scales: scales,
                            format: "image/gif",
                            visibility:true, 
                            displayInLayerSwitcher:false 
                        }); 
    }
    return baseLayer;
};

/**
 * get iso format of date object
 * @function
 * @param {Date} time
 * @return {String} time string in ISO format
 */
HSLayers.Util.getIsoDate = function(time) {
    var str = "";
    str += time.getFullYear().toString();
    str += "-";
    var month = time.getMonth()+1;
    str += (month < 10 ? "0":"")+month.toString();
    str += "-";
    var day = time.getDate();
    str += (day < 10 ? "0":"")+day.toString();
    str += "T";
    var hours = time.getHours();
    str += (hours < 10 ? "0":"")+hours.toString();
    str += ":";
    var minutes = time.getMinutes();
    str += (minutes < 10 ? "0":"")+minutes.toString();
    str += ":";
    var seconds = time.getSeconds();
    str += (seconds < 10 ? "0":"")+seconds.toString();
    return str;
};

/**
 * replace http://.... text with <a href=""> links
 * @function
 * @param {String} url
 * @returns {String}
 */
HSLayers.Util.addAnchors = function(url) {
    if (!url) return null;

    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return url.replace(exp,"<a href='$1'>$1</a>"); 
};

/**
 * Send data to server and obtain URL for later usage
 * @function
 */
HSLayers.Util.feedback = function(data,filename) {
    filename = filename || "data";

    var xhr = OpenLayers.Request.POST({
        url: HSLayers.statusManagerUrl,
        params: {
            request:"feedback",
            filename: filename,
            data: data
        },
        async: false
    });

    return xhr;

};


/**
 * render length info
 * @function
 * @name HSLayers.FeaturesGrid.renderLength
 * @param v {Float} length in map units
 * @param units {String} map units
 * @returns {String} rendered length
 */
HSLayers.Util.renderLength = function(v,units) {

    if (v <= 0) {
        return "&#8709;" 
    }

    units = units || "m";

    if (v > 1000) {
        v = Math.round(v)/1000;
        units = "k"+units;
    }
    else if (v > 1) {
        v = Math.round(v);
    }

    v = Math.round(v*1000)/1000;
    
    return String(v)+" "+units;
};

/**
 * render area info
 * @function
 * @name HSLayers.FeaturesGrid.renderArea
 * @param v {Float} area in map units
 * @param units {String} units
 * @returns {String} rendered area
 */
HSLayers.Util.renderArea = function(v,units) {

    if (v <= 0) {
        return "&#8709;" 
    }

    units = units || "m";

    var area = Math.round(v);

    if (area > 100000) {
        if (area > 99999) {
            area = Math.round(area/10000)/100;
        }
        else {
            area = Math.round(area/1000)/10/100;
        }
        units = "k"+units;
    }

    area = Math.round(area*1000)/1000

    return String(area)+" "+units+'<sup style="vertical-align:top;">2</sup>';
};

/**
 * Parses deegree string to standard decimal number
 * @author Tyler Akins http://rumkin.com/tools/gps/degrees.php
 * @license This JavaScript was written by Tyler Akins and is licensed under
 *    the GPL v3 -- http://www.gnu.org/copyleft/gpl.html
 *    See it on the original site -- http://rumkin.com/tools/gps/degrees.php
 *    Feel free to copy it to your site as long as you leave this header
 *    pretty much intact and as long as you are complying with the GPL.
 * @function
 * @name HSLayers.Util.degreeToLonLat
 * @param str {String}  "N 50° 51.858 E 015° 04.457" or "S  015° 04.457"
 *
 */
HSLayers.Util.degreeToLonLat= function(str) {
    var ll = [];
    var good = "0123456789.";
    
    // Change non-numbers into spaces.
    oldc = ' ';
    nrindx = {};

    // strip
    str = str.replace(/\s*$/,"").replace(/^\s*/,"");

    // get indexes of "E" and "N" and similar letters
    var j = 0;
    str = str.toUpperCase();
    var coords = str.split(/E|S|W|N/).map(function(c) { if (c) return c;});
    while (coords.indexOf(undefined) > -1) {
        coords.splice(coords.indexOf(undefined),1);
    };

    var dirs = {"E":{},"S":{},"W":{},"N":{}};
    var idxs = [];
    // push index of splitting character
    for (var d in dirs) {
        dirs[d].idx = str.indexOf(d);
        idxs.push(dirs[d].idx);
    }

    idxs.sort();

    // clear indexes of splitting characters (-1 should go)
    while (idxs.indexOf(-1) > -1) {
        idxs.splice(idxs.indexOf(-1),1);
    }

    // add strings to directions
    for (var i =0; i < idxs.length; i++) {
    
        if (idxs[i] == -1) {
            continue;
        }
        for (var d in dirs) {
            if (dirs[d].idx == idxs[i]) {
                dirs[d]._idx = i;
                dirs[d].str = coords[i];
                found = true;
            }
        }
    }

    var sign = 1;
    var ll;
    if (dirs["N"].idx > -1 && dirs["E"].idx > -1) { 
        ll = [dirs["E"].str, dirs["N"].str];
        sign = 1;
    }
    else {
        ll = [dirs["W"].str, dirs["S"].str];
        sign = -1;
    }
    var result = [];

    // for each coordinate from the pair
    for (var j = 0, jlen = ll.length; j < jlen; j++) {

        var coord = ll[j];
        var vv = "";
        var d = 0;
        var factor = 1;
        var c, oldc;

        // parse the coordiante
        for (var i = 0; i < coord.length; i ++) {
        
            // get the character "c"
            var c = coord.charAt(i).toUpperCase();

            // if the character is one of 'good's, take it
            // replace with space in all other cases
            if (good.indexOf(c) < 0) {
                c = ' ';
            }

            if (oldc != ' ' || c != ' ') {
                vv += c;
                oldc = c;
            }	
        }


        v = new Array();
        v = vv.replace(/\s*$/,"").replace(/^\s*/,"").split(" ");

        // to each member of the 'v' array apply 1/60 corection
        for (i = 0; i < v.length; i ++) {

            d += v[i] * factor;
            factor /= 60;
        }
        result.push(d*sign);
    }
    
    // create new OpenLayers.LonLat object
    return new OpenLayers.LonLat(result[0],result[1]);
};


/**
 * display mesage or help
 * @param title {String}
 * @param msg {String}
 * @param time {Integer}
 * @param target {String} element id
 * @param direction {String} t,b, ... default: t
 */
HSLayers.Util.msg = function(title, msg,timing,target,direction){

            var targetEl = target ? Ext.get(target) : Ext.getBody();
            direction = direction || "t";
           
            // get target elem xy
            var xy = targetEl.getAnchorXY();
            var elsize  = targetEl.getSize();
            var size = {width: 300, height: 75};

            var y = xy[1];
            if (direction == "b") {
                y = xy[1]+elsize.height-size.height;
            }

            var w = new Ext.Window({
                closable: true,
                modal: false,
                width:size.width,
                border: false,
                bodyBorder: false,
                hideBorders: true,
                height: size.height,
                hideAnimDuration: 1,
                x: ((xy[0]+elsize.width/2) - size.width/2),
                y: y,
                showAnimDuration: 1,
                shadow: false,
                closable: true,
                autoDestroy: true,
                closeAction: "hide",
                bodyStyle: {
                    padding: "10px"
                },
                style: {
                    verticalAlign: "middle",
                    textAlign: "center"
                },
                title: title,
                html: msg
            });

            w.show();
            var el = w.getEl();

            // fadein
            el.slideIn(direction).pause(timing || 5).ghost(direction, {remove:true});
        };


//HSLayers.Util.msg.init = function(){
//        if (!window.Ext) {
//            return;
//        }
//            /*
//            var t = Ext.get('exttheme');
//            if(!t){ // run locally?
//                return;
//            }
//            var theme = Cookies.get('exttheme') || 'aero';
//            if(theme){
//                t.dom.value = theme;
//                Ext.getBody().addClass('x-'+theme);
//            }
//            t.on('change', function(){
//                Cookies.set('exttheme', t.getValue());
//                setTimeout(function(){
//                    window.location.reload();
//                }, 250);
//            });*/
//
//            var lb = Ext.get('lib-bar');
//            if(lb){
//                lb.show();
//            }
//        }();
