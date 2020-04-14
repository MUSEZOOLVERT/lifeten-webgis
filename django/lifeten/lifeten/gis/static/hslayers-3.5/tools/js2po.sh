#!/bin/bash

if [ $# -ne 1 ]; then
	echo "Usage:"
	echo "$0 <path_to_hslayers_lang_file>"
	exit
fi
HSL_PATH_LANG=$1
HSL_LANG_FILE=${1##*/}
HSL_LANG_FOLDER=${1%/*}
HSL_FOLDER=`dirname $HSL_PATH_LANG`/../
PO_FILENAME="${HSL_LANG_FILE%.*}.po"

echo HSL_PATH_LANG         $HSL_PATH_LANG
echo HSL_LANG_FILE         $HSL_LANG_FILE
echo HSL_LANG_FOLDER       $HSL_LANG_FOLDER
echo HSL_FOLDER            $HSL_FOLDER
echo PO_FILENAME           $PO_FILENAME           

if [ ! -e $HSL_PATH_LANG ]; then
	echo "ERR: File $HSL_PATH_LANG does not exist!!"
        echo "Make sure that this $HSL_PATH_LANG is the right path to hslayers language file"
        exit
fi

if [ -e $HSL_LANG_FOLDER/$PO_FILENAME ]; then
	echo "$HSL_LANG_FOLDER/$PO_FILENAME exists, deleting"
	rm $HSL_LANG_FOLDER/$PO_FILENAME
fi

cat << EOF > $HSL_LANG_FOLDER/$PO_FILENAME
# CCSS Geoportal translation file
# Copyright (C) Czech Center for Science and society
# This file is distributed under the same license as the Geoportal package.
#
# Premysl Vohnout <vohnout@ccss.cz>, 2010.
# Přemysl Vohnout <premek@vohnout.cz>, 2010.
msgid ""
msgstr ""
"Project-Id-Version: 1.0 \n"
"Report-Msgid-Bugs-To: \n"
"POT-Creation-Date: 2010-08-31 15:15+0200 \n"
"PO-Revision-Date: 2010-08-31 21:21+0200 \n"
"Last-Translator: Přemysl Vohnout <premek@vohnout.cz> \n"
"Language-Team: American English <kde-i18n-doc@kde.org> \n"
"MIME-Version: 1.0 \n"
"Content-Type: text/plain; charset=UTF-8 \n"
"Content-Transfer-Encoding: 8bit \n"
"X-Generator: Lokalize 1.0 \n"
"Plural-Forms: nplurals=2; plural=(n != 1); \n"
EOF

# default delimiter
SAVE_IFS=$IFS
IFS=$(echo -en "\n")

KEYS=`grep -riEho "OpenLayers\.i18n\([\'\"]{1}[^\'\"]*[\'\"]{1}\)" $HSL_FOLDER | tr "'" '"' | sort | uniq | sed 's/^OpenLayers\.i18n(//g' | sed 's/)$//g' | sed '/^\"\"$/d'`

TRANS_LIST=`cat $HSL_PATH_LANG | grep -vE "^[ \t]*//" | grep -vE "^[ \t]*$" | grep -vE "OpenLayers\.Lang\[\".*\"\] \= \{" | grep -vE "\}\;$"\
	| tr "'" '"' | sed 's/^[ \t]*\"/\"/g' | sed 's/\"[ \t]*\:[ \t]*/\"\:/g' | sed ':a;N;$!ba;s/\:\n/\:/g' | sed ':a;N;$!ba;s/\+\n/\+ /g' | sed ':a;N;$!ba;s/\"[ \t]*\,[ \t]*\n/\"\n/g'` 

IFS=$'\n'

echo > trans_list.tmp
for z in $TRANS_LIST; do
	echo $z >> ./trans_list.tmp
done
echo > key.tmp
for i in $KEYS; do
#	echo $i >> key.tmp
	#echo "key : ${i}" 
	TRANSLATION=`cat ./trans_list.tmp | grep $i |head -n1 | sed 's/^\"[^\"]*\"\://g'`
	#echo "trans : $TRANSLATION"
	#echo

	if [ "x$TRANSLATION" != "x" ]; then
		echo "msgid $i" >> $HSL_LANG_FOLDER/$PO_FILENAME
		echo "msgstr $TRANSLATION"  >> $HSL_LANG_FOLDER/$PO_FILENAME
	else
		echo "msgid $i" >> $HSL_LANG_FOLDER/$PO_FILENAME
		echo 'msgstr ""'  >> $HSL_LANG_FOLDER/$PO_FILENAME
	fi
	echo >> $HSL_LANG_FOLDER/$PO_FILENAME
done
rm ./trans_list.tmp
