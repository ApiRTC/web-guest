import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { UAParser } from 'ua-parser-js';

import { decode as base64_decode } from 'base-64';

import { Contact, GetOrCreateConversationOptions, PublishOptions, Stream, UserAgent, UserData } from '@apirtc/apirtc'; //INVITATION_STATUS_ENDED
import {
  Audio, AudioEnableButton, Grid as RemoteStreamsGrid, MuteButton,
  Stream as StreamComponent, Video, VideoEnableButton
} from '@apirtc/mui-react-lib';
import { Credentials, useCameraStream, useConversation, useConversationStreams, useSession } from '@apirtc/react-lib';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import Keycloak from 'keycloak-js';
import { loginKeyCloakJS } from './auth/keycloak';

import Container from '@mui/material/Container';
import './App.css';
import logo from './logo.svg';

// WARN: Keep in Sync with m-visio-assist
type InvitationData = {
  cloudUrl?: string
  apiKey?: string
  conversation: {
    name: string, friendlyName?: string,
    getOrCreateOptions?: GetOrCreateConversationOptions
  }
  user: {
    firstName: string, lastName: string
  }
  camera: {
    constraints?: MediaStreamConstraints,
    publishOptions?: PublishOptions
  }
};

type TakeSnapshot = { takeSnapshot: Object };
function isInstanceOfTakeSnapshot(object: any): object is TakeSnapshot {
  if (typeof object !== 'object') return false;
  return 'takeSnapshot' in object;
}

type FileShared = { fileShared: { link: string, jwt: string } };
function isInstanceOfFileShared(object: any): object is FileShared {
  if (typeof object !== 'object') return false;
  return 'fileShared' in object;
}

// Keycloak
// const keycloak = new Keycloak({
//   url: 'https://idp.apizee.com/auth', realm: 'APIZEE-POC-DGPN', clientId: 'visio-assisted'
// })
const keycloak = new Keycloak(window.location.origin + '/visio-assisted/keycloak.json');
// console.log(window.location.origin + '/visio-assisted/silent-check-sso.html')

