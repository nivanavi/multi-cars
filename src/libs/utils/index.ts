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

/**
 * Проверяет валидность json
 */
export const isJsonString = (str: string | undefined): boolean => {
	if (!str) return false;
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
};

/**
 * Переводит вектор Cannon в вектор Three
 */
export const cannonToThreeVec = (vector: CANNON.Vec3): THREE.Vector3 => new THREE.Vector3(vector.x, vector.y, vector.z);

/**
 * Переводит Quaternion Cannon в Quaternion Three
 */
export const cannonToThreeQuaternion = (quaternion: CANNON.Quaternion): THREE.Quaternion =>
	new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

const decToHex = (value: number): string => {
	if (value > 255) return 'FF';
	if (value < 0) return '00';
	return value.toString(16).padStart(2, '0').toUpperCase();
};

/**
 * Переводит rgb в hex т.к three че то с этим не справляется принимает только целые числа
 */
export const rgbToHex = (r: number, g: number, b: number): string => `#${decToHex(r)}${decToHex(g)}${decToHex(b)}`;
