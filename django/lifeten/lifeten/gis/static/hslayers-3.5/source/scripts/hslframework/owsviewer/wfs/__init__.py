#!/usr/bin/env python
# coding=utf-8

from OWS import OWS
import mapscript
import cgi
from lxml import objectify
import urllib
import urlparse
import logging
from osgeo import ogr
import os


class WFS(OWS):

    service = "WFS"

    def __init__(self,url=None,qstring=None,configFiles=None):
        OWS.__init__(self,url,qstring)

    def makeMap(self,mapfilename=None):

        mapobj = self.getMapObj(mapfilename)

        for layer in self.capabilities.FeatureTypeList.getchildren():
            if layer.tag != "{http://www.opengis.net/wfs}FeatureType":
                    continue
            name = layer.Name.text
            logging.debug("Creating layer %s" % name)
            

            layerDefFile = self.createLayerDefinitionFile(name,
                    os.path.join( os.path.dirname(__file__), "templates",'wfs.xml'))

            ds = ogr.Open(layerDefFile)

            lyrobj = mapscript.layerObj(mapobj)
            lyrobj.name = name
            lyrobj.title = layer.Title.text
            lyrobj.data = layerDefFile
            lyrobj.setMetaData("wms_title",layer.Title.text)
            lyrobj.setMetaData("wfs_typename",layer.Name.text)
            lyrobj.setMetaData("wfs_version",self.capabilities.attrib["version"])

            if ds:
                ogrLayer = ds.GetLayerByName(name)
                if ogrLayer:
                    feature = ogrLayer.GetNextFeature()
                    if feature:
                        geom = feature.GetGeometryRef()
                        if geom:
                            lyrobj.type = self.getGeomName(geom.GetGeometryName())
                        else:
                            mapobj.removeLayer(mapobj.numlayers-1)
                            logging.debug("No ogrGeometry found")
                            continue
                    else:
                        mapobj.removeLayer(mapobj.numlayers-1)
                        logging.debug("No ogrFeature found")
                        continue
                else:
                    mapobj.removeLayer(mapobj.numlayers-1)
                    logging.debug("No ogrLayer found")
                    continue
            else:
                mapobj.removeLayer(mapobj.numlayers-1)
                logging.debug("No ogrDataSource found")
                continue

            lyrobj.setProjection(layer.SRS.text)
            lyrobj.dump = mapscript.MS_TRUE 
            lyrobj.template = "foo"
            cls = mapscript.classObj(lyrobj)
            style = mapscript.styleObj(cls)
            style.outlinecolor=mapscript.colorObj(134,81,0)
            style.color=mapscript.colorObj(238,153,0)
            style.size=5
            style.width=5

        self.saveMapfile(mapobj,mapfilename)
        return mapobj
    
    def getGeomName(self,geomname):

        if geomname.find("LINE") > -1:
            return mapscript.MS_LAYER_LINE
        elif geomname.find("POLYGON") > -1:
            return mapscript.MS_LAYER_POLYGON
        else:
            return mapscript.MS_LAYER_POINT

