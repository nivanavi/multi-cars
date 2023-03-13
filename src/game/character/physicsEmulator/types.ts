import * as CANNON from 'cannon-es';

export type CharacterPhysicsEmulatorCmd = {
	/**
	 * физический "мир"
	 */
	physicWorld: CANNON.World;
	defaultPosition?: CANNON.Vec3;
};
