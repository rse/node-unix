
node-unix
=========

Unix operating system integration for [Node.js](http://nodejs.org/)-based services

<p/>
<img src="https://nodei.co/npm/node-unix.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/node-unix.png" alt=""/>

Abstract
--------

This is a [Node.js](http://nodejs.org/) extension module for
integrating a Node.js-based daemon/service into Unix-style operating systems. Currently Linux and FreeBSD are supported.
The API is loosely modeled after the existing
[node-windows](https://github.com/coreybutler/node-windows)
and [node-mac](https://github.com/coreybutler/node-mac) extension modules. The functionality
of node-unix is just a subset of them, but it is sufficient to install, uninstall, start and stop
Node.js-based services.

Installation
------------

Use the Node Package Manager (NPM) to install this module
locally (default) or globally (with option `-g`):

    $ npm install [-g] node-unix

Usage
-----

Use this module similar to (or even in combination with)
[node-windows](https://github.com/coreybutler/node-windows) and
[node-mac](https://github.com/coreybutler/node-mac).
See [sample-control.js](sample-control.js) for a simple node-unix
based controller for the trivial sample service in [sample-service.js](sample-service.js).

See Also
--------

- [node-windows](https://github.com/coreybutler/node-windows)
- [node-mac](https://github.com/coreybutler/node-mac)

License
-------

Copyright (c) 2013-2018 Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

