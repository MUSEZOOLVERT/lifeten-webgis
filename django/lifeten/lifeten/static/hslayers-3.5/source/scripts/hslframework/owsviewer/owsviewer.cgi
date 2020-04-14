#!/usr/bin/python

import sys
sys.path.append("/home/jachym/usr/src/hsrs/hslayers/trunk/source/scripts/hslframework/owsviewer/")

import OWS
import logging
logging.basicConfig(level=logging.DEBUG)

service = OWS.getService()
service.performRequest()
