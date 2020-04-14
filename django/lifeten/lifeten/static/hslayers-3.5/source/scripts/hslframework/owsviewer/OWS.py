#!/usr/bin/env python
# coding=utf-8

import urlparse
import urllib
from lxml import objectify
import os,sys
import tempfile
import logging
import ConfigParser
import md5
import mapscript
from string import Template

class OWS:

    capabilities = None
    url = None
    requestUrl = None
    mapobj = None
    qstring = None
    owsNs = "http://www.opengis.net/ows/1.1"
    cachedir = None
    mapfileName = "mapfile.map"
    config = None
    parsedUrl = None
    service = None

    def __init__(self,url=None,qstring=None,configFile=None):
        self.requestUrl = url
        if url:
            self.url = url
            self.__getCapabilities()
        if qstring:
            self.qstring = qstring

        configFiles = [
                os.path.join(os.path.dirname(__file__),"config.cfg")
                ]
        if sys.platform == "win32":
            pass # TODO Default conf. file on windows platform
        elif sys.platform == "linux2":
            configFiles.append("/etc/owsviewer.cfg")

        if configFile:
            configFiles.append(configFile)

        self.config = ConfigParser.ConfigParser()
        self.config.read(configFiles)

        logging.debug("Creating cachedir for %s in %s" % (self.url,self.config.get("OWSViewer","cachedir")))
        logging.debug("%s initialized"%self.service)

    def __getCapabilities(self):
        self.parsedUrl = urlparse.urlparse(self.url)
        params = urlparse.parse_qs(self.parsedUrl.query,keep_blank_values=True)
        if "request" in params:
            params["request"] = "GetCapabilities"
        else:
            params["REQUEST"] = "GetCapabilities"

        if "service" in params:
            params["service"] = self.service
        else:
            params["SERVICE"] = self.service

        url = urlparse.urlunparse((self.parsedUrl[0],
                                    self.parsedUrl[1],
                                    self.parsedUrl[2],
                                    self.parsedUrl[3],
                                    urllib.urlencode(params),
                                    self.parsedUrl[5]))
        e = objectify.parse(urllib.urlopen(url))
        self.capabilities = e.getroot()

        try:
            params.pop("service")
        except:
            pass

        try:
            params.pop("request")
        except:
            pass

        try:
            params.pop("SERVICE")
        except:
            pass

        try:
            params.pop("REQUEST")
        except:
            pass

        self.url = urlparse.urlunparse((self.parsedUrl[0],
                                        self.parsedUrl[1],
                                        self.parsedUrl[2],
                                        self.parsedUrl[3],
                                        urllib.urlencode(params),
                                        self.parsedUrl[5]))

    def getParams(self):
        return urlparse.parse_qs(self.qstring)

    def performRequest(self):
        pass

    def getOnlineResource(self,onlineresource,mapfilename=None):
        o = urlparse.urlparse(onlineresource)
        params = urlparse.parse_qs(o.query,keep_blank_values=True)
        params["owsUrl"] = self.url
        params["owsService"] = self.service
        params["map"] = self.getMapfileLocation(mapfilename)


        location = urlparse.urlunparse((o[0],o[1],o[2],o[3],urllib.urlencode(params),o[5]))
        logging.debug("Setting OnlineResource to %s"% location)
        return location

    def getMapfileLocation(self,mapfilename=None):

        # save the map if possible
        if mapfilename:
            mapfilename.replace("..","") # remove potential path change

            # mapfile must end with .map and cachedir must be at the
            # beginning of the mapfile name
            if mapfilename.endswith(".map") and \
               mapfilename.find(self.cachedir) == 0:
                    return mapfilename
                    
            else:
                # do not save anything
                return
        # save to new location otherwice
        else:
            return os.path.join(self.cachedir,self.mapfileName)

    def __getCacheDir(self):
        
        self.cachedir = tempfile.mkdtemp(prefix="%s-%s"%(self.service,
                                        md5.new(self.url).hexdigest()),
                                        dir=self.config.get("OWSViewer","cachedir"))
        logging.debug("Cachedir %s created" % self.cachedir)
        open(os.path.join(self.cachedir,"url.txt"),"w").write(self.url)
        return self.cachedir

    def performRequest(self):
        request = mapscript.OWSRequest()
        request.loadParams()
        mapobj = None

        self.request=request.getValueByName("REQUEST")

        # if no 'map' parameter in URL, create new mapfile
        if not request.getValueByName("map"):
            mapobj = self.makeMap()
        else:
            # there is 'map' parameter in URL and the file exists, load it
            if os.path.isfile(request.getValueByName("map")):
                mapobj = mapscript.mapObj(request.getValueByName("map"))
            # there is 'map' parameter in URL BUT the file does not exist:
            # create
            else:
                mapobj = self.makeMap(request.getValueByName("map"))

        print mapobj.OWSDispatch(request)

    def getMapObj(self,mapfilename=None):

        self.__getCacheDir()

        if self.url is not None and self.capabilities is None:
            self.__getCapabilities()

        mapobj = mapscript.mapObj()

        mapobj.setMetaData("wms_onlineresource",self.getOnlineResource(self.config.get("MapServer","onlineresource"),mapfilename))

        logging.debug("Setting SRS to %s"%self.config.get("MapServer","srs"))
        mapobj.setMetaData("wms_srs",self.config.get("MapServer","srs"))

        mapobj.setProjection("init=epsg:4326")
        mapobj.setSize(500,500)
        mapobj.setExtent(-180,-90,90,180)

        logging.debug("Setting ERRORFILE to %s"%self.config.get("MapServer","errorfile"))
        mapobj.setConfigOption("MS_ERRORFILE",self.config.get("MapServer","errorfile"))

        logging.debug("Setting IMAGEPATH to %s"%self.config.get("MapServer","imagepath"))
        mapobj.web.imagepath=self.config.get("MapServer","imagepath")

        mapobj.setMetaData("ows_enable_request","*")
        mapobj.setMetaData("wms_enable_request","*")

        return mapobj

    def saveMapfile(self,mapobj,mapfilename):

        mapfilename = self.getMapfileLocation(mapfilename)
        if mapfilename:

            # save mapfile ONLY if GetCapabilities requested - it makes no
            # sense for other cases
            logging.info("Saving mapfile to %s" %  mapfilename)
            mapobj.save(mapfilename)
        else:
            logging.info("Mapfile NOT saved")

    def getLayerUrl(self):

        layerurl = self.url

        if self.url.find("?") > -1:
            if not self.url.endswith("?") and\
                not self.url.endswith("&"):
                layerurl += "&"
        else:
            layerurl += "?"

        return layerurl

    def createLayerDefinitionFile(self, name, templatefile):

            layerurl = self.getLayerUrl()
            defFileName = os.path.join(self.cachedir,'%s.%s'%(name,self.service.lower()))
            open(defFileName,'w').write(
                    Template(open(templatefile).read()).substitute( 
                            dict(url= layerurl, name=name)))

            return defFileName


def getService():

    qstring = os.environ["QUERY_STRING"]
    params = urlparse.parse_qs(qstring)
    
    owsUrl = urllib.unquote(params["owsUrl"][0])

    if params["owsService"][0].lower() == "wfs":
        from wfs import WFS
        return WFS(owsUrl,qstring)
    elif params["owsService"][0].lower() == "wcs":
        from wcs import WCS
        return WCS(owsUrl,qstring)
    
