/*
 * SWFAddress 2.5: Deep linking for Flash and Ajax <http://www.asual.com/swfaddress/>
 *
 * SWFAddress is (c) 2006-2010 Rostislav Hristov and contributors
 * This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 *
 */

/**
 * @class The SWFAddress class can be configured with query parameters using the following format:
 * swfaddress.js?history=1&tracker=pageTracker._trackPageview&strict=1.<br /> 
 * The list of supported options include:<br /><br />
 * <code>autoUpdate:Boolean</code> - Enables or disables the auto updating.<br />
 * <code>history:Boolean</code> - Enables or disables the creation of history entries.<br />
 * <code>strict:Boolean</code> - Enables or disables the strict mode.<br />
 * <code>tracker:String</code> - Sets a function for page view tracking.<br />
 * @static 
 * @author Rostislav Hristov <http://www.asual.com>
 * @author Matthew J Tretter <http://www.exanimo.com>
 * @author Max Tafelmayer <http://www.tafelmayer.de>
 * @author Piotr Zema <http://felixz.marknaegeli.com>
 */
var SWFAddress = new function() {

    var _hash = function() {
            var index = _l.href.indexOf('#');
            return index != -1 ? _crawl(_l.href.substr(index + 1), FALSE) : '';
        },
        _window = function() { 
            try {
                return top.document !== undefined ? top : window;
            } catch (e) { 
                return window; 
            }
        },
        _strict = function(value, force) {
            if (_opts.strict)
                value = force ? (value.substr(0, 1) != '/' ? '/' + value : value) : (value == '' ? '/' : value);
            return value;
        },
        _crawl = function(value, direction) {
            if (_opts.crawlable && direction) {
                return (value != '' ? '!' : '') + value;
            }
            return value.replace(/^\!/, '');
        },
        _cssint = function(el, value) {
            var style, doc = el.ownerDocument;
            if (doc && doc.defaultView && doc.defaultView.getComputedStyle) {
                style = doc.defaultView.getComputedStyle(el, '')[value];
            } else if (el.currentStyle) {
                style = el.currentStyle[value];
            }
            return parseInt(style, 10);
        },
        _search = function(el) {
            for (var i = 0, l = el.childNodes.length, url, s; i < l; i++) {
                if (el.childNodes[i].src)
                    url = String(el.childNodes[i].src);
                if (s = _search(el.childNodes[i]))
                    url = s;
            }
            return url;
        },
        _indexOf = function(obj, arr) {
            for (var i = 0; i < arr.length; i++) {
                if (obj === arr[i])
                    return i;
            }
            return -1;
        },
        _listen = function() {
            if (!_silent) {
                var hash = _hash();
                var diff = !(_value == hash);
                if (_safari && _version < 523) {
                    if (_length != _h.length) {
                        _length = _h.length;
                        if (typeof _stack[_length - 1] != UNDEFINED)
                            _value = _stack[_length - 1];
                        _update.call(this, FALSE);
                    }
                } else if (diff) {
                    if (_msie && _version < 7) {
                        _l.reload();
                    } else {
                        if (_msie && _version < 8 && _opts.history) {
                            _st(_html, 50);
                        }
                        _value = hash;
                        _update(FALSE);
                    }
                }
            }
        },
        _bodyClick = function(e) {
            if (_popup.length > 0) {
                window['popup'] = window.open(_popup[0], _popup[1], eval(_popup[2]));
                if (typeof _popup[3] != UNDEFINED)
                    eval(_popup[3]);
            }
            _popup = [];
        },
        _dispatch = function(type) {
            this.dispatchEvent(new SWFAddressEvent(type));
            type = type.substr(0, 1).toUpperCase() + type.substr(1);
            if(typeof this['on' + type] == FUNCTION)
                this['on' + type]();
        },
        _update = function(internal) {
            for (var i = 0, id, obj, value = SWFAddress.getValue(), setter = 'setSWFAddressValue'; id = _ids[i]; i++) {
                obj = document.getElementById(id);
                if (obj) {
                    if (obj.parentNode && typeof obj.parentNode.so != UNDEFINED) {
                        obj.parentNode.so.call(setter, value, internal);
                    } else {
                        if (!(obj && typeof obj[setter] != UNDEFINED)) {
                            var objects = obj.getElementsByTagName('object');
                            var embeds = obj.getElementsByTagName('embed');
                            obj = ((objects[0] && typeof objects[0][setter] != UNDEFINED) ? 
                                objects[0] : ((embeds[0] && typeof embeds[0][setter] != UNDEFINED) ? 
                                    embeds[0] : null));
                        }
                        if (obj)
                            obj[setter](value, internal);
                    } 
                } else if (obj = document[id]) {
                    if (typeof obj[setter] != UNDEFINED)
                        obj[setter](value, internal);
                }
            }        
            _dispatch.call(this, SWFAddressEvent.CHANGE);
            _dispatch.call(this, internal ? SWFAddressEvent.INTERNAL_CHANGE : SWFAddressEvent.EXTERNAL_CHANGE);
            _st(_functions.bind(_track, this), 10);
        },
        _track = function() {
            if (_opts.tracker !== 'null' && _opts.tracker !== null) {
                var fn = _t[_opts.tracker],
                    value = (_l.pathname + (SWFAddress ? SWFAddress.getValue() : ''))
                        .replace(/\/\//, '/').replace(/^\/$/, '');
                if (typeof fn == FUNCTION) {
                    fn(value);
                } else if (typeof urchinTracker == FUNCTION) {
                    urchinTracker(value);
                } else if (typeof pageTracker != UNDEFINED && typeof pageTracker._trackPageview == FUNCTION) {
                    pageTracker._trackPageview(value);
                } else if (typeof _gaq != UNDEFINED && typeof _gaq.push == FUNCTION) {
                    _gaq.push(['_trackPageview', value]);
                }
            }
        },
        _htmlWrite = function() {
            var src = 'javascript:false;document.open();document.writeln(\'<html><head><title>' + 
                _d.title + '</title><script>var ' + ID + ' = "' + _hash() + 
                (_d.domain != _l.host ? '";document.domain="' + _d.domain : '') + 
                '";</' + 'script></head></html>\');document.close();';
            if (_version < 7) {
                _frame.src = src;
            } else {
                _frame.contentWindow.location.replace(src);
            }
        },
        _htmlLoad = function() {
            var win = _frame.contentWindow;
            var src = win.location.href;
            _value = (typeof win[ID] != UNDEFINED ? win[ID] : '');
            if (_value != _hash()) {
                _update.call(SWFAddress, FALSE);
                _l.hash = _crawl(_value, TRUE);
            }
        },
        _options = function() {
            if (_url && _qi != -1) {
                var param, params = _url.substr(_qi + 1).split('&');
                for (i = 0; i < params.length; i++) {
                    param = params[i].split('=');
                    if (/^(autoUpdate|crawlable|history|strict|wrap)$/.test(param[0])) {
                        _opts[param[0]] = (isNaN(param[1]) ? /^(true|yes)$/i.test(param[1]) : (parseInt(param[1], 10) !== 0));
                    }
                    if (/^tracker$/.test(param[0])) {
                        _opts[param[0]] = param[1];
                    }
                }
                _url = null;
            }
        },
        _load = function() {
            if (!_loaded) {
                _loaded = TRUE;
                _options();
                if (_opts.wrap) {
                	var div = _d.createElement('div');
                	div.style.padding = 
                		(_cssint(_d.body, 'marginTop') + _cssint(_d.body, 'paddingTop')) + 'px ' + 
	                    (_cssint(_d.body, 'marginRight') + _cssint(_d.body, 'paddingRight')) + 'px ' + 
	                    (_cssint(_d.body, 'marginBottom') + _cssint(_d.body, 'paddingBottom')) + 'px ' + 
	                    (_cssint(_d.body, 'marginLeft') + _cssint(_d.body, 'paddingLeft')) + 'px';
                	while (_d.body.firstChild) {
                	    div.appendChild(_d.body.firstChild);
                	}
                	_d.body.appendChild(div);
                	div = _d.createElement('div');
                	div.id = ID;
                	div.style.height = '100%';
                	div.style.overflow = 'auto';
                	if (_safari && _t.statusbar.visible && !/chrome/i.test(navigator.userAgent)) {
                		div.style.resize = 'both';
                	}
            	    div.appendChild(_d.body.firstChild);
                	_d.body.appendChild(div);
                	var containers = [_d.getElementsByTagName('html')[0], _d.body];
                	for (var i = 0; i < containers.length; i++) {
                		containers[i].style.height = '100%';
                		containers[i].style.margin = 0;
                		containers[i].style.padding = 0;
                		containers[i].style.overflow = 'hidden';
                	}
                    if (_safari) {
                    	var style = _d.createElement('style');
                    	style.type = 'text/css';
                    	var css = _d.createTextNode('#' + ID + '::-webkit-resizer { background-color: #fff; }');
                    	style.appendChild(css);
                    	_d.getElementsByTagName('head')[0].appendChild(style);
                    }
                }
                if (_msie && _version < 8) {
                    var frameset = _d.getElementsByTagName('frameset')[0];
                    _frame = _d.createElement((frameset ? '' : 'i') + 'frame');
                    if (frameset) {
                        frameset.insertAdjacentElement('beforeEnd', _frame);
                        frameset[frameset.cols ? 'cols' : 'rows'] += ',0';
                        _frame.noResize = TRUE;
                        _frame.frameBorder = _frame.frameSpacing = 0;
                    } else {
                        _frame.style.display = 'none';
                        _frame.style.width = _frame.style.height = 0;
                        _frame.tabIndex = -1;
                        _d.body.insertAdjacentElement('afterBegin', _frame);
                    }
                    _st(function() {
                        _events.addListener(_frame, 'load', _htmlLoad);            
                        if (typeof _frame.contentWindow[ID] == UNDEFINED) 
                            _htmlWrite();
                    }, 50);
                } else if (_safari) {
                    if (_version < 418) {
                        _d.body.innerHTML += '<form id="' + ID + '" style="position:absolute;top:-9999px;" method="get"></form>';
                        _form = _d.getElementById(ID);
                    }
                    if (typeof _l[ID] == UNDEFINED) _l[ID] = {};
                    if (typeof _l[ID][_l.pathname] != UNDEFINED) _stack = _l[ID][_l.pathname].split(',');
                }
    
                _st(_functions.bind(function() {
                    if (_util.Browser.isSafari())
                        _events.addListener(_d.body, 'click', _bodyClick);
                    _dispatch.call(this, SWFAddressEvent.INIT);
                    _dispatch.call(this, SWFAddressEvent.CHANGE);
                    _dispatch.call(this, SWFAddressEvent.EXTERNAL_CHANGE);                
                    _track.call(this);
                }, this), 1);

                if ((_msie && _version > 7) || (!_msie && 'onhashchange' in _t))
                    _events.addListener(_t, 'hashchange', _functions.bind(_listen, this));
                else
                    _si(_functions.bind(_listen, this), 50);
            }
        },
        ID = 'swfaddress',
        FUNCTION = 'function',
        UNDEFINED = 'undefined',
        TRUE = true,
        FALSE = false,
        _opts = {
            autoUpdate: TRUE, 
            crawlable: FALSE,
            history: TRUE, 
            strict: TRUE,
            wrap: FALSE
        },
        _util = asual.util,
        _browser = _util.Browser, 
        _events = _util.Events,
        _functions = _util.Functions,
        _version = _browser.getVersion(),
        _msie = _browser.isMSIE(),
        _mozilla = _browser.isMozilla(),
        _opera = _browser.isOpera(),
        _safari = _browser.isSafari(),
        _supported = FALSE,
        _t = _window(),
        _d = _t.document,
        _h = _t.history, 
        _l = _t.location,
        _si = setInterval,
        _st = setTimeout, 
        _init = SWFAddressEvent.INIT,
        _change = SWFAddressEvent.CHANGE,
        _internalChange = SWFAddressEvent.INTERNAL_CHANGE,
        _externalChange = SWFAddressEvent.EXTERNAL_CHANGE,
        _frame,
        _form,
        _url = _search(document);
        _qi = _url ? _url.indexOf('?') : -1,
        _title = _d.title, 
        _length = _h.length, 
        _silent = FALSE,
        _loaded = FALSE,
        _justset = TRUE,
        _juststart = TRUE,
        _updating = FALSE,
        _ref = this,
        _stack = [], 
        _ids = [],
        _popup = [],
        _listeners = {},
        _value = _hash();    
    
    if (_msie) {
        if (_d.documentMode && _d.documentMode != _version)
            _version = _d.documentMode != 8 ? 7 : 8;
        _events.addListener(document, 'propertychange', function() {
            if (_d.title != _title && _d.title.indexOf('#' + _hash()) != -1)
                _d.title = _title;
        });
    }
    
    _supported = 
        (_mozilla && _version >= 1) || 
        (_msie && _version >= 6) ||
        (_opera && _version >= 9.5) ||
        (_safari && _version >= 312);

    if (_supported) {
    
        for (var i = 1; i < _length; i++)
            _stack.push('');
            
        _stack.push(_value);

        if (_opera) 
            history.navigationMode = 'compatible';
        
        if (document.readyState == 'complete') {
            var interval = setInterval(function() {
                if (SWFAddress) {
                    _load.call(SWFAddress);
                    clearInterval(interval);
                }
            }, 50);
        } else {
            _options();
        	_events.addListener(document, 'DOMContentLoaded', _functions.bind(_load, this));
            _events.addListener(window, 'load', _functions.bind(_load, this));
        }
        
    } else if ((!_supported && _l.href.indexOf('#') != -1) || 
        (_safari && _version < 418 && _l.href.indexOf('#') != -1 && _l.search != '')){
        _d.open();
        _d.write('<html><head><meta http-equiv="refresh" content="0;url=' + 
            encodeURI(_l.href.substr(0, _l.href.indexOf('#'))) + '" /></head></html>');
        _d.close();
    } else {
        _track();
    }
    
    /**
     * The string representation of this class.
     * @return {String}     
     * @static     
     * @ignore
     */
    this.toString = function() {
        return '[class SWFAddress]';
    };

    /**
     * Loads the previous URL in the history list.
     * @return {void}
     * @static
     */
    this.back = function() {
        _h.back();
    };

    /**
     * Loads the next URL in the history list.
     * @return {void}
     * @static
     */
    this.forward = function() {
        _h.forward();
    };
    
    /**
     * Navigates one level up in the deep linking path.
     * @return {void}
     * @static
     */
    this.up = function() {
        var path = this.getPath();
        this.setValue(path.substr(0, path.lastIndexOf('/', path.length - 2) + (path.substr(path.length - 1) == '/' ? 1 : 0)));
    };
    
    /**
     * Loads a URL from the history list.
     * @param {Number} delta An integer representing a relative position in the history list.
     * @return {void}
     * @static
     */
    this.go = function(delta) {
        _h.go(delta);
    };
    
    /**
     * Opens a new URL in the browser. 
     * @param {String} url The resource to be opened.
     * @param {String} target Target window.
     * @return {void}
     * @static
     */
    this.href = function(url, target) {
        target = typeof target != UNDEFINED ? target : '_self';     
        if (target == '_self')
            self.location.href = url; 
        else if (target == '_top')
            _l.href = url; 
        else if (target == '_blank')
            window.open(url); 
        else
            _t.frames[target].location.href = url; 
    };

    /**
     * Opens a browser popup window. 
     * @param {String} url Resource location.
     * @param {String} name Name of the popup window.
     * @param {String} options Options which get evaluted and passed to the window.open() method.
     * @param {String} handler Optional JavaScript code for popup handling.    
     * @return {void}
     * @static
     */
    this.popup = function(url, name, options, handler) {
        try {
            window['popup'] = window.open(url, name, eval(options));
            if (typeof handler != UNDEFINED)
                eval(handler);
        } catch (ex) {}
        _popup = arguments;
    };

    /**
     * Provides a list of all the Flash objects registered. 
     * @return {Array}
     * @static
     */
    this.getIds = function() {
        return _ids;
    };

    /**
     * Provides the id the first and probably the only Flash object registered. 
     * @return {String}
     * @static
     */
    this.getId = function(index) {
        return _ids[0];
    };

    /**
     * Sets the id of a single Flash object which will be registered for deep linking.
     * @param {String} id ID of the object.
     * @return {void}
     * @static
     */
    this.setId = function(id) {
        _ids[0] = id;
    };
    
    /**
     * Adds an id to the list of Flash object registered for deep linking.
     * @param {String} id ID of the object.
     * @return {void}
     * @static
     */
    this.addId = function(id) {
        this.removeId(id);
        _ids.push(id);
    };

    /**
     * Removes an id from the list of Flash object registered for deep linking.
     * @param {String} id ID of the object.
     * @return {void}
     * @static
     */
    this.removeId = function(id) {
        for (var i = 0; i < _ids.length; i++) {
            if (id == _ids[i]) {
                _ids.splice(i, 1);
                break;
            }
        }
    };
    
    /**
     * Registers an event listener object that receives notification of an event. 
     * @param {String} type Event type.
     * @param {Function} listener Event listener.
     * @return {void}
     * @static
     */
    this.addEventListener = function(type, listener) {
        if (typeof _listeners[type] == UNDEFINED)
            _listeners[type] = [];
        _listeners[type].push(listener);
    };

    /**
     * Removes an event listener object.
     * @param {String} type Event type.
     * @param {Function} listener Event listener.
     * @return {void}
     * @static     
     */
    this.removeEventListener = function(type, listener) {
        if (typeof _listeners[type] != UNDEFINED) {
            for (var i = 0, l; l = _listeners[type][i]; i++)
                if (l == listener) break;
            _listeners[type].splice(i, 1);
        }
    };

    /**
     * Dispatches an event to all the registered listeners. 
     * @param {Object} event Event object.
     * @return {Boolean}
     * @static
     */
    this.dispatchEvent = function(event) {
        if (this.hasEventListener(event.type)) {
            event.target = this;
            for (var i = 0, l; l = _listeners[event.type][i]; i++)
                l(event);
            return TRUE;           
        }
        return FALSE;
    };

    /**
     * Checks the existence of any listeners registered for a specific type of event. 
     * @param {String} event Event type.
     * @return {Boolean}
     * @static
     */
    this.hasEventListener = function(type) {
        return (typeof _listeners[type] != UNDEFINED && _listeners[type].length > 0);
    };
    
    /**
     * Provides the base address of the document. 
     * @return {String}
     * @static
     */
    this.getBaseURL = function() {
        var url = _l.href;
        if (url.indexOf('#') != -1) {
            url = url.substr(0, url.indexOf('#'));
        }
        if (/\/$/.test(url)) {
            url = url.substr(0, url.length - 1);
        }
        return url;
    };

    /**
     * Provides the state of the strict mode setting. 
     * @return {Boolean}
     * @static
     */
    this.getStrict = function() {
        return _opts.strict;
    };

    /**
     * Enables or disables the strict mode.
     * @param {Boolean} strict Strict mode state.
     * @return {void}
     * @static
     */
    this.setStrict = function(strict) {
        _opts.strict = strict;
    };

    /**
     * Provides the state of the Auto update setting. 
     * @return {Boolean}
     * @static
     */
    this.getAutoUpdate = function() {
        return _opts.autoUpdate;
    };

    /**
     * Enables or disables the auto updating.
     * @param {Boolean} autoUpdate Auto update state.
     * @return {void}
     * @static
     */
    this.setAutoUpdate = function(autoUpdate) {
        _opts.autoUpdate = autoUpdate;
    };
    
    /**
     * Updates the address bar with the current value.
     * @return {void}
     * @static
     */
    this.update = function() {
        _updating = TRUE;
        this.setValue(_value);
        _updating = FALSE;
    };
    
    /**
     * Provides the state of the history setting. 
     * @return {Boolean}
     * @static
     */
    this.getHistory = function() {
        return _opts.history;
    };

    /**
     * Enables or disables the creation of history entries.
     * @param {Boolean} history History state.
     * @return {void}
     * @static
     */
    this.setHistory = function(history) {
        _opts.history = history;
    };

    /**
     * Provides the tracker function.
     * @return {String}
     * @static
     */
    this.getTracker = function() {
        return _opts.tracker;
    };

    /**
     * Sets a function for page view tracking. The default value is 'urchinTracker'.
     * @param {String} tracker Tracker function.
     * @return {void}
     * @static
     */
    this.setTracker = function(tracker) {
        _opts.tracker = tracker;
    };

    /**
     * Provides the state of the crawlable setting.
     * @return {Boolean}
     * @static
     */
    this.getCrawlable = function() {
        return _opts.crawlable;
    };

    /**
     * Enables or disables the creation of values compatible with the Google AJAX Crawling mechanism.
     * @param {Boolean} crawlable Crawlable state.
     * @return {void}
     * @static
     */
    this.setCrawlable = function(crawlable) {
        _opts.crawlable = crawlable;
    };

    /**
     * Provides the state of the wrap setting.
     * @return {Boolean}
     * @static
     */
    this.getWrap = function() {
        return _opts.wrap;
    };

    /**
     * Enables or disables the creation of a wrapper that fixes anchor scrolling issues.
     * @param {Boolean} wrap Wrap state.
     * @return {void}
     * @static
     */
    this.setWrap = function(wrap) {
        _opts.wrap = wrap;
    };

    /**
     * Provides the title of the HTML document.
     * @return {String}
     * @static
     */
    this.getTitle = function() {
        return _d.title;
    };

    /**
     * Sets the title of the HTML document.
     * @param {String} title Title value.
     * @return {void}
     * @static
     */
    this.setTitle = function(title) {
        if (!_supported) return null;
        if (typeof title == UNDEFINED) return;
        if (title == 'null') title = '';
        _st(function() {
            _title = _d.title = title;
            if (_juststart && _frame && _frame.contentWindow && _frame.contentWindow.document) {
                _frame.contentWindow.document.title = title;
                _juststart = FALSE;
            }
            if (!_justset && _mozilla)
                _l.replace(_l.href.indexOf('#') != -1 ? _l.href : _l.href + '#');
            _justset = FALSE;
        }, 10);
    };

    /**
     * Provides the status of the browser window.
     * @return {String}
     * @static
     */
    this.getStatus = function() {
        return _t.status;
    };

    /**
     * Sets the status of the browser window.
     * @param {String} status Status value.
     * @return {void}
     * @static
     */
    this.setStatus = function(status) {
        if (!_supported) return null;
        if (typeof status == UNDEFINED) return;
        if (status == 'null') status = '';
        if (!_safari) {
            status = _strict((status != 'null') ? status : '', TRUE);
            if (status == '/') status = '';
            if (!(/http(s)?:\/\//.test(status))) {
                var index = _l.href.indexOf('#');
                status = (index == -1 ? _l.href : _l.href.substr(0, index)) + '#' + status;
            }
            _t.status = status;
        }
    };

    /**
     * Resets the status of the browser window.
     * @return {void}
     * @static
     */
    this.resetStatus = function() {
        _t.status = '';
    };
    
    /**
     * Provides the current deep linking value.
     * @return {String}
     * @static
     */
    this.getValue = function() {
        if (!_supported) return null;
        return _strict(_value, FALSE);
    };
    
    /**
     * Sets the current deep linking value.
     * @param {String} value A value which will be appended to the base link of the HTML document.
     * @return {void}
     * @static
     */
    this.setValue = function(value) {
        if (!_supported) return null;
        if (typeof value == UNDEFINED) return;
        if (value == 'null') value = '';
        value = _strict(value, TRUE);
        if (value == '/') value = '';
        if (_value == value && !_updating) return;
        _justset = TRUE;
        _value = value;
        if (_opts.autoUpdate || _updating) {
            _silent = TRUE;
            _update.call(SWFAddress, TRUE);
            _stack[_h.length] = _value;
            if (_safari) {
                if (_opts.history) {
                    _l[ID][_l.pathname] = _stack.toString();
                    _length = _h.length + 1;
                    if (_version < 418) {
                        if (_l.search == '') {
                            _form.action = '#' + _crawl(_value, TRUE);
                            _form.submit();
                        }
                    } else if (_version < 523 || _value == '') {
                        var evt = _d.createEvent('MouseEvents');
                        evt.initEvent('click', TRUE, TRUE);
                        var anchor = _d.createElement('a');
                        anchor.href = '#' + _crawl(_value, TRUE);
                        anchor.dispatchEvent(evt);                
                    } else {
                        _l.hash = '#' + _crawl(_value, TRUE);
                    }
                } else {
                    _l.replace('#' + _crawl(_value, TRUE));
                }
            } else if (_value != _hash()) {
                if (_opts.history)
                    _l.hash = '#' + _crawl(_value, TRUE);
                else
                    _l.replace('#' + _crawl(_value, TRUE));
            }
            if ((_msie && _version < 8) && _opts.history)
                _st(_htmlWrite, 50);
            if (_safari)
                _st(function(){ _silent = FALSE; }, 1);
            else
                _silent = FALSE;
        }
    };

    /**
     * Provides the deep linking value without the query string.
     * @return {String}
     * @static
     */
    this.getPath = function() {
        var value = this.getValue();
        if (value.indexOf('?') != -1) {
            return value.split('?')[0];
        } else if (value.indexOf('#') != -1) {
            return value.split('#')[0];
        } else {
            return value;   
        }
    };

    /**
     * Sets the path part of the deep linking value.
     * @param {String} value A value which will be used as a path.
     * @return {void}
     * @static
     */
    this.setPath = function(value) {
        var qs = this.getQueryString();
        this.value(value + (qs ? '?' + qs : ''));
    };

    /**
     * Provides a list of all the folders in the deep linking path.
     * @return {Array}
     * @static
     */
    this.getPathNames = function() {
        var path = this.getPath(), names = path.split('/');
        if (path.substr(0, 1) == '/' || path.length == 0)
            names.splice(0, 1);
        if (path.substr(path.length - 1, 1) == '/')
            names.splice(names.length - 1, 1);
        return names;
    };

    /**
     * Provides the query string part of the deep linking value.
     * @return {String}
     * @static
     */
    this.getQueryString = function() {
        var value = this.getValue(), index = value.indexOf('?');
        if (index != -1 && index < value.length) 
            return value.substr(index + 1);
    };

    /**
     * Sets the query string part of the deep linking value.
     * @param {String} value A value which will be used as a query string.
     * @return {void}
     * @static
     */
    this.setQueryString = function(value) {
        this.setValue(this.getPath() + (value ? '?' + value : ''));
    };

    /**
     * Provides the value of a specific query parameter as a string or array of strings.
     * @param {String} name Parameter name.
     * @return {Object}
     * @static
     */
    this.getParameter = function(name) {
        var value = this.getValue(),
            index = value.indexOf('?');
        if (index != -1) {
            value = value.substr(index + 1);
            var p, params = value.split('&'), r = [];
            for (var i = 0; i < params.length; i++) {
                p = params[i].split('=');
                if (p[0] == name)
                    r.push(p[1]);
            }
            if (r.length != 0)
                return r.length != 1 ? r : r[0];
        }
    };

    /**
     * Sets the value of a specific query parameter.
     * @param {String} name Parameter name.
     * @param {Object} value Parameter value.
     * @param {Boolean} append Optional flag that disables parameter overwriting.
     * @return {void}
     * @static
     */
    this.setParameter = function(name, value, append) {
        var names = this.getParameterNames(),
            params = [];
        for (var i = 0; i < names.length; i++) {
            var n = names[i],
                v = this.getParameter(n);
            if (typeof v == 'string')
                v = [v];
            if (n == name)
                v = (value === null || value == '') ? [] : 
                    (append ? v.concat([value]) : [value]);
            for (var j = 0; j < v.length; j++)
                params.push(n + '=' + v[j]);
        }
        if (_indexOf(name, names) == -1)
            params.push(name + '=' + value);
        this.setQueryString(params.join('&'));
    };

    /**
     * Provides a list of all the query parameter names.
     * @return {Array}
     * @static
     */
    this.getParameterNames = function() {
        var value = this.getValue(),
            index = value.indexOf('?'),
            names = [];
        if (index != -1) {
            value = value.substr(index + 1);
            if (value != '' && value.indexOf('=') != -1) {
                var params = value.split('&'), i = 0;
                for (var i = 0; i < params.length; i++) {
                    var name = params[i].split('=')[0];
                    if (_indexOf(name, names) == -1)
                        names.push(name);
                }
            }
        }
        return names;
    };
    
    /**
     * Init event.
     * @type Function
     * @event
     * @static
     */
    this.onInit = null;
    
    /**
     * Change event.
     * @type Function
     * @event
     * @static
     */
    this.onChange = null;
    
    /**
     * Internal change event.
     * @type Function
     * @event
     * @static
     */
    this.onInternalChange = null;
    
    /**
     * External change event.
     * @type Function
     * @event
     * @static
     */
    this.onExternalChange = null;
    
    /**
     * SWFAddress embed hooks.
     * @ignore
     */
    (function() {
    
        var _args;
    
        if (typeof FlashObject != UNDEFINED) SWFObject = FlashObject;
        if (typeof SWFObject != UNDEFINED && SWFObject.prototype && SWFObject.prototype.write) {
            var _s1 = SWFObject.prototype.write;
            SWFObject.prototype.write = function() {
                _args = arguments;
                if (this.getAttribute('version').major < 8) {
                    this.addVariable('$swfaddress', SWFAddress.getValue());
                    ((typeof _args[0] == 'string') ? 
                        document.getElementById(_args[0]) : _args[0]).so = this;
                }
                var success;
                if (success = _s1.apply(this, _args))
                    _ref.addId(this.getAttribute('id'));
                return success;
            }
        } 
        
        if (typeof swfobject != UNDEFINED) {
            var _s2r = swfobject.registerObject;
            swfobject.registerObject = function() {
                _args = arguments;
                _s2r.apply(this, _args);
                _ref.addId(_args[0]);
            }
            var _s2c = swfobject.createSWF;
            swfobject.createSWF = function() {
                _args = arguments;
                var swf = _s2c.apply(this, _args);
                if (swf)
                    _ref.addId(_args[0].id);
                return swf;
            }
            var _s2e = swfobject.embedSWF;
            swfobject.embedSWF = function() {
                _args = arguments;
                if (typeof _args[8] == UNDEFINED)
                    _args[8] = {};
                if (typeof _args[8].id == UNDEFINED)
                    _args[8].id = _args[1];
                _s2e.apply(this, _args);
                _ref.addId(_args[8].id);
            }
        }
        
        if (typeof UFO != UNDEFINED) {
            var _u = UFO.create;
            UFO.create = function() {
                _args = arguments;
                _u.apply(this, _args);
                _ref.addId(_args[0].id);
            }
        }
        
        if (typeof AC_FL_RunContent != UNDEFINED) {
            var _a = AC_FL_RunContent;
            AC_FL_RunContent = function() {
                _args = arguments;        
                _a.apply(this, _args);
                for (var i = 0, l = _args.length; i < l; i++)
                    if (_args[i]== 'id') _ref.addId(_args[i+1]);
            }
        }
        
    })();
}
