import { AppProps } from '../App';

export default interface Localization {
	components?: {
		App?: {
			defaultProps: Pick<
				AppProps,
				| 'acceptTitleText'
				| 'cameraErrorText'
				| 'optInCGUPrefixText'
				| 'optInCGULinkText'
				| 'optInCGUAriaLabel'
				| 'optInPrivacyPrefixText'
				| 'optInPrivacyLinkText'
				| 'optInPrivacyAriaLabel'
				| 'optInButtonText'
				| 'backButtonText'
				| 'readyButtonText'
				| 'selectAtLeastOneMediaText'
				| 'selectDeviceText'
				| 'selectDeviceHelperText'
				| 'hangedUpText'
			>;
		};
	};
}
