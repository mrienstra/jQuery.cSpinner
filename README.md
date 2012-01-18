jQuery.cSpinner
=======

A jQuery plugin to create animated loading indicators using the canvas element.

Inspired by Thijs van der Vossen, Fingertips, http://www.fngtps.com

Minified version is 4.6 kB / 2.1 kB gzipped.

Lite minified version is 3.9 kB / 1.9 kB gzipped.



## Demos

http://michaelrienstra.com/jquery.cspinner/demo/

http://jsfiddle.net/mrienstra/UpTnQ/ Circles

http://jsfiddle.net/mrienstra/pEjgp/ Squares

http://jsfiddle.net/mrienstra/5p8ep/ Subtle

http://jsfiddle.net/mrienstra/hj5Lw/ Complex #1

http://jsfiddle.net/mrienstra/M6he5/ Complex #2

http://jsfiddle.net/mrienstra/WSG7G/ Complex #3



## Dependancies

Requires [jQuery](http://jquery.com/).

## Support

Using the _default settings_, this script relies on the canvas element. See http://caniuse.com/#feat=canvas for browser support for the canvas element.

As of v0.2.6, it is now possible to provide the path to a JS array of Data URIs. See the "Data URI Fallback" section.

To add canvas support to IE, take a look at http://code.google.com/p/explorercanvas/ (I haven't tried this yet).

I haven't taken the time to do much testing yet, but preliminarily, I can say that it seems to work using the latest versions of Chrome, Safari & Firefox on OS X 10.6.7; on iOS 4.3 (using iOS Simulator); & on Android 2.3.3 (Motorola Cliq XT).

## Usage

Default:

`$("#loading_indicator").cSpinner();`

Custom:

    $("#loading_indicator").cSpinner({
        color: "#fff",
        scale: 3,
        shadow: true
    })
    .hover(
        function () { $(this).cSpinner("stop"); },
        function () { $(this).cSpinner("start"); }
    );

See [the settings object](https://github.com/mrienstra/jQuery.cSpinner/blob/master/jquery.cspinner.js#L43) in the source (or jsFiddle demos, above) for more options.

### Mobile usage

If you are serving a viewport meta tag to scale the page to fit a mobile device, the default output will look pixelated on pixel-dense displays like the iPhone 4. The solution is to pass the `pixelRatio` option, with the value set to `window.devicePixelRatio`, as follows:

`$("#loading_indicator").cSpinner({pixelRatio: window.devicePixelRatio})`

Or, more realistically:

    var cSpinnerOptions = {
        color: "rgba(0, 0, 0, 0.5)",
        scale: 3,
        shadow: true,
        inner: 9,
        outer: 9.00001,
        segments: 13
    };
    
    if (window.devicePixelRatio && window.devicePixelRatio !== 1) {
        cSpinnerOptions.pixelRatio = window.devicePixelRatio;
    }
    
    $("#loading_indicator").cSpinner(cSpinnerOptions);

## Data URI Fallback

As of v0.2.6, it is now possible to provide the path to a JS array of data URIs, each one corresponding to a frame, using the "fallbackSourcesArray" option. The data URIs are expected to be identical to what would've been rendered using the canvas element. You can generate this JS array as follows (tested using Chrome 10.6.7 Mac):

1. Using a browser that supports both the canvas element & the toDataURL() method of the canvas element, use this script to generate an animated canvas.

2. Enter the following code into the console (assumes the target has the id "loading_indicator"):

    `$("#loading_indicator").cSpinner("export");`

3. Select all, copy. Save the result as a JavaScript file (.js). The uncompressed JavaScript file will be much larger than an image, but will gzip-encode down nicely, so make sure your server is setup to gzip-encode JavaScript.

## Known issues

If the browser does not support the canvas element, and the `fallbackSourcesArray` option is not specified, the current behavior is to do nothing.  You can use a traditional animated gif as the target (or a child of the target), to be "enhanced" if canvas is supported.  The downside to this approach is that WebKit browsers will still download the original image  -- see https://bugs.webkit.org/show_bug.cgi?id=6656 (of course, most if not all WebKit browsers support the canvas element).

See the preceding "Data URI Fallback" section for an alternate fallback behavior.

If the `shadow` option is specified, the `shadowOffsetY` value will be reversed on Android browsers -- see http://code.google.com/p/android/issues/detail?id=16025 , see https://gist.github.com/1183651 for a solution.

If using the `fallbackSourcesArray` option, there is no error handling when retrieving the data URIs.



## Lite version

If you are trying to shave bytes, check out the Lite version, which strips a few features.

 * 'alwaysReplaceTarget' option removed. Effectively set to 'true'.

 * 'restore' method removed.

 * 'export' method removed.

 * Removed $.error() for undefined method calls.



## Misc. Notes

Linted using [Closure Linter](http://code.google.com/closure/utilities/) (GJsLint). Currently passing, except for 43 overly long lines... :1

Minified using [Closure Compiler](http://code.google.com/p/closure-compiler/). Plus a little fine-tuning by hand.

## Related

After I started writing this, I discovered 2 similar plugins -- check 'em out!

* Spinners: http://plugins.jquery.com/project/spinners  /  https://github.com/staaky/spinners

* jQuery Canvas Loader: http://plugins.jquery.com/project/canvas-loader  /  http://jamund.com/canvas-loader/

Ooo, and a third! This one is really nice!

* spin.js: http://fgnass.github.com/spin.js/  /  https://github.com/fgnass/spin.js