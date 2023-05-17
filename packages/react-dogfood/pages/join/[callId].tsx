import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import {
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { useCreateStreamChatClient } from '../../hooks';
import { MeetingUI } from '../../components';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';
import { useGleap } from '../../hooks/useGleap';
import { useSettings } from '../../context/SettingsContext';
import translations from '../../translations';

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const {
    settings: { language },
  } = useSettings();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';

  const { userToken, user, apiKey, gleapApiKey } = props;

  const [initialTokenProvided, setInitialTokenProvided] = useState(false);
  const tokenProvider = useCallback(async () => {
    if (!initialTokenProvided) {
      setInitialTokenProvided(true);
      return userToken;
    }

    const { token } = await fetch(
      '/api/auth/create-token?' +
        new URLSearchParams({
          api_key: apiKey,
          user_id: user.id,
        }),
      {},
    ).then((res) => res.json());
    return token;
  }, [apiKey, initialTokenProvided, user.id, userToken]);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    user,
  });

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useGleap(gleapApiKey, client, user);

  return (
    <>
      <Head>
        <title>Stream Calls: {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <StreamVideo
        client={client}
        language={language}
        translationsOverrides={translations}
      >
        <StreamCall callId={callId} callType={callType} autoJoin={false}>
          <MeetingUI chatClient={chatClient} />
        </StreamCall>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsProps;
