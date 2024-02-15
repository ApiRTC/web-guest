import Localization from '.';

export const frFR: Localization = {
	components: {
		App: {
			defaultProps: {
				acceptTitleText: 'Documents légaux',
				optInCGUPrefixText: "J'accepte les ",
				optInCGULinkText: "Conditions générales d'utilisation",
				optInCGUAriaLabel: 'conditions-générales',
				optInPrivacyPrefixText: "J'accepte la ",
				optInPrivacyLinkText: 'Politique de confidentialité',
				optInPrivacyAriaLabel: 'politique-confidentialité',
				optInButtonText: 'Confirmer',
				hangedUpText: "L'agent a raccroché.",
			},
		},
		Settings: {
			defaultProps: {
				cameraErrorText: "Vérifiez si votre périphérique n'est pas déjà utilisé.",
				backButtonText: 'Retour',
				readyButtonText: 'Entrer en communication',
				selectAtLeastOneMediaText: 'Veuillez sélectionner au moins un média.',
				selectDeviceHelperText:
					"Avant d'entrer en communication, vérifiez ce que vous partagerez avec votre interlocuteur.",
			},
		},
	},
};
