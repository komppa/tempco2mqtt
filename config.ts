import * as dotenv from 'dotenv'
import * as YAML from 'yaml'
import * as fs from 'fs'


let configuration: any

/**
 * Load the configuration file from the data folder
 */
export const loadConfiguration = () => {
    const f = fs.readFileSync(
        process.env.PRODUCTION === "1" ? 'configuration.yaml' : 'configuration.yaml.local',
        'utf8'
    )
    configuration = YAML.parse(f)
}

/**
 * Get credentials from the saved yaml
 */
export const getTempcoCredentials = () => ({
    user_username: configuration.tempco.username,
    user_password: configuration.tempco.password,
})

export const getMQTTConfiguration = () => ({
    mqtt_host: configuration.mqtt.host.includes('mqtt://')
        ? configuration.mqtt.host
        : `mqtt://${configuration.mqtt.host}`,
    mqtt_username: configuration.mqtt.username,
    mqtt_password: configuration.mqtt.password,
})
