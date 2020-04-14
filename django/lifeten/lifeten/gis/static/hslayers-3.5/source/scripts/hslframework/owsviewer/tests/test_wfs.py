#!/usr/bin/env python
# coding=utf-8

import unittest
import os,sys
import logging

OWSVIEWER_DIR=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))

sys.path.append(OWSVIEWER_DIR)

print OWSVIEWER_DIR
from OWS import *
import wfs

class TestBasicOWS(unittest.TestCase):

    config = None
    newwfs = None

    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_getcapabilities(self):
        os.environ.update({"QUERY_STRING":
                "owsService=WFS&owsUrl=http%3A//bnhelp.cz/ows/crwfs&request=GetCapabilities&service=wms"})

        mywfs = getService()
        self.assertTrue(isinstance(mywfs, wfs.WFS))
        
        mapObj = mywfs.makeMap()

        self.assertTrue(isinstance(mapObj, mapscript.mapObj))
        self.assertEquals(mapObj.numlayers,8)

        pass

if __name__ == "__main__":
    unittest.main()
