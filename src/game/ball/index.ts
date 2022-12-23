import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BallMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../../eventBus';
import { carPhysicsMaterial } from '../physics';

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

	eventBusSubscriptions.subscribeOnTickPhysic({
		callback: () => {
			if (ballBody.sleepState !== 0) return;
			eventBusTriggers.triggerOnBallMove({
				payload: {
					position: ballBody.position,
					quaternion: ballBody.quaternion,
				},
			});
		},
	});

	const updateBallSpecs = (data: BallMoveSpecs): void => {
		ballBody.position.copy(data.position);
		ballBody.quaternion.copy(data.quaternion);
	};

	return {
		updateBallSpecs,
	};
};
