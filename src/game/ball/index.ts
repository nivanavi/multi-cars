import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BallMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../../eventBus';
import { carPhysicsMaterial } from '../physics';
import { createModelContainer } from '../modelLoader';
import { MODELS_SRC } from '../../models';
import { cannonToThreeQuaternion, cannonToThreeVec } from '../../libs/utils';

export const setupBall = (
	scene: THREE.Scene,
	physicWorld: CANNON.World
): { updateBallSpecs: (specs: BallMoveSpecs) => void } => {
	const ballShape = new CANNON.Sphere(1.3);
	const ballBody = new CANNON.Body({
		mass: 3,
	});
	ballBody.addShape(ballShape);
	ballBody.material = carPhysicsMaterial;
	ballBody.allowSleep = true;
	ballBody.position.set(5, 5, 5);
	ballBody.allowSleep = true;
	physicWorld.addBody(ballBody);

	const ballContainer = createModelContainer({
		name: 'ball',
		modelSrc: MODELS_SRC.ballModelSrc,
		receiveShadow: true,
		castShadow: true,
		scale: new THREE.Vector3(1.3, 1.3, 1.3),
	});

	scene.add(ballContainer);

	eventBusSubscriptions.subscribeOnTickPhysic(() => {
		ballContainer.position.copy(cannonToThreeVec(ballBody.position));
		ballContainer.quaternion.copy(cannonToThreeQuaternion(ballBody.quaternion));

		if (ballBody.sleepState !== 0) return;
		eventBusTriggers.triggerOnBallMove({
			position: ballBody.position,
			quaternion: ballBody.quaternion,
		});
	});

	const updateBallSpecs = (data: BallMoveSpecs): void => {
		ballBody.position.copy(data.position);
		ballBody.quaternion.copy(data.quaternion);
	};

	return {
		updateBallSpecs,
	};
};
