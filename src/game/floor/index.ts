import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { ShapeType, threeToCannon } from 'three-to-cannon';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mapModelSrc from '../../models/map/map.gltf';

import { groundPhysicsMaterial, rumpPhysicsMaterial } from '../physics';
import { createModelContainer } from '../modelLoader';

const MAP_PHYSICS_OBJECT_NAME = 'physic';

export const setupFloor = (scene: THREE.Scene, physicWorld: CANNON.World): void => {
	const groundShape = new CANNON.Plane();
	const groundBody = new CANNON.Body({
		mass: 0,
		material: groundPhysicsMaterial,
	});

	groundBody.addShape(groundShape);
	groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);

	physicWorld.addBody(groundBody);

	createModelContainer({
		name: 'map',
		modelSrc: mapModelSrc,
		callback: mapContainer => {
			const physicsObjects = mapContainer.children[0].children.filter(({ name }) =>
				name.startsWith(MAP_PHYSICS_OBJECT_NAME)
			);
			physicsObjects.forEach(object => {
				const { shape } = threeToCannon(object, { type: ShapeType.BOX }) || {};
				const objectBody = new CANNON.Body({
					material: rumpPhysicsMaterial,
					mass: 0,
				});
				if (!shape) return;
				objectBody.addShape(shape);
				objectBody.position.set(object.position.x, object.position.y, object.position.z);
				objectBody.quaternion.set(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w);
				physicWorld.addBody(objectBody);
			});
			scene.add(mapContainer);
		},
	});
};

// // Add the ground
// const sizeX = 64;
// const sizeZ = 64;
// const matrix: number[][] = [];
// // eslint-disable-next-line no-plusplus
// for (let i = 0; i < sizeX; i++) {
// 	matrix.push([]);
// 	// eslint-disable-next-line no-plusplus
// 	for (let j = 0; j < sizeZ; j++) {
// 		if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
// 			const height = 3;
// 			matrix[i].push(height);
// 			// eslint-disable-next-line no-continue
// 			continue;
// 		}
//
// 		const height = Math.cos((i / sizeX) * Math.PI * 5) * Math.cos((j / sizeZ) * Math.PI * 5) * 2 + 2;
// 		matrix[i].push(height);
// 	}
// }
//
// const heightfieldShape = new CANNON.Heightfield(matrix, {
// 	elementSize: 100 / sizeX,
// });
// const heightfieldBody = new CANNON.Body({ mass: 0, material: groundPhysicsMaterial });
// heightfieldBody.addShape(heightfieldShape);
// heightfieldBody.position.set(
// 	// -((sizeX - 1) * heightfieldShape.elementSize) / 2,
// 	-(sizeX * heightfieldShape.elementSize) / 2,
// 	-1,
// 	// ((sizeZ - 1) * heightfieldShape.elementSize) / 2
// 	(sizeZ * heightfieldShape.elementSize) / 2
// );
// heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
// // physicWorld.addBody(heightfieldBody);
