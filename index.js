"use strict";

module.exports = function () {
    return {
        dependencies: [],

        *onBeforeComponentsRegister(container) {
            // register proxy manager
            container.register("proxyManager", require("./lib/proxy_manager"));
        },

        typeProxy(name, opt) {
            return function (proxyManager) {
                return proxyManager.createProxy(opt);
            };
        }
    };
};
