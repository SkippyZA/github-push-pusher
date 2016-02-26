/**
 * Application configuration
 */
module.exports = {
  PORT: process.env.GPP_PORT || 3000,
  LOGSTASH_ENDPOINT: process.env.GPP_LOGSTASH_ENDPOINT || 'http://localhost:5100'
};