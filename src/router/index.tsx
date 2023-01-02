import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Notifications } from '../libs/notification';
import NotFoundPage from '../pages/notFoundPage';
import StartPage from '../pages/startPage';
import GamePage from '../pages/gamePage';

export const Router: React.FC = () => {
	const router = createBrowserRouter([
		{
			path: '/',
			element: <StartPage />,
			errorElement: <NotFoundPage />,
		},
		{
			path: '/room/:id',
			element: <GamePage />,
			errorElement: <NotFoundPage />,
		},
	]);

	return (
		<>
			<RouterProvider router={router} />
			<Notifications />
		</>
	);
};
