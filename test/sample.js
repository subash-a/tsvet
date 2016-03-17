"use strict";
var PromiseWrapper = (function () {
    function PromiseWrapper() {
    }
    PromiseWrapper.prototype.then = function (meth) {
        //do something here
    };
    return PromiseWrapper;
}());
function HelloWorld(msg) {
    if (msg) {
        return "Hello World Undefined";
    }
    if (msg === undefined) {
        return "Hello World No Message";
    }
    var pw0 = new PromiseWrapper();
    pw0.then(function (res, err) {
        var p = res; // Invalid promise wrapper handler
    });
    var pw1 = new PromiseWrapper();
    pw1.then(function (res, err) {
        if (err !== undefined) {
            throw err;
        }
        var p = res;
    });
    return "Hello World Subash";
}
exports.HelloWorld = HelloWorld;
