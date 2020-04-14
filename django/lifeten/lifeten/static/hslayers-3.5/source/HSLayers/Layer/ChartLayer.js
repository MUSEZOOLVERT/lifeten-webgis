/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
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

/**
 * @requires OpenLayers/Format/GeoJSON.js
 * @requires OpenLayers/Layer/GML.js
 * @requires OpenLayers/Style.js
 * @requires OpenLayers/StyleMap.js
 */

/**
 * Create a vector layer with Chart symbolization (generated by Google Chart API)
 *
 * @class HSLayers.Layer.ChartLayer
 *
 * @augments <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Layer/GML-js.html">OpenLayers.Layer.GML</a>  
 *
 * @example:
 * // see http://code.google.com/apis/chart/
 * var chartParams = {
 *    url: "http://vm-glog.wirelessinfo.cz/glog/glog/entry.php?class=Tools.Shp2GeoJson&shp=c:/ms4w/apps/glog/data/DataFiles/Sumperk/tr_cin_1_2008.shp&inCp=1250&outCp=utf8",
 *    chartSizeAttribution: "SUMA",
 *    chartSizeSteps: {
 *        values: "5|10|20",
 *        sizes: "20|40|60|80"
 *    },
 *    chartAttributions: "P140,P148,P155,P158,P176,P185,TOXI,P197A,P202,P215,P217,P221,P234,P238,P241,P242,P247_1A,P247_1B,P248,P250,P250B,P254,P255,P256A,P257,P257B",
 *    chartMaxSize: 100,
 *    chartMaxValue: 20,
 *    chartWidthOffset: 0,
 *    chartShortTitle: "Paragraf",
 *    chartLongTitle: "Popis paragrafu",
 *    chartValueTitle: "Počet",
 *    chartColorTitle: "Barva",
 *    chartSumaTitle: "Celkem",
 *    chartShortNames: "§140|§148|§155|§158|§176|§185|TOXI|§197a|§202|§215|§217|§221|§234|§238|§241|§242|§247/1a|§247/1b|§248|§250|§254|§255|§256a|§257|§257b",
 *    chartLongNames: "Padělání a pozměňování peněz|Zkrácení daně, poplatku a podobné povinné platby|Útok na veřejného činitele|Zneužívání pravomoci veřejného činitele|Padělání a pozměňování veřejné listiny|Nedovolené ozbrojování|Nedovolená výroba a držení omamných a psychotropních látek a jedů, Šíření toxikomanie|Násilí proti skupině obyvatelů a proti jednotlivci|Výtržnictví|Týrání svěřené osoby|Ohrožování výchovy mládeže|Ublížení na zdraví|Loupež|Porušování domovní svobody|Znásilnění|Pohlavní zneužívání|Krádež|Krádež vloupáním|Zpronevěra|Podvod|Zatajení věci|Porušování povinnosti při správě cizího majetku|Zvýhodňování věřitele|Poškozování cizí věci|Sprejerství",
 *    chartPopupTemplate: "<h2>Přehled trestných činů</h2><br/><div>Lokalita: @ULICE@<div><br/>@TABLE_CONTENT@<p/><a href=\"./kriminalita_legenda.html\" target=\"legenda\">Legenda</a>",
 * 
 *    chartParams: {
 *      cht: "p",
 *      chco: "FFB3B3|FF8080|99FF99|FFB3FF|FF4C4C|FF80FF|0000FF|66FF66|FF4CFF|FFFF99|FFFF66|4CFF4C|19FF19|FF00FF|FFFF19|CDCD00|FF1919|FF0000|CD0000|800000|990099|660000|4C0000|00CD00|008000"
 *    },
 *
 *    dynamic: true,
 *    dynamicZoom: 8,
 *    dynamicMaxZoom: 8,
 *    dynamicMinZoom: 7
 * }
 *
 *
 * var chartLayer = new HSLayers.Layer.ChartLayer("Chart",
 *                      "http://vm-glog.wirelessinfo.cz/glog/glog/entry.php?class=Tools.Shp2GeoJson&shp=c:/ms4w/apps/glog/data/DataFiles/Sumperk/tr_cin_1_2008.shp&inCp=1250&outCp=utf8", # Normal GML file
 *  chartParams,
 *  {isBaseLayer: false});
 *
 */ 
