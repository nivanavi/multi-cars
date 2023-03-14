import * as CANNON from 'cannon-es';
import { CharacterPhysicsEmulatorCmd } from './types';
import { CharacterMoveSpecs } from '../../../eventBus';
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

	const characterShape = new CANNON.Sphere(CHARACTER_SETTINGS.radius);

	const characterBody = new CANNON.Body({ mass: CHARACTER_SETTINGS.mass });
	characterBody.material = characterPhysicsMaterial;

	characterBody.addShape(characterShape);
	characterBody.allowSleep = false;
	characterBody.position.copy(defaultPosition);

	const destroy = (): void => {
		physicWorld.removeBody(characterBody);
	};

	physicWorld.addBody(characterBody);

	return {
		character: characterBody,
		update: (specs): void => {
			// обновляем поворот и позицию человека в пространстве
			characterBody.position.copy(specs.position);
			characterBody.quaternion.copy(specs.quaternion);
		},
		destroy,
	};
};
