import { CONFIG } from 'src/config-global';

import { GoogleCallbackView } from 'src/sections/auth/google-callback-view';

// ----------------------------------------------------------------------

export default function GoogleCallbackPage() {
  return (
    <>
      <title>{`Google Sign In - ${CONFIG.appName}`}</title>

      <GoogleCallbackView />
    </>
  );
}
