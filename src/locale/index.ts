import { AppProps } from "../App";

export default interface Localization {
    components?: {
        App?: {
            defaultProps: Pick<AppProps, 'acceptTitleText' |
                'optInCGUPrefixText' | 'optInCGULinkText' | 'optInCGUAriaLabel' |
                'optInPrivacyPrefixText' | 'optInPrivacyLinkText' | 'optInPrivacyAriaLabel' |
                'optInButtonText' | 'backButtonText' | 'readyButtonText' |
                'selectDeviceText' | 'selectDeviceHelperText' |
                'hangedUpText'>;
        };
    };
}