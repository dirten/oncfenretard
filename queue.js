const events = require('events')
const kue = require('kue')

events.EventEmitter.prototype._maxListeners = 0

const queue = kue.createQueue({
    redis: process.env.REDIS_URL
})

queue.watchStuckJobs()

module.exports = queue
