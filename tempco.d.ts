export interface HeaderConfig {
    headers: {
        'User-Agent': string
        'Accept': string
        'Accept-Language': string
        'Content-Type': string
        'Origin': string
        'Connection': string
    }
}

export type Mode = 'comfort' | 'hg' | 'off'

export interface HouseTemperatureSelection {
    token: string
    smarthome_id: string
    id_device: string
    temperature?: number    // Calculated F for Tempco API
    celsius?: number        // Possible input in celsius
}

export interface Device {
    id: string
    id_device: string
    nom_appareil: string
    num_zone: string
    id_appareil: string
    programme: string
    consigne_confort: string
    consigne_hg: string
    consigne_eco: string
    consigne_boost: string
    consigne_manuel: string
    min_set_point: string
    max_set_point: string
    date_start_boost: any   // Server "always" returns null, cannot be sure
    time_boost: string
    nv_mode: string
    temperature_air: string
    temperature_sol: string
    on_off: string
    pourcent_light: string
    status_com: string
    recep_status_global: string
    gv_mode: string
    puissance_app: string
    smarthome_id: string
    bundle_id: string
    date_update: string
    label_interface: string
    heating_up: string
    heat_cool: string
    fan_speed: string
    error_code: string
    bit_override: string
    fan_error: any, // Server "always" returns null, cannot be sure
    time_boost_format_chrono: {
        d: string   // f.ex. '00'
        h: string
        m: string
        s: string
    }
}