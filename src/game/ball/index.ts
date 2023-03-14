import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BallMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../../eventBus';
import { carPhysicsMaterial } from '../physics';
import { MODELS_SRC } from '../../models';
import { cannonToThreeQuaternion, cannonToThreeVec } from '../../libs/utils';
import { createModelContainer } from '../../libs/modelLoader';

export const setupBall = (
	scene: THREE.Scene,
	physicWorld: CANNON.World
): { update: (specs: BallMoveSpecs) => void } => {
	const ballShape = new CANNON.Sphere(1.3);
	const ballBody = new CANNON.Body({
		mass: 1.5,
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
		castShadow: true,
		scale: new THREE.Vector3(1.3, 1.3, 1.3),
	});

	scene.add(ballContainer);

	eventBusSubscriptions.subscribeOnTick(() => {
		ballContainer.position.copy(cannonToThreeVec(ballBody.position));
		ballContainer.quaternion.copy(cannonToThreeQuaternion(ballBody.quaternion));

		if (ballBody.sleepState !== 0) return;
		eventBusTriggers.triggerOnBallMove({
			position: ballBody.position,
			quaternion: ballBody.quaternion,
		});
	});

	const update = (data: BallMoveSpecs): void => {
		ballBody.position.copy(data.position);
		ballBody.quaternion.copy(data.quaternion);
	};

	return {
		update,
	};
};
