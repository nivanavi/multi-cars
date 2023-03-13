import CANNON from 'cannon-es';

export type CarPhysicsEmulatorCmd = {
	/**
	 * физический "мир"
	 */
	physicWorld: CANNON.World;
};
