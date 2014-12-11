/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');
var inherit = require('inherit');
var logger = require('loggin');

describe('core/track', function () {
    var Core = require('../core/core');
    var Track = require('../core/track');
    var agent = new Core();

    it('Should be an instance of Track', function () {
        var track = new Track(agent, logger);
        assert.ok(track instanceof Track);
    });

    it('Should take a logger', function () {
        var track = new Track(agent, logger);
        assert.strictEqual(track.logger, logger);
    });

    describe('track.invoke()', function () {
        it('Should invoke unit', function (done) {
            var Unit = inherit(agent.Unit, {
                name: 'foo',
                main: function () {
                    return 42;
                }
            });
            var unit = new Unit();
            var track = new Track(agent, logger);

            track.invoke(unit).done(function (res) {
                assert.strictEqual(res.result, 42);
                done();
            });
        });

        it('Should memorize unit calls', function (done) {
            var i = 0;
            var Unit = inherit(agent.Unit, {
                name: 'foo',
                main: function () {
                    i += 1;
                    return 42;
                }
            });
            var unit = new Unit();
            var track = new Track(agent, logger);

            track.invoke(unit).done(function (res) {
                assert.strictEqual(res.result, 42);
                assert.strictEqual(i, 1);

                track.invoke(unit).done(function (res) {
                    assert.strictEqual(res.result, 42);
                    assert.strictEqual(i, 1);
                    done();
                });
            });
        });

        it('Should memorize unit calls by args hash if params.toString() defined', function (done) {
            var i = 0;
            var Unit = inherit(agent.Unit, {
                name: 'foo',
                params: {
                    toString: function () {
                        return this.foo;
                    }
                },
                main: function (track, context) {
                    i += 1;
                    assert.strictEqual(context.params.foo, 'bar');
                    return 42;
                }
            });
            var args = {
                foo: 'bar'
            };
            var unit = new Unit();
            var track = new Track(agent, logger);

            track.invoke(unit, args).done(function (res) {
                assert.strictEqual(res.result, 42);
                assert.strictEqual(i, 1);

                track.invoke(unit, args).done(function (res) {
                    assert.strictEqual(res.result, 42);
                    assert.strictEqual(i, 1);
                    done();
                });
            });
        });
    });

    describe('track.eject()', function () {
        it('Should call unit by name and return only result', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var track = new Track(core, logger);
                track.eject('foo').done(function (res) {
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });
    });
});