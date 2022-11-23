import { ConfigPacket } from './packet.d'


/**
 * Create packet that indicates that the tempco2mqtt has started
 * @returns Online packet payload
 */
export const createOnlinePakcet = () => 'online'

/**
 * Create config / discovery packet for temperature
 * @param deviceId 
 * @param manufacturerName 
 * @param modelName 
 * @returns ConfigPacket JSON
 */
export const createTemperatureConfigPacket = (
    deviceId: string,
    manufacturerName: string,
    modelName: string,
    unitOfMeasurement: string = '°C'
): ConfigPacket => ({
    availability: [
        {
            topic: "tempco2mqtt/availability",
        }
    ],
    device: {
        identifiers: [
            `tempco2mqtt_${deviceId}`,
        ],
        manufacturer: manufacturerName,
        model: modelName,
        name: `${deviceId}`,
    },
    device_class: 'temperature',
    enabled_by_default: true,
    json_attributes_topic: `tempco2mqtt/${deviceId}`,
    name: `${deviceId} temperature`,
    state_class: "measurement",
    state_topic: `tempco2mqtt/${deviceId}`,
    unique_id: `${deviceId}_temperature_tempco2mqtt`,
    unit_of_measurement: unitOfMeasurement,
    value_template: `{{ value_json.temperature }}`,
    platform: "mqtt"
})

/**
 * Create config / discovery packet for on/off switch
 * @param deviceId 
 * @param manufacturerName 
 * @param modelName 
 * @returns 
 */
export const createStateConfigPacket = (
    deviceId: string,
    manufacturerName: string,
    modelName: string,
) => ({
    availability: [
        {
            topic: "tempco2mqtt/availability",
        }
    ],
    device: {
        identifiers: [
            `tempco2mqtt_${deviceId}`,
        ],
        manufacturer: manufacturerName,
        model: modelName,
        name: `${deviceId}`,
    },
    device_class: 'switch',
    enabled_by_default: true,
    name: `${deviceId} switch`,
    
    state_topic: `tempco2mqtt/${deviceId}/switch/state`,
    command_topic: `tempco2mqtt/${deviceId}/switch/set`,

    unique_id: `${deviceId}_switch_tempco2mqtt`,
    platform: 'mqtt',
})

/**
 * Create config / discovery packet for temperature control
 * @param deviceId
 * @param manufacturerName
 * @param modelName
 */
export const createChangeTemperatureConfigPacket = (
    deviceId: string,
    friendlyName: string,
    manufacturerName: string,
    modelName: string,
) => ({
    availability: [
        {
            topic: "tempco2mqtt/availability",
        }
    ],
    device: {
        identifiers: [
            `tempco2mqtt_${deviceId}`,
        ],
        manufacturer: manufacturerName,
        model: modelName,
        name: `${deviceId}-${friendlyName}`,
    },
    device_class: 'climate',
    enabled_by_default: true,
    name: `${deviceId}-${friendlyName}-climate`,
    
    // Move to createStateConfigPacket
    mode_state_topic: `tempco2mqtt/${deviceId}/climate/state`,
    mode_command_topic: `tempco2mqtt/${deviceId}/climate/set`,

    modes: ["off", "heat"],

    unique_id: `${deviceId}_climate_tempco2mqtt`,
    platform: 'mqtt',

    temperature_command_topic: `tempco2mqtt/${deviceId}/temperature/set`,
    temperature_state_topic: `tempco2mqtt/${deviceId}/temperature/state`
})