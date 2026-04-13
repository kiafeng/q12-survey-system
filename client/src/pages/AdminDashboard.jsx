import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Progress, Tag, Spin } from 'antd'
import ReactECharts from 'echarts-for-react'
import { apiGet } from '../utils/api'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [rankings, setRankings] = useState([])
  const [dimensions, setDimensions] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [overviewRes, rankingRes, dimensionRes] = await Promise.all([
        apiGet('/api/stats/overview'),
        apiGet('/api/stats/department-ranking'),
        apiGet('/api/stats/dimensions')
      ])
      setStats(overviewRes.stats)
      setRankings(rankingRes.rankings)
      setDimensions(dimensionRes.dimensions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 8) return '#52C41A'
    if (score >= 7) return '#73D13D'
    if (score >= 6) return '#FAAD14'
    return '#FF4D4F'
  }

  const getStatusTag = (score) => {
    if (score >= 8) return <Tag color="success">优秀</Tag>
    if (score >= 7) return <Tag color="processing">良好</Tag>
    if (score >= 6) return <Tag color="warning">待提升</Tag>
    return <Tag color="error">需关注</Tag>
  }

  const radarOption = {
    title: {
      text: 'Q12维度雷达图',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: dimensions.map(d => ({
        name: d.dimension,
        max: 10
      })),
      radius: '60%',
      axisName: {
        color: '#666',
        fontSize: 12
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: dimensions.map(d => d.avgScore),
        name: '综合得分',
        areaStyle: {
          color: 'rgba(22, 119, 255, 0.3)'
        },
        lineStyle: {
          color: '#1677FF',
          width: 2
        },
        itemStyle: {
          color: '#1677FF'
        }
      }],
      label: {
        show: true,
        formatter: '{c}'
      }
    }]
  }

  const barOption = {
    title: {
      text: 'Q12各题得分',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats?.q12Scores?.map((_, i) => `Q${i + 1}`) || [],
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: stats?.q12Scores?.map(q => ({
        value: q.avgScore,
        itemStyle: {
          color: getScoreColor(q.avgScore)
        }
      })) || [],
      barWidth: '60%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        fontSize: 10
      }
    }]
  }

  const columns = [
    {
      title: '部门',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span>
          {text}
          {record.level === 1 && <Tag color="blue" style={{ marginLeft: 8 }}>事业部</Tag>}
        </span>
      )
    },
    {
      title: '问卷数量',
      dataIndex: 'survey_count',
      key: 'survey_count',
      width: 100,
      render: v => v || 0
    },
    {
      title: '综合得分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      width: 120,
      render: (v) => v ? (
        <span style={{ color: getScoreColor(v), fontWeight: 600 }}>
          {v.toFixed(2)}
        </span>
      ) : '-'
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => record.avgScore ? getStatusTag(record.avgScore) : <Tag>暂无数据</Tag>
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载数据中..." />
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 600 }}>数据看板</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="dashboard-stat-card">
            <div className="stat-value" style={{ color: '#1677FF' }}>{stats?.totalSurveys || 0}</div>
            <div className="stat-label">已收集问卷</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="dashboard-stat-card">
            <div className="stat-value" style={{ color: '#52C41A' }}>{stats?.totalDepartments || 0}</div>
            <div className="stat-label">参与部门</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="dashboard-stat-card">
            <div className="stat-value" style={{ color: '#FAAD14' }}>{stats?.avgScore?.toFixed(1) || '-'}</div>
            <div className="stat-label">Q12综合得分</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="dashboard-stat-card">
            <div className="stat-value" style={{ fontSize: 24 }}>
              {stats?.avgScore ? (
                <span style={{ color: getScoreColor(stats.avgScore) }}>
                  {stats.avgScore >= 8 ? '优秀' : stats.avgScore >= 7 ? '良好' : stats.avgScore >= 6 ? '一般' : '待改进'}
                </span>
              ) : '-'}
            </div>
            <div className="stat-label">整体评级</div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div className="radar-container">
            <ReactECharts option={radarOption} style={{ height: 400 }} />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="radar-container">
            <ReactECharts option={barOption} style={{ height: 400 }} />
          </div>
        </Col>
      </Row>

      <Card title="部门排名" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={rankings}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title="各维度得分详情" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          {dimensions.map(dim => (
            <Col xs={12} sm={8} lg={6} key={dim.dimension}>
              <div style={{
                background: dim.status === 'excellent' ? '#F6FFED' :
                           dim.status === 'good' ? '#E6F4FF' :
                           dim.status === 'warning' ? '#FFFBE6' : '#FFF2F0',
                padding: 16,
                borderRadius: 8,
                border: `1px solid ${dim.status === 'excellent' ? '#D9F7BE' :
                                        dim.status === 'good' ? '#91CAFF' :
                                        dim.status === 'warning' ? '#FFE58F' : '#FFCCC7'}`
              }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{dim.dimension}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(dim.avgScore) }}>
                  {dim.avgScore.toFixed(1)}
                </div>
                <Progress
                  percent={dim.avgScore * 10}
                  showInfo={false}
                  strokeColor={getScoreColor(dim.avgScore)}
                  trailColor="rgba(0,0,0,0.06)"
                  size="small"
                />
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default AdminDashboard
