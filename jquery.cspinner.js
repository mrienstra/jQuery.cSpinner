/*!
 * jQuery.cSpinner, v0.2.3
 * https://github.com/mrienstra/jQuery.cSpinner
 *
 * Copyright 2011, Michael Rienstra
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based on code by Thijs van der Vossen, Fingertips, http://www.fngtps.com
 *
 * A jQuery plugin to create animated loading indicators using the canvas element
 *
 * Date: Tue Jun 7, 2011
 */
(function ($) {
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
                // No Canvas support, log a notice, then hand off to “the next link in the chain”
                if (window.console && window.console.log) {
                    window.console.log("jQuery." + pluginName + ": Canvas not supported");
                }
                return this;
            }
            
            this.each(function (index) {
                var settings = {
                    // Default settings
                    "scale": 1,
                    "width": 3,
                    "inner": 8.70,
                    "outer": 14.42,
                    "color": "#000",
                    "segments": 12,
                    "speed": 1,
                    "shadow": false,
                    "shadowOffsetX": 1,
                    "shadowOffsetY": 1,
                    "shadowBlur": 1,
                    "shadowColor": "rgba(10, 10, 10, 0.5)",
                    "checkExistsInterval": 1000,
                    "preserveExisting": ["id", "class", "style"],
                    "autoStart": true,
                    "lineCap": "round",
                    "pixelRatio": 1
                },
                toBeScaled = ["width", "inner", "outer", "shadowOffsetX", "shadowOffsetY", "shadowBlur"],
                i,
                l,
                canvas,
                $this = $(this),
                attr,
                $canvas,
                canvasId,
                uniqueSelector,
                context,
                lowestOpacity,
                a,
                cos,
                sin,
                sectors = [],
                opacity = [],
                intervalID,
                counter = 0,
                checkExistsEvery,
                startAnimating;
                
                if (options) {
                    $.extend(settings, options);
                }
                
                for(i = 0, l = toBeScaled.length; i < l; i++) {
                    settings[toBeScaled[i]] = settings[toBeScaled[i]] * settings.scale;
                }
                
                settings.delay = 1000 / settings.speed / settings.segments;
                settings.center = settings.outer + settings.width;
                if (settings.shadow) {
                    // Make canvas slightly larger to accomodate the shadow
                    settings.center += (settings.shadowOffsetX > settings.shadowOffsetY) ? settings.shadowOffsetX : settings.shadowOffsetY;
                    settings.center += settings.shadowBlur;
                }
                settings.center = Math.ceil(settings.center);
                settings.canvasSize = settings.center * 2;
                
                if (settings.pixelRatio !== 1) {
                    settings.canvasSizeCSS = settings.canvasSize + "px";
                    settings.canvasSize = settings.canvasSize * settings.pixelRatio;
                }
                
                
                if (this.nodeName !== "CANVAS") {
                    // Replace target element with canvas element
                    canvas = $("<canvas />");
                    $this.replaceWith(function () {
                        // Defaults to preserving the ID, class, & style attributes of the target element
                        for (i = 0, l = settings.preserveExisting.length; i < l; i++) {
                            attr = settings.preserveExisting[i];
                            if ($this.attr(attr)) { canvas.attr(attr, $this.attr(attr)); }
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
                
                canvas.width = canvas.height = settings.canvasSize;
                context = canvas.getContext("2d");
                context.lineWidth = settings.width;
                context.lineCap = settings.lineCap;
                context.strokeStyle = settings.color;
                
                if (settings.shadow) {
                    // Shadow
                    context.shadowOffsetX = settings.shadowOffsetX;
                    context.shadowOffsetY = settings.shadowOffsetY;
                    context.shadowBlur = settings.shadowBlur;
                    context.shadowColor = settings.shadowColor;
                }
                
                if (settings.pixelRatio !== 1) {
                    context.scale(settings.pixelRatio, settings.pixelRatio);
                    $canvas.css({width: settings.canvasSizeCSS, height: settings.canvasSizeCSS});
                }
                
                lowestOpacity = 0.18;
                
                for (i = 0; i < settings.segments; i++) {
                    a = 2 * Math.PI / settings.segments * i - Math.PI / 2;
                    cos = Math.cos(a);
                    sin = Math.sin(a);
                    sectors[i] = [settings.inner * cos, settings.inner * sin, settings.outer * cos, settings.outer * sin];
                    opacity[i] = Math.pow(i / (settings.segments - 1), 1.8) * (1 - lowestOpacity) + lowestOpacity;
                }
                
                counter = 0;
                checkExistsEvery = Math.round(settings.checkExistsInterval / settings.delay);
                
                startAnimating = function () {
                    return window.setInterval(function () {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        opacity.unshift(opacity.pop());
                        for (i = 0; i < settings.segments; i++) {
                            context.globalAlpha = opacity[i];
                            context.beginPath();
                            context.moveTo(settings.center + sectors[i][0], settings.center + sectors[i][1]);
                            context.lineTo(settings.center + sectors[i][2], settings.center + sectors[i][3]);
                            context.stroke();
                        }
                        
                        if (counter++ % checkExistsEvery === 0 && $(uniqueSelector).length !== 1) {
                            // Target no longer exists, stop animating
                            window.clearInterval(intervalID);
                        }
                    }, settings.delay);
                };
                
                if (settings.autoStart === true) {
                    // Start animating
                    intervalID = startAnimating();
                    
                    // Store the intervalID (used by .cSpinner("stop") method) & the startAnimating function (used by .cSpinner("start") method)
                    $canvas.data(pluginName, {intervalID: intervalID, startAnimating: startAnimating});
                } else {
                    // Store the startAnimating function (used by .cSpinner("start") method)
                    $canvas.data(pluginName, {startAnimating: startAnimating});
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
                    
                    // Store the intervalID (used by .cSpinner("stop") method)
                    $this.data(pluginName, {intervalID: intervalID, startAnimating: data.startAnimating});
                }
            });
        },
        
        stop: function () {
            // Stop animating
            
            return this.each(function () {
                var $this = $(this),
                data = $this.data(pluginName);
                if (data && data.intervalID) {
                    window.clearInterval(data.intervalID);
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