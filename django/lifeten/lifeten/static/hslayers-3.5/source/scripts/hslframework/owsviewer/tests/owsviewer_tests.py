#!/usr/bin/env python

import unittest
import os,sys

OWSVIEWER_DIR=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))

sys.path.append(OWSVIEWER_DIR+"/../")

import owsviewer

class TestBasicOWS(unittest.TestCase):

    config = None

    def setUp(self):
        self.config = os.path.join(OWSVIEWER_DIR,"config.cfg")

    def test(self):

        owsv = owsviewer.OWSViewer(self.config)
        pass

if __name__ == "__main__":
    unittest.main()
