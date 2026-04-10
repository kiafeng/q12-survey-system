import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons'
import { apiAuth } from '../utils/api'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('admin')

  const onFinish = (values) => {
    setLoading(true)
    const result = apiAuth.login(values.username, values.password)
    if (result.success) {
      localStorage.setItem('user', JSON.stringify(result.user))
      message.success('登录成功')
      navigate('/admin')
    } else {
      message.error(result.error)
    }
    setLoading(false)
  }

  const tabItems = [
    {
      key: 'admin',
      label: (
        <span>
          <SafetyOutlined /> 管理员登录
        </span>
      ),
      children: (
        <>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#999' }} />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ height: 48, fontSize: 16, borderRadius: 8 }}
            >
              登 录
            </Button>
          </Form.Item>
        </>
      )
    },
    {
      key: 'employee',
      label: (
        <span>
          <TeamOutlined /> 员工登录
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            <img 
              src="/jinxiaofei.png" 
              alt="金小飞"
              style={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8 }}>
            亲爱的同事，欢迎参与Q12调研！<br />
            请通过您收到的专属调研链接参与问卷填写。
          </p>
          <div style={{ 
            marginTop: 24, 
            padding: 16, 
            background: '#F0F5FF', 
            borderRadius: 8,
            fontSize: 13,
            color: '#666'
          }}>
            如未收到调研链接，请联系您的部门管理员。
          </div>
        </div>
      )
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: 600,
        height: 600,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-15%',
        width: 800,
        height: 800,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
        filter: 'blur(80px)'
      }} />

      {/* 左侧品牌区域 */}
      <div style={{
        position: 'absolute',
        left: '5%',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'white',
        maxWidth: 400,
        display: 'none'  // 隐藏左侧区域，留给IP形象
      }}
        className="brand-section"
      >
        {/* 使用背景图方式，不拉伸 */}
        <div style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          marginBottom: 32,
          backdropFilter: 'blur(10px)',
          backgroundImage: 'url(/jinxiaofei.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} />
        <h1 style={{ 
          fontSize: 36, 
          fontWeight: 700, 
          marginBottom: 16,
          textShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          Q12调研系统
        </h1>
        <p style={{ 
          fontSize: 18, 
          opacity: 0.9,
          lineHeight: 1.8 
        }}>
          专业的组织氛围诊断工具<br />
          帮助企业了解员工真实感受<br />
          持续提升组织健康度
        </p>
      </div>

      {/* 登录卡片 */}
      <Card 
        style={{ 
          width: 420, 
          borderRadius: 20, 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* 顶部渐变头部 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 32px 48px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* IP形象区域 - 去掉白色边框，直接显示圆形图片 */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            margin: '-50px auto 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            backgroundImage: `url(/jinxiaofei.png?v=${Date.now()})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
          </div>
          <h1 style={{ 
            fontSize: 24, 
            color: 'white', 
            margin: 0,
            fontWeight: 600,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Q12调研系统
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 14,
            margin: '8px 0 0'
          }}>
            组织氛围诊断管理后台
          </p>
        </div>

        {/* 登录表单 */}
        <div style={{ padding: 32 }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
            centered
            style={{ marginBottom: 24 }}
          />

          {activeTab === 'admin' && (
            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              initialValues={{ username: 'admin', password: 'admin123' }}
            >
              {/* 表单项由 tabItems 渲染 */}
            </Form>
          )}

          {/* 底部提示 */}
          {activeTab === 'admin' && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)', 
              borderRadius: 12, 
              fontSize: 13,
              border: '1px solid #b7eb8f'
            }}>
              <div style={{ fontWeight: 600, color: '#52c41a', marginBottom: 8 }}>
                测试账号
              </div>
              <div style={{ color: '#666' }}>
                超级管理员：<code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>admin</code> / <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>admin123</code>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 右下角版权 */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12
      }}>
        © 2026 组织氛围调研系统
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .brand-section {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLogin
