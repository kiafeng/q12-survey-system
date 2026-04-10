import React from 'react'
import { Result, Button } from 'antd'

const ThankYouPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1677FF 0%, #4096FF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 48,
        textAlign: 'center',
        maxWidth: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#F6FFED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#52C41A" fillOpacity="0.2"/>
            <path d="M14 24L21 31L34 18" stroke="#52C41A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 28, color: '#1F1F1F', marginBottom: 16 }}>
          提交成功
        </h1>

        <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6, marginBottom: 32 }}>
          感谢您抽出宝贵时间完成此次调研。<br/>
          您的反馈对我们非常重要，<br/>
          将帮助我们持续改善工作环境。
        </p>

        <div style={{
          background: '#F5F7FA',
          borderRadius: 8,
          padding: 16,
          fontSize: 13,
          color: '#999'
        }}>
          系统将自动关闭，感谢您的参与！
        </div>
      </div>
    </div>
  )
}

export default ThankYouPage
