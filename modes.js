const modes = [
    'comfort',
    'hg',
    'off'
]

const celsiusToFahrenheit = celsius => celsius * 1.8 + 32

const fahrenheitToCelsius = fahrenheit => (fahrenheit - 32) / 1.8

const validateMode = (mode_name) => modes.includes(mode_name)

exports.getModeParams = (mode_name, options) => {

    if (options.hasOwnProperty('celsius')) {
        options.temperature = Math.floor(celsiusToFahrenheit(options.celsius) * 10)
    }
    
    console.log("@modes mode", mode_name, " exists? ", validateMode(mode_name))
    // Mode does not exist
    if (!validateMode(mode_name)) {
        return false
    }

    const params = new URLSearchParams()
    params.append('token', options.token)
    params.append('context', '1')
    params.append('smarthome_id', options.smarthome_id)
    params.append('query[id_device]', options.id_device)
    params.append('query[time_boost]', '0')

    params.append('query[gv_mode]', '0')
    params.append('query[nv_mode]', '0')
    params.append('peremption', '15000')
    params.append('lang', 'fi_FI')

    switch (mode_name) {

        // confort
        case 'comfort':
            params.append('query[consigne_confort]', options.temperature)
            params.append('query[consigne_manuel]', options.temperature)
            break

        case modes[0]:
            break

        case modes[0]:
            break

        default:
            return false    

    }

    return params

}