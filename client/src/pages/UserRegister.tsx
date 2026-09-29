import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  Activity,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle2,
  Droplet,
  ShieldCheck,
  Scale,
  Ruler,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { calculateBMI } from '../types/index.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const UserRegister: React.FC = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: 'Male',
    weightKg: '',
    heightCm: '',
    bloodGroup: 'O+',
    city: '',
    address: '',
    emergencyContact: '',
    conditions: '',
    allergies: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const numWeight = formData.weightKg ? Number(formData.weightKg) : null;
  const numHeight = formData.heightCm ? Number(formData.heightCm) : null;
  const bmiData = calculateBMI(numWeight, numHeight);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long for account security.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.bloodGroup) {
      setError('Please select your verified blood group.');
      return;
    }

    if (numWeight !== null && (numWeight < 30 || numWeight > 300)) {
      setError('Weight must be between 30 kg and 300 kg.');
      return;
    }

    if (numHeight !== null && (numHeight < 50 || numHeight > 250)) {
      setError('Height must be between 50 cm and 250 cm.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        dob: formData.dob || undefined,
        gender: formData.gender,
        weightKg: numWeight || undefined,
        heightCm: numHeight || undefined,
        bloodGroup: formData.bloodGroup,
        city: formData.city.trim() || undefined,
        address: formData.address.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        conditions: formData.conditions.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
      });

      setSuccess('Account and clinical health profile created successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/user/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3 border border-rose-500/20">
            <Droplet className="w-8 h-8 fill-rose-600 text-rose-600 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Patient Registration Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Create your patient profile to order blood, upload pathology reports for AI analysis, and connect with specialist doctors.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 flex items-center space-x-3 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center space-x-3 text-emerald-700 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Account Credentials */}
            <div>
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <User className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Account Credentials</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Rohit Deshmukh"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rohit@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91-98201-99887"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password (Min 8 characters) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Vitals & BMI Calculator */}
            <div>
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Activity className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Physiological Vitals & BMI</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group *
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg) [30-300]
                  </label>
                  <div className="relative">
                    <Scale className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="number"
                      name="weightKg"
                      min={30}
                      max={300}
                      step="0.1"
                      value={formData.weightKg}
                      onChange={handleChange}
                      placeholder="e.g. 70"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Height (cm) [50-250]
                  </label>
                  <div className="relative">
                    <Ruler className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="number"
                      name="heightCm"
                      min={50}
                      max={250}
                      value={formData.heightCm}
                      onChange={handleChange}
                      placeholder="e.g. 175"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Live BMI Indicator Widget */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Auto-Computed Body Mass Index (BMI)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Calculated automatically from weight and height measurements
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {bmiData.bmi !== null ? (
                    <>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{bmiData.bmi}</span>
                        <span className="text-xs text-slate-400 ml-1">kg/m²</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${bmiData.color}`}
                      >
                        {bmiData.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Enter weight & height to preview BMI</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Medical Background & Emergency Contact */}
            <div>
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Heart className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  3. Clinical Background & Emergency Contacts
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      placeholder="e.g. +91-98201-11223 (Spouse)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai, New Delhi, Bengaluru"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, locality, pin code"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pre-existing Medical Conditions
                  </label>
                  <textarea
                    name="conditions"
                    rows={2}
                    value={formData.conditions}
                    onChange={handleChange}
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma (or 'None')"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Known Drug or Food Allergies
                  </label>
                  <textarea
                    name="allergies"
                    rows={2}
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="e.g. Penicillin, Sulfa drugs, Peanuts (or 'None')"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-base shadow-lg shadow-rose-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FileCheck2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Creating Patient Profile...' : 'Complete Registration & Open Dashboard'}</span>
              </button>
            </div>
          </form>

          {/* Switch to login */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
              Sign In to Patient Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
