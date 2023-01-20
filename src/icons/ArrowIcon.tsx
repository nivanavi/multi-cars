import React from 'react';

type ArrowIconProps = {
	direction: 'up' | 'left' | 'right' | 'down';
};
export const ArrowIcon: React.FC<ArrowIconProps> = props => {
	const { direction } = props;

	let deg: number = 0;

	switch (direction) {
		case 'left':
			deg = 90;
			break;
		case 'right':
			deg = -90;
			break;
		case 'up':
			deg = 180;
			break;
		case 'down':
			deg = 0;
			break;
		default:
			break;
	}

	return (
		<svg
			style={{
				transform: `rotate(${deg}deg)`,
				transformOrigin: '15px 15px',
			}}
			width='30px'
			height='30px'
			viewBox='0 0 24 24'
			fill='none'
			xmlns='http://www.w3.org/2000/svg'
		>
			<path d='M4 8L12 16L20 8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
};
