"""Python script used for transformatig raster OGC WMS requests into
different coordinate systems

        python __init__.py http://foo.bar/wms?service=wms&request=getmap...&srs=epsg:900913  epsg:4326
"""

__author__ = "Jachym Cepicky"
__version__= "2.0.0"

import os,sys
os.environ["MS_ERRORFILE"] = "/tmp/log"
os.putenv("MS_ERRORFILE","/tmp/log")

import urlparse
from urllib import urlencode
from urllib import unquote
import mapscript
import tempfile
import logging
import traceback
import textwrap

class SRS:
    """Class for storing PROJ coordinate systems"""
    authority = None
    code = None
    def __init__ (self,authority,code):
        self.authority = authority
        self.code = code

    def toMapScript(self):
        return mapscript.projectionObj(self.__str__())

    def __str__(self):
        return "%s:%s"%(self.authority.upper(),self.code)

class WMSURL:
    scheme= None #'http'
    netloc= None #'www.bnhelp.cz'
    path= None #'/cgi-bin/crtopo2'
    fragment = None
    query = None

    wmsarguments = [ "service", "request", "layers", "transparent",
            "format", "exceptions", "version", "styles", "srs", "bbox",
            "width", "height"]

    arguments = {}
    # others will follow

    def __init__(self,url):
        parseURL = urlparse.urlparse(unquote(url))
        try:
                self.arguments = urlparse.parse_qs(parseURL.query)
        except:
                # fuck python 2.5!!
                self.arguments = {}
                for arg in parseURL.query.split("&"):
                        from mod_python import apache
                        apache.log_error(arg,apache.APLOG_ERR)
                        try:
                                (key,value) = arg.split("=")
                                self.arguments[key] = value
                        except:
                                pass

        self.arguments["reaspect"] = "false"

        for i in self.arguments:
            if type(self.arguments[i]) == type ([]):
                self.arguments[i] = self.arguments[i][0]


        self.scheme = parseURL.scheme
        self.netloc = parseURL.netloc
        self.path = parseURL.path
        self.fragment = parseURL.fragment

        self.setArgument("exceptions","application/vnd.ogc.se_inimage")

    def setArgument(self,arg,value):
        if self.arguments.has_key(arg):
            self.arguments[arg] = value
        elif self.arguments.has_key(arg.lower()):
            self.arguments[arg.lower()] = value
        elif self.arguments.has_key(arg.upper()):
            self.arguments[arg.upper()] = value
        else:
            self.arguments[arg] = value

    def getArgument(self,arg):
        if self.arguments.has_key(arg):
            return self.arguments[arg]
        elif self.arguments.has_key(arg.lower()):
            return self.arguments[arg.lower()]
        elif self.arguments.has_key(arg.upper()):
            return self.arguments[arg.upper()]
        else:
            return ''

    def toString(self):
        """Return complete WMS URL of this layer"""
        self.query = {}
        for i in self.arguments:
            self.query[i] = self.arguments[i]

        self.query = urlencode(self.query)

        return urlparse.urlunsplit((self.scheme, self.netloc,
            self.path, self.query,self.fragment))

    def getConnection(self):
        """return layer connection, withnout wms parameters"""
        self.query = {}
        for i in self.arguments:
            # if the argument is in wmsarguments (converted to UPPERCASE,
            # ignore
            if not i.upper() in map(lambda x: x.upper(),self.wmsarguments):
                self.query[i] = self.arguments[i]

        self.query = urlencode(self.query)

        return urlparse.urlunsplit((self.scheme, self.netloc,
            self.path, self.query,self.fragment))

