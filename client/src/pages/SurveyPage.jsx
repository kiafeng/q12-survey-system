import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, message, Spin, Progress, Divider } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import axios from 'axios'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const SurveyPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [questionnaire, setQuestionnaire] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    loadSurveyData()
  }, [token])

  // 获取设备指纹
  const getDeviceId = async () => {
    try {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      return result.visitorId
    } catch (err) {
      // 如果获取失败，使用 localStorage 作为备用
      let id = localStorage.getItem('q12_device_id')
      if (!id) {
        id = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now()
        localStorage.setItem('q12_device_id', id)
      }
      return id
    }
  }

  const loadSurveyData = async () => {
    try {
      setLoading(true)
      
      // 获取设备指纹
      const deviceId = await getDeviceId()
      setDeviceId(deviceId)

      const [validateRes, questionsRes] = await Promise.all([
        axios.get(`/api/public/validate-token/${token}`),
        axios.get('/api/public/questions')
      ])
      
      // 检查是否已提交
      const submitCheckRes = await axios.post('/api/public/check-submitted', { 
        token, 
        deviceId 
      })
      
      if (submitCheckRes.data.submitted) {
        setError('您已提交过此问卷，感谢您的参与！')
        setLoading(false)
        return
      }

      setQuestionnaire(validateRes.data.questionnaire)
      setQuestions(questionsRes.data.questions)
    } catch (err) {
      setError(err.response?.data?.error || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreSelect = (questionId, score) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }))
  }

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      message.warning(`还有 ${unanswered.length} 道题目未作答，请完成所有题目`)
      return
    }

    setSubmitting(true)
    try {
      await axios.post('/api/public/submit-survey', { 
        token, 
        answers,
        deviceId  // 提交设备指纹
      })
      message.success('提交成功，感谢您的参与！')
      navigate('/thank-you')
    } catch (err) {
      message.error(err.response?.data?.error || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 10) return '#52C41A'
    if (score >= 8) return '#73D13D'
    if (score >= 6) return '#FAAD14'
    if (score >= 4) return '#FF7A45'
    return '#FF4D4F'
  }

  const answeredCount = Object.keys(answers).length
  const progressPercent = Math.round((answeredCount / 12) * 100)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="加载问卷中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Card style={{ maxWidth: 500, margin: '100px auto' }}>
          <h2 style={{ color: '#FF4D4F' }}>提示</h2>
          <p style={{ color: '#666', marginTop: 16 }}>{error}</p>
          <p style={{ color: '#999', marginTop: 8, fontSize: 12 }}>
            每位员工只需填写一次，感谢您的配合！
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      <div className="survey-header">
        <h1>Q12组织氛围诊断调研</h1>
        <p>您的反馈将帮助我们共同改善工作环境</p>
      </div>

      <div className="survey-card">
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>问卷名称</strong>
              <div style={{ color: '#1677FF', marginTop: 4 }}>{questionnaire?.title}</div>
              {questionnaire?.departmentName && (
                <div style={{ color: '#666', marginTop: 4 }}>部门：{questionnaire.departmentName}</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <Progress type="circle" percent={progressPercent} size={60} />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>完成进度</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#F6FFED', borderRadius: 8, border: '1px solid #D9F7BE' }}>
            <strong style={{ color: '#52C41A' }}>评分说明</strong>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              1分 = 完全不符合 | 5分 = 一般 | 10分 = 完全符合
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {questions.map((q, index) => (
            <div key={q.id} className="question-item">
              <div style={{ marginBottom: 12 }}>
                <span className="question-number">{index + 1}</span>
                <span className="question-text">{q.text}</span>
                <span className="dimension-tag">{q.dimension}</span>
              </div>

              <div className="score-options">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <div key={score} style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className={`score-btn ${answers[q.id] === score ? 'selected' : ''}`}
                      style={{
                        background: answers[q.id] === score ? getScoreColor(score) : undefined,
                        borderColor: answers[q.id] === score ? getScoreColor(score) : undefined
                      }}
                      onClick={() => handleScoreSelect(q.id, score)}
                    >
                      {score}
                    </button>
                  </div>
                ))}
              </div>
              <div className="score-label" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                <span>不符合</span>
                <span>符合</span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              disabled={answeredCount < 12}
              style={{ width: 200, height: 48, fontSize: 16 }}
            >
              {answeredCount < 12 ? `还需回答 ${12 - answeredCount} 题` : '提交问卷'}
            </Button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16, color: '#999', fontSize: 12 }}>
            <CheckCircleFilled style={{ color: '#52C41A', marginRight: 4 }} />
            本次调研采用匿名方式，您的回答将严格保密
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SurveyPage
