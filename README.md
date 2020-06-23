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

## License

Apache License 2.0 (undefined)