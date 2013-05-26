/*
**  node-unix -- Unix operating system integration for Node-based services
**  Copyright (c) 2013 Ralf S. Engelschall <rse@engelschall.com>
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

var fs           = require("fs");
var os           = require("os");
var path         = require("path");
var exec         = require("child_process").exec;
var util         = require("util");
var sh           = require("sh");
var shelly       = require("shelly");
var EventEmitter = require("events").EventEmitter;
var wrapper      = path.resolve(path.join(__dirname, "./node-unix-daemon.js"));

if (!(os.platform() === "linux" || os.platform() === "freebsd"))
    throw new Error("node-unix supported under Linux and FreeBSD only (you have \"" + os.platform() + "\")");

var Service = function (config) {
    EventEmitter.call(this);
	Object.defineProperties(this, {
        name: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: config.name || null
        },
        description: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: config.description || ""
        },
        script: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: config.script || null
        },
        user: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: config.user || process.getuid()
        },
        group: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: config.group || process.getgid()
        },
        cwd: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: config.cwd || process.cwd()
        },
        exists: {
            enumerable: false,
            get: function () {
                return this.installed();
            }
        }
    });
};
util.inherits(Service, EventEmitter);
Service.prototype.install = function (cb) {
    return this.platform[os.platform()](this, "install", cb);
};
Service.prototype.uninstall = function (cb) {
    return this.platform[os.platform()](this, "uninstall", cb);
};
Service.prototype.installed = function () {
    return this.platform[os.platform()](this, "installed");
};
Service.prototype.start = function (cb) {
    return this.platform[os.platform()](this, "start", cb);
};
Service.prototype.stop = function (cb) {
    return this.platform[os.platform()](this, "stop", cb);
};
Service.prototype.restart = function (cb) {
    var self = this;
    this.stop(function () {
        self.start(cb);
    });
};
Service.prototype.platform = {
    linux: function (self, command, cb) {
        /*  determine path to rc script  */
        if (!fs.existsSync("/etc/init.d"))
            throw new Error("directory /etc/init.d not existing");
        var rcscript = util.format("/etc/init.d/%s", self.name);

        /*  determine path to pid file  */
        if (!fs.existsSync("/var/run"))
            throw new Error("directory /var/run not existing");
        var pidfile = util.format("/var/run/%s.pid", self.name);

        /*  determine path to log files */
        if (!fs.existsSync("/var/log"))
            throw new Error("directory /var/log not existing");
        var outfile = util.format("/var/log/%s-out.log", self.name);
        var errfile = util.format("/var/log/%s-err.log", self.name);

        if (command === "install") {
            if (fs.existsSync(rcscript)) {
                self.emit("alreadyinstalled");
                return;
            }
            fs.writeFileSync(rcscript,
                "#!/bin/sh\n" +
                "### BEGIN INIT INFO\n" +
                "# Provides:          " + self.name + "\n" +
                "# Required-Start:    $remote_fs\n" +
                "# Required-Stop:     $remote_fs\n" +
                "# Default-Start:     2 3 4 5\n" +
                "# Default-Stop:      0 1 6\n" +
                "# Short-Description: " + self.description + "\n" +
                "# Description:       " + self.description + "\n" +
                "### END INIT INFO\n" +
                "# chkconfig: 2345 99 00\n" +
                "# description: " + self.description + "\n" +
                "\n" +
                "node_unix_daemon () {\n" +
                "    " + process.execPath + " \\\n" +
                "    " + wrapper + " \\\n" +
                "    -n \"" + self.name + "\" \\\n" +
                "    -f \"" + self.script + "\" \\\n" +
                "    -u \"" + self.user + "\" \\\n" +
                "    -g \"" + self.group + "\" \\\n" +
                "    -p \"" + pidfile + "\" \\\n" +
                "    -d \"" + self.cwd + "\" \\\n" +
                "    -o \"" + outfile + "\" \\\n" +
                "    -e \"" + errfile + "\" \\\n" +
                "    $1\n" +
                "}\n" +
                "case \"$1\" in\n" +
                "    start        ) node_unix_daemon start  ;;\n" +
                "    stop         ) node_unix_daemon stop   ;;\n" +
                "    restart      ) node_unix_daemon stop; node_unix_daemon start ;;\n" +
                "    status       ) node_unix_daemon status ;;\n" +
                "    reload       ) ;;\n" +
                "    force-reload ) ;;\n" +
                "    *            ) echo \"Usage: " + rcscript + " {start|stop|restart|status}\" >&2; exit 1 ;;\n" +
                "esac\n",
                { encoding: "utf8" }
            );
            var cmd = shelly("chmod 755 ?", rcscript)
            if (fs.existsSync("/sbin/insserv"))
                cmd += shelly(" && /sbin/insserv ?", self.name)
            else if (fs.existsSync("/sbin/chkconfig")) {
                cmd += shelly(" && /sbin/chkconfig --add ?", self.name)
                cmd += shelly(" && /sbin/chkconfig ? on", self.name)
            }
            sh(cmd, function () {
                this.and(function () {
                    self.emit("install");
                });
                this.or(function () {
                    self.emit("error", "failed to execute: " + cmd);
                });
            })
        }
        else if (command === "uninstall") {
            var cmd = shelly("? stop >/dev/null 2>&1 || true", rcscript);
            if (fs.existsSync("/sbin/insserv"))
                cmd += shelly(" && /sbin/insserv -r ?", self.name);
            else if (fs.existsSync("/sbin/chkconfig")) {
                cmd += shelly(" && /sbin/chkconfig ? off", self.name);
                cmd += shelly(" && /sbin/chkconfig --del ?", self.name);
            }
            cmd += shelly(" && rm -f ? ? ? ? >/dev/null 2>&1 || true", rcscript, pidfile, outfile, errfile);
            sh(cmd, function () {
                this.and(function () {
                    self.emit("uninstall");
                });
                this.or(function () {
                    self.emit("error", "failed to execute: " + cmd);
                });
            });
        }
        else if (command === "installed") {
            return fs.existsSync(rcscript);
        }
        else if (command === "start") {
            exec(shelly("? start", rcscript), function (error, stdout, stderr) {
                if (error !== null)
                    self.emit("error", stderr);
                else
                    self.emit("start");
            })
        }
        else if (command === "stop") {
            exec(shelly("? stop", rcscript), function (error, stdout, stderr) {
                if (error !== null)
                    self.emit("error", stderr);
                else
                    self.emit("stop");
            })
        }
    },
    freebsd: function (self, command, cb) {
        /*  determine path to rc script  */
        if (!fs.existsSync("/etc/rc.d"))
            throw new Error("directory /etc/rc.d not existing");
        var rcscript = util.format("/etc/rc.d/%s", self.name);

        /*  determine path to pid file  */
        if (!fs.existsSync("/var/run"))
            throw new Error("directory /var/run not existing");
        var pidfile = util.format("/var/run/%s.pid", self.name);

        /*  determine path to log files */
        if (!fs.existsSync("/var/log"))
            throw new Error("directory /var/log not existing");
        var outfile = util.format("/var/log/%s-out.log", self.name);
        var errfile = util.format("/var/log/%s-err.log", self.name);

        if (command === "install") {
            if (fs.existsSync(rcscript)) {
                self.emit("alreadyinstalled");
                return;
            }
            fs.writeFileSync(rcscript,
                "#!/bin/sh\n" +
                "# PROVIDE: " + self.name + "\n" +
                "# REQUIRE: FILESYSTEMS NETWORKING SERVERS\n" +
                "# KEYWORD: nojail shutdown\n" +
                "\n" +
                "node_unix_daemon () {\n" +
                "    " + process.execPath + " \\\n" +
                "    " + wrapper + " \\\n" +
                "    -n \"" + self.name + "\" \\\n" +
                "    -f \"" + self.script + "\" \\\n" +
                "    -u \"" + self.user + "\" \\\n" +
                "    -g \"" + self.group + "\" \\\n" +
                "    -p \"" + pidfile + "\" \\\n" +
                "    -d \"" + self.cwd + "\" \\\n" +
                "    -o \"" + outfile + "\" \\\n" +
                "    -e \"" + errfile + "\" \\\n" +
                "    $1\n" +
                "}\n" +
                ". /etc/rc.subr\n" +
                "name=\"" + self.name + "\"\n" +
                "rcvar=\"" + self.name + "_enable\"\n" +
                "start_cmd=\"node_unix_daemon start\"\n" +
                "stop_cmd=\"node_unix_daemon stop\"\n" +
                "status_cmd=\"node_unix_daemon status\"\n" +
                "restart_cmd=\"node_unix_daemon stop; node_unix_daemon start\"\n" +
                "extra_commands=\"status\"\n" +
                "load_rc_config $name\n" +
                "run_rc_command \"$1\"\n",
                { encoding: "utf8" }
            )
            var cmd = shelly("chmod 755 ?", rcscript);
            sh(cmd, function () {
                this.and(function () {
                    self.emit("install");
                });
                this.or(function () {
                    self.emit("error", "failed to execute: " + cmd);
                });
            })
        }
        else if (command === "uninstall") {
            var cmd = shelly("? stop >/dev/null 2>&1 || true", rcscript);
            cmd += shelly(" && rm -f ? ? ? ? >/dev/null 2>&1 || true", rcscript, pidfile, outfile, errfile);
            console.log(cmd);
            sh(cmd, function () {
                this.and(function () {
                    self.emit("uninstall");
                });
                this.or(function () {
                    self.emit("error", "failed to execute: " + cmd);
                });
            });
        }
        else if (command === "installed") {
            return fs.existsSync(rcscript);
        }
        else if (command === "start") {
            if (!fs.existsSync(rcscript)) {
                self.emit("invalidinstallation");
                return;
            }
            exec(shelly("? start", rcscript), function (error, stdout, stderr) {
                if (error !== null)
                    self.emit("error", stderr);
                else
                    self.emit("start");
            })
        }
        else if (command === "stop") {
            if (!fs.existsSync(rcscript)) {
                self.emit("invalidinstallation");
                return;
            }
            exec(shelly("? stop", rcscript), function (error, stdout, stderr) {
                if (error !== null)
                    self.emit("error", stderr);
                else
                    self.emit("stop");
            })
        }
    }
};

module.exports.Service = Service;
