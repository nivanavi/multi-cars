import { CAR_CONTROLS_IDS } from '../../car/controls/enums';
import { CameraControlProps } from './types';

const CAMERA_CONTROL_OPTIONS = {
	prevTouchRotateX: 0,
	prevTouchRotateY: 0,
	prevTouchScaleDistance: 0,
};

export const cameraControl = (props: CameraControlProps): { destroy: () => void } => {
	const { onZoomChange, onMoveChange } = props;
	const mousemoveHandler = ({ movementY, movementX }: MouseEvent): void => {
		onMoveChange(movementX, movementY);
	};

	const zoomCamera = (zoom: number): void => onZoomChange(zoom);

	const touchMoveHandler = (ev: TouchEvent): void => {
		const filteredTouches = Array.from(ev.touches).filter(touch => {
			const id = (touch?.target as HTMLElement)?.id as CAR_CONTROLS_IDS | undefined;
			return !Object.keys(CAR_CONTROLS_IDS).includes(id || '');
		});

		ev.preventDefault();

		const firstTouch = filteredTouches[0];
		const secondTouch = filteredTouches[1];

		if (firstTouch && secondTouch) {
			const dist = Math.hypot(firstTouch.pageX - secondTouch.pageX, firstTouch.pageY - secondTouch.pageY);

			if (dist < CAMERA_CONTROL_OPTIONS.prevTouchScaleDistance) zoomCamera(0.2);
			if (dist > CAMERA_CONTROL_OPTIONS.prevTouchScaleDistance) zoomCamera(-0.2);

			CAMERA_CONTROL_OPTIONS.prevTouchScaleDistance = dist;
			return;
		}

		const currentTouch = firstTouch || secondTouch;

		if (!CAMERA_CONTROL_OPTIONS.prevTouchRotateY || !CAMERA_CONTROL_OPTIONS.prevTouchRotateX) {
			CAMERA_CONTROL_OPTIONS.prevTouchRotateX = currentTouch.clientX;
			CAMERA_CONTROL_OPTIONS.prevTouchRotateY = currentTouch.clientY;
		}

		onMoveChange(
			currentTouch.clientX - CAMERA_CONTROL_OPTIONS.prevTouchRotateX,
			currentTouch.clientY - CAMERA_CONTROL_OPTIONS.prevTouchRotateY
		);
		CAMERA_CONTROL_OPTIONS.prevTouchRotateX = currentTouch.clientX;
		CAMERA_CONTROL_OPTIONS.prevTouchRotateY = currentTouch.clientY;
	};

	const wheelEventHandler: (ev: WheelEvent) => void = ev => {
		ev.preventDefault();
		zoomCamera(ev.deltaY * 0.01);
	};

	const touchEndHandler = (): void => {
		CAMERA_CONTROL_OPTIONS.prevTouchScaleDistance = 0;
		CAMERA_CONTROL_OPTIONS.prevTouchRotateY = 0;
		CAMERA_CONTROL_OPTIONS.prevTouchRotateX = 0;
	};

	window.addEventListener('mousemove', mousemoveHandler);
	window.addEventListener('wheel', wheelEventHandler, { passive: false });

	window.addEventListener('touchmove', touchMoveHandler, { passive: false });
	window.addEventListener('touchend', touchEndHandler);

	return {
		destroy: (): void => {
			window.removeEventListener('mousemove', mousemoveHandler);
			window.removeEventListener('wheel', wheelEventHandler);
			window.removeEventListener('touchmove', touchMoveHandler);
			window.removeEventListener('touchend', touchEndHandler);
		},
	};
};
