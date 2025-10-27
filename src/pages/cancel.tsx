import { CONFIG } from 'src/config-global';

import { CancelView } from 'src/sections/subscription/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Payment Cancelled - ${CONFIG.appName}`}</title>

      <CancelView />
    </>
  );
}
