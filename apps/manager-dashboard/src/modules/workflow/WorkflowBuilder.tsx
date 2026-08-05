import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Save, Star, Edit3,
  Clock, User, ChevronDown, ChevronUp, X, Check, Settings
} from 'lucide-react';
import { getWorkflowTemplates, createWorkflowTemplate, updateWorkflowTemplate } from './workflow.service';

interface Step {
  id?: string;
  stepOrder: number;
  name: string;
  nameAr: string;
  role: string;
  slaDurationHours: number;
  description?: string;
  isRequired: boolean;
}

interface Template {
  id?: string;
  name: string;
  nameAr: string;
  description?: string;
  isDefault: boolean;
  steps: Step[];
}

const ROLE_OPTIONS = [
  { value: 'HIRING_MANAGER', label: 'Hiring Manager', labelAr: 'مدير التوظيف' },
  { value: 'HR_MANAGER', label: 'HR Manager', labelAr: 'مدير الموارد البشرية' },
  { value: 'MANAGEMENT', label: 'Management', labelAr: 'الإدارة العليا' },
  { value: 'RECRUITER', label: 'Recruiter', labelAr: 'المسؤول عن التوظيف' },
  { value: 'FINANCE', label: 'Finance', labelAr: 'المالية' },
];

const DEFAULT_NEW_TEMPLATE: Template = {
  name: '',
  nameAr: '',
  description: '',
  isDefault: false,
  steps: [
    { stepOrder: 1, name: 'Job Request Created', nameAr: 'إنشاء طلب التوظيف', role: 'HIRING_MANAGER', slaDurationHours: 24, isRequired: true },
    { stepOrder: 2, name: 'HR Review', nameAr: 'مراجعة HR', role: 'HR_MANAGER', slaDurationHours: 48, isRequired: true },
    { stepOrder: 3, name: 'Approval', nameAr: 'الموافقة الإدارية', role: 'MANAGEMENT', slaDurationHours: 72, isRequired: true },
    { stepOrder: 4, name: 'Candidate Search', nameAr: 'البحث عن المرشحين', role: 'RECRUITER', slaDurationHours: 168, isRequired: true },
    { stepOrder: 5, name: 'Interview Process', nameAr: 'عملية المقابلات', role: 'RECRUITER', slaDurationHours: 240, isRequired: true },
    { stepOrder: 6, name: 'Offer Stage', nameAr: 'مرحلة العرض', role: 'HR_MANAGER', slaDurationHours: 72, isRequired: true },
    { stepOrder: 7, name: 'Hiring Completed', nameAr: 'اكتمال التعيين', role: 'HR_MANAGER', slaDurationHours: 24, isRequired: true },
  ]
};

