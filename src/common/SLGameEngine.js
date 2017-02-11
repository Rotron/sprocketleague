'use strict';

const GameEngine = require('incheon').GameEngine;
const ThreeVector = require('incheon').serialize.ThreeVector;
const Car = require('./Car');
const Arena = require('./Arena');

const maxSteerVal = 0.5;
const maxForce = 1000;
const brakeForce = 1000000;

// todo check if this should be global
let CANNON = null;

class SLGameEngine extends GameEngine {

    constructor(options) {
        super(options);

        CANNON = this.physicsEngine.CANNON;

        this.qRight = new CANNON.Quaternion();
        this.qRight.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI/160);
        this.mRight = (new CANNON.Mat3()).setRotationFromQuaternion(this.qRight);

        this.qLeft = new CANNON.Quaternion();
        this.qLeft.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI/160);
        this.mLeft = (new CANNON.Mat3()).setRotationFromQuaternion(this.qLeft);

        this.on('server__playerJoined', this.makeCar.bind(this));
        this.on('server__playerDisconnected', this.removeCar.bind(this));
        this.on('server__init', this.gameInit.bind(this));
    }

    gameInit() {
        this.arena = new Arena(++this.world.idCount, this);
        this.arena.position.y = -4;
        this.addObjectToWorld(this.arena);
        this.physicsEngine.world.defaultContactMaterial.friction = 0;
    }

    start() {
        super.start();

        // TODO: refactor world settings
        this.worldSettings = {
            width: 800,
            height: 600
        };
    }


    // the Sumo Game Engine Step.
    step() {

        super.step();

        // on server-side:
        // decide if fighter has died
        for (let objId of Object.keys(this.world.objects)) {
            let obj = this.world.objects[objId];
            if (this.isServer && obj.y < -100) {
                console.log(`object ${objId} has fallen off the board`);
                this.resetFighter({ playerId: objId });
            }
        }
    }

    resetFighter(fighter) {
        fighter.x = Math.random() * 20 - 10;
        fighter.y = Math.random() * 20 - 10;
        fighter.initPhysicsObject(this.physicsEngine);
        console.log(`reset Fighter#${newGuy.playerId} at ${fighter.x},${fighter.y},${fighter.z}`);
    }

    // server-side function to add a new player
    makeCar(player) {
        console.log(`adding car of player`, player);

        // create a fighter for this client
        let position = new ThreeVector(0, 0, -10);
        let car = new Car(++this.world.idCount, this, position);
        car.playerId = player.playerId;
        this.addObjectToWorld(car);

        return car;
    }

    removeCar(player) {
        console.log(`removing car of player`, player);
        let o = this.world.getPlayerObject(player.playerId);
        this.removeObjectFromWorld(o.id);
    }

    processInput(inputData, playerId) {
        super.processInput(inputData, playerId);


        let playerCar = this.world.getPlayerObject(playerId);

        if (playerCar) {
            let vehicle = playerCar.vehicle;
            vehicle.setBrake(0, 0);
            vehicle.setBrake(0, 1);
            vehicle.setBrake(0, 2);
            vehicle.setBrake(0, 3);

            if (inputData.input === 'up') {
                vehicle.applyEngineForce(-maxForce, 2);
                vehicle.applyEngineForce(-maxForce, 3);
            } else if (inputData.input === 'right') {
                vehicle.setSteeringValue(-maxSteerVal, 0);
                vehicle.setSteeringValue(-maxSteerVal, 1);
            } else if (inputData.input === 'left') {
                vehicle.setSteeringValue(maxSteerVal, 0);
                vehicle.setSteeringValue(maxSteerVal, 1);
            } else if (inputData.input === 'down') {
                vehicle.applyEngineForce(maxForce, 2);
                vehicle.applyEngineForce(maxForce, 3);

            }

            playerCar.refreshFromPhysics();
        }

        // let sphere = playerSumo.physicsObj;
        // let playerSumoCenter = sphere.position.clone();
        // sphere.applyImpulse(moveDirection, playerSumoCenter);
    }

}

module.exports = SLGameEngine;
