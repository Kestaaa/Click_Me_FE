'use client'

import { WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import dynamic from 'next/dynamic'
import { FC, ReactNode, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'

// Import endpoint and network from the config file
import { endpoint, network } from '@/config'

// Import wallet adapters
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'

// Import wallet styles
require('@solana/wallet-adapter-react-ui/styles.css')

export const WalletButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

export interface SolanaProviderProps {
  children: ReactNode
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // Define error handling callback - show errors to users with toast
  const onError = useCallback((error: WalletError) => {
    console.error(error)
    toast.error(error.message || 'An unknown wallet error occurred')
  }, [])

  // Create the wallets array with proper configuration
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ 
        network,
        appIdentity: {
          name: "Click-Me Button Game",
          // Reference the logo from the public directory
          icon: "/logo.png", // This will resolve to your public/logo.png
          uri: "https://click-me.io" // Update with your actual website URL
        }
      }),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default SolanaProvider