interface WorkflowBuilderProps {
  onSaved: () => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onSaved }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await getWorkflowTemplates();
      setTemplates(res.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const startNew = () => {
    setSelectedTemplateId(null);
    setEditingTemplate({ ...DEFAULT_NEW_TEMPLATE, steps: DEFAULT_NEW_TEMPLATE.steps.map(s => ({ ...s })) });
  };

  const startEdit = (template: any) => {
    setSelectedTemplateId(template.id);
    setEditingTemplate({
      id: template.id,
      name: template.name,
      nameAr: template.nameAr,
      description: template.description,
      isDefault: template.isDefault,
      steps: [...(template.steps || [])].sort((a: any, b: any) => a.stepOrder - b.stepOrder)
    });
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setSelectedTemplateId(null);
    setSuccess('');
    setError('');
  };

  const addStep = () => {
    if (!editingTemplate) return;
    const newOrder = editingTemplate.steps.length + 1;
    setEditingTemplate({
      ...editingTemplate,
      steps: [...editingTemplate.steps, {
        stepOrder: newOrder,
        name: `Step ${newOrder}`,
        nameAr: `المرحلة ${newOrder}`,
        role: 'HR_MANAGER',
        slaDurationHours: 48,
        isRequired: true
      }]
    });
  };

  const removeStep = (index: number) => {
    if (!editingTemplate) return;
    const updated = editingTemplate.steps.filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stepOrder: i + 1 }));
    setEditingTemplate({ ...editingTemplate, steps: updated });
  };

  const updateStep = (index: number, field: keyof Step, value: any) => {
    if (!editingTemplate) return;
    const updated = editingTemplate.steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setEditingTemplate({ ...editingTemplate, steps: updated });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!editingTemplate) return;
    const steps = [...editingTemplate.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
    const reordered = steps.map((s, i) => ({ ...s, stepOrder: i + 1 }));
    setEditingTemplate({ ...editingTemplate, steps: reordered });
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    if (!editingTemplate.nameAr) { setError('يرجى إدخال اسم القالب'); return; }
    if (editingTemplate.steps.length === 0) { setError('يجب أن يحتوي القالب على مرحلة واحدة على الأقل'); return; }

    setSaving(true);
    setError('');
    try {
      if (selectedTemplateId) {
        await updateWorkflowTemplate(selectedTemplateId, editingTemplate);
        setSuccess('تم تحديث القالب بنجاح ✅');
      } else {
        await createWorkflowTemplate(editingTemplate);
        setSuccess('تم إنشاء القالب بنجاح ✅');
      }
      await loadTemplates();
      onSaved();
      setTimeout(() => { cancelEdit(); setSuccess(''); }, 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates List */}
      {!editingTemplate && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">قوالب Workflow</h2>
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              قالب جديد
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tmpl) => (
                <motion.div
                  key={tmpl.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ background: 'rgba(30,27,75,0.6)', border: `1px solid ${tmpl.isDefault ? '#6366f1' : 'rgba(255,255,255,0.1)'}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{tmpl.nameAr}</h3>
                        {tmpl.isDefault && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                            style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                            <Star className="w-3 h-3" />
                            افتراضي
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{tmpl.name}</p>
                      {tmpl.description && <p className="text-gray-500 text-xs mt-1">{tmpl.description}</p>}
                    </div>
                    <button
                      onClick={() => startEdit(tmpl)}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(tmpl.steps || []).map((step: any) => (
                      <span key={step.id} className="px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                        {step.nameAr} ({step.slaDurationHours}h)
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">{tmpl.steps?.length || 0} مراحل</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <AnimatePresence>
        {editingTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.3)' }}
          >
            {/* Editor Header */}
            <div className="p-5 flex items-center justify-between"
              style={{ background: 'rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-semibold">
                  {selectedTemplateId ? 'تعديل القالب' : 'إنشاء قالب جديد'}
                </h3>
              </div>
              <button onClick={cancelEdit} className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5" style={{ background: 'rgba(15,23,42,0.8)' }}>
              {/* Alerts */}
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                  <Check className="w-4 h-4" />
                  {success}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  <X className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Template Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الاسم بالعربية *</label>
                  <input
                    value={editingTemplate.nameAr}
                    onChange={e => setEditingTemplate({ ...editingTemplate, nameAr: e.target.value })}
                    placeholder="مسار التوظيف الأساسي"
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الاسم بالإنجليزية *</label>
                  <input
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="Standard Recruitment Workflow"
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTemplate.isDefault}
                    onChange={e => setEditingTemplate({ ...editingTemplate, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-300">تعيين كقالب افتراضي</span>
                </label>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">مراحل الـ Workflow</h4>
                  <button onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مرحلة
                  </button>
                </div>

                <div className="space-y-3">
                  {editingTemplate.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      layout
                      className="rounded-xl p-4"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                          {step.stepOrder}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            value={step.nameAr}
                            onChange={e => updateStep(i, 'nameAr', e.target.value)}
                            placeholder="اسم المرحلة بالعربية"
                            className="px-3 py-2 rounded-lg text-white text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <input
                            value={step.name}
                            onChange={e => updateStep(i, 'name', e.target.value)}
                            placeholder="Step name in English"
                            className="px-3 py-2 rounded-lg text-white text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveStep(i, 'up')} disabled={i === 0}
                            className="p-1.5 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => moveStep(i, 'down')} disabled={i === editingTemplate.steps.length - 1}
                            className="p-1.5 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeStep(i)}
                            className="p-1.5 rounded text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            المسؤول
                          </label>
                          <select
                            value={step.role}
                            onChange={e => updateStep(i, 'role', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.labelAr}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            SLA (ساعة)
                          </label>
                          <input
                            type="number"
                            value={step.slaDurationHours}
                            onChange={e => updateStep(i, 'slaDurationHours', parseInt(e.target.value) || 24)}
                            min={1}
                            className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={cancelEdit}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  إلغاء
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : <Save className="w-4 h-4" />}
                  {saving ? 'جاري الحفظ...' : 'حفظ القالب'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowBuilder;
