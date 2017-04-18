"use strict";

const {Component} = require("merapi");
const {proxy} = require("merapi-proxy");

class ProxyManager extends Component {
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger;
    }

    createProxy(options) {
        return proxy(options.uri, options, this.logger);
    }
}

module.exports = ProxyManager;