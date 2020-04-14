#!/usr/bin/env python

import os
WARPER_DIR = os.path.split(os.path.abspath(__file__))[0]

import tempfile
try:
    from mod_python import apache
    import tempfile
    warperModule = apache.import_module(os.path.join(WARPER_DIR,"__init__.py"))
except ImportError,e:
    import cgi
    import cgitb
    cgitb.enable()

    import sys
    sys.path.append(WARPER_DIR)
    import warper as warperModule

def index(req,url=None,srs=None,hstosrs=None):
    """mod_python function"""
    if not srs:
        srs = hstosrs
    warper = warperModule.Warper(url,srs)
    image = warper.warp()
    tmpfile = tempfile.mktemp()
    image.save(tmpfile)
    req.content_type = warper.url.getArgument("format")
    req.write(open(tmpfile).read())
    os.remove(tmpfile)
    return apache.OK

if __name__ == "__main__":
    """CGI function"""
    form = cgi.FieldStorage()
    url = form["url"].value
    srs = form["srs"].value
    if not srs:
        srs = form["hstosrs"].value

    warper = warperModule.Warper(url,srs)
    image = warper.warp()
    tmpfile = tempfile.mktemp()
    image.save(tmpfile)
    sys.stdout.write("Content-type: %s\n\n" % (warper.layer.getMetaData("wms_formatlist")))
    sys.stdout.write(open(tmpfile).read())
    os.path.remove(tmpfile)
