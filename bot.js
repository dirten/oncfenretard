const Bot = require('messenger-bot')
const services = require('./services')

const bot = new Bot({
    token: 'EAAFLCDklkZCgBAK5Hz8a1fa7U1mzJuAY6gmUzelckvlZCnKm7Uk9yal81E9UvrSB3GHpLiLC0aPhjaY8xp2jVF78vf6tpRasPny1byLVeawKZC9GOmeuJEgkEPkuxyrVl7UA1Vnw42sa1lBi2aCN3BpZArnUdxYp3fUfXmeWZAwZDZD',
    verify: '1234567890',
    app_secret: '87d3ec716044a28f6ba530cab7486207'
})

bot.on('error', (err) => {
    console.error(new Date(), 'bot error occured', err.message)
})

bot.on('referral', (payload, reply, actions) => {
    const { sender: { id: userId }, referral: { ref } } = payload

    actions.markRead()
    actions.setTyping(true)

    if(ref) {

        const { fromStationId, toStationId, timeId } = JSON.parse(ref)

        console.log(new Date(), 'subscribing', fromStationId, toStationId, userId, timeId)
        
        services.subscribe(fromStationId, toStationId, userId, timeId).then(([job, created]) => {
        
            const { id: jobId } = job || { }
            
            actions.setTyping(false)

            if(created) {
                console.log(new Date(), 'subscribed', jobId)
                reply({
                    text: `we're tracking your train!`
                })
            } else {
                console.log(new Date(), 'already subscribed', jobId)
                reply({
                    text: `already subscribed`
                })
            }
        
        })

    } else {
        
        reply({ text: `sorry I don't understand you!`})
    
    }
})

// bot.on('message', (payload, reply) => {
//     let text = payload.message.text
  
//     bot.getProfile(payload.sender.id, (err, profile) => {
//       if (err) throw err
  
//       reply({ text }, (err) => {
//         if (err) throw err
  
//         console.log(`Echoed back to ${profile.first_name} ${profile.last_name}: ${text}`)
//       })
//     })
// })

// bot.on('authentication', (payload, reply, actions) => {
//     console.log('authentication', payload)
//     reply({ text: 'thanks!'}, (err, info) => {})
// })

// bot.on('postback', (payload, reply, actions) => {
//     console.log('postback', payload)
//     if (payload.postback.payload === 'GET_STARTED') {
//         if(payload.postback.referral) {
//             payload.referral = payload.postback.referral
//             delete payload.postback
//             console.log(`bot._handleEvent('referral', payload)`)
//             //bot._handleEvent('referral', payload)
//         }
//     }
// })

module.exports = bot
