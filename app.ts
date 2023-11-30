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
import pino from 'pino'

import { fakeDevices } from './fake_devices'


// Minimum and maximum allowed temperature to be set by the user in celcius
const MIN_TEMPERATURE = 5
const MAX_TEMPERATURE = 30

interface TempcoCreds {
    token: string
    smarthomeId: string
}

interface Mqtt {
    mqttClient: MqttClient
    mqttConfiguration: {
        mqtt_host: string
        mqtt_username: string
        mqtt_password: string
    }
}

/**
 * Logger
 */
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: 'pino-pretty'
    },
})

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
            // TODO receives our own packet?
            return
        }

        // Get device id from the topic
        // F.ex. (tempco2mqtt/<device_ic>/temperature/set)
        const t = topic.split('/')

        if (t.length !== 4) {
            logger.debug("Received message from MQTT broker but it was not a correct set packet due to incorrect topic structure")
            return
        }
    
        // Grab device ID from the second place
        const [_, deviceId] = t
        
        if (!getDeviceIds(devices).includes(deviceId)) {
            logger.warn(`Cannot change device "${deviceId}" temperature since is is not a valid device (device id not found from the list of devices)`)
            return
        }

        // Is temperaure valid? 
        const temperature = parseInt(data.toString(), 10) || Number.MIN_SAFE_INTEGER
 
        if (
            temperature === Number.MIN_SAFE_INTEGER ||    // Temperature could not be parsed from MQTT packet's payload
            temperature < MIN_TEMPERATURE ||
            temperature > MAX_TEMPERATURE
        ) {
            logger.warn("Could not change temperature because of invalid temperature range or payload is NaN")
            return
        }
        
        const {
            token,
            smarthomeId
        } = tempcoCreds

        if (!mockTempcoApi()) {
            logger.debug(`Changing temperature of device "${deviceId}" to ${temperature}°C via real Tempco API...`)
            changeTemperature(
                token,
                smarthomeId,
                deviceId,
                'comfort',
                temperature
            )
        } else {
            logger.debug(`FAKE: Changing temperature of device "${deviceId}" to ${temperature}°C while mocking...`)
        }

        // TODO verify that the temperature has changed via REST API
        // In any case, inform the new state back to the home assistant
        mqttClient.publish(`tempco2mqtt/${deviceId}/temperature/state`, `${temperature}`)

    })

}

const fetchTemperatureLoop = (mqttClient: MqttClient, tempcoCreds: TempcoCreds) => {

    const { token, smarthomeId } = tempcoCreds

    // Check whether we should use real Tempco API or fake_devices.ts
    if (!mockTempcoApi()) {
        logger.debug("Fetching temperature from Tempco API...")

        getDevices(token, smarthomeId)
            .then((devices: Array<Device>) => {
                devices.forEach((device: Device) => {
                    mqttClient.publish(`tempco2mqtt/${device.id}/temperature/state`, `${fahrenheitToCelsius(Number(device.temperature_air) / 10)}`)
                })
            })
            .catch((error: any) => logger.error("Could not fetch devices since", error.message))

    } else {
        logger.debug("Mocking Tempco API, not fetching real data from Tempco API...")
        fakeDevices.forEach((device: Device) => {
            mqttClient.publish(`tempco2mqtt/${device.id}/temperature/state`, `${fahrenheitToCelsius(Number(device.temperature_air) / 10)}`)
        })
    }

    // After timeout that is defined in configuration.yaml, start this loop again
    setTimeout(() => {
        fetchTemperatureLoop(mqttClient, tempcoCreds)
    }, Math.floor(getTempco2mqttConfiguration().updateInterval * 1000)) // Delay after which the loop is started again
}

const app = async () => {
    
    let token = ''
    let smarthome_id = ''
    let devices: Array<Device>|undefined

    logger.info("Starting tempco2mqtt")

    // Load YAML
    logger.info("Loading configuration file...")
    loadConfiguration()

    // Connect to MQTT broker and send message 'online' to topic 'temco2mqtt/availability'
    // to enable device discovery and state receiving for tempco devices.  
    logger.info("Connecting to MQTT broker...")
    let mqtt = <Mqtt>await connectMQTTBroker()
    const mqttClient = <MqttClient>mqtt.mqttClient
    
    if (mqttClient.connected) {
        logger.info(`Connected to the MQTT broker "${mqtt.mqttConfiguration.mqtt_host}"`)

        // Inform that the tempco2mqtt is up. Atleast for Home Assistant (discovery) since it wants to know
        mqttClient.publish('tempco2mqtt/availability', 'online')
    }


    try {
        if (!mockTempcoApi()) {
            logger.info("Logging in to Tempco API to get token...")
            token = await login(
                getTempcoCredentials().user_username,
                getTempcoCredentials().user_password,    
            )    
        } else {
            logger.info("Mocking Tempco API, not logging in to Tempco API to get token...")
        }
        
    } catch (err) {
        logger.error("Could not log in to Tempco API. Check your credentials. Error:", err.message)
    }
    
    try {
        if (!mockTempcoApi()) {
            logger.info("Getting smarthome id...")
            smarthome_id = await getHomes(getTempcoCredentials().user_username, token)
            logger.info("Your smarthome id is:", smarthome_id)
        }
    } catch (err) {
        logger.error("Could not get smarthome id. Error:", err.message)
    }

    if (!mockTempcoApi()) {
        logger.info(`Fetching devices from Tempco API for smarthome "${smarthome_id}"...`)
        devices = await getDevices(token, smarthome_id)
    } else {
        logger.info("Mocking Tempco API, not fetching real devices. Using fake devices.")
        devices = fakeDevices
    }


    // Add listener for tempco2mqtt that listens for temperature changes from the Home Assistant
    logger.info("Attaching listener for tempco2mqtt to get temperature change requests from MQTT...")
    addListenerForTempco(mqttClient, { token, smarthomeId: smarthome_id }, devices)

    // Start infinite loop for checking the temperature from the smarthome
    // But wait some amount of time before doing so on the startup (10s). // TODO Why?
    setTimeout(() => fetchTemperatureLoop(mqttClient, { token, smarthomeId: smarthome_id }), 10 * 1000)
    
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
        logger.error("Could not fetch devices since", err.authenticationFail ? "auhentication failed" : "unknown reason")
    }

}


app()