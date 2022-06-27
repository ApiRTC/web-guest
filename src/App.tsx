import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { UAParser } from 'ua-parser-js'
import { Stream, UserAgent, UserData } from '@apirtc/apirtc'
import { useSession, useCameraStream, useConversation, useConversationStreams, VideoStream, Credentials } from '@apirtc/react-lib'
import { decode as base64_decode } from 'base-64'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

import { loginKeyCloakJS } from './auth/keycloak'

import logo from './logo.svg';
import './App.css';

type InvitationData = {
  cloudUrl?: string
  apiKey?: string
  conversation: {
    name: string, moderationEnabled?: boolean,
    friendlyName?: string
  }
  user: {
    firstname: string, lastname: string
  }
  constraints?: any
}

const COMPONENT_NAME = "App";
function App() {
  const params = useParams()

  const [invitationData, setInvitationData] = useState<InvitationData | undefined>(undefined)
  const [apirtcCredentials, setApirtcCredentials] = useState<Credentials | undefined>(undefined)
  const [constraints, setConstraints] = useState()

  // ApiRTC hooks
  const { session } = useSession(
    apirtcCredentials,
    invitationData ? {
      cloudUrl: invitationData.cloudUrl ? invitationData.cloudUrl : 'https://cloud.apirtc.com',
      // SpecifyThis : The customer-side app shall join the <sessionId>-guests group
      // this will allow to share customer side specific info with userData for example
      groups: [invitationData.conversation.name + "-guests"],
      userData: new UserData({ firstname: invitationData.user.firstname, lastname: invitationData.user.lastname })
    } : undefined)
  const { stream: localStream } = useCameraStream(session, { constraints: constraints })
  const { conversation } = useConversation(session,
    invitationData ? invitationData.conversation.name : undefined,
    invitationData ? { moderationEnabled: invitationData.conversation.moderationEnabled } : undefined,
    true)
  const { publishedStreams, subscribedStreams } = useConversationStreams(conversation, [localStream])

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
      event.preventDefault()
      setApirtcCredentials(undefined)
    }
    window.addEventListener('beforeunload', handleTabClose)
    return () => {
      window.removeEventListener('beforeunload', handleTabClose)
    }
  }, [])

  useEffect(() => {
    if (params.sessionData) {
      try {
        const l_data: InvitationData = JSON.parse(base64_decode(params.sessionData)) as InvitationData;
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
    if (invitationData) {
      setConstraints(invitationData.constraints)
      if (invitationData.apiKey) {
        setApirtcCredentials({ apiKey: invitationData.apiKey })
      }
    }
  }, [invitationData]) // adding connect triggers issues so don't

  useEffect(() => {
    if (session) {
      const userAgent: UserAgent = session.getUserAgent()
      const parser = new UAParser()
      console.log(COMPONENT_NAME + "|UAParser", parser.getResult())
      const userData: UserData = userAgent.getUserData()
      userData.setToSession()
      userData.setProp('systemInfo', JSON.stringify(parser.getResult()));
      // TODO : I was forced to call setUserData again to make it work : check why and how
      // could the api be enhanced regarding userData usage (setToSession is also a pain)
      userAgent.setUserData(userData)
    }
  }, [session])

  const _publishedStreams = <Grid container direction="row" justifyContent="flex-start"
    sx={{
      position: 'absolute',
      bottom: 0,
      opacity: [0.9, 0.8, 0.7],
    }}>
    {publishedStreams.map((stream, index) =>
      <Grid key={index} item xs={2}>
        <VideoStream stream={stream} muted={true}></VideoStream>
      </Grid>)}
  </Grid>

  const _subscribedStreams = subscribedStreams.map((stream: Stream) => {
    console.log(COMPONENT_NAME + "|_subscribedStreams", subscribedStreams, stream)
    return <VideoStream key={stream.getId()} stream={stream}></VideoStream>
  })

  return (
    <div className="App">
      <div className="App-header">
        {/* CANT make a call from button, because this is not called back when redirected... */}
        {/* <Button variant="contained" onClick={(e: any) => {
          e.preventDefault();
          loginKeyCloakJS();
        }}>Login with Keycloak</Button> */}
        {invitationData ?
          <>
            <div>
              <h1>Hello {invitationData.user.firstname}</h1>
              {invitationData.conversation.friendlyName && <span>Conversation {invitationData.conversation.friendlyName}</span>}
            </div>
          </> : <div>no invitationData</div>}
        {conversation ?
          <Box sx={{
            width: "100%",
            position: 'relative',
          }}>
            {_subscribedStreams}
            {_publishedStreams}
          </Box>
          : <div><img src={logo} className="App-logo" alt="logo" /></div>}
        {session ?
          <div>
            <p>{session.getUserAgent().getUserData().get('systemInfo')}</p>
          </div> : <div><img src={logo} className="App-logo" alt="logo" /></div>}
      </div>
    </div>
  )
}

export default App;