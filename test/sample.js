"use strict";
function HelloWorld(msg) {
    if (msg) {
        return "Hello World Undefined";
    }
    if (msg === undefined) {
        return "Hello World No Message";
    }
    return "Hello World Subash";
}
exports.HelloWorld = HelloWorld;
