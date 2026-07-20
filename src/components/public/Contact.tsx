import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, Sparkles, Send, Shield } from 'lucide-react';

export default function Contact() {
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-20');
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [goals, setGoals] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const dates = [
    { label: 'Mon, Jul 20', val: '2026-07-20' },
    { label: 'Tue, Jul 21', val: '2026-07-21' },
    { label: 'Wed, Jul 22', val: '2026-07-22' },
    { label: 'Thu, Jul 23', val: '2026-07-23' },
    { label: 'Fri, Jul 24', val: '2026-07-24' },
  ];

  const times = [
    '09:00 AM', '10:00 AM', '11:30 AM', '01:30 PM', '03:00 PM', '04:30 PM'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Please fill in required fields.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <section id="contact-section" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-100 text-xs font-mono font-bold text-blue-600">
            <Calendar className="w-3.5 h-3.5" />
            COMPLIMENTARY CONSULTATION
          </div>
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Schedule a Systems Discovery Call
          </h3>
          <p className="text-slate-500 font-light text-base leading-relaxed">
            Choose a convenient date and time on my scheduler calendar below. We will discuss your current technology gaps, conversion targets, and how Accessmart Solutions can deliver.
          </p>
        </div>

        {submitted ? (
          <div className="max-w-2xl mx-auto border border-emerald-100 bg-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="font-display text-2xl font-bold text-slate-900">Consultation Scheduled!</h4>
              <p className="text-slate-500 text-sm font-light max-w-md mx-auto">
                Thank you, {name}. A Calendar invite has been dispatched to <strong>{email}</strong> for <strong>{selectedDate} at {selectedTime}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-500 inline-block">
              Host: Samuel Oluwadamilare • Delivery: Accessmart Solutions
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-sm">
            
            {/* Left - Scheduler widget */}
            <div className="md:col-span-7 bg-slate-900 text-white p-6 sm:p-8 space-y-6 flex flex-col justify-between text-left">
              <div className="space-y-4 col-span-full">
                <span className="font-mono text-[9px] text-blue-400 tracking-widest uppercase font-bold">SELECT TIMEFRAME</span>
                <h4 className="font-display text-lg font-bold">Choose Date & Slot</h4>
                
                {/* Date options */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {dates.map(d => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setSelectedDate(d.val)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        selectedDate === d.val 
                          ? 'bg-blue-600 border-blue-500 text-white font-semibold' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <p className="font-mono text-[9px] uppercase">{d.label.split(',')[0]}</p>
                      <p className="font-display font-bold text-[11px] mt-0.5">{d.label.split(',')[1].trim()}</p>
                    </button>
                  ))}
                </div>

                {/* Time options */}
                <div className="space-y-2 pt-4">
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">Available times (Houston Timezone):</span>
                  <div className="grid grid-cols-3 gap-2">
                    {times.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                          selectedTime === t 
                            ? 'bg-emerald-600 border-emerald-500 text-white font-bold' 
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>15-Minute screen share diagnostic. Completely free.</span>
              </div>
            </div>

            {/* Right - Lead Intake details */}
            <form onSubmit={handleSubmit} className="md:col-span-5 p-6 sm:p-8 space-y-4 text-left text-xs">
              <span className="font-mono text-[9px] text-slate-400 tracking-widest uppercase block font-bold">YOUR INFORMATION</span>
              <h4 className="font-display text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">Intake Particulars</h4>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">Your Name *</label>
                  <input
                    type="text" required placeholder="e.g. Samuel Oluwadamilare" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">Business Name</label>
                  <input
                    type="text" placeholder="e.g. Apex Partners" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">Email Address *</label>
                  <input
                    type="email" required placeholder="owner@apexdental.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">What are we solving on this call?</label>
                  <textarea
                    rows={2} placeholder="Explain your core bottleneck..." value={goals} onChange={(e) => setGoals(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Schedule Slot
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                </button>
                <div className="flex items-center gap-1 font-mono text-[9px] text-slate-400">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span>Hosted securely. Your information is protected.</span>
                </div>
              </div>
            </form>

          </div>
        )}

      </div>
    </section>
  );
}
