/*
  QuoJS 2.0
  (c) 2011, 2012 Javi Jiménez Villar (@soyjavi)
  http://quojs.tapquo.com
*/

(function($$) {

    var ELEMENT_ID = 1;
    var HANDLERS = {};
    var EVENT_METHODS = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped' };
    var EVENTS_DESKTOP = {
        touchstart : 'mousedown',
        touchmove: 'mousemove',
        touchend: 'mouseup',
        tap: 'click',
        doubletap: 'dblclick',
        orientationchange: 'resize' };

    /**
     * ?
     */
    $$.Event = function(type, touch) {
        var event = document.createEvent('Events');
        event.initEvent(type, true, true, null, null, null, null, null, null, null, null, null, null, null, null);

        if (touch) {
            event.pageX = touch.x1;
            event.pageY = touch.y1;
            event.toX = touch.x2;
            event.toY = touch.y2;
            event.fingers = touch.fingers;
        }
        return event;
    };

    /**
     * ?
     */
    $$.fn.bind = function(event, callback) {
        return this.each(function() {
            _subscribe(this, event, callback);
        });
    };

    /**
     * ?
     */
    $$.fn.unbind = function(event, callback){
        return this.each(function() {
            _unsubscribe(this, event, callback);
        });
    };

    /**
     * ?
     */
    $$.fn.delegate = function(selector, event, callback) {
        return this.each(function(i, element) {
            _subscribe(element, event, callback, selector, function(fn) {
                return function(e) {
                    var match = $$(e.target).closest(selector, element).get(0);
                    if (match) {
                        var evt = $$.extend(_createProxy(e), {
                            currentTarget: match,
                            liveFired: element
                        });
                        return fn.apply(match, [evt].concat([].slice.call(arguments, 1)));
                    }
                }
            });
        });
    };

    /**
     * ?
     */
    $$.fn.undelegate = function(selector, event, callback){
        return this.each(function(){
            _unsubscribe(this, event, callback, selector);
        });
    };

    /**
     * ?
     */
    $$.fn.trigger = function(event, touch) {
        if ($$.toType(event) === 'string') event = $$.Event(event, touch);

        return this.each(function() {
            this.dispatchEvent(event);
        });
    };

    /**
     * ?
     */
    $$.fn.addEvent = function(element, event_name, callback) {
        if (element.addEventListener) {
            element.addEventListener(event_name, callback, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + event_name, callback );
        } else {
            element['on' + event_name] = callback;
        }
    };

    /**
     * ?
     */
    $$.fn.removeEvent = function(element, event_name, callback) {
        if (element.removeEventListener) {
            element.removeEventListener(event_name, callback, false);
        } else if (element.detachEvent) {
            element.detachEvent('on' + event_name, callback );
        } else {
            element['on' + event_name] = null;
        }
    };

    function _subscribe(element, event, callback, selector, delegate_callback) {
        event = _environmentEvent(event);

        var element_id = _getElementId(element);
        var element_handlers = HANDLERS[element_id] || (HANDLERS[element_id] = []);
        var delegate = delegate_callback && delegate_callback(callback, event);

        var handler = {
            event: event,
            callback: callback,
            selector: selector,
            proxy: _createProxyCallback(delegate, callback, element),
            delegate: delegate,
            index: element_handlers.length
        };
        element_handlers.push(handler);

        $$.fn.addEvent(element, handler.event, handler.proxy);
    }

    function _unsubscribe(element, event, callback, selector) {
        event = _environmentEvent(event);

        var element_id = _getElementId(element);
        _findHandlers(element_id, event, callback, selector).forEach(function(handler) {
            delete HANDLERS[element_id][handler.index];

            $$.fn.removeEvent(element, handler.event, handler.proxy);
        });
    }

    function _getElementId(element) {
        return element._id || (element._id = ELEMENT_ID++);
    }

    function _environmentEvent(event) {
        var environment_event = ($$.isMobile()) ? event : EVENTS_DESKTOP[event];

        return (environment_event) || event;
    }

    function _createProxyCallback(delegate, callback, element) {
        var callback = delegate || callback;

        var proxy = function (event) {
            var result = callback.apply(element, [event].concat(event.data));
            if (result === false) {
                event.preventDefault();
            }
            return result;
        };

        return proxy;
    }

    function _findHandlers(element_id, event, fn, selector) {
        return (HANDLERS[element_id] || []).filter(function(handler) {
            return handler
            && (!event  || handler.event == event)
            && (!fn       || handler.fn == fn)
            && (!selector || handler.selector == selector);
        });
    }

    function _createProxy(event) {
        var proxy = $$.extend({originalEvent: event}, event);

        $$.each(EVENT_METHODS, function(name, method) {
            proxy[name] = function() {
                this[method] = function(){ return true };
                return event[name].apply(event, arguments);
            };
            proxy[method] = function() { return false };
        })
        return proxy;
    }

})(Quo);