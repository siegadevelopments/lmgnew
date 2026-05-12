'use client'

import { useEffect } from 'react'

const APP_VERSION = '1.0.6'

export function CacheBuster() {
  useEffect(() => {
    const lastVersion = localStorage.getItem('lmg_app_version')
    
    if (lastVersion !== APP_VERSION) {
      console.log(`New version detected: ${APP_VERSION}. Clearing old cache and reloading...`)
      
      // Clear specific query caches if needed, or just force a reload
      localStorage.setItem('lmg_app_version', APP_VERSION)
      
      // Force a hard reload to bypass browser cache
      if (lastVersion) {
        window.location.reload()
      }
    }
  }, [])

  return null
}
