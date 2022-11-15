const createConfigPacket = (
    deviceId: string,
    manufacturerName: string,
    modelName: string,
    deviceClass: string,
    stateClass: string,
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
    device_class: deviceClass,
    enabled_by_default: true,
    json_attributes_topic: `tempco2mqtt/${deviceId}`,
    name: `${deviceId} ${deviceClass}`,
    state_class: "measurement",
    state_topic: `tempco2mqtt/${deviceId}`,
    unique_id: `${deviceId}_${deviceClass}_tempco2mqtt`,
    unit_of_measurement: unitOfMeasurement,
    value_template: `{{ value_json.${deviceClass} }}`,
    platform: "mqtt"
})
