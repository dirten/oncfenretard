const _ = require('lodash')
const moment = require('moment')
const redislock = require('redislock')
const queue = require('./queue')
const services = require('./services')
const lock = require('./lock')
const backend = require('./backend')

queue.process('watch', process.env.WATCH_CONCURRENCY || 128, async (job, done) => {
    const {timeId} = job.data
    try{
        await lock.acquire(timeId)
    } catch (ex) {
        return done(ex)
    }
    let previousTime = null
    try {
        const jobStartDateTime = moment.utc()
        previousTime = await services.getTime(timeId)
        if(!previousTime) {
            console.log(`no previous time`)
            return done(new ReferenceError(`unable to query time ${timeId}`))
        }
    } catch (ex) {
        console.log('releasing lock')
        await lock.release()
        return done(ex)
    }
    const checkHandler = setTimeout(async function check () {
        try {
            const now = moment.utc()
            console.log(`check ${now.toISOString()}`)

            const newTime = await services.getTime(timeId)

            if(previousTime && !_.isEqual(previousTime.delay, newTime.delay)) {
                console.log(`sending delay alert ${timeId}`)
                backend.io.sockets.in(timeId).emit('delay', {
                    previousTime,
                    newTime
                })
            }

            if(now < newTime.actualDepartureDateTime) {
                console.log(`end watching`)
                clearTimeout(checkHandler)
                await lock.release()
                return done()
            } else {
                previousTime = newTime
                setTimeout(check, process.env.WATCH_INTERVAL || 1000)
            }
        } catch (ex) {
            console.log('releasing lock')
            await lock.release()
            return done(ex)
        }
    }, process.env.WATCH_INTERVAL || 1000)
})

async function gracefullShutdown(sig) {
    console.log('terminating')
    queue.shutdown( 5000, async err => {
        // TODO: release locks by deleting redis keys
        console.log('shutdown')
        process.exit(0)
    })
}
process.once('SIGINT', gracefullShutdown)
process.once('SIGTERM', gracefullShutdown)
