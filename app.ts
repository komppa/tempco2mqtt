import {
    login,
    getHomes,
    getDevices,
    changeTemperature
} from './tempco'
import { loadConfiguration } from './config'
import * as mqtt from 'mqtt'
import {
    createTemperatureConfigPacket,
    createStateConfigPacket,
    createChangeTemperatureConfigPacket,
} from './packet'






const app = async () => {

    loadConfiguration()

    const userEmail = process.env.USER_EMAIL ?? ''
    const userPassword = process.env.USER_PASSWORD ?? ''
    const mqttHost = process.env.MQTT_HOST ?? ''
    const mqttUsername = process.env.MQTT_USERNAME ?? ''
    const mqttPassword = process.env.MQTT_PASSWORD ?? ''

    const mqttClient = mqtt.connect(`mqtt://${mqttHost}`, {
        username: mqttUsername,
        password: mqttPassword
    })

    mqttClient.on('connect', () => {
        console.log(`Connected to the MQTT broker "${mqttHost}"`)

        // Inform that the tempco2mqtt is up
        mqttClient.publish('tempco2mqtt/availability', 'online')

        let d: any;

        // homeassistant/temperature/313/config
        // d = createTemperatureConfigPacket('313', 'Tempco', 'Touch E3', )

        // homeassistant/switch/313/config
        // d = createStateConfigPacket('313', 'Tempco', 'Touch E3')

        // homeassistant/climate/313/config
        d = createChangeTemperatureConfigPacket('313', 'Tempco', 'Touch E3')

        console.log(d)

        // d = createTemperatureConfigPacket("555", "ker", "a", "temperature", '')
        mqttClient.publish('homeassistant/climate/313/config', JSON.stringify(d), {
            retain: true
        })

    })



    let token = ''

    try {
        token = await login(userEmail, userPassword)
    } catch (err) {
        console.warn(err.message)
    }

    
    console.log("YOUR TOKEN IS ", token)

    let smarthome_id = ''
    try {
        smarthome_id = await getHomes(userEmail, token)
    } catch (err) {
        console.warn(err.message)
    }

    console.log("YOUR SMARTHOME ID IS ", smarthome_id)

    const devices = await getDevices(token, smarthome_id)

    console.log("YOUR DEVICES ARE", devices)
    
    const first_device_id = devices[0].id_device

    console.log("FIRST DEVICE ID IS ", first_device_id)

    const status = await changeTemperature(
        token,
        smarthome_id,
        first_device_id,
        'comfort',
        21   // New temperature in celsius
    )

    console.log(status)

}



app()