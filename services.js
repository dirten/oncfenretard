const axios = require('axios')
const moment = require('moment-timezone')
const crypto = require('crypto')
const url = require('url')

const client = axios.create({
    baseURL: 'http://41.137.246.220/api'
})

client.interceptors.request.use(
    (config) => {
        const parsedUrl = url.parse(config.url)
        config.params = {
            ...config.params,
            hash: crypto.createHash('sha512').update(parsedUrl.pathname.replace('/', '') + '011CFes***@hchmd').digest('hex')
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

module.exports = {
    getStations() {
        return client
            .get('/gares')
            .then(response => response.data.map(station => ({
                id: station.CodeGare,
                name: {
                    french: station.NomGareFr,
                    arabic: station.NomGareAr
                }
            })))
    },
    getTimes(fromStationId, toStationId, departureDateTime = moment.utc()) {
        // monkey-patch daylight saving shift
        if(moment().isDST()) {
            departureDateTime.add(1, 'hour')
        }
        console.log('departureDateTime.toISOString()', departureDateTime.toISOString())
        return client
            .get('/trainnow/search', {
                params: {
                    gareDepart: fromStationId,
                    gareArrive: toStationId,
                    date: departureDateTime.toISOString()
                }
            })
            .then(response => response.data.map(time => {
                const baseTime = moment.utc(time.DateDepart)

                let plannedDepartureTime = actualDepartureTime =  moment.utc(time.HeureDepart, 'HH:mm')
                let plannedArrivalTime = actualArrivalTime =  moment.utc(time.HeureArrive, 'HH:mm')
                
                // console.log('time.RetardReal', time.RetardReal)
                // monkey-patch their bug!
                // console.log(!moment.utc(time.HeureArriveReel, 'HH:mm').isValid(), (time.RetardMinutes !== 0 || time.RetardMinutes !== -1), time.HeureArriveReel, time.RetardMinutes)
                // if (!moment.utc(time.HeureArriveReel, 'HH:mm').isValid() && time.RetardMinutes !== -1 && time.RetardMinutes !== 0) {
                //     time.RetardReal = (24 * 60 * 60) - time.RetardReal
                //     time.RetardMinutes = Math.floor(time.RetardReal / 60)
                // }
                // console.log('time.RetardReal', time.RetardReal)

                if (time.RetardReal > 0) {
                    actualDepartureTime = moment.utc(actualDepartureTime).add(time.RetardReal, 'seconds')
                    actualArrivalTime = moment.utc(actualArrivalTime).add(time.RetardReal, 'seconds')
                }

                if (actualArrivalTime.diff(actualDepartureTime, 'minutes') < 0) {
                    actualArrivalTime.add(1, 'day')
                }

                // train in deparature station
                const trains = [{
                    station: {
                        id: fromStationId
                    },
                    type: time.Train.Gamme
                }]

                if (time.Correspondnaces) {
                    time.Correspondnaces.forEach(correspondnace => {
                        trains.push({
                            station: {
                                id: `${correspondnace.CodeGare}0000` // don't ask me why!
                            },
                            type: correspondnace.GammeTrain
                        })
                    })
                }

                // trip info
                const tripDuration = actualArrivalTime.diff(actualDepartureTime, 'minutes')

                return {
                    isDelayed: time.RetardMinutes > 0,
                    trip: {
                        distance: time.DistanceGD_DA,
                        duration: {
                            hours: Math.floor(tripDuration / 60),
                            minutes: tripDuration % 60
                        } 
                    },
                    delay: {
                        hours: time.RetardMinutes > 0 ? Math.floor(time.RetardMinutes / 60) : 0, 
                        minutes: time.RetardMinutes > 0 ? time.RetardMinutes % 60 : 0
                    },
                    plannedDepartureDateTime: moment.utc(baseTime).set({hour: plannedDepartureTime.get('hour'), minute: plannedDepartureTime.get('minute')}),
                    plannedArrivalDateTime: moment.utc(baseTime).set({hour: plannedArrivalTime.get('hour'), minute: plannedArrivalTime.get('minute')}),
                    actualDepartureDateTime: moment.utc(baseTime).set({hour: actualDepartureTime.get('hour'), minute: actualDepartureTime.get('minute')}),
                    actualArrivalDateTime: moment.utc(baseTime).set({hour: actualArrivalTime.get('hour'), minute: actualArrivalTime.get('minute')}),
                    trains: trains
                }  
            }).filter(time => {
                // monkey-patch expired times related to daylight saving shift
                const actualDepartureDateTime = moment.utc(time.actualDepartureDateTime)
                if(moment().isDST()) {
                    actualDepartureDateTime.add(1, 'hour')
                }
                return departureDateTime.diff(actualDepartureDateTime, 'minutes') <= 0
            }))
    }
}
// module.exports.getStations().then(console.log)
// module.exports.getTimes('2290000', '2510000', moment('2017-10-14T13:56:08.470Z')).then(console.log).catch(console.log)
