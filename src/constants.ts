export const ROOM_THEME_OPTIONS = {
	components: {
		MuiChip: {
			variants: [
				{
					props: {},
					style: {
						color: '#F7F7F8',
						backgroundColor: '#111313',
						borderRadius: '4px',
						opacity: '75%',
						':hover': {
							backgroundColor: '#1D1F20',
							opacity: '100%',
						},
					},
				},
			],
		},
		MuiCircularProgress: {
			variants: [
				{
					props: {},
					style: {
						color: '#F7F7F8',
					},
				},
			],
		},
		MuiIconButton: {
			variants: [
				{
					props: {},
					style: {
						padding: 4,
						margin: 2,
						color: '#F7F7F8',
						backgroundColor: '#111313',
						borderRadius: '4px',
						opacity: '75%',
						':hover': {
							backgroundColor: '#1D1F20',
							opacity: '100%',
						},
						':disabled': {
							color: '#7A8085',
							backgroundColor: '#CACCCE',
							opacity: '75%',
						},
					},
				},
			],
		},
		MuiSwitch: {
			styleOverrides: {
				colorPrimary: {
					'&.Mui-checked': {
						color: '#17821A',
					},
				},
				track: {
					'.Mui-checked.Mui-checked + &': {
						backgroundColor: '#17821A',
					},
				},
			},
		},
	},
};

export const VIDEO_ROUNDED_CORNERS = { borderRadius: '4px', overflow: 'hidden' };
