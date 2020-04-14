#!/bin/bash


tilesFolder=WMS_TILES
count=0

touch ${tilesFolder}/WMS_all.txt


while read line
do
	
	SPECIE_PK=`echo $line | awk 'BEGIN { FS = ";" } ; { print $1}'`		   #Primary species key
	WMS_NAME=`echo $line | awk 'BEGIN { FS = ";" } ; { print tolower($2) }' | sed 's/ //g' `  #Lowercase vernacular species name will be the WMS name			
	VIS=`echo $line | awk 'BEGIN { FS = ";" } ; { print $3}'`		   #Catches grid size (yes, should've done it using better SQL query... No time!')

#Random color generation for layer
	count=$((count + 1))	
	RED=`awk -v seed=$count 'BEGIN{srand(seed);print int(rand()*(0-255))+255 }'` 
	count=$((count + 1))
	GREEN=`awk -v seed=$count 'BEGIN{srand(seed);print int(rand()*(0-255))+255 }'`
	count=$((count + 1))
	BLUE=`awk -v seed=$count 'BEGIN{srand(seed);print int(rand()*(0-255))+255 }'`


#Mapserver WMS code here
WMS="
  LAYER
    CONNECTION \"dbname='lifeten' host=77.72.197.182 port=5432
user='lifeten' password='Life102013' sslmode=disable\"
    CONNECTIONTYPE POSTGIS
    DATA \"geom FROM (SELECT grid_`echo $VIS`x`echo $VIS`.geom AS geom, grid_`echo $VIS`x`echo $VIS`.gid, COUNT(occurrence.specie) FROM grid_`echo $VIS`x`echo $VIS` JOIN occurrence ON st_intersects(occurrence.wkb_geometry, grid_`echo $VIS`x`echo $VIS`.geom) WHERE specie='$SPECIE_PK' GROUP BY grid_`echo $VIS`x`echo $VIS`.gid) as subquery USING UNIQUE gid USING UNIQUE 25832\"
    METADATA
      \"ows_title\"    \"$WMS_NAME\"
      \"ows_featureid\"    \"gid\"
    END # METADATA
    NAME \"$WMS_NAME\"
    DUMP TRUE
    PROJECTION
      \"proj=utm\"
      \"zone=32\"
      \"ellps=GRS80\"
      \"towgs84=0,0,0,0,0,0,0\"
      \"units=m\"
      \"no_defs\"
    END # PROJECTION
    STATUS ON
    TYPE POLYGON
    UNITS METERS
    CLASS
      NAME \"Single symbol\"
      STYLE
        COLOR $RED $GREEN $BLUE
      END # STYLE
      STYLE
        OUTLINECOLOR 0 0 0
        WIDTH 0.26
      END # STYLE
    END # CLASS
  END # LAYER
"


if [ ! -d $tilesFolder ]
then
mkdir $tilesFolder
fi

#File creation with Mapserver code
echo "Building $WMS_NAME for species $SPECIE in folder $tilesFolder"
echo "$WMS" >  $tilesFolder/WMS_$WMS_NAME.txt
echo "$WMS" >> $tilesFolder/WMS_all.txt

done < $1
