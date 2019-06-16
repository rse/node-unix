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

if (process.argv.length !== 3) {
    console.log("USAGE: " + process.argv[0] + " " + process.argv[1] +
        " {install|uninstall|status|start|stop}");
    process.exit(1);
}

var os = require("os");
var path = require("path");

var Service = require("./node-unix").Service;

var svc = new Service({
    name: "sample",
    description: "Sample Service",
    script: path.resolve(path.join(__dirname, "./sample-service.js"))
});

svc.on("install", function () {
    console.log("OK: installed");
    process.exit(0);
});
svc.on("uninstall", function () {
    console.log("OK: uninstalled");
    process.exit(0);
});
svc.on("start", function () {
    console.log("OK: started");
    process.exit(0);
});
svc.on("stop", function () {
    console.log("OK: stopped");
    process.exit(0);
});
svc.on("alreadyinstalled", function () {
    console.log("ERROR: already installed");
    process.exit(2);
});
svc.on("invalidinstallation", function () {
    console.log("ERROR: invalid installation");
    process.exit(2);
});
svc.on("error", function (error) {
    console.log("ERROR: " + error);
    process.exit(2);
});

switch (process.argv[2]) {
    case "install":
        svc.install();
        break;
    case "uninstall":
        svc.uninstall();
        break;
    case "start":
        svc.start();
        break;
    case "stop":
        svc.stop();
        break;
    case "status":
        var status = svc.exists ? "yes" : "no";
        console.log("OK: installed: " + status);
        process.exit(status === "yes" ? 0 : 1);
        break;
    default:
        console.log("ERROR: invalid command: " + process.argv[2]);
        process.exit(2);
        break;
}

