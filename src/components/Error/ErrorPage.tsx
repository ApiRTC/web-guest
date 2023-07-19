import React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export type ErrorPageProps = {
	errorType: any;
};

const ErrorPage: React.FC<ErrorPageProps> = ({ errorType }) => {
	// Determine the error message based on the error type
	let errorMessage = 'An error occurred';

	switch (errorType) {
		case 404:
			errorMessage = 'Invitation not found';
			break;
		case 500:
			errorMessage = 'Internal server error';
			break;
		case 401:
			errorMessage = "You're not auhorized to join";
			break;
		default:
			errorMessage = 'An error occurred';
			break;
	}

	return (
		<Container maxWidth="sm" sx={{ height: '100vh' }}>
			<Box sx={{ height: '100%' }} display="flex" alignItems="center" justifyContent="center">
				<Card>
					<CardContent>
						<Box>
							<Typography variant="h4">{errorMessage}</Typography>
						</Box>
					</CardContent>
				</Card>
			</Box>
		</Container>
	);
};

export default ErrorPage;
