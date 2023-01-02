import * as CANNON from 'cannon-es';
import { eventBusSubscriptions } from '../../eventBus';

export const groundPhysicsMaterial = new CANNON.Material('groundMaterial');
export const carPhysicsMaterial = new CANNON.Material('carMaterial');
export const rumpPhysicsMaterial = new CANNON.Material('rumpMaterial');
// export const defaultPhysicsMaterial = new CANNON.Material('dummyMaterial');
// export const wheelPhysicsMaterial = new CANNON.Material('wheelMaterial');

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
const groundCarContactMaterial = new CANNON.ContactMaterial(carPhysicsMaterial, groundPhysicsMaterial, {
	friction: 0.01,
	restitution: 0,
	contactEquationStiffness: 10000,
});

const carCarContactMaterial = new CANNON.ContactMaterial(carPhysicsMaterial, carPhysicsMaterial, {
	friction: 0,
	restitution: 5,
	contactEquationStiffness: 1000,
});

const carRumpContactMaterial = new CANNON.ContactMaterial(carPhysicsMaterial, rumpPhysicsMaterial, {
	friction: 0,
	restitution: 5,
	contactEquationStiffness: 1000,
});

export const setupPhysics = (): {
	physicWorld: CANNON.World;
} => {
	const physicWorld = new CANNON.World({
		gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
	});
	physicWorld.allowSleep = true;

	// отключить трение по умолчанию
	// physicWorld.defaultContactMaterial.friction = 0;

	// Sweep and prune broadphase (технология обработки взаимодействия физических тел)
	// physicWorld.broadphase = new CANNON.SAPBroadphase(physicWorld);

	// добавление взаимодействия 2ух материалов
	physicWorld.addContactMaterial(groundCarContactMaterial);
	physicWorld.addContactMaterial(carCarContactMaterial);
	physicWorld.addContactMaterial(carRumpContactMaterial);

	eventBusSubscriptions.subscribeOnTick(() => {
		// очень крутая тема избавляет от боли кастомного ограничения частоты вызовов функции апдейта физики
		// любая герцовка будет ограничиваться 60 "кадрами"
		physicWorld.fixedStep();
	});

	return {
		physicWorld,
	};
};
