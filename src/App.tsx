import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { UAParser } from 'ua-parser-js';

import { decode as base64_decode } from 'base-64';

import { Contact, GetOrCreateConversationOptions, JoinOptions, PublishOptions, Stream, UserAgent, UserData } from '@apirtc/apirtc'; //INVITATION_STATUS_ENDED
import {
  Grid as ApiRtcGrid,
  Audio, AudioEnableButton,
  MediaDeviceSelect,
  MuteButton,
  Stream as StreamComponent,
  Video, VideoEnableButton,
  useToggle
} from '@apirtc/mui-react-lib';
import {
  Credentials,
  useCameraStream, useConversation, useConversationStreams, useSession, useUserMediaDevices
} from '@apirtc/react-lib';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import Typography from '@mui/material/Typography/Typography';
import { useThemeProps } from '@mui/material/styles';

import OptInList from './components/Optin/OptInList';
import TextStepper from './components/TextStepper/TextStepper';

//import Keycloak from 'keycloak-js';
import './App.css';
import { loginKeyCloakJS } from './auth/keycloak';
import { VIDEO_ROUNDED_CORNERS } from './constants';
import logo from './assets/apizee.svg';

// WARN : Keep in Sync with m-visio-assist and z-visio
//
type InvitationData = {
  cloudUrl?: string
  apiKey?: string
  conversation: {
    name: string, friendlyName?: string,
    //moderationEnabled?: boolean
    getOrCreateOptions?: GetOrCreateConversationOptions,
    joinOptions?: JoinOptions
  }
  user: {
    firstName: string, lastName: string
  }
  streams: Array<{
    constraints?: MediaStreamConstraints,
    publishOptions?: PublishOptions
  }>
};

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

type FileShared = { fileShared: { link: string, jwt: string } };
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
//const keycloak = new Keycloak(window.location.origin + '/visio-assisted/keycloak.json');
// console.log(window.location.origin + '/visio-assisted/silent-check-sso.html')

const video_sizing = { height: '100%', width: '100%' };

