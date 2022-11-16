import {
    login,
    getHomes,
    getDevices,
    changeTemperature
} from './tempco'
import {
    getTempcoCredentials,
    loadConfiguration,
} from './config'
import {
    createChangeTemperatureConfigPacket,
} from './packet'
import { Device } from './tempco.d'
import { connectMQTTBroker } from './client'
import { MqttClient } from 'mqtt'


const app = async () => {
    
    let token = ''
    let smarthome_id = ''
    let devices: Array<Device>|undefined

    // Load YAML
    loadConfiguration()

    let mqttClient = <MqttClient>await connectMQTTBroker()

    try {
        token = await login(
            getTempcoCredentials().user_username,
            getTempcoCredentials().user_password,    
        )
    } catch (err) {
        console.warn(err.message)
    }
    
    try {
        smarthome_id = await getHomes(getTempcoCredentials().user_username, token)
    } catch (err) {
        console.warn(err.message)
    }

    try {
        devices = await getDevices(token, smarthome_id)
        
        devices.forEach((device: Device) => {
            let d = createChangeTemperatureConfigPacket(`${device.id}`, 'Yali', 'Digital')
    
            // d = createTemperatureConfigPacket("555", "ker", "a", "temperature", '')
            mqttClient.publish(`homeassistant/climate/${device.id}/config`, JSON.stringify(d), {
                retain: true
            })
        })


    } catch (err: any) {
        console.log("Could not fetch devices since", err.authenticationFail ? "auhentication failed" : "unknown reason")
    }

    
    /*
    const status = await changeTemperature(
        token,
        smarthome_id,
        first_device_id,
        'comfort',
        21   // New temperature in celsius
    )

    console.log(status)
    */

}


app()