import React, { useState, useEffect } from 'react'
import {
  Table, Button, Card, Modal, Form, Input, Select, Space, Tag,
  message, Popconfirm
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined
} from '@ant-design/icons'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

const AdminDepartments = () => {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [form] = Form.useForm()
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))

  const isAdmin = user.role === 1

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const deptRes = await apiGet('/api/departments')
      setDepartments(deptRes.departments)

      if (isAdmin) {
        const userRes = await apiGet('/api/users')
        setUsers(userRes.users.filter(u => u.role === 2))
      }
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingDept(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingDept(record)
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      parentId: record.parent_id,
      level: record.level,
      managerId: record.manager_id,
      status: record.status
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/departments/${id}`)
      message.success('删除成功')
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingDept) {
        await apiPut(`/departments/${editingDept.id}`, values)
        message.success('更新成功')
      } else {
        await apiPost('/api/departments', values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const columns = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <TeamOutlined style={{ color: record.level === 1 ? '#1677FF' : '#52C41A' }} />
          {text}
          {record.level === 1 && <Tag color="blue">事业部</Tag>}
          {record.level === 2 && <Tag color="green">二级</Tag>}
        </Space>
      )
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: '上级部门',
      dataIndex: 'parent_name',
      key: 'parent_name',
      render: v => v || '-'
    },
    {
      title: '负责人',
      dataIndex: 'manager_name',
      key: 'manager_name',
      render: v => v || '-'
    },
    {
      title: '问卷回收',
      dataIndex: 'survey_count',
      key: 'survey_count',
      width: 100,
      render: v => <Tag color={v > 0 ? 'success' : 'default'}>{v || 0} 份</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: v => v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => isAdmin ? (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该部门？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ) : <span style={{ color: '#999' }}>只读</span>
    }
  ]

  const departmentOptions = departments.map(d => ({
    value: d.id,
    label: d.name
  }))

  const userOptions = users.map(u => ({
    value: u.id,
    label: u.real_name || u.username
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>部门管理</h2>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加部门
          </Button>
        )}
      </div>

      {!isAdmin && departments.length > 0 && (
        <Card style={{ marginBottom: 16, background: '#E6F4FF' }}>
          <div style={{ fontSize: 13, color: '#666' }}>
            <strong>提示：</strong>您当前只能查看部门信息。如需管理部门，请联系系统管理员。
          </div>
        </Card>
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingDept ? '编辑部门' : '添加部门'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="部门编码"
            rules={[{ required: true, message: '请输入部门编码' }]}
          >
            <Input placeholder="请输入部门编码(唯一)" disabled={!!editingDept} />
          </Form.Item>

          <Form.Item name="parentId" label="上级部门">
            <Select
              placeholder="选择上级部门(可选)"
              allowClear
              options={departmentOptions.filter(d => !editingDept || d.value !== editingDept.id)}
            />
          </Form.Item>

          <Form.Item
            name="level"
            label="层级"
            rules={[{ required: true, message: '请选择层级' }]}
          >
            <Select
              options={[
                { value: 1, label: '事业部' },
                { value: 2, label: '二级部门' },
                { value: 3, label: '三级部门' }
              ]}
            />
          </Form.Item>

          <Form.Item name="managerId" label="部门负责人">
            <Select
              placeholder="选择负责人(可选)"
              allowClear
              options={userOptions}
            />
          </Form.Item>

          {editingDept && (
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
    </div>
  )
}

export default AdminDepartments
