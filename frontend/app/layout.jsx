export const metadata = {
  title: "FamilyVerse",
  description: "Your private family universe",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FamilyVerse",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#6366F1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FamilyVerse" />
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script dangerouslySetInnerHTML={{__html: `
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "f0a96e08-77cb-48fa-989e-70640ff2380f",
              notifyButton: { enable: false },
              allowLocalhostAsSecureOrigin: true,
            });
          });
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0f0f17" }}>
        {children}
      </body>
    </html>
  );
}
