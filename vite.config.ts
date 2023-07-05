import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: ['babel-plugin-macros'],
			},
		}),
		viteTsconfigPaths(),
		svgrPlugin(),
	],

	// ==== DEVELOPMENT CONFIGURATION ==== //
	server: {
		host: '0.0.0.0',
		port: 3400,
		https: {
			key: fs.readFileSync(path.resolve(__dirname, '.cert/localhost.key')),
			cert: fs.readFileSync(path.resolve(__dirname, './.cert/localhost.crt')),
			ca: fs.readFileSync(path.resolve(__dirname, './.cert/RootCA.pem')),
		},
	},
});
