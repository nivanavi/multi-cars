import React from 'react';

export const ArrowFastIcon: React.FC = () => (
	<svg
		style={{
			transform: `rotate(-90deg)`,
		}}
		width='30px'
		height='30px'
		viewBox='0 0 24 24'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path
			d='M13 6L19 12L13 18M6 6L12 12L6 18'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
);
