import * as CANNON from 'cannon-es';
import * as THREE from 'three';

/**
 * Меняет знак числа на противоположный
 */
export const changeNumberSign = (number: number): number => (number < 0 ? Math.abs(number) : -Math.abs(number));

/**
 * Копирует позицию и вращение физического объекта для графического объекта (синхронизация)
 */
export const copyPositions: (props: {
	body: CANNON.Body | null | undefined;
	mesh: THREE.Mesh | THREE.Group | THREE.Object3D | null | undefined;
}) => void = ({ body, mesh }) => {
	if (!body || !mesh) return;

	mesh.position.x = body.position.x;
	mesh.position.y = body.position.y;
	mesh.position.z = body.position.z;

	mesh.quaternion.copy(
		new THREE.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
	);
};
