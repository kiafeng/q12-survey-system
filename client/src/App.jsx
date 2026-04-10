import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import SurveyPage from './pages/SurveyPage'
import ThankYouPage from './pages/ThankYouPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminDepartments from './pages/AdminDepartments'
import AdminUsers from './pages/AdminUsers'
import AdminAnalysis from './pages/AdminAnalysis'
import QuestionnaireManager from './pages/QuestionnaireManager'
import AdminLayout from './components/AdminLayout'

const theme = {
  token: {
    colorPrimary: '#1677FF',
    borderRadius: 6,
    fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, sans-serif'
  }
}

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/survey/:token" element={<SurveyPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analysis" element={<AdminAnalysis />} />
            <Route path="questionnaire" element={<QuestionnaireManager />} />
          </Route>
          <Route path="*" element={<SurveyPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
