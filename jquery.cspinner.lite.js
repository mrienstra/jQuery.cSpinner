/*!
 * jQuery.cSpinner, v0.3.0
 * https://github.com/mrienstra/jQuery.cSpinner
 *
 * Copyright 2012, Michael Rienstra
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * A jQuery plugin to create animated loading indicators using the canvas element
 *
 * Date: Wed Jan 18, 2012
 */

(function($) {
  'use strict';
  var pluginName = 'cSpinner', // Used primarily for namespacing.

      randomInt = function() {
        return String(Math.random()).substring(2);
      },

      methods = {
        init: function(options) {
          // Initialize a new spinner, then begin animating (unless options include “autoStart: false”).

          var jqueryObject = this,

              canvasSupport = (function() {
                // Level of canvas support, returns “full”, “partial”, or “none”.
                // “full” means the “toDataURL” canvas method is available.
                // Note that this a self-invoking function.
                var elem = document.createElement('canvas');
                if (elem.getContext && elem.getContext('2d')) {
                  return (elem.toDataURL('image/png').indexOf('data:image/png') === 0) ? 'full' : 'partial';
                }
                return 'none';
              })();

          this.each(function(index) {
            var settings = {
              // Default settings.
              'speed': 1, // Increase --> faster.
              'scale': 1, // Increase --> larger.
              'lineWidth': 3, // Thickness of “lines”.
              'lineCap': 'round', // Other values: “butt”, “square”.
              'innerRadius': 8.70, // Increase --> bigger empty “circle” in the middle, shorter “lines”.
              'outerRadius': 14.42, // Increase --> longer “lines” (relative to innerRadius).
              'color': '#000', // Try rgba()!
              'minimumOpacity': 0.18,
              'segments': 12, // Number of “lines”.
              'dimmestSegments': 1, // Number of segments with “minimumOpacity” in any given frame. Raise this value to reduce the length of the “trail”.
              'shadow': false,
              'shadowOffsetX': 1,
              'shadowOffsetY': 1,
              'shadowBlur': 1,
              'shadowColor': 'rgba(10, 10, 10, 0.5)',
              'pixelRatio': 1, // For high-dpi displays, like the iPhone 4.
              'autoStart': true, // If false, call $(selector)[pluginName]('start') to begin animating.
              'pauseOnBlur': true, // Stop animating when the window does not have focus.
              'fallbackSourcesArray': undefined, // The path to a JavaScript array of data URIs, for browsers without canvas support. See README.md for details.
              'checkExistsInterval': 1000,
              'preserveExisting': ['id', 'class', 'style'],
              'drawSegment': function(frameContext, calculateAlpha, segments, iteration, counter, minimumOpacity, settings, outerRadius) { // Specify a custom function to draw each segment. Not well documented, but several jsFiddle examples are linked to from the documentation.
                frameContext.globalAlpha = calculateAlpha();
                frameContext.rotate(Math.PI * 2 / segments);
                frameContext.beginPath();
                frameContext.moveTo(0, settings.innerRadius);
                frameContext.lineTo(0, outerRadius);
                frameContext.stroke();
              }
            },
                canvasHtml = '<canvas /><canvas />',
                pixelRatio,
                iteration,
                iterations,
                toBeScaled = ['lineWidth', 'innerRadius', 'outerRadius', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur'],
                segments,
                delay,
                outerRadius,
                canvasCenter,
                shadowOffsetX,
                shadowOffsetY,
                canvasSize,
                canvasSizeCSS,
                $canvasWrapper,
                $this = $(this),
                attr,
                canvasWrapper,
                canvasWrapperId,
                uniqueSelector,
                $canvas,
                canvas,
                context,
                $frameCanvas,
                frameCanvas,
                frameContext,
                frames = [],
                minimumOpacity,
                checkExistsEvery,
                calculateAlpha,
                generateFrame,
                counter = 0,
                startAnimating;

            if (options) {
              $.extend(settings, options);
            }

            if (canvasSupport === 'none') {
              // This browser has no Canvas support
              if (typeof settings.fallbackSourcesArray === 'undefined') {
                // No fallback has been given.
                // Silently do nothing, hand off to “the next link in the chain”.
                return true;
              } else {
                canvasHtml = '';
              }
            }

            // Better minification by mapping to a variable that can be renamed.
            pixelRatio = settings.pixelRatio;
            segments = settings.segments;

            if (pixelRatio !== 1) {
              // Increase the scale to take the pixel ratio into account.
              settings.scale = settings.scale * pixelRatio;
            }

            for (iteration = 0, iterations = toBeScaled.length; iteration < iterations; iteration = iteration + 1) {
              // Scale all measurements.
              settings[toBeScaled[iteration]] = settings[toBeScaled[iteration]] * settings.scale;
            }

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

            // Replace target element with DIV element.
            $canvasWrapper = $('<div>' + canvasHtml + '</div>');
            $this.replaceWith(function() {
              // Defaults to preserving the ID, class, & style attributes of the target element.
              for (iteration = 0, iterations = settings.preserveExisting.length; iteration < iterations; iteration = iteration + 1) {
                attr = settings.preserveExisting[iteration];
                if ($this.attr(attr)) {
                  $canvasWrapper.attr(attr, $this.attr(attr));
                }
              }
              return $canvasWrapper;
            });
            canvasWrapper = $canvasWrapper[0];

            // Style the wrapper.
            $canvasWrapper.css({
              // Some of these styles are only needed for certain approaches.
              'width': String(canvasSizeCSS) + 'px',
              'height': String(canvasSizeCSS) + 'px',
              'overflow': 'hidden', // Needed for “canvasSupport === 'partial'”.
              'background-size': String(canvasSizeCSS) + 'px ' + String(canvasSizeCSS) + 'px' // Needed for “pixelRatio !== 1”.
            });

            // Make sure there is a unique ID or class we can target.
            canvasWrapperId = $canvasWrapper.attr('id');
            if (canvasWrapperId === '') {
              // Target does not have an ID, let’s give it one.
              uniqueSelector = pluginName + randomInt();
              $canvasWrapper.attr('id', uniqueSelector);
              uniqueSelector = '#' + uniqueSelector;
            } else if ($('#' + canvasWrapperId).length !== 1) {
              // ID is not unique, so we’ll give it a unique class instead.
              uniqueSelector = pluginName + randomInt();
              $canvasWrapper.addClass(uniqueSelector);
              uniqueSelector = '.' + uniqueSelector;
            } else {
              // Use existing ID as unique selector.
              uniqueSelector = '#' + canvasWrapperId;
            }

            if (canvasSupport !== 'none') {
              if (canvasSupport === 'partial') {
                // Initialize the first canvas element, used to hold all of the frames when “canvasSupport === 'partial'”.
                $canvas = $('canvas:eq(0)', canvasWrapper);
                canvas = $canvas[0];
                canvas.width = canvasSize;
                canvas.height = canvasSize * segments;
                context = canvas.getContext('2d');
                $canvas.css({
                  'width': String(canvasSizeCSS) + 'px',
                  'height': String(canvasSizeCSS * segments) + 'px'
                });
              }

              // Initialize the second canvas element, used to draw individual frames, then removed.
              $frameCanvas = $('canvas:eq(1)', canvasWrapper);
              frameCanvas = $frameCanvas[0];
              $frameCanvas.css('display', 'none');
              frameCanvas.width = frameCanvas.height = canvasSize;
              frameContext = frameCanvas.getContext('2d');
              frameContext.translate(canvasCenter, canvasCenter); // Move origin to center
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
              // canvasSupport === 'none'
              // We wouldn’t have gotten this far unless settings.fallbackSourcesArray was given.
              // Retrieve array of data URIs, to populate the “frames” array.
              $.ajax({
                type: 'GET',
                url: settings.fallbackSourcesArray,
                dataType: 'json',
                success: function(response) {
                  frames = response;
                  // “Preload” frames, to prevent flickering in first cycle in Safari (desktop & mobile).
                  // TO DO: verify this is needed
                  for (iteration = 0, iterations = frames.length; iteration < iterations; iteration = iteration + 1) {
                    $('<img />').attr('src', frames[iteration]);
                  }
                }
              });
            }

            if (canvasSupport === 'full') {
              // Removed unused canvas.
              $('canvas:eq(0)', canvasWrapper).remove();
            }

            minimumOpacity = settings.minimumOpacity;
            // Make sure the minimumOpacity value is not zero or less.
            if (minimumOpacity <= 0) {
              // Has to be greater than 0, but can be effectively 0.
              minimumOpacity = 0.0001;
            }

            checkExistsEvery = Math.round(settings.checkExistsInterval / delay);

            calculateAlpha = function() {
              var value = ((segments + iteration - counter) % segments);
              if (value >= settings.dimmestSegments - 1) {
                value = value - settings.dimmestSegments + 1;
                return value * (1 - minimumOpacity) / (segments - settings.dimmestSegments) + minimumOpacity;
              } else {
                return minimumOpacity;
              }
            }

            generateFrame = function() {
              // Draw frame, then store frame.

              // Draw frame.
              frameContext.clearRect(-canvasCenter, -canvasCenter, canvasSize, canvasSize);
              for (iteration = 0; iteration < segments; iteration = iteration + 1) {
                settings.drawSegment(frameContext, calculateAlpha, segments, iteration, counter, minimumOpacity, settings, outerRadius);
              }

              // Store frame.
              if (canvasSupport === 'full') {
                // Add frame to “frames” array in data URI format.
                frames.push(frameCanvas.toDataURL('image/png'));
                // “Preload” frame, to prevent flickering in first cycle in Safari (desktop & mobile).
                // TO DO: verify this is needed
                $('<img />').attr('src', frames[frames.length - 1]);
              } else {
                // canvasSupport === 'partial'
                // Copy frame into the main canvas.
                context.drawImage(frameCanvas, 0, counter * canvasSize);
              }

              counter = counter + 1;
            }

            startAnimating = function() {
              var intervalID = setInterval(function() {
                if (canvasSupport === 'partial') {
                  // Animate, by changing margin-top value of the main canvas.
                  $canvas.css('margin-top', String(-1 * counter % segments * canvasSizeCSS) + 'px');
                } else {
                  // Animate, by changing the background-image.
                  if (typeof frames[counter % segments] !== 'undefined') {
                    $canvasWrapper.css({'background-image': 'url(' + frames[counter % segments] + ')'});
                  }
                }

                if (counter % checkExistsEvery === 0 && $(uniqueSelector).length !== 1) {
                  // Target no longer exists, stop animating.
                  clearInterval(intervalID);
                }

                counter = counter + 1;
              }, delay);

              return intervalID;
            }

            if (canvasSupport !== 'none') {
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
             *   startAnimating (function): used by “start”   method.
             */
            $canvasWrapper.data(pluginName, {
              startAnimating: startAnimating
            });

            if (settings.autoStart === true) {
              // Call the start() method
              $canvasWrapper[pluginName]('start');
            }

            if (settings.pauseOnBlur === true) {
              // Bind “stop” to window’s blur event,
              // bind “start” to window’s focus event.
              $(window).bind('blur.' + pluginName, function() {
                $canvasWrapper[pluginName]('stop');
              }).bind('focus.' + pluginName, function() {
                $canvasWrapper[pluginName]('start');
              });
            }

            if (canvasWrapper !== this) {
              // We replaced the original element, so we need to update it in the jQuery object (for chaining purposes).
              jqueryObject[index] = canvasWrapper;
            }
          });

          return jqueryObject;
        },

        start: function() {
          // Start animating.

          return this.each(function() {
            var $this = $(this),
                data = $this.data(pluginName),
                intervalID;

            if (data && data.startAnimating && !data.intervalID) {
              // Start animating.
              intervalID = data.startAnimating();

              /* Store the following:
               *   startAnimating (function): used by “start”   method.
               *   intervalID     (integer) : used by “stop”    method.
               */
              $this.data(pluginName, {
                startAnimating: data.startAnimating,
                intervalID: intervalID
              });
            }
          });
        },

        stop: function() {
          // Stop animating.

          return this.each(function() {
            var $this = $(this),
                data = $this.data(pluginName);
            if (data && data.intervalID) {
              clearInterval(data.intervalID);

              /* Store the following:
               *   startAnimating (function): used by “start”   method.
               */
              $this.data(pluginName, {
                startAnimating: data.startAnimating
              });
            }
          });
        }
      };

  $.fn[pluginName] = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    }
  }
}(jQuery));
