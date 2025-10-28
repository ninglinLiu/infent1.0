'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'

export function ContactForm() {
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({ 
        message: language === 'zh' ? '请填写所有必填字段' : 'Please fill in all required fields',
        type: 'error'
      })
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({ 
        message: language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address',
        type: 'error'
      })
      return
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast({ 
          message: language === 'zh' ? '提交成功！我们会尽快回复。' : 'Success! We will get back to you soon.',
          type: 'success'
        })
        setFormData({ name: '', email: '', company: '', message: '' })
      }
    } catch (error) {
      toast({ 
        message: language === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again',
        type: 'error'
      })
    }
  }

  return (
    <section id="contact" className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-purple mb-12">
        {language === 'zh' ? '联系我们' : 'Contact Us'}
      </h2>
      <Card className="border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="neon-text-purple">
            {language === 'zh' ? '获取产品演示' : 'Get a Product Demo'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'zh' ? '姓名' : 'Name'} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-black border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'zh' ? '邮箱' : 'Email'} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-black border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'zh' ? '公司' : 'Company'}
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 bg-black border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'zh' ? '留言' : 'Message'} *
              </label>
              <textarea
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 bg-black border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <Button type="submit" variant="neon" className="w-full">
              {language === 'zh' ? '提交' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
