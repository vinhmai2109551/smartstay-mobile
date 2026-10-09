import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { TURNSTILE_BASE_URL, TURNSTILE_SITE_KEY } from '@/config/env';
import { useEffectiveColorScheme } from '@/hooks/use-theme';

type Props = {
  action: 'login' | 'register';
  onTokenChange: (token: string) => void;
  // Turnstile tokens are single-use — bump this after each submit to get a fresh one.
  resetKey?: number;
};

// Turnstile has no native SDK, so the web widget runs inside a WebView and
// posts its token back. The page is loaded with a baseUrl whose hostname must
// be allowed both on the Cloudflare site key and in the backend's
// TURNSTILE_ALLOWED_HOSTNAMES, since /auth/login checks it.
function buildHtml(siteKey: string, action: string, theme: 'light' | 'dark', language: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>html,body{margin:0;padding:0;background:transparent;}</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit" async defer></script>
</head>
<body>
<div id="widget"></div>
<script>
  function send(token) {
    window.ReactNativeWebView.postMessage(token || '');
  }
  function onTurnstileLoad() {
    turnstile.render('#widget', {
      sitekey: ${JSON.stringify(siteKey)},
      action: ${JSON.stringify(action)},
      theme: ${JSON.stringify(theme)},
      language: ${JSON.stringify(language)},
      size: 'flexible',
      callback: function (token) { send(token); },
      'expired-callback': function () { send(''); },
      'error-callback': function () { send(''); },
    });
  }
</script>
</body>
</html>`;
}

export function TurnstileWidget({ action, onTokenChange, resetKey = 0 }: Props) {
  const { i18n } = useTranslation();
  const scheme = useEffectiveColorScheme();
  const handleMessage = (event: WebViewMessageEvent) => onTokenChange(event.nativeEvent.data);

  return (
    <View style={styles.container}>
      <WebView
        key={resetKey}
        originWhitelist={['*']}
        source={{
          html: buildHtml(TURNSTILE_SITE_KEY, action, scheme, i18n.language === 'en' ? 'en' : 'vi'),
          baseUrl: TURNSTILE_BASE_URL,
        }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 70, width: '100%' },
  webview: { backgroundColor: 'transparent' },
});
