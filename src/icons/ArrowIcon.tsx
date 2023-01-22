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
			}}
			width='40px'
			height='40px'
			viewBox='0 0 24 24'
			fill='none'
			xmlns='http://www.w3.org/2000/svg'
		>
			<g clipPath='url(#clip0_429_11251)'>
				<path d='M7 10L12 15' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
				<path d='M12 15L17 10' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
			</g>
			<defs>
				<clipPath id='clip0_429_11251'>
					<rect width='24' height='24' fill='white' />
				</clipPath>
			</defs>
		</svg>
	);
};
