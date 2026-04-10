import React, { useState, useEffect } from 'react'
import {
  Card, Row, Col, Statistic, Button, Table, Tag, message,
  Modal, Form, Input, Select, DatePicker, Space, Popconfirm, Descriptions
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CopyOutlined, LinkOutlined, ReloadOutlined,
  PlayCircleOutlined, StopOutlined, FileTextOutlined
} from '@ant-design/icons'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'
import dayjs from 'dayjs'

const CopyButton = ({ text, icon, onCopy }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      message.error('复制失败')
    }
  }

  return (
    <Button
      type="text"
      size="small"
      icon={copied ? <span style={{ color: '#52C41A' }}>✓</span> : icon}
      onClick={handleCopy}
    >
      {copied ? '已复制' : '复制'}
    </Button>
  )
}

const QuestionnaireManager = () => {
  const [loading, setLoading] = useState(false)
  const [questionnaires, setQuestionnaires] = useState([])
  const [departments, setDepartments] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingQ, setEditingQ] = useState(null)
  const [form] = Form.useForm()
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))

  const isAdmin = user.role === 1

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [qRes, dRes] = await Promise.all([
        apiGet('/questionnaires'),
        apiGet('/departments')
      ])
      setQuestionnaires(qRes.questionnaires)
      setDepartments(dRes.departments)
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingQ(null)
    form.resetFields()
    setModalVisible(true)
    // 事业部管理员默认选中自己的部门（延迟设置确保 Modal 已打开）
    setTimeout(() => {
      if (user.departmentId && deptOptions.length > 0) {
        form.setFieldValue('departmentId', user.departmentId)
      }
    }, 0)
  }

  const handleEdit = (record) => {
    setEditingQ(record)
    form.setFieldsValue({
      departmentId: record.department_id,
      title: record.title,
      startDate: record.start_date ? dayjs(record.start_date) : null,
      endDate: record.end_date ? dayjs(record.end_date) : null,
      status: record.status
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/questionnaires/${id}`)
      message.success('删除成功')
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleStart = async (record) => {
    try {
      await apiPut(`/questionnaires/${record.id}`, { status: 2 })
      message.success('问卷已开始收集')
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleStop = async (record) => {
    try {
      await apiPut(`/questionnaires/${record.id}`, { status: 3 })
      message.success('问卷已结束')
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleRegenerateLink = async (record) => {
    try {
      const res = await apiPost(`/questionnaires/${record.id}/regenerate-token`)
      message.success('链接已重置')
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        departmentId: values.departmentId,
        title: values.title,
        startDate: values.startDate?.format('YYYY-MM-DD') || null,
        endDate: values.endDate?.format('YYYY-MM-DD') || null,
        status: values.status || 1
      }

      if (editingQ) {
        await apiPut(`/questionnaires/${editingQ.id}`, data)
        message.success('更新成功')
      } else {
        await apiPost('/questionnaires', data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      message.error(err.message)
    }
  }

  // 使用固定的 API_BASE_URL 确保链接端口正确
  const API_BASE = import.meta.env.VITE_API_BASE_URL || window.location.origin
  const getSurveyUrl = (token) => `${API_BASE}/survey/${token}`

  const getStatusTag = (status) => {
    switch (status) {
      case 1: return <Tag color="default">草稿</Tag>
      case 2: return <Tag color="success">收集中</Tag>
      case 3: return <Tag color="warning">已结束</Tag>
      default: return <Tag>未知</Tag>
    }
  }

  const columns = [
    {
      title: '问卷名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <FileTextOutlined style={{ marginRight: 8, color: '#1677FF' }} />
          {text}
        </div>
      )
    },
    {
      title: '所属部门',
      dataIndex: 'department_name',
      key: 'department_name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '收集时间',
      key: 'date_range',
      render: (_, record) => (
        <span style={{ fontSize: 12, color: '#666' }}>
          {record.start_date || '不限'} ~ {record.end_date || '不限'}
        </span>
      )
    },
    {
      title: '已回收',
      dataIndex: 'survey_count',
      key: 'survey_count',
      width: 80,
      render: v => <span style={{ fontWeight: 600 }}>{v || 0}</span>
    },
    {
      title: '链接',
      dataIndex: 'token',
      key: 'token',
      width: 100,
      render: (token, record) => record.status === 2 ? (
        <CopyButton
          text={getSurveyUrl(token)}
          icon={<CopyOutlined />}
          onCopy={() => message.success('链接已复制')}
        />
      ) : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.status === 1 && (
            <Popconfirm
              title="确定要开始收集该问卷吗？"
              description="开始后将生成正式的填写链接，可以分发给员工参与调研。"
              onConfirm={() => handleStart(record)}
              okText="确定开始"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<PlayCircleOutlined />}>
                开始
              </Button>
            </Popconfirm>
          )}
          {record.status === 2 && (
            <Popconfirm
              title="确定要结束该问卷吗？"
              description="结束后将无法再收集新的回答，请确认所有数据已回收。"
              onConfirm={() => handleStop(record)}
              okText="确定结束"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" size="small" icon={<StopOutlined />}>
                结束
              </Button>
            </Popconfirm>
          )}
          {record.status === 1 && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定删除该问卷？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ]

  // 部门选项 - 事业部管理员只能看到自己的部门
  const deptOptions = departments
    .filter(d => {
      if (user.role === 1) return d.level === 1 // 超级管理员看到所有一级部门
      return d.id === user.departmentId // 事业部管理员只看到自己的部门
    })
    .map(d => ({
      value: d.id,
      label: d.name
    }))

  // 统计
  const stats = {
    total: questionnaires.length,
    collecting: questionnaires.filter(q => q.status === 2).length,
    totalResponses: questionnaires.reduce((sum, q) => sum + (q.survey_count || 0), 0)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>问卷管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建问卷
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="问卷总数" value={stats.total} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="收集中" value={stats.collecting} suffix="个" valueStyle={{ color: '#52C41A' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="总回收量" value={stats.totalResponses} suffix="份" />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={questionnaires}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingQ ? '编辑问卷' : '创建问卷'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="departmentId"
            label="所属部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select
              placeholder="选择部门"
              options={deptOptions}
              disabled={!!editingQ}  // 编辑时禁用（不能改部门），新增时可以选
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="问卷名称"
            rules={[{ required: true, message: '请输入问卷名称' }]}
          >
            <Input placeholder="如：2024年Q1组织氛围调研" />
          </Form.Item>

          <Form.Item name="startDate" label="开始日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="endDate" label="结束日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          {editingQ && (
            <Form.Item name="status" label="状态">
              <Select
                options={[
                  { value: 1, label: '草稿' },
                  { value: 2, label: '收集中' },
                  { value: 3, label: '已结束' }
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default QuestionnaireManager
