/*!
 * jQuery.cSpinner, v0.2.6
 * https://github.com/mrienstra/jQuery.cSpinner
 *
 * Copyright 2011, Michael Rienstra
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based on code by Thijs van der Vossen, Fingertips, http://www.fngtps.com
 *
 * A jQuery plugin to create animated loading indicators using the canvas element
 *
 * Date: Thu Jul 7, 2011
 */

/* JSLint http://www.jslint.com/
 * Currently “mostly passing” with the following settings:
 *     * “Assume a browser” (so we can use document, setInterval, & clearInterval).
 *     * And the following comment, telling JSLint that we’re assuming jQuery will already be declared.
 */
/*global jQuery: false */

/* To Do:
 *     * Add color animations -- use code from jQuery UI.
 *     * Allow scale to be defined in: px, % (relative to parent?) or em?
 *     * Allow the use of an animated GIF as a fallback.
 *     * Add error handling for a failure to retrieve “fallbackSourcesArray”.
 *
 * Experiments:
 *     * CSS3 transform:rotate(): http://jsfiddle.net/mrienstra/X3KjE/
 *           Notes: Looks pixelated, even shrunk 50% — would require additional images for any “non-square” rotations — e.g. 3 images for a 12-segment spinner.
 *     * Using an image as the base: http://jsfiddle.net/mrienstra/6nDqP/
 *           Notes: Works great, integrate?
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
                    
                    canvasSupport = (function () {
                        // Level of canvas support, returns “full”, “partial”, or “none”.
                        // “full” means the “toDataURL” canvas method is available.
                        var elem = document.createElement("canvas");
                        if (elem.getContext && elem.getContext("2d")) {
                            return (elem.toDataURL("image/png").indexOf("data:image/png") === 0) ? "full" : "partial";
                        }
                        return "none";
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
                        "fallbackSourcesArray": undefined, // The path to a JavaScript array of data URIs, for browsers without canvas support. See README.md for details.
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
                        frames = [],
                        minimumOpacity,
                        a,
                        cos,
                        sin,
                        sectors = [],
                        opacity = [],
                        counter = 0,
                        checkExistsEvery,
                        generateFrame,
                        startAnimating,
                        originalTarget = this;
                    
                    if (options) {
                        $.extend(settings, options);
                    }
                    
                    if (canvasSupport === "none") {
                        // This browser has no Canvas support
                        if (typeof settings.fallbackSourcesArray === "undefined") {
                            // No fallback has been given.
                            // Silently do nothing, hand off to “the next link in the chain”.
                            return true;
                        } else {
                            canvasHtml = "";
                        }
                    }
                    
                    // Better minification by mapping to a variable that can be renamed.
                    pixelRatio = settings.pixelRatio;
                    
                    if (pixelRatio !== 1) {
                        // Increase the scale to take the pixel ratio into acount.
                        settings.scale = settings.scale * pixelRatio;
                    }
                    
                    for (i = 0, l = toBeScaled.length; i < l; i = i + 1) {
                        // Scale all measurements.
                        settings[toBeScaled[i]] = settings[toBeScaled[i]] * settings.scale;
                    }
                    
                    segments = settings.segments;
                    
                    delay = 1000 / settings.speed / segments;
                    
                    outerRadius = settings.outerRadius;
                    
                    // Calculate canvas center.
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
                    
                    if (pixelRatio !== 1) {
                        // All measurements have been scaled up to take the pixel ratio into account,
                        // but the CSS size should be scaled back down.
                        canvasSizeCSS = canvasSizeCSS / pixelRatio;
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
                        // Some of these styles are only needed for certain approaches.
                        "width": String(canvasSizeCSS) + "px",
                        "height": String(canvasSizeCSS) + "px",
                        "overflow": "hidden", // Needed for “canvasSupport === "partial"”.
                        "background-size": String(canvasSizeCSS) + "px " + String(canvasSizeCSS) + "px" // Needed for “pixelRatio !== 1”.
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
                    
                    if (canvasSupport !== "none") {
                        if (canvasSupport === "partial") {
                            // Initialize the first canvas element, used to hold all of the frames when “canvasSupport === "partial"”.
                            $canvas = $("canvas:eq(0)", canvasWrapper);
                            canvas = $canvas[0];
                            canvas.width = canvasSize;
                            canvas.height = canvasSize * segments;
                            context = canvas.getContext("2d");
                            context.scale(pixelRatio, pixelRatio);
                            $canvas.css({
                                "width": String(canvasSizeCSS) + "px",
                                "height": String(canvasSizeCSS * segments) + "px"
                            });
                        }
                        
                        // Initialize the second canvas element, used to draw individual frames, then removed.
                        $frameCanvas = $("canvas:eq(1)", canvasWrapper);
                        frameCanvas = $frameCanvas[0];
                        $frameCanvas.css("display", "none");
                        frameCanvas.width = frameCanvas.height = canvasSize;
                        frameContext = frameCanvas.getContext("2d");
                        frameContext.lineWidth = settings.lineWidth;
                        frameContext.lineCap = settings.lineCap;
                        frameContext.strokeStyle = settings.color;
                        
                        if (settings.shadow) {
                            // Apply shadow settings.
                            frameContext.shadowOffsetX = shadowOffsetX;
                            frameContext.shadowOffsetY = shadowOffsetY;
                            frameContext.shadowBlur = settings.shadowBlur;
                            frameContext.shadowColor = settings.shadowColor;
                        }
                    } else {
                        // canvasSupport === "none"
                        // We wouldn't have gotten this far unless settings.fallbackSourcesArray was given.
                        // Retrieve array of data URIs, to populate the “frames” array.
                        $.ajax({
                            type: "GET",
                            url: settings.fallbackSourcesArray,
                            dataType: "json",
                            success: function (response) {
                                frames = response;
                                // “Preload” frames, to prevent flickering in first cycle in Safari (desktop & mobile).
                                for (i = 0, l = frames.length; i < l; i = i + 1) {
                                    $("<img />").attr("src", frames[i]);
                                }
                            }
                        });
                    }
                    
                    if (canvasSupport === "full") {
                        // Removed unused canvas.
                        $("canvas:eq(0)", canvasWrapper).remove();
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
                    
                    generateFrame = function () {
                        // Draw frame, then store frame.
                        
                        // Draw frame.
                        frameContext.clearRect(0, 0, canvasSize, canvasSize);
                        opacity.unshift(opacity.pop());
                        for (i = 0; i < segments; i = i + 1) {
                            frameContext.globalAlpha = opacity[i];
                            frameContext.beginPath();
                            frameContext.moveTo(canvasCenter + sectors[i][0], canvasCenter + sectors[i][1]);
                            frameContext.lineTo(canvasCenter + sectors[i][2], canvasCenter + sectors[i][3]);
                            frameContext.stroke();
                        }
                        
                        // Store frame.
                        if (canvasSupport === "full") {
                            // Add frame to “frames” array in data URI format.
                            frames.push(frameCanvas.toDataURL("image/png"));
                            // “Preload” frame, to prevent flickering in first cycle in Safari (desktop & mobile).
                            $("<img />").attr("src", frames[frames.length - 1]);
                        } else {
                            // canvasSupport === "partial"
                            // Copy frame into the main canvas.
                            context.drawImage(frameCanvas, 0, counter * canvasSizeCSS);
                        }
                        
                        counter = counter + 1;
                    };
                    
                    startAnimating = function () {
                        var intervalID = setInterval(function () {
                            if (canvasSupport === "partial") {
                                // Animate, by changing margin-top value of the main canvas.
                                $canvas.css("margin-top", String(-1 * counter % segments * canvasSizeCSS) + "px");
                            } else {
                                // Animate, by changing the background-image.
                                if (typeof frames[counter % segments] !== "undefined") {
                                    $canvasWrapper.css({"background-image": "url(" + frames[counter % segments] + ")"});
                                }
                            }
                            
                            if (counter % checkExistsEvery === 0 && $(uniqueSelector).length !== 1) {
                                // Target no longer exists, stop animating.
                                clearInterval(intervalID);
                            }
                            
                            counter = counter + 1;
                        }, delay);
                        
                        return intervalID;
                    };
                    
                    if (canvasSupport !== "none") {
                        // Generate frames
                        while (counter < segments) {
                            generateFrame();
                        }
                        
                        // Reset counter
                        counter = 0;
                        
                        // We’re done with this element.
                        $frameCanvas.remove();
                    }
                    
                    /* Store the following:
                     *   originalTarget (element) : used by “restore” method.
                     *   startAnimating (function): used by “start”   method.
                     *   frames         (array)   : used by “export”  method.
                     */
                    $canvasWrapper.data(pluginName, {
                        originalTarget: originalTarget,
                        startAnimating: startAnimating,
                        frames: frames
                    });
                    
                    if (settings.autoStart === true) {
                        // Call the start() method
                        $canvasWrapper.cSpinner("start");
                    }
                    
                    if (settings.pauseOnBlur === true) {
                        // Bind “stop” to window’s blur event,
                        // bind “start” to window’s focus event.
                        $(window).bind("blur." + pluginName, function () {
                            $canvasWrapper.cSpinner("stop");
                        }).bind("focus." + pluginName, function () {
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
                         *   originalTarget (element) : used by “restore” method.
                         *   startAnimating (function): used by “start”   method.
                         *   frames         (array)   : used by “export”  method.
                         *   intervalID     (integer) : used by “stop”    method.
                         */
                        $this.data(pluginName, {
                            originalTarget: data.originalTarget,
                            startAnimating: data.startAnimating,
                            frames: data.frames,
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
                         *   originalTarget (element) : used by “restore” method.
                         *   startAnimating (function): used by “start”   method.
                         *   frames         (array)   : used by “export”  method.
                         */
                        $this.data(pluginName, {
                            originalTarget: data.originalTarget,
                            startAnimating: data.startAnimating,
                            frames: data.frames
                        });
                    }
                });
            },
            
            restore: function () {
                // Return the target element to it’s original state.
                // Note: this function has not been tested extensively.
                
                // Also unbind the handlers attached to the window.
                $(window).unbind("blur." + pluginName).unbind("focus." + pluginName);
                
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
            },
            
            "export": function () {
                // To export a JavaScript array of data URIs, for use as a fallback for browsers without canvas support.
                // This function can be removed. You can also search for “export” and remove lines used to store the frames.
                
                var i, l;
                return this.each(function () {
                    var data = $(this).data(pluginName),
                        frame_data;
                    if (data && data.frames) {
                        frame_data = "[";
                        for (i = 0, l = data.frames.length; i < l; i = i + 1) {
                            frame_data += '"' + data.frames[i] + '"';
                            if (i + 1 < l) {
                                frame_data += ",";
                            }
                        }
                        frame_data += "]";
                        $("body").text(frame_data);
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