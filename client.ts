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

            // MQTT client is ready
            res({
                mqttClient: mqttClient,
                mqttConfiguration: getMQTTConfiguration()
            })
    
        })

    })
    
}