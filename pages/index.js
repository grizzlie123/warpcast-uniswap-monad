import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import UniswapV2RouterABI from './abis/UniswapV2Router02.json'
import ERC20ABI from './abis/ERC20.json'

const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

const routerAddress = '0xD8a0a698476Ab0a8dFB9E1bB38eF3817c78DE2bc'

const tokens = {
  MONAD: '0xAEE82a97b0f9991B72bbD5dfe5161c42F9E42c11',
  USDC: '0xB196aC1Dcb3526e0b6c1Ce7B9b7Aa59171c1b378',
  WETH: '0xEcADb7A52B1deD4f1bc91691B36BdEeFa85db77E'
}

export default function Swap() {
  const [inputToken, setInputToken] = useState('MONAD')
  const [outputToken, setOutputToken] = useState('USDC')
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('0')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!inputAmount) {
      setOutputAmount('0')
      return
    }
    getAmountsOut()
  }, [inputAmount, inputToken, outputToken])

  async function getAmountsOut() {
    try {
      const router = new ethers.Contract(routerAddress, UniswapV2RouterABI, provider)
      const amounts = await router.getAmountsOut(
        ethers.utils.parseUnits(inputAmount || '0', 18),
        [tokens[inputToken], tokens[outputToken]]
      )
      setOutputAmount(ethers.utils.formatUnits(amounts[1], 18))
    } catch (err) {
      setOutputAmount('0')
    }
  }

  async function swap() {
    try {
      setLoading(true)
      const router = new ethers.Contract(routerAddress, UniswapV2RouterABI, signer)
      const tokenIn = new ethers.Contract(tokens[inputToken], ERC20ABI, signer)

      // Approve token if needed
      const allowance = await tokenIn.allowance(await signer.getAddress(), routerAddress)
      const amountIn = ethers.utils.parseUnits(inputAmount, 18)

      if (allowance.lt(amountIn)) {
        const txApprove = await tokenIn.approve(routerAddress, amountIn)
        await txApprove.wait()
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

      const tx = await router.swapExactTokensForTokens(
        amountIn,
        0,
        [tokens[inputToken], tokens[outputToken]],
        await signer.getAddress(),
        deadline
      )
      await tx.wait()
      alert('Swap successful!')
      setInputAmount('')
      setOutputAmount('0')
    } catch (err) {
      alert('Swap failed: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Monad Testnet Swap</h2>

      <div>
        <label>From Token:</label>
        <select value={inputToken} onChange={e => setInputToken(e.target.value)}>
          {Object.keys(tokens).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Amount:</label>
        <input
          type="number"
          value={inputAmount}
          onChange={e => setInputAmount(e.target.value)}
          placeholder="0.0"
          min="0"
          step="any"
        />
      </div>

      <div>
        <label>To Token:</label>
        <select value={outputToken} onChange={e => setOutputToken(e.target.value)}>
          {Object.keys(tokens).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Estimated Output:</label>
        <input type="text" value={outputAmount} readOnly />
      </div>

      <button onClick={swap} disabled={loading || !inputAmount || inputToken === outputToken}>
        {loading ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  )
        }
