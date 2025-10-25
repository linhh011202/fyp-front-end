import { CONFIG } from 'src/config-global';

import { JsonPlansEditorView } from 'src/sections/admin';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Create Plans - ${CONFIG.appName}`}</title>
      <meta name="description" content="Create and manage subscription plans" />
      <meta name="keywords" content="admin,plans,subscription,management" />

      <JsonPlansEditorView />
    </>
  );
}
