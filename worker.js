const _ = require('lodash')
const moment = require('moment')
const crypto = require('crypto')
const mykue = require('./mykue')
const services = require('./services')
const bot = require('./bot')

mykue.queue.process('watch', 128, (job, done) => {
    const jobStartDateTime = moment.utc()

    const {fromStationId, toStationId, userId, timeId} = job.data
    job.log(`start watching ${fromStationId}, ${toStationId}, ${userId}, ${timeId}`)

    services.getStations().then(stations => {
        const fromStation = _.find(stations, {id: fromStationId})
        const toStation = _.find(stations, {id: toStationId})

        let previousTime = null
        const check = setInterval(() => {
            const now = moment.utc()
            job.log(`check time ${now.toISOString()}`)

            services.getTimes(fromStationId, toStationId, now).then(times => {
                // TODO: better progress
                job.progress(parseInt(now.format('x')) - parseInt(jobStartDateTime.format('x')), 24 * 3600 * 1000)

                const newTime = _.find(times, {
                    id: timeId
                })
                
                if(!newTime) {
                    job.log(`end watching`)
                    clearInterval(check)
                    return done()
                }
                
                if(previousTime && !_.isEqual(previousTime.delay, newTime.delay)) {
                    job.log(`sending delay alert`)
                    bot.sendMessage(userId, {
                        text: `Train ${fromStation.name.french} ⟶ ${toStation.name.french} ` +
                            `retard ${newTime.delay.hours > 0 ? `${newTime.delay.hours}h`: ''}${newTime.delay.minutes}m ` +
                            `nouvelle depart ${newTime.actualArrivalDateTime.format('HH:mm')}`
                    }, (err, info) => {
                        if(err) {
                            return job.log(`error sending delay alert ${JSON.stringify(err)}`)
                        }
                        job.log(`sent delay alert`)
                    })
                }

                previousTime = newTime
            
            })
        }, 1000)
    })
})
