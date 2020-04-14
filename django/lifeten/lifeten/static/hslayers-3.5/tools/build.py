#!/usr/bin/env python
"""Main build script for HSLayers """

import shutil
import sys,os

# the dirs must be relative to this file
BUILDDIR="build"
SOURCEDIR="source"
THEMEDIR=os.path.join("resources","theme")
OLDIR=os.path.join("resources","ol")
IMGDIR=os.path.join("resources","img")
APPS=["MapPanel","MapPortal","MapViewer","SLD","WPSClient","LayerSwitcher","Editing"]
OLVERSION="2.12"

############## DO NOT EDIT ANYTHING BELOW THIS LINE ################

# get this file name
if __name__ == "__main__":
	BUILDSCRIPT=os.path.abspath(sys.argv[0])
else:
	 BUILDSCRIPT=os.path.abspath(__file__)


sys.path.append(os.path.split(BUILDSCRIPT)[0])

from optparse import OptionParser

TOOLS=os.path.split(BUILDSCRIPT)[0]
ORIGDIR = os.path.abspath(os.path.curdir)

# get absolute paths
RESOURCESDIR=os.path.abspath(os.path.join(TOOLS,"..","resources"))
THEMEDIR=os.path.abspath(os.path.join(RESOURCESDIR,"theme"))
OLDIR=os.path.abspath(os.path.join(RESOURCESDIR,"ol"))
IMGDIR=os.path.abspath(os.path.join(RESOURCESDIR,"img"))
SOURCEDIR = os.path.abspath(os.path.join(TOOLS,"..","source"))

#
# clear the build directory
#
def clear():
    """clear the build directory"""
    
    global BUILDDIR

    for i in os.listdir(BUILDDIR):
        if i in [   ".svn",
                    "build",
                    "doc",
                    "source",
                    "tools",
                    "CMakeLists.txt",
                    "examples",
                    "INSTALL",
                    "resources"]:
            continue
        name = os.path.join(BUILDDIR,i)
        if os.path.isdir(name):
            print "Removing directory: ",name
            shutil.rmtree(name)
        if os.path.isfile(name):
            os.remove(name)

#
# compress all javascript files
#
def compressJS(debug=False):
    """compress javascript files"""
    import compress

    global SOURCEDIR
    global BUILDDIR

    compress.compress("config/HSLayers.cfg",SOURCEDIR,BUILDDIR,debug)

#
# build the apps dependences
#
def buildAppsDependences(debug):
    """build dependent hslayers classes for other top-level classes"""
    import buildAppDeps

    global SOURCEDIR
    global BUILDDIR

    for app in APPS:
        print "Building ",app
        buildAppDeps.compress(os.path.join("config/","%s.cfg"%app),SOURCEDIR,os.path.join(BUILDDIR,"%s.js"%app),False,debug)
        buildAppDeps.compress(os.path.join("config/","%s.cfg"%app),SOURCEDIR,os.path.join(BUILDDIR,"%s-debug.js"%app),False,True)


#        
# join files to one file
#
def joinFilesToOneFile(dest, files):
    global BUILDDIR
    
    out = open(os.path.join(BUILDDIR,dest),"w")
    for f in files:
        js = open(os.path.join(BUILDDIR,f),"r")
        out.write(js.read())
        js.close()
    out.close();

#
# patch openlayers
#
def patchOpenLayers():
    """add patches to openlayers"""
    print "Patching OpenLayers" 
    import buildAppDeps

    global OLVERSION
    global OLDIR
    global BUILDDIR
    global SOURCEDIR

    shutil.copy(os.path.join(OLDIR,"OpenLayers-%s.js"%OLVERSION),os.path.join(BUILDDIR,"OpenLayers.js"))
    shutil.copy(os.path.join(OLDIR,"OpenLayers-%s-uncompressed.js"%OLVERSION),os.path.join(BUILDDIR,"OpenLayers-debug.js"))
    buildAppDeps.compress("config/OpenLayersPatches.cfg",SOURCEDIR, os.path.join(BUILDDIR,"OpenLayers.js"),True,False)
    buildAppDeps.compress("config/OpenLayersPatches.cfg",SOURCEDIR, os.path.join(BUILDDIR,"OpenLayers-debug.js"),True,True)

