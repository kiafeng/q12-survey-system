import React, { useState, useEffect } from 'react'
import {
  Table, Button, Card, Modal, Form, Input, Select, Space,
  Tag, message, Popconfirm
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

const AdminUsers = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [userRes, deptRes] = await Promise.all([
        apiGet('/users'),
        apiGet('/departments')
      ])
      setUsers(userRes.users)
      setDepartments(deptRes.departments)
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingUser(record)
    form.setFieldsValue({
      realName: record.real_name,
      role: record.role,
      departmentId: record.department_id,
      status: record.status
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/users/${id}`)
      message.success('删除成功')
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleResetPassword = (record) => {
    setResetUser(record)
    passwordForm.resetFields()
    setPasswordModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingUser) {
        await apiPut(`/users/${editingUser.id}`, values)
        message.success('更新成功')
      } else {
        await apiPost('/users', {
          username: values.username,
          password: values.password,
          realName: values.realName,
          role: values.role,
          departmentId: values.departmentId
        })
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handlePasswordOk = async () => {
    try {
      const values = await passwordForm.validateFields()
      await apiPost(`/users/${resetUser.id}/reset-password`, { newPassword: values.newPassword })
      message.success('密码重置成功')
      setPasswordModalVisible(false)
    } catch (err) {
      message.error(err.message)
    }
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: v => v === 1 ? <Tag color="gold">超级管理员</Tag> : <Tag color="blue">事业部管理员</Tag>
    },
    {
      title: '所属部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: v => v || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: v => v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleResetPassword(record)}>
            重置密码
          </Button>
          <Popconfirm
            title="确定删除该用户？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const departmentOptions = departments.map(d => ({
    value: d.id,
    label: d.name
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加用户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!editingUser && (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}

          <Form.Item name="realName" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              options={[
                { value: 1, label: '超级管理员' },
                { value: 2, label: '事业部管理员' }
              ]}
            />
          </Form.Item>

          <Form.Item name="departmentId" label="所属部门">
            <Select
              placeholder="选择所属部门(事业部管理员必选)"
              allowClear
              options={departmentOptions}
            />
          </Form.Item>

          {editingUser && (
            <Form.Item name="status" label="状态">
              <Select
                options={[
                  { value: 1, label: '启用' },
                  { value: 0, label: '禁用' }
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={passwordModalVisible}
        onOk={handlePasswordOk}
        onCancel={() => setPasswordModalVisible(false)}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminUsers
