import {
    login,
    getHomes,
    getDevices,
    changeTemperature
} from './tempco'
import {
    getTempcoCredentials,
    loadConfiguration,
    mockTempcoApi,
    getTempco2mqttConfiguration,
} from './config'
import {
    createChangeTemperatureConfigPacket,
} from './packet'
import { Device } from './tempco.d'
import { connectMQTTBroker } from './client'
import { MqttClient } from 'mqtt'
import { fahrenheitToCelsius } from './modes'

import { fakeDevices } from './fake_devices'


const MIN_TEMPERATURE = 5
const MAX_TEMPERATURE = 30

interface TempcoCreds {
    token: string
    smarthomeId: string
}

/**
 * Array of device ids for an array of devices
 * @param devices Device array 
 * @returns 
 */
const getDeviceIds = (devices: Array<Device>): Array<string> => devices.map((d: Device) => d.id)

/**
 * Add listener for a tempco2mqtt
 * temperature is being changed from the Home Assistant dashboard
 * @param mqttClient mqtt client that is being used to track incoming messages
 * @param devices Array of currently available/valid devices
 */
const addListenerForTempco = (mqttClient: MqttClient, tempcoCreds: TempcoCreds, devices: Array<Device>) => {

    // Subscribe whole tempco2mqtt topic
    mqttClient.subscribe(`tempco2mqtt/#`)

    mqttClient.on('message', (topic: string, data: Buffer) => {

        // Check whether the packet is set packet that wants to change
        // temperature of the heater
        if (!topic.includes('/set')) {
            return
        }

        // Get device id from the topic
        // F.ex. (tempco2mqtt/<device_ic>/temperature/set)
        const t = topic.split('/')

        if (t.length !== 4) {
            return
        }
    
        // Grab device ID from the second place
        const [_, deviceId] = t
        
        if (!getDeviceIds(devices).includes(deviceId)) {
            console.log(`Cannot change device "${deviceId}" temperature since is is not a valid device`)
            return
        }

        // Is temperaure valid? 
        const temperature = parseInt(data.toString(), 10) || Number.MIN_SAFE_INTEGER
 
        if (
            temperature === Number.MIN_SAFE_INTEGER ||    // Temperature could not be parsed from MQTT packet's payload
            temperature < MIN_TEMPERATURE ||
            temperature > MAX_TEMPERATURE
        ) {
            console.log("Could not change temperature because of invalid temperature range or payload is NaN")
            return
        }
        
        const {
            token,
            smarthomeId
        } = tempcoCreds

        if (!mockTempcoApi()) {
            changeTemperature(
                token,
                smarthomeId,
                deviceId,
                'comfort',
                temperature
            )
        }

        // TODO verify that the temperature has changed via REST API
        // In any case, inform the new state back to the home assistant
        mqttClient.publish(`tempco2mqtt/${deviceId}/temperature/state`, `${temperature}`)

    })

}

const fetchTemperatureLoop = (mqttClient: MqttClient, tempcoCreds: TempcoCreds) => {

    const { token, smarthomeId } = tempcoCreds

    getDevices(token, smarthomeId)
        .then((devices: Array<Device>) => {
            devices.forEach((device: Device) => {
                mqttClient.publish(`tempco2mqtt/${device.id}/temperature/state`, `${fahrenheitToCelsius(Number(device.temperature_air) / 10)}`)
            })
        })

    // After timeout that is defined in configuration.yaml, start this loop again
    setTimeout(() => {
        fetchTemperatureLoop(mqttClient, tempcoCreds)
    }, Math.floor(
        getTempco2mqttConfiguration().updateInterval * 1000
    ))
}

const app = async () => {
    
    let token = ''
    let smarthome_id = ''
    let devices: Array<Device>|undefined

    // Load YAML
    loadConfiguration()

    // Connect to MQTT broker and send message 'online' to topic 'temco2mqtt/availability'
    // to enable device discovery and state receiving for tempco devices.  
    let mqttClient = <MqttClient>await connectMQTTBroker()

    try {
        if (!mockTempcoApi()) {
            token = await login(
                getTempcoCredentials().user_username,
                getTempcoCredentials().user_password,    
            )    
        }
        
    } catch (err) {
        console.warn(err.message)
    }
    
    try {
        if (!mockTempcoApi()) {
            smarthome_id = await getHomes(getTempcoCredentials().user_username, token)
        }
    } catch (err) {
        console.warn(err.message)
    }

    if (mockTempcoApi()) {
        devices = fakeDevices
    } else {
        devices = await getDevices(token, smarthome_id)
    }


    // Add listener for tempco2mqtt 
    addListenerForTempco(mqttClient, { token, smarthomeId: smarthome_id }, devices)

    // Start infinite loop for checking the temperature from the smarthome
    // But wait some amount of time before doing so on the startup (60s)
    setTimeout(() => fetchTemperatureLoop(mqttClient, { token, smarthomeId: smarthome_id }), 30 * 1000)
    
    try {

        devices.forEach((device: Device) => {
            let d = createChangeTemperatureConfigPacket(`${device.id}`, `${device.label_interface}`, 'Yali', 'Digital')
    
            // Tell that there are device like this
            mqttClient.publish(`homeassistant/climate/${device.id}/config`, JSON.stringify(d), {
                retain: true
            })

            // After one second of discovery pakcet, tell the temperature for the device
            setTimeout(() => {
                // Tell the temperature for the heater
                mqttClient.publish(`tempco2mqtt/${device.id}/temperature/state`, `${fahrenheitToCelsius(Number(device.temperature_air) / 10)}`)
            }, 1000)
            
        })


    } catch (err: any) {
        console.log("Could not fetch devices since", err.authenticationFail ? "auhentication failed" : "unknown reason")
    }

}


app()