/*!
 * jQuery.cSpinner, v0.2.5
 * https://github.com/mrienstra/jQuery.cSpinner
 *
 * Copyright 2011, Michael Rienstra
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based on code by Thijs van der Vossen, Fingertips, http://www.fngtps.com
 *
 * A jQuery plugin to create animated loading indicators using the canvas element
 *
 * Date: Wed Jul 6, 2011
 */

/* JSLint http://www.jslint.com/
 * Currently “mostly passing” with the following settings:
 *     * “Assume a browser” (so we can use document, setInterval, & clearInterval).
 *     * And the following comment, telling JSLint that we’re assuming jQuery will already be declared.
 */
/*global jQuery: false */

/* To Do:
 *     * Add color animations -- use code from jQuery UI.
 *     * Allow scale to be defined in px or 100% (relative to parent?) or em?
 *     * Allow “fallbackSrc” setting to point to an animated GIF (currently expects a PNG “vertical filmstrip” of frames).
 *     * Experiment with converting the canvas to an image using toDataURL() canvas method, then animating it by setting it as a background image and changing the background position.
 *
 * Experiments:
 *     * CSS3 transform:rotate(): http://jsfiddle.net/mrienstra/X3KjE/ (looks pixelated, even shrunk 50% — would require additional images for any “non-square” rotations — e.g. 3 images for a 12-segment spinner)
 *     * Using an image as the base: http://jsfiddle.net/mrienstra/6nDqP/
 */

