import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import UniswapV2RouterABI from '../abis/UniswapV2Router.json'

const routerAddress = '0xD8a0a698476Ab0a8dFB9E1bB38eF3817c78DE2bc'  // contoh router UniswapV2 di Monad testnet
const tokens = {
  MONAD: '0xYourMonadTokenAddressHere',
  USDC: '0xYourUSDCAddressHere',
  WETH: '0xYourWETHAddressHere'
}

export default function Home() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState(null)
  const [fromToken, setFromToken] = useState('MONAD')
  const [toToken, setToToken] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [swapStatus, setSwapStatus] = useState('')

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum)
      setProvider(prov)
    }
  }, [])

  async function connectWallet() {
    if (!window.ethereum) {
      alert('Install MetaMask atau wallet compatible dApp dulu ya')
      return
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    setAccount(accounts[0])
    const signer_ = await provider.getSigner()
    setSigner(signer_)
  }

  async function swap() {
    if (!signer) {
      alert('Connect wallet dulu')
      return
    }
    if (fromToken === toToken) {
      alert('Pilih token dari dan ke yang berbeda')
      return
    }
    try {
      setSwapStatus('Menyiapkan transaksi...')

      const routerContract = new ethers.Contract(routerAddress, UniswapV2RouterABI, signer)

      const amountIn = ethers.parseUnits(amount, 18)  // sesuaikan decimals token
      const path = [tokens[fromToken], tokens[toToken]]
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10  // 10 menit ke depan

      const tx = await routerContract.swapExactTokensForTokens(
        amountIn,
        0,
        path,
        account,
        deadline
      )
      setSwapStatus('Transaksi terkirim, tunggu konfirmasi...')
      await tx.wait()
      setSwapStatus('Swap berhasil!')
    } catch (e) {
      setSwapStatus('Error: ' + (e.message || e))
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Swap Token Monad Testnet via UniswapV2</h2>

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Wallet: {account}</p>
          <div>
            <label>From: </label>
            <select value={fromToken} onChange={e => setFromToken(e.target.value)}>
              {Object.keys(tokens).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label>To: </label>
            <select value={toToken} onChange={e => setToToken(e.target.value)}>
              {Object.keys(tokens).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Amount: </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Jumlah token"
            />
          </div>

          <button onClick={swap}>Swap</button>

          <p>{swapStatus}</p>
        </div>
      )}
    </div>
  )
    }
