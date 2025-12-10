
import React, { useState } from 'react';
import { generateAssessmentStructure, evaluateAssessment } from '../services/geminiService';
import { AssessmentData, Skill, AssessmentResult, EmployeeInfo } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, CheckCircle2, AlertCircle, BarChart3, ArrowRight, BrainCircuit, Printer, Trash2, Plus, Edit3, Save, GraduationCap, BookOpen } from 'lucide-react';

const Assessment: React.FC = () => {
  // Application State
  const [step, setStep] = useState<'details' | 'editing' | 'scoring' | 'result'>('details');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo>({ id: '', name: '' });
  const [roleInput, setRoleInput] = useState('');
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Validation State
  const [idError, setIdError] = useState('');

  // Local Storage Key
  const STORAGE_KEY = 'skillarchitect_submitted_ids';

  // Handlers for Step 1: Details
  const handleStartProcess = async () => {
    setIdError('');
    if (!employeeInfo.id.trim() || !employeeInfo.name.trim() || !roleInput.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    // Check for duplicate ID
    const submittedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (submittedIds.includes(employeeInfo.id)) {
      setIdError('This Employee ID has already submitted an assessment.');
      return;
    }

    setLoading(true);
    setAssessmentData(null);
    setResult(null);
    setUserScores({});

    try {
      const data = await generateAssessmentStructure(roleInput);
      setAssessmentData(data);
      setStep('editing');
    } catch (error) {
      console.error(error);
      alert("Failed to generate assessment structure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Step 2: Edit Structure
  const handleSkillChange = (index: number, field: keyof Skill, value: any) => {
    if (!assessmentData) return;
    const newSkills = [...assessmentData.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setAssessmentData({ ...assessmentData, skills: newSkills });
  };

  const handleAddSkill = () => {
    if (!assessmentData) return;
    const newSkill: Skill = {
      name: "New Skill",
      description: "Description of the skill",
      category: "Hard Skills",
      maxScore: 10
    };
    setAssessmentData({ ...assessmentData, skills: [...assessmentData.skills, newSkill] });
  };

  const handleDeleteSkill = (index: number) => {
    if (!assessmentData) return;
    const newSkills = assessmentData.skills.filter((_, i) => i !== index);
    setAssessmentData({ ...assessmentData, skills: newSkills });
  };

  const handleConfirmStructure = () => {
    setStep('scoring');
  };

  // Handlers for Step 3: Scoring
  const handleScoreChange = (skillName: string, score: number) => {
    setUserScores(prev => ({ ...prev, [skillName]: score }));
  };

  const handleSubmitAssessment = async () => {
    if (!assessmentData) return;
    setLoading(true);
    
    const scoredSkills = assessmentData.skills.map(skill => ({
      ...skill,
      userScore: userScores[skill.name] || 0
    }));

    try {
      const evaluation = await evaluateAssessment(assessmentData.role, scoredSkills, employeeInfo.name);
      setResult({
        ...evaluation,
        employeeInfo,
        role: assessmentData.role
      });
      
      // Persist submission to prevent duplicates
      const submittedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!submittedIds.includes(employeeInfo.id)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...submittedIds, employeeInfo.id]));
      }

      setStep('result');
    } catch (error) {
      console.error(error);
      alert("Failed to evaluate results.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Step 4: Result
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleNewAssessment = () => {
    setStep('details');
    setEmployeeInfo({ id: '', name: '' });
    setRoleInput('');
    setAssessmentData(null);
    setResult(null);
    setUserScores({});
    setIdError('');
  };

  // Chart Data preparation
  const chartData = assessmentData?.skills.map(skill => ({
    subject: skill.name,
    A: userScores[skill.name] || 0,
    fullMark: skill.maxScore,
  })) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4 no-print">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Role Competency Assessment</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Manage employee assessments, customize competency models, and generate AI-powered reports.
        </p>
      </div>

      {/* Step 1: Details Input */}
      {step === 'details' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center space-y-6 max-w-xl mx-auto">
          <div className="w-full space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Employee Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Employee ID</label>
                <input
                  type="text"
                  value={employeeInfo.id}
                  onChange={(e) => {
                    setEmployeeInfo(prev => ({ ...prev, id: e.target.value }));
                    setIdError('');
                  }}
                  placeholder="e.g. EMP-001"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-black placeholder-gray-500 ${idError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'} focus:ring-2 outline-none transition-all`}
                />
                {idError && <p className="text-xs text-red-500">{idError}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Employee Name</label>
                <input
                  type="text"
                  value={employeeInfo.name}
                  onChange={(e) => setEmployeeInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Target Position</label>
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="e.g. Senior Data Analyst"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleStartProcess()}
              />
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleStartProcess}
                disabled={loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Initialize Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Edit Structure */}
      {step === 'editing' && assessmentData && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Customize Competencies</h3>
               <p className="text-sm text-slate-500">Review and edit the skills for <span className="font-semibold">{assessmentData.role}</span></p>
             </div>
             <button
               onClick={handleConfirmStructure}
               className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
             >
               <Save className="w-4 h-4" />
               Confirm & Start
             </button>
          </div>

          <div className="space-y-4">
            {assessmentData.skills.map((skill, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group">
                <button 
                  onClick={() => handleDeleteSkill(idx)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Skill"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4 pr-10">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Skill Name</label>
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => handleSkillChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black placeholder-gray-500 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-1 flex-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                      <select
                        value={skill.category}
                        onChange={(e) => handleSkillChange(idx, 'category', e.target.value)}
                        className="w-full px-3 py-2 bg-white text-black placeholder-gray-500 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                      >
                        <option value="Hard Skills">Hard Skills</option>
                        <option value="Soft Skills">Soft Skills</option>
                      </select>
                    </div>
                    <div className="space-y-1 w-24">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Max Score</label>
                      <input
                        type="number"
                        value={skill.maxScore}
                        onChange={(e) => handleSkillChange(idx, 'maxScore', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white text-black placeholder-gray-500 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                    <textarea
                      value={skill.description}
                      onChange={(e) => handleSkillChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black placeholder-gray-500 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none resize-none h-20"
                    />
                </div>
              </div>
            ))}
            
            <button
              onClick={handleAddSkill}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Competency
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Scoring */}
      {step === 'scoring' && assessmentData && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">Scoring: {employeeInfo.name}</h3>
              <p className="text-sm text-slate-500">{assessmentData.role}</p>
            </div>
            <button onClick={() => setStep('editing')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              <Edit3 className="w-4 h-4" /> Edit Competencies
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             {assessmentData.skills.map((skill, idx) => (
               <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">{skill.name}</h4>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${skill.category === 'Hard Skills' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {skill.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-6 min-h-[40px]">{skill.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Novice</span>
                      <span>Expert</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={skill.maxScore}
                      step="1"
                      value={userScores[skill.name] || 0}
                      onChange={(e) => handleScoreChange(skill.name, parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="text-center font-bold text-indigo-600">
                      {userScores[skill.name] || 0} / {skill.maxScore}
                    </div>
                  </div>
               </div>
             ))}
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={handleSubmitAssessment}
              disabled={loading}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Generate Final Report
                  <BrainCircuit className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result Report */}
      {step === 'result' && result && assessmentData && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
           <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none">
              
              {/* Report Header */}
              <div className="bg-indigo-600 p-8 text-white flex flex-col gap-4 print:bg-white print:text-black print:border-b-2 print:border-slate-800 print:px-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Competency Assessment Report</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-4 text-sm opacity-90 print:text-slate-800 print:opacity-100">
                      <div><span className="opacity-70 print:font-bold">Employee:</span> {employeeInfo.name}</div>
                      <div><span className="opacity-70 print:font-bold">ID:</span> {employeeInfo.id}</div>
                      <div><span className="opacity-70 print:font-bold">Position:</span> {assessmentData.role}</div>
                      <div><span className="opacity-70 print:font-bold">Date:</span> {new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 px-6 py-4 rounded-xl backdrop-blur-sm print:bg-transparent print:border print:border-slate-300">
                    <div className="text-right">
                      <div className="text-sm opacity-80 print:text-slate-600">Overall Score</div>
                      <div className="text-3xl font-bold print:text-black">{result.overallScore}/100</div>
                    </div>
                    <BarChart3 className="w-10 h-10 opacity-80 print:text-slate-800" />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8 p-8 print:block print:p-0 print:pt-6">
                {/* Radar Chart - Visually hidden in some print modes if canvas doesn't render well, but rechart usually fine with bg-print */}
                <div className="md:col-span-1 h-64 relative print:h-96 print:mb-8 page-break-inside-avoid">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="transparent" />
                      <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.4}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Text Analysis */}
                <div className="md:col-span-2 space-y-6 print:space-y-4">
                   <div className="page-break-inside-avoid">
                     <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                       <BrainCircuit className="w-5 h-5 text-indigo-500" />
                       Executive Summary
                     </h4>
                     <p className="text-slate-600 leading-relaxed text-justify">{result.summary}</p>
                   </div>
                   
                   <div className="grid sm:grid-cols-2 gap-4 print:grid-cols-2">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 print:bg-white print:border-emerald-200 page-break-inside-avoid">
                        <h5 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Key Strengths
                        </h5>
                        <ul className="space-y-2">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-emerald-700 flex items-start gap-2 print:text-black">
                              <span className="mt-1.5 w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 print:bg-white print:border-amber-200 page-break-inside-avoid">
                        <h5 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Areas for Growth
                        </h5>
                         <ul className="space-y-2">
                          {result.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-amber-700 flex items-start gap-2 print:text-black">
                              <span className="mt-1.5 w-1 h-1 bg-amber-500 rounded-full flex-shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 px-8 pb-8 print:block print:px-0 print:pb-0">
                  <div className="bg-slate-50 p-8 border-t border-slate-200 print:bg-white print:pt-4 page-break-inside-avoid rounded-bl-2xl print:rounded-none">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        Strategic Recommendations
                    </h4>
                    <div className="grid gap-3">
                    {result.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-slate-200">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5 print:bg-slate-200 print:text-black">
                            {i + 1}
                        </div>
                        <p className="text-slate-700">{rec}</p>
                        </div>
                    ))}
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-8 border-t border-indigo-100 print:bg-white print:pt-4 page-break-inside-avoid rounded-br-2xl print:rounded-none">
                    <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        Training & Development Plan
                    </h4>
                    <div className="grid gap-3">
                    {result.trainingRecommendations?.map((rec, i) => (
                        <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm border border-indigo-100 print:shadow-none print:border print:border-slate-200">
                            <span className="mt-1 text-indigo-500 print:text-black">•</span>
                            <p className="text-slate-700">{rec}</p>
                        </div>
                    ))}
                    </div>
                  </div>
              </div>

              {/* Actions Footer - Hidden on Print */}
              <div className="p-8 border-t border-slate-200 flex justify-between items-center no-print">
                 <button 
                  onClick={handleNewAssessment}
                  className="px-6 py-3 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
                 >
                   <ArrowRight className="w-4 h-4 rotate-180" />
                   New Assessment
                 </button>
                 
                 <button 
                   type="button"
                   onClick={handlePrint}
                   className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg"
                 >
                   <Printer className="w-4 h-4" />
                   Print Report to PDF
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Assessment;
