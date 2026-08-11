import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initDB } from '../db/db';
import { SUPABASE_ENABLED } from '../db/supabaseClient';
import * as sdb from '../db/supabaseDb';

const DbContext = createContext();

export function DbProvider({ children }) {

  // ── Bootstrap localStorage seed data (only used in offline mode) ──────────
  useEffect(() => {
    if (!SUPABASE_ENABLED) initDB();
  }, []);

  // ── Session state ─────────────────────────────────────────────────────────
  const [activeRole, setActiveRole] = useState(() => {
    try {
      if (localStorage.getItem('airbnb_active_admin')) return 'admin';
      if (localStorage.getItem('airbnb_active_user')) return 'guest';
    } catch (e) {
      return 'guest';
    }
    return 'guest';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('airbnb_active_user') || 'null'); } catch { return null; }
  });
  const [currentAdmin, setCurrentAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('airbnb_active_admin') || 'null'); } catch { return null; }
  });

  // ── Table states ──────────────────────────────────────────────────────────
  const [properties,     setProperties]     = useState([]);
  const [propertyUnits,  setPropertyUnits]  = useState([]);
  const [propertyImages, setPropertyImages] = useState([]);
  const [bookings,       setBookings]       = useState([]);
  const [payments,       setPayments]       = useState([]);
  const [reviews,        setReviews]        = useState([]);
  const [amenities,      setAmenities]      = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [activityLogs,   setActivityLogs]   = useState([]);
  const [settings,       setSettings]       = useState({});
  const [loading,        setLoading]        = useState(true);

  // ── Load all data from Supabase / localStorage ───────────────────────────
  const loadAllData = useCallback(async () => {
    const results = await Promise.allSettled([
      sdb.fetchProperties(),
      sdb.fetchPropertyUnits(),
      sdb.fetchPropertyImages(),
      sdb.fetchBookings(),
      sdb.fetchPayments(),
      sdb.fetchReviews(),
      sdb.fetchAmenities(),
      sdb.fetchNotifications(),
      sdb.fetchActivityLogs(),
      sdb.fetchSettings(),
    ]);

    const [
      propsResult,
      unitsResult,
      imgsResult,
      bookingsResult,
      paymentsResult,
      reviewsResult,
      amenitiesResult,
      notifsResult,
      logsResult,
      settingsResult,
    ] = results;

    setProperties(propsResult.status === 'fulfilled'     ? (propsResult.value     || []) : []);
    setPropertyUnits(unitsResult.status === 'fulfilled'   ? (unitsResult.value     || []) : []);
    setPropertyImages(imgsResult.status === 'fulfilled'   ? (imgsResult.value     || []) : []);
    setBookings(bookingsResult.status === 'fulfilled'     ? (bookingsResult.value || []) : []);
    setPayments(paymentsResult.status === 'fulfilled'     ? (paymentsResult.value || []) : []);
    setReviews(reviewsResult.status === 'fulfilled'       ? (reviewsResult.value  || []) : []);
    setAmenities(amenitiesResult.status === 'fulfilled'   ? (amenitiesResult.value || []) : []);
    setNotifications(notifsResult.status === 'fulfilled'  ? (notifsResult.value   || []) : []);
    setActivityLogs(logsResult.status === 'fulfilled'     ? (logsResult.value     || []) : []);
    setSettings(settingsResult.status === 'fulfilled'     ? (settingsResult.value     || {}) : {});

    console.log('[DbContext] loadAllData complete. Props count:', propsResult.status === 'fulfilled' ? propsResult.value?.length : 'ERROR', 'Active role:', activeRole);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const names = ['properties', 'units', 'images', 'bookings', 'payments', 'reviews', 'amenities', 'notifications', 'logs', 'settings'];
        console.error(`[DbContext] Failed to load ${names[index]}:`, result.reason?.message || result.reason);
      }
    });

    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => { loadAllData(); }, [loadAllData]);

  // Re-sync when localStorage DB changes (offline mode)
  useEffect(() => {
    if (SUPABASE_ENABLED) return; // Supabase handles sync differently
    const handler = () => loadAllData();
    window.addEventListener('airbnb_db_update', handler);
    return () => window.removeEventListener('airbnb_db_update', handler);
  }, [loadAllData]);

  // ── Auth functions ────────────────────────────────────────────────────────

  const registerUser = async (name, email, password, phone) => {
    const newUser = await sdb.registerUserDb(name, email, password, phone);
    setCurrentUser(newUser);
    localStorage.setItem('airbnb_active_user', JSON.stringify(newUser));
    setActiveRole('guest');
    return newUser;
  };

  const registerAdmin = async (name, email, password, role) => {
    const newAdmin = await sdb.registerAdminDb({ name, email, password, role });
    setCurrentAdmin(newAdmin);
    localStorage.setItem('airbnb_active_admin', JSON.stringify(newAdmin));
    setActiveRole('admin');
    await sdb.insertActivityLogDb(newAdmin.id, 'Admin Registered', `New admin account created for "${name}".`);
    await loadAllData();
    return newAdmin;
  };

  const loginUser = async (email, password) => {
    const user = await sdb.loginUserDb(email, password);
    setCurrentUser(user);
    localStorage.setItem('airbnb_active_user', JSON.stringify(user));
    setActiveRole('guest');
    await loadAllData();
    return user;
  };

  const loginAdmin = async (email, password) => {
    const admin = await sdb.loginAdminDb(email, password);
    setCurrentAdmin(admin);
    localStorage.setItem('airbnb_active_admin', JSON.stringify(admin));
    setActiveRole('admin');
    await sdb.insertActivityLogDb(admin.id, 'Admin Logged In', `${admin.name} (${admin.role}) entered the system.`);
    await loadAllData();
    return admin;
  };

  const loginUnified = async (email, password) => {
    try {
      const admin = await sdb.loginAdminDb(email, password);
      if (admin) {
        setCurrentAdmin(admin);
        localStorage.setItem('airbnb_active_admin', JSON.stringify(admin));
        setActiveRole('admin');
        await sdb.insertActivityLogDb(admin.id, 'Admin Logged In', `${admin.name} (${admin.role}) entered the system.`);
        await loadAllData();
        return { role: 'admin', data: admin };
      }
    } catch (err) {
      // Admin lookup failed, fallback to guest user login
    }

    try {
      const user = await sdb.loginUserDb(email, password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('airbnb_active_user', JSON.stringify(user));
        setActiveRole('guest');
        await loadAllData();
        return { role: 'guest', data: user };
      }
    } catch (err) {
      // Guest lookup failed
    }

    throw new Error('Invalid email or password.');
  };

  const logout = async () => {
    if (activeRole === 'admin' && currentAdmin) {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Admin Logged Out', `${currentAdmin.name} exited.`);
      setCurrentAdmin(null);
      localStorage.removeItem('airbnb_active_admin');
    } else {
      setCurrentUser(null);
      localStorage.removeItem('airbnb_active_user');
    }
    setActiveRole('guest');
    await loadAllData();
  };

  const changeAdminPassword = async (oldPassword, newPassword) => {
    if (!currentAdmin) throw new Error('Not logged in as administrator.');
    await sdb.changeAdminPasswordDb(currentAdmin.id, oldPassword, newPassword);
    try {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Changed Password', `${currentAdmin.name} changed security credentials.`);
    } catch (logErr) {
      console.error('[DbContext] Activity log failed:', logErr.message);
    }
    const updated = { ...currentAdmin, password: newPassword };
    setCurrentAdmin(updated);
    localStorage.setItem('airbnb_active_admin', JSON.stringify(updated));
    await loadAllData();
  };

  // ── Property management ───────────────────────────────────────────────────

  const addProperty = async (propData, coverUrl, secondaryUrls = []) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    const prop = await sdb.insertPropertyDb(propData, coverUrl, secondaryUrls);
    try {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Added Property', `Created property "${prop.title || propData.title}".`);
    } catch (logErr) {
      console.error('[DbContext] Activity log failed:', logErr.message);
    }
    await loadAllData();
    return prop;
  };

  const updateProperty = async (id, propData, coverUrl, secondaryUrls = []) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    await sdb.updatePropertyDb(id, propData, coverUrl, secondaryUrls);
    try {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Updated Property', `Modified property "${propData.title}" ID: ${id}`);
    } catch (logErr) {
      console.error('[DbContext] Activity log failed:', logErr.message);
    }
    await loadAllData();
  };

  const deleteProperty = async (id) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    await sdb.archivePropertyDb(id);
    try {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Archived Property', `Archived property ID: ${id}`);
    } catch (logErr) {
      console.error('[DbContext] Activity log failed:', logErr.message);
    }
    await loadAllData();
  };

  // ── Unit management ───────────────────────────────────────────────────────

  const addPropertyUnit = async (unitData) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    const unit = await sdb.insertPropertyUnitDb(unitData);
    try {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Added Unit', `Created unit "${unit.unitName || unitData.unitName}" for property ID: ${unitData.propertyId}.`);
    } catch (logErr) {
      console.error('[DbContext] Activity log failed:', logErr.message);
    }
    await loadAllData();
    return unit;
  };

  const updatePropertyUnit = async (id, unitData) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    await sdb.updatePropertyUnitDb(id, unitData);
    try {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Updated Unit', `Modified unit "${unitData.unitName}" ID: ${id}`);
    } catch (logErr) {
      console.error('[DbContext] Activity log failed:', logErr.message);
    }
    await loadAllData();
  };

  const deletePropertyUnit = async (id) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    await sdb.deletePropertyUnitDb(id);
    try {
      await sdb.insertActivityLogDb(currentAdmin.id, 'Deleted Unit', `Deleted unit ID: ${id}`);
    } catch (logErr) {
      console.error('[DbContext] Activity log failed:', logErr.message);
    }
    await loadAllData();
  };

  // ── Pricing calculator (pure client-side) ─────────────────────────────────

  const calculateBookingDetails = (propertyId, unitId, checkInStr, checkOutStr, guestsCount) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return null;

    const unit = propertyUnits.find(u => u.id === unitId);
    const basePrice = unit ? unit.pricePerNight : property.pricePerNight;

    const checkIn  = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);
    const nights   = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24)));

    let totalOriginalPrice = 0;
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkIn);
      d.setDate(checkIn.getDate() + i);
      const month = d.getMonth() + 1;
      const seasonalRule = (property.seasonalPricing || []).find(r => Number(r.month) === month);
      const multiplier   = seasonalRule ? Number(seasonalRule.priceMultiplier || seasonalRule.multiplier || 1) : 1;
      totalOriginalPrice += Math.round(basePrice * multiplier);
    }

    let discountPercent = 0;
    if (property.discounts && property.discounts.length > 0) {
      const sorted = [...property.discounts].sort((a, b) => b.minDays - a.minDays);
      const match  = sorted.find(d => nights >= d.minDays);
      if (match) discountPercent = match.percentage;
    }

    const discountAmount = Math.round(totalOriginalPrice * (discountPercent / 100));
    const taxable        = totalOriginalPrice - discountAmount;
    const cleanTax       = Math.round(taxable * 0.08);
    const serviceFee     = Math.round(taxable * 0.05);
    const totalPrice     = taxable + cleanTax + serviceFee;

    return { nights, subtotal: totalOriginalPrice, discountPercent, discountAmount, tax: cleanTax, serviceFee, totalPrice };
  };

  // ── Booking flow ──────────────────────────────────────────────────────────

  const createBooking = async (propertyId, unitId, checkIn, checkOut, guestsCount, paymentMethod) => {
    if (!currentUser) throw new Error('Please login to reserve a property.');

    const hasOverlap = await sdb.checkDoubleBookingDb(propertyId, unitId, checkIn, checkOut);
    if (hasOverlap) throw new Error('This option is already booked for the selected dates. Please choose other dates or options.');

    const details = calculateBookingDetails(propertyId, unitId, checkIn, checkOut, guestsCount);
    if (!details) throw new Error('Failed to compute pricing.');

    const booking = await sdb.insertBookingDb({
      propertyId,
      unitId,
      userId: currentUser.id,
      checkIn,
      checkOut,
      totalPrice: details.totalPrice,
      totalAmount: details.totalPrice,
      guestsCount: Number(guestsCount),
      status: 'pending_payment',
      paymentStatus: 'pending',
      bookingStatus: 'pending_payment'
    });

    const payment = await sdb.insertPaymentDb({
      bookingId: booking.id,
      userId: currentUser.id,
      amount: details.totalPrice,
      paymentMethod
    });

    const propTitle = properties.find(p => p.id === propertyId)?.title || 'Property';
    const unitName = propertyUnits.find(u => u.id === unitId)?.unitName || 'Unit';
    
    await sdb.insertNotificationDb({
      userId: 'a1',
      message: `New booking received from ${currentUser.name} for "${propTitle} - ${unitName}". Amount: ₱${details.totalPrice}`,
      type: 'info'
    });

    await loadAllData();
    return { booking, payment, pricing: details };
  };

  const cancelBooking = async (bookingId, roleContext) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');

    await sdb.updateBookingStatusDb(bookingId, 'cancelled');
    const payment = payments.find(p => p.bookingId === bookingId);
    if (payment) await sdb.updatePaymentStatusDb(payment.id, 'refunded');

    const prop = properties.find(p => p.id === booking.propertyId);
    if (roleContext === 'admin') {
      await sdb.insertNotificationDb({ userId: booking.userId, message: `Your booking for "${prop?.title}" was cancelled by the Host. A refund has been issued.`, type: 'warning' });
      if (currentAdmin) await sdb.insertActivityLogDb(currentAdmin.id, 'Cancelled Booking', `Admin cancelled booking ${bookingId}`);
    } else {
      await sdb.insertNotificationDb({ userId: 'a1', message: `Booking ${bookingId} was cancelled by the Guest.`, type: 'warning' });
      await sdb.insertNotificationDb({ userId: booking.userId, message: `You cancelled your reservation for "${prop?.title}". Refund processed.`, type: 'success' });
    }
    await loadAllData();
  };

  const updateBookingStatus = async (bookingId, status) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');

    await sdb.updateBookingStatusDb(bookingId, status);

    // Auto-verify payment when approving
    if (status === 'approved') {
      const payment = payments.find(p => p.bookingId === bookingId);
      if (payment && payment.status === 'pending') await sdb.updatePaymentStatusDb(payment.id, 'verified');
    }

    const prop = properties.find(p => p.id === booking.propertyId);
    await sdb.insertNotificationDb({
      userId: booking.userId,
      message: `Your booking for "${prop?.title}" has been ${status.toUpperCase()} by the administrator.`,
      type:    status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info',
    });
    await sdb.insertActivityLogDb(currentAdmin.id, 'Update Booking Status', `Set booking ${bookingId} to ${status}`);
    await loadAllData();
  };

  // ── Payment management ────────────────────────────────────────────────────

  const verifyPayment = async (paymentId) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment not found.');

    await sdb.updatePaymentStatusDb(paymentId, 'paid');
    await sdb.updateBookingStatusDb(payment.bookingId, 'confirmed');

    const booking = bookings.find(b => b.id === payment.bookingId);
    if (booking) {
      const prop = properties.find(p => p.id === booking.propertyId);
      await sdb.insertNotificationDb({ userId: booking.userId, message: `Payment verified for "${prop?.title}". Booking confirmed!`, type: 'success' });
    }
    await sdb.insertActivityLogDb(currentAdmin.id, 'Verify Payment', `Verified payment ID: ${paymentId}`);
    await loadAllData();
  };

  const refundPayment = async (paymentId, amount) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment not found.');

    const status = amount && amount < payment.amount ? 'partially_refunded' : 'refunded';
    await sdb.updatePaymentStatusDb(paymentId, status);
    await sdb.updateBookingStatusDb(payment.bookingId, status === 'refunded' ? 'cancelled' : 'confirmed');

    const booking = bookings.find(b => b.id === payment.bookingId);
    if (booking) {
      await sdb.insertNotificationDb({ userId: booking.userId, message: `Your payment of ₱${payment.amount} has been ${status === 'refunded' ? 'refunded' : 'partially refunded'}.`, type: 'warning' });
    }
    await sdb.insertActivityLogDb(currentAdmin.id, 'Refund Payment', `Refunded payment ID: ${paymentId}`);
    await loadAllData();
  };

  const getPaymentDashboard = async () => {
    if (!SUPABASE_ENABLED) {
      const paidPayments = payments.filter(p => p.paymentStatus === 'paid');
      return {
        totalRevenue: paidPayments.reduce((sum, p) => sum + p.amount, 0),
        dailyRevenue: paidPayments.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).reduce((sum, p) => sum + p.amount, 0),
        monthlyRevenue: paidPayments.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0),
        pendingPayments: payments.filter(p => p.paymentStatus === 'pending').length,
        refundedPayments: payments.filter(p => ['refunded', 'partially_refunded'].includes(p.paymentStatus)).length,
        refundedAmount: payments.filter(p => ['refunded', 'partially_refunded'].includes(p.paymentStatus)).reduce((sum, p) => sum + p.amount, 0)
      };
    }
    const { data, error } = await supabase.rpc('get_payment_dashboard');
    if (error) throw error;
    return data;
  };

  const getReceiptPdf = async (paymentId) => {
    if (!SUPABASE_ENABLED) {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found.');
      return {
        filename: `receipt-${paymentId}.pdf`,
        content: `Receipt for Booking ${payment.bookingId}\nAmount: ₱${payment.amount}\nMethod: ${payment.paymentMethod || payment.method}`
      };
    }
    const { data, error } = await supabase.from('payment_receipts').select('*').eq('payment_id', paymentId).single();
    if (error) throw error;
    return data;
  };

  // ── Reviews ───────────────────────────────────────────────────────────────

  const addReview = async (propertyId, rating, comment) => {
    if (!currentUser) throw new Error('You must be logged in to leave reviews.');
    const review = await sdb.insertReviewDb({ propertyId, userId: currentUser.id, rating: Number(rating), comment });
    const propTitle = properties.find(p => p.id === propertyId)?.title || 'Property';
    await sdb.insertNotificationDb({ userId: 'a1', message: `New ${rating}-star review for "${propTitle}" by ${currentUser.name}`, type: 'info' });
    await loadAllData();
    return review;
  };

  const replyToReview = async (reviewId, responseText) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    await sdb.updateReviewResponseDb(reviewId, responseText);
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      await sdb.insertNotificationDb({ userId: review.userId, message: `The host replied to your review.`, type: 'info' });
    }
    await sdb.insertActivityLogDb(currentAdmin.id, 'Moderated Review', `Replied to review ID: ${reviewId}`);
    await loadAllData();
  };

  // ── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = async (newSettings) => {
    if (!currentAdmin) throw new Error('Unauthorized.');
    await sdb.updateSettingsDb(newSettings);
    await sdb.insertActivityLogDb(currentAdmin.id, 'Update System Settings', 'Modified homepage branding or settings.');
    await loadAllData();
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  const markNotificationsRead = async () => {
    const myId = activeRole === 'admin' ? 'a1' : currentUser?.id;
    if (!myId) return;
    await sdb.markNotificationsReadDb(myId);
    await loadAllData();
  };

  const clearNotifications = async () => {
    const myId = activeRole === 'admin' ? 'a1' : currentUser?.id;
    if (!myId) return;
    await sdb.clearNotificationsDb(myId);
    await loadAllData();
  };

  return (
    <DbContext.Provider value={{
      // Meta
      activeRole, setActiveRole, loading, supabaseEnabled: SUPABASE_ENABLED, loadAllData,
      // Session
      currentUser, currentAdmin,
      // Tables
      properties, propertyUnits, propertyImages, bookings, payments, reviews,
      amenities, notifications, activityLogs, settings,
      // Auth
      registerUser, registerAdmin, loginUser, loginAdmin, loginUnified, logout, changeAdminPassword,
      // Properties
      addProperty, updateProperty, deleteProperty,
      // Units
      addPropertyUnit, updatePropertyUnit, deletePropertyUnit,
      // Bookings
      calculateBookingDetails, createBooking, cancelBooking, updateBookingStatus,
      // Payments
      verifyPayment, refundPayment, getPaymentDashboard, getReceiptPdf,
      // Reviews
      addReview, replyToReview,
      // Settings
      updateSettings,
      // Notifications
      markNotificationsRead, clearNotifications,
    }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  return useContext(DbContext);
}
