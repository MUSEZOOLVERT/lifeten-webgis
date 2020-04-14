<?php

require_once('./embed-path.php');

function getUrlBase($relative = null) {
    $host = $_SERVER['HTTP_HOST'];
    $port = '';
    if (($_SERVER['SERVER_PORT'] != '80') && ($_SERVER['SERVER_PORT'] != '')) {
        $port = ':' . $_SERVER['SERVER_PORT'];
    }
    $url = 'http://' . $host . $port;
    if ($relative) {
        $url = $url . $relative;
    }
    return $url;
}

function getExtJsBaseUrl() {
    return getUrlBase(EXTJS_RELATIVE_URL);
}

function getProj4JsBaseUrl() {
    return getUrlBase(PROJ4JS_RELATIVE_URL);
}

function getHSLayersBaseUrl() {
    return getUrlBase(HSLAYERS_RELATIVE_URL);
}

function getOpenLayersBaseUrl() {
    return getUrlBase(OPENLAYERS_RELATIVE_URL);
}

function getParameters() {
    $params = $_REQUEST;
    $params['baseUrl'] = getUrlBase();
    $params['proj4jsUrl'] = PROJ4JS_RELATIVE_URL . '/';
    $params['proxy'] = PROXY_URL;
    return json_encode($params);
}

function generateOutput() {
    if ($_REQUEST['t'] == 'html') {
        $html = generateOutputForHtml();
    } else {
        $html = generateOutputForExtJS();
    }
    return $html;
}

function generateOutputForHtml() {
    $html = '';
    $html .= '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
    $html .= '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-US" lang="en-US">';
    $html .= '<head>';
    $html .= '    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
    $html .= '    <script type="text/javascript" src="' . getOpenLayersBaseUrl() . '/OpenLayers.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HS.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers/Format/State.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers/Embed.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers/Embed/EmbedHtml.js"></script>';
    $html .= '    <script type="text/javascript">';
    $html .= '    HSLayers.statusManagerUrl = "' . getUrlBase(HSLAYERS_STATUSMANAGER_URL) . '";';
    $html .= '    var embed = HSLayers.Embed.createByType("' . $_REQUEST['t'] .'");';
    $html .= '    embed.initParams(' . getParameters() . ');';
    $html .= '    embed.readMap();';
    $html .= '    </script>';
    $html .= '</head><body></body></html>';
    return $html;
}

function generateOutputForExtJS() {
    $mode = ($_REQUEST['dbg'] == '1') ? 1 : 2;
    $html = '';
    $html .= '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
    $html .= '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-US" lang="en-US">';
    $html .= '<head>';
    $html .= '    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
    $html .= '    <link rel="stylesheet" type="text/css" href="' . getExtJsBaseUrl() . '/resources/css/ext-all.css" />';
    $html .= '    <link rel="stylesheet" type="text/css" href="' . getExtJsBaseUrl() . '/resources/css/xtheme-gray.css" />';
    $html .= '    <script type="text/javascript" src="' . getExtJsBaseUrl() . '/adapter/ext/ext-base.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getExtJsBaseUrl() . '/ext-all.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getOpenLayersBaseUrl() . '/OpenLayers-debug.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HS.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/MapPortal.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers/Control/LayerSwitcher.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers/Embed.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers/Embed/EmbedSimpleExtJs.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getHSLayersBaseUrl() . '/HSLayers/Embed/EmbedAdvancedExtJs.js"></script>';
    $html .= '    <script type="text/javascript" src="' . getProj4JsBaseUrl() . '/proj4js.js"></script>';
    $html .= '    <script type="text/javascript">';
    $html .= '    OpenLayers.ImgPath = "' . getUrlBase(HSLAYERS_IMG_RELATIVE_URL) . '";';
    $html .= '    HSLayers.statusManagerUrl = "' . getUrlBase(HSLAYERS_STATUSMANAGER_URL) . '";';
    $html .= '    var embed; Ext.onReady(function() {';
    $html .= '       embed = HSLayers.Embed.createByType("' . $_REQUEST['t'] .'");';
    $html .= '       embed.initParams(' . getParameters() . ');';
    $html .= '       embed.readMap();';
    $html .= '    });';
    $html .= '    </script>';
    $html .= '</head><body></body></html>';
    return $html;
}

print(generateOutput());

?>
