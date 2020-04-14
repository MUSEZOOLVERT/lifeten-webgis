#!/usr/bin/env python
# coding=utf-8

import unittest
import logging
import os,sys

OWSVIEWER_DIR=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))

sys.path.append(OWSVIEWER_DIR)

from OWS import *
import wcs

import mapscript

class TestBasicOWS(unittest.TestCase):

    config = None

    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_getservice(self):
        os.environ.update({"QUERY_STRING":
                "owsService=WCS&owsUrl=http%3A//localhost/cgi-bin/wcs&request=GetCapabilities&service=wms"})

        mywcs = getService()
        self.assertTrue(isinstance(mywcs, wcs.WCS))
        
        mapObj = mywcs.makeMap()

        self.assertTrue(isinstance(mapObj, mapscript.mapObj))
        self.assertEquals(mapObj.numlayers,2)

if __name__ == "__main__":
    unittest.main()
