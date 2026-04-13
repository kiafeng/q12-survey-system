import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Select, Tag, Spin, Button, message, Space, Empty } from 'antd'
import { ReloadOutlined, DownloadOutlined, BulbOutlined, SwapOutlined } from '@ant-design/icons'
import { apiGet, apiDownload } from '../utils/api'
import dayjs from 'dayjs'

const AdminAnalysis = () => {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [compareAnalysis, setCompareAnalysis] = useState(null)
  const [departments, setDepartments] = useState([])
  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState([])
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))

  useEffect(() => {
    loadDepartments()
    loadQuestionnaires()
  }, [])

  useEffect(() => {
    loadAnalysis()
  }, [selectedDept, selectedQuestionnaires])

  const loadDepartments = async () => {
    try {
      const res = await apiGet('/api/departments')
      setDepartments(res.departments)
    } catch (err) {
      console.error(err)
    }
  }

  const loadQuestionnaires = async () => {
    try {
      const res = await apiGet('/api/questionnaires')
      // 显示所有有数据的问卷（草稿、收集中、已结束都可以看）
      // 但分析功能只对有数据的问卷有效
      setQuestionnaires(res.questionnaires)
    } catch (err) {
      console.error(err)
    }
  }

  const loadAnalysis = async () => {
    if (selectedQuestionnaires.length === 0) {
      setAnalysis(null)
      setCompareAnalysis(null)
      return
    }

    setLoading(true)
    try {
      // 主分析：第一个选中的问卷
      const mainId = selectedQuestionnaires[0]
      const params = new URLSearchParams()
      params.append('questionnaireId', mainId)
      if (selectedDept) params.append('departmentId', selectedDept)
      
      const res = await apiGet(`/stats/ai-analysis?${params.toString()}`)
      setAnalysis(res.analysis)

      // 对比分析：如果选中了多个问卷
      if (selectedQuestionnaires.length > 1) {
        const compareId = selectedQuestionnaires[1]
        const compareParams = new URLSearchParams()
        compareParams.append('questionnaireId', compareId)
        if (selectedDept) compareParams.append('departmentId', selectedDept)
        
        const compareRes = await apiGet(`/stats/ai-analysis?${compareParams.toString()}`)
        setCompareAnalysis(compareRes.analysis)
      } else {
        setCompareAnalysis(null)
      }
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (selectedQuestionnaires.length === 0) {
      message.warning('请先选择要导出的问卷')
      return
    }
    const qTitles = selectedQuestionnaires
      .map(id => questionnaires.find(q => q.id === id)?.title || '')
      .join('_vs_')
    apiDownload(
      `/export/excel?questionnaireId=${selectedQuestionnaires.join(',')}${selectedDept ? `&departmentId=${selectedDept}` : ''}`,
      `Q12调研报告_${qTitles}_${new Date().toLocaleDateString()}.csv`
    )
    message.success('导出成功')
  }

  const getScoreColor = (score) => {
    if (score >= 8) return '#52C41A'
    if (score >= 7) return '#73D13D'
    if (score >= 6) return '#FAAD14'
    return '#FF4D4F'
  }

  const getScoreTag = (score) => {
    if (score >= 8) return <Tag color="success">优秀</Tag>
    if (score >= 7) return <Tag color="processing">良好</Tag>
    if (score >= 6) return <Tag color="warning">待提升</Tag>
    return <Tag color="error">需关注</Tag>
  }

  const getChangeTag = (change) => {
    if (change > 0) return <Tag color="success">↑ {change.toFixed(1)}</Tag>
    if (change < 0) return <Tag color="error">↓ {Math.abs(change).toFixed(1)}</Tag>
    return <Tag color="default">-</Tag>
  }

  const departmentOptions = [
    { value: null, label: '全部部门' },
    ...departments.filter(d => d.level === 1).map(d => ({
      value: d.id,
      label: d.name
    }))
  ]

  const getStatusTag = (status) => {
    switch (status) {
      case 1: return <Tag color="default">草稿</Tag>
      case 2: return <Tag color="processing">收集中</Tag>
      case 3: return <Tag color="success">已结束</Tag>
      default: return null
    }
  }

  const questionnaireOptions = questionnaires
    .filter(q => !selectedDept || q.department_id === selectedDept || 
                 departments.find(d => d.id === selectedDept)?.parent_id === q.department_id)
    .map(q => ({
      value: q.id,
      label: (
        <span>
          {getStatusTag(q.status)}
          {q.title}
          <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
            ({dayjs(q.created_at).format('YYYY-MM-DD')})
          </span>
        </span>
      )
    }))

  const getQuestionnaireTitle = (id) => {
    const q = questionnaires.find(q => q.id === id)
    return q ? q.title : id
  }

  const renderDimensionCompare = () => {
    if (!analysis || !compareAnalysis || !analysis.dimensionAnalysis || !compareAnalysis.dimensionAnalysis) {
      return null
    }

    const dims = Object.keys(analysis.dimensionAnalysis)

    return (
      <Card 
        title={
          <Space>
            <SwapOutlined />
            <span>维度对比分析</span>
            <Tag color="blue">{getQuestionnaireTitle(selectedQuestionnaires[0])}</Tag>
            <span>vs</span>
            <Tag color="purple">{getQuestionnaireTitle(selectedQuestionnaires[1])}</Tag>
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          {dims.map(dim => {
            const current = analysis.dimensionAnalysis[dim]?.avg || 0
            const previous = compareAnalysis.dimensionAnalysis[dim]?.avg || 0
            const change = current - previous

            return (
              <Col xs={12} sm={8} lg={6} key={dim}>
                <div style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #E8E8E8',
                  background: '#FAFAFA'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{dim}</span>
                    {getChangeTag(change)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(current) }}>
                      {current.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      / {previous.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ height: 4, background: '#E8E8E8', borderRadius: 2, marginTop: 8 }}>
                    <div style={{
                      width: `${current * 10}%`,
                      height: '100%',
                      background: getScoreColor(current),
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      </Card>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="AI分析中，请稍候..." />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>AI分析报告</h2>
        <Space wrap>
          <Select
            value={selectedDept}
            onChange={(val) => { setSelectedDept(val); setSelectedQuestionnaires([]) }}
            options={departmentOptions}
            style={{ width: 160 }}
            placeholder="选择部门"
            allowClear
          />
          <Select
            mode="multiple"
            value={selectedQuestionnaires}
            onChange={setSelectedQuestionnaires}
            options={questionnaireOptions}
            style={{ minWidth: 300 }}
            placeholder="选择问卷（可多选对比）"
            maxTagCount={2}
            maxTagPlaceholder={(omitted) => `+${omitted.length}期`}
          />
          <Button icon={<ReloadOutlined />} onClick={loadAnalysis} disabled={selectedQuestionnaires.length === 0}>
            重新生成
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} disabled={selectedQuestionnaires.length === 0}>
            导出数据
          </Button>
        </Space>
      </div>

      {selectedQuestionnaires.length === 0 ? (
        <Card>
          <Empty 
            description={
              <span>
                请从上方选择要分析的问卷
                <br />
                <span style={{ color: '#999', fontSize: 12 }}>
                  选择多个问卷可进行对比分析
                </span>
              </span>
            }
          />
        </Card>
      ) : analysis ? (
        <>
          <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Row gutter={[24, 24]} align="middle">
              {/* 第一个问卷得分 */}
              <Col xs={24} md={compareAnalysis ? 8 : 8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
                    {getQuestionnaireTitle(selectedQuestionnaires[0])}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Q12综合得分</div>
                  <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
                    {analysis.totalScore.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 14, marginTop: 8 }}>
                    {analysis.totalScore >= 8 ? '组织氛围优秀' :
                     analysis.totalScore >= 7 ? '组织氛围良好' :
                     analysis.totalScore >= 6 ? '组织氛围中等' : '需重点改善'}
                  </div>
                </div>
              </Col>
              
              {/* 对比箭头 */}
              {compareAnalysis && (
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>对比变化</div>
                    <div style={{ 
                      fontSize: 48, 
                      fontWeight: 700, 
                      lineHeight: 1,
                      color: analysis.totalScore - compareAnalysis.totalScore > 0 ? '#52C41A' : '#FF4D4F'
                    }}>
                      {analysis.totalScore - compareAnalysis.totalScore > 0 ? '↑' : '↓'}
                    </div>
                    <div style={{ 
                      fontSize: 32, 
                      fontWeight: 600,
                      marginTop: 8,
                      color: analysis.totalScore - compareAnalysis.totalScore > 0 ? '#52C41A' : '#FF4D4F'
                    }}>
                      {Math.abs(analysis.totalScore - compareAnalysis.totalScore).toFixed(1)} 分
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                      {analysis.totalScore > compareAnalysis.totalScore ? '有所提升' : '有所下降'}
                    </div>
                  </div>
                </Col>
              )}
              
              {/* 第二个问卷得分（对比时显示） */}
              {compareAnalysis && (
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
                      {getQuestionnaireTitle(selectedQuestionnaires[1])}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Q12综合得分</div>
                    <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
                      {compareAnalysis.totalScore.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 14, marginTop: 8 }}>
                      {compareAnalysis.totalScore >= 8 ? '组织氛围优秀' :
                       compareAnalysis.totalScore >= 7 ? '组织氛围良好' :
                       compareAnalysis.totalScore >= 6 ? '组织氛围中等' : '需重点改善'}
                    </div>
                  </div>
                </Col>
              )}
            </Row>
            
            {/* 摘要信息 */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: 15, lineHeight: 1.8 }}>
                {analysis.summary}
              </div>
              <div style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>
                样本量: {analysis.sampleSize} 份有效问卷 | 生成时间: {new Date(analysis.generatedAt).toLocaleString()}
              </div>
            </div>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div className="analysis-card">
                <h3>
                  <BulbOutlined style={{ color: '#52C41A', marginRight: 8 }} />
                  优势领域 (得分 ≥ 8分)
                </h3>
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  analysis.strengths.map((item, index) => (
                    <div key={index} className="insight-item strength">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{item.dimension}</span>
                        <span style={{ color: '#52C41A', fontWeight: 700, fontSize: 18 }}>
                          {item.score.toFixed(1)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                        {item.insight}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>
                    暂无优势领域数据
                  </div>
                )}
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <div className="analysis-card">
                <h3>
                  <span style={{ color: '#FF4D4F', marginRight: 8 }}>!</span>
                  待改进领域 (得分 {'<'} 7分)
                </h3>
                {analysis.improvements && analysis.improvements.length > 0 ? (
                  analysis.improvements.map((item, index) => (
                    <div key={index} className="insight-item improvement">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{item.dimension}</span>
                        <span style={{ color: '#FF4D4F', fontWeight: 700, fontSize: 18 }}>
                          {item.score.toFixed(1)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                        {item.insight}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#52C41A', textAlign: 'center', padding: 24 }}>
                    太棒了！暂无需重点改进的领域
                  </div>
                )}
              </div>
            </Col>
          </Row>

          <Card title="改进建议" style={{ marginTop: 16 }}>
            {analysis.suggestions && analysis.suggestions.length > 0 ? (
              analysis.suggestions.map((item, index) => (
                <div key={index} className={`suggestion-item ${item.priority}`}>
                  <Tag color={item.priority === 'high' ? 'error' : 'warning'} style={{ marginRight: 8 }}>
                    {item.priority === 'high' ? '高优先级' : '中优先级'}
                  </Tag>
                  <span>{item.suggestion}</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#52C41A', textAlign: 'center', padding: 24 }}>
                各项指标表现良好，继续保持！
              </div>
            )}
          </Card>

          <Card title="各维度详细分析" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              {Object.entries(analysis.dimensionAnalysis || {}).map(([dim, data]) => (
                <Col xs={12} sm={8} lg={6} key={dim}>
                  <div style={{
                    padding: 16,
                    borderRadius: 8,
                    border: `2px solid ${getScoreColor(data.avg)}`,
                    background: data.status === 'excellent' ? '#F6FFED' :
                               data.status === 'good' ? '#E6F4FF' :
                               data.status === 'warning' ? '#FFFBE6' : '#FFF2F0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{dim}</span>
                      {getScoreTag(data.avg)}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: getScoreColor(data.avg) }}>
                      {data.avg.toFixed(1)}
                    </div>
                    <div style={{ height: 4, background: '#E8E8E8', borderRadius: 2, marginTop: 8 }}>
                      <div style={{
                        width: `${data.avg * 10}%`,
                        height: '100%',
                        background: getScoreColor(data.avg),
                        borderRadius: 2,
                        transition: 'width 0.5s'
                      }} />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {renderDimensionCompare()}
        </>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
            暂无分析数据，请检查问卷是否有回收数据
          </div>
        </Card>
      )}
    </div>
  )
}

export default AdminAnalysis
