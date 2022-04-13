import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UAParser } from 'ua-parser-js'
import { RegisterInformation, Stream, UserAgent, UserData } from '@apirtc/apirtc';
import { useSession, useCameraStream, useConversation, useConversationStreams, VideoStream } from '@apirtc/react-lib'
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
  const [invitationData, setInvitationData] = useState<InvitationData | undefined>(undefined)

  // ApiRTC hooks
  const { session, connect } = useSession()
  const { stream: localStream } = useCameraStream(session, { constraints: { audio: false, video: true } });
  const { conversation, joined } =
    useConversation(session,
      invitationData ? invitationData.conversation.name : undefined,
      invitationData ? { moderationEnabled: invitationData.conversation.moderationEnabled } : undefined,
      true);
  const { publishedStreams, subscribedStreams } =
    useConversationStreams(conversation,
      joined && localStream ? [localStream] : []);

  useEffect(() => {
    if (params.sessionData) {
      const l_data: InvitationData = JSON.parse(base64_decode(params.sessionData)) as InvitationData;
      setInvitationData(l_data)

      // TODO: specifyThis : The customer-side app shall join the <sessionId>-guests group
      // this will allow to share customer side specific info with userData for example
      const registerInformation: RegisterInformation = {
        cloudUrl: l_data.cloudUrl ? l_data.cloudUrl : 'https://cloud.apirtc.com',
      };
      registerInformation.groups = [l_data.conversation.name + "-guests"];

      registerInformation.userData = new UserData({ firstname: l_data.user.firstname, lastname: l_data.user.lastname })

      if (l_data.apiKey)
        connect({ apiKey: l_data.apiKey }, registerInformation)
    }
  }, []);

  useEffect(() => {
    if (session) {
      const userAgent: UserAgent = session.getUserAgent();
      const parser = new UAParser();
      console.log("UAParser", parser.getResult())
      const userData: UserData = userAgent.getUserData();
      userData.setToSession();
      userData.setProp('systemInfo', JSON.stringify(parser.getResult()));
      // TODO : I was forced to call setUserData again to make it work : check why and how
      // could the api be enhanced regarding userData usage (setToSession is also a pain)
      userAgent.setUserData(userData);
    }
  }, [session]);

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
            <p>{session.getUserAgent().getUserData().get('systemInfo')}</p>
          </div> : <div><img src={logo} className="App-logo" alt="logo" /></div>}
      </div>
    </div>
  );
}

export default App;

      // userAgent?.createStream({
      //   constraints: { audio: false, video: true }
      // }).then((localStream: Stream) => {
      //   console.info(COMPONENT_NAME + "|createStream", localStream)
      //   setLocalStream(localStream);
      // }).catch((error: any) => {
      //   console.error(COMPONENT_NAME + "|createStream", error)
      // });

  // useEffect(() => {
  //   if (conversation)
  //     join();
  // }, [conversation]);
  // useEffect(() => {
  //   if (joined && localStream)
  //     publish(localStream)
  // }, [joined, localStream]);

// return () => {
//   if (joined && localStream)
//     unpublish(localStream)
// }

// useEffect(() => {
//   if (session && invitationData) {
//     // , { moderationEnabled: true }
//     const conversation = session.getOrCreateConversation(invitationData.conversation.name,
//       { moderationEnabled: invitationData.conversation.moderationEnabled });
//     if (!conversation.isJoined()) {
//       conversation.join().then(() => {
//         // local user successfully joined the conversation.
//         console.log(COMPONENT_NAME + "|joined", conversation.getName())
//         setConversation(conversation);
//       }).catch((error: any) => {
//         // local user could not join the conversation.
//         console.error(COMPONENT_NAME + "|join", error)
//       });
//     }
//   }
// }, [session, invitationData]);
