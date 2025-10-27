import { CONFIG } from 'src/config-global';

import { SuccessView } from 'src/sections/subscription/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Payment Successful - ${CONFIG.appName}`}</title>

      <SuccessView />
    </>
  );
}
