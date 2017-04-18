"use strict";

const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");

const merapi = require("merapi");
const {Component, async:co} = require("merapi");

const sleep = require("sleep-promise");

describe("merapi-plugin-proxy unit testing", function () {
    this.timeout(10000);

    let container = {};
    let proxyManager = null;
    let service = null;
    let self = this;

    let proxyVersion1 = null;
    let proxyVersion2 = null;

    before(co(function* () {
        // arrange merapi
        container = merapi({
            basepath: __dirname,
            config: {
                name: "some-service-name",
                version: "1.0.0",
                main: "mainCom",
                components: {
                    proxyVersion1: { type: "proxy", uri: "http://localhost:5000", version: "v1" },
                    proxyVersion2: { type: "proxy", uri: "http://localhost:5000", version: "v2" }
                },
                service: {
                    "host": "localhost",
                    "port": 5000,
                    "clusterHostName": "service-test",
                    "clusterPort": 5000,
                    "redisEventHub": {
                        "host": "redis.yesboss-testing.8de04329.svc.dockerapp.io",
                        "port": 6379
                    },
                    "api": {
                        "v1": {
                            "getCustomer": "mainCom.getCustomer",
                            "createCustomer": "mainCom.createCustomer"
                        },
                        "v2": {
                            "getCustomer": "mainCom.getCustomerV2",
                            "createCustomer": "mainCom.createCustomerV2",
                            "sumTwoValues": "mainCom.sumTwoValues"
                        }
                    }
                },
                models: {},
                proxy: {
                    max_proxy_retry: 100,
                    remote_call_timeout: 5000,
                }
            }
        });

        container.registerPlugin("proxy", require("../index.js")(container));
        container.registerPlugin("service", require("merapi-plugin-service")(container));

        container.register("mainCom", class MainCom extends Component {
            constructor(logger) {
                super();
                this.logger = logger;
            }

            getCustomer(customerId) {
                return customerId;
            }

            createCustomer(customerData) {
                return customerData;
            }

            getCustomerV2(customerId) {
                return customerId;
            }

            createCustomerV2(customerData) {
                return customerData;
            }

            sumTwoValues(value1, value2) {
                return (value1 + value2);
            }

            start() {
                //this.logger.info("start");
            }
        });

        // start merapi
        container.start();

        sleep(10);
        self.timeout(1000);
    }));

    it("service should get initialized", co(function* () {
        service = yield container.resolve("service");
        expect(service).to.not.equal(null);
    }));


    it("proxyManager should get initialized", co(function* () {
        proxyManager = yield container.resolve("proxyManager");
        expect(proxyManager).to.not.equal(null);
    }));

    it("GET http://localhost:5000/info should return API correctlly", function (done) {
        let expectedApi = {
            v1: ["getCustomer", "createCustomer"],
            v2: ["getCustomer", "createCustomer", "sumTwoValues"]
        };
        this.timeout(4000);
        request(service._express).get("/info")
            .set("Accept", "application/json")
            .expect(function (res) {
                res.body = { api: res.body.api };
            }).expect(200, { api: expectedApi }, done);
    });

    it("should be able to resolve 'proxyVersion1'", co(function* () {
        self.timeout(3000);
        proxyVersion1 = yield container.resolve("proxyVersion1");
        expect(proxyVersion1).to.not.equal(null);
    }));

    it("should be able to call all methods of the 'proxyVersion1'", co(function* () {
        let customerId = 1;
        let customerData = { name: "customer name", level: 3 };

        let actualCustomerId = yield proxyVersion1.getCustomer(customerId);
        let actualCustomerData = yield proxyVersion1.createCustomer(customerData);

        expect(actualCustomerId).to.equal(customerId);
        expect(JSON.stringify(actualCustomerData)).to.equal(JSON.stringify(customerData));
    }));


    it("should be able to resolve 'proxyVersion2'", co(function* () {
        self.timeout(3000);
        proxyVersion2 = yield container.resolve("proxyVersion2");
        expect(proxyVersion2).to.not.equal(null);
    }));

    it("should be able to call all methods of the 'proxyVersion2'", co(function* () {
        let customerId = 1;
        let customerData = { name: "customer name", level: 3 };

        let actualCustomerId = yield proxyVersion2.getCustomer(customerId);
        let actualCustomerData = yield proxyVersion2.createCustomer(customerData);
        let actualSummedValue = yield proxyVersion2.sumTwoValues(8, 2);

        expect(actualCustomerId).to.equal(customerId);
        expect(JSON.stringify(actualCustomerData)).to.equal(JSON.stringify(customerData));
        expect(actualSummedValue).to.equal(10);
    }));
});




