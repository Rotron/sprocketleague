'use strict';

const PhysicalObject = require('incheon').serialize.PhysicalObject;
const MASS = 150;

class Car extends PhysicalObject {

    constructor(id, gameEngine, position) {
        super(id, position);
        this.class = Car;

    }

    onAddToWorld(gameEngine) {

        this.gameEngine = gameEngine;
        this.CANNON = gameEngine.physicsEngine.CANNON;

        let scene = gameEngine.renderer ? gameEngine.renderer.scene : null;
        if (scene) {
            let el = this.renderEl = document.createElement('a-entity');
            scene.appendChild(el);
            let p = this.position;
            let q = this.quaternion;
            el.setAttribute('position', `${p.x} ${p.y} ${p.z}`);
            el.object3D.quaternion.set(q.x, q.y, q.z, q.w);
            // el.setAttribute('material', 'color: red');
            // el.setAttribute('obj-model', 'obj: #car-obj');
            el.setAttribute('game-object-id', this.id);
        }

        // TODO: convert to rotation using aframe/system.js

        // let groundMaterial = new this.CANNON.Material("groundMaterial");
        // let wheelMaterial = new this.CANNON.Material("wheelMaterial");
        // let wheelGroundContactMaterial = new this.CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
        //     friction: 0.3,
        //     restitution: 0,
        //     contactEquationStiffness: 1000
        // });
        //
        // // We must add the contact materials to the world
        // this.gameEngine.physicsEngine.world.addContactMaterial(wheelGroundContactMaterial);

        let chassisShape = new this.CANNON.Box(new this.CANNON.Vec3(2, 1, 0.5));
        let chassisBody = this.physicsObj = new this.CANNON.Body({ mass: MASS });
        chassisBody.addShape(chassisShape);
        chassisBody.position.set(0, 0, 0);

        chassisBody.quaternion.setFromEuler(-1,0,0,"XYZ");
        // chassisBody.angularVelocity.set(0, 0, 0.5);
        // demo.addVisual(chassisBody);

        let options = {
            radius: 0.5,
            directionLocal: new this.CANNON.Vec3(0, 0, -1),
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence:  0.01,
            axleLocal: new this.CANNON.Vec3(0, 1, 0),
            chassisConnectionPointLocal: new this.CANNON.Vec3(1, 1, 0),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // Create the vehicle
        this.vehicle = chassisBody.vehicle = new this.CANNON.RaycastVehicle({
            chassisBody: chassisBody,
        });

        options.chassisConnectionPointLocal.set(1, 1, 0);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(1, -1, 0);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-1, 1, 0);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-1, -1, 0);
        this.vehicle.addWheel(options);

        this.vehicle.addToWorld(this.gameEngine.physicsEngine.world);
     
        var wheelBodies = [];
        for(let i=0; i < this.vehicle.wheelInfos.length; i++){
            let wheel = this.vehicle.wheelInfos[i];
            let cylinderShape = new this.CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
            let wheelBody = new this.CANNON.Body({
                mass: 0
            });
            wheelBody.type = this.CANNON.Body.KINEMATIC;
            wheelBody.collisionFilterGroup = 0; // turn off collisions
            let q = new this.CANNON.Quaternion();
            q.setFromAxisAngle(new this.CANNON.Vec3(1, 0, 0), Math.PI / 2);
            wheelBody.addShape(cylinderShape, new this.CANNON.Vec3(), q);
            wheelBodies.push(wheelBody);
            this.gameEngine.physicsEngine.world.addBody(wheelBody);
        }

        //todo remember to remove this handler!
        this.gameEngine.physicsEngine.world.addEventListener('postStep', () => {
            for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
                this.vehicle.updateWheelTransform(i);
                var t = this.vehicle.wheelInfos[i].worldTransform;
                var wheelBody = wheelBodies[i];
                wheelBody.position.copy(t.position);
                wheelBody.quaternion.copy(t.quaternion);
            }
        });

        this.physicsObj.position.set(this.position.x, this.position.y, this.position.z);
    }

    toString() {
        return `Car::${super.toString()}`;
    }

    destroy() {
         // this.gameEngine.physicsEngine.removeObject(this.vehicle);
    }

}

module.exports = Car;
