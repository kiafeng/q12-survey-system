import React, { useState, useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, message } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { getCurrentUser } from '../utils/api'

const { Header, Sider, Content } = Layout

const AdminLayout = () => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    const userStr = localStorage.getItem('user')
    if (!currentUser) {
      navigate('/admin/login')
      return
    }
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('q12_token')
    localStorage.removeItem('user')
    message.success('已退出登录')
    navigate('/admin/login')
  }

  // 根据角色构建菜单
  const getMenuItems = () => {
    const items = [
      { key: '/admin', icon: <DashboardOutlined />, label: '数据看板' },
      { key: '/admin/departments', icon: <TeamOutlined />, label: '部门管理' },
      { key: '/admin/analysis', icon: <BarChartOutlined />, label: 'AI分析报告' }
    ]

    // 只有超级管理员能看到用户管理
    if (user?.role === 1) {
      items.push({ key: '/admin/users', icon: <UserOutlined />, label: '用户管理' })
    }

    // 所有管理员都能看到问卷管理
    items.push({ key: '/admin/questionnaire', icon: <FileTextOutlined />, label: '问卷管理' })

    return items
  }

  const menuItems = getMenuItems()

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') handleLogout()
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#001529',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1677FF' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1677FF' }} />
              <span style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>Q12系统</span>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer', fontSize: 18 }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar style={{ background: '#1677FF' }}>
                {user?.realName?.[0] || user?.username?.[0] || 'A'}
              </Avatar>
              <span style={{ color: '#333' }}>
                {user?.realName || user?.username}
                <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                  {user?.role === 1 ? '超级管理员' : '事业部管理员'}
                </span>
              </span>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, padding: 24, background: '#F5F7FA', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
