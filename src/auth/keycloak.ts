import Keycloak from 'keycloak-js'

// TODO maybe move this to a serveless app, it would be more "à propos"
export function loginKeyCloakJS() {
    return new Promise<Keycloak>((resolve, reject) => {
        const keycloak = new Keycloak({
            url: 'https://idp.apizee.com/auth', realm: 'APIZEE-POC-DGPN', clientId: 'visio-assisted'
        })
        keycloak.init({
            onLoad: 'login-required',
            // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
            checkLoginIframe: false
        }).then((auth) => {
            if (!auth) {
                console.log("Keycloak NOT authenticated...")
                //window.location.reload()
            } else {
                console.log("Keycloak authenticated")
                resolve(keycloak)
            }

            //Token Refresh
            // setInterval(() => {
            //     keycloak.updateToken(70).then((refreshed) => {
            //         if (refreshed) {
            //             console.log('Token refreshed' + refreshed)
            //         } else {
            //             if (keycloak.tokenParsed?.exp && keycloak.timeSkew)
            //                 console.log('Token not refreshed, valid for '
            //                     + Math.round(keycloak.tokenParsed?.exp + keycloak.timeSkew - new Date().getTime() / 1000) + ' seconds')
            //         }
            //     }).catch(() => {
            //         console.error('Failed to refresh token')
            //     })
            // }, 6000)
        }).catch((error) => {
            console.error("Authenticated Failed", error)
            reject(error)
        })
    })
}