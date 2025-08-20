import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

type Env = {
  SABRE_USER_ID: string
  SABRE_PASSWORD: string
  SABRE_BASE_URL?: string
}

function buildBaseUrl(env: Env) {
  return env.SABRE_BASE_URL || 'https://api-crt.cert.havail.sabre.com'
}

async function getSabreToken(env: Env) {
  const credentials = `${env.SABRE_USER_ID}:${env.SABRE_PASSWORD}`
  const encoded = btoa(credentials)
  const url = `${buildBaseUrl(env)}/v2/auth/token`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${encoded}`
    },
    body: 'grant_type=client_credentials'
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Token fetch failed: ${res.status} ${JSON.stringify(data)}`)
  }
  return data.access_token

  






  

}