(function ($) {
    "use strict";
    var pluginName = "cSpinner", // Used primarily for namespacing.
        
        randomInt = function () {
            return String(Math.random()).substring(2);
        },
        
        methods = {
            init: function (options) {
                // Initialize and begin animating.
                
                var jqueryObject = this,
                    
                    isCanvasSupported = (function () {
                        // à la Paul Irish / Modernizr.
                        var elem = document.createElement("canvas");
                        return !!(elem.getContext && elem.getContext("2d"));
                    }());
                
                this.each(function (index) {
                    var settings = {
                        // Default settings.
                        "speed": 1, // Increase --> faster.
                        "scale": 1, // Increase --> larger.
                        "lineWidth": 3, // Thickness of “lines”.
                        "lineCap": "round", // Other values: “butt”, “square”.
                        "innerRadius": 8.70, // Increase --> bigger empty “circle” in the middle, shorter “lines”.
                        "outerRadius": 14.42, // Increase --> longer “lines” (relative to innerRadius).
                        "color": "#000", // Try rgba()!
                        "minimumOpacity": 0.18, // Fun to play with.
                        "segments": 12, // Number of “lines”.
                        "shadow": false,
                        "shadowOffsetX": 1,
                        "shadowOffsetY": 1,
                        "shadowBlur": 1,
                        "shadowColor": "rgba(10, 10, 10, 0.5)",
                        "pixelRatio": 1, // For high-dpi displays, like the iPhone 4.
                        "autoStart": true, // If false, call $(el).cSpinner("start")
                        "pauseOnBlur": true, // Stop animating when the window does not have focus.
                        "alwaysReplaceTarget": false, // Replace the target element even if it’s a DIV. If you don't want to preserve any attributes of the target element, you will also need to set “preserveExisting” to “[]”.
                        "fallbackSrc": undefined, // The path to a PNG "vertical filmstrip" of frames.
                        "checkExistsInterval": 1000,
                        "preserveExisting": ["id", "class", "style"]
                    },
                        $fallbackImg,
                        i,
                        l,
                        toBeScaled = ["lineWidth", "innerRadius", "outerRadius", "shadowOffsetX", "shadowOffsetY", "shadowBlur"],
                        segments,
                        delay,
                        outerRadius,
                        canvasCenter,
                        shadowOffsetX,
                        shadowOffsetY,
                        canvasSize,
                        pixelRatio,
                        canvasSizeCSS,
                        canvasWrapper,
                        canvasHtml = "<canvas /><canvas />",
                        $this = $(this),
                        attr,
                        $canvasWrapper,
                        $canvas,
                        canvas,
                        $frameCanvas,
                        frameCanvas,
                        canvasWrapperId,
                        uniqueSelector,
                        context,
                        frameContext,
                        minimumOpacity,
                        a,
                        cos,
                        sin,
                        sectors = [],
                        opacity = [],
                        counter = 0,
                        checkExistsEvery,
                        startAnimating,
                        originalTarget = this;
                    
                    if (options) {
                        $.extend(settings, options);
                    }
                    
                    if (!isCanvasSupported) {
                        // This browser has no Canvas support
                        if (typeof settings.fallbackSrc === "undefined") {
                            // Silently do nothing, hand off to “the next link in the chain”.
                            return true;
                        } else {
                            canvasHtml = "<img />";
                        }
                    }
                    
                    for (i = 0, l = toBeScaled.length; i < l; i = i + 1) {
                        settings[toBeScaled[i]] = settings[toBeScaled[i]] * settings.scale;
                    }
                    
                    segments = settings.segments;
                    
                    delay = 1000 / settings.speed / segments;
                    
                    outerRadius = settings.outerRadius;
                    
                    canvasCenter = outerRadius + settings.lineWidth;
                    if (settings.shadow) {
                        // Make canvas slightly larger to accommodate the shadow.
                        shadowOffsetX = settings.shadowOffsetX;
                        shadowOffsetY = settings.shadowOffsetY;
                        canvasCenter += (shadowOffsetX > shadowOffsetY) ? shadowOffsetX : shadowOffsetY;
                        canvasCenter += settings.shadowBlur;
                    }
                    canvasCenter = Math.ceil(canvasCenter);
                    canvasSize = canvasSizeCSS = canvasCenter * 2;
                    
                    pixelRatio = settings.pixelRatio;
                    
                    if (pixelRatio !== 1) {
                        canvasSize = canvasSize * pixelRatio;
                    }
                    
                    if (settings.alwaysReplaceTarget === true || this.nodeName !== "DIV") {
                        // Replace target element with DIV element.
                        canvasWrapper = $("<div>" + canvasHtml + "</div>");
                        $this.replaceWith(function () {
                            // Defaults to preserving the ID, class, & style attributes of the target element.
                            for (i = 0, l = settings.preserveExisting.length; i < l; i = i + 1) {
                                attr = settings.preserveExisting[i];
                                if ($this.attr(attr)) {
                                    canvasWrapper.attr(attr, $this.attr(attr));
                                }
                            }
                            return canvasWrapper;
                        });
                        canvasWrapper = canvasWrapper[0];
                        $canvasWrapper = $(canvasWrapper);
                    } else {
                        canvasWrapper = this;
                        $canvasWrapper = $this;
                        // Set the contents of the target DIV to two canvas elements.
                        $canvasWrapper.html(canvasHtml);
                    }
                    
                    // Style the wrapper.
                    $canvasWrapper.css({
                        "overflow": "hidden",
                        "width": String(canvasSizeCSS) + "px",
                        "height": String(canvasSizeCSS) + "px"
                    });
                    
                    // Make sure there is a unique ID or class we can target.
                    canvasWrapperId = $canvasWrapper.attr("id");
                    if (canvasWrapperId === "") {
                        // Target does not have an ID, let’s give it one.
                        uniqueSelector = pluginName + randomInt();
                        $canvasWrapper.attr("id", uniqueSelector);
                        uniqueSelector = "#" + uniqueSelector;
                    } else if ($("#" + canvasWrapperId).length !== 1) {
                        // ID is not unique, so we’ll give it a unique class instead.
                        uniqueSelector = pluginName + randomInt();
                        $canvasWrapper.addClass(uniqueSelector);
                        uniqueSelector = "." + uniqueSelector;
                    } else {
                        // Use existing ID as unique selector.
                        uniqueSelector = "#" + canvasWrapperId;
                    }
                    
                    if (isCanvasSupported) {
                        // Initialize the first canvas element, used to hold all of the frames.
                        $canvas = $("canvas:eq(0)", canvasWrapper);
                        canvas = $canvas[0];
                        canvas.width = canvasSize;
                        canvas.height = canvasSize * segments;
                        context = canvas.getContext("2d");
                        
                        // Initialize the second canvas element, used to draw individual frames for the first run.
                        $frameCanvas = $("canvas:eq(1)", canvasWrapper);
                        frameCanvas = $frameCanvas[0];
                        $frameCanvas.css("display", "none");
                        frameCanvas.width = frameCanvas.height = canvasSize;
                        frameContext = frameCanvas.getContext("2d");
                        frameContext.lineWidth = settings.lineWidth;
                        frameContext.lineCap = settings.lineCap;
                        frameContext.strokeStyle = settings.color;
                        
                        if (settings.shadow) {
                            // Shadow settings.
                            frameContext.shadowOffsetX = shadowOffsetX;
                            frameContext.shadowOffsetY = shadowOffsetY;
                            frameContext.shadowBlur = settings.shadowBlur;
                            frameContext.shadowColor = settings.shadowColor;
                        }
                    } else {
                        // !isCanvasSupported
                        $canvas = $("img", canvasWrapper);
                        $canvas.attr("src", settings.fallbackSrc);
                    }
                    
                    if (pixelRatio !== 1) {
                        if (isCanvasSupported) {
                            context.scale(pixelRatio, pixelRatio);
                        }
                        $canvas.css({
                            width: String(canvasSizeCSS) + "px",
                            height: String(canvasSizeCSS * segments) + "px"
                        });
                    }
                    
                    minimumOpacity = settings.minimumOpacity;
                    // Make sure the minimumOpacity value is not zero or less.
                    if (minimumOpacity <= 0) {
                        // Has to be greater than 0, but can be effectively 0.
                        minimumOpacity = 0.0001;
                    }
                    
                    for (i = 0; i < segments; i = i + 1) {
                        a = 2 * Math.PI / segments * i - Math.PI / 2;
                        cos = Math.cos(a);
                        sin = Math.sin(a);
                        sectors[i] = [
                            settings.innerRadius * cos,
                            settings.innerRadius * sin,
                            outerRadius * cos,
                            outerRadius * sin
                        ];
                        opacity[i] = Math.pow(i / (segments - 1), minimumOpacity * 10) * (1 - minimumOpacity) + minimumOpacity;
                    }
                    
                    checkExistsEvery = Math.round(settings.checkExistsInterval / delay);
                    
                    startAnimating = function () {
                        var intervalID = setInterval(function () {
                            if (isCanvasSupported && counter < segments) {
                                // We’re still drawing the frames (first cycle).
                                frameContext.clearRect(0, 0, canvasSize, canvasSize);
                                opacity.unshift(opacity.pop());
                                for (i = 0; i < segments; i = i + 1) {
                                    frameContext.globalAlpha = opacity[i];
                                    frameContext.beginPath();
                                    frameContext.moveTo(canvasCenter + sectors[i][0], canvasCenter + sectors[i][1]);
                                    frameContext.lineTo(canvasCenter + sectors[i][2], canvasCenter + sectors[i][3]);
                                    frameContext.stroke();
                                }
                                context.drawImage(frameCanvas, 0, counter * canvasSizeCSS);
                                if (counter + 1 === segments) {
                                    // We’re done with this element.
                                    $frameCanvas.remove();
                                }
                            }
                            
                            $canvas.css("margin-top", String(-1 * counter % segments * canvasSizeCSS) + "px");
                            
                            if (counter % checkExistsEvery === 0 && $(uniqueSelector).length !== 1) {
                                // Target no longer exists, stop animating.
                                clearInterval(intervalID);
                            }
                            counter = counter + 1;
                        }, delay);
                        
                        return intervalID;
                    };
                    
                    /* Store the following:
                     *   originalTarget (element) : used by “restore” method)
                     *   startAnimating (function): used by “start”   method)
                     */
                    $canvasWrapper.data(pluginName, {
                        originalTarget: originalTarget,
                        startAnimating: startAnimating
                    });
                    
                    if (settings.autoStart === true) {
                        // Call the start() method
                        $canvasWrapper.cSpinner("start");
                    }
                    
                    if (settings.pauseOnBlur === true) {
                        // Bind stop to window’s blur event,
                        // bind start to window’s focus event.
                        $(window).blur(function () {
                            $canvasWrapper.cSpinner("stop");
                        }).focus(function () {
                            $canvasWrapper.cSpinner("start");
                        });
                    }
                    
                    if (canvasWrapper !== this) {
                        // We replaced the original element, so we need to update it in the jQuery object (for chaining purposes).
                        jqueryObject[index] = canvasWrapper;
                    }
                });
                
                return jqueryObject;
            },
            
            start: function () {
                // Start animating.
                
                return this.each(function () {
                    var $this = $(this),
                        data = $this.data(pluginName),
                        intervalID;
                    
                    if (data && data.startAnimating && !data.intervalID) {
                        // Start animating.
                        intervalID = data.startAnimating();
                        
                        /* Store the following:
                         *   originalTarget (element) : used by “restore” method)
                         *   startAnimating (function): used by “start”   method)
                         *   intervalID     (integer) : used by “stop”    method)
                         */
                        $this.data(pluginName, {
                            originalTarget: data.originalTarget,
                            startAnimating: data.startAnimating,
                            intervalID: intervalID
                        });
                    }
                });
            },
            
            stop: function () {
                // Stop animating.
                
                return this.each(function () {
                    var $this = $(this),
                        data = $this.data(pluginName);
                    if (data && data.intervalID) {
                        clearInterval(data.intervalID);
                        
                        /* Store the following:
                         *   originalTarget (element) : used by “restore” method)
                         *   startAnimating (function): used by “start”   method)
                         */
                        $this.data(pluginName, {
                            originalTarget: data.originalTarget,
                            startAnimating: data.startAnimating
                        });
                    }
                });
            },
            
            restore: function () {
                // Return the target element to it’s original state.
                
                return this.each(function () {
                    var $this = $(this),
                        data = $this.data(pluginName);
                    if (data && data.intervalID) {
                        clearInterval(data.intervalID);
                    }
                    if (data && data.originalTarget) {
                        $this.replaceWith(data.originalTarget);
                    }
                });
            }
        };
    
    $.fn.cSpinner = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("jQuery." + pluginName + ": Method “" + method + "” does not exist");
        }
    };
}(jQuery));