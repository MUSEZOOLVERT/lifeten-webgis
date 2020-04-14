import urllib
import tempfile
import ConfigParser 

DEFAULT_CONFIGS={}

class OWSViewer:
    workingDir = None
    config = None

    def __init__(self,configFiles):
        config = ConfigParser.ConfigParser()
        config.read(configFiles)

        self.workingDir = tempfile.mkdtemp(prefix="owsviewer",dir=config.get("server","tempdir",vars=DEFAULT_CONFIGS))
        
    def getImage(self,url,targetFormat="image/png"):
        pass

        


