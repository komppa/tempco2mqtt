# Tempco Touch E3 to MQTT
Control and query Tempco Touch E3 using MQTT.
<div>
    <img width="100" height="100" src="images/t2z_logo.png">
</div>
<br />



## Running the SW



Development mode

First, install dependencies
```bash
npm i
```

Edit the configuration file of the tempco2mqtt by adding host and credentials for the MQTT broker and adding credentials for the Tempco API.
Configuration file can be found under project root (./configuration.yaml).

NOTE: if you are using development environment, please create local .env file by copying the original template
```bash
cp configuration.yaml configuration.yaml.local
```
and change credentials to match yours.

Then run project
```bash
npm run dev
```

Deployment mode

```bash
npm run run
```

## Architecture

<br />
<div>
    <img width="600" src="images/tempco2mqtt_arch.png">
</div>
<br />