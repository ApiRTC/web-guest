import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { UAParser } from 'ua-parser-js'

import { Conversation, RegisterInformation, Stream, UserAgent, UserData } from '@apirtc/apirtc';

import { useSession, useConversationStreams, VideoStream } from '@apirtc/react-lib'

import { decode as base64_decode } from 'base-64';

import logo from './logo.svg';
import './App.css';

interface InvitationData {
  cloudUrl?: string
  apiKey?: string
  conversation: {
    name: string
    moderationEnabled?: boolean
  }
  user: {
    firstname: string
    lastname: string
  }
}

const COMPONENT_NAME = "App";
function App() {

  const params = useParams();
  console.log(COMPONENT_NAME + "|params", params);

  const [invitationData, setInvitationData] = useState<InvitationData | undefined>(undefined)

  const { session, connect, disconnect } = useSession()
  const [localStream, setLocalStream] = useState<Stream>();
  const [conversation, setConversation] = useState<Conversation>();
  const { publishedStreams, subscribedStreams, publish, unpublish } = useConversationStreams(conversation);

  useEffect(() => {
    if (params.sessionData) {

      const l_data: InvitationData = JSON.parse(base64_decode(params.sessionData)) as InvitationData;
      console.log("invite", l_data)
      setInvitationData(l_data)

      // TODO: specifyThis : The customer-side app shall join the <sessionId>-guests group
      // this will allow to share customer side specific info with userData for example
      const registerInformation: RegisterInformation = {
        cloudUrl: l_data.cloudUrl ? l_data.cloudUrl : 'https://cloud.apirtc.com',
      };
      registerInformation.groups = [l_data.conversation.name + "-guests"];

      registerInformation.userData = new UserData({ firstname: l_data.user.firstname, lastname: l_data.user.lastname })

      // TODO : how do we get the apiKey ? somehow we have to get it through the invitation link
      // TODO : get also groups to join
      // TODO x: get also cloudUrl
      if (l_data.apiKey)
        connect({ apiKey: l_data.apiKey }, registerInformation)
    }
  }, []);

  useEffect(() => {
    if (session) {
      const userAgent: UserAgent = session.getUserAgent();

      userAgent?.createStream({
        constraints: {
          audio: false,
          video: true
        }
      }).then((localStream: Stream) => {
        console.info(COMPONENT_NAME + "|createStream", localStream)
        setLocalStream(localStream);
      }).catch((error: any) => {
        console.error(COMPONENT_NAME + "|createStream", error)
      });

      const parser = new UAParser();
      console.log("UAParser", parser.getResult())
      const userData: UserData = userAgent.getUserData();
      userData.setToSession();
      userData.setProp('systemInfo', JSON.stringify(parser.getResult()));
      // TODO : I was forced to call setUserData again to make it work : check why and how
      // could the api be enhanced regarding userData usage (setToSession is also a pain)
      userAgent.setUserData(userData);

      if (invitationData) {
        // , { moderationEnabled: true }
        const conversation = session.getOrCreateConversation(invitationData.conversation.name,
          { moderationEnabled: invitationData.conversation.moderationEnabled });
        if (!conversation.isJoined()) {
          conversation.join().then(() => {
            // local user successfully joined the conversation.
            console.log(COMPONENT_NAME + "|joined", conversation.getName())
            setConversation(conversation);
          }).catch((error: any) => {
            // local user could not join the conversation.
            console.error(COMPONENT_NAME + "|join", error)
          });
        }
      }
    }
  }, [session, invitationData]);

  useEffect(() => {
    if (conversation && localStream)
      publish(localStream)
    return () => {
      if (conversation && localStream)
        unpublish(localStream)
    }
  }, [conversation, localStream]);

  const _publishedStreams = publishedStreams.map((stream: Stream) => {
    console.log("_publishedStreams", publishedStreams, stream);
    return <VideoStream key={stream.getId()} stream={stream}></VideoStream>;
  });
  const _subscribedStreams = subscribedStreams.map((stream: Stream) => {
    console.log("_subscribedStreams", subscribedStreams, stream)
    return <VideoStream key={stream.getId()} stream={stream}></VideoStream>;
  });

  return (
    <div className="App">
      <div className="App-header">
        {invitationData ?
          <>
            <div>
              <h1>Hello {invitationData.user.firstname}</h1>
              <span>Conversation {invitationData.conversation.name}</span>
            </div>
          </> : <div>no invitationData</div>}

        {conversation ?
          <>
            <div id="published">{_publishedStreams}</div>
            <div id="subscribed">{_subscribedStreams}</div>
          </> : <div><img src={logo} className="App-logo" alt="logo" /></div>}

        {session ?
          <div>
            {/* <h3>user {session.getUserAgent().getUsername()}</h3> */}
            <p>{session.getUserAgent().getUserData().get('systemInfo')}</p>
          </div> : <div><img src={logo} className="App-logo" alt="logo" /></div>}

      </div>
    </div>
  );
}

export default App;
