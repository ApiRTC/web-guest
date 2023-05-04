import { AppProps } from "../App";

export default interface Localization {
    components?: {
        App?: {
            defaultProps: Pick<AppProps, 'acceptTitleText' |
                'accept01PrefixText' | 'accept01LinkText' | 'accept01AriaLabel' |
                'accept02PrefixText' | 'accept02LinkText' | 'accept02AriaLabel' |
                'confirmButtonText' |
                'hangedUpText'>;
        };
    };
}