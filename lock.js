const client = require('redis').createClient(process.env.REDIS_URL)
const redislock = require('redislock')

const lock = redislock.createLock(client, {
    timeout: 24 * 3600 * 1000,
    retries: 1,
    delay: 1000
})

module.exports = lock