const COMPONENT_NAME = "App";
function App() {
  const params = useParams();

  const [invitationData, setInvitationData] = useState<InvitationData | undefined>(undefined);

  // ApiRTC hooks
  const { session } = useSession(
    invitationData ? { apiKey: invitationData.apiKey } as Credentials : undefined,
    invitationData ? {
      cloudUrl: invitationData.cloudUrl ? invitationData.cloudUrl : 'https://cloud.apirtc.com',
      // SpecifyThis : The customer-side app shall join the <sessionId>-guests group
      // this will allow to share customer side specific info with userData for example
      groups: [invitationData.conversation.name + "-guests"],
      userData: new UserData({ firstName: invitationData.user.firstName, lastName: invitationData.user.lastName })
    } : undefined);
  const { stream: localStream } = useCameraStream(session, { constraints: invitationData?.camera.constraints });
  const { conversation } = useConversation(session,
    invitationData ? invitationData.conversation.name : undefined,
    invitationData ? invitationData.conversation.getOrCreateOptions : undefined,
    true);
  const { publishedStreams, subscribedStreams } = useConversationStreams(conversation,
    localStream ? [{ stream: localStream, options: invitationData?.camera.publishOptions }] : []);

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
  }

  useEffect(() => {
    const handleTabClose = (event: BeforeUnloadEvent) => {
      //event.preventDefault()
      setInvitationData(undefined)
      return undefined
    }
    window.addEventListener('beforeunload', handleTabClose)
    return () => {
      window.removeEventListener('beforeunload', handleTabClose)
    }
  }, [])

  useEffect(() => {
    keycloak.init({
      //onLoad: 'login-required', // Loops on refreshes
      // onLoad: 'check-sso', // does not seem to change anything
      // silentCheckSsoRedirectUri: window.location.origin + '/visio-assisted/silent-check-sso.html',
      //silentCheckSsoFallback: false
    }).then((auth) => {
      console.log("Keycloak.init", auth)
      if (!auth) {
        console.log("Keycloak NOT authenticated...")
      } else {
        console.log("Keycloak authenticated", auth, keycloak.token)
      }
    }).catch((error: any) => {
      console.error('keycloak.init', error)
    });
  }, [])

  useEffect(() => {
    if (params.sessionData) {
      try {
        const l_data: InvitationData = JSON.parse(base64_decode(params.sessionData)) as InvitationData;
        console.info("InvitationData", l_data);
        setInvitationData(l_data)
      } catch (error) {
        if (error instanceof SyntaxError) {
          const invitationId = params.sessionData;
          loginKeyCloakJS().then((keycloak) => {
            console.log('keycloak.token', keycloak.token)
            // TODO : use the token to make authenticated call to the API :
            getInvitationData(invitationId).then((data) => {
              console.log('getInvitationData', data)
              setInvitationData(data)
            })
          }).catch((error) => { console.error('loginKeyCloakJS error', error) })
        }
      }
    }
  }, [params.sessionData])

  useEffect(() => {
    if (session) {
      const userAgent: UserAgent = session.getUserAgent();
      const parser = new UAParser();
      console.log(COMPONENT_NAME + "|UAParser", parser.getResult())
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
        const sender: Contact = contactDataInfo.sender;
        const content: Object = contactDataInfo.content;
        console.log("on data", sender, content)
        if (isInstanceOfTakeSnapshot(content)) {
          localStream.takeSnapshot(content.takeSnapshot)
            .then((snapshot: any) => {
              console.log("takeSnapshot OK :", localStream, snapshot)
              //$('#timeline').append('<a><img src="' + snapshot + '" /></a>');

              const fileTransferInvitation = sender.sendFile({ name: `snapshot_${(new Date()).toISOString()}.png`, type: 'image/png' }, snapshot);
              fileTransferInvitation.on('statusChange', (statusChangeInfo: any) => {
                console.log('statusChange :', statusChangeInfo.status)
                // To learn about constants look at https://dev.apirtc.com/reference/Constants.html
                //if (statusChangeInfo.status === ) {//INVITATION_STATUS_ENDED
                console.log('statusChangeInfo', statusChangeInfo)
                //}
              });
            }).catch((error: any) => {
              // error
              console.error('takeSnapshot error :', error)
            });
        }
      };
      session.on('contactData', onContactData)
      return () => {
        session.removeListener('contactData', onContactData)
      }
    }
  }, [session, localStream])

  const [imgSrc, setImgSrc] = useState<string>();

  useEffect(() => {
    if (session && conversation) {
      // To receive data from contacts
      const onData = (contactDataInfo: any) => {
        const sender: Contact = contactDataInfo.sender;
        const content: Object = contactDataInfo.content;
        console.log("Conversation::on data", sender, content)
        if (isInstanceOfFileShared(content)) {
          console.log("fileShared", content)
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
          }).catch((error) => { console.error(COMPONENT_NAME + "|fetch ", content.fileShared.link, error) })
        }
      };
      conversation.on('data', onData)
      return () => {
        conversation.removeListener('data', onData)
      }
    }
  }, [conversation, session])

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      {/* <Button variant="contained" onClick={(e: React.SyntheticEvent) => {
        e.preventDefault();
        keycloak.login().then(
          (auth: any) => {
            console.log("Keycloak.login", auth)
            alert("auth" + JSON.stringify(auth))
            if (!auth) {
              console.log("Keycloak NOT authenticated...")
            } else {
              console.log("Keycloak authenticated", auth)
            }
          }
        )
      }}>Login with Keycloak</Button> */}
      {/* CANT make a call from button, because this is not called back when redirected... */}

      {/* {invitationData &&
        <Typography align='center' variant='h2'>Hello {invitationData.user.firstName}</Typography>
      } */}

      {/* <Grid container spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center">
        <Grid item xs={3}>
          {invitationData ?
            <>
              <div>
                {invitationData.conversation.friendlyName && <span>Conversation {invitationData.conversation.friendlyName}</span>}
              </div>
            </> : <div>no invitationData</div>}
        </Grid>
      </Grid> */}

      {/* Put in Grid to center */}
      <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
        <Grid item>
          {conversation &&
            <Box sx={{
              position: 'relative',
              minHeight: '208px'
            }}
            // style={{ border: '1px solid red' }}
            >
              <RemoteStreamsGrid
                sx={{
                  width: 'fit-content',
                  height: 'fit-content',
                }}>
                {subscribedStreams.map((stream: Stream, index: number) =>
                  <StreamComponent id={'subscribed-stream-' + index} key={index}
                    stream={stream}
                    name={stream.getContact().getUserData().get('firstName') + ' ' + stream.getContact().getUserData().get('lastName')}
                    controls={<>
                      <MuteButton />
                      <AudioEnableButton disabled={true} />
                      <VideoEnableButton disabled={true} /></>} >
                    {stream.hasVideo() ? <Video /> : <Audio />}
                  </StreamComponent>
                )}
              </RemoteStreamsGrid>
              <Grid container direction="row" justifyContent="flex-start"
                sx={{
                  position: 'absolute',
                  bottom: 4, left: 4,
                  opacity: [0.9, 0.8, 0.7],
                }}>
                {publishedStreams.map((stream, index) =>
                  <Grid item key={index}>
                    <StreamComponent id={'published-stream-' + index}
                      // sx={{ maxHeight: 200 }}
                      stream={stream} muted={true}
                      controls={<><AudioEnableButton /><VideoEnableButton /></>} >
                      {/* border: '1px solid red', */}
                      {stream.hasVideo() ? <Video style={{ width: '200px' }} /> : <Audio />}
                    </StreamComponent>
                  </Grid>)}
              </Grid>
            </Box>}
          {/* {session &&
          <div>
            <p>{session.getUserAgent().getUserData().get('systemInfo')}</p>
          </div>} */}
          {!session && <div><img src={logo} className="App-logo" alt="logo" /></div>}
          {imgSrc && <img src={imgSrc} alt="sharedImg"></img>}
        </Grid>
      </Grid>
    </Container>
  )
}

export default App;