class Warper:
    """Warper class

    Attributes:
    url -- original URL of the WMS request
    sourceSRS -- source coordinate system (EPSG code)
    urlArguments -- key-value list of url arguments
    map -- mapscript.mapObj
    layer -- mapscript.layerObj
    """

    def __init__(self, url=None, sourceSRS=None):
        """Initialization of the Warper class

        Keyword arguments:
        url -- original URL of the WMS request
        sourceSRS -- source coordinate system (EPSG code)
        """

        if url:
            self.setURL(unquote(url))
        if sourceSRS:
            self.setSRS(unquote(sourceSRS))


    def setURL(self,url):
        self.url = WMSURL(url)
        srs = self.url.getArgument("srs")
        (authority,code) = srs.split(":")
        self.targetSRS = SRS(authority, code)

    def setSRS(self,srs):

        (authority, code) = srs.split(":")
        self.sourceSRS = SRS(authority,code)

    def warp(self):
        """Warp given URL and SRS

        Returns:
        mapscript.ImageObj
        """
        if not self.url or not self.sourceSRS:
            return
        self.map = mapscript.mapObj()
        self.map.setSize(int(self.url.getArgument("width")),int(self.url.getArgument("height")))
        (minx,miny,maxx,maxy) = map(lambda x: float(x), self.url.getArgument("bbox").split(","))
        self.map.extent = mapscript.rectObj(minx,miny,maxx,maxy)
        self.map.web.imagepath=tempfile.mkdtemp()
        self.map.setProjection(self.targetSRS.__str__())
        self.layer = mapscript.layerObj(self.map)
        self.layer.type = mapscript.MS_LAYER_RASTER
        self.layer.connection = self.url.getConnection()
        self.layer.status = mapscript.MS_DEFAULT
        self.layer.setConnectionType(mapscript.MS_WMS,None)
        self.layer.setMetaData("wms_srs",self.sourceSRS.__str__())
        self.layer.setMetaData("wms_name", self.url.getArgument("layers"))
        self.layer.setMetaData("wms_server_version",self.url.getArgument("version"))

        # WMS 1.3.0 is not supported by MapServer < 6.0 
        #  http://trac.osgeo.org/mapserver/ticket/3039
        if self.url.getArgument("version") == "1.3.0":
            self.layer.setMetaData("wms_server_version","1.1.1")
            
            if self.sourceSRS.authority == "CRS" and self.sourceSRS.code == "84":
                self.layer.setMetaData("wms_srs","EPSG:4326")
                

        self.layer.setMetaData("wms_exceptions_format",self.url.getArgument("exceptions"))
        self.layer.setMetaData("wms_formatlist",self.url.getArgument("format"))
        self.layer.setMetaData("wms_style",self.url.getArgument("style"))
        self.layer.setMetaData("wms_transparent",self.url.getArgument("transparent"))
        self.layer.setProjection(self.sourceSRS.__str__())
        self.layer.debug = 5

        if self.url.getArgument("format") == "image/png":
            self.map.outputformat.imagemode = mapscript.MS_IMAGEMODE_RGBA
        if self.url.getArgument("format") == "image/jpg":
            self.layer.setMetaData("wms_formatlist","image/jpeg")
            self.map.selectOutputFormat("image/jpeg")
        else:
            self.map.selectOutputFormat(self.url.getArgument("format"))
        self.map.outputformat.transparent= 1

        try:
            # draw the map
            #self.map.save("/tmp/pokus2.map")
            image = self.map.draw()
            if image:
                return image
        except :

            # something failed during the layer drawing. try to print the
            # error to stderr as well as generate new image with the error
            # message
            exc_type, exc_value, exc_traceback = sys.exc_info()
            traceback.print_exc(file=sys.stderr)
            traceback.print_tb(exc_traceback, limit=1, file=sys.stderr)

            self.map.removeLayer(0)
            self.map.setFontSet(os.path.join(os.path.abspath(os.path.dirname(__file__)),"fonts.txt"))
            self.map.outputformat.transparent= 0

            self.layer = mapscript.layerObj(self.map)
            self.layer.type = mapscript.MS_LAYER_ANNOTATION
            #self.layer.transform = mapscript.MS_OFF

            line = mapscript.lineObj()
            line.add(mapscript.pointObj(minx+(maxx-minx)/2.,miny+(maxy-miny)/2.))
            feature = mapscript.shapeObj()
            feature.add(line)
            self.layer.addFeature(feature)
            self.layer.labelcache = mapscript.MS_TRUE
            

            classobj = mapscript.classObj(self.layer)
            text = ""
            
            ## try to guess, where the problem is
            for i in textwrap.wrap(str(exc_value),70):
                text += i+"\n"
            classobj.setText(text)

            classobj.label.font = "sans"
            classobj.label.type = mapscript.MS_TRUETYPE
            classobj.label.antialias = mapscript.MS_FALSE
            classobj.label.size = 12
            classobj.label.position = mapscript.MS_CC
            #classobj.label.partials = mapscript.MS_FALSE
            classobj.label.force = mapscript.MS_TRUE


            self.layer.status = mapscript.MS_ON
            #self.map.save("/tmp/pokus3.map")
            image =  self.map.draw()
            return image



if __name__ == "__main__":
    """example usage:
        
        python __init__.py http://foo.bar/wms?service=wms&request=getmap...&srs=epsg:900913  epsg:4326

    """

    import sys
    try:
        warper = Warper(sys.argv[1], sys.argv[2])
        image = warper.warp()
        image.save("/tmp/map.img")
        print """saved to "/tmp/map.img" """
    except IndexError:
        print __doc__
