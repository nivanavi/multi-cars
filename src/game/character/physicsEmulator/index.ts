import * as CANNON from 'cannon-es';
import { CharacterPhysicsEmulatorCmd } from './types';
import { eventBusSubscriptions, eventBusUnsubscribe, CharacterMoveSpecs } from '../../../eventBus';
import { characterPhysicsMaterial } from '../../physics';

const CHARACTER_SETTINGS = {
	radius: 1.2,
	mass: 2,
};

export const characterPhysicsEmulator = (
	props: CharacterPhysicsEmulatorCmd
): {
	destroy: () => void;
	character: CANNON.Body;
	update: (specs: CharacterMoveSpecs) => void;
} => {
	const { physicWorld, defaultPosition = new CANNON.Vec3() } = props;

	let CHARACTER_SPECS: CharacterMoveSpecs | null = null;

	const characterShape = new CANNON.Sphere(CHARACTER_SETTINGS.radius);

	const characterBody = new CANNON.Body({ mass: CHARACTER_SETTINGS.mass });
	characterBody.material = characterPhysicsMaterial;

	characterBody.addShape(characterShape);
	characterBody.allowSleep = false;
	characterBody.position.copy(defaultPosition);

	const onTickPhysic = (): void => {
		if (CHARACTER_SPECS) {
			// обновляем поворот и позицию человека в пространстве
			characterBody.position.copy(CHARACTER_SPECS.position);
			characterBody.quaternion.copy(CHARACTER_SPECS.quaternion);
		}
	};

	eventBusSubscriptions.subscribeOnTickPhysic(onTickPhysic);

	const destroy = (): void => {
		physicWorld.removeBody(characterBody);
		eventBusUnsubscribe.unsubscribeOnTickPhysic(onTickPhysic);
	};

	physicWorld.addBody(characterBody);

	return {
		character: characterBody,
		update: (specs): void => {
			CHARACTER_SPECS = specs;
		},
		destroy,
	};
};
