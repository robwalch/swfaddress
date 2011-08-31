SWFAddress is a small, but powerful library that provides deep linking for Flash and Ajax. It's a developer tool, allowing creation of unique virtual URLs that can point to a website section or an application state.
http://www.asual.com/swfaddress/

This is a stripped down (AS3/JS only) and mavenized fork of the original code of SWFAddress at SourceForge (https://sourceforge.net/projects/swfaddress/).

`encodeURI` and `decodeURI` are completely removed from AS and JS as they break deeplinking when URI components contain special separator characters (`; / ? : @ & = + $ , #`).

You have to encode and decode URIs in your application.

Please see http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/package.html#encodeURIComponent() and http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/package.html#encodeURIComponent() for more information.
