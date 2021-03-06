import { Service, PlatformAccessory, CharacteristicValue } from "homebridge";

import { CrestronPlatform } from "./CrestronPlatform";

import { EventEmitter } from "events";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HeaterCooler {
    private service: Service;
    private id: number;
    private deviceType = "HeaterCooler";
    private minHeaterCoolerState: number;
    private maxHeaterCoolerState: number;
    private eventPowerStateMsg = "eventPowerState";
    private setPowerStateMsg = "setPowerState";
    private getPowerStateMsg = "getPowerState";
    private getCurrentHeaterCoolerStateMsg = "getCurrentHeaterCoolerState";
    private eventTargetHeaterCoolerStateMsg = "eventTargetHeaterCoolerState";
    private setTargetHeaterCoolerStateMsg = "setTargetHeaterCoolerState";
    private getTargetHeaterCoolerStateMsg = "getTargetHeaterCoolerState";
    private eventCurrentTempMsg = "eventCurrentTemperature";
    private getCurrentTempMsg = "getCurrentTemperature";
    private eventTargetTempMsg = "eventTargetTemperature";
    private setTargetTempMsg = "setTargetTemperature";
    private getTargetTempMsg = "getTargetTemperature";
    private eventRotationSpeedMsg = "eventRotationSpeed";
    private setRotationSpeedMsg = "setRotationSpeed";
    private getRotationSpeedMsg = "getRotationSpeed";
    private setTemperatureDisplayUnitMsg = "setTemperatureDisplayUnit";
    private getTemperatureDisplayUnitMsg = "getTemperatureDisplayUnit";

    /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
    private states = {
        Active: 0,
        CurrentHeaterCoolerState: 0,
        TargetHeaterCoolerState: 0,
        RotationSpeed: 100,
        CurrentTemperature: 24,
        TargetTemperature: 24,
        CoolingThresholdTemperature: 24,
        HeatingThresholdTemperature: 24,
        TemperatureDisplayUnit: 0
    };

    constructor(
        private platform: CrestronPlatform,
        private accessory: PlatformAccessory,
        private eventEmitter: EventEmitter
    ) {
        this.id = accessory.context.device.id;
        this.states.TemperatureDisplayUnit = accessory.context.device.TemperatureDisplayUnit;
        this.minHeaterCoolerState = 2;
        this.maxHeaterCoolerState = 2;	
        let tmpValue = accessory.context.device.modeSelection;
        if(tmpValue < 10)
        {
            this.minHeaterCoolerState = tmpValue - 1;
            this.maxHeaterCoolerState = tmpValue - 1;
        }
        else
        {
            tmpValue = accessory.context.device.modeSelection%10;
            if(tmpValue === 3)
            {
                this.minHeaterCoolerState = 0;
                this.maxHeaterCoolerState = 1;
            }
            else if(tmpValue === 5)
            {
                this.minHeaterCoolerState = 1;
                this.maxHeaterCoolerState = 2;
            }
            else if(tmpValue === 6)
            {
                this.minHeaterCoolerState = 0;
                this.maxHeaterCoolerState = 2;
            }
        }
		 
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.getPowerStateMsg}`, this.getPowerStateMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventPowerStateMsg}`, this.setPowerStateMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.getCurrentHeaterCoolerStateMsg}`, this.getCurrentHeaterCoolerStateMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.getTargetHeaterCoolerStateMsg}`, this.getTargetHeaterCoolerStateMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventTargetHeaterCoolerStateMsg}`, this.setTargetHeaterCoolerStateMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.getCurrentTempMsg}`, this.getCurrentTemperatureMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventCurrentTempMsg}`, this.setCurrentTemperatureMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.getTargetTempMsg}`, this.getTargetTemperatureMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventTargetTempMsg}`, this.setTargetTemperatureMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.getRotationSpeedMsg}`, this.getRotationSpeedMsgEvent.bind(this));
        this.eventEmitter.on(`${this.deviceType}:${this.id}:${this.eventRotationSpeedMsg}`, this.setRotationSpeedMsgEvent.bind(this));
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
            .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

        // get the HeaterCooler service if it exists, otherwise create a new HeaterCooler service
        // you can create multiple services for each accessory
        this.service = this.accessory.getService(this.platform.Service.HeaterCooler) || this.accessory.addService(this.platform.Service.HeaterCooler);

        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/HeaterCooler
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.handleActiveGet.bind(this))
            .onSet(this.handleActiveSet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
            .onGet(this.handleCurrentHeaterCoolerStateGet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
            .setProps({
                minValue: this.minHeaterCoolerState,
                maxValue: this.maxHeaterCoolerState
            })
            .onGet(this.handleTargetHeaterCoolerStateGet.bind(this))
            .onSet(this.handleTargetHeaterCoolerStateSet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .onGet(this.handleRotationSpeedGet.bind(this))
            .onSet(this.handleRotationSpeedSet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .setProps({
                minValue: accessory.context.device.minTemperatureValue,
                maxValue: accessory.context.device.maxTemperatureValue,
                minStep: accessory.context.device.minTemperatureStep
            })
            .onGet(this.handleCurrentTemperatureGet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .setProps({
                minValue: accessory.context.device.minTemperatureValue,
                maxValue: accessory.context.device.maxTemperatureValue,
                minStep: accessory.context.device.minTemperatureStep
            })
            .onGet(this.handleCoolingThresholdTemperatureGet.bind(this))
            .onSet(this.handleCoolingThresholdTemperatureSet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
            .setProps({
                minValue: accessory.context.device.minTemperatureValue,
                maxValue: accessory.context.device.maxTemperatureValue,
                minStep: accessory.context.device.minTemperatureStep
            })
            .onGet(this.handleHeatingThresholdTemperatureGet.bind(this))
            .onSet(this.handleHeatingThresholdTemperatureSet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
            .onGet(this.handleTemperatureDisplayUnitGet.bind(this))
            .onSet(this.handleTemperatureDisplayUnitSet.bind(this));
    }

    /**
     * Handle the "GET" requests from HomeKit
     * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a HeaterCooler is on.
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * If your device takes time to respond you should update the status of your device
     * asynchronously instead using the `updateCharacteristic` method instead.
     * @example
     * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
     */
    async handleActiveGet(): Promise<CharacteristicValue> {
        const isActive = this.states.Active;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic Active From Homekit -> ${isActive}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getPowerStateMsg}:*`);
        return isActive;
    }

    async handleCurrentHeaterCoolerStateGet(): Promise<CharacteristicValue> {
        const currentHeaterCoolerState = this.states.CurrentHeaterCoolerState;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic CurrentHeaterCoolerState From Homekit -> ${currentHeaterCoolerState}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getCurrentHeaterCoolerStateMsg}:*`);
        return currentHeaterCoolerState;
    }

    async handleTargetHeaterCoolerStateGet(): Promise<CharacteristicValue> {
        const targetHeaterCoolerState = this.states.TargetHeaterCoolerState;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic TargetHeaterCoolerState From Homekit -> ${targetHeaterCoolerState}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getTargetHeaterCoolerStateMsg}:*`);
        return targetHeaterCoolerState;
    }

    async handleRotationSpeedGet(): Promise<CharacteristicValue> {
        const rotationSpeed = this.states.RotationSpeed;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic RotationSpeed From Homekit -> ${rotationSpeed}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getRotationSpeedMsg}:*`);
        return rotationSpeed;
    }

    async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
        const currentTemperature = this.states.CurrentTemperature;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic CurrentTemperature From Homekit -> ${currentTemperature}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getCurrentTempMsg}:*`);
        return currentTemperature;
    }

    async handleCoolingThresholdTemperatureGet(): Promise<CharacteristicValue> {
        const targetTemperature = this.states.TargetTemperature;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic CoolingThresholdTemperature From Homekit -> ${targetTemperature}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getTargetTempMsg}:*`);
        return targetTemperature;
    }

    async handleHeatingThresholdTemperatureGet(): Promise<CharacteristicValue> {
        const targetTemperature = this.states.TargetTemperature;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic HeatingThresholdTemperature From Homekit -> ${targetTemperature}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getTargetTempMsg}:*`);
        return targetTemperature;
    }

    async handleTemperatureDisplayUnitGet(): Promise<CharacteristicValue> {
        const TemperatureDisplayUnit = this.states.TemperatureDisplayUnit;
        this.platform.log.info(`${this.deviceType}:${this.id}: Get Characteristic TemperatureDisplayUnit From Homekit -> ${TemperatureDisplayUnit}`);
        this.platform.sendData(`${this.deviceType}:${this.id}:${this.getTemperatureDisplayUnitMsg}:*`);
        return TemperatureDisplayUnit;
    }

    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, changing the Brightness
     */
    async handleActiveSet(value: CharacteristicValue) {
        const tmpActiveValue = value as number;
        if (this.states.Active != tmpActiveValue) {
            this.states.Active = tmpActiveValue;
            if (tmpActiveValue === 0 && this.states.CurrentHeaterCoolerState != 0) {
                this.states.CurrentHeaterCoolerState = 0;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic CurrentHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            else if (tmpActiveValue === 1 && this.states.CurrentHeaterCoolerState != (this.states.TargetHeaterCoolerState + 1)) {
                this.states.CurrentHeaterCoolerState = this.states.TargetHeaterCoolerState + 1;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic CurrentHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            this.platform.sendData(`${this.deviceType}:${this.id}:${this.setPowerStateMsg}:${this.states.Active}:*`);
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic Active By Homekit -> ${value}`);
        }
    }

    async handleTargetHeaterCoolerStateSet(value: CharacteristicValue) {
        const tmpTargetHeaterCoolerState = value as number;
        if (this.states.TargetHeaterCoolerState != tmpTargetHeaterCoolerState) {
            this.states.TargetHeaterCoolerState = tmpTargetHeaterCoolerState;
            if (this.states.Active === 1 && this.states.CurrentHeaterCoolerState != (tmpTargetHeaterCoolerState + 1)) {
                this.states.CurrentHeaterCoolerState = tmpTargetHeaterCoolerState + 1;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic CurrentHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            this.platform.sendData(`${this.deviceType}:${this.id}:${this.setTargetHeaterCoolerStateMsg}:${this.states.TargetHeaterCoolerState}:*`);
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic TargetHeaterCoolerState By Homekit -> ${value}`);
        }
    }

    async handleRotationSpeedSet(value: CharacteristicValue) {
        const tmpRotationSpeed = value as number;
        if (this.states.RotationSpeed != tmpRotationSpeed) {
            this.states.RotationSpeed = tmpRotationSpeed;
            this.platform.sendData(`${this.deviceType}:${this.id}:${this.setRotationSpeedMsg}:${this.states.RotationSpeed}:*`);
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic RotationSpeed By Homekit -> ${value}`);
        }
    }

    async handleCoolingThresholdTemperatureSet(value: CharacteristicValue) {
        const tmpCoolingThresholdTemperature = value as number;
        if (this.states.CoolingThresholdTemperature != tmpCoolingThresholdTemperature) {
            this.states.TargetTemperature = tmpCoolingThresholdTemperature;
            this.states.CoolingThresholdTemperature = tmpCoolingThresholdTemperature;
            this.platform.sendData(`${this.deviceType}:${this.id}:${this.setTargetTempMsg}:${tmpCoolingThresholdTemperature * 10}:*`);
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic CoolingThresholdTemperature By Homekit -> ${tmpCoolingThresholdTemperature}`);
            this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, tmpCoolingThresholdTemperature);
        }
    }

    async handleHeatingThresholdTemperatureSet(value: CharacteristicValue) {
        const tmpHeatingThresholdTemperature = value as number;
        if (this.states.HeatingThresholdTemperature != tmpHeatingThresholdTemperature) {
            this.states.TargetTemperature = tmpHeatingThresholdTemperature;
            this.states.HeatingThresholdTemperature = tmpHeatingThresholdTemperature;
            this.platform.sendData(`${this.deviceType}:${this.id}:${this.setTargetTempMsg}:${tmpHeatingThresholdTemperature * 10}:*`);
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic HeatingThresholdTemperature By Homekit -> ${tmpHeatingThresholdTemperature}`);
            this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, tmpHeatingThresholdTemperature);
        }
    }

    async handleTemperatureDisplayUnitSet(value: CharacteristicValue) {
        const tmpTemperatureDisplayUnit = value as number;
        if (this.states.TemperatureDisplayUnit != tmpTemperatureDisplayUnit) {
            this.states.TemperatureDisplayUnit = tmpTemperatureDisplayUnit;
            this.platform.sendData(`${this.deviceType}:${this.id}:${this.setTemperatureDisplayUnitMsg}:${this.states.TemperatureDisplayUnit}:*`);
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic TemperatureDisplayUnit By Homekit -> ${value}`);
        }
    }

    getPowerStateMsgEvent(value: number) {
        const tmpActiveValue = value;
        if (this.states.Active != tmpActiveValue) {
            this.states.Active = tmpActiveValue;
            if (tmpActiveValue === 0 && this.states.CurrentHeaterCoolerState != 0) {
                this.states.CurrentHeaterCoolerState = 0;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic TargetHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            else if (tmpActiveValue === 1 && this.states.CurrentHeaterCoolerState != (this.states.TargetHeaterCoolerState + 1)) {
                this.states.CurrentHeaterCoolerState = this.states.TargetHeaterCoolerState + 1;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic TargetHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            this.platform.log.info(`${this.deviceType}:${this.id}: Retrieve Characteristic Active From Crestron Processor -> ${this.states.Active}`);
            this.service.updateCharacteristic(this.platform.Characteristic.Active, this.states.Active);
        }
    }

    setPowerStateMsgEvent(value: number) {
        const tmpActiveValue = value;
        if (this.states.Active != tmpActiveValue) {
            this.states.Active = tmpActiveValue;
            if (tmpActiveValue === 0 && this.states.CurrentHeaterCoolerState != 0) {
                this.states.CurrentHeaterCoolerState = 0;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic TargetHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            else if (tmpActiveValue === 1 && this.states.CurrentHeaterCoolerState != (this.states.TargetHeaterCoolerState + 1)) {
                this.states.CurrentHeaterCoolerState = this.states.TargetHeaterCoolerState + 1;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic TargetHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic Active By Crestron Processor -> ${this.states.Active}`);
            this.service.updateCharacteristic(this.platform.Characteristic.Active, this.states.Active);
        }
    }

    getCurrentHeaterCoolerStateMsgEvent(value: number) {
        const tmpCurrentHeaterCoolerState = value;
        if (this.states.CurrentHeaterCoolerState != tmpCurrentHeaterCoolerState) {
            this.states.CurrentHeaterCoolerState = tmpCurrentHeaterCoolerState;
            if (tmpCurrentHeaterCoolerState != 0 && this.states.TargetHeaterCoolerState != (tmpCurrentHeaterCoolerState - 1)) {
                this.states.TargetHeaterCoolerState = tmpCurrentHeaterCoolerState - 1;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic TargetHeaterCoolerState: -> ${this.states.TargetHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.states.TargetHeaterCoolerState);
            }
            this.platform.log.info(`${this.deviceType}:${this.id}: Retrieve Characteristic CurrentHeaterCoolerState From Crestron Processor -> $(this.states.CurrentHeaterCoolerState}`);
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
        }
    }

    getTargetHeaterCoolerStateMsgEvent(value: number) {
        const tmpTargetHeaterCoolerState = value;
        if (this.states.TargetHeaterCoolerState != tmpTargetHeaterCoolerState) {
            this.states.TargetHeaterCoolerState = tmpTargetHeaterCoolerState;
            if (this.states.Active === 1 && this.states.CurrentHeaterCoolerState != (this.states.TargetHeaterCoolerState + 1)) {
                this.states.CurrentHeaterCoolerState = this.states.TargetHeaterCoolerState + 1;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic CurrentHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            this.platform.log.info(`${this.deviceType}:${this.id}: Retrieve Characteristic TargetHeaterCoolerState From Crestron Processor -> $(this.states.TargetHeaterCoolerState}`);
            this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.states.TargetHeaterCoolerState);
        }
    }

    setTargetHeaterCoolerStateMsgEvent(value: number) {
        const tmpTargetHeaterCoolerState = value;
        if (this.states.TargetHeaterCoolerState != tmpTargetHeaterCoolerState) {
            this.states.TargetHeaterCoolerState = tmpTargetHeaterCoolerState;
            if (this.states.Active === 1 && this.states.CurrentHeaterCoolerState != (this.states.TargetHeaterCoolerState + 1)) {
                this.states.CurrentHeaterCoolerState = this.states.TargetHeaterCoolerState + 1;
                this.platform.log.info(`${this.deviceType}:${this.id}: Update Characteristic CurrentHeaterCoolerState: -> ${this.states.CurrentHeaterCoolerState}`);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.states.CurrentHeaterCoolerState);
            }
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic TargetHeaterCoolerState By Crestron Processor -> $(this.states.TargetHeaterCoolerState}`);
            this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.states.TargetHeaterCoolerState);
        }
    }

    getCurrentTemperatureMsgEvent(value: number) {
        const tmpCurrentTemperature = value / 10;
        if (this.states.CurrentTemperature != tmpCurrentTemperature) {
            this.states.CurrentTemperature = tmpCurrentTemperature;
            this.platform.log.info(`${this.deviceType}:${this.id}: Retrieve Characteristic CurrentTemperature From Crestron Processor -> ${this.states.CurrentTemperature}`);
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.states.CurrentTemperature);
        }
    }

    setCurrentTemperatureMsgEvent(value: number) {
        const tmpCurrentTemperature = value / 10;
        if (this.states.CurrentTemperature != tmpCurrentTemperature) {
            this.states.CurrentTemperature = tmpCurrentTemperature;
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic CurrentTemperature By Crestron Processor -> ${this.states.CurrentTemperature}`);
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.states.CurrentTemperature);
        }
    }

    getTargetTemperatureMsgEvent(value: number) {
        const tmpTargetTemperature = value / 10;
        if (this.states.TargetTemperature != tmpTargetTemperature) {
            this.states.TargetTemperature = tmpTargetTemperature;
            this.states.CoolingThresholdTemperature = tmpTargetTemperature;
            this.states.HeatingThresholdTemperature = tmpTargetTemperature;
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic TargetTemperature By Crestron Processor -> ${tmpTargetTemperature}`);
            this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.states.CoolingThresholdTemperature);
            this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.states.HeatingThresholdTemperature);
        }
    }

    setTargetTemperatureMsgEvent(value: number) {
        const tmpTargetTemperature = value / 10;
        if (this.states.TargetTemperature != tmpTargetTemperature) {
            this.states.TargetTemperature = tmpTargetTemperature;
            this.states.CoolingThresholdTemperature = tmpTargetTemperature;
            this.states.HeatingThresholdTemperature = tmpTargetTemperature;
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic TargetTemperature By Crestron Processor -> ${tmpTargetTemperature}`);
            this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.states.CoolingThresholdTemperature);
            this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.states.HeatingThresholdTemperature);
        }
    }

    getRotationSpeedMsgEvent(value: number) {
        const tmpRotationSpeed = value;
        if (this.states.RotationSpeed != tmpRotationSpeed) {
            this.states.RotationSpeed = tmpRotationSpeed;
            this.platform.log.info(`${this.deviceType}:${this.id}: Retrieve Characteristic RotationSpeed From Crestron Processor -> ${this.states.RotationSpeed}`);
            this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.states.RotationSpeed);
        }
    }

    setRotationSpeedMsgEvent(value: number) {
        const tmpRotationSpeed = value;
        if (this.states.RotationSpeed != tmpRotationSpeed) {
            this.states.RotationSpeed = tmpRotationSpeed;
            this.platform.log.info(`${this.deviceType}:${this.id}: Set Characteristic RotationSpeed By Crestron Processor -> ${this.states.RotationSpeed}`);
            this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.states.RotationSpeed);
        }
    }
}
