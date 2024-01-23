import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { isMobile } from 'react-device-detect';

import { UAParser } from 'ua-parser-js';

import { decode as base64_decode } from 'base-64';

import { Contact, Stream, UserAgent, UserData } from '@apirtc/apirtc'; //INVITATION_STATUS_ENDED
import {
	Grid as ApiRtcGrid,
	Audio,
	AudioEnableButton,
	MediaDeviceSelect,
	MuteButton,
	Stream as StreamComponent,
	Video,
	VideoEnableButton,
	useToggle,
} from '@apirtc/mui-react-lib';
import {
	Credentials, useCameraStream, useConversation, useConversationStreams,
	useSession, useUserMediaDevices
} from '@apirtc/react-lib';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Icon from '@mui/material/Icon';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import Typography from '@mui/material/Typography/Typography';
import { useThemeProps } from '@mui/material/styles';

import { setLogLevel as setApiRtcMuiReactLibLogLevel } from '@apirtc/mui-react-lib';
import { setLogLevel as setApiRtcReactLibLogLevel } from '@apirtc/react-lib';

import { InvitationData } from '@apirtc/shared-types';

import LogRocket from 'logrocket';

import ErrorPage from './components/Error/ErrorPage';
import OptInList from './components/Optin/OptInList';
import TextStepper from './components/TextStepper/TextStepper';

//import Keycloak from 'keycloak-js';
import './App.css';
import logo from './assets/apizee.svg';
import { loginKeyCloakJS } from './auth/keycloak';
import { VIDEO_ROUNDED_CORNERS } from './constants';
import { LogLevelText, setLogLevel } from './logLevel';

declare var apiRTC: any;

type TakeSnapshot = { takeSnapshot: Object };
function isInstanceOfTakeSnapshot(object: any): object is TakeSnapshot {
	if (typeof object !== 'object') return false;
	return 'takeSnapshot' in object;
}

//type FACING_MODES = 'user' | 'environment';
type SwitchFacingMode = { switchFacingMode: boolean };
function isInstanceOfSwitchFacingMode(object: any): object is SwitchFacingMode {
	if (typeof object !== 'object') return false;
	return 'switchFacingMode' in object;
}

type FileShared = { fileShared: { link: string; jwt: string } };
function isInstanceOfFileShared(object: any): object is FileShared {
	if (typeof object !== 'object') return false;
	return 'fileShared' in object;
}

type HangUp = { hangUp: boolean };
function isInstanceOfHangup(object: any): object is HangUp {
	if (typeof object !== 'object') return false;
	return 'hangUp' in object;
}

// Keycloak
// const keycloak = new Keycloak({
//   url: 'https://idp.apizee.com/auth', realm: 'APIZEE-POC-DGPN', clientId: 'visio-assisted'
// })
//const keycloak = new Keycloak(window.location.origin + '/web-guest/keycloak.json');
// console.log(window.location.origin + '/web-guest/silent-check-sso.html')

const video_sizing = { height: '100%', width: '100%' };

enum RequestParameters {
	invitationId = 'i',
	invitationServiceUrl = 'iU',
	logLevel = 'lL',
	logRocketAppID = 'lRAppID'
}

