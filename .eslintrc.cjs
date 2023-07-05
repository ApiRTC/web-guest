module.exports = {
	root: true,
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		jest: true,
		node: true,
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'react', 'prettier'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'prettier',
	],
	rules: {
		// good rules
		'no-undef': 'error',
		'prettier/prettier': 'error',
		'no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
		'no-useless-escape': 'error',
		'@typescript-eslint/no-unused-vars': 'error',
		'prefer-rest-params': 'error',
		'react/no-render-return-value': 'error',
		'no-case-declarations': 'error',
		'no-prototype-builtins': 'error',
		'@typescript-eslint/no-inferrable-types': 'error',
		'react/prop-types': 'error',
		// These rules are the big majority of lint errors, need discussion to see how to handle them
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-var-requires': 'off',
		// Warn for now, to fix
		'@typescript-eslint/ban-types': 'off',
		'no-extra-boolean-cast': 'off',
		// Fix one by one
		'react/jsx-no-target-blank': 'off',
		'@typescript-eslint/no-empty-function': 'off',
		// Keep for now
		'@typescript-eslint/ban-ts-comment': 'off',
	},
	ignorePatterns: ['**/src/html'],
	globals: {
		apiRTC: 'writable',
	},
};
