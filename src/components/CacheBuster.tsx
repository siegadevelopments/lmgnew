'use client'

import { useEffect } from 'react'

const APP_VERSION = '1.0.7'

export function CacheBuster() {
  useEffect(() => {
    const lastVersion = localStorage.getItem('lmg_app_version')
    
    // 1. Initial version check for local storage state
    if (lastVersion !== APP_VERSION) {
      console.log(`Version change detected: ${lastVersion || 'initial'} -> ${APP_VERSION}. Updating local version.`)
      localStorage.setItem('lmg_app_version', APP_VERSION)
      
      // If we had a previous version, force a reload to ensure all assets are fresh
      if (lastVersion) {
        window.location.reload()
      }
    }

    // 2. Periodic remote check to bypass CDN/Edge cache for index.html
    const checkRemoteVersion = async () => {
      try {
        // Fetch version.json with a cache-buster query param and no-store header
        const response = await fetch('/version.json?v=' + new Date().getTime(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) return

        const data = await response.json()
        
        if (data.version && data.version !== APP_VERSION) {
          const lastReload = sessionStorage.getItem('lmg_last_version_reload')
          const now = Date.now()
          
          // Loop protection: only reload if we haven't forced a reload in the last 60 seconds
          if (!lastReload || now - parseInt(lastReload) > 60000) {
            console.log(`Remote version mismatch (${data.version} vs ${APP_VERSION}). Forcing hard reload...`)
            sessionStorage.setItem('lmg_last_version_reload', now.toString())
            window.location.reload()
          } else {
            console.warn('Update available but reload loop prevented. Waiting for next check.')
          }
        }
      } catch (err) {
        // Silently fail as this is a background optimization
        console.debug('Version check skipped due to network/parsing error')
      }
    }

    // Check once on mount after a small delay to not block initial load
    const timer = setTimeout(checkRemoteVersion, 2000)
    
    // Check every 5 minutes
    const interval = setInterval(checkRemoteVersion, 5 * 60 * 1000)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  return null
}
