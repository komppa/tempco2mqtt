/**
 * MQTT Client
 */
import * as mqtt from 'mqtt'
import { getMQTTConfiguration } from './config'


let mqttClient: any

export const connectMQTTBroker = async () => {
    return new Promise((res, _) => {

        mqttClient = mqtt.connect(`${getMQTTConfiguration().mqtt_host}`, {
            username: getMQTTConfiguration().mqtt_username,
            password: getMQTTConfiguration().mqtt_password
        })

        mqttClient.on('connect', () => {
            console.log(`Connected to the MQTT broker "${getMQTTConfiguration().mqtt_host}"`)
    
            // Inform that the tempco2mqtt is up
            mqttClient.publish('tempco2mqtt/availability', 'online')

            // MQTT client is ready
            res(mqttClient)
    
        })

    })
    
}