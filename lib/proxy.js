"use strict";

const component = require("@yesboss/merapi/component");
const async = require("@yesboss/merapi/async");
const cc = require("change-case");
const request = require("request-promise");
const sleep = require("sleep-promise");

class Proxy extends component {
    constructor(config, info, logger) {
        super();
        this.config = config;
        this.logger = logger;

        this.name = info.name;
        this.version = info.version;
        this.api = info.api;
        this.uri = info.uri;
        this.apiVersion = info.apiVersion;

        for (let i in this.api[this.apiVersion]) {
            let methodName = cc.camelCase(this.api[this.apiVersion][i]);
            this[methodName] = this.createProxyMethod(this.api[this.apiVersion][i]);
        }
    }


    createProxyMethod(methodName) {
        let self = this;
        return async(function* () {
            return yield self.callApi(methodName, Array.prototype.slice.call(arguments));
        });
    }

    /**
     * @param {string} methodName 
     */
    *callApi(methodName, args) {
        let self = this;
        let ret = null;
        let uri = "http://" + self.uri + "/api/" + self.apiVersion + "/" + cc.snakeCase(methodName);

        let count = 0;
        let maxCount = self.config.default("max_call_retry", 3);

        const isMethodSafeToRetry =
            methodName !== "retrain" &&
            !methodName.startsWith("create") &&
            !methodName.startsWith("train") &&
            !methodName.startsWith("upsert");

        let retry = isMethodSafeToRetry;

        while (count < maxCount && retry) {
            this.logger.info(`Proxy call [${count}]:`, uri);

            try {
                ret = yield request({
                    uri: uri,
                    method: "POST",
                    body: { params: args, source: self.name },
                    json: true,
                    timeout: self.config.default("proxy.remote_call_timeout", 5000),
                    socketTimeout: self.config.default("proxy.remote_call_timeout", 5000)
                });
            }
            catch (e) {
                this.logger.warn(`Error at proxy call [${count}]`, e);
                retry = e.code !== "ETIMEDOUT";
            }

            retry = !ret && retry;
            if (retry) {
                yield sleep(self.config.default("proxy.sleep_between_call", 2000));
                count++;
            }
        }

        if (ret && ret.status == "ok")
            return ret.result;
        else
            throw new Error(ret ? ret.error : "Unknown error");
    }
}

module.exports = Proxy;