#
# merge css and images
#
def cssAndImages():
    """merge css files and images"""

    global THEMEDIR
    global OLDIR
    global BUILDDIR
    global SOURCEDIR

    try:
        os.mkdir(os.path.join(BUILDDIR,os.path.split(THEMEDIR)[1]))
    except OSError:
        shutil.rmtree(os.path.join(BUILDDIR,"theme"))
        shutil.rmtree(os.path.join(BUILDDIR,"img"))
        os.mkdir(os.path.join(BUILDDIR,os.path.split(THEMEDIR)[1]))
        pass

    def cp(indir,outdir,skipFileOrDir=[]):
        """copy everyhing from indir to outdir"""
        print "cp %s -> %s"% (indir,outdir)
        for i in os.walk(indir):
            if ".svn" in i[0]:
                continue
            dstdir = os.path.join(i[0].replace(indir,outdir))
            if not os.path.exists(dstdir):
                os.mkdir(dstdir)
            for File in i[2]:
                if File.find("~") > 0:
                    continue
                if os.path.exists(os.path.join(dstdir,File)):
                    if File.find(".css") > -1:
                        # css: append custom styles to default file 
                        style=open(os.path.join(dstdir,File),"a")
                        style.write(open(os.path.join(i[0],File),"r").read())
                        print "Appending",File
                    else:
                        shutil.copy(os.path.join(i[0],File),dstdir)
                else:
                    shutil.copy(os.path.join(i[0],File),dstdir)
            for dir in i[1]:
                if not os.path.exists(os.path.join(outdir,dstdir)):
                    os.mkdir(os.path.join(outdir,dstdir))

    # resources/ol/theme -> build/theme
    indir = os.path.join(OLDIR,"theme")
    outdir = os.path.join(BUILDDIR,os.path.split(THEMEDIR)[1])
    cp(indir,outdir)
    # resources/ol/img -> build/img
    indir = os.path.join(RESOURCESDIR,"img")
    outdir = os.path.join(BUILDDIR,"img")
    cp(indir,outdir)
    # resources/theme/default -> build/theme/default
    indir = os.path.join(THEMEDIR)
    outdir = os.path.join(BUILDDIR,os.path.split(THEMEDIR)[1])
    cp(indir,outdir)

    # resources/img -> build/img
    indir = os.path.join(IMGDIR)
    outdir = os.path.join(BUILDDIR,"img")
    cp(indir,outdir)

def doc():
    """build docs using jsdoc_toolkit"""
    #os.system("jsdoc -a -d=../doc/ -p -E='Apps' -r=3 -t=../resources/jsdoc/ ../source/")
    os.system("cd ../doc; make html")

    #shutil.copy(os.path.join("..","resources","jsdoc","hslayers.png"),
    #            os.path.join("../","doc"))
    #shutil.copy(os.path.join("..","resources","jsdoc","hslayers.png"),
    #            os.path.join("../","doc","symbols"))

if __name__ == "__main__":
    op = OptionParser(usage="""\n\t%prog [options]""")
    op.add_option("-b","--build",action="store_true",help="Build all sources")
    op.add_option("-r","--clear",action="store_true",help="Clear the build directory")
    op.add_option("-d","--documentation",action="store_true",help="Build the documentation")
    op.add_option("-D","--debug",action="store_true",help="Build the files in debug-mode")
    op.add_option("-p","--patch",action="store_true",help="Patch the OpenLayers with HSLayers patches")
    op.add_option("-c","--compress",action="store_true",help="Compress HSLayers files")
    op.add_option("-a","--apps",action="store_true",help="Build compressed classes needed by some high-level classes and applications")
    op.add_option("-i","--imagescss",action="store_true",help="Merge CSS and Images")
    defaultTargetDirectory = os.path.abspath(os.path.join(TOOLS,"..","build"))
    op.add_option("-t","--target",help="Target directory: %s"%(defaultTargetDirectory),metavar="dir",default=defaultTargetDirectory)

    options, args = op.parse_args()
    
    mapFunctions = [
            {"patch":patchOpenLayers},
            {"compress":compressJS},
            {"imagescss":cssAndImages},
            {"apps":buildAppsDependences},
            {"documentation": doc}]

    if options.target == defaultTargetDirectory:
        BUILDDIR = options.target
    else:
        BUILDDIR = os.path.abspath(options.target)

    #chdir - we are working from the tools directory (where ever it is)
    os.chdir(TOOLS)

    build = False
    needHelp = True

    # clear them
    if options.clear:
        needHelp = False
        clear()

    # build'em all
    if options.build:
        needHelp = False
        build = True
        for fn in mapFunctions:
            key = fn.keys()[0]
            if key in ["apps","compress"]:
                fn[key](options.debug)
            else:
                fn[key]()

    # build only selected 
    else:
        for fn in mapFunctions:
            key = fn.keys()[0]
            if eval("options.%s"%key):
                if key in ["apps","compress"]:
                    fn[key](options.debug)
                else:
                    fn[key]()
                if key != "imagescss":
                    build = True
                needHelp = False

    if needHelp:
        print op.format_help()

else:
    #chdir
    os.chdir(TOOLS)