export type AppProps = {
	acceptTitleText?: string;
	optInCGUPrefixText?: string;
	optInCGULinkText?: string;
	optInCGUAriaLabel?: string;
	optInPrivacyPrefixText?: string;
	optInPrivacyLinkText?: string;
	optInPrivacyAriaLabel?: string;
	optInButtonText?: string;
	backButtonText?: string;
	readyButtonText?: string;
	selectDeviceText?: string;
	selectDeviceHelperText?: string;
	hangedUpText?: string;
};
const COMPONENT_NAME = 'App';
function App(inProps: AppProps) {
	const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });
	const {
		optInCGUPrefixText = 'I agree to the ',
		optInCGULinkText = 'General Terms of Sale',
		optInCGUAriaLabel = 'accept-terms-conditions',
		optInPrivacyPrefixText = 'I agree to the ',
		optInPrivacyLinkText = 'Privacy Policy',
		optInPrivacyAriaLabel = 'accept-privacy-policy',
		optInButtonText = 'Confirm',
		backButtonText = 'Back',
		readyButtonText = 'Enter',
		selectDeviceHelperText = 'Please check what you want to share before entering the room.',
		hangedUpText = 'The agent hanged up. Bye!',
	} = props;

	const params = useParams();
	const [searchParams] = useSearchParams();

	const logLevel = useMemo(() => {
		return searchParams.get(RequestParameters.logLevel) as LogLevelText ?? globalThis.logLevel.level;
	}, [searchParams]);

	useEffect(() => {
		setLogLevel(logLevel)
		setApiRtcReactLibLogLevel(logLevel)
		setApiRtcMuiReactLibLogLevel(logLevel)
		// ApiRTC log level can be set at ApiRTC platform level, per apiKey.
		// Shall we set it here too ?
		//apiRTC.setLogLevel(10)
	}, [logLevel])

	const logRocketAppID = useMemo(() => {
		return searchParams.get(RequestParameters.logRocketAppID);
	}, [searchParams]);

	useEffect(() => {
		// setup logRocket
		if (logRocketAppID && logRocketAppID !== '') {
			if (globalThis.logLevel.isDebugEnabled) {
				console.debug(`${COMPONENT_NAME}|logRocket init`, logRocketAppID);
			}
			LogRocket.init(logRocketAppID);
		}
	}, [logRocketAppID])

	const invitationServiceUrl = useMemo(() => {
		return searchParams.get(RequestParameters.invitationServiceUrl) ?? 'https://is.dev.apizee.com/invitations';
	}, [searchParams]);

	const [invitationData, setInvitationData] = useState<InvitationData | undefined>(undefined);
	const [invitationError, setInvitationError] = useState<boolean>(false);
	const [invitationErrorStatus, setInvitationErrorStatus] = useState<number | undefined>(
		undefined
	);

	const [facingMode, setFacingMode] = useState<ConstrainDOMString | undefined>();

	const [streamAudioEnabled, setStreamAudioEnabled] = useState<boolean | undefined>(undefined);
	const [streamVideoEnabled, setStreamVideoEnabled] = useState<boolean | undefined>(undefined);

	// stepper
	const [activeStep, setActiveStep] = useState(0);
	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};
	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	// opt-in
	const optInAccepted = useMemo(() => activeStep >= 1, [activeStep]);

	const { value: ready, toggle: toggleReady } = useToggle(false);

	const [imgSrc, setImgSrc] = useState<string>();

	const [hangedUp, setHangedUp] = useState<boolean>(false);

	// ApiRTC hooks
	//

	const credentials = useMemo(() =>
		invitationData ? ({ apiKey: invitationData.apiKey } as Credentials) : undefined,
		[invitationData]);

	const registerInformation = useMemo(() =>
		invitationData
			? {
				cloudUrl: invitationData.cloudUrl
					? invitationData.cloudUrl
					: 'https://cloud.apirtc.com',
				// SpecifyThis : The customer-side app shall join the <sessionId>-guests group
				// this will allow to share customer side specific info with userData for example
				groups: [`${invitationData.conversation.name}-guests`],
				userData: new UserData({
					firstName: invitationData.user.firstName,
					lastName: invitationData.user.lastName,
				}),
			}
			: undefined,
		[invitationData]);

	const { session, disconnect } = useSession(credentials, registerInformation);

	const {
		userMediaDevices,
		selectedAudioIn, selectedAudioInId,
		setSelectedAudioIn,
		selectedVideoIn, selectedVideoInId,
		setSelectedVideoIn,
	} = useUserMediaDevices(session, isMobile ? undefined : 'apirtc-web-guest');

	const userMediaStreamRequest = useMemo(() => invitationData ?
		invitationData.streams.find((obj) => { return (obj.type === 'user-media') })
		: undefined,
		[invitationData]);

	const displayMediaStreamRequest = useMemo(() => invitationData ?
		invitationData.streams.find((obj) => { return (obj.type === 'display-media') })
		: undefined,
		[invitationData]);

	useEffect(() => {
		if (session && invitationData) {
			// enable callStatsMonitoring for support
			session.getUserAgent().enableCallStatsMonitoring(invitationData.callStatsMonitoringInterval !== undefined,
				{ interval: invitationData.callStatsMonitoringInterval })
		}
	}, [session, invitationData])

	// set facingMode according to invitation
	useEffect(() => {
		if (userMediaStreamRequest) {
			const audioMediaTrackConstraints = userMediaStreamRequest.constraints?.audio;
			const videoMediaTrackConstraints = userMediaStreamRequest.constraints?.video;

			setStreamAudioEnabled(Boolean(audioMediaTrackConstraints));
			setStreamVideoEnabled(Boolean(videoMediaTrackConstraints));

			if (videoMediaTrackConstraints instanceof Object) {
				if (globalThis.logLevel.isDebugEnabled) {
					console.debug(`${COMPONENT_NAME}|useEffect invitationData has video constraints`, videoMediaTrackConstraints);
				}
				if (videoMediaTrackConstraints.facingMode) {
					setFacingMode(videoMediaTrackConstraints.facingMode)
				}
			}
		}
	}, [userMediaStreamRequest])

	// This useEffect MUST happen before 'constraints' useMemo
	useEffect(() => {
		if (isMobile) {
			// Consider facing mode is for mobile only.

			if (selectedVideoIn) {
				// if a specific device was selected by the user, clear this selection
				// to let facingMode be taken into account in 'constraints' rebuild
				setSelectedVideoIn(undefined)
			}

			if (facingMode === 'environment') {
				setSelfDisplay(true)
			}
		}
	}, [facingMode])

	const createStreamOptions = useMemo(() => {
		const new_constraints = { ...userMediaStreamRequest?.constraints };

		if (new_constraints?.audio && (streamAudioEnabled === undefined || streamAudioEnabled)) {
			const audioMediaTrackConstraints =
				new_constraints.audio instanceof Object ? { ...new_constraints.audio } : {};

			if (selectedAudioInId) {
				audioMediaTrackConstraints.deviceId = selectedAudioInId;
			}

			new_constraints.audio = audioMediaTrackConstraints;
		} else {
			new_constraints.audio = false;
		}

		if (new_constraints?.video && (streamVideoEnabled === undefined || streamVideoEnabled)) {
			const videoMediaTrackConstraints =
				new_constraints.video instanceof Object ? { ...new_constraints.video } : {};

			if (selectedVideoInId) {
				videoMediaTrackConstraints.deviceId = selectedVideoInId;
				// Do not leave a facingMode set if a deviceId was selected.
				delete videoMediaTrackConstraints.facingMode;
			} else if (facingMode) {
				videoMediaTrackConstraints.facingMode = facingMode;
				// Do not leave a deviceId set if facingMode is activated.
				delete videoMediaTrackConstraints.deviceId;

				// When using advanced, on Chrome and Android, even if deviceId is set to a user facingMode device,
				// the environment will be forced.
				// COMMENTED-OUT: because it prevents the user from selecting another device.
				// To fix the wrongly selected user device display, we now use userUserMediaDevices hook with no local storage.
				// if (videoMediaTrackConstraints.advanced) {
				// 	videoMediaTrackConstraints.advanced = videoMediaTrackConstraints.advanced.map(
				// 		(item: any) => {
				// 			if (item.facingMode) {
				// 				return { facingMode: facingMode };
				// 			}
				// 			return item;
				// 		}
				// 	);
				// } else {
				// 	videoMediaTrackConstraints.advanced = [{ facingMode: facingMode }];
				// }
			}

			new_constraints.video = videoMediaTrackConstraints;
		} else {
			new_constraints.video = false;
		}

		if (globalThis.logLevel.isDebugEnabled) {
			console.debug(`${COMPONENT_NAME}|useMemo new_constraints`, new_constraints);
		}

		return {
			constraints: new_constraints
		};
	}, [
		userMediaStreamRequest,
		selectedAudioInId,
		selectedVideoInId,
		facingMode,
		streamAudioEnabled,
		streamVideoEnabled,
	]);

	const { stream: localStream } = useCameraStream(
		optInAccepted && userMediaStreamRequest ? session : undefined,
		createStreamOptions);

	// getCapabilities does not work on firefox
	// useEffect(() => {
	// 	if (localStream) {
	// 		console.log("getCapabilities", localStream, localStream.getCapabilities())
	// 	}
	// }, [localStream])

	const [screen, setScreen] = useState<Stream>();

	const { conversation } = useConversation(
		session,
		invitationData ? invitationData.conversation.name : undefined,
		invitationData ? invitationData.conversation.getOrCreateOptions : undefined,
		true,
		invitationData ? invitationData.conversation.joinOptions : undefined
	);

	const streamsToPublish = useMemo(() => [
		...(localStream && ready ? [{ stream: localStream, options: userMediaStreamRequest?.publishOptions }] : []),
		...(screen ? [{ stream: screen }] : [])],
		[ready, localStream, userMediaStreamRequest, screen]);

	const { publishedStreams, subscribedStreams } = useConversationStreams(conversation, streamsToPublish);

	const doSendData = useCallback((data: any) => {
		if (conversation) {
			conversation.sendData(data).then(() => {
				if (globalThis.logLevel.isDebugEnabled) {
					console.log(`${COMPONENT_NAME}|conversation sendData`, data)
				}
			}).catch((error: any) => {
				if (globalThis.logLevel.isWarnEnabled) {
					console.warn(`${COMPONENT_NAME}|conversation sendData error`, error)
				}
			})
		}
	}, [conversation]);

	const shareScreen = () => {
		if (globalThis.logLevel.isDebugEnabled) {
			console.debug(`${COMPONENT_NAME}|shareScreen calls createDisplayMediaStream`)
		}
		Stream.createDisplayMediaStream({}, false).then((localStream: Stream) => {
			if (globalThis.logLevel.isInfoEnabled) {
				console.info(`${COMPONENT_NAME}|createDisplayMediaStream`, localStream)
			}
			setScreen(localStream)
		}).catch((error: any) => {
			console.error(`${COMPONENT_NAME}|createDisplayMediaStream error`, error)
		}).finally(() => {
			// setGrabbing(false)
		})
	};

	// For testing purpose
	// const [localStreams, setLocalStreams] = useState<Stream[]>(localStream ? [localStream] : []);
	// const more = () => {
	//   if (localStream) {
	//     localStreams.push(localStream)
	//     setLocalStreams(Array.from(localStreams))
	//   }
	// };
	// const less = () => {
	//   localStreams.pop()
	//   setLocalStreams(Array.from(localStreams))
	// };
	// const subscribedStreams = useMemo(() => [...t_subscribedStreams, ...localStreams], [t_subscribedStreams, localStreams]);

	// isSelfDisplay corresponds to published in main
	const { value: u_isSelfDisplay, setValue: setSelfDisplay, toggle: toggleIsSelfDisplay } = useToggle(false);

	const [selectedSubscribeStream, setSelectedSubscribeStream] = useState<Stream>();
	// TODO: when a stream is selected, unsubscribe to others and resubscribe when unselected.. ?

	useEffect(() => {
		// Auto select a screen share as the selectedSubscribedStream, to display it alone
		const screenShared = subscribedStreams.find((stream) => stream.isScreensharing());
		setSelectedSubscribeStream(screenShared ? screenShared : undefined)
	}, [subscribedStreams])

	// Force isSelfDisplay to true if there are no streams to subscribe in the room
	const isSelfDisplay = useMemo(() => {
		if (subscribedStreams.length === 0) {
			return true;
		}
		return u_isSelfDisplay;
	}, [subscribedStreams, u_isSelfDisplay]);

	const [pointer, setPointer] = useState<any>({});

	const getInvitationData = async (invitationId: string, token?: string) => {
		return fetch(`${invitationServiceUrl}/${invitationId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		}).then((response) => {
			if (response.status !== 200) {
				return null;
			}
			return response.json();
		}).catch((error) => {
			console.error(`${COMPONENT_NAME}|getInvitationData`, error);
		});
	};

	useEffect(() => {
		const handleTabClose = (event: BeforeUnloadEvent) => {
			//event.preventDefault()
			setInvitationData(undefined);
			return undefined;
		};
		window.addEventListener('beforeunload', handleTabClose);
		return () => {
			window.removeEventListener('beforeunload', handleTabClose);
		};
	}, [])

	// useEffect(() => {
	//   keycloak.init({
	//     //onLoad: 'login-required', // Loops on refreshes
	//     // onLoad: 'check-sso', // does not seem to change anything
	//     // silentCheckSsoRedirectUri: window.location.origin + '/web-guest/silent-check-sso.html',
	//     //silentCheckSsoFallback: false
	//   }).then((auth) => {
	//     console.log("Keycloak.init", auth)
	//     if (!auth) {
	//       console.log("Keycloak NOT authenticated...")
	//     } else {
	//       console.log("Keycloak authenticated", auth, keycloak.token)
	//     }
	//   }).catch((error: any) => {
	//     console.error('keycloak.init', error)
	//   });
	// }, [])

	useEffect(() => {
		const i: string | null = searchParams.get(RequestParameters.invitationId);
		if (i) {
			try {
				const l_data: InvitationData = JSON.parse(base64_decode(i)) as InvitationData;
				if (globalThis.logLevel.isDebugEnabled) {
					console.debug(`${COMPONENT_NAME}|InvitationData`, JSON.stringify(l_data));
				}
				setInvitationData(l_data);
			} catch (error) {
				if (error instanceof SyntaxError) {
					getInvitationData(i).then((body) => {
						if (globalThis.logLevel.isInfoEnabled) {
							console.info(`${COMPONENT_NAME}|getInvitationData`, i, body);
						}
						setInvitationData(body.data);
					});
					return
				} else {
					console.error(`${COMPONENT_NAME}|parsing i search parameter error`, error);
					setInvitationError(true);
				}
			}
		}
	}, [searchParams]);

	useEffect(() => {
		if (params.invitationData) {
			try {
				const l_data: InvitationData = JSON.parse(
					base64_decode(params.invitationData)
				) as InvitationData;
				if (globalThis.logLevel.isDebugEnabled) {
					console.debug(`${COMPONENT_NAME}|InvitationData`, JSON.stringify(l_data));
				}
				setInvitationData(l_data);
			} catch (error) {
				if (error instanceof SyntaxError) {
					const invitationId = params.invitationData;
					loginKeyCloakJS().then((keycloak) => {
						if (globalThis.logLevel.isDebugEnabled) {
							console.debug(`${COMPONENT_NAME}|keycloak.token`, keycloak.token);
						}
						// TODO : use the token to make authenticated call to the API :
						getInvitationData(invitationId).then((data) => {
							if (globalThis.logLevel.isDebugEnabled) {
								console.debug(`${COMPONENT_NAME}|getInvitationData`, invitationId, data);
							}
							setInvitationData(data);
						});
					}).catch((error: any) => {
						console.error(`${COMPONENT_NAME}|loginKeyCloakJS error`, error);
					});
				}
			}
		}
	}, [params.invitationData]);

	useEffect(() => {
		if (invitationData && session) {
			if (globalThis.logLevel.isDebugEnabled) {
				console.debug(`${COMPONENT_NAME}|logRocket identify`, invitationData.conversation.name, session.getId());
			}
			LogRocket.identify(`${invitationData.conversation.name}-${session.getId()}`);
		}
	}, [invitationData, session])

	useEffect(() => {
		if (session) {
			const userAgent: UserAgent = session.getUserAgent();
			const parser = new UAParser();
			if (globalThis.logLevel.isDebugEnabled) {
				console.debug(`${COMPONENT_NAME}|UAParser`, parser.getResult());
			}
			const userData: UserData = userAgent.getUserData();
			userData.setToSession();
			userData.setProp('systemInfo', JSON.stringify(parser.getResult()));
			// TODO : I was forced to call setUserData again to make it work : check why and how
			// could the api be enhanced regarding userData usage (setToSession is also a pain)
			userAgent.setUserData(userData);
		}
	}, [session]);

	useEffect(() => {
		if (session && localStream) {
			// To receive data from contacts
			const onContactData = (contactDataInfo: any) => {
				if (globalThis.logLevel.isDebugEnabled) {
					console.debug(`${COMPONENT_NAME}|onContactData`, contactDataInfo);
				}
				const sender: Contact = contactDataInfo.sender;
				const content: Object = contactDataInfo.content;
				if (isInstanceOfTakeSnapshot(content)) {
					localStream.takeSnapshot(content.takeSnapshot)
						.then((snapshot: any) => {
							if (globalThis.logLevel.isDebugEnabled) {
								console.debug(`${COMPONENT_NAME}|takeSnapshot of`, localStream, snapshot);
							}
							//$('#timeline').append('<a><img src="' + snapshot + '" /></a>');
							const fileTransferInvitation = sender.sendFile(
								{
									name: `snapshot_${new Date().toISOString()}.png`,
									type: 'image/png',
								}, snapshot
							);
							fileTransferInvitation.on('statusChange', (statusChangeInfo: any) => {
								if (globalThis.logLevel.isDebugEnabled) {
									console.debug(`${COMPONENT_NAME}|statusChange`, statusChangeInfo);
								}
								// To learn about constants look at https://dev.apirtc.com/reference/Constants.html
							});
						}).catch((error: any) => {
							if (globalThis.logLevel.isWarnEnabled) {
								console.warn(`${COMPONENT_NAME}|takeSnapshot error`, error);
							}
						});
				} else if (isInstanceOfSwitchFacingMode(content)) {
					if (globalThis.logLevel.isDebugEnabled) {
						console.debug(`${COMPONENT_NAME}|SwitchFacingMode`);
					}
					setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
				}
			};
			session.on('contactData', onContactData);
			return () => {
				session.removeListener('contactData', onContactData);
			};
		}
	}, [session, localStream]);

	useEffect(() => {
		if (conversation) {
			// To receive data from contacts
			const onData = (dataInfo: any) => {
				if (globalThis.logLevel.isDebugEnabled) {
					console.debug(`${COMPONENT_NAME}|Conversation onData`, dataInfo);
				}
				// const sender: Contact = dataInfo.sender;
				const content: Object = dataInfo.content;
				if (isInstanceOfFileShared(content)) {
					if (globalThis.logLevel.isDebugEnabled) {
						console.debug(`${COMPONENT_NAME}|fileShared`, content);
					}
					fetch(content.fileShared.link, {
						method: 'get',
						mode: 'cors',
						headers: new Headers({
							Authorization: `Bearer ${content.fileShared.jwt}`
						}),
					}).then((res) => {
						return res.blob();
					}).then((blob) => {
						const url = window.URL.createObjectURL(blob);
						setImgSrc(url);
						// force a state update
						//forceUpdate()
					}).catch((error) => {
						console.error(`${COMPONENT_NAME}|fetch error`, content.fileShared.link, error);
					});
				} else if (isInstanceOfHangup(content)) {
					conversation.leave().then()
						.catch((error) => {
							if (globalThis.logLevel.isWarnEnabled) {
								console.warn(`${COMPONENT_NAME}|conversation leave error`, error);
							}
						}).finally(() => {
							disconnect();
						});
					setHangedUp(true);
				}
			};
			conversation.on('data', onData);
			return () => {
				conversation.removeListener('data', onData);
			};
		}
	}, [conversation, disconnect]);

	useEffect(() => {
		if (conversation) {
			const on_pointerSharingEnabled = (data: any) => {
				if (globalThis.logLevel.isDebugEnabled) {
					console.debug(`${COMPONENT_NAME}|pointerSharingEnabled`, data);
				}
			};
			conversation.on('pointerSharingEnabled', on_pointerSharingEnabled);

			const on_pointerLocationChanged = (event: any) => {
				if (globalThis.logLevel.isDebugEnabled) {
					console.debug(`${COMPONENT_NAME}|pointerLocationChanged`, event);
				}
				setPointer((pointer: Object) => { return { ...pointer, [event.source.contactId]: event.data } });
				setTimeout(() => {
					setPointer((pointer: any) => {
						delete pointer[event.source.contactId];
						return { pointer }
					});
				}, 3000);
			};
			conversation.on('pointerLocationChanged', on_pointerLocationChanged);

			conversation.enablePointerSharing(true);

			return () => {
				conversation.removeListener('pointerSharingEnabled', on_pointerSharingEnabled);
				conversation.removeListener('pointerLocationChanged', on_pointerLocationChanged);
			};
		}
	}, [conversation]);

	const onStreamMouseDown = useCallback((stream: Stream, event: React.MouseEvent) => {
		if (globalThis.logLevel.isDebugEnabled) {
			console.debug(`${COMPONENT_NAME}|onStreamMouseDown`, stream.getId(), event)
		}
		// x and y are useless, make it 0, 0 to enforce this
		if (conversation) {
			conversation.sendPointerLocation({
				streamId: stream.getId(),
				contactId: stream.getContact() ? stream.getContact().getId() : apiRTC.userAgentInstance.userId
			}, 0, 0, {
				top: `${Math.round(event.nativeEvent.offsetY * 100 / (event.nativeEvent.target as HTMLVideoElement).offsetHeight)}%`,
				left: `${Math.round(event.nativeEvent.offsetX * 100 / (event.nativeEvent.target as HTMLVideoElement).offsetWidth)}%`
			})
		}
	}, [conversation]);

	useEffect(() => {
		if (screen) {
			screen.on('stopped', () => {
				if (globalThis.logLevel.isInfoEnabled) {
					console.log(`${COMPONENT_NAME}|The user has ended sharing the screen`);
				}
				setScreen(undefined)
			});
			return () => {
				screen.release()
			}
		}
	}, [screen])

	// Commented out to prefer using Conversation contactJoined, instead of having to use a setTimeout
	// Also this saves a sendData
	// useEffect(() => {
	// 	if (joined) {
	// 		// Note : Trying to send data too immediately after joined does not work
	// 		// Fixed by delaying it a bit 
	// 		setTimeout(() => {
	// 			doSendData({
	// 				type: 'timeline-event',
	// 				event: 'joined'
	// 			})
	// 		}, 100)
	// 	}
	// }, [doSendData, joined])

	useEffect(() => {
		if (optInAccepted) {
			doSendData({
				type: 'timeline-event',
				event: 'opt-in-accepted'
			})
		}
	}, [doSendData, optInAccepted])

	useEffect(() => {
		if (localStream) {
			doSendData({
				type: 'timeline-event',
				event: 'camera-stream-grabbed'
			})
		}
	}, [doSendData, localStream])

	useEffect(() => {
		if (ready) {
			doSendData({
				type: 'timeline-event',
				event: 'enter-room'
			})
		}
	}, [doSendData, ready])

	const getName = (stream: Stream) => {
		const firstName = stream.getContact()?.getUserData().get('firstName');
		const lastName = stream.getContact()?.getUserData().get('lastName');
		if (!firstName && !lastName) {
			return undefined;
		}
		return `${firstName ?? ''} ${lastName ?? ''}`;
	};

	const subscribedButtonsSize =
		!isSelfDisplay && subscribedStreams.length <= 2 ? 'large' : undefined;

	const _subscribedStream = (stream: Stream, index: number) => <StreamComponent
		id={`subscribed-stream-${index}`}
		key={index}
		sx={{
			...(stream.hasVideo() ? video_sizing : { backgroundColor: 'grey' }),
		}}
		stream={stream}
		name={getName(stream)}
		controls={
			<>
				{stream.hasAudio() && <MuteButton size={subscribedButtonsSize} />}
				<AudioEnableButton size={subscribedButtonsSize} disabled={true} />
				{stream.hasVideo() && <VideoEnableButton size={subscribedButtonsSize} disabled={true} />}
			</>
		}
		onClick={!isSelfDisplay ? () => {
			setSelectedSubscribeStream((current) => current ? undefined : stream)
		} : undefined}>
		{stream.hasVideo() ? (
			<Video
				sx={video_sizing}
				style={{
					...video_sizing,
					objectFit: stream.isScreensharing() ? 'contain' : (pointer[stream.getContact().getId()] ? 'fill' : 'cover'),
					...VIDEO_ROUNDED_CORNERS,
				}}
				pointer={pointer[stream.getContact().getId()]}
				onMouseDown={(event: React.MouseEvent) => {
					onStreamMouseDown(stream, event)
				}}
			/>
		) : (
			<Audio />
		)}
	</StreamComponent>

	const _subscribed = selectedSubscribeStream ? _subscribedStream(selectedSubscribeStream, 0)
		: subscribedStreams.map((stream: Stream, index: number) => _subscribedStream(stream, index));

	const publishedButtonsSize =
		isSelfDisplay && publishedStreams.length <= 2 ? 'large' : undefined;
	const _published = publishedStreams.map((stream, index) => (
		<StreamComponent
			id={`published-stream-${index}`}
			key={index}
			sx={{
				...(stream.hasVideo() ? video_sizing : { backgroundColor: 'grey' }),
			}}
			stream={stream}
			muted={true}
			controls={
				<>
					<AudioEnableButton size={publishedButtonsSize} />
					<VideoEnableButton size={publishedButtonsSize} />
				</>
			}>
			{stream.hasVideo() ? (
				<Video
					sx={video_sizing}
					style={{
						...video_sizing,
						objectFit: pointer[apiRTC.userAgentInstance.userId] ? 'fill' : 'cover', //or (session as any).user.userId
						...VIDEO_ROUNDED_CORNERS,
					}}
					pointer={pointer[apiRTC.userAgentInstance.userId]}
					onMouseDown={(event: React.MouseEvent) => {
						onStreamMouseDown(stream, event)
					}}
				/>
			) : (
				<Audio />
			)}
		</StreamComponent>
	));

	return (
		<>
			{!session && !invitationError && (
				<Box display="flex" alignItems="center" justifyContent="center" sx={{ mt: 5 }}>
					<img height="320px" width="320px" src={logo} alt="logo" />
				</Box>
			)}

			{invitationError && <ErrorPage errorType={invitationErrorStatus}></ErrorPage>}
			{session && !invitationError && !ready && (
				<Container maxWidth="sm" sx={{ height: '100vh' }}>
					<Box
						sx={{ height: '100%' }}
						display="flex"
						alignItems="center"
						justifyContent="center">
						<Card>
							{/* <CardHeader sx={{ textAlign: 'center' }} title={acceptTitleText} /> */}
							<CardContent>
								<TextStepper
									activeStep={activeStep}
									header={<img src={logo} alt="Apizee Logo" height={24} />}>
									<Step key="legal">
										<OptInList
											optIns={[
												{
													id: 'CGU',
													labels: {
														aria: optInCGUAriaLabel,
														prefix: optInCGUPrefixText,
														link: optInCGULinkText,
													},
													link:
														navigator.language === 'fr' ||
															navigator.language === 'fr-FR'
															? 'https://cloud.apizee.com/attachments/b87662d7-3e82-4519-a4db-9fb6ba67b5cc/Apizee-ConditionsGeneralesUtilisation.pdf'
															: 'https://cloud.apizee.com/attachments/cb744e03-182b-453e-bbdf-0d89cf42e182/Apizee-TermsOfUse.pdf',
												},
												{
													id: 'Privacy',
													labels: {
														aria: optInPrivacyAriaLabel,
														prefix: optInPrivacyPrefixText,
														link: optInPrivacyLinkText,
													},
													link:
														navigator.language === 'fr' ||
															navigator.language === 'fr-FR'
															? 'https://cloud.apizee.com/attachments/f87493b0-483e-4723-a3ee-02d59a501b1c/Apizee-PolitiqueConfidentialite.pdf'
															: 'https://cloud.apizee.com/attachments/ae61f778-16d1-4dd4-baa1-cd1ba568a0d6/Apizee-PrivacyPolicy.pdf',
												},
											]}
											labels={{ submit: optInButtonText }}
											onSubmit={handleNext}
										/>
									</Step>
									<Step key="device-selection">
										{userMediaStreamRequest &&
											<Stack
												sx={{ mt: 1 }}
												direction={{ xs: 'column' }}
												alignItems="center"
												justifyContent="center"
												useFlexGap
												flexWrap="wrap"
												spacing={1}>
												<Box
													sx={{
														width: '100%',
														paddingTop: '75%',
														position: 'relative',
														'& .MuiBox-root': {
															position: 'absolute',
															height: '100%',
															maxWidth: '100%',
														},
													}}>
													{localStream ? (
														<StreamComponent
															sx={{
																top: 0,
																left: 0,
																bottom: 0,
																right: 0,
																maxWidth: { xs: '100%', sm: '100%' },
																...(!localStream.hasVideo() && {
																	position: 'absolute',
																	inset: 0,
																	borderRadius: '4px',
																	backgroundColor: '#CACCCE',
																}),
															}}
															stream={localStream}
															muted={true}>
															{localStream.hasVideo() ? (
																<Video
																	style={{
																		height: '100%',
																		...VIDEO_ROUNDED_CORNERS,
																	}}
																	data-testid={`local-video`}
																/>
															) : (
																<Audio data-testid={`local-audio`} />
															)}
														</StreamComponent>
													) : (
														<Skeleton
															variant="rectangular"
															width="100%"
															height="100%"
															sx={{
																position: 'absolute',
																top: 0,
																left: 0,
															}}
														/>
													)}
												</Box>
												<Box
													sx={{
														minWidth: '120px',
														width: '100%',
														display: 'flex',
													}}>
													<Button
														sx={{
															minWidth: 0,
															width: '3em',
															height: '3em',
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
															border: 'solid 1px rgba(0, 0, 0, 0.23)',
															borderRadius: '4px',
															boxSizing: 'border-box',
															flexShrink: 0,
															color: 'black',
														}}
														disabled={
															!userMediaStreamRequest.constraints
																?.audio
														}
														onClick={() =>
															setStreamAudioEnabled(!streamAudioEnabled)
														}>
														<Icon>
															{createStreamOptions.constraints.audio ? 'mic_on' : 'mic_off'}
														</Icon>
													</Button>
													<MediaDeviceSelect
														sx={{
															marginLeft: '0.25em',
															minWidth: '120px',
															flexGrow: '1',
														}}
														id="audio-in"
														size="small"
														disabled={!createStreamOptions.constraints.audio}
														devices={userMediaDevices.audioinput}
														selectedDevice={selectedAudioIn}
														setSelectedDevice={setSelectedAudioIn}
													/>
												</Box>
												<Box
													sx={{
														minWidth: '120px',
														width: '100%',
														display: 'flex',
													}}>
													<Button
														sx={{
															minWidth: 0,
															width: '3em',
															height: '3em',
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
															border: 'solid 1px rgba(0, 0, 0, 0.23)',
															borderRadius: '4px',
															boxSizing: 'border-box',
															flexShrink: 0,
															color: 'black',
														}}
														disabled={
															!userMediaStreamRequest.constraints
																?.video
														}
														onClick={() => {
															setStreamVideoEnabled(!streamVideoEnabled);
														}}>
														<Icon>
															{createStreamOptions.constraints.video
																? 'videocam_on'
																: 'videocam_off'}
														</Icon>
													</Button>

													<MediaDeviceSelect
														sx={{
															marginLeft: '0.25em',
															minWidth: '120px',
															flexGrow: '1',
														}}
														id="video-in"
														size="small"
														disabled={!createStreamOptions.constraints.video}
														devices={userMediaDevices.videoinput}
														selectedDevice={selectedVideoIn}
														setSelectedDevice={setSelectedVideoIn}
													/>
												</Box>
											</Stack>}
										{displayMediaStreamRequest && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
											<Button variant='outlined' color='primary'
												onClick={shareScreen}>share screen</Button>
										</Box>}
										<Typography sx={{ mt: 1 }}>
											{selectDeviceHelperText}
										</Typography>
										<Box sx={{ display: 'flex', justifyContent: 'end', mt: 1 }}>
											<Button onClick={handleBack}>{backButtonText}</Button>
											<Button variant="outlined"
												disabled={displayMediaStreamRequest && !screen || (userMediaStreamRequest && (!streamAudioEnabled && !streamVideoEnabled))}
												onClick={toggleReady}>
												{readyButtonText}
											</Button>
										</Box>
									</Step>
								</TextStepper>
							</CardContent>
						</Card>
					</Box>
				</Container>
			)}
			{conversation && ready && (
				<Box
					sx={{
						position: 'relative',
						height: '99vh', // to prevent vertical scrollbar on Chrome
						// maxHeight: '-webkit-fill-available',
						width: '100vw',
						maxWidth: '100%', // to prevent horizontal scrollbar on Chrome
					}}>
					<ApiRtcGrid sx={{ height: '100%', width: '100%' }}>
						{isSelfDisplay ? _published : _subscribed}
					</ApiRtcGrid>
					<ApiRtcGrid
						sx={{
							position: 'absolute',
							bottom: 4,
							left: 4,
							opacity: 0.9,
							height: '34%',
							width: { xs: '50%', sm: '40%', md: '30%', lg: '20%' },
						}}
						onClick={toggleIsSelfDisplay}>
						{isSelfDisplay ? _subscribed : _published}
					</ApiRtcGrid>
				</Box>
			)}
			{/* 
    <Button onClick={more}>+</Button>
    <Button onClick={less}>-</Button> */}
			{imgSrc && <img src={imgSrc} alt="sharedImg"></img>}
			{hangedUp && (
				<Container maxWidth="md">
					<Alert severity="info">{hangedUpText}</Alert>
				</Container>
			)}
		</>
	);
}

export default App;

// {session &&
//       <div>
//         <p>{session.getUserAgent().getUserData().get('systemInfo')}</p>
//       </div>}
// <Button variant="contained" onClick={(e: React.SyntheticEvent) => {
//     e.preventDefault();
//     keycloak.login().then(
//       (auth: any) => {
//         console.log("Keycloak.login", auth)
//         alert("auth" + JSON.stringify(auth))
//         if (!auth) {
//           console.log("Keycloak NOT authenticated...")
//         } else {
//           console.log("Keycloak authenticated", auth)
//         }
//       }
//     )
//   }}>Login with Keycloak</Button>
// CANT make a call from button, because this is not called back when redirected...
// {invitationData &&
//     <Typography align='center' variant='h2'>Hello {invitationData.user.firstName}</Typography>
//   }
// <Grid container spacing={0}
//     direction="column"
//     alignItems="center"
//     justifyContent="center">
//     <Grid item xs={3}>
//       {invitationData ?
//         <>
//           <div>
//             {invitationData.conversation.friendlyName && <span>Conversation {invitationData.conversation.friendlyName}</span>}
//           </div>
//         </> : <div>no invitationData</div>}
//     </Grid>
//   </Grid>
