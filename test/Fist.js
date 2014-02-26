'use strict';

var SOCK = 'test/conf/fist.sock';
var Fist = require('../Fist');
var Fs = require('fs');
var Path = require('path');
var asker = require('asker');
var routes = require('./conf/router');
var Promise = require('fist.util.promise');

module.exports = {

    Fist0: function (test) {

        var fist = new Fist({
            action: [
                Path.resolve('test/data'),
                Path.resolve('test/stuff')
            ],
            routes: routes
        });

        var spy = {
            rj: [],
            ac: [],
            rq: [],
            rs: [],
            mt: []
        };

        fist.on('accept', function (data) {
            spy.ac.push(data.path);
        });

        fist.on('reject', function (data) {
            spy.rj.push(data.path);
        });

        fist.on('request', function (data) {
            spy.rq.push(data.url.pathname);
        });

        fist.on('response', function (data) {
            spy.rs.push(data.url.pathname);
        });

        fist.on('match-done', function (data) {
            spy.mt.push(data.url.pathname);
        });

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'GET',
            timeout: 10000,
            socketPath: SOCK,
            path: '/'
        }, function (err, data) {

            test.strictEqual(data.data + '', JSON.stringify({
                result: {
                    className: 'by-stuff',
                    data: 100500,
                    knot: {
                        action: [
                            Path.resolve('test/data'),
                            Path.resolve('test/stuff')
                        ],
                        routes: routes
                    }
                },
                errors: {
                    error: 'error'
                }
            }));

            test.deepEqual(spy, {
                rq: ['/'],
                ac: ['abbr', 'className', 'data', 'knot'],
                rj: ['error'],
                rs: ['/'],
                mt: ['/']
            });

            test.done();
        });
    },

    Fist1: function (test) {

        var fist = new Fist({
            action: [
                Path.resolve('asdasd'),
                Path.resolve('test/data')
            ],
            routes: routes
        });

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        process.on('uncaughtException', function (ex) {
            test.done();
        });

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK
        }, function (err, res) {

        });
    },

    Fist2: function (test) {

        var fist = new Fist({
            action: [],
            routes: routes
        });

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '',
            require('http').STATUS_CODES[res.statusCode]);
            test.done();
        });
    },

    Fist3: function (test) {

        var fist = new Fist();

        fist.decl('users', function (track, result, errors, done) {

            setTimeout(function () {
                done(null, ['john']);
            }, 0);

            return ['mike'];
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.data + '', '["mike"]');
            test.done();
        });
    },

    Fist4: function (test) {

        var fist = new Fist();

        fist.decl('users', function () {

            return Promise.resolve(['mike']);
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.data + '', '["mike"]');
            test.done();
        });
    },

    Fist5: function (test) {

        var fist = new Fist();

        fist.decl('users', function () {

            return {
                then: function () {
                    throw 0;
                }
            };
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '0');
            test.done();
        });
    },

    Fist6: function (test) {

        var fist = new Fist();

        fist.decl('users', function () {

            return {
                then: function (onResolved, onRejected) {
                    onRejected(0);
                    onRejected(5);
                }
            };
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '0');
            test.done();
        });
    },

    Fist7: function (test) {

        var fist = new Fist();

        fist.decl('users', function () {

            return function (done) {
                done(42);
                done(43);
            }
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '42');
            test.done();
        });
    }
};
