import { CONFIG } from 'src/config-global';

import { SubscriptionView } from 'src/sections/subscription/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Subscription - ${CONFIG.appName}`}</title>
      <meta name="description" content="Choose the perfect subscription plan for your needs" />
      <meta name="keywords" content="subscription,plans,pricing" />

      <SubscriptionView />
    </>
  );
}

