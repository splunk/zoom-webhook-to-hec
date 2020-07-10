# Zoom-Webhook-to-Splunk-HTTP-Event-Collector Serverless Application for AWS

This application allows receiving, validating and sending the Zoom Video Conferencing Webhook events to Splunk through HTTP Event Collector (HEC).

## Technicality

This application will create a lambda function, with an API Gateway trigger. When deployed, you can use the API Gateway to send real-time data from the Zoom Video Conferencing Webhook into Splunk. 
- The lambda function is an Authorizer that validates the incoming Zoom Webhook Payload using the Verification Token before passing through to the API Gateway
- The API Gateway leverages the first lambda function to validate the incoming Zoom Webhook before proxying it to Splunk via HTTP Event Collector.

## Serverless Application Parameters

The following parameters will be required during the setup and installation of the Serverless Application:

- Zoom Webhook [Verification Token](https://marketplace.zoom.us/docs/guides/build/webhook-only-app#features-2)
- Splunk HTTP Event Collector (HEC) URL (e.g: `https://your.server.com`)
- Splunk HTTP Event Collector (HEC) Port (e.g: `443`)
- Splunk HTTP Event Collector (HEC) Token
- Splunk Index (e.g: `zoom`)

## Example URL that you'd provide in the Zoom Webhook Application Event Subscription:

`https://<your_api_gateway_url>/Prod/zoom-to-hec`

## Data Flow Diagram

![Zoom Webhook to Splunk HEC Data Flow Diagram](./media/zoom-webhook-to-hec-dfd.png)

1. Zoom Webhook POST HTTP Request to AWS API Gateway  endpoint
2. Zoom Webhook HTTP Request Header contains Verification Token and is validated via the AWS Lambda Authorizer 
3. AWS Lambda Authorizer checks for Zoom Verification Token match, if there is a MATCH, proceed , otherwise, DROP the HTTP request
4. The Zoom Webhook HTTP Body payload is remapped via the AWS API Gateway into a Splunk HTTP Event Collector (HEC) payload (index, source, sourcetype, event, time) 
5. The AWS API Gateway forwards the final remapped payload through Splunk HTTP Event Collector (HEC )
6. The Splunk HTTP Event Collector will respond back with an HTTP Status Code and this will be passthrough the AWS API Gateway and return it to Zoom (Zoom Webhook Call Logs rely on the responses to ensure the Webhook Event has been transmitted successfully, or it has to retry)

## License

Copyright 2020 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
