import {
    login,
    getHomes,
    getDevices,
    changeTemperature
} from './tempco'
import {
    getMQTTConfiguration,
    getTempcoCredentials,
    loadConfiguration,
} from './config'
import * as mqtt from 'mqtt'
import {
    createChangeTemperatureConfigPacket,
} from './packet'


const app = async () => {

    loadConfiguration()

    const mqttClient = mqtt.connect(`mqtt://${getMQTTConfiguration().mqtt_host}`, {
        username: getMQTTConfiguration().mqtt_username,
        password: getMQTTConfiguration().mqtt_password
    })

    mqttClient.on('connect', () => {
        console.log(`Connected to the MQTT broker "${getMQTTConfiguration().mqtt_host}"`)

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
    let smarthome_id = ''

    try {
        token = await login(
            getTempcoCredentials().user_username,
            getTempcoCredentials().user_password,    
        )
    } catch (err) {
        console.warn(err.message)
    }
    
    console.log("YOUR TOKEN IS ", token)

    try {
        smarthome_id = await getHomes(getTempcoCredentials().user_username, token)
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