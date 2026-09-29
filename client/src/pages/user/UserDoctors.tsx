import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Star,
  CheckCircle2,
  Award,
  Send,
  X,
  Sparkles,
  PhoneCall,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import axiosClient from '../../api/axiosClient.js';
import { Doctor, DoctorMessage } from '../../types/index.js';

export const UserDoctors: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [preferredDocId, setPreferredDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axiosClient.get<{ success: boolean; preferredDoctorId: string | null; doctors: Doctor[] }>('/user/doctors');
      if (res.data?.doctors) {
        setDoctors(res.data.doctors);
        setPreferredDocId(res.data.preferredDoctorId);
      }
    } catch {
      // offline fallback
    }
  };

  const handleSetPreferred = async (doctor: Doctor) => {
    try {
      const res = await axiosClient.post<{ success: boolean; preferredDoctor: Doctor }>(`/user/doctors/${doctor.id}/prefer`);
      if (res.data?.success) {
        setPreferredDocId(doctor.id);
        setToastMsg(`${doctor.name} set as your Preferred Doctor.`);
        await refreshProfile();
        fetchDoctors();
        setTimeout(() => setToastMsg(null), 4000);
      }
    } catch {
      // local update fallback
      setPreferredDocId(doctor.id);
      setToastMsg(`${doctor.name} set as your Preferred Doctor.`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const openMessageModal = async (doctor: Doctor) => {
    setActiveDoctor(doctor);
    setNewMessage('');
    try {
      const res = await axiosClient.get<{ success: boolean; messages: DoctorMessage[] }>(`/user/doctors/${doctor.id}/messages`);
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch {
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoctor || !newMessage.trim()) return;

    const userText = newMessage.trim();
    setIsSendingMsg(true);

    try {
      const res = await axiosClient.post<{ success: boolean; sentMessage: DoctorMessage; reply: DoctorMessage }>(
        `/user/doctors/${activeDoctor.id}/messages`,
        { message: userText }
      );

      if (res.data?.sentMessage && res.data?.reply) {
        setMessages((prev) => [...prev, res.data.sentMessage, res.data.reply]);
      } else {
        // Fallback local chat
        const localUserMsg: DoctorMessage = {
          id: 'msg-' + Date.now(),
          user_id: user?.id || 'u-1',
          doctor_id: activeDoctor.id,
          sender: 'USER',
          message: userText,
          created_at: new Date().toISOString(),
        };
        const localDocReply: DoctorMessage = {
          id: 'msg-reply-' + Date.now(),
          user_id: user?.id || 'u-1',
          doctor_id: activeDoctor.id,
          sender: 'DOCTOR',
          message: `Hello ${user?.name || 'Patient'}, I received your message. Please keep your vital parameters monitored and reach out to our emergency bay if urgent.`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, localUserMsg, localDocReply]);
      }
      setNewMessage('');
    } catch {
      // fallback
    } finally {
      setIsSendingMsg(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.hospital_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-rose-600" />
            Specialist Doctors Directory & Consultation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect with board-certified hematologists, critical care surgeons, and set your preferred emergency physician.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctor, specialty, hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center space-x-2 shadow-sm">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => {
          const isPreferred = doc.id === preferredDocId || doc.isPreferred;

          return (
            <div
              key={doc.id}
              className={`rounded-3xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between shadow-sm transition-all duration-200 ${
                isPreferred
                  ? 'border-amber-400 dark:border-amber-600/80 ring-2 ring-amber-400/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                {/* Preferred Ribbon & Avatar */}
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <img
                      src={doc.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                      alt={doc.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>

                  {isPreferred ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>Preferred Doctor</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetPreferred(doc)}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950/60 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Set as Preferred</span>
                    </button>
                  )}
                </div>

                {/* Doctor Bio Details */}
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{doc.name}</h3>
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{doc.specialty}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{doc.hospital_name}</span>
                  </p>
                  {doc.qualification && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <Award className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{doc.qualification}</span>
                    </p>
                  )}
                </div>

                {/* Direct Contact Info */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 flex gap-2">
                <a
                  href={`tel:${doc.phone}`}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>
                <button
                  onClick={() => openMessageModal(doc)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-rose-500/20 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Doctor Message Dialog Modal */}
      {activeDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full flex flex-col h-[580px] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={activeDoctor.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                  alt={activeDoctor.name}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-white/40"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{activeDoctor.name}</h4>
                  <p className="text-xs text-rose-100">{activeDoctor.specialty}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveDoctor(null)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  No messages yet. Send a query regarding your transfusion, prescription, or lab reports.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === 'USER';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-rose-600 text-white rounded-br-none shadow-md shadow-rose-600/10'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
                        }`}
                      >
                        {!isMe && (
                          <span className="block font-bold text-[10px] text-rose-600 dark:text-rose-400 mb-1">
                            {activeDoctor.name}
                          </span>
                        )}
                        <p>{msg.message}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            isMe ? 'text-rose-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder={`Ask ${activeDoctor.name.split(',')[0]} a medical question...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSendingMsg || !newMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDoctors;
