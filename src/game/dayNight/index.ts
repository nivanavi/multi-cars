import * as THREE from 'three';
import CSM from 'three-csm';
import { eventBusSubscriptions } from '../../eventBus';
import { rgbToHex } from '../../libs/utils';

const DAY_NIGHT_OPTIONS = {
	isDay: false,
	sunPercent: 0,
	maxSunPercent: 100,
	periodPercent: 0,
	maxPeriodPercent: 100,
	previousTime: 0,
	minIntensity: 0.2,
	maxIntensity: 1,
	currentIntensity: 0.1,
	maxSanRotation: Math.PI * 2,
};

// const night = '#032648';
// const day = '#48B4E0';
const DAY_COLOR = new THREE.Color(72, 180, 224);
const NIGHT_COLOR = new THREE.Color(3, 38, 72);

export const setupDayNight = (
	scene: THREE.Scene,
	renderer: THREE.WebGLRenderer,
	camera: THREE.PerspectiveCamera
): void => {
	const ambientLight = new THREE.AmbientLight('#ffffff');
	ambientLight.intensity = DAY_NIGHT_OPTIONS.currentIntensity;

	const csm = new CSM({
		maxFar: 300,
		lightNear: 1,
		mode: 'practical',
		cascades: 1,
		shadowMapSize: 2048,
		lightIntensity: 0.7,
		camera,
		parent: scene,
	});

	scene.add(ambientLight);

	// stars
	[1, 5].forEach(size => {
		const vertices = Array.from({ length: 700 }).reduce<number[]>(prev => {
			const angle = Math.random() * Math.PI * 2;
			const radius = 1500 + Math.random() * 15;
			const x = Math.sin(angle) * radius;
			const z = Math.cos(angle) * radius;
			const y = Math.random() * 3000;
			return [...prev, x, y, z];
		}, []);
		const starGeometry = new THREE.BufferGeometry();
		starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

		const starMaterial = new THREE.PointsMaterial({
			size,
			blending: THREE.AdditiveBlending,
			depthTest: false,
		});

		const stars = new THREE.Points(starGeometry, starMaterial);
		scene.add(stars);
	});

	// sun
	const sunContainer = new THREE.Group();

	const sunMaterial = new THREE.MeshBasicMaterial({ color: '#f9d71c' });
	const sunGeometry = new THREE.SphereGeometry(75);
	const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
	sunMesh.castShadow = false;
	sunMesh.position.set(0, 0, 1000);

	sunContainer.add(sunMesh);
	scene.add(sunContainer);

	eventBusSubscriptions.subscribeOnTick({
		callback: ({ payload: { time } }) => {
			const currentTime = time * 50;
			DAY_NIGHT_OPTIONS.periodPercent += currentTime - DAY_NIGHT_OPTIONS.previousTime;
			DAY_NIGHT_OPTIONS.sunPercent += (currentTime - DAY_NIGHT_OPTIONS.previousTime) / 2;
			DAY_NIGHT_OPTIONS.previousTime = currentTime;
			if (DAY_NIGHT_OPTIONS.periodPercent >= DAY_NIGHT_OPTIONS.maxPeriodPercent) {
				DAY_NIGHT_OPTIONS.isDay = !DAY_NIGHT_OPTIONS.isDay;
				DAY_NIGHT_OPTIONS.periodPercent = 0;

				DAY_NIGHT_OPTIONS.currentIntensity = DAY_NIGHT_OPTIONS.isDay
					? DAY_NIGHT_OPTIONS.maxIntensity
					: DAY_NIGHT_OPTIONS.minIntensity;
			}

			if (DAY_NIGHT_OPTIONS.sunPercent >= DAY_NIGHT_OPTIONS.maxSunPercent) {
				DAY_NIGHT_OPTIONS.sunPercent = 0;
			}

			// получаем процент интенсивности свечения для конкретого времени периода
			const calcIntensity =
				((DAY_NIGHT_OPTIONS.maxIntensity - DAY_NIGHT_OPTIONS.minIntensity) * DAY_NIGHT_OPTIONS.periodPercent) / 100;

			// получаем процент трансформирования одного цвета в другой в промежутке между 0 - 1
			const calcColorAlfa = Number((DAY_NIGHT_OPTIONS.periodPercent / 100).toFixed(2));

			// рассчитываем вращение солнца исходя с отступом в 1/4 полного оборота
			const calcSunRotation = (DAY_NIGHT_OPTIONS.sunPercent * DAY_NIGHT_OPTIONS.maxSanRotation) / 100 - Math.PI / 2;

			if (DAY_NIGHT_OPTIONS.isDay) {
				// т.к день интенсивность уменьшаем
				DAY_NIGHT_OPTIONS.currentIntensity = DAY_NIGHT_OPTIONS.maxIntensity - calcIntensity;

				// рассчитываем цвет неба исходя из процента трансформирования
				const color = new THREE.Color().lerpColors(DAY_COLOR, NIGHT_COLOR, calcColorAlfa);
				renderer.setClearColor(rgbToHex(Math.round(color.r), Math.round(color.g), Math.round(color.b)));
			}
			if (!DAY_NIGHT_OPTIONS.isDay) {
				// т.к ночь интенсивность увеличиваем
				DAY_NIGHT_OPTIONS.currentIntensity = DAY_NIGHT_OPTIONS.minIntensity + calcIntensity;

				// рассчитываем цвет неба исходя из процента трансформирования
				const color = new THREE.Color().lerpColors(NIGHT_COLOR, DAY_COLOR, calcColorAlfa);
				renderer.setClearColor(rgbToHex(Math.round(color.r), Math.round(color.g), Math.round(color.b)));
			}

			sunContainer.rotation.x = -calcSunRotation;
			ambientLight.intensity = DAY_NIGHT_OPTIONS.currentIntensity;

			// обновляем положение точечного света в соответсвии с позицией солнца
			const sunPosition = new THREE.Vector3().setFromMatrixPosition(sunMesh.matrixWorld);
			csm.lightDirection.copy(sunPosition.normalize().negate());
			csm.update();
		},
	});
};
