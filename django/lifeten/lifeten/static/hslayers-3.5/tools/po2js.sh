#!/bin/bash

if [ $# -ne 1 ]; then
	echo "Usage:"
	echo "$0: <path_to_po_file>"
	echo ""
	echo "po file has to be in /source/Lang folder and it has to have right name containing language shortcut"
	exit
fi

PATH_TO_PO=$1
PO_FILENAME=${1##*/}
PATH_TO_JS="${1%.po}.js"
LANG_VERS3=`echo ${PO_FILENAME%.po} | cut -d "-" -f 2`

echo PATH_TO_PO     $PATH_TO_PO
echo PO_FILENAME    $PO_FILENAME
echo PATH_TO_JS     $PATH_TO_JS
echo LANG_VERS3     $LANG_VERS3 

case $LANG_VERS3 in
	spa )
		LANG_VERS2="es"
	;;
	cze )
		LANG_VERS2="cs-CZ"
	;;
	ger )
	 	LANG_VERS2="de-DE"
	;;
	lav )
		LANG_VERS2="lv-LV"
	;;
	slo )
		LANG_VERS2="sk-SK"
	;;
esac

echo "OpenLayers.Lang[\""$LANG_VERS2"\"] = {" > $PATH_TO_JS

IFS=$'\n'

for i in `grep -E "^msg(id|str)[ \t]*[\'\"]{1}[^\'\"]*[\'\"]{1}[ \t]*$" $PATH_TO_PO`; do
	#echo $i

	if echo $i | grep -q "msgid"; then
		echo -ne "$i:" | sed 's/[ \t]*msgid[ \t]*/\t/g' >> $PATH_TO_JS 
	elif echo $i | grep -q "msgstr"; then
		echo "$i," | sed 's/[ \t]*msgstr[ \t]*//g' >> $PATH_TO_JS
	fi

done

LAST_LINE=$(wc -l $PATH_TO_JS | cut -d ' ' -f 1)
#echo $LAST_LINE
sed -i "${LAST_LINE}s/\,$//g" $PATH_TO_JS
	
echo "};" >> $PATH_TO_JS
