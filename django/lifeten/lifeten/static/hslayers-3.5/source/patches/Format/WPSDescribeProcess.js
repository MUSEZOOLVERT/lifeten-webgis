/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */
 
/**
 * Add LiteralOutput parser
 */
OpenLayers.Format.WPSDescribeProcess.prototype.readers.wps.LiteralOutput = function(node, output) {
                output.literalOutput = {};
                this.readChildNodes(node, output.literalOutput);
            };
