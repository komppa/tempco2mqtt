interface DeviceConfig {
    identifiers: Array<string>,
    manufacturer: string,
    model: string,
    name: string,
}

/**
 * Config / discovery packet
 */
export interface ConfigPacket {
    availability: Array<{
        topic: string
    }>,
    device: DeviceConfig,
    device_class: string,
    enabled_by_default: boolean,
    json_attributes_topic: string,
    name: string,
    state_class: string,
    state_topic: string,
    unique_id: string,
    unit_of_measurement: string,
    value_template: string,
    platform: string
}

interface TemperaturePacket {
    temperature: string
}