HSLayers.Layer.ChartLayer = 
    OpenLayers.Class(OpenLayers.Layer.GML, {
    
    /**
     * @private
     * @name HSLayers.Layer.ChartLayer._params
     * @type Object Parameters for generating of charts
     */
    _params: null,
    
    /**
     * @private
     * @name HSLayers.Layer.ChartLayer._selectControl
     * @type <a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Control/SelectFeature-js.html">OpenLayers.Control.SelectFeature</a> control for selecting chart features
     */

    _selectControl: null,
    
    /**
     * @function
     * @name HSLayers.Layer.ChartLayer.initialize
     *
     * @param {String}  name
     * @param {String} url of a GML file.
     * @param {Object} params
     * @param {Object} options hashtable of extra options to tag onto the layer.
     */
     initialize: function(name, url, params, options) {
        var newArguments = [];
        
        options.format = OpenLayers.Format.GeoJSON;
        options.styleMap = this._createChartStyleMap(
            this._processParams(params)
        );
        
        newArguments.push(name, url, options);
        OpenLayers.Layer.GML.prototype.initialize.apply(this, newArguments);
        this._params = params;
    },         
    
    /**
     * Return style for drawing charts
     * @private
     * @function
     * @name HSLayers.Layer.ChartLayer._createChartStyleMap
     *
     * @param {Object} param parameters for generating of chart
     *
     * @returns {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/StyleMap-js.html">OpenLayers.StyleMap</a>}
     */
    _createChartStyleMap: function(params) {
        
        var symbol = {
            getSizeForScale: function(feature, symbolSize) {
                var aScale = 1;
                if (feature.layer != null) {
                    if (params.dynamic) {
                        var zoom = feature.layer.map.getZoom();
                        if (zoom > params.dynamicMaxZoom) {
                            zoom = params.dynamicMaxZoom;
                        }
                        if (zoom < params.dynamicMinZoom) {
                            zoom = params.dynamicMinZoom;
                        }
                        aScale = Math.pow(2, zoom - params.dynamicZoom + 1);
                    }
                }
                symbolSize = Math.round(symbolSize) * aScale;
                return symbolSize;
            },
            
            getSizeCalculate: function(feature) {
                var value = feature.attributes[params.chartSizeAttribution];
                var symbolSize = (value / params.chartMaxValue) * params.chartMaxSize;
                symbolSize = this.getSizeForScale(feature, symbolSize);
                return symbolSize;
            },
            
            getSizeSteps: function(feature) {
                var symbolSize = -1;
                var values = [0].concat(params.chartSizeSteps.values.split("|"));
                for (var i = 1; i < values.length; i++) {
                    values[i] = parseInt(values[i]);
                }
                var sizes = params.chartSizeSteps.sizes.split("|");
                if (sizes.length == values.length) {
                    values.push(10000000);
                    var value = feature.attributes[params.chartSizeAttribution];
                    for (var i = 1; i < values.length; i++) {
                        if ((value >= values[i - 1]) && (value < values[i])) {
                            symbolSize = sizes[i - 1];
                            break;
                        }
                    }
                } else {
                    OpenLayers.Console.log("Bad length of [chartSizeSteps.values] and [chartSizeSteps.sizes] items !");
                    OpenLayers.Console.log(params.chartSizeSteps);
                }
                
                symbolSize = this.getSizeForScale(feature, symbolSize);
                return symbolSize;
            },
            
            getSize: function(feature) {
                var symbolSize = 10;
                if (params.chartSizeSteps != null) {
                    symbolSize = this.getSizeSteps(feature);
                } else {
                    symbolSize = this.getSizeCalculate(feature);
                }
                return symbolSize;
            },
            
            getHeight: function(feature) {
                var size = this.getSize(feature);
                return size;               
            },

            getWidth: function(feature) {
                var size = this.getSize(feature);
                size = Math.round(size * params.chartWidthRatio);
                size = size + params.chartWidthOffset;
                return size;               
            }
        }

        var context = {
            getHeight: function(feature) {
                return symbol.getHeight(feature);
            },

            getWidth: function(feature) {
                return symbol.getWidth(feature);
            },
            
            getChartURL: function(feature) {
                var values = "";
                var attrs = params.chartAttributions.split(",");
                for (var i = 0; i < attrs.length; i++) {
                    if (values != "") {
                        values += ",";
                    }
                    var value = feature.attributes[attrs[i]];
                    if (value == null) {
                        value = "0";
                    }
                    values += value;
                }
                var cht = params.chartParams.cht || "p";
                var chf = params.chartParams.chf || "bg,s,ffffff00"
                
                var chartParamsUrl = "";
                var ignoreParams = new Array('cht', 'chd', 'chs', 'chf');
                for (chartParamName in params.chartParams) {
                    if (OpenLayers.Util.indexOf(ignoreParams, chartParamName) == -1) {
                        chartParamsUrl += "&" + chartParamName + 
                            "=" + params.chartParams[chartParamName];
                    }
                }
                   
                var height = symbol.getHeight(feature);
                var width = symbol.getWidth(feature);
                
                var chartUrl = 
                    "http://chart.apis.google.com/chart?" + 
                    "chd=t:" + values + "&chs=" + width + "x" + height +
                    "&cht=" + cht +
                    "&chf=" + chf +
                    chartParamsUrl;

                if (params.debug) {
                    OpenLayers.Console.log(chartUrl);
                }
                return chartUrl;
            }
        };

        var template = {
            fillOpacity: 1.0,
            externalGraphic: "${getChartURL}",
            graphicWidth: "${getWidth}",
            graphicHeight: "${getHeight}",
            strokeWidth: 0,
            cursor: "pointer"
        };

        var style = new OpenLayers.Style(template, {context: context});
        var styleMap = new OpenLayers.StyleMap({"default": style, "select": {fillOpacity: 1}});
        return styleMap;
    },   
    
    /**
     * Method is called when user click on feature (chart)
     * @private
     * @function
     * @name HSLayers.Layer.ChartLayer._onFeatureSelect
     *
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature/Vector-js.html">OpenLayers.Feature.Vector</a>} feature which is selected by user
     */
    _onFeatureSelect: function(feature) {
        var htmlContent = this.createPopupContent(feature);            

        feature.popup = new OpenLayers.Popup.FramedCloud("chicken", 
            feature.geometry.getBounds().getCenterLonLat(),
            null, htmlContent, null, true, 
            OpenLayers.Function.bind(this._onPopupClose, this)
        );
        this.map.addPopup(feature.popup);
    },
    
    /**
     * Method is called when feature is unselect
     * @private
     * @function
     * @name HSLayers.Layer.ChartLayer._onFeatureUnselect
     *
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature/Vector-js.html">OpenLayers.Feature.Vector</a>} feature which is unselected
     */
    _onFeatureUnselect: function(feature) {
        this.map.removePopup(feature.popup);
        feature.popup.destroy();
        feature.popup = null;        
    },
    
    /**
     * Method is called when popup is closed
     * @private
     * @function
     * @name HSLayers.Layer.ChartLayer._onPopupClose
     *
     * @param {Object} evt
     */
    _onPopupClose: function(evt) {
        if (this.selectedFeatures.length > 0) {
            this._selectControl.unselect(this.selectedFeatures[0]);
        }
    },
  
    /**
     * Process parameters and initialize default values
     * @private
     * @function
     * @name HSLayers.Layer.ChartLayer._processParams
     *
     * @param {Object} param parameters for generating of charts
     *
     * @returns {Object} initialized parameters for generating of charts
     */
    _processParams: function(params) {
        var newParams = params;
        newParams.debug = params.debug || false;
        newParams.dynamic = params.dynamic || false;
        newParams.dynamicZoom = params.dynamicZoom || 0;
        newParams.dynamicMaxZoom = params.dynamicMaxZoom || 100; 
        newParams.dynamicMinZoom = params.dynamicMinZoom || 0; 
        newParams.chartParams = params.chartParams || {};
        newParams.chartWidthRatio = params.chartWidthRatio || 1;
        newParams.chartShowColorInPopup = params.chartShowColorInPopup;
        if (newParams.chartShowColorInPopup == null) {
            newParams.chartShowColorInPopup = true;
        }
        return params;
    },
    
    /**
     * Process template for popup content
     * @private
     * @function
     * @name HSLayers.Layer.ChartLayer._processTemplateParams
     *
     * @param {String} tableContent table with chart values
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature/Vector-js.html">OpenLayers.Feature.Vector</a>} feature for which is popup template processed
     *
     * @returns {String} content of popup
     */
    _processTemplateParams: function(tableContent, feature) {
        var content = this._params.chartPopupTemplate.replace("@TABLE_CONTENT@", tableContent);
        for (attrName in feature.attributes) {
            content = content.replace("@" + attrName + "@", feature.attributes[attrName]);
        }
        return content;
    },
    
    /**
     * Create and activate control for selecting features (charts)
     * @function
     * @name HSLayers.Layer.ChartLayer.activateSelectFeatureControl
     */
    activateSelectFeatureControl: function() {
        var options = {
            hover: false,
            onSelect: OpenLayers.Function.bind(this._onFeatureSelect, this),
            onUnselect: OpenLayers.Function.bind(this._onFeatureUnselect, this)
        };

        this._selectControl = new OpenLayers.Control.SelectFeature(this, options);
        this.map.addControl(this._selectControl);
        this._selectControl.activate();        
    },
    
    /**
     * Return popup content for selected feature
     * @function
     * @name HSLayers.Layer.ChartLayer.createPopupContent
     *
     * @param {<a href="http://dev.openlayers.org/releases/OpenLayers-2.8/doc/apidocs/files/OpenLayers/Feature/Vector-js.html">OpenLayers.Feature.Vector</a>} feature for creating popup content
     *
     * @returns {String} content of popup
     */
    createPopupContent: function(feature) {    
        var shortTitle = this._params.chartShortTitle || "";
        var longTitle = this._params.chartLongTitle || "";
        var valueTitle = this._params.chartValueTitle || "";
        var colorTitle = this._params.chartColorTitle || "";
        var sumaTitle = this._params.chartSumaTitle || "";
        
        var shortNames = this._params.chartShortNames || "";
        var longNames = this._params.chartLongNames || "";        
        var colors = this._params.chartParams.chco;
        var showColorInPopup = 
            (this._params.chartShowColorInPopup && (colors != null));
        
        var content = "";
        content += "<table class=\"chartTable\"><tr>";
        content += "<th>" + shortTitle + "</th>";
        if (showColorInPopup) {
            content += "<th>" + colorTitle + "</th>";
        }
        if (longNames != "") {
            content += "<th>" + longTitle + "</th>";
        }        
        content += "<th>" + valueTitle + "</th></tr>"
        var attrs = this._params.chartAttributions.split(",");
        var shortNameArray = shortNames.split("|");
        if (showColorInPopup) {
            var colorArray = colors.split("|");
        }
        if (longNames != "") {
            var longNameArray = longNames.split("|");
        }
        for (var i = 0; i < attrs.length; i++) {
            var value = feature.attributes[attrs[i]];
            if (value > 0) {
                content += "<tr>";
                var shortName = shortNameArray[i];
                if ((shortName == null) || (shortName == "")) {
                    shortName = attrs[i];
                }
                content += "<td>" + shortName + "</td>";
                if (showColorInPopup) {
                    content += "<td><div style=\"width:48px;height:32px;background-color:#" + colorArray[i] + ";\">&nbsp;</div></td>";
                }
                if (longNames != "") {
                    content += "<td>" + longNameArray[i] + "</td>";
                }
                content += "<td>" + value + "</td></tr>";
            }
        }
        var colSpan = 1;
        if (longNames != "") {
            colSpan += 1;
        }
        if (showColorInPopup) {
            colSpan += 1;
        }
        content += "<tr><td colspan=\"" + colSpan + "\">" + sumaTitle + "</td>";
        content += "<td>" + feature.attributes[this._params.chartSizeAttribution] + "</td></tr>";
        content += "</table>"
        
        if (this._params.chartPopupTemplate != null) {
            content = this._processTemplateParams(content, feature);
        }
        return content;
    },
    
    /**
     * @name HSLayers.Layer.ChartLayer.CLASS_NAME
     * @type String
     */
    CLASS_NAME: "HSLayers.Layer.ChartLayer"
});   

OpenLayers.Layer.ChartLayer = HSLayers.Layer.ChartLayer;
