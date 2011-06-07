jQuery.cSpinner
=======

A jQuery plugin to create animated loading indicators using the canvas element

Based on code by Thijs van der Vossen, Fingertips, http://www.fngtps.com

Replaces the target element(s) with canvas elements (unless they are already canvas elements), then draws an animated loading indicator.

## Demo

http://michaelrienstra.com/jquery.cspinner/demo/

## Dependancies

Requires [jQuery](http://jquery.com/).

Requires browser support for the canvas element.  To add canvas support to IE, take a look at http://code.google.com/p/explorercanvas/ (I haven't tried this yet)

## Usage

`$("#loading_indicator").cSpinner();`

`$("#loading_indicator").cSpinner({color: "#fff", scale: 3, shadow: true});`

`$("#loading_indicator").cSpinner('stop');`

`$("#loading_indicator").cSpinner('start');`

See source for more options.

## Known issues

If the browser does not support the canvas element, the current behavior is to do nothing.  You can use a traditional animated gif as the target, to be “enhanced” if canvas is supported.  The downside to this approach is that WebKit browsers will still download the original image  -- see https://bugs.webkit.org/show_bug.cgi?id=6656

Several mobile versions of WebKit lag badly when attempting to replace an image element before it has finished loading.  I haven't isolated this bug yet to see if it is specific to replacing an image element with a canvas element.

If the "shadow" option is specified, the shadowOffsetY value will be reversed on Android browsers -- see http://code.google.com/p/android/issues/detail?id=16025

## Related

After I started writing this, I discovered 2 similar plugins -- check 'em out!

* http://plugins.jquery.com/project/spinners / https://github.com/staaky/spinners

* http://plugins.jquery.com/project/canvas-loader / http://jamund.com/canvas-loader/