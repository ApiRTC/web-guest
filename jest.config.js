const esModules = ['@apirtc', '@apirtc/mui-react-lib'].join('|');
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
    collectCoverageFrom: [
        "src/**/{!(getDisplayMedia.mock|index),}.ts"
    ]
};