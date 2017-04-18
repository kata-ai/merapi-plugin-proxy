# merapi-plugin-proxy
Pluginable proxy for Merapi to enable it to do remote call other merapi services

## Installation
Install using npm:
```
npm install @yesboss/merapi-plugin-proxy --save
```

## Configuration

```
{
    ....
    "plugins": [
        "proxy@yesboss",
        .....
    ],
    components: {
        proxyServiceNameV1: { type: "proxy", uri: "http://localhost:5000", version: "v1" },
        proxyServiceNameV2: { type: "proxy", uri: "http://localhost:5000", version: "v2" }
    }
}
```
## Additional Configuration (optional)
```
{
    "proxy": {
        "max_proxy_retry": 100,
        "remote_call_timeout": 5000
    }    
}
```
## Usage 
Manual
```
let proxyServiceV1 = yield container.resolve("proxyServiceNameV1");
// call the proxy
let response = yield proxyServiceV1.<functionName>(param1, param2);
```

Automatic injection
```
"use strict";
const Component = require("@yesboss/merapi/component");

module.exports = class FirstComponent extends Component {
    constructor(logger, proxyServiceNameV2) {
        super();
        this.proxyServiceV2 = proxyServiceNameV2;
        this.logger = logger;
    }
    *callProxy() {
        this.logger.info("execute proxy call");
        let res = yield this.proxyServiceV2.<functionName>(param1, param2);
        return res;
    }
};
```

## Copyright
Copyright (c) 2015-2016 YesBoss Group. All rights reserved.
We plan to open source this later in 2016, however please do not share
this before we officially release this as open source.

## Contributors
Initial Author: Roni Kurniawan