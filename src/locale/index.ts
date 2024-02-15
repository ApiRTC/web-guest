import { AppProps } from '../App';
import { SettingsProps } from '../components/Settings/Settings';

export default interface Localization {
	components?: {
		App?: {
			defaultProps: Pick<
				AppProps,
				| 'acceptTitleText'
				| 'optInCGUPrefixText'
				| 'optInCGULinkText'
				| 'optInCGUAriaLabel'
				| 'optInPrivacyPrefixText'
				| 'optInPrivacyLinkText'
				| 'optInPrivacyAriaLabel'
				| 'optInButtonText'
				| 'hangedUpText'
			>;
		};
		Settings: {
			defaultProps: Pick<
				SettingsProps,
				| 'cameraErrorText'
				| 'backButtonText'
				| 'readyButtonText'
				| 'selectAtLeastOneMediaText'
				| 'selectDeviceHelperText'
			>;
		}
	};
}
