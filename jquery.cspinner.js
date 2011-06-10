/*!
 * jQuery.cSpinner, v0.2.4
 * https://github.com/mrienstra/jQuery.cSpinner
 *
 * Copyright 2011, Michael Rienstra
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based on code by Thijs van der Vossen, Fingertips, http://www.fngtps.com
 *
 * A jQuery plugin to create animated loading indicators using the canvas element
 *
 * Date: Fri Jun 10, 2011
 */
/* JSLint http://www.jslint.com/
 * Currently passing with the following settings:
 * "Assume a browser" (so we can use document, setInterval, & clearInterval)
 * And the following comment, telling JSLint that we’re assuming jQuery will already be declared.
 */
/*global jQuery: false */
(function ($) {
    "use strict";
    var pluginName = "cSpinner", // Used primarily for namespacing
    
    randomInt = function () {
        return String(Math.random()).substring(2);
    },
    
    methods = {
        init: function (options) {
            // Initialize and begin animating
            
            var jqueryObject = this,
            
            isCanvasSupported = function () {
                // à la Paul Irish / Modernizr
                var elem = document.createElement("canvas");
                return !!(elem.getContext && elem.getContext("2d"));
            };
            
            if (!isCanvasSupported) {
                // This browser has no Canvas support: silently do nothing, hand off to “the next link in the chain”
                return this;
            }
            
            this.each(function (index) {
                var settings = {
                    // Default settings
                    "speed": 1, // Increase --> faster
                    "scale": 1, // Increase --> larger
                    "lineWidth": 3, // Thickness of "lines"
                    "lineCap": "round", // Other values: "butt", "square"
                    "innerRadius": 8.70, // Increase --> bigger empty "circle" in the middle, shorter "lines"
                    "outerRadius": 14.42, // Increase --> longer "lines" (relative to innerRadius)
                    "color": "#000", // Try rgba()!
                    "minimumOpacity": 0.18, // Fun to play with
                    "segments": 12, // Number of "lines"
                    "shadow": false,
                    "shadowOffsetX": 1,
                    "shadowOffsetY": 1,
                    "shadowBlur": 1,
                    "shadowColor": "rgba(10, 10, 10, 0.5)",
                    "pixelRatio": 1, // For high-dpi displays, like the iPhone 4
                    "autoStart": true, // If false, call $(el).cSpinner("start")
                    "checkExistsInterval": 1000,
                    "preserveExisting": ["id", "class", "style"]
                },
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
                canvas,
                $this = $(this),
                attr,
                $canvas,
                canvasId,
                uniqueSelector,
                context,
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
                
                for(i = 0, l = toBeScaled.length; i < l; i = i + 1) {
                    settings[toBeScaled[i]] = settings[toBeScaled[i]] * settings.scale;
                }
                
                segments = settings.segments;
                
                delay = 1000 / settings.speed / segments;
                
                outerRadius = settings.outerRadius;
                
                canvasCenter = outerRadius + settings.lineWidth;
                if (settings.shadow) {
                    // Make canvas slightly larger to accommodate the shadow
                    shadowOffsetX = settings.shadowOffsetX;
                    shadowOffsetY = settings.shadowOffsetY;
                    canvasCenter += (shadowOffsetX > shadowOffsetY) ? shadowOffsetX : shadowOffsetY;
                    canvasCenter += settings.shadowBlur;
                }
                canvasCenter = Math.ceil(canvasCenter);
                canvasSize = canvasCenter * 2;
                
                pixelRatio = settings.pixelRatio;
                
                if (pixelRatio !== 1) {
                    canvasSizeCSS = String(canvasSize) + "px";
                    canvasSize = canvasSize * pixelRatio;
                }
                
                if (this.nodeName !== "CANVAS") {
                    // Replace target element with canvas element
                    canvas = $("<canvas />");
                    $this.replaceWith(function () {
                        // Defaults to preserving the ID, class, & style attributes of the target element
                        for (i = 0, l = settings.preserveExisting.length; i < l; i = i + 1) {
                            attr = settings.preserveExisting[i];
                            if ($this.attr(attr)) {
                                canvas.attr(attr, $this.attr(attr));
                            }
                        }
                        return canvas;
                    });
                    canvas = canvas[0];
                    $canvas = $(canvas);
                } else {
                    canvas = this;
                    $canvas = $this;
                }
                
                // Make sure there is a unique ID or class we can target
                canvasId = $canvas.attr("id");
                if (canvasId === "") {
                    // Target does not have an ID, let’s give it one
                    uniqueSelector = pluginName + randomInt();
                    $canvas.attr("id", uniqueSelector);
                    uniqueSelector = "#" + uniqueSelector;
                } else if ($("#"+canvasId).length !== 1) {
                    // ID is not unique, so we’ll give it a unique class instead
                    uniqueSelector = pluginName + randomInt();
                    $canvas.addClass(uniqueSelector);
                    uniqueSelector = "." + uniqueSelector;
                } else {
                    // Use existing ID as unique selector
                    uniqueSelector = "#" + canvasId;
                }
                
                canvas.width = canvas.height = canvasSize;
                context = canvas.getContext("2d");
                context.lineWidth = settings.lineWidth;
                context.lineCap = settings.lineCap;
                context.strokeStyle = settings.color;
                
                if (settings.shadow) {
                    // Shadow
                    context.shadowOffsetX = shadowOffsetX;
                    context.shadowOffsetY = shadowOffsetY;
                    context.shadowBlur = settings.shadowBlur;
                    context.shadowColor = settings.shadowColor;
                }
                
                if (pixelRatio !== 1) {
                    context.scale(pixelRatio, pixelRatio);
                    $canvas.css({
                        width: canvasSizeCSS,
                        height: canvasSizeCSS
                    });
                }
                
                minimumOpacity = settings.minimumOpacity;
                // Make sure the minimumOpacity value is not zero or less
                if (minimumOpacity <= 0) {
                    // Has to be greater than 0, but can be effectively 0
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
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        opacity.unshift(opacity.pop());
                        for (i = 0; i < segments; i = i + 1) {
                            context.globalAlpha = opacity[i];
                            context.beginPath();
                            context.moveTo(canvasCenter + sectors[i][0], canvasCenter + sectors[i][1]);
                            context.lineTo(canvasCenter + sectors[i][2], canvasCenter + sectors[i][3]);
                            context.stroke();
                        }
                        
                        if (counter % checkExistsEvery === 0 && $(uniqueSelector).length !== 1) {
                            // Target no longer exists, stop animating
                            clearInterval(intervalID);
                        }
                        counter = counter + 1;
                    }, delay);
                    
                    return intervalID;
                };
                
                /* Store the following:
                 *   originalTarget (element) : used by "restore" method)
                 *   startAnimating (function): used by "start"   method)
                 */
                $canvas.data(pluginName, {
                    originalTarget: originalTarget,
                    startAnimating: startAnimating
                });
                
                if (settings.autoStart === true) {
                    // Call the start() method
                    $canvas.cSpinner("start");
                }
                
                if (canvas !== this) {
                    // We replaced the original element, so we need to update it in the jQuery object (for chaining purposes)
                    jqueryObject[index] = canvas;
                }
            });
            
            return jqueryObject;
        },
        
        start: function () {
            // Start animating
            
            return this.each(function () {
                var $this = $(this),
                data = $this.data(pluginName),
                intervalID;
                
                if (data && data.startAnimating) {
                    // Start animating
                    intervalID = data.startAnimating();
                    
                    /* Store the following:
                     *   originalTarget (element) : used by "restore" method)
                     *   startAnimating (function): used by "start"   method)
                     *   intervalID     (integer) : used by "stop"    method)
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
            // Stop animating
            
            return this.each(function () {
                var $this = $(this),
                data = $this.data(pluginName);
                if (data && data.intervalID) {
                    clearInterval(data.intervalID);
                }
            });
        },
        
        restore: function () {
            // Return the target element to it’s original state
            
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
        } else if (typeof method === "object" || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("jQuery." + pluginName + ": Method “" + method + "” does not exist");
        }
    };
}(jQuery));