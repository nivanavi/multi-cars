import * as CANNON from 'cannon-es';
import { eventBusSubscriptions } from '../../eventBus';

export const groundPhysicsMaterial = new CANNON.Material('groundMaterial');
export const defaultPhysicsMaterial = new CANNON.Material('dummyMaterial');
export const wheelPhysicsMaterial = new CANNON.Material('wheelMaterial');

// const groundDummyContactMaterial = new CANNON.ContactMaterial(groundPhysicsMaterial, dummyPhysicsMaterial, {
// 	friction: 0.05,
// 	restitution: 0.3,
// 	contactEquationStiffness: 1000,
// });
// const dummyDummyContactMaterial = new CANNON.ContactMaterial(dummyPhysicsMaterial, dummyPhysicsMaterial, {
// 	friction: 0.5,
// 	restitution: 0.3,
// 	contactEquationStiffness: 1000,
// });
// const groundWheelContactMaterial = new CANNON.ContactMaterial(wheelPhysicsMaterial, groundPhysicsMaterial, {
// 	friction: 0.3,
// 	restitution: 0,
// 	contactEquationStiffness: 1000,
// });

export const setupPhysics = (): {
	physicWorld: CANNON.World;
} => {
	const physicWorld = new CANNON.World({
		gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
	});
	// physicWorld.allowSleep = true;

	// отключить трение по умолчанию
	// physicWorld.defaultContactMaterial.friction = 0;

	// Sweep and prune broadphase (технология обработки взаимодействия физических тел)
	// physicWorld.broadphase = new CANNON.SAPBroadphase(physicWorld);

	// добавление взаимодействия 2ух материалов
	// physicWorld.addContactMaterial(groundWheelContactMaterial);

	eventBusSubscriptions.subscribeOnTick({
		callback: () => physicWorld.step(1 / 60),
	});

	return {
		physicWorld,
	};
};
