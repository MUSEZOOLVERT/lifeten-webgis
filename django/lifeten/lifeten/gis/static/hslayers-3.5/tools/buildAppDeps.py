#!/usr/bin/env python
"""
    Compress javascript files from source and make one file of them.

    buildAppDeps.py [--help|-h] [--append|-a] [--debug|-d] --config=file --source=dir --output=file.js
    
    -h|--help    - This message
    -a|--append  - Append compressed files to the output file, rather then
                    rewrite it
    -d|--debug   - Don't compress files (debug version)
    -c|--config  - Configuration file name
    -s|--source  - Source directory
    -o|--output  - Output file name

"""
import sys,os

import subprocess
import jsmin
import shutil

def compress(cfg,source,output,append=False,debug=False):

    # open destination file
    out = None
    if append:
        out = open(output,"a")
    else:
        out = open(output,"w")
    # open configuration file
    files = open(cfg,"r")

    for f in files.readlines():
        f = f.strip()

        # skip comments
        if f.find("#") == 0:
            continue;

        js = open(os.path.join(source,f),"r")
        jscontent = js.read()
        if debug:
            out.write(jscontent)
        else:
            out.write(jsmin.jsmin(jscontent))
        js.close()
    out.close();
    files.close()

def usage():
    print __doc__

def parseArgs():
    import getopt

    cfg = None
    source = None
    output = None
    append= False

    try:                                
        opts, args = getopt.getopt(sys.argv[1:], "hadc:s:o:",
                ["help","append","debug","source=","config=","output="])
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
        elif opt in ("-o", "--output"): 
            output = arg
        elif opt in ("-a", "--append"): 
            append=True
        elif opt in ("-d", "--debug"): 
            debug=True

    if not cfg:
        print >>sys.stderr, "\nERROR: configuration file not specified\n"
        usage()
        sys.exit(2)
    if not source:
        print >>sys.stderr, "\nERROR: source directory not specified\n"
        usage()
        sys.exit(2)
    if not output:
        print >>sys.stderr, "\nERROR: output file not specified\n"
        usage()
        sys.exit(2)
    return (cfg, source, output, append, debug)
    
if __name__ == "__main__":

    (cfg, source, output ,append, debug) = parseArgs()

    if not os.path.exists(source):
        print >>sys.stderr, "\nSource directory %s not found!\n" % source

    compress(cfg, source, output, append, debug)