export type AppProps = {
  acceptTitleText?: string,
  optInCGUPrefixText?: string,
  optInCGULinkText?: string,
  optInCGUAriaLabel?: string,
  optInPrivacyPrefixText?: string,
  optInPrivacyLinkText?: string,
  optInPrivacyAriaLabel?: string,
  optInButtonText?: string,
  backButtonText?: string,
  readyButtonText?: string,
  selectDeviceText?: string,
  selectDeviceHelperText?: string,
  // audioInLabel?: string,
  // videoInLabel?: string,
  hangedUpText?: string
};
const COMPONENT_NAME = "App";
function App(inProps: AppProps) {

  const props = useThemeProps({ props: inProps, name: `${COMPONENT_NAME}` });
  const { optInCGUPrefixText = "I agree to the ", optInCGULinkText = "General Terms of Sale", optInCGUAriaLabel = "accept-terms-conditions",
    optInPrivacyPrefixText = "I agree to the ", optInPrivacyLinkText = "Privacy Policy", optInPrivacyAriaLabel = "accept-privacy-policy",
    optInButtonText = "Confirm",
    backButtonText = "Back",
    readyButtonText = "Enter",
    selectDeviceHelperText = "Please check what you want to share before entering the room.",
    // audioInLabel = "Audio In", videoInLabel = "Video In",
    hangedUpText = "The agent hanged up. Bye!"
  } = props;

  const params = useParams();
  const [searchParams] = useSearchParams();

  const [invitationData, setInvitationData] = useState<InvitationData | undefined>(undefined);

  const [facingMode, setFacingMode] = useState<'user' | 'environment' | undefined>();

  // opt-in
  const { value: accepted, toggle: toggleAccepted } = useToggle(false);

  const { value: ready, toggle: toggleReady } = useToggle(false);

  const [imgSrc, setImgSrc] = useState<string>();

  const [hangedUp, setHangedUp] = useState<boolean>(false);

  // ApiRTC hooks
  const { session, disconnect } = useSession(
    invitationData ? { apiKey: invitationData.apiKey } as Credentials : undefined,
    invitationData ? {
      cloudUrl: invitationData.cloudUrl ? invitationData.cloudUrl : 'https://cloud.apirtc.com',
      // SpecifyThis : The customer-side app shall join the <sessionId>-guests group
      // this will allow to share customer side specific info with userData for example
      groups: [invitationData.conversation.name + "-guests"],
      userData: new UserData({ firstName: invitationData.user.firstName, lastName: invitationData.user.lastName })
    } : undefined);
  const { userMediaDevices,
    selectedAudioIn, setSelectedAudioIn,
    selectedVideoIn, setSelectedVideoIn } = useUserMediaDevices(
      session);

  const constraints = useMemo(() => {
    const new_constraints = { ...invitationData?.streams[0].constraints };

    if (new_constraints?.audio) {
      const audioMediaTrackConstraints = new_constraints.audio instanceof Object ? { ...new_constraints.audio } : {};

      if (selectedAudioIn) {
        audioMediaTrackConstraints.deviceId = selectedAudioIn.id;
      }

      new_constraints.audio = audioMediaTrackConstraints;
    }

    if (new_constraints?.video) {
      const videoMediaTrackConstraints = new_constraints.video instanceof Object ? { ...new_constraints.video } : {};

      if (selectedVideoIn) {
        videoMediaTrackConstraints.deviceId = selectedVideoIn.id;
      }

      if (facingMode) {
        if (videoMediaTrackConstraints.advanced) {
          videoMediaTrackConstraints.advanced = videoMediaTrackConstraints.advanced.map((item: any) => {
            if (item.facingMode) {
              return { facingMode: facingMode }
            }
            return item
          });
        } else {
          videoMediaTrackConstraints.advanced = [{ facingMode: facingMode }];
        }
      }

      new_constraints.video = videoMediaTrackConstraints;
    }

    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${COMPONENT_NAME}|useMemo new_constraints`, new_constraints)
    }
    return new_constraints
  }, [invitationData, selectedAudioIn, selectedVideoIn, facingMode]);

  const { stream: localStream } = useCameraStream(accepted ? session : undefined, { constraints: constraints });
  const { conversation } = useConversation(ready ? session : undefined,
    invitationData ? invitationData.conversation.name : undefined,
    invitationData ? invitationData.conversation.getOrCreateOptions : undefined,
    true,
    invitationData ? invitationData.conversation.joinOptions : undefined);
  const { publishedStreams, subscribedStreams } = useConversationStreams(conversation,
    localStream ? [{ stream: localStream, options: invitationData?.streams[0].publishOptions }] : []);

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

  const { value: u_isSelfDisplay, toggle: toggleIsSelfDisplay } = useToggle(false);

  // Force isSelfDisplay to true if there are no streams to subscribe in the room
  const isSelfDisplay = useMemo(() => {
    if (subscribedStreams.length === 0) {
      return true
    }
    return u_isSelfDisplay
  }, [subscribedStreams, u_isSelfDisplay]);

  const [pointer, setPointer] = useState<any>(undefined);

  const getInvitationData = async (invitationId: string, token?: string) => {
    return fetch(`http://localhost:3007/invitations/${invitationId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }).then(response => {
        if (response.status !== 200) {
          return null
        }
        return response.json()
      }).catch((error) => {
        console.error('getInvitationData', error)
      })
  };

  useEffect(() => {
    if (invitationData) {
      const videoMediaTrackConstraints = invitationData.streams[0].constraints?.video;
      if (videoMediaTrackConstraints instanceof Object && videoMediaTrackConstraints.advanced) {
        videoMediaTrackConstraints.advanced.forEach((item: any) => {
          if (item.facingMode) {
            if (globalThis.logLevel.isDebugEnabled) {
              console.debug(`${COMPONENT_NAME}|useEffect invitationData, facingMode`, item.facingMode)
            }
            setFacingMode(item.facingMode)
          }
        })
      }
    }
  }, [invitationData])

  useEffect(() => {
    const handleTabClose = (event: BeforeUnloadEvent) => {
      //event.preventDefault()
      setInvitationData(undefined)
      return undefined
    };
    window.addEventListener('beforeunload', handleTabClose)
    return () => {
      window.removeEventListener('beforeunload', handleTabClose)
    }
  }, [])

  // useEffect(() => {
  //   keycloak.init({
  //     //onLoad: 'login-required', // Loops on refreshes
  //     // onLoad: 'check-sso', // does not seem to change anything
  //     // silentCheckSsoRedirectUri: window.location.origin + '/visio-assisted/silent-check-sso.html',
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
    if (params.invitationData) {
      try {
        const l_data: InvitationData = JSON.parse(base64_decode(params.invitationData)) as InvitationData;
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|InvitationData`, JSON.stringify(l_data))
        }
        setInvitationData(l_data)
      } catch (error) {
        if (error instanceof SyntaxError) {
          const invitationId = params.invitationData;
          loginKeyCloakJS().then((keycloak) => {
            if (globalThis.logLevel.isDebugEnabled) {
              console.debug(`${COMPONENT_NAME}|keycloak.token`, keycloak.token)
            }
            // TODO : use the token to make authenticated call to the API :
            getInvitationData(invitationId).then((data) => {
              if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|getInvitationData`, invitationId, data)
              }
              setInvitationData(data)
            })
          }).catch((error: any) => {
            console.error(`${COMPONENT_NAME}|loginKeyCloakJS error`, error)
          })
        }
      }
    }
  }, [params.invitationData])

  useEffect(() => {
    const i: string | null = searchParams.get("i");
    if (i) {
      try {
        const l_data: InvitationData = JSON.parse(base64_decode(i)) as InvitationData;
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|InvitationData`, JSON.stringify(l_data))
        }
        setInvitationData(l_data)
      } catch (error) {
        console.error(`${COMPONENT_NAME}|parsing i search parameter error`, error)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (session) {
      const userAgent: UserAgent = session.getUserAgent();
      const parser = new UAParser();
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${COMPONENT_NAME}|UAParser`, parser.getResult())
      }
      const userData: UserData = userAgent.getUserData();
      userData.setToSession()
      userData.setProp('systemInfo', JSON.stringify(parser.getResult()))
      // TODO : I was forced to call setUserData again to make it work : check why and how
      // could the api be enhanced regarding userData usage (setToSession is also a pain)
      userAgent.setUserData(userData)
    }
  }, [session])

  useEffect(() => {
    if (session && localStream) {
      // To receive data from contacts
      const onContactData = (contactDataInfo: any) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|onContactData`, contactDataInfo)
        }
        const sender: Contact = contactDataInfo.sender;
        const content: Object = contactDataInfo.content;
        if (isInstanceOfTakeSnapshot(content)) {
          localStream.takeSnapshot(content.takeSnapshot)
            .then((snapshot: any) => {
              if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|takeSnapshot of`, localStream, snapshot)
              }
              //$('#timeline').append('<a><img src="' + snapshot + '" /></a>');
              const fileTransferInvitation = sender.sendFile({ name: `snapshot_${(new Date()).toISOString()}.png`, type: 'image/png' }, snapshot);
              fileTransferInvitation.on('statusChange', (statusChangeInfo: any) => {
                if (globalThis.logLevel.isDebugEnabled) {
                  console.debug(`${COMPONENT_NAME}|statusChange`, statusChangeInfo)
                }
                // To learn about constants look at https://dev.apirtc.com/reference/Constants.html
              });
            }).catch((error: any) => {
              if (globalThis.logLevel.isWarnEnabled) {
                console.warn(`${COMPONENT_NAME}|takeSnapshot error`, error)
              }
            });
        } else if (isInstanceOfSwitchFacingMode(content)) {
          if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|SwitchFacingMode`)
          }
          setFacingMode((prev) => prev === 'user' ? 'environment' : 'user')
        }
      };
      session.on('contactData', onContactData)
      return () => {
        session.removeListener('contactData', onContactData)
      }
    }
  }, [session, localStream])

  useEffect(() => {
    if (session && conversation) {
      // To receive data from contacts
      const onData = (dataInfo: any) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|Conversation onData`, dataInfo)
        }
        // const sender: Contact = dataInfo.sender;
        const content: Object = dataInfo.content;
        if (isInstanceOfFileShared(content)) {
          if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|fileShared`, content)
          }
          fetch(content.fileShared.link,
            {
              method: 'get',
              mode: 'cors',
              headers: new Headers({
                'Authorization': 'Bearer ' + content.fileShared.jwt // session?.getId()
              })
            }
          ).then((res) => { return res.blob() }).then(blob => {
            const url = window.URL.createObjectURL(blob);
            setImgSrc(url)
            // force a state update
            //forceUpdate()
          }).catch((error) => {
            console.error(`${COMPONENT_NAME}|fetch error`, content.fileShared.link, error)
          })
        } else if (isInstanceOfHangup(content)) {
          conversation.leave().then().catch((error) => {
            if (globalThis.logLevel.isWarnEnabled) {
              console.warn(`${COMPONENT_NAME}|conversation leave error`, error)
            }
          }).finally(() => {
            disconnect()
          });
          setHangedUp(true)
        }
      };
      conversation.on('data', onData)
      return () => {
        conversation.removeListener('data', onData)
      }
    }
  }, [conversation, session, disconnect])

  useEffect(() => {
    if (conversation) {
      const on_pointerSharingEnabled = (data: any) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|pointerSharingEnabled`, data)
        }
      };
      conversation.on('pointerSharingEnabled', on_pointerSharingEnabled)

      const on_pointerLocationChanged = (data: any) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|pointerLocationChanged`, data)
        }
        setPointer(data.data);
        setTimeout(() => {
          setPointer(undefined)
        }, 3000)
      };
      conversation.on('pointerLocationChanged', on_pointerLocationChanged)

      conversation.enablePointerSharing(true)

      return () => {
        conversation.removeListener('pointerSharingEnabled', on_pointerSharingEnabled)
        conversation.removeListener('pointerLocationChanged', on_pointerLocationChanged)
      }
    }
  }, [conversation])

  // isSelfDisplay corresponds to published in main

  const getName = (stream: Stream) => {
    const firstName = stream.getContact()?.getUserData().get('firstName');
    const lastName = stream.getContact()?.getUserData().get('lastName');
    if (!firstName && !lastName) {
      return undefined
    }
    return `${firstName ?? ''} ${lastName ?? ''}`
  };

  const subscribedButtonsSize = !isSelfDisplay && subscribedStreams.length <= 2 ? 'large' : undefined;
  const _subscribed = subscribedStreams.map((stream: Stream, index: number) =>
    <StreamComponent id={'subscribed-stream-' + index} key={index}
      sx={{
        ...(stream.hasVideo() ? video_sizing : { backgroundColor: 'grey' })
      }}
      stream={stream}
      name={getName(stream)}
      controls={<>
        <MuteButton size={subscribedButtonsSize} />
        <AudioEnableButton size={subscribedButtonsSize} disabled={true} />
        <VideoEnableButton size={subscribedButtonsSize} disabled={true} /></>}>
      {stream.hasVideo() ?
        <Video
          sx={video_sizing}
          style={{
            ...video_sizing, objectFit: 'cover' as any,
            ...VIDEO_ROUNDED_CORNERS
          }}
        /> :
        <Audio />}
    </StreamComponent>);

  const publishedButtonsSize = isSelfDisplay && publishedStreams.length <= 2 ? 'large' : undefined;
  const _published = publishedStreams.map((stream, index) =>
    <StreamComponent id={'published-stream-' + index} key={index}
      sx={{
        ...(stream.hasVideo() ? video_sizing : { backgroundColor: 'grey' })
      }}
      stream={stream} muted={true}
      controls={<><AudioEnableButton size={publishedButtonsSize} /><VideoEnableButton size={publishedButtonsSize} /></>}>
      {stream.hasVideo() ?
        <Video
          sx={video_sizing}
          style={{
            ...video_sizing, objectFit: 'cover' as any,
            ...VIDEO_ROUNDED_CORNERS
          }}
          pointer={pointer}
        /> :
        <Audio />}
    </StreamComponent>);

  const [activeStep, setActiveStep] = useState(0);
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  useEffect(() => {
    if (activeStep === 1 && !accepted) {
      toggleAccepted()
    }
  }, [activeStep, accepted, toggleAccepted])

  console.log(invitationData)
  return <>
    {!session && <Box display="flex" alignItems="center" justifyContent="center"
      sx={{ mt: 5 }}><img height='320px' width='320px' src={logo} alt="logo" /></Box>}
    {session && !ready &&
      <Container maxWidth="sm" sx={{ height: '100vh' }}>
        <Box sx={{ height: '100%' }} display="flex" alignItems="center" justifyContent="center">
          <Card>
            {/* <CardHeader sx={{ textAlign: 'center' }} title={acceptTitleText} /> */}
            <CardContent>
              <TextStepper activeStep={activeStep} header={<img src={logo} alt="Apizee Logo" height={24}/>}>
                <Step key='legal'>
                    <OptInList optins={[
                      {id: "CGU",
                      labels: {aria: optInCGUAriaLabel, prefix: optInCGUPrefixText, link: optInCGULinkText},
                      link: navigator.language === 'fr' || navigator.language === 'fr-FR' ? "https://cloud.apizee.com/attachments/b87662d7-3e82-4519-a4db-9fb6ba67b5cc/Apizee-ConditionsGeneralesUtilisation.pdf" : "https://cloud.apizee.com/attachments/cb744e03-182b-453e-bbdf-0d89cf42e182/Apizee-TermsOfUse.pdf"},
                      {id: "Privacy",
                      labels: {aria: optInPrivacyAriaLabel, prefix: optInPrivacyPrefixText, link: optInPrivacyLinkText},
                      link: navigator.language === 'fr' || navigator.language === 'fr-FR' ? "https://cloud.apizee.com/attachments/f87493b0-483e-4723-a3ee-02d59a501b1c/Apizee-PolitiqueConfidentialite.pdf" : "https://cloud.apizee.com/attachments/ae61f778-16d1-4dd4-baa1-cd1ba568a0d6/Apizee-PrivacyPolicy.pdf"}
                    ]}
                    labels={{submit: optInButtonText}}
                    onSubmit={handleNext}/>
                </Step>
                <Step key='device-selection'>
                    <Stack sx={{ mt: 1 }} direction={{ xs: 'column' }}
                      alignItems='center' justifyContent='center'
                      useFlexGap flexWrap="wrap"
                      spacing={1}>
                      <Box sx={{ width: '100%', paddingTop: '75%', position: "relative",
                        "& .MuiBox-root": {position: 'absolute'}}}>
                        {localStream ? <StreamComponent sx={{
                          top: 0, left: 0, bottom: 0, right: 0,
                          maxWidth: { xs: '100%', sm: '100%' },
                          ...(!localStream.hasVideo() && { position: 'absolute', inset: 0, borderRadius: '4px', backgroundColor: '#CACCCE' })
                        }}
                          stream={localStream} muted={true}>
                          {localStream.hasVideo() ? 
                          <Video style={{ maxWidth: '100%', ...VIDEO_ROUNDED_CORNERS }} data-testid={`local-video`} /> 
                          : 
                          <Audio data-testid={`local-audio`} />}
                        </StreamComponent> : <Skeleton variant="rectangular"
                          width='100%' height='100%' sx={{ position: 'absolute', top: 0, left: 0 }}/>}
                      </Box>
                      { localStream ? 
                        <Box sx={{ minWidth: '120px', width: '100%', display: "flex" }}>
                          <Box sx={{ width: '3em', height: '3em', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            border: 'solid 1px rgba(0, 0, 0, 0.23)', borderRadius: '4px', boxSizing: 'border-box', flexShrink: 0}}>
                            <Icon>{invitationData?.streams[0].constraints?.audio   ? "mic_on" : "mic_off"}</Icon>
                          </Box>

                          <MediaDeviceSelect sx={{ marginLeft: '0.25em', minWidth: '120px', flexGrow: "1" }}
                            id='audio-in'
                            size='small'
                            // label={audioInLabel}
                            disabled={!invitationData?.streams[0].constraints?.audio}
                            devices={userMediaDevices.audioinput}
                            selectedDevice={selectedAudioIn}
                            setSelectedDevice={setSelectedAudioIn} /> 
                        </Box>
                        :
                        <Skeleton variant="rectangular" width="100%" height="2.5em"/>
                      }
                      { localStream ? 
                        <Box sx={{ minWidth: '120px', width: '100%', display: "flex" }}>
                          <Box sx={{ width: '3em', height: '3em', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            border: 'solid 1px rgba(0, 0, 0, 0.23)', borderRadius: '4px', boxSizing: 'border-box', flexShrink: 0}}>
                            <Icon>{invitationData?.streams[0].constraints?.video ? "videocam_on" : "videocam_off"}</Icon>
                          </Box>
                          
                          <MediaDeviceSelect sx={{ marginLeft: '0.25em', minWidth: '120px', flexGrow: "1" }}
                            id='video-in'
                            size='small'
                            // label={videoInLabel}
                            disabled={!invitationData?.streams[0].constraints?.video}
                            devices={userMediaDevices.videoinput}
                            selectedDevice={selectedVideoIn}
                            setSelectedDevice={setSelectedVideoIn} />
                        </Box>
                        :
                        <Skeleton variant="rectangular" width="100%" height="2.5em"/>
                      }
                    </Stack>
                    <Typography sx={{ mt: 1 }}>{selectDeviceHelperText}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'end', mt: 1 }}>
                      <Button
                        onClick={handleBack}>
                        {backButtonText}
                      </Button>
                      <Button
                        variant='outlined'
                        onClick={toggleReady}>
                        {readyButtonText}
                      </Button>
                    </Box>
                </Step>
              </TextStepper>
            </CardContent>
          </Card>
        </Box>
      </Container>}
    {conversation && ready &&
      <Box sx={{
        position: 'relative',
        height: '99vh', // to prevent vertical scrollbar on Chrome
        // maxHeight: '-webkit-fill-available',
        width: '100vw',
        maxWidth: '100%' // to prevent horizontal scrollbar on Chrome
      }}>
        <ApiRtcGrid sx={{ height: '100%', width: '100%' }}>
          {isSelfDisplay ? _published : _subscribed}
        </ApiRtcGrid>
        <ApiRtcGrid sx={{
          position: 'absolute',
          bottom: 4, left: 4,
          opacity: 0.9,
          height: '34%', width: { xs: '50%', sm: '40%', md: '30%', lg: '20%' },
        }}
          onClick={toggleIsSelfDisplay}>
          {isSelfDisplay ? _subscribed : _published}
        </ApiRtcGrid>
      </Box>}
    {/* 
    <Button onClick={more}>+</Button>
    <Button onClick={less}>-</Button> */}
    {imgSrc && <img src={imgSrc} alt="sharedImg"></img>}
    {hangedUp && <Container maxWidth="md">
      <Alert severity="info">{hangedUpText}</Alert>
    </Container>}
  </>
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