const _ = require('lodash')
const moment = require('moment')
const crypto = require('crypto')
const mykue = require('./mykue')
const services = require('./services')

mykue.queue.process('watch', 3, (job, done) => {
    console.log('tracking', job.data)
    
    const {fromStationId, toStationId, userId, timeId} = job.data

    let previousTime = null
    setInterval(() => {
        const now = moment.utc()
        services.getTimes(fromStationId, toStationId, now).then(times => {
            const newTime = _.find(times, {
                id: timeId
            })
            if(previousTime && !_.isEqual(previousTime.delay, newTime.delay)) {
                console.log('delay', userId, previousTime.delay, newTime.delay)
            }
            previousTime = newTime
        })
    }, 1000)
})
