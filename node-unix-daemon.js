#!/usr/bin/env node
/*
**  node-unix -- Unix operating system integration for Node-based services
**  Copyright (c) 2013-2019 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* global require: true */
/* global process: true */
/* global console: true */

/*  load required modules  */
var fs        = require("fs");
var path      = require("path");
var util      = require("util");
var optimist  = require("optimist");
var daemonize = require("daemonize.redux");

/*  parse command-line arguments  */
/* jshint -W024 */
var argv = optimist
  .demand("n").alias("n", "name")
  .describe("n", "The name of the process.")
  .demand("f").alias("f", "file")
  .describe("f", "Absolute path of the script to be run as a process.")
  .demand("p").alias("p", "pidfile")
  .describe("p", "Absolute path of the PID file.")
  .default("d", "/").alias("d", "cwd")
  .describe("d", "The current working directory for the process.")
  .default("o", "/dev/null").alias("o", "stdout")
  .describe("o", "Absolute path of the stdout log file.")
  .default("e", "/dev/null").alias("e", "stderr")
  .describe("e", "Absolute path of the stderr log file.")
  .default("u", "-").alias("u", "user")
  .describe("u", "User to run process under.")
  .default("g", "-").alias("g", "group")
  .describe("g", "Group to run process under.")
  .default("t", 2000).alias("t", "timeout")
  .describe("t", "Stop timeout for daemon killing retry.")
  .argv;

/*  initialize the daemonization  */
var daemon = daemonize.setup({
    name:        argv.n,
    main:        path.resolve(argv.f),
    pidfile:     path.resolve(argv.p),
    cwd:         path.resolve(argv.d),
    stdout:      argv.o === "/dev/null" ? "ignore" : fs.openSync(path.resolve(argv.o), "a"),
    stderr:      argv.e === "/dev/null" ? "ignore" : fs.openSync(path.resolve(argv.e), "a"),
    user:        argv.u !== "-" ? argv.u : "",
    group:       argv.g !== "-" ? argv.g : "",
    stopTimeout: argv.t,
    argv:        argv._,
    silent:      true
});

/*  react on certain emitted events  */
daemon.on("started", function () {
    console.log(util.format("%s: OK: started", argv.n));
    process.exit(0);
});
daemon.on("running", function () {
    console.log(util.format("%s: ERROR: cannot start -- already running", argv.n));
    process.exit(1);
});
daemon.on("stopped", function () {
    console.log(util.format("%s: OK: stopped", argv.n));
    process.exit(0);
});
daemon.on("notrunning", function () {
    console.log(util.format("%s: ERROR: cannot stop -- not running", argv.n));
    process.exit(1);
});
daemon.on("error", function (error) {
    console.log(util.format("%s: ERROR: %s", argv.n, error));
    process.exit(1);
});

/*  dispatch action according to given command  */
switch (argv._[0]) {
    case "start":
        daemon.start();
        break;
    case "stop":
        daemon.stop();
        break;
    case "status":
        var status = daemon.status() > 0 ? "running" : "not running";
        console.log(util.format("%s: OK: status: %s", argv.n, status));
        process.exit(status === "running" ? 0 : 1);
        break;
    default:
        console.log(util.format("%s: ERROR: invalid command", argv.n));
        break;
}

