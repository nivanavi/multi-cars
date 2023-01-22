import * as THREE from 'three';
import { CreateModelCmd, createModelContainer } from '../modelLoader';
import { CarMoveSpecs } from '../../eventBus';
import { cannonToThreeQuaternion, cannonToThreeVec } from '../../libs/utils';
import { MODELS_SRC } from '../../models';

export enum Car {
	DELORIAN = 'DELORIAN',
	ELEANOR = 'ELEANOR',
}

export type CarGraphicsCmd = {
	/**
	 * сцена
	 */
	scene: THREE.Scene;
	/**
	 * тип машины
	 */
	type: Car;
};

const graphics: { [key: string]: CreateModelCmd } = {
	[Car.ELEANOR]: {
		name: 'eleanor',
		modelSrc: MODELS_SRC.eleanorModelSrc,
		castShadow: true,
		rotation: new THREE.Euler(0, -Math.PI / 2, 0),
		scale: new THREE.Vector3(2.8, 2.8, 2.8),
		position: new THREE.Vector3(-0.07, 0.2, 0),
	},
	[`${Car.ELEANOR}Wheel`]: {
		name: 'wheel',
		modelSrc: MODELS_SRC.eleanorWheelModelSrc,
		castShadow: true,
		rotation: new THREE.Euler(0, Math.PI / 2, 0),
		scale: new THREE.Vector3(0.57, 0.57, 0.57),
	},
	[Car.DELORIAN]: {
		name: 'delorian',
		modelSrc: MODELS_SRC.delorianModelSrc,
		castShadow: true,
		rotation: new THREE.Euler(0, -Math.PI, 0),
		scale: new THREE.Vector3(2, 2, 2),
		position: new THREE.Vector3(0.42, -0.4, 0),
	},
	[`${Car.DELORIAN}Wheel`]: {
		name: 'wheel',
		modelSrc: MODELS_SRC.delorianWheelModelSrc,
		castShadow: true,
		scale: new THREE.Vector3(0.57, 0.57, 0.57),
	},
};

export const setupCarGraphics = (
	props: CarGraphicsCmd
): {
	carContainer: THREE.Group;
	wheels: THREE.Group[];
	updateHandler: (props: CarMoveSpecs) => void;
	deleteHandler: () => void;
} => {
	const { scene, type } = props;
	const wheelName = `${type}Wheel`;

	const carContainer = createModelContainer(graphics[type]);
	scene.add(carContainer);

	const wheelsGraphic: THREE.Group[] = [];
	createModelContainer({
		...graphics[wheelName],
		callback: container => {
			Array.from({ length: 4 }).forEach(() => {
				const wheelMesh = container.clone();
				wheelMesh.scale.set(1, 1, 0.95);
				wheelsGraphic.push(wheelMesh);
				scene.add(wheelMesh);
			});
		},
	});

	const updateHandler = (specs: CarMoveSpecs): void => {
		const { chassis, wheels } = specs || {};
		const { position, quaternion } = chassis || {};
		if (!position || !quaternion) return;
		carContainer.position.copy(cannonToThreeVec(position));
		carContainer.quaternion.copy(cannonToThreeQuaternion(quaternion));
		if (!wheels || !wheelsGraphic.length) return;
		wheels.forEach((wheel, index) => {
			const { position: wheelPosition, quaternion: wheelQuaternion } = wheel || {};
			if (!position || !quaternion) return;
			wheelsGraphic[index].position.copy(cannonToThreeVec(wheelPosition));
			wheelsGraphic[index].quaternion.copy(cannonToThreeQuaternion(wheelQuaternion));
		});
	};

	const deleteHandler = (): void => {
		scene.remove(carContainer);
		wheelsGraphic.forEach(wheel => scene.remove(wheel));
	};

	return {
		carContainer,
		wheels: wheelsGraphic,
		updateHandler,
		deleteHandler,
	};
};
