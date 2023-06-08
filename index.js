/*
 * Copyright 2023 Splunk Inc.
 * Author: Philippe Tang <ptang@splunk.com>
 */

"use strict";

const AWS = require("aws-sdk");
const axios = require("axios");
const crypto = require("crypto");

exports.handler = async function (event, context) {
    // Parse request headers and body
    const headers = event.headers;
    const body = JSON.parse(event.body);

    // Check if Zoom Webhook request contains the required headers
    if (!headers["x-zm-request-timestamp"] || !headers["x-zm-signature"]) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad Request" }),
        };
    }

    // Retrieve variables from AWS SSM
    var zoomSecretToken = "/zoom/secret_token";
    var splunkHECUrl = "/splunk/hec_url";
    var splunkHECPort = "/splunk/hec_port";
    var splunkHECToken = "/splunk/hec_token";
    var splunkHECIndex = "/splunk/hec_index";

    var params = {
        Names: [
            zoomSecretToken,
            splunkHECUrl,
            splunkHECPort,
            splunkHECToken,
            splunkHECIndex,
        ],
        WithDecryption: true,
    };

    let ssm = new AWS.SSM();
    var ssmParameters;

    try {
        const response = await ssm.getParameters(params).promise();
        ssmParameters = response.Parameters.reduce((obj, parameter) => {
            obj[parameter.Name] = parameter.Value;
            return obj;
        }, {});
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }

    // Handle Zoom Webhook Validation Request
    if (body.event == "endpoint.url_validation") {
        const zoomPlainToken = body.payload.plainToken;
        const hashForValidate = crypto
            .createHmac("sha256", ssmParameters[zoomSecretToken])
            .update(zoomPlainToken)
            .digest("hex");

        return {
            statusCode: 200,
            body: JSON.stringify({
                plainToken: zoomPlainToken,
                encryptedToken: hashForValidate,
            }),
        };
    }

    // Verify Zoom Webhook Event
    const message = `v0:${headers["x-zm-request-timestamp"]}:${JSON.stringify(
        body
    )}`;
    const zoomSignature = headers["x-zm-signature"];
    const hashForVerify = crypto
        .createHmac("sha256", ssmParameters[zoomSecretToken])
        .update(message)
        .digest("hex");
    const signature = `v0=${hashForVerify}`;
    if (zoomSignature != signature) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: "Forbidden" }),
        };
    }

    // Forward HTTP request to Splunk HEC via /services/collector/event
    // Prepare HEC Payload
    const splunkHECPayload = {
        time: body.event_ts,
        host: event.requestContext.identity.sourceIp,
        source: `aws:api:gw:zoom:${body.event}`,
        sourcetype: "zoom:webhook",
        index: ssmParameters[splunkHECIndex],
        event: body,
    };

    // HTTP Request Options
    const options = {
        method: "POST",
        headers: {
            Authorization: `Splunk ${ssmParameters[splunkHECToken]}`,
        },
        data: JSON.stringify(splunkHECPayload),
    };

    // Ensure the provided HEC Url uses https
    const splunkHECBaseUrl = (url) => {
        if (!/^https:\/\//i.test(url)) {
            url = `https://${url}`;
        }
        if (url.startsWith("http://")) {
            url = `https://${url.substring(7)}`;
        }
        return url;
    };

    // HEC Event Endpoint
    const splunkHECEventEndpoint = "services/collector/event";

    // Sanitize HEC Url
    const splunkHECFullUrl = new URL(
        `${splunkHECBaseUrl(ssmParameters[splunkHECUrl])}:${
            ssmParameters[splunkHECPort]
        }/${splunkHECEventEndpoint}`
    );

    // Forward Webhook HTTP Request to Splunk HEC
    try {
        const response = await axios(splunkHECFullUrl.href, options);
        return {
            statusCode: response.status,
            body: JSON.stringify(response.data),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
