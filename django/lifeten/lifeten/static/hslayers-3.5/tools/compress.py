#!/usr/bin/env python
"""
    Compress javascript files from source to destination directory

    compress.py [--help|-h] --config=file --source=dir --destination=dir
    
    -h|--help    - This message
    -c|--config  - Configuration file name
    -s|--source  - Source directory
    -d|--destination  - Destination directory

"""
import sys,os

import subprocess
import jsmin
import shutil

def compressFile(source,dest):
        js = open(source,"r")
        jscontent = js.read()
        file(dest,"w").write(
            jsmin.jsmin(jscontent))
        js.close()

def compress(cfg,source,dest,debug=False):
    """for each file call jsmin and store compressed version"""

    # open configuration file
    files = open(cfg,"r")
    for f in files.readlines():
        f = f.strip()

        # skip comments
        if f.find("#") == 0:
            continue;

        # make directories
        path = os.path.split(f)
        if path[0]:
            try:
                os.makedirs(os.path.join(dest,path[0]))
            except OSError:
                pass


        if debug == False:
            print "Compressing",f 
            compressFile(os.path.join(source,f), os.path.join(dest,f))
        else:
            print "Copying",f 
            out = open(os.path.join(dest,f),"w")
            out.write(open(os.path.join(source,f)).read())
            out.close()

    files.close()

def usage():
    print __doc__

def parseArgs():
    import getopt

    cfg = None
    source = None
    destination = None

    try:                                
        opts, args = getopt.getopt(sys.argv[1:], "hc:s:d:",
                ["help", "source=","config=","destination="])
    except getopt.GetoptError,e:          
        print "\nERROR:",e
        usage()                         
        sys.exit(2)                     

    for opt, arg in opts:                
        if opt in ("-h", "--help"):      
            usage()                     
            sys.exit()                  

    for opt, arg in opts:                
        if opt in ("-h","--help"):
            usage()
            sys.exit()
        elif opt in ("-c", "--config"): 
            cfg = arg
        elif opt in ("-s", "--source"): 
            source = arg
        elif opt in ("-d", "--destination"): 
            destination = arg

    if not cfg:
        print >>sys.stderr, "\nERROR: configuration file not specified\n"
        usage()
        sys.exit(2)
    if not source:
        print >>sys.stderr, "\nERROR: source directory not specified\n"
        usage()
        sys.exit(2)
    if not destination:
        print >>sys.stderr, "\nERROR: destination directory not specified\n"
        usage()
        sys.exit(2)
    return (cfg, source, destination)
    
if __name__ == "__main__":

    (cfg, source, dest) = parseArgs()

    if not os.path.exists(dest):
        print >>sys.stderr, "\nDestination directory %s not found!\n" % dest
    if not os.path.exists(source):
        print >>sys.stderr, "\nSource directory %s not found!\n" % source

    compress(cfg, source, dest)
