jQuery.cSpinner
=======

A jQuery plugin to create animated loading indicators using the canvas element

Based on code by Thijs van der Vossen, Fingertips, http://www.fngtps.com

Replaces the target element(s) with canvas elements (unless they are already canvas elements), then draws an animated loading indicator.

## Demos

http://michaelrienstra.com/jquery.cspinner/demo/

http://jsfiddle.net/mrienstra/5p8ep/

http://jsfiddle.net/mrienstra/UpTnQ/

http://jsfiddle.net/mrienstra/pEjgp/

## Dependancies

Requires [jQuery](http://jquery.com/).

## Support

See http://caniuse.com/#feat=canvas for browser support for the canvas element.

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

See the source (or jsFiddle demos, above) for more options.

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

## Known issues

If the browser does not support the canvas element, the current behavior is to do nothing.  You can use a traditional animated gif as the target (or a child of the target), to be "enhanced" if canvas is supported.  The downside to this approach is that WebKit browsers will still download the original image  -- see https://bugs.webkit.org/show_bug.cgi?id=6656

If the `shadow` option is specified, the `shadowOffsetY` value will be reversed on Android browsers -- see http://code.google.com/p/android/issues/detail?id=16025

## Related

After I started writing this, I discovered 2 similar plugins -- check 'em out!

* http://plugins.jquery.com/project/spinners  /  https://github.com/staaky/spinners

* http://plugins.jquery.com/project/canvas-loader  /  http://jamund.com/canvas-loader/