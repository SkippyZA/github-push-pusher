'use strict';

/**
 * Microservice to fix the repository created_at and pushed_at timestamps from the github push webhook
 */
let rx = require('rx');
let R = require('ramda');
let bodyParser = require('body-parser');
let express = require('express');
let request = require('request');
let moment = require('moment');
let config = require('./config');
let renameKeys = require('./rename-keys');

let app = express();
app.use(bodyParser.json({ limit: '50mb' }));

// time => ISO date string
let isoDate = (t) => moment(t).toISOString();
// headers => github headers
let githubHeaders = R.pick(['x-github-event', 'x-github-delivery']);
// req => boolean
let isPushEvent = R.compose(R.propEq('x-github-event', 'push'), githubHeaders, R.prop('headers'));
// url, options => observable result of post
let postRequestObservable = R.curryN(2, (url, options) => rx.Observable.fromNodeCallback(request.post)(url, options));
// options => observable of post
let sendToLogstash = postRequestObservable(config.LOGSTASH_ENDPOINT);
// Fixes repository dates for repository
let evolveDatesToIso = R.evolve({
  repository: {
    created_at: isoDate,
    pushed_at: isoDate
  }
});

/**
 * Endpoint for github webhook events.
 *
 * This endpoint is only for 'push' events and it's sole purpose is to fix the dates for the repository created_at and
 * pushed_at. For some reason github sends these as unix timestamps and everywhere else these fields are ISO8601
 * timestamps.
 */
app.post('/github/events', (req, res) => {
  console.log('Received request');
  rx.Observable.just(req)
    // We only care about push events
    .filter(isPushEvent)
    .doOnNext(() => console.log('Event is push event'))
    // Take the headers and body from the original request and patch them for logstash
    .map(R.pick(['headers', 'body']))
    .map(R.evolve({
      headers: githubHeaders,
      body: evolveDatesToIso
    }))
    .map(renameKeys({ body: 'json' }))
    // Send the log off to logstash
    .doOnNext(() => console.log('Sending to logstash'))
    .flatMap(sendToLogstash)
    .doOnNext(() => console.log('Request to logstash complete'))
    .subscribe(() => res.send('OK!'), (err) => res.status(400).send(err.message), () => {});
});

/**
 * Start the server
 */
app.listen(config.PORT, () => {
  console.log('Express server listening on port ' + config.PORT);
});
