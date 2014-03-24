'use strict';

var Http = require('http');
var Nested = /** @type Nested */ require('./bundle/Nested');
var Next = /** @type Next */ require('fist.util.next/Next');
var Runtime = /** @type Runtime */ require('./track/Runtime');
var Server = /** @type Server */ require('./Server');
var Toobusy = /** @type Toobusy */ require('./util/Toobusy');

var caller = require('./util/caller');

/**
 * @class Framework
 * @extends Server
 * */
var Framework = Server.extend(/** @lends Framework.prototype */ {

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Framework.Parent.apply(this, arguments);

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Array}
         * */
        this._tasks = [];

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Array}
         * */
        this._pends = [];

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Number}
         * */
        this._pending = 0;

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Toobusy}
         * */
        this._toobusy = new Toobusy({
            maxLag: this.params.busyHWM
        });

        /**
         * @public
         * @memberOf {Framework}
         * @property {Object<Function>}
         * */
        this.renderers = Object.create(null);
    },

    /**
     * @public
     * @memberOf {Framework}
     * @method
     * */
    listen: function () {

        var server = Http.createServer(this.getHandler());

        server.listen.apply(server, arguments);
        //  автоматически запускаю инициализацию
        this.ready();
    },

    /**
     * @public
     * @memberOf {Framework}
     * @method
     * */
    ready: function () {

        var isError = false;
        var length = this._tasks.length;

        this._pending += 1;

        if ( 1 === this._pending ) {
            this.emit('sys:pending');
        }

        function done (err) {

            if ( 2 > arguments.length ) {
                this.emit('sys:error', err);

                return;
            }

            this._pending -= 1;

            if ( 0 === this._pending ) {
                this.emit('sys:ready');

                while ( this._pends.length ) {
                    this._handle(this._pends.shift());
                }
            }
        }

        function ready (err) {

            if ( 2 > arguments.length ) {
                isError = true;
                done.call(this, err);

                return;
            }

            length -= 1;

            if ( 0 === length ) {
                done.call(this, null, null);
            }
        }

        if ( 0 === length ) {
            done.call(this, null, null);

            return;
        }

        while ( this._tasks.length ) {

            if ( isError ) {

                break;
            }

            this._tasks.shift()(ready, this);
        }
    },

    /**
     * @public
     * @memberOf {Framework}
     * @method
     * */
    plug: function () {
        Array.prototype.forEach.call(arguments, function (plugin) {
            var self = this;

            this._tasks.push(function (done, ctxt) {

                var next = new Next();

                plugin.call(self, function () {
                    next.args(arguments);
                });

                next.done(done, ctxt);
            });

        }, this);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Function} func
     * @param {Runtime} track
     * @param {Bundle} bundle
     * @param {Function} done
     * */
    _call: function (func, track, bundle, done) {

        if ( 'function' === typeof func ) {
            caller.callFunc(func, [track, bundle.errors, bundle.result], done);

            return;
        }

        caller.callRet(func, done);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @returns {Nested}
     * */
    _createBundle: function () {

        return new Nested();
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @returns {Runtime}
     * */
    _createTrack: function (req, res) {

        return new Runtime(this, req, res);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Runtime} track
     * */
    _handle: function (track) {

        if ( this._toobusy.busy() ) {
            track.send(503);

            return;
        }

        if ( 0 === this._pending ) {
            Framework.parent._handle.apply(this, arguments);

            return;
        }

        this._pends.push(track);
    }

});

module.exports = Framework;
