import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { v4 } from 'uuid';
import { Car } from '../../game/carGraphics';

/**
 * Меняет знак числа на противоположный
 */
export const changeNumberSign = (number: number): number => (number < 0 ? Math.abs(number) : -Math.abs(number));

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

/**
 * Копирует позицию и вращение физического объекта для графического объекта (синхронизация)
 */
export const copyPositions: (props: {
	body: CANNON.Body | null | undefined;
	mesh: THREE.Mesh | THREE.Group | THREE.Object3D | null | undefined;
}) => void = ({ body, mesh }) => {
	if (!body || !mesh) return;

	mesh.position.copy(cannonToThreeVec(body.position));

	mesh.quaternion.copy(cannonToThreeQuaternion(body.quaternion));
};

const decToHex = (value: number): string => {
	if (value > 255) return 'FF';
	if (value < 0) return '00';
	return value.toString(16).padStart(2, '0').toUpperCase();
};

/**
 * Переводит rgb в hex т.к three че то с этим не справляется принимает только целые числа
 */
export const rgbToHex = (r: number, g: number, b: number): string => `#${decToHex(r)}${decToHex(g)}${decToHex(b)}`;

export const NICKNAME_ITEM = 'nickname';
/**
 * Получает никнейм пользователя из local storage
 */
export const getNickname = (): string | undefined => localStorage.getItem(NICKNAME_ITEM) || undefined;

export const CAR_ITEM = 'car';
/**
 * Получает тип выбранной машины из local storage
 */
export const getCarType = (): Car => (localStorage.getItem(CAR_ITEM) as Car) || Car.ELEANOR;
/**
 * Возвращает uuid
 */
export const uuid = (): string => v4();

type CreateTextCmd = {
	text: string;
	color: THREE.Color;
	size: number;
	callback: (text: THREE.Mesh) => void;
};

const fontLoader = new FontLoader();
const ttfLoader = new TTFLoader();
/**
 * Создает 3д текст
 */
export const createText = (props: CreateTextCmd): void => {
	const { text, color, size, callback } = props;

	ttfLoader.load('fonts/JetBrainsMono-Regular.ttf', jetFont => {
		const jetFontParse = fontLoader.parse(jetFont);
		const textGeometry = new TextGeometry(text, {
			size,
			height: size / 3,
			font: jetFontParse,
		});
		const textMaterial = new THREE.MeshStandardMaterial({ color });
		const textMesh = new THREE.Mesh(textGeometry, textMaterial);

		callback(textMesh);
	});